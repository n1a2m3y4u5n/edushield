'use client';

import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';

/* ── 타입 분포 도넛 차트 ─────────────────────── */
const TYPE_COLORS: Record<string, string> = {
  A: '#16A34A',
  B: '#2563EB',
  C: '#DC2626',
  D: '#EA580C',
};
const TYPE_LABELS: Record<string, string> = {
  A: '즉시답변',
  B: '교사확인',
  C: '차단',
  D: '긴급',
};

interface TypeChartProps {
  data: Record<string, number>;
}

export function TypeDonutChart({ data }: TypeChartProps) {
  const chartData = Object.entries(data)
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({
      name: TYPE_LABELS[key] ?? key,
      value,
      key,
    }));

  if (chartData.length === 0) {
    return <EmptyChart label="민원 데이터 없음" />;
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={56}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
        >
          {chartData.map((entry) => (
            <Cell key={entry.key} fill={TYPE_COLORS[entry.key] ?? '#94A3B8'} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => [`${value}건`]}
          contentStyle={{
            borderRadius: '10px',
            border: '1px solid #E2E8F0',
            fontSize: '12px',
            fontFamily: 'inherit',
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

/* ── 감정 분포 바 차트 ──────────────────────── */
const EMOTION_COLORS: Record<string, string> = {
  긍정: '#16A34A',
  중립: '#94A3B8',
  불안: '#D97706',
  분노: '#DC2626',
};

interface EmotionChartProps {
  data: Record<string, number>;
}

export function EmotionBarChart({ data }: EmotionChartProps) {
  const chartData = Object.entries(data).map(([name, value]) => ({ name, value }));

  if (chartData.length === 0) {
    return <EmptyChart label="감정 데이터 없음" />;
  }

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12, fontFamily: 'inherit', fill: '#64748B' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fontFamily: 'inherit', fill: '#94A3B8' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(value) => [`${value}건`]}
          contentStyle={{
            borderRadius: '10px',
            border: '1px solid #E2E8F0',
            fontSize: '12px',
            fontFamily: 'inherit',
          }}
        />
        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
          {chartData.map((entry) => (
            <Cell key={entry.name} fill={EMOTION_COLORS[entry.name] ?? '#94A3B8'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ── 공통 빈 상태 ────────────────────────────── */
function EmptyChart({ label }: { label: string }) {
  return (
    <div className="h-[160px] flex items-center justify-center text-sm text-slate-400">
      {label}
    </div>
  );
}

/* ── 타입 범례 ───────────────────────────────── */
export function TypeLegend({ data }: TypeChartProps) {
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  return (
    <div className="space-y-2 mt-3">
      {(['A', 'B', 'C', 'D'] as const).map(key => {
        const count = data[key] ?? 0;
        const pct = total > 0 ? Math.round(count / total * 100) : 0;
        return (
          <div key={key} className="flex items-center gap-2.5 text-sm">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ background: TYPE_COLORS[key] }}
            />
            <span className="text-slate-600 flex-1">{TYPE_LABELS[key]}</span>
            <span className="font-semibold text-slate-800">{count}건</span>
            <span className="text-slate-400 text-xs w-8 text-right">{pct}%</span>
          </div>
        );
      })}
    </div>
  );
}
