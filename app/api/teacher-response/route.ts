import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { generateParentResponse } from '@/lib/claude';

// B타입 교사 정보 입력 → 학부모 답변 자동 생성
export async function POST(req: NextRequest) {
  try {
    const { complaintId, teacherResponse } = await req.json();

    if (!complaintId || !teacherResponse?.trim()) {
      return NextResponse.json({ error: '민원 ID와 교사 응답이 필요합니다.' }, { status: 400 });
    }

    const db = getDb();

    const complaint = db.prepare(
      `SELECT * FROM complaints WHERE id = ?`
    ).get(complaintId) as {
      id: number;
      content: string;
      language: string;
      teacher_query: string | null;
    } | undefined;

    if (!complaint) {
      return NextResponse.json({ error: '민원을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 학부모 답변 생성 — 교사는 원문을 모름
    const parentResponse = await generateParentResponse(
      complaint.teacher_query || complaint.content,
      teacherResponse,
      complaint.language,
    );

    db.prepare(`
      UPDATE complaints
      SET teacher_response = ?, response = ?, status = 'resolved'
      WHERE id = ?
    `).run(teacherResponse, parentResponse, complaintId);

    db.prepare(`
      UPDATE teacher_notifications SET is_read = 1 WHERE complaint_id = ?
    `).run(complaintId);

    return NextResponse.json({ success: true, parentResponse });

  } catch (err) {
    console.error('교사 응답 처리 오류:', err);
    return NextResponse.json({ error: '처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
