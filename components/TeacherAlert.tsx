'use client';

import { useState } from 'react';

interface Notification {
  id: number;
  complaint_id: number;
  summary: string;
  type: string;
  is_read: number;
  query: string | null;
  teacher_response: string | null;
  content: string | null;
  status: string;
  created_at: string;
}

const TYPE_CONFIG = {
  info_request: {
    label:   '정보 요청',
    badge:   'badge-b',
    card:    'border-blue-100 bg-white',
    accent:  'text-blue-600',
  },
  urgent: {
    label:   '긴급',
    badge:   'badge-d',
    card:    'border-orange-200 bg-orange-50/40',
    accent:  'text-orange-600',
  },
  violence: {
    label:   '학폭 경보',
    badge:   'badge-c',
    card:    'border-red-200 bg-red-50/40',
    accent:  'text-red-600',
  },
} as const;

function formatDate(s: string) {
  return new Date(s).toLocaleString('ko-KR', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function TeacherAlert({
  notification,
  onRespond,
}: {
  notification: Notification;
  onRespond: (complaintId: number, response: string) => Promise<void>;
}) {
  const [responseText, setResponseText] = useState('');
  const [submitting,   setSubmitting]   = useState(false);
  const [done,         setDone]         = useState(!!notification.teacher_response);

  const cfg = TYPE_CONFIG[notification.type as keyof typeof TYPE_CONFIG] ?? {
    label: notification.type, badge: 'badge', card: 'border-slate-200 bg-white', accent: 'text-slate-600',
  };

  async function handleSubmit() {
    if (!responseText.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onRespond(notification.complaint_id, responseText);
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={`card border-2 ${cfg.card} p-5 space-y-4 animate-slide-up`}>

      {/* 헤더 */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cfg.badge}>{cfg.label}</span>
          {!notification.is_read && (
            <span className="badge bg-brand-500 text-white border-brand-600">NEW</span>
          )}
          {done && (
            <span className="badge bg-emerald-50 text-emerald-700 border-emerald-200">처리완료</span>
          )}
        </div>
        <span className="text-xs text-slate-400 whitespace-nowrap shrink-0">
          {formatDate(notification.created_at)}
        </span>
      </div>

      {/* 요약 */}
      <p className="text-sm font-semibold text-slate-800 leading-snug">
        {notification.summary}
      </p>

      {/* 긴급·학폭: 원문 노출 */}
      {(notification.type === 'urgent' || notification.type === 'violence') && notification.content && (
        <div className={`rounded-xl px-4 py-3 border text-sm leading-relaxed text-slate-700 ${
          notification.type === 'violence'
            ? 'bg-red-50 border-red-200'
            : 'bg-orange-50 border-orange-200'
        }`}>
          <p className={`text-xs font-semibold uppercase tracking-wide mb-1.5 ${cfg.accent}`}>
            학부모 원문
          </p>
          {notification.content}
        </div>
      )}

      {/* B타입: 정보 입력 요청 */}
      {notification.type === 'info_request' && notification.query && (
        <div className="bg-blue-50 rounded-xl px-4 py-3 border border-blue-100">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">요청 항목</p>
          <p className="text-sm text-slate-700">{notification.query}</p>
        </div>
      )}

      {/* B타입: 입력 폼 */}
      {notification.type === 'info_request' && !done && (
        <div className="space-y-3">
          <textarea
            value={responseText}
            onChange={e => setResponseText(e.target.value)}
            placeholder="해당 정보를 입력하세요. 학부모에게는 가공된 답변만 전달됩니다."
            rows={3}
            className="input resize-none text-sm"
          />
          <button
            onClick={handleSubmit}
            disabled={submitting || !responseText.trim()}
            className="btn-primary text-sm py-2"
          >
            {submitting ? '전송 중…' : '정보 전송 →'}
          </button>
        </div>
      )}

      {/* D타입: 확인 버튼 */}
      {notification.type === 'urgent' && !done && (
        <button
          onClick={() => setDone(true)}
          className="btn-md bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700 focus-visible:ring-orange-500 text-sm py-2"
        >
          확인 완료
        </button>
      )}

      {/* 학폭: 확인 버튼 */}
      {notification.type === 'violence' && !done && (
        <button
          onClick={() => setDone(true)}
          className="btn-danger text-sm py-2"
        >
          확인 및 조치 완료
        </button>
      )}

      {/* 완료 메시지 */}
      {done && (
        <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 px-4 py-2.5 rounded-xl border border-emerald-200">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          처리가 완료되었습니다
        </div>
      )}
    </div>
  );
}
