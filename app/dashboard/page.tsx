'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { TypeDonutChart, TypeLegend, EmotionBarChart } from '@/components/DashboardCharts';

interface DashboardData {
  todayTotal:          number;
  totalAll:            number;
  byType:              Record<string, number>;
  emotionDistribution: Record<string, number>;
  violenceCount:       number;
  preemptiveAlerts:    Array<{ id: number; message: string; created_at: string }>;
  autoResolveRate:     number;
  burnoutList:         Array<{ label: string; count: number; score: number }>;
  pendingB:            number;
  blocked:             number;
  unreadNotifications: number;
  studentReports:      number;
}

function emptyData(): DashboardData {
  return {
    todayTotal: 0, totalAll: 0, byType: {}, emotionDistribution: {},
    violenceCount: 0, preemptiveAlerts: [], autoResolveRate: 0,
    burnoutList: [], pendingB: 0, blocked: 0, unreadNotifications: 0, studentReports: 0,
  };
}

export default function DashboardPage() {
  const [data,          setData]          = useState<DashboardData>(emptyData());
  const [loading,       setLoading]       = useState(true);
  const [generating,    setGenerating]    = useState(false);
  const [genResult,     setGenResult]     = useState<string[]>([]);
  const [updatedAt,     setUpdatedAt]     = useState('');
  const [angerAlert,    setAngerAlert]    = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard');
      const json: DashboardData = await res.json();
      setData(json);
      setUpdatedAt(new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }));
      const angerCount = json.emotionDistribution['분노'] ?? 0;
      const total = Object.values(json.emotionDistribution).reduce((a, b) => a + b, 0);
      setAngerAlert(total > 0 && angerCount / total > 0.3);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const id = setInterval(loadData, 30_000);
    return () => clearInterval(id);
  }, [loadData]);

  async function handleGenerateAlerts() {
    setGenerating(true);
    setGenResult([]);
    try {
      const res  = await fetch('/api/preemptive', { method: 'POST' });
      const json = await res.json();
      setGenResult((json.alerts ?? []).map((a: { message: string }) => a.message));
      await loadData();
    } finally {
      setGenerating(false);
    }
  }

  const totalByType   = Object.values(data.byType).reduce((a, b) => a + b, 0);
  const teacherSaved  = (data.byType['A'] ?? 0) + (data.byType['C'] ?? 0);
  const teacherRate   = totalByType > 0 ? Math.round(teacherSaved / totalByType * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-brand-500 text-white">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-3">
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
          <span className="text-blue-200 text-sm">관리자 대시보드</span>
          <div className="ml-auto flex items-center gap-4 text-sm">
            {data.violenceCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full animate-pulse">
                학폭 경보 {data.violenceCount}건
              </span>
            )}
            {data.unreadNotifications > 0 && (
              <span className="bg-amber-400 text-amber-900 text-xs font-bold px-2.5 py-0.5 rounded-full">
                미확인 {data.unreadNotifications}건
              </span>
            )}
            <Link href="/teacher" className="text-blue-200 hover:text-white transition-colors">교사 포털</Link>
            <Link href="/parent"  className="text-blue-200 hover:text-white transition-colors">학부모 포털</Link>
          </div>
        </div>
      </header>

      {/* 분노 경보 배너 */}
      {angerAlert && (
        <div className="bg-red-600 text-white px-6 py-3 flex items-center justify-center gap-2 text-sm font-semibold">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          </svg>
          학부모 분노 감정 비율이 30%를 초과했습니다. 즉각 대응이 필요합니다.
        </div>
      )}

      <div className="max-w-7xl mx-auto w-full px-4 py-8 space-y-6">

        {/* 페이지 타이틀 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">현황 대시보드</h1>
            <p className="text-sm text-slate-400 mt-0.5">{updatedAt} 기준 · 30초 자동 갱신</p>
          </div>
          <button onClick={loadData} className="btn-ghost border border-slate-200 text-sm py-2">
            새로고침
          </button>
        </div>

        {/* ── KPI 카드 4개 ─────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            value={data.todayTotal}
            label="오늘 접수"
            unit="건"
            sub="전체 민원 기준"
            color="blue"
            loading={loading}
          />
          <KpiCard
            value={data.autoResolveRate}
            label="자동 해결율"
            unit="%"
            sub="A타입 / 전체"
            color="green"
            loading={loading}
          />
          <KpiCard
            value={teacherRate}
            label="교사 미개입율"
            unit="%"
            sub="A+C타입 기준"
            color="purple"
            loading={loading}
          />
          <KpiCard
            value={data.blocked}
            label="차단된 민원"
            unit="건"
            sub="악성·반복 민원"
            color="red"
            loading={loading}
          />
        </div>

        {/* ── 차트 영역 ─────────────────────────────── */}
        <div className="grid md:grid-cols-2 gap-4">

          {/* 민원 유형 도넛 */}
          <div className="card p-5">
            <h3 className="font-semibold text-slate-800 mb-4">민원 유형 분포</h3>
            {loading ? (
              <div className="h-48 bg-slate-50 rounded-xl animate-pulse" />
            ) : (
              <>
                <TypeDonutChart data={data.byType} />
                <TypeLegend data={data.byType} />
              </>
            )}
          </div>

          {/* 감정 분포 바 */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">학부모 감정 분포</h3>
              {angerAlert && (
                <span className="badge badge-c">분노 30% 초과</span>
              )}
            </div>
            {loading ? (
              <div className="h-40 bg-slate-50 rounded-xl animate-pulse" />
            ) : (
              <EmotionBarChart data={data.emotionDistribution} />
            )}
          </div>
        </div>

        {/* ── 하단 3열 ──────────────────────────────── */}
        <div className="grid md:grid-cols-3 gap-4">

          {/* 학교폭력 경보 */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">학교폭력 경보</h3>
              {data.violenceCount > 0 && (
                <span className="badge badge-c">{data.violenceCount}건 감지</span>
              )}
            </div>
            {data.violenceCount > 0 ? (
              <div className="rounded-xl bg-red-50 border border-red-200 p-4 space-y-1.5">
                <p className="text-sm font-semibold text-red-800">즉각 확인 필요</p>
                <p className="text-xs text-red-600 leading-relaxed">
                  AI가 학생 보고 또는 민원에서 학폭 위험 신호를 감지했습니다.
                  교사 포털에서 상세 내용을 확인해주세요.
                </p>
                <Link href="/teacher" className="text-xs font-semibold text-red-700 underline">
                  교사 포털 바로가기 →
                </Link>
              </div>
            ) : (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
                <p className="text-sm font-semibold text-emerald-800">이상 없음</p>
                <p className="text-xs text-emerald-600 mt-0.5">현재 감지된 위험 신호가 없습니다.</p>
              </div>
            )}
            <div className="text-xs text-slate-500">
              학생 자기보고 {data.studentReports}건 접수됨
            </div>
          </div>

          {/* 선제 알림 */}
          <div className="card p-5 space-y-4">
            <h3 className="font-semibold text-slate-800">선제 알림</h3>
            <button
              onClick={handleGenerateAlerts}
              disabled={generating}
              className="btn-outline w-full text-sm py-2"
            >
              {generating ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
                    <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
                  </svg>
                  생성 중…
                </>
              ) : (
                'NEIS 기반 선제 알림 생성'
              )}
            </button>

            {genResult.length > 0 && (
              <div className="space-y-2">
                {genResult.map((msg, i) => (
                  <div key={i} className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5 text-xs text-blue-700 leading-relaxed">
                    {msg}
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              {data.preemptiveAlerts.slice(0, 3).map(alert => (
                <div key={alert.id} className="flex gap-2 text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0 mt-1" />
                  <span className="text-slate-600 leading-relaxed">{alert.message}</span>
                </div>
              ))}
              {data.preemptiveAlerts.length === 0 && (
                <p className="text-xs text-slate-400">최근 생성된 알림이 없습니다.</p>
              )}
            </div>
          </div>

          {/* 번아웃 위험 교사 */}
          <div className="card p-5 space-y-4">
            <h3 className="font-semibold text-slate-800">교사 번아웃 현황</h3>
            {data.burnoutList.length > 0 ? (
              <div className="space-y-3">
                {data.burnoutList.slice(0, 5).map(teacher => (
                  <div key={teacher.label} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600 font-medium">{teacher.label}</span>
                      <span className={`font-bold ${
                        teacher.score > 0.7 ? 'text-red-600' : teacher.score > 0.4 ? 'text-amber-600' : 'text-emerald-600'
                      }`}>
                        {Math.round(teacher.score * 100)}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          teacher.score > 0.7 ? 'bg-red-500' : teacher.score > 0.4 ? 'bg-amber-400' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.max(teacher.score * 100, 4)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">데이터가 없습니다.</p>
            )}
            <p className="text-xs text-slate-400">교사 정보는 익명으로 처리됩니다.</p>
          </div>
        </div>

        {/* ── 대기 중 B타입 ─────────────────────────── */}
        {data.pendingB > 0 && (
          <div className="card p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <div>
                <p className="font-semibold text-slate-800">교사 확인 대기 중</p>
                <p className="text-sm text-slate-500">{data.pendingB}건의 B타입 민원이 교사 응답을 기다리고 있습니다.</p>
              </div>
            </div>
            <Link href="/teacher" className="btn-outline text-sm py-2 shrink-0">
              교사 포털에서 확인 →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── KPI 카드 컴포넌트 ─────────────────────────── */
function KpiCard({ value, label, unit, sub, color, loading }: {
  value: number; label: string; unit: string; sub: string;
  color: 'blue' | 'green' | 'purple' | 'red'; loading: boolean;
}) {
  const colorMap = {
    blue:   'text-blue-600 bg-blue-50',
    green:  'text-emerald-600 bg-emerald-50',
    purple: 'text-violet-600 bg-violet-50',
    red:    'text-red-600 bg-red-50',
  };
  return (
    <div className="stat-card">
      <p className="label">{label}</p>
      {loading ? (
        <div className="h-8 bg-slate-100 rounded animate-pulse w-24 my-1" />
      ) : (
        <p className={`text-3xl font-bold ${colorMap[color].split(' ')[0]}`}>
          {value.toLocaleString()}<span className="text-base font-semibold ml-0.5">{unit}</span>
        </p>
      )}
      <p className="text-xs text-slate-400">{sub}</p>
    </div>
  );
}
