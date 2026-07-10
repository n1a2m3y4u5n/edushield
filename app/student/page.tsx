'use client';

import { useState } from 'react';
import Link from 'next/link';

type Category = '친구 관계 문제' | '선생님과의 갈등' | '기분이 안 좋아요' | '위험한 상황';
type Stage = 'form' | 'done';

const CATEGORIES: { label: Category; icon: string; color: string; border: string }[] = [
  { label: '친구 관계 문제', icon: '👥', color: 'bg-blue-50   text-blue-700',   border: 'border-blue-200'   },
  { label: '선생님과의 갈등', icon: '🏫', color: 'bg-purple-50 text-purple-700', border: 'border-purple-200' },
  { label: '기분이 안 좋아요', icon: '💙', color: 'bg-sky-50    text-sky-700',    border: 'border-sky-200'    },
  { label: '위험한 상황',    icon: '🚨', color: 'bg-red-50    text-red-700',    border: 'border-red-200'    },
];

interface SubmitResult {
  urgency: '긴급' | '일반';
  is_crisis: boolean;
  is_violence_risk: boolean;
}

export default function StudentPage() {
  const [category, setCategory] = useState<Category | null>(null);
  const [content,  setContent]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [stage,    setStage]    = useState<Stage>('form');
  const [result,   setResult]   = useState<SubmitResult | null>(null);
  const [error,    setError]    = useState('');

  async function handleSubmit() {
    if (!content.trim() || loading) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/student-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, category }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '오류가 발생했습니다.');
      setResult(data);
      setStage('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-brand-500 text-white">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1B4F8A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <span className="font-bold">EduShield</span>
          </Link>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-300">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
          <span className="text-blue-200 text-sm">학생 익명 채널</span>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-10">

        {/* 익명 보장 배너 */}
        <div className="rounded-2xl bg-brand-50 border border-brand-200 px-5 py-4 mb-6 flex gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center shrink-0 mt-0.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-brand-700">완전 익명 보장</p>
            <p className="text-xs text-brand-600 mt-0.5 leading-relaxed">
              이름, 학년, 반을 입력할 필요가 없어요. 내용만 전달되며 선생님도 누가 썼는지 알 수 없습니다.
            </p>
          </div>
        </div>

        {stage === 'form' && (
          <div className="card p-6 space-y-6">
            <div>
              <h1 className="text-xl font-bold text-slate-900">안녕하세요</h1>
              <p className="text-sm text-slate-500 mt-1">
                힘든 일이 있으면 여기서 말해줘요. 선생님이 도움을 드릴 거예요.
              </p>
            </div>

            {/* 카테고리 선택 */}
            <div>
              <p className="label mb-3">어떤 일인가요?</p>
              <div className="grid grid-cols-2 gap-3">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.label}
                    onClick={() => setCategory(cat.label)}
                    className={`rounded-xl border-2 p-3.5 text-left transition-all ${
                      category === cat.label
                        ? `${cat.color} ${cat.border} shadow-card`
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-2xl block mb-1.5">{cat.icon}</span>
                    <span className="text-sm font-medium text-slate-700 leading-snug">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 내용 입력 */}
            <div>
              <p className="label mb-2">어떤 일이 있었나요?</p>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="자유롭게 써줘요. 이름은 쓰지 않아도 돼요."
                rows={5}
                className="input resize-none text-sm leading-relaxed"
              />
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
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
                    <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
                  </svg>
                  전달 중…
                </>
              ) : '선생님께 전달하기'}
            </button>
          </div>
        )}

        {stage === 'done' && result && (
          <div className="card p-8 text-center space-y-5 animate-slide-up">

            {result.is_crisis ? (
              /* 자해·위기 신호 */
              <>
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">괜찮아요, 도움을 받을 수 있어요</h3>
                  <p className="text-slate-500 mt-1.5 text-sm">선생님께 바로 알렸어요. 혼자 버티지 않아도 됩니다.</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-left space-y-3">
                  <p className="text-sm font-bold text-red-800">지금 바로 연락할 수 있어요</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="badge badge-c">1393</span>
                      <span className="text-slate-700">자살 예방 상담 전화 (24시간)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="badge badge-c">1388</span>
                      <span className="text-slate-700">청소년 상담 위기 전화</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="badge badge-c">Wee 클래스</span>
                      <span className="text-slate-700">학교 내 상담실 방문</span>
                    </div>
                  </div>
                </div>
              </>
            ) : result.urgency === '긴급' || result.is_violence_risk ? (
              /* 긴급 */
              <>
                <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">지금 바로 선생님께 알렸어요</h3>
                  <p className="text-slate-500 mt-1.5 text-sm">
                    선생님이 곧 도움을 줄 거예요. 조금만 기다려줘요. 잘 말해줬어요.
                  </p>
                </div>
              </>
            ) : (
              /* 일반 */
              <>
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">전달했어요</h3>
                  <p className="text-slate-500 mt-1.5 text-sm">
                    선생님이 도움을 드릴 거예요. 잘 말해줬어요.
                  </p>
                </div>
              </>
            )}

            <button
              onClick={() => { setStage('form'); setContent(''); setCategory(null); setResult(null); }}
              className="btn-secondary w-full"
            >
              처음으로 돌아가기
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
