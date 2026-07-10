import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { analyzeStudentReport } from '@/lib/claude';

// 학생 익명 자기보고 처리
export async function POST(req: NextRequest) {
  try {
    const { content, category } = await req.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: '내용을 입력해주세요.' }, { status: 400 });
    }

    const analysis = await analyzeStudentReport(content);

    const db = getDb();
    const result = db.prepare(`
      INSERT INTO student_reports (content, category, urgency, ai_summary, status)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      content,
      category || analysis.category,
      analysis.urgency,
      analysis.ai_summary,
      'pending',
    );

    // 긴급/학폭 위험 시 교사 즉시 알림
    if (analysis.urgency === '긴급' || analysis.is_violence_risk) {
      db.prepare(`
        INSERT INTO teacher_notifications (complaint_id, type, summary)
        VALUES (?, ?, ?)
      `).run(
        null,
        analysis.is_violence_risk ? 'violence' : 'urgent',
        `[학생신고] ${analysis.ai_summary}`,
      );
    }

    return NextResponse.json({
      id:       result.lastInsertRowid,
      urgency:  analysis.urgency,
      category: analysis.category,
      is_crisis: analysis.is_crisis,
      is_violence_risk: analysis.is_violence_risk,
    });

  } catch (err) {
    console.error('학생 보고 처리 오류:', err);
    return NextResponse.json({ error: '처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
