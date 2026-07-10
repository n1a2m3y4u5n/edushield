// EduShield 시드 데이터 스크립트
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'edushield.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── 스키마 초기화 ───────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS complaints (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    content           TEXT    NOT NULL,
    language          TEXT    DEFAULT 'ko',
    translated_content TEXT,
    type              TEXT,
    reason            TEXT,
    response          TEXT,
    emotion           TEXT,
    emotion_score     REAL,
    is_violence_risk  INTEGER DEFAULT 0,
    teacher_query     TEXT,
    teacher_response  TEXT,
    neis_data         TEXT,
    status            TEXT    DEFAULT 'pending',
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS student_reports (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    content     TEXT    NOT NULL,
    category    TEXT,
    urgency     TEXT,
    ai_summary  TEXT,
    status      TEXT    DEFAULT 'pending',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS teacher_notifications (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    complaint_id INTEGER,
    type         TEXT,
    summary      TEXT,
    query        TEXT,
    is_read      INTEGER DEFAULT 0,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS preemptive_alerts (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    trigger_type TEXT,
    message      TEXT,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// 기존 데이터 초기화
db.exec('DELETE FROM teacher_notifications');
db.exec('DELETE FROM student_reports');
db.exec('DELETE FROM preemptive_alerts');
db.exec('DELETE FROM complaints');
db.exec(`DELETE FROM sqlite_sequence WHERE name IN ('complaints','student_reports','preemptive_alerts','teacher_notifications')`);

// ── 날짜 헬퍼 ──────────────────────────────────────────────
const ts = (offsetMs) =>
  new Date(Date.now() + offsetMs).toISOString().replace('T', ' ').slice(0, 19);
const dAgo  = (d) => ts(-d * 86400 * 1000);
const hAgo  = (h) => ts(-h * 3600 * 1000);
const mAgo  = (m) => ts(-m * 60 * 1000);

// ── complaints 삽입 ────────────────────────────────────────
const cStmt = db.prepare(`
  INSERT INTO complaints
    (content, language, translated_content, type, reason, response,
     emotion, emotion_score, is_violence_risk, teacher_query, teacher_response,
     neis_data, status, created_at)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
`);

// [content, lang, translated, type, reason, response, emotion, score, violence, tq, tr, neis, status, date]
const complaints = [

  /* ───────────────── A타입 — 즉시 답변 (22건) ───────────────── */
  [
    '오늘 급식 메뉴가 뭔가요?', 'ko', null, 'A',
    '급식 메뉴 문의 — NEIS 데이터로 즉시 답변 가능',
    '오늘의 급식 메뉴입니다: 쌀밥, 된장찌개, 제육볶음, 깍두기, 우유',
    '중립', 0.10, 0, null, null, '쌀밥, 된장찌개, 제육볶음, 깍두기, 우유', 'resolved', dAgo(30),
  ],
  [
    '이번 달 학사일정을 알고 싶어요', 'ko', null, 'A',
    '학사일정 문의 — NEIS 데이터로 즉시 답변',
    '이번 달 주요 학사일정: 5/12~14 중간고사, 5/28 체험학습, 6/6 현충일(휴교)입니다.',
    '긍정', 0.20, 0, null, null, '중간고사,체험학습,현충일', 'resolved', dAgo(28),
  ],
  [
    '학교 대표 전화번호가 어떻게 되나요?', 'ko', null, 'A',
    '학교 기본정보 문의 — 즉시 답변',
    '학교 대표 전화번호는 02-1234-5678입니다. 평일 오전 9시~오후 5시 운영합니다.',
    '중립', 0.10, 0, null, null, null, 'resolved', dAgo(25),
  ],
  [
    'What is the school lunch menu today?', 'en', '오늘 급식 메뉴가 뭔가요?', 'A',
    '급식 메뉴 문의 (영어)',
    "Today's lunch menu: Rice, Miso Soup, Stir-fried Pork, Kimchi, Milk.",
    '긍정', 0.15, 0, null, null, 'Rice, Miso Soup, Stir-fried Pork', 'resolved', dAgo(24),
  ],
  [
    '내일 시간표가 어떻게 되나요? 아이가 준비물 가져가야 할 것 같아서요', 'ko', null, 'A',
    '시간표 문의 — 즉시 답변 가능',
    '내일 시간표(3학년 2반 기준): 1교시 국어, 2교시 수학, 3교시 영어, 4교시 과학, 5교시 체육, 6교시 미술입니다. 체육복과 미술 재료를 준비해 주세요.',
    '긍정', 0.25, 0, null, null, '국어,수학,영어,과학,체육,미술', 'resolved', dAgo(22),
  ],
  [
    '학교 급식 알레르기 표시가 어디서 확인되나요?', 'ko', null, 'A',
    '급식 알레르기 정보 문의',
    '알레르기 정보는 학교 홈페이지 → 급식 메뉴판 메뉴에서 확인하실 수 있습니다. 매일 업데이트됩니다.',
    '중립', 0.10, 0, null, null, null, 'resolved', dAgo(21),
  ],
  [
    '방학은 언제인가요?', 'ko', null, 'A',
    '학사일정(방학) 문의',
    '여름방학은 7월 18일부터 8월 18일까지입니다. 개학은 8월 19일(월)입니다.',
    '긍정', 0.18, 0, null, null, '여름방학 7/18~8/18', 'resolved', dAgo(20),
  ],
  [
    '학교폭력 신고는 어디에 하나요?', 'ko', null, 'A',
    '학교폭력 신고처 안내 — 공공정보로 즉시 답변',
    '학교폭력 신고는 ① 117(학교폭력 신고전화), ② 학교 내 학교폭력 담당교사, ③ 국민신문고(epeople.go.kr)를 통해 하실 수 있습니다.',
    '불안', 0.40, 0, null, null, null, 'resolved', dAgo(18),
  ],
  [
    '今天的午餐是什么?', 'zh', '오늘 급식 메뉴가 뭔가요?', 'A',
    '급식 메뉴 문의 (중국어)',
    '今天的午餐菜单: 米饭、大酱汤、炒猪肉、萝卜泡菜、牛奶。',
    '중립', 0.10, 0, null, null, '쌀밥, 된장찌개, 제육볶음', 'resolved', dAgo(17),
  ],
  [
    '수학여행은 언제인가요? 사전 안내는 언제쯤 올까요?', 'ko', null, 'A',
    '학사일정(수학여행) 문의',
    '수학여행은 10월 22일~24일(2박 3일)로 예정되어 있습니다. 공식 가정통신문은 9월 초에 발송될 예정입니다.',
    '긍정', 0.30, 0, null, null, '수학여행 10/22~24', 'resolved', dAgo(16),
  ],
  [
    '개교기념일이 언제인지 알 수 있을까요?', 'ko', null, 'A',
    '학교 기본정보 문의',
    '개교기념일은 10월 15일입니다. 해당일은 수업이 없으니 참고해 주세요.',
    '중립', 0.10, 0, null, null, null, 'resolved', dAgo(15),
  ],
  [
    '체험학습 신청서 제출 기한이 언제까지인가요?', 'ko', null, 'A',
    '학사일정 및 서류 기한 문의',
    '체험학습 신청서 제출은 행사 5일 전까지입니다. 5월 28일 체험학습의 경우 5월 21일(화)까지 담임선생님께 제출해 주세요.',
    '긍정', 0.20, 0, null, null, '체험학습 5/28, 신청서 마감 5/21', 'resolved', dAgo(13),
  ],
  [
    'Hôm nay ăn gì ở trường?', 'vi', '오늘 학교 급식이 뭔가요?', 'A',
    '급식 메뉴 문의 (베트남어)',
    'Thực đơn hôm nay: Cơm, Canh Đậu Nành, Thịt Lợn Xào, Kim Chi Củ Cải, Sữa.',
    '중립', 0.10, 0, null, null, null, 'resolved', dAgo(12),
  ],
  [
    '학교 홈페이지 주소가 어떻게 되나요?', 'ko', null, 'A',
    '학교 기본정보 문의',
    '학교 홈페이지: https://school.example.kr 입니다. 학사일정, 급식 메뉴, 가정통신문을 모두 확인하실 수 있습니다.',
    '중립', 0.10, 0, null, null, null, 'resolved', dAgo(11),
  ],
  [
    '기말고사 범위는 어디서 확인하나요?', 'ko', null, 'A',
    '학사일정(기말고사) 문의',
    '기말고사는 6월 16일~18일입니다. 시험 범위는 6월 초 담임선생님께서 안내드릴 예정입니다.',
    '중립', 0.20, 0, null, null, '기말고사 6/16~18', 'resolved', dAgo(10),
  ],
  [
    '학부모 상담 주간이 언제인가요?', 'ko', null, 'A',
    '학사일정(상담 주간) 문의',
    '학부모 상담 주간은 6월 3일~7일입니다. 담임선생님께 직접 시간 예약을 부탁드립니다. (학교 시스템 아닌 개별 연락)',
    '긍정', 0.25, 0, null, null, '상담 주간 6/3~7', 'resolved', dAgo(8),
  ],
  [
    '급식비 납부 방법을 알려주세요', 'ko', null, 'A',
    '급식비 납부 안내 — 공공정보',
    '급식비는 매월 25일 가정에 발송된 고지서 또는 학교 납부 시스템(학교 홈페이지 → 학부모 납부)을 통해 납부하실 수 있습니다.',
    '중립', 0.15, 0, null, null, null, 'resolved', dAgo(7),
  ],
  [
    '운동회가 언제인가요?', 'ko', null, 'A',
    '학사일정(운동회) 문의',
    '운동회는 9월 27일(금) 예정입니다. 날씨에 따라 10월 4일로 연기될 수 있으며, 가정통신문으로 사전 안내 드리겠습니다.',
    '긍정', 0.30, 0, null, null, '운동회 9/27', 'resolved', dAgo(6),
  ],
  [
    '오늘 점심 급식 알려주세요', 'ko', null, 'A',
    '급식 메뉴 문의',
    '오늘의 급식 메뉴: 잡곡밥, 북어국, 고등어조림, 콩나물무침, 김치, 과일입니다.',
    '중립', 0.10, 0, null, null, '잡곡밥,북어국,고등어조림,콩나물무침,김치,과일', 'resolved', dAgo(4),
  ],
  [
    '졸업식은 언제인가요?', 'ko', null, 'A',
    '학사일정(졸업식) 문의',
    '졸업식은 내년 2월 14일(금)로 예정되어 있습니다. 입학식은 3월 4일(화)입니다.',
    '긍정', 0.20, 0, null, null, null, 'resolved', dAgo(3),
  ],
  [
    '학교 주차장 이용 가능한가요?', 'ko', null, 'A',
    '학교 시설 기본정보 문의',
    '학교 주차장은 학부모 상담 기간에만 예약제로 운영합니다. 일반 방문 시에는 인근 공영주차장(정문에서 도보 3분)을 이용해 주세요.',
    '중립', 0.10, 0, null, null, null, 'resolved', dAgo(2),
  ],
  [
    '오늘 급식 있나요? 아이 도시락 싸야 할지', 'ko', null, 'A',
    '급식 운영 여부 문의',
    '오늘은 정상적으로 급식이 운영됩니다. 도시락은 준비하지 않으셔도 됩니다.',
    '중립', 0.10, 0, null, null, null, 'resolved', hAgo(6),
  ],

  /* ───────────────── B타입 — 교사 확인 필요 (14건) ───────────────── */
  [
    '저희 아이 3월 수행평가 점수를 알 수 있을까요? 성적표에 반영이 됐는지 확인하고 싶습니다.',
    'ko', null, 'B',
    '특정 학생 수행평가 점수 — 교사 확인 필요',
    '담당 선생님께 확인 후 1~2 영업일 이내 답변드리겠습니다.',
    '불안', 0.45, 0,
    '김민준 학생(3학년 2반)의 3월 수행평가 점수와 성적표 반영 여부를 알려주세요.',
    '3월 수행평가: 국어 88점, 수학 92점, 영어 85점 / 모두 성적표에 반영되었습니다.',
    null, 'resolved', dAgo(29),
  ],
  [
    '우리 아이가 학교 생활을 잘 하고 있는지 궁금합니다. 친구들과는 잘 지내나요?',
    'ko', null, 'B',
    '학생 생활태도 — 교사 확인 필요',
    '담당 선생님께 확인 후 답변드리겠습니다.',
    '불안', 0.50, 0,
    '이수아 학생(4학년 1반)의 교우관계 및 학교생활 적응 현황을 간략히 알려주세요.',
    '이수아 학생은 급우들과 원만하게 지내고 있으며 학교 생활에 잘 적응하고 있습니다.',
    null, 'resolved', dAgo(26),
  ],
  [
    '지난주에 결석 처리가 됐는지 확인하고 싶어요. 병원 진단서 제출했는데요.',
    'ko', null, 'B',
    '출결 처리 확인 — 교사 확인 필요',
    '담당 선생님께 출결 처리 여부를 확인하겠습니다.',
    '중립', 0.20, 0,
    '박지호 학생 5월 8일(수) 결석이 질병결석으로 정상 처리됐는지 확인해주세요.',
    '네, 5월 8일 결석은 질병결석으로 처리되었습니다. 진단서 잘 받았습니다.',
    null, 'resolved', dAgo(23),
  ],
  [
    '아이가 요즘 학교 가기 싫다고 하는데, 학교에서 특별한 일이 있었나요?',
    'ko', null, 'B',
    '학생 심리·학교생활 상태 확인 — 교사 확인 필요',
    '담당 선생님께 학생 상태를 확인하겠습니다.',
    '불안', 0.65, 0,
    '최예준 학생이 최근 학교 가기 싫어하는 이유가 있는지, 학교에서 이상 징후가 있었는지 확인해주세요.',
    null, null, 'pending', dAgo(19),
  ],
  [
    '4월에 제출한 독서감상문 평가가 어떻게 됐나요?',
    'ko', null, 'B',
    '수행평가 결과 확인 — 교사 확인 필요',
    '담당 선생님께 확인 후 답변드리겠습니다.',
    '중립', 0.25, 0,
    '강다인 학생(5학년 3반) 4월 독서감상문 평가 결과를 알려주세요.',
    '강다인 학생의 독서감상문은 "매우 우수" 등급을 받았습니다. 창의적인 감상이 돋보였습니다.',
    null, 'resolved', dAgo(18),
  ],
  [
    '아이 영어 성적이 많이 떨어진 것 같던데, 무엇이 문제인지 확인해 주실 수 있나요?',
    'ko', null, 'B',
    '학생 학업 성취 확인 — 교사 확인 필요',
    '담당 선생님께 확인 후 답변드리겠습니다.',
    '불안', 0.55, 0,
    '오준서 학생(6학년 1반)의 최근 영어 학업 성취 현황과 부진 원인을 알려주세요.',
    null, null, 'pending', dAgo(14),
  ],
  [
    '우리 아이가 점심을 안 먹는다고 하는데, 학교에서도 그런가요?',
    'ko', null, 'B',
    '학생 급식 참여 여부 — 교사 확인 필요',
    '담당 선생님께 확인하겠습니다.',
    '불안', 0.45, 0,
    '윤서연 학생(2학년 4반)이 급식을 잘 먹고 있는지 확인해 주세요.',
    '윤서연 학생은 급식을 잘 먹고 있습니다. 오늘도 잔반 없이 다 먹었어요.',
    null, 'resolved', dAgo(13),
  ],
  [
    '과학 실험 수업에서 다쳤다는데 어느 정도로 다친 건가요?',
    'ko', null, 'B',
    '학교 내 부상 확인 — 교사 확인 필요',
    '담당 선생님께 확인 후 즉시 답변드리겠습니다.',
    '불안', 0.75, 0,
    '신태양 학생(5학년 2반) 오늘 과학 실험 중 부상 내용과 조치 현황을 알려주세요.',
    '가벼운 찰과상으로 양호실에서 소독 처치 후 정상 수업에 참여했습니다. 크게 걱정 안 하셔도 됩니다.',
    null, 'resolved', dAgo(11),
  ],
  [
    '아이가 친구에게 왕따를 당하는 것 같다고 했는데, 선생님이 알고 계신지 여쭤보고 싶습니다.',
    'ko', null, 'B',
    '학교폭력 의심 — 담임 확인 필요',
    '중요한 사안으로 담당 선생님께 확인하겠습니다.',
    '불안', 0.80, 0,
    '한지민 학생(3학년 5반)의 교우관계 이상 여부와 왕따 가능성을 확인해주세요. 매우 민감한 사안입니다.',
    null, null, 'pending', dAgo(9),
  ],
  [
    '봄 소풍 사진을 받을 수 있는 방법이 있나요?',
    'ko', null, 'B',
    '학교 행사 자료 요청 — 교사 확인 필요',
    '담당 선생님께 확인 후 안내드리겠습니다.',
    '긍정', 0.20, 0,
    '봄 소풍 단체 사진 및 개인 사진 배부 방법을 알려주세요. (3학년 전체)',
    '소풍 사진은 이번 주 금요일 학급 단체 채팅방을 통해 공유 예정입니다.',
    null, 'resolved', dAgo(7),
  ],
  [
    '미술 대회 결과가 나왔나요? 아이가 궁금해 하네요.',
    'ko', null, 'B',
    '교내 행사 결과 확인 — 교사 확인 필요',
    '담당 선생님께 확인하겠습니다.',
    '긍정', 0.15, 0,
    '교내 미술대회 수상 결과와 시상 일정을 알려주세요.',
    '입선 이상 수상자는 모두 담임선생님을 통해 개별 통보했습니다. 수상 연락이 없었다면 이번에는 아쉽게도 탈락한 것입니다.',
    null, 'resolved', dAgo(5),
  ],
  [
    '우리 아이 음악 성적이 왜 B가 나왔는지 이유를 알고 싶습니다.',
    'ko', null, 'B',
    '성적 평가 이유 확인 — 담당 교사 확인 필요',
    '담당 선생님께 평가 내역 확인을 요청하겠습니다.',
    '불안', 0.50, 0,
    '정유나 학생(4학년 3반) 1학기 음악 성적 B 사유를 알려주세요.',
    null, null, 'pending', dAgo(3),
  ],
  [
    '아이가 점심시간에 밥을 못 먹고 있다고 하는데, 왜 그런지 확인해주실 수 있나요?',
    'ko', null, 'B',
    '급식 시간 학생 상황 — 교사 확인 필요',
    '담당 선생님께 확인하겠습니다.',
    '불안', 0.60, 0,
    '임도현 학생(2학년 1반)이 최근 점심을 못 먹고 있는 이유를 확인해 주세요.',
    null, null, 'pending', hAgo(8),
  ],
  [
    '체험학습 동의서에 서명하기 전에 목적지와 일정을 좀 더 자세히 알고 싶습니다.',
    'ko', null, 'B',
    '체험학습 세부 일정 문의 — 교사 확인 필요',
    '담당 선생님께 상세 일정 확인을 요청하겠습니다.',
    '중립', 0.20, 0,
    '5월 28일 체험학습 목적지, 이동 수단, 세부 일정을 학부모에게 안내해 주세요.',
    null, null, 'pending', hAgo(3),
  ],

  /* ───────────────── C타입 — 자동 차단 (10건) ───────────────── */
  [
    '선생님이 우리 아이만 차별해요!! 당장 담임 바꾸세요 이게 뭐 하는 학교야!!! 진짜 화가 너무 나서',
    'ko', null, 'C',
    '욕설·감정적 공격·부당 요구',
    '안녕하세요. 소중한 의견 감사합니다. 다만 이 채널에서 처리하기 어려운 내용입니다. 공식 민원은 국민신문고(epeople.go.kr)를 통해 접수해 주시면 담당 부서에서 성실히 검토하겠습니다.',
    '분노', 0.95, 0, null, null, null, 'blocked', dAgo(29),
  ],
  [
    '새벽 2시에 씁니다. 선생님이 정말 너무 불만이에요. 저 오늘 진짜 참을 수가 없어서',
    'ko', null, 'C',
    '야간 감정적 민원',
    '안녕하세요. 보다 원활한 처리를 위해 평일 오전 9시~오후 5시에 다시 접수하시거나 국민신문고를 이용해 주세요.',
    '분노', 0.82, 0, null, null, null, 'blocked', dAgo(25),
  ],
  [
    '급식이 맛없어요. 선생님들 월급 깎으세요. 교장도 마찬가지',
    'ko', null, 'C',
    '교육활동과 무관한 부당 요구',
    '급식 관련 의견은 학교 영양사실로 직접 문의해 주시면 더 빠른 도움을 받으실 수 있습니다.',
    '분노', 0.70, 0, null, null, null, 'blocked', dAgo(22),
  ],
  [
    '우리 반 담임 선생님 진짜 문제 있는 것 같아요 제발 자르세요 못 가르치잖아요',
    'ko', null, 'C',
    '교사에 대한 부당 공격·해임 요구',
    '안녕하세요. 교사에 대한 공식적인 민원은 교육청 민원 채널 또는 국민신문고를 통해 접수하실 수 있습니다.',
    '분노', 0.88, 0, null, null, null, 'blocked', dAgo(20),
  ],
  [
    '어제도 민원 넣었는데 왜 아직도 답이 없어요??? 당장 해결 안 하면 교육청 가겠습니다!!!',
    'ko', null, 'C',
    '반복 민원·협박',
    '안녕하세요. 이전 접수건은 처리 중입니다. 보다 신속한 처리를 원하신다면 학교 행정실(02-1234-5678)로 직접 문의해 주세요.',
    '분노', 0.91, 0, null, null, null, 'blocked', dAgo(17),
  ],
  [
    '이 학교 진짜 최악이다. 애들 관리를 어떻게 하는 거야. 내 아이 다른 학교 전학시킬 거야',
    'ko', null, 'C',
    '욕설·감정적 표현',
    '불편을 드려 죄송합니다. 구체적인 불편 사항이 있으시면 상세 내용을 기재하신 후 재접수해 주시면 도움드리겠습니다.',
    '분노', 0.86, 0, null, null, null, 'blocked', dAgo(15),
  ],
  [
    '학교에서 아이 핸드폰을 왜 가져가요? 당장 돌려주세요 학부모 동의도 없이',
    'ko', null, 'C',
    '부당 요구 (학교 규정 내 처리 사안)',
    '학교 핸드폰 수거 정책은 학교운영위원회에서 의결된 학칙에 따른 것입니다. 이의가 있으시면 학교운영위원회 또는 교육청으로 문의해 주세요.',
    '분노', 0.75, 0, null, null, null, 'blocked', dAgo(12),
  ],
  [
    '밤 11시 30분입니다. 아이가 숙제를 너무 많이 내줬다고 하는데 이게 정상인가요?',
    'ko', null, 'C',
    '야간 감정적 민원',
    '안녕하세요. 늦은 시간 접수된 민원은 익일 처리됩니다. 평일 운영시간(9시~17시)에 재접수해 주시면 감사하겠습니다.',
    '분노', 0.60, 0, null, null, null, 'blocked', dAgo(8),
  ],
  [
    '왜 우리 아이만 상장을 못 받았어요? 편애 아닌가요? 공정하지 않다',
    'ko', null, 'C',
    '근거 없는 편애 주장 — 교사 교육활동 침해 소지',
    '안녕하세요. 시상은 객관적 기준에 따라 공정하게 이루어집니다. 구체적인 이의는 학교 행정실을 통해 공식적으로 접수해 주시면 검토해 드리겠습니다.',
    '분노', 0.78, 0, null, null, null, 'blocked', dAgo(4),
  ],
  [
    '학교에서 왜 교복 안 입는 애들 단속 안 해요? 민원 계속 넣을 거예요',
    'ko', null, 'C',
    '반복성 민원',
    '안녕하세요. 교복 착용 지도는 학교에서 지속적으로 실시하고 있습니다. 구체적인 불편 사항이 있으시면 상세 내용을 기재해 주세요.',
    '분노', 0.65, 0, null, null, null, 'blocked', hAgo(14),
  ],

  /* ───────────────── D타입 — 긴급 (8건) ───────────────── */
  [
    '방금 아이한테 연락이 왔는데 운동장에서 넘어져서 무릎에 피가 많이 난다고 합니다. 빨리 확인해주세요!',
    'ko', null, 'D',
    '학생 부상 긴급 — 즉각 대응 필요',
    '긴급 사안으로 담당 선생님께 즉시 전달했습니다. 양호실에서 응급처치 진행 중입니다. 곧 연락드리겠습니다.',
    '분노', 0.88, 0, null, null, null, 'escalated', dAgo(28),
  ],
  [
    '아이가 학교에서 갑자기 쓰러졌다고 친구한테 연락이 왔어요. 지금 상황이 어떤가요?',
    'ko', null, 'D',
    '학생 응급 상황 — 즉각 대응',
    '매우 긴급한 사안입니다. 담당 선생님과 양호교사에게 즉시 연락했습니다. 곧 학교에서 직접 연락드리겠습니다.',
    '분노', 0.95, 0, null, null, null, 'escalated', dAgo(24),
  ],
  [
    '우리 아이가 집에 오면 자꾸 멍이 들어있어요. 어디서 생겼는지 물어봐도 말을 안 해서 걱정입니다.',
    'ko', null, 'D',
    '학교폭력 의심 신호 — 즉각 확인 필요',
    '중요한 사안입니다. 담당 선생님께 즉시 알리고 학교폭력 담당자에게도 전달했습니다. 조속히 연락드리겠습니다.',
    '불안', 0.82, 1, null, null, null, 'escalated', dAgo(21),
  ],
  [
    '아이가 매일 학교 가기 싫다고 울어요. 어떤 친구가 때린다고 하는데 확인해주세요.',
    'ko', null, 'D',
    '학교폭력 신호 — 긴급 대응',
    '매우 중요한 신고입니다. 담임선생님과 학교폭력 담당교사에게 즉시 전달했습니다. 오늘 중으로 연락드리겠습니다.',
    '분노', 0.91, 1, null, null, null, 'escalated', dAgo(16),
  ],
  [
    '우리 아이가 친구한테 지속적으로 협박 문자를 받고 있다고 했습니다. 학교폭력으로 신고하고 싶어요.',
    'ko', null, 'D',
    '학교폭력(사이버 협박) 신고 — 즉각 조치 필요',
    '사이버 학교폭력 신고를 접수했습니다. 학교폭력 담당자가 즉시 사안을 조사하겠습니다. 오늘 중으로 연락드리겠습니다.',
    '분노', 0.90, 1, null, null, null, 'escalated', dAgo(11),
  ],
  [
    '점심시간에 아이가 계단에서 밀려서 다쳤다는 연락이 왔어요. 병원 가야 할 정도인가요?',
    'ko', null, 'D',
    '학생 부상(타의에 의한 의심) — 긴급 확인',
    '긴급 사안으로 담당 선생님과 양호교사에게 즉시 알렸습니다. 부상 정도 확인 후 바로 연락드리겠습니다.',
    '분노', 0.85, 0, null, null, null, 'escalated', dAgo(6),
  ],
  [
    '아이가 오늘 학교에서 집단 괴롭힘을 당했다고 울면서 집에 왔습니다. 너무 화가 납니다.',
    'ko', null, 'D',
    '학교폭력(집단 괴롭힘) — 긴급 신고',
    '매우 중요한 신고입니다. 학교폭력 전담팀에 즉시 전달했습니다. 오늘 중으로 학교에서 연락드리겠습니다.',
    '분노', 0.96, 1, null, null, null, 'escalated', dAgo(3),
  ],
  [
    '아이 손이 골절된 것 같아요. 학교에서 무슨 일이 있었는지 모르겠습니다. 지금 병원인데요',
    'ko', null, 'D',
    '학생 골절 부상 — 즉각 대응',
    '긴급 상황입니다. 담임선생님께 즉시 연락했습니다. 학교안전공제회 처리 절차도 안내드릴 예정입니다.',
    '분노', 0.93, 0, null, null, null, 'escalated', hAgo(2),
  ],
];

complaints.forEach(row => cStmt.run(...row));
const totalComplaints = db.prepare('SELECT COUNT(*) as n FROM complaints').get().n;
console.log(`✓ complaints: ${totalComplaints}건`);

// ── student_reports 삽입 ───────────────────────────────────
const sStmt = db.prepare(`
  INSERT INTO student_reports (content, category, urgency, ai_summary, status, created_at)
  VALUES (?,?,?,?,?,?)
`);

const studentReports = [
  ['친구가 제 지우개를 자꾸 허락 없이 가져가요. 돌려달라고 하면 화를 내요.', '친구 관계 문제', '일반', '반 친구의 물건 무단 사용 및 갈등 - 중재 필요', 'pending', dAgo(20)],
  ['체육 시간에 어떤 애가 저를 일부러 넘어뜨렸어요. 선생님은 못 봤고요.', '위험한 상황', '긴급', '체육 수업 중 신체 위해 행위 — 즉각 확인 필요', 'pending', dAgo(17)],
  ['요즘 학교 오기 싫어요. 이유는 모르겠어요. 그냥 슬퍼요.', '기분이 안 좋아요', '일반', '학교 부적응 및 우울 감정 — 상담 필요', 'pending', dAgo(15)],
  ['어떤 친구들이 단톡방에서 저 욕하는 것 같아요. 저만 빼고 캡처 돌린대요.', '친구 관계 문제', '긴급', '사이버 왕따 의심 — 학교폭력 담당자 확인 필요', 'pending', dAgo(12)],
  ['선생님이 저한테만 심하게 대하는 것 같아서 불공평해요.', '선생님과의 갈등', '일반', '교사와의 관계 갈등 — 담임 확인 권고', 'pending', dAgo(10)],
  ['어떤 애가 복도에서 제 가방을 걷어찼어요. 기분이 너무 나빴어요.', '위험한 상황', '긴급', '신체 위해 — 즉각 확인 및 지도 필요', 'pending', dAgo(8)],
  ['급식 시간에 혼자 밥 먹어요. 같이 먹을 친구가 없어서요.', '기분이 안 좋아요', '일반', '사회적 고립 징후 — 관찰 및 상담 권고', 'pending', dAgo(6)],
  ['어제부터 머리가 아프고 학교 생각만 하면 배가 아파요.', '기분이 안 좋아요', '일반', '심리적 신체화 증상 — 상담 교사 면담 권고', 'pending', dAgo(5)],
  ['친구가 제 비밀을 다른 반 애들한테 다 얘기했어요. 너무 속상해요.', '친구 관계 문제', '일반', '신뢰 관계 파탄 및 정서적 상처 — 상담 필요', 'pending', dAgo(3)],
  ['어떤 애가 제 돈을 빌려가고 안 갚아요. 갚으라고 하면 협박해요.', '위험한 상황', '긴급', '금품 갈취 및 협박 — 즉각 학교폭력 신고 처리 필요', 'pending', dAgo(2)],
  ['학교에 오면 아무도 저랑 얘기 안 해줘요. 투명인간 같은 느낌이에요.', '기분이 안 좋아요', '일반', '사회적 고립 — 지속 관찰 및 담임 상담 필요', 'pending', hAgo(10)],
  ['선생님한테 발표할 때 틀렸다고 애들이 다 웃었어요. 너무 창피했어요.', '선생님과의 갈등', '일반', '교실 내 수치 경험 — 정서 지원 필요', 'pending', hAgo(5)],
];

studentReports.forEach(row => sStmt.run(...row));
const totalReports = db.prepare('SELECT COUNT(*) as n FROM student_reports').get().n;
console.log(`✓ student_reports: ${totalReports}건`);

// ── teacher_notifications 생성 ───────────────────────────
const nStmt = db.prepare(`
  INSERT INTO teacher_notifications (complaint_id, type, summary, query, is_read, created_at)
  VALUES (?,?,?,?,?,?)
`);

// B타입: 정보 요청 알림
const bRows = db.prepare(`SELECT id, teacher_query, created_at FROM complaints WHERE type='B' ORDER BY id`).all();
bRows.forEach((c, i) => {
  nStmt.run(
    c.id,
    'info_request',
    `학부모 문의 확인 요청`,
    c.teacher_query,
    c.teacher_query && i < 5 ? 1 : 0,  // 앞 5건은 읽음 처리
    c.created_at,
  );
});

// D타입: 긴급 알림
const dRows = db.prepare(`SELECT id, reason, created_at FROM complaints WHERE type='D' ORDER BY id`).all();
dRows.forEach((c, i) => {
  nStmt.run(
    c.id,
    'urgent',
    `[긴급] ${c.reason}`,
    null,
    i < 3 ? 1 : 0,
    c.created_at,
  );
});

// 학폭 위험: 별도 알림
const vRows = db.prepare(`SELECT id, reason, created_at FROM complaints WHERE is_violence_risk=1 ORDER BY id`).all();
vRows.forEach((c) => {
  nStmt.run(
    c.id,
    'violence',
    `[학폭경보] 위험 신호 감지`,
    null,
    0,
    c.created_at,
  );
});

// 학생 자기보고 긴급건 알림
const urgentStudents = db.prepare(`SELECT id, ai_summary, created_at FROM student_reports WHERE urgency='긴급' ORDER BY id`).all();
urgentStudents.forEach((r) => {
  nStmt.run(null, 'violence', `[학생신고] ${r.ai_summary}`, null, 0, r.created_at);
});

const totalNotifs = db.prepare('SELECT COUNT(*) as n FROM teacher_notifications').get().n;
console.log(`✓ teacher_notifications: ${totalNotifs}건`);

// ── preemptive_alerts ─────────────────────────────────────
const aStmt = db.prepare(`INSERT INTO preemptive_alerts (trigger_type, message, created_at) VALUES (?,?,?)`);

[
  ['schedule', '📢 다음 주 월요일(5/12)부터 사흘간 중간고사가 진행됩니다. 아이의 충분한 수면과 컨디션 관리 부탁드립니다.', dAgo(14)],
  ['weather',  '🌧 내일 오후 강수 확률 80% 예보입니다. 우산을 챙겨 주시고, 야외 체육 수업은 실내로 변경됩니다.', dAgo(10)],
  ['schedule', '🎒 이번 주 금요일(5/28) 체험학습 날입니다. 도시락·편한 복장 준비, 집합 시간은 오전 8시 20분입니다.', dAgo(7)],
  ['pattern',  '📊 매년 이맘때 수행평가 관련 문의가 집중됩니다. 수행평가 일정은 학교 홈페이지 → 학사정보에서 미리 확인하세요.', dAgo(5)],
  ['schedule', '🩺 오는 6월 3~7일 학부모 상담 주간입니다. 담임선생님께 미리 시간을 예약해 두시면 편리합니다.', dAgo(3)],
  ['weather',  '☀️ 이번 주는 기온이 30도까지 오를 예정입니다. 생수·모자를 챙겨 주시고 야외 활동 시 자외선 차단제를 발라주세요.', dAgo(2)],
  ['schedule', '📝 6월 16~18일 기말고사 일정을 안내드립니다. 시험 범위는 이번 주 중으로 각 담임 선생님께서 공지할 예정입니다.', dAgo(1)],
].forEach(row => aStmt.run(...row));

const totalAlerts = db.prepare('SELECT COUNT(*) as n FROM preemptive_alerts').get().n;
console.log(`✓ preemptive_alerts: ${totalAlerts}건`);

// ── 최종 요약 ────────────────────────────────────────────
console.log('\n══════════════════════════════');
console.log('  EduShield 시드 데이터 완료');
console.log('══════════════════════════════');
const byType = db.prepare(`SELECT type, COUNT(*) as n FROM complaints GROUP BY type ORDER BY type`).all();
byType.forEach(r => {
  const labels = { A: '즉시답변', B: '교사확인', C: '차단    ', D: '긴급    ' };
  console.log(`  ${r.type}타입 (${labels[r.type] || '기타'}): ${r.n}건`);
});
console.log(`  학폭 위험 감지   : ${db.prepare(`SELECT COUNT(*) as n FROM complaints WHERE is_violence_risk=1`).get().n}건`);
console.log(`  학생 자기보고    : ${totalReports}건`);
console.log(`  교사 알림        : ${totalNotifs}건`);
console.log(`  선제 알림        : ${totalAlerts}건`);
console.log('──────────────────────────────');
console.log(`  총 민원          : ${totalComplaints}건`);
