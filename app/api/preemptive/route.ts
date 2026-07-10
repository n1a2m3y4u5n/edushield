import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { generatePreemptiveAlerts } from '@/lib/claude';
import { getSchoolSchedule } from '@/lib/neis';

// 선제 알림 생성 — NEIS 학사일정 기반
export async function POST() {
  try {
    // 이번 달 학사일정 조회
    const schedule = await getSchoolSchedule();
    const today = new Date();

    // 오늘로부터 3일 이내 이벤트 필터링
    const upcomingEvents = Array.isArray(schedule.data)
      ? schedule.data.filter((s) => {
          const dateStr = String(s.date).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
          const eventDate = new Date(dateStr);
          const diff = (eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
          return diff >= 0 && diff <= 3;
        }).map((s) => `${s.event} (${s.date})`)
      : [];

    if (upcomingEvents.length === 0) {
      upcomingEvents.push('기말고사 (6/16~6/18)', '방학식 (7/18)');
    }

    const messages = await generatePreemptiveAlerts(upcomingEvents);

    const db = getDb();
    const saved: { id: number | bigint; message: string }[] = [];

    for (const message of messages) {
      const r = db.prepare(`
        INSERT INTO preemptive_alerts (trigger_type, message) VALUES (?, ?)
      `).run('schedule', message);
      saved.push({ id: r.lastInsertRowid, message });
    }

    return NextResponse.json({ success: true, alerts: saved, source: schedule.source });

  } catch (err) {
    console.error('선제 알림 생성 오류:', err);
    return NextResponse.json({ error: '생성 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const db = getDb();
    const alerts = db.prepare(
      `SELECT * FROM preemptive_alerts ORDER BY created_at DESC LIMIT 20`
    ).all();
    return NextResponse.json({ alerts });
  } catch (err) {
    console.error('선제 알림 조회 오류:', err);
    return NextResponse.json({ error: '조회 실패' }, { status: 500 });
  }
}
