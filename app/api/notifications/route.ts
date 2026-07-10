import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// 교사 알림 목록 조회
export async function GET() {
  try {
    const db = getDb();

    const notifications = db.prepare(`
      SELECT
        n.id,
        n.complaint_id,
        n.type,
        n.summary,
        n.query,
        n.is_read,
        n.created_at,
        c.teacher_response,
        c.status,
        CASE WHEN n.type IN ('urgent', 'violence') THEN c.content ELSE null END AS content
      FROM teacher_notifications n
      LEFT JOIN complaints c ON n.complaint_id = c.id
      ORDER BY n.created_at DESC
      LIMIT 50
    `).all();

    const unreadCount = (db.prepare(`
      SELECT COUNT(*) as cnt FROM teacher_notifications WHERE is_read = 0
    `).get() as { cnt: number }).cnt;

    return NextResponse.json({ notifications, unreadCount });
  } catch (err) {
    console.error('알림 조회 오류:', err);
    return NextResponse.json({ error: '조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
