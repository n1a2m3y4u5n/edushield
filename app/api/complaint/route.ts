import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import {
  cooldownResponse,
  classifyComplaint,
  generateNeisAnswer,
  translateText,
} from '@/lib/claude';
import { getMealInfo, getSchoolSchedule, getTimetable, getSchoolInfo } from '@/lib/neis';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action = 'classify', content, language = 'ko' } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: '내용을 입력해주세요.' }, { status: 400 });
    }

    /* ── 쿨다운 챔버 처리 ──────────────────────── */
    if (action === 'cooldown') {
      const result = await cooldownResponse(content);
      return NextResponse.json(result);
    }

    /* ── 민원 분류 처리 ────────────────────────── */
    // 한국어 외 언어는 번역 후 처리
    let processedContent = content;
    let translatedContent: string | null = null;

    if (language !== 'ko') {
      translatedContent = await translateText(content, 'ko');
      processedContent = translatedContent;
    }

    const classification = await classifyComplaint(processedContent);

    // A타입 + NEIS 조회 필요 시
    let neisDataStr: string | null = null;
    let neisSource: string | null = null;
    let finalResponse = classification.response;

    if (classification.type === 'A' && classification.needs_neis) {
      switch (classification.neis_type) {
        case 'meal': {
          const r = await getMealInfo();
          neisDataStr = typeof r.data === 'string' ? r.data : JSON.stringify(r.data);
          neisSource = r.source;
          finalResponse = await generateNeisAnswer(processedContent, neisDataStr, '급식 메뉴');
          break;
        }
        case 'schedule': {
          const r = await getSchoolSchedule();
          const list = Array.isArray(r.data)
            ? r.data.map((s) => `${s.date}: ${s.event}`).join(', ')
            : String(r.data);
          neisDataStr = list;
          neisSource = r.source;
          finalResponse = await generateNeisAnswer(processedContent, list, '학사일정');
          break;
        }
        case 'timetable': {
          const r = await getTimetable();
          const list = Array.isArray(r.data)
            ? r.data.map((t) => `${t.period}교시 ${t.subject}`).join(', ')
            : String(r.data);
          neisDataStr = list;
          neisSource = r.source;
          finalResponse = await generateNeisAnswer(processedContent, list, '시간표');
          break;
        }
        case 'school_info': {
          const r = await getSchoolInfo('서울초등학교');
          const info = r.data as Record<string, string>;
          neisDataStr = `학교명: ${info.name}, 주소: ${info.address}, 전화: ${info.phone}`;
          neisSource = r.source;
          finalResponse = await generateNeisAnswer(processedContent, neisDataStr, '학교 기본정보');
          break;
        }
      }
    }

    // 원래 언어로 역번역
    let localizedResponse = finalResponse;
    if (language !== 'ko' && finalResponse) {
      localizedResponse = await translateText(finalResponse, language);
    }

    // 상태 결정
    const status =
      classification.type === 'C' ? 'blocked' :
      classification.type === 'D' ? 'escalated' :
      classification.type === 'A' ? 'resolved' :
      'pending';

    // DB 저장
    const db = getDb();
    const insertResult = db.prepare(`
      INSERT INTO complaints
        (content, language, translated_content, type, reason, response,
         emotion, emotion_score, is_violence_risk, teacher_query, neis_data, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      content, language, translatedContent,
      classification.type, classification.reason, localizedResponse,
      classification.emotion, classification.emotion_score,
      classification.is_violence_risk ? 1 : 0,
      classification.teacher_query,
      neisDataStr,
      status,
    );

    const complaintId = insertResult.lastInsertRowid as number;

    // B타입: 교사 정보 요청 알림
    if (classification.type === 'B' && classification.teacher_query) {
      db.prepare(`
        INSERT INTO teacher_notifications (complaint_id, type, summary, query)
        VALUES (?, ?, ?, ?)
      `).run(complaintId, 'info_request', `학부모 문의 확인 요청`, classification.teacher_query);
    }

    // D타입: 교사 긴급 알림
    if (classification.type === 'D') {
      db.prepare(`
        INSERT INTO teacher_notifications (complaint_id, type, summary)
        VALUES (?, ?, ?)
      `).run(complaintId, 'urgent', `[긴급] ${classification.reason}`);
    }

    // 학폭 위험: 별도 알림
    if (classification.is_violence_risk) {
      db.prepare(`
        INSERT INTO teacher_notifications (complaint_id, type, summary)
        VALUES (?, ?, ?)
      `).run(complaintId, 'violence', `[학폭경보] ${classification.reason}`);
    }

    // C타입: 동일 학부모 반복 패턴 감지 (3회 이상)
    if (classification.type === 'C') {
      const blockedCount = (db.prepare(`
        SELECT COUNT(*) as n FROM complaints WHERE status='blocked' AND date(created_at)=date('now')
      `).get() as { n: number }).n;

      if (blockedCount >= 3) {
        db.prepare(`
          INSERT INTO preemptive_alerts (trigger_type, message)
          VALUES (?, ?)
        `).run('pattern', `오늘 악성 민원 ${blockedCount}건 차단 — 반복 패턴 감지`);
      }
    }

    return NextResponse.json({
      id:              complaintId,
      type:            classification.type,
      response:        localizedResponse,
      emotion:         classification.emotion,
      emotion_score:   classification.emotion_score,
      is_violence_risk: classification.is_violence_risk,
      neis_source:     neisSource,
      status,
    });

  } catch (err) {
    console.error('민원 처리 오류:', err);
    return NextResponse.json({ error: '처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const db = getDb();
    const complaints = db.prepare(
      `SELECT * FROM complaints ORDER BY created_at DESC LIMIT 100`
    ).all();
    return NextResponse.json({ complaints });
  } catch (err) {
    console.error('민원 조회 오류:', err);
    return NextResponse.json({ error: '조회 실패' }, { status: 500 });
  }
}
