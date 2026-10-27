# EduShield

학부모 민원을 AI로 분류하고 학교 공공데이터로 바로 답하며, 교사에게는 요약 알림만 전하는 민원 처리 웹 서비스입니다.

## 소개

학부모 민원 중에는 급식, 시간표, 학사일정처럼 공공데이터로 바로 답할 수 있는 문의가 많습니다. EduShield는 민원을 접수하기 전에 AI와 먼저 상담하게 하고, 접수된 민원은 네 가지로 분류해 처리합니다. 교사에게는 원문 대신 요약 알림을 보냅니다.

## 주요 기능

- 쿨다운 챔버: 접수 전에 AI가 공감하며 답하고, 가능하면 민원 없이 해결합니다.
- 민원 분류: A(공공데이터로 즉시 답변), B(교사 확인 후 답변), C(협박·욕설·반복 민원 등 자동 차단), D(학생 안전·부상·응급·학교폭력 신호, 긴급 즉시 전달)
- NEIS 연동: 급식, 학사일정, 시간표, 학교 정보를 NEIS 교육정보 개방포털에서 가져와 답변에 씁니다. API 키가 없으면 데모 데이터로 대체합니다.
- 교사 포털: 알림을 확인하고 B타입 질문에 답하면 학부모용 답변이 만들어집니다.
- 다국어: 한국어 외 민원은 번역해서 처리합니다.
- 선제 알림: NEIS 학사일정을 바탕으로 선제 안내문을 만듭니다.
- 학생 채널: 학생이 익명으로 자기 상태를 보고하면 AI가 분석합니다.
- 관리자 대시보드: 민원 통계와 경보를 차트로 봅니다.

## 기술

- Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS 3
- better-sqlite3 (파일 DB), Recharts
- Anthropic SDK (`lib/claude.ts`), NEIS Open API (`lib/neis.ts`)

## 실행 방법

환경 변수로 `ANTHROPIC_API_KEY`(필수), `NEIS_API_KEY`(선택)를 설정합니다.

```bash
npm install
node seed.js        # 샘플 데이터로 edushield.db 초기화
npm run dev         # http://localhost:3000
```

페이지: `/parent`(학부모), `/teacher`(교사), `/student`(학생), `/dashboard`(관리자)
