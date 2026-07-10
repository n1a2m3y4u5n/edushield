'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { TeacherAlert } from '@/components/TeacherAlert';

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

type FilterType = 'all' | 'info_request' | 'urgent' | 'violence';
const TYPE_ORDER: Record<string, number> = { violence: 0, urgent: 1, info_request: 2 };

export default function TeacherPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread,        setUnread]        = useState(0);
  const [filter,        setFilter]        = useState<FilterType>('all');
  const [loading,       setLoading]       = useState(true);
  const [updatedAt,     setUpdatedAt]     = useState('');

  const loadNotifications = useCallback(async () => {
    try {
      const res  = await fetch('/api/notifications');
      const data = await res.json();
      const sorted = (data.notifications ?? []).sort((a: Notification, b: Notification) => {
        const ao = TYPE_ORDER[a.type] ?? 9;
        const bo = TYPE_ORDER[b.type] ?? 9;
        return ao !== bo
          ? ao - bo
          : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      setNotifications(sorted);
      setUnread(data.unreadCount ?? 0);
      setUpdatedAt(new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    const id = setInterval(loadNotifications, 15_000);
    return () => clearInterval(id);
  }, [loadNotifications]);

  async function handleRespond(complaintId: number, response: string) {
    const res = await fetch('/api/teacher-response', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ complaintId, teacherResponse: response }),
    });
    if (!res.ok) throw new Error('전송 실패');
    await loadNotifications();
  }

  async function markAllRead() {
    await fetch('/api/mark-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'all' }),
    });
    await loadNotifications();
  }

  const hasViolence = notifications.some(n => n.type === 'violence' && !n.is_read);
  const hasUrgent   = notifications.some(n => n.type === 'urgent'   && !n.is_read);

  const counts = {
    all:          notifications.length,
    info_request: notifications.filter(n => n.type === 'info_request').length,
    urgent:       notifications.filter(n => n.type === 'urgent').length,
    violence:     notifications.filter(n => n.type === 'violence').length,
  };

  const filtered = filter === 'all' ? notifications : notifications.filter(n => n.type === filter);
  const burnoutScore = Math.min(counts.info_request / 10, 1.0);

  const filterLabels: Record<FilterType, string> = {
    all: '전체 알림', violence: '학폭 경보', urgent: '긴급 알림', info_request: '정보 요청',
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">

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
          <span className="text-blue-200 text-sm">교사 포털</span>
          <div className="ml-auto flex items-center gap-3">
            {unread > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full animate-pulse">
                {unread}개 미확인
              </span>
            )}
            <Link href="/dashboard" className="text-blue-200 hover:text-white text-sm transition-colors">대시보드</Link>
          </div>
        </div>
      </header>

      {/* 경보 배너 */}
      {hasViolence && (
        <div className="bg-red-600 text-white px-6 py-3 flex items-center justify-center gap-2 text-sm font-semibold">
          <svg className="w-4 h-4 animate-pulse shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          학교폭력 위험 신호가 감지되었습니다. 즉각 확인이 필요합니다.
        </div>
      )}
      {hasUrgent && !hasViolence && (
        <div className="bg-orange-500 text-white px-6 py-3 flex items-center justify-center gap-2 text-sm font-semibold">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          긴급 사안이 있습니다. 확인 후 조치해주세요.
        </div>
      )}

      <div className="flex flex-1 max-w-6xl mx-auto w-full px-4 py-8 gap-6">

        {/* 사이드바 */}
        <aside className="hidden md:flex w-56 shrink-0 flex-col gap-4">
          <div className="card p-3">
            <p className="label px-2 mb-3">알림 유형</p>
            {(['all', 'violence', 'urgent', 'info_request'] as FilterType[]).map(key => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all mb-0.5 ${
                  filter === key ? 'sidebar-link-active' : 'sidebar-link'
                }`}
              >
                <span>{{ all: '전체', violence: '학폭 경보', urgent: '긴급', info_request: '정보 요청' }[key]}</span>
                {counts[key] > 0 && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    filter === key ? 'bg-brand-500 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {counts[key]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* 번아웃 지수 */}
          <div className="card p-4 space-y-3">
            <div>
              <p className="label mb-0.5">번아웃 지수</p>
              <p className="text-xs text-slate-400">이번 주 요청 건수 기준</p>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-600">내 지수</span>
                <span className={`font-bold ${burnoutScore > 0.7 ? 'text-red-600' : burnoutScore > 0.4 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {Math.round(burnoutScore * 100)}%
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    burnoutScore > 0.7 ? 'bg-red-500' : burnoutScore > 0.4 ? 'bg-amber-400' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.max(burnoutScore * 100, 4)}%` }}
                />
              </div>
              <p className="text-xs text-slate-400">
                {burnoutScore > 0.7 ? '위험 — 관리자 확인 권장' : burnoutScore > 0.4 ? '주의 필요' : '양호'}
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4">
            <p className="text-xs font-bold text-emerald-800 mb-2">교사 보호 원칙</p>
            <p className="text-xs text-emerald-700 leading-relaxed">
              일반 민원 원문은 전달되지 않습니다. 긴급·학폭 건에만 원문이 공개됩니다.
            </p>
          </div>
        </aside>

        {/* 메인 */}
        <main className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-xl font-bold text-slate-900">{filterLabels[filter]}</h1>
              <p className="text-xs text-slate-400 mt-0.5">{updatedAt} 기준 · 15초 자동 갱신</p>
            </div>
            {unread > 0 && (
              <button onClick={markAllRead} className="btn-ghost text-sm py-2 border border-slate-200">
                모두 읽음
              </button>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map(i => (
                <div key={i} className="card p-5 animate-pulse space-y-3">
                  <div className="h-4 bg-slate-100 rounded w-24" />
                  <div className="h-4 bg-slate-100 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className="space-y-3">
              {filtered.map(n => (
                <TeacherAlert key={n.id} notification={n} onRespond={handleRespond} />
              ))}
            </div>
          ) : (
            <div className="card p-16 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <p className="font-semibold text-slate-700">처리할 알림이 없습니다</p>
              <p className="text-sm text-slate-400 mt-1">새 민원이 접수되면 자동으로 표시됩니다</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
