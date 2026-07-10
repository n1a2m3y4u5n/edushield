import Anthropic from '@anthropic-ai/sdk';

// 모델 상수
const MODEL = 'claude-sonnet-4-6';

// 싱글톤 클라이언트
let client: Anthropic | null = null;

export function getClaudeClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

/* ── 1. 쿨다운 챔버 응답 ──────────────────────── */
export async function cooldownResponse(content: string): Promise<{
  response: string;
  resolved: boolean;
}> {
  const claude = getClaudeClient();
  const msg = await claude.messages.create({
    model: MODEL,
    max_tokens: 300,
    system: `당신은 학교 소통 도우미입니다. 학부모가 불편함을 털어놓고 있습니다.
공감하고, 관련 정보를 제공하고, 가능하면 민원 없이 해결하세요.
답변은 친절하고 간결하게 150자 이내로 작성하세요.
JSON으로만 응답: { "response": "...", "resolved": true|false }
resolved=true는 민원 없이 해결된 경우, false는 정식 접수가 필요한 경우.`,
    messages: [{ role: 'user', content }],
  });

  const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return { response: text.trim(), resolved: false };

  try {
    return JSON.parse(match[0]);
  } catch {
    return { response: text.trim(), resolved: false };
  }
}

/* ── 2. 민원 분류 ─────────────────────────────── */
export async function classifyComplaint(content: string): Promise<ClassificationResult> {
  const claude = getClaudeClient();
  const msg = await claude.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: `당신은 대한민국 학교 민원을 분류하는 AI입니다. 입력된 민원을 정확히 분석해 JSON으로만 응답하세요.

분류 기준:
A타입: 급식·시간표·학사일정·학교기본정보 등 공공데이터로 즉시 답변 가능
B타입: 특정 학생 정보, 성적, 수행평가 등 교사 확인 필요
C타입: 협박·욕설·반복 민원·부당 요구·업무 무관 내용
D타입: 학생 안전·부상·응급·학교폭력 신호 포함

응답 JSON 형식:
{
  "type": "A|B|C|D",
  "reason": "분류 근거 한 줄",
  "response": "학부모에게 전달할 답변",
  "teacher_query": "교사에게 요청할 내용 (B타입만, 나머지 null)",
  "emotion": "긍정|중립|불안|분노",
  "emotion_score": 0.0~1.0,
  "is_violence_risk": true|false,
  "needs_neis": true|false,
  "neis_type": "meal|schedule|timetable|school_info|null"
}`,
    messages: [{ role: 'user', content }],
  });

  const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('AI 응답 파싱 실패');
  return JSON.parse(match[0]);
}

/* ── 3. NEIS 데이터 기반 최종 답변 생성 ─────────── */
export async function generateNeisAnswer(
  originalQuery: string,
  neisData: string,
  neisType: string
): Promise<string> {
  const claude = getClaudeClient();
  const msg = await claude.messages.create({
    model: MODEL,
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: `학부모 문의: "${originalQuery}"
NEIS 공공데이터 (${neisType}): ${neisData}
위 데이터를 바탕으로 학부모에게 친절하고 정확한 답변을 작성하세요. 답변문만 출력하세요.`,
    }],
  });
  return msg.content[0].type === 'text' ? msg.content[0].text.trim() : '';
}

/* ── 4. B타입: 교사 응답 → 학부모 답변 생성 ─────── */
export async function generateParentResponse(
  originalQuery: string,
  teacherResponse: string,
  language: string
): Promise<string> {
  const claude = getClaudeClient();
  const msg = await claude.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `학부모 문의: "${originalQuery}"
교사 제공 정보: "${teacherResponse}"
학부모에게 정중하고 명확한 답변을 한국어로 작성하세요. 답변문만 출력하세요.`,
    }],
  });

  const response = msg.content[0].type === 'text' ? msg.content[0].text.trim() : '';
  if (language !== 'ko') return translateText(response, language);
  return response;
}

/* ── 5. 다국어 번역 ──────────────────────────── */
export async function translateText(text: string, targetLang: string): Promise<string> {
  const claude = getClaudeClient();
  const langNames: Record<string, string> = {
    ko: '한국어', en: '영어', zh: '중국어', vi: '베트남어', mn: '몽골어',
  };
  const msg = await claude.messages.create({
    model: MODEL,
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `다음 텍스트를 ${langNames[targetLang] || targetLang}로 번역하세요. 번역문만 출력하세요:\n\n${text}`,
    }],
  });
  return msg.content[0].type === 'text' ? msg.content[0].text.trim() : text;
}

/* ── 6. 선제 알림 생성 ───────────────────────── */
export async function generatePreemptiveAlerts(events: string[]): Promise<string[]> {
  if (events.length === 0) return [];
  const claude = getClaudeClient();
  const msg = await claude.messages.create({
    model: MODEL,
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: `다음 학교 이벤트가 예정되어 있습니다: ${events.join(', ')}
학부모에게 보낼 선제 안내 메시지를 3개 생성하세요.
각각 50자 이내, 친절하고 명확하게. JSON 배열로만 응답: ["메시지1", "메시지2", "메시지3"]`,
    }],
  });
  const text = msg.content[0].type === 'text' ? msg.content[0].text : '[]';
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return [];
  try { return JSON.parse(match[0]); } catch { return []; }
}

/* ── 7. 학생 자기보고 분석 ────────────────────── */
export async function analyzeStudentReport(content: string): Promise<{
  category: string;
  urgency: '긴급' | '일반';
  ai_summary: string;
  is_violence_risk: boolean;
  is_crisis: boolean;
}> {
  const claude = getClaudeClient();
  const msg = await claude.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: `학생 자기보고를 분석합니다. JSON으로만 응답:
{
  "category": "폭력|고립|감정|기타",
  "urgency": "긴급|일반",
  "ai_summary": "교사에게 전달할 요약 (익명, 50자 이내)",
  "is_violence_risk": true|false,
  "is_crisis": true|false
}
is_crisis=true: 자해·자살 신호 포함 시.`,
    messages: [{ role: 'user', content }],
  });
  const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('분석 실패');
  return JSON.parse(match[0]);
}

/* ── 타입 정의 ───────────────────────────────── */
export interface ClassificationResult {
  type: 'A' | 'B' | 'C' | 'D';
  reason: string;
  response: string;
  teacher_query: string | null;
  emotion: '긍정' | '중립' | '불안' | '분노';
  emotion_score: number;
  is_violence_risk: boolean;
  needs_neis: boolean;
  neis_type: 'meal' | 'schedule' | 'timetable' | 'school_info' | null;
}
