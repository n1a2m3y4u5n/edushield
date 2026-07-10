import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// 교사 알림 읽음 처리
export async function POST(req: NextRequest) {
  const { id } = await req.json();
  const db = getDb();

  if (id === 'all') {
    db.prepare('UPDATE teacher_notifications SET is_read = 1').run();
  } else {
    db.prepare('UPDATE teacher_notifications SET is_read = 1 WHERE id = ?').run(id);
  }

  return NextResponse.json({ ok: true });
}
