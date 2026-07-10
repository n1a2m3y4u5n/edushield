import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

interface TypeRow  { type: string; cnt: number }
interface EmotionRow { emotion: string; cnt: number }
interface NotifRow   { complaint_id: number; cnt: number }

export async function GET() {
  try {
    const db = getDb();
    const today = new Date().toISOString().slice(0, 10);

    // 오늘 민원 수
    const todayTotal = (db.prepare(
      `SELECT COUNT(*) as n FROM complaints WHERE date(created_at)=?`
    ).get(today) as { n: number }).n;

    // 전체 통계
    const totalAll = (db.prepare(
      `SELECT COUNT(*) as n FROM complaints`
    ).get() as { n: number }).n;

    // 타입별 건수
    const byTypeRows = db.prepare(
      `SELECT type, COUNT(*) as cnt FROM complaints GROUP BY type`
    ).all() as TypeRow[];
    const byType: Record<string, number> = {};
    byTypeRows.forEach(r => { byType[r.type] = r.cnt; });

    // 감정 분포
    const emotionRows = db.prepare(
      `SELECT emotion, COUNT(*) as cnt FROM complaints WHERE emotion IS NOT NULL GROUP BY emotion`
    ).all() as EmotionRow[];
    const emotionDistribution: Record<string, number> = {};
    emotionRows.forEach(r => { emotionDistribution[r.emotion] = r.cnt; });

    // 학폭 위험 건수
    const violenceCount = (db.prepare(
      `SELECT COUNT(*) as n FROM complaints WHERE is_violence_risk=1`
    ).get() as { n: number }).n;

    // 선제 알림 최근 5건
    const preemptiveAlerts = db.prepare(
      `SELECT * FROM preemptive_alerts ORDER BY created_at DESC LIMIT 5`
    ).all();

    // 자동해결율 (A타입)
    const autoResolved = byType['A'] ?? 0;
    const autoResolveRate = totalAll > 0 ? Math.round(autoResolved / totalAll * 100) : 0;

    // 교사별 요청 건수 → 번아웃 지수
    const teacherRows = db.prepare(`
      SELECT complaint_id, COUNT(*) as cnt FROM teacher_notifications GROUP BY complaint_id
    `).all() as NotifRow[];

    const teacherStats = db.prepare(`
      SELECT complaint_id, COUNT(*) as cnt FROM teacher_notifications GROUP BY complaint_id ORDER BY cnt DESC LIMIT 10
    `).all() as NotifRow[];

    const burnoutList = teacherStats.map((row, idx) => ({
      label: `교사${idx + 1}`,
      count: row.cnt,
      score: Math.min(row.cnt / 10, 1.0),
    }));

    // 미처리 B타입 개수
    const pendingB = (db.prepare(
      `SELECT COUNT(*) as n FROM complaints WHERE type='B' AND status='pending'`
    ).get() as { n: number }).n;

    // 차단 건수
    const blocked = (db.prepare(
      `SELECT COUNT(*) as n FROM complaints WHERE status='blocked'`
    ).get() as { n: number }).n;

    // 미읽은 알림
    const unreadNotifications = (db.prepare(
      `SELECT COUNT(*) as n FROM teacher_notifications WHERE is_read=0`
    ).get() as { n: number }).n;

    // 학생 자기보고
    const studentReports = (db.prepare(
      `SELECT COUNT(*) as n FROM student_reports`
    ).get() as { n: number }).n;

    return NextResponse.json({
      todayTotal,
      totalAll,
      byType,
      emotionDistribution,
      violenceCount,
      preemptiveAlerts,
      autoResolveRate,
      burnoutList,
      pendingB,
      blocked,
      unreadNotifications,
      studentReports,
    });

  } catch (err) {
    console.error('대시보드 데이터 오류:', err);
    return NextResponse.json({ error: '데이터 조회 실패' }, { status: 500 });
  }
}
