'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CooldownChamber }  from '@/components/CooldownChamber';
import { ComplaintResult }  from '@/components/ComplaintResult';

type Stage = 'cooldown' | 'form' | 'result';

const LANGUAGES = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'English' },
  { code: 'zh', label: '中文' },
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'mn', label: 'Монгол' },
];

const PLACEHOLDERS: Record<string, string> = {
  ko: '민원·문의 내용을 입력해주세요…',
  en: 'Please describe your concern…',
  zh: '请输入您的问题…',
  vi: 'Vui lòng nhập nội dung…',
  mn: 'Санал гомдолоо бичнэ үү…',
};

const SUBMIT_LABELS: Record<string, string> = {
  ko: '접수하기',
  en: 'Submit',
  zh: '提交',
  vi: 'Gửi',
  mn: 'Илгээх',
};

interface ResultData {
  id: number;
  type: 'A' | 'B' | 'C' | 'D';
  response: string;
  emotion: string;
  is_violence_risk: boolean;
  neis_source: string | null;
  status: string;
}

export default function ParentPage() {
  const [stage,    setStage]    = useState<Stage>('cooldown');
  const [lang,     setLang]     = useState('ko');
  const [content,  setContent]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState<ResultData | null>(null);
  const [error,    setError]    = useState('');

  async function handleSubmit() {
    if (!content.trim() || loading) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/complaint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'classify', content, language: lang }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '오류가 발생했습니다.');
      setResult(data);
      setStage('result');
    } catch (e) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setStage('cooldown');
    setContent('');
    setResult(null);
    setError('');
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">

      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-brand-500 text-white">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center">
              <ShieldIcon />
            </div>
            <span className="font-bold">EduShield</span>
          </Link>
          <ChevronIcon />
          <span className="text-blue-200 text-sm">학부모 포털</span>
          <div className="ml-auto flex items-center gap-3">
            <Link href="/teacher"   className="text-blue-200 hover:text-white text-sm transition-colors">교사</Link>
            <Link href="/dashboard" className="text-blue-200 hover:text-white text-sm transition-colors">대시보드</Link>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-6xl mx-auto w-full px-4 py-8 gap-6">

        {/* 좌측 — 안내 패널 */}
        <aside className="hidden lg:flex w-64 shrink-0 flex-col gap-4">

          {/* 단계 안내 */}
          <div className="card p-5">
            <p className="label mb-4">처리 절차</p>
            <div className="space-y-4">
              {[
                { n: '01', title: '사전 상담',   desc: 'AI와 대화하며 먼저 해결해봅니다', active: stage === 'cooldown' },
                { n: '02', title: '민원 접수',   desc: '해결이 안 됐을 때만 정식 접수', active: stage === 'form' },
                { n: '03', title: '결과 확인',   desc: '즉시 또는 교사 확인 후 답변', active: stage === 'result' },
              ].map(s => (
                <div key={s.n} className={`flex gap-3 transition-opacity ${!s.active ? 'opacity-40' : ''}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${s.active ? 'bg-brand-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                    {s.n}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{s.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 원칙 안내 */}
          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 space-y-2">
            <p className="text-xs font-bold text-amber-800">알려드립니다</p>
            <ul className="text-xs text-amber-700 space-y-1.5">
              <li className="flex gap-1.5"><span>•</span> 교사에게 민원 원문은 전달되지 않습니다</li>
              <li className="flex gap-1.5"><span>•</span> 욕설·협박 내용은 자동 차단됩니다</li>
              <li className="flex gap-1.5"><span>•</span> 긴급 상황은 즉시 교사에게 전달됩니다</li>
            </ul>
          </div>

          {/* 언어 선택 */}
          <div className="card p-4">
            <p className="label mb-3">언어 선택</p>
            <div className="space-y-1">
              {LANGUAGES.map(l => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                    lang === l.code
                      ? 'bg-brand-50 text-brand-600 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* 메인 콘텐츠 */}
        <main className="flex-1 min-w-0">

          {/* 모바일 언어 선택 */}
          <div className="lg:hidden mb-4 flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">언어:</span>
            <div className="flex gap-1.5 flex-wrap">
              {LANGUAGES.map(l => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    lang === l.code
                      ? 'bg-brand-500 text-white border-brand-500'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── 쿨다운 챔버 ─────────────────────── */}
          {stage === 'cooldown' && (
            <div className="card overflow-hidden" style={{ height: 'min(620px, calc(100vh - 160px))' }}>
              <div className="h-full flex flex-col">
                {/* 탭 헤더 */}
                <div className="flex border-b border-slate-100 shrink-0">
                  <div className="flex-1 px-5 py-3.5 text-sm font-semibold text-brand-600 border-b-2 border-brand-500 bg-brand-50/50">
                    1단계 — 사전 상담
                  </div>
                  <div className="flex-1 px-5 py-3.5 text-sm text-slate-400 text-center">
                    2단계 — 정식 접수
                  </div>
                </div>
                <div className="flex-1 min-h-0">
                  <CooldownChamber
                    onResolved={() => setStage('result')}
                    onProceed={() => setStage('form')}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── 정식 민원 폼 ────────────────────── */}
          {stage === 'form' && (
            <div className="card overflow-hidden">
              {/* 탭 헤더 */}
              <div className="flex border-b border-slate-100">
                <button onClick={() => setStage('cooldown')} className="flex-1 px-5 py-3.5 text-sm text-slate-400 hover:text-slate-600 transition-colors text-center">
                  ← 상담으로 돌아가기
                </button>
                <div className="flex-1 px-5 py-3.5 text-sm font-semibold text-brand-600 border-b-2 border-brand-500 bg-brand-50/50">
                  2단계 — 정식 접수
                </div>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">민원 / 문의 접수</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    AI가 즉시 분류하고 가능한 경우 바로 답변드립니다. 교사에게는 원문이 전달되지 않습니다.
                  </p>
                </div>

                <div>
                  <label className="label mb-2 block">민원 내용</label>
                  <textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder={PLACEHOLDERS[lang] || PLACEHOLDERS.ko}
                    rows={7}
                    className="input resize-none text-sm leading-relaxed"
                  />
                  <p className="text-xs text-slate-400 mt-1.5 text-right">{content.length}자</p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={!content.trim() || loading}
                  className="btn-primary w-full py-3"
                >
                  {loading ? (
                    <>
                      <SpinnerIcon /> AI 분류 중…
                    </>
                  ) : (
                    SUBMIT_LABELS[lang] || '접수하기'
                  )}
                </button>

                <div className="grid grid-cols-4 gap-2 pt-2">
                  {[
                    { label: '즉시답변', sub: 'NEIS 데이터',   color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
                    { label: '교사확인', sub: '1~2 영업일',     color: 'text-blue-600   bg-blue-50   border-blue-200'   },
                    { label: '자동차단', sub: '욕설·협박',      color: 'text-red-600    bg-red-50    border-red-200'    },
                    { label: '긴급전달', sub: '즉시 알림',      color: 'text-orange-600 bg-orange-50 border-orange-200' },
                  ].map(t => (
                    <div key={t.label} className={`text-center text-xs rounded-xl border px-2 py-2.5 ${t.color}`}>
                      <p className="font-bold">{t.label}</p>
                      <p className="text-xs opacity-70 mt-0.5">{t.sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── 결과 표시 ──────────────────────── */}
          {stage === 'result' && result && (
            <div className="card p-6">
              <div className="mb-5">
                <h2 className="text-xl font-bold text-slate-900">처리 결과</h2>
                <p className="text-sm text-slate-500 mt-1">AI가 민원을 분석하고 처리했습니다.</p>
              </div>
              <ComplaintResult result={result} onReset={reset} />
            </div>
          )}

          {/* 쿨다운에서 해결된 경우 */}
          {stage === 'result' && !result && (
            <div className="card p-8 text-center space-y-4 animate-slide-up">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">해결됐네요</h3>
                <p className="text-slate-500 mt-1.5 text-sm">민원을 접수하지 않고 해결되었습니다.</p>
              </div>
              <button onClick={reset} className="btn-secondary">
                홈으로 돌아가기
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

/* ── 아이콘 ────────────────────────────────────── */
function ShieldIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1B4F8A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}
function ChevronIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-300">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  );
}
function SpinnerIcon() {
  return (
    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
    </svg>
  );
}
