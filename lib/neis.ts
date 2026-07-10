// NEIS 교육정보 개방포털 API 클라이언트

const NEIS_BASE_URL = 'https://open.neis.go.kr/hub';
const API_KEY = process.env.NEIS_API_KEY;

// Mock 데이터 (API 키 없을 때 폴백)
const MOCK_MEAL = {
  data: '쌀밥, 된장찌개, 제육볶음, 깍두기, 우유',
  source: '[데모 데이터]',
};

const MOCK_SCHEDULE = {
  data: [
    { date: '5/12~5/14', event: '중간고사' },
    { date: '5/28', event: '체험학습' },
    { date: '6/6', event: '현충일 (휴교)' },
    { date: '7/18', event: '여름방학 시작' },
  ],
  source: '[데모 데이터]',
};

const MOCK_TIMETABLE = {
  data: [
    { period: 1, subject: '국어' },
    { period: 2, subject: '수학' },
    { period: 3, subject: '영어' },
    { period: 4, subject: '과학' },
    { period: 5, subject: '체육' },
    { period: 6, subject: '미술' },
  ],
  source: '[데모 데이터]',
};

const MOCK_SCHOOL_INFO = {
  data: {
    name: '서울초등학교',
    address: '서울특별시 종로구',
    phone: '02-1234-5678',
    principal: '김교장',
  },
  source: '[데모 데이터]',
};

// 급식 식단 조회
export async function getMealInfo(
  schoolCode: string = 'B10',
  date: string = new Date().toISOString().slice(0, 10).replace(/-/g, '')
): Promise<{ data: string; source: string }> {
  if (!API_KEY) return MOCK_MEAL;

  try {
    const url = `${NEIS_BASE_URL}/mealServiceDietInfo?KEY=${API_KEY}&Type=json&ATPT_OFCDC_SC_CODE=${schoolCode}&MLSV_YMD=${date}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    const json = await res.json();

    const dishes = json?.mealServiceDietInfo?.[1]?.row?.[0]?.DDISH_NM;
    if (!dishes) return MOCK_MEAL;

    return { data: dishes.replace(/<br\/>/g, ', '), source: 'NEIS 급식정보' };
  } catch {
    return MOCK_MEAL;
  }
}

// 학사일정 조회
export async function getSchoolSchedule(
  schoolCode: string = 'B10',
  month: string = new Date().toISOString().slice(0, 7).replace('-', '')
): Promise<{ data: Array<{ date: string; event: string }>; source: string }> {
  if (!API_KEY) return MOCK_SCHEDULE;

  try {
    const url = `${NEIS_BASE_URL}/SchoolSchedule?KEY=${API_KEY}&Type=json&ATPT_OFCDC_SC_CODE=${schoolCode}&AA_YMD=${month}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    const json = await res.json();

    const rows = json?.SchoolSchedule?.[1]?.row;
    if (!rows) return MOCK_SCHEDULE;

    const data = rows.map((r: Record<string, string>) => ({
      date: r.AA_YMD,
      event: r.EVENT_NM,
    }));

    return { data, source: 'NEIS 학사일정' };
  } catch {
    return MOCK_SCHEDULE;
  }
}

// 시간표 조회
export async function getTimetable(
  schoolCode: string = 'B10',
  grade: string = '3',
  classNum: string = '2',
  date: string = new Date().toISOString().slice(0, 10).replace(/-/g, '')
): Promise<{ data: Array<{ period: number; subject: string }>; source: string }> {
  if (!API_KEY) return MOCK_TIMETABLE;

  try {
    const url = `${NEIS_BASE_URL}/elsTimetable?KEY=${API_KEY}&Type=json&ATPT_OFCDC_SC_CODE=${schoolCode}&ALL_TI_YMD=${date}&GRADE=${grade}&CLASS_NM=${classNum}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    const json = await res.json();

    const rows = json?.elsTimetable?.[1]?.row;
    if (!rows) return MOCK_TIMETABLE;

    const data = rows.map((r: Record<string, string>) => ({
      period: parseInt(r.PERIO),
      subject: r.ITRT_CNTNT,
    }));

    return { data, source: 'NEIS 시간표' };
  } catch {
    return MOCK_TIMETABLE;
  }
}

// 학교 기본정보 조회
export async function getSchoolInfo(
  schoolName: string
): Promise<{ data: Record<string, string>; source: string }> {
  if (!API_KEY) return MOCK_SCHOOL_INFO;

  try {
    const url = `${NEIS_BASE_URL}/schoolInfo?KEY=${API_KEY}&Type=json&SCHUL_NM=${encodeURIComponent(schoolName)}`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    const json = await res.json();

    const row = json?.schoolInfo?.[1]?.row?.[0];
    if (!row) return MOCK_SCHOOL_INFO;

    return {
      data: {
        name: row.SCHUL_NM,
        address: row.ORG_RDNMA,
        phone: row.ORG_TELNO,
        principal: row.FOND_SC_NM,
      },
      source: 'NEIS 학교정보',
    };
  } catch {
    return MOCK_SCHOOL_INFO;
  }
}
