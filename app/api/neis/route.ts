import { NextRequest, NextResponse } from 'next/server';
import { getMealInfo, getSchoolSchedule, getTimetable, getSchoolInfo } from '@/lib/neis';

// NEIS 데이터 조회 API
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');

  try {
    switch (type) {
      case 'meal':
        return NextResponse.json(await getMealInfo());
      case 'schedule':
        return NextResponse.json(await getSchoolSchedule());
      case 'timetable':
        return NextResponse.json(await getTimetable());
      case 'school_info':
        const name = searchParams.get('name') || '서울초등학교';
        return NextResponse.json(await getSchoolInfo(name));
      default:
        return NextResponse.json({ error: '유효하지 않은 조회 유형입니다.' }, { status: 400 });
    }
  } catch (err) {
    console.error('NEIS 조회 오류:', err);
    return NextResponse.json({ error: '데이터 조회에 실패했습니다.' }, { status: 500 });
  }
}
