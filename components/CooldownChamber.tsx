'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';

interface Message {
  role: 'ai' | 'user';
  content: string;
  time: string;
}

interface Props {
  onResolved: () => void;
  onProceed: () => void;
}

function now(): string {
  return new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

export function CooldownChamber({ onResolved, onProceed }: Props) {
  const [messages, setMessages] = useState<Message[]>([{
    role: 'ai',
    content: '안녕하세요. 어떤 일이 있으셨나요? 먼저 말씀해주시면 함께 해결방법을 찾아볼게요.',
    time: now(),
  }]);
  const [input, setInput]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [resolved, setResolved]     = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text, time: now() }]);
    setLoading(true);

    try {
      const res = await fetch('/api/complaint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cooldown', content: text }),
      });
      const data = await res.json();

      setMessages(prev => [...prev, {
        role: 'ai',
        content: data.response || '죄송합니다. 잠시 후 다시 시도해주세요.',
        time: now(),
      }]);

      setShowActions(true);
      if (data.resolved) setResolved(true);

    } catch {
      setMessages(prev => [...prev, {
        role: 'ai',
        content: '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        time: now(),
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0">

      {/* 헤더 */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 shrink-0">
        <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center shrink-0">
          <AIIcon />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900">EduShield 도우미</p>
          <p className="text-xs text-emerald-600 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            온라인 · 민원 접수 전 상담
          </p>
        </div>
        <span className="text-xs text-slate-400 hidden sm:block">
          이 단계에서 해결되면 민원이 접수되지 않습니다
        </span>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-0 scrollbar-hide">
        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* 액션 버튼 (AI 응답 후) */}
      {showActions && (
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 shrink-0 animate-fade-in">
          {resolved ? (
            <div className="space-y-2">
              <p className="text-xs text-slate-500 text-center">도움이 되셨나요?</p>
              <button
                onClick={onResolved}
                className="w-full btn-primary py-2.5 text-sm"
              >
                <CheckIcon /> 네, 해결됐어요
              </button>
              <button
                onClick={() => { setShowActions(false); setResolved(false); }}
                className="w-full btn-ghost py-2 text-sm text-slate-500"
              >
                계속 이야기할게요
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-slate-500 text-center">해결이 됐나요, 아니면 정식으로 접수할까요?</p>
              <div className="flex gap-2">
                <button onClick={onResolved} className="flex-1 btn-secondary py-2.5 text-sm">
                  해결됐어요
                </button>
                <button onClick={onProceed} className="flex-1 btn-primary py-2.5 text-sm">
                  정식 접수할게요 →
                </button>
              </div>
              <button
                onClick={() => { setShowActions(false); }}
                className="w-full btn-ghost py-1.5 text-xs text-slate-400"
              >
                더 얘기할게요
              </button>
            </div>
          )}
        </div>
      )}

      {/* 입력 영역 */}
      {!showActions && (
        <div className="px-5 py-4 border-t border-slate-100 shrink-0">
          <div className="flex gap-2.5 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="불편하셨던 점을 편하게 말씀해 주세요..."
              rows={2}
              disabled={loading}
              className="flex-1 input resize-none py-2.5 text-sm leading-relaxed"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="btn-primary px-4 py-2.5 shrink-0 self-end"
              aria-label="전송"
            >
              <SendIcon />
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Enter로 전송 · Shift+Enter로 줄바꿈
          </p>
        </div>
      )}
    </div>
  );
}

/* ── 하위 컴포넌트 ─────────────────────────────── */

function MessageBubble({ msg }: { msg: Message }) {
  const isAI = msg.role === 'ai';
  return (
    <div className={`flex gap-2.5 animate-fade-in ${isAI ? '' : 'flex-row-reverse'}`}>
      {isAI && (
        <div className="w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center shrink-0 mt-0.5">
          <AIIconSm />
        </div>
      )}
      <div className={`max-w-[78%] ${isAI ? '' : 'items-end flex flex-col'}`}>
        <div className={isAI ? 'bubble-ai' : 'bubble-user'}>
          {msg.content}
        </div>
        <p className="text-xs text-slate-400 mt-1 px-1">{msg.time}</p>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-2.5 animate-fade-in">
      <div className="w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center shrink-0">
        <AIIconSm />
      </div>
      <div className="bubble-ai flex gap-1.5 items-center py-3.5 px-4">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce-dot"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  );
}

/* ── 아이콘 ────────────────────────────────────── */
function AIIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
    </svg>
  );
}

function AIIconSm() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
