import Link from 'next/link';
import { getDb } from '@/lib/db';

async function getStats() {
  try {
    const db = getDb();
    const total   = (db.prepare(`SELECT COUNT(*) as n FROM complaints`).get() as { n: number }).n;
    const today   = (db.prepare(`SELECT COUNT(*) as n FROM complaints WHERE date(created_at)=date('now')`).get() as { n: number }).n;
    const blocked = (db.prepare(`SELECT COUNT(*) as n FROM complaints WHERE status='blocked'`).get() as { n: number }).n;
    const typeA   = (db.prepare(`SELECT COUNT(*) as n FROM complaints WHERE type='A'`).get() as { n: number }).n;
    const rate    = total > 0 ? Math.round(typeA / total * 100) : 0;
    return { total, today, blocked, rate };
  } catch {
    return { total: 0, today: 0, blocked: 0, rate: 0 };
  }
}

export default async function HomePage() {
  const stats = await getStats();

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* ── 네비게이션 ─────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-500 rounded-xl flex items-center justify-center">
              <ShieldIcon />
            </div>
            <span className="font-bold text-slate-900 text-lg tracking-tight">EduShield</span>
            <span className="hidden sm:inline text-xs bg-brand-50 text-brand-600 border border-brand-200 px-2 py-0.5 rounded-full font-semibold">Beta</span>
          </div>
          <div className="flex items-center gap-1">
            <Link href="/parent"    className="nav-link hidden sm:block">학부모</Link>
            <Link href="/teacher"   className="nav-link hidden sm:block">교사</Link>
            <Link href="/student"   className="nav-link hidden sm:block">학생</Link>
            <Link href="/dashboard" className="btn-primary btn-sm ml-2">
              대시보드 <ArrowIcon />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── 히어로 ─────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#071529] via-brand-500 to-[#1e40af]">
        {/* 배경 패턴 */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}
        />
        <div className="relative max-w-5xl mx-auto px-6 py-24 md:py-32 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm text-white/90 mb-8">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            2024 교육부 교육 공공데이터 AI활용대회 출품작
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight mb-6">
            교사와 학부모 사이,<br />
            <span className="text-blue-200">AI가 현명하게 중재합니다</span>
          </h1>
          <p className="text-blue-100 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
            학부모 민원이 교사에게 직접 전달되지 않습니다.
            AI가 분류·답변하고, 교사는 꼭 필요한 정보만 받습니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/parent"
              className="btn-lg bg-white text-brand-500 hover:bg-blue-50 active:bg-blue-100 shadow-card-lg">
              민원 접수해보기
            </Link>
            <Link href="/dashboard"
              className="btn-lg bg-white/10 border border-white/30 text-white hover:bg-white/20">
              대시보드 보기 <ArrowIcon />
            </Link>
          </div>
        </div>

        {/* 통계 바 */}
        <div className="relative bg-black/20 backdrop-blur-sm border-t border-white/10">
          <div className="max-w-4xl mx-auto px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <StatItem value={stats.total}   unit="건" label="전체 민원" />
            <StatItem value={stats.today}   unit="건" label="오늘 접수" highlight />
            <StatItem value={stats.rate}    unit="%" label="자동 처리율" />
            <StatItem value={stats.blocked} unit="건" label="차단된 악성 민원" />
          </div>
        </div>
      </section>

      {/* ── 문제 정의 ──────────────────────────── */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="label text-brand-500 mb-3">Problem</p>
            <h2 className="text-3xl font-bold text-slate-900">왜 지금 이 플랫폼이 필요한가</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            <ProblemCard
              stat="2.3배"
              label="교원 민원 증가율"
              desc="2019년 대비 2023년 학교 민원 약 2.3배 증가. 교사 번아웃의 주요 원인이 되고 있습니다."
              color="red"
            />
            <ProblemCard
              stat="68%"
              label="즉시 해결 가능 민원"
              desc="전체 민원의 68%는 NEIS 공공데이터로 즉시 답변 가능한 단순 정보 문의입니다."
              color="blue"
            />
            <ProblemCard
              stat="0건"
              label="교사 직접 노출 목표"
              desc="EduShield 도입 시 교사에게 직접 전달되는 민원 수를 0으로 줄이는 것이 목표입니다."
              color="green"
            />
          </div>
        </div>
      </section>

      {/* ── 처리 흐름 ──────────────────────────── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="label text-brand-500 mb-3">How it works</p>
            <h2 className="text-3xl font-bold text-slate-900">4단계 AI 처리 흐름</h2>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { n: '01', title: '쿨다운 챔버',  desc: '민원 전 AI 상담으로 감정 안정. 상당수 민원이 이 단계에서 해결됩니다.' },
              { n: '02', title: 'AI 즉시 분류', desc: 'Claude AI가 A/B/C/D 4타입으로 분류. NEIS 공공데이터 자동 연동.' },
              { n: '03', title: '자동 처리',    desc: 'A타입 즉시 답변, C타입 차단, D타입 긴급 알림. 교사 개입 최소화.' },
              { n: '04', title: '결과 전달',    desc: '학부모에겐 정중한 답변, 교사에겐 요약 알림만. 원문은 전달하지 않습니다.' },
            ].map((item) => (
              <div key={item.n} className="card p-5 space-y-3 hover:shadow-card-md transition-shadow">
                <span className="text-xs font-black text-brand-300 tracking-widest">{item.n}</span>
                <h3 className="font-bold text-slate-800 text-sm">{item.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 분류 체계 ──────────────────────────── */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="label text-brand-500 mb-3">Classification</p>
            <h2 className="text-3xl font-bold text-slate-900">4가지 민원 분류 체계</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                type: 'A',
                badge: 'badge-a',
                title: '즉시 답변',
                desc: 'NEIS 공공데이터(급식·학사일정·시간표)를 기반으로 AI가 즉시 답변. 교사 개입이 전혀 없습니다.',
                bg: 'bg-emerald-50 border-emerald-200',
              },
              {
                type: 'B',
                badge: 'badge-b',
                title: '교사 확인 후 답변',
                desc: '성적·생활태도 등 교사만 아는 정보가 필요한 경우. 교사에게는 요청 정보만 최소로 전달됩니다.',
                bg: 'bg-blue-50 border-blue-200',
              },
              {
                type: 'C',
                badge: 'badge-c',
                title: '자동 차단',
                desc: '욕설·협박·부당 요구 포함 민원. 정중한 안내 후 공식 채널(국민신문고)로 유도합니다.',
                bg: 'bg-red-50 border-red-200',
              },
              {
                type: 'D',
                badge: 'badge-d',
                title: '긴급 즉시 전달',
                desc: '학생 안전·학교폭력 신호 감지 시 교사에게 원문 포함 즉시 알림을 발송합니다.',
                bg: 'bg-orange-50 border-orange-200',
              },
            ].map((item) => (
              <div key={item.type} className={`rounded-2xl border-2 ${item.bg} p-5 flex gap-4`}>
                <span className={`${item.badge} shrink-0 self-start mt-0.5`}>{item.type}타입</span>
                <div>
                  <h3 className="font-bold text-slate-800 mb-1">{item.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────── */}
      <section className="py-20 px-6 bg-brand-500">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white mb-2">역할에 맞는 포털로 시작하세요</h2>
            <p className="text-blue-200">EduShield는 학부모, 교사, 학생, 관리자 모두를 위한 플랫폼입니다.</p>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            <CtaCard href="/parent"    icon={<ParentIcon />}    title="학부모 포털"   desc="민원·문의 접수"      />
            <CtaCard href="/teacher"   icon={<TeacherIcon />}   title="교사 포털"     desc="알림 확인 및 응답"   />
            <CtaCard href="/student"   icon={<StudentIcon />}   title="학생 채널"     desc="익명 상담·신고"      />
            <CtaCard href="/dashboard" icon={<DashboardIcon />} title="관리자 대시보드" desc="통계·경보 모니터링" primary />
          </div>
        </div>
      </section>

      {/* ── 푸터 ───────────────────────────────── */}
      <footer className="bg-slate-900 text-slate-400 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-brand-500 rounded-lg flex items-center justify-center">
              <ShieldIcon sm />
            </div>
            <span className="font-bold text-slate-200">EduShield</span>
          </div>
          <p className="text-sm text-center">
            2024 교육부 교육 공공데이터 AI활용대회 출품작 ·{' '}
            <span className="text-slate-300">NEIS 공공 API</span> 연동 ·{' '}
            <span className="text-slate-300">Claude AI</span> 기반
          </p>
          <p className="text-xs text-slate-600">© 2024 EduShield</p>
        </div>
      </footer>
    </div>
  );
}

/* ── 서브 컴포넌트 ─────────────────────────────── */

function StatItem({ value, unit, label, highlight }: {
  value: number; unit: string; label: string; highlight?: boolean;
}) {
  return (
    <div>
      <p className={`text-3xl font-bold ${highlight ? 'text-yellow-300' : 'text-white'}`}>
        {value.toLocaleString()}{unit}
      </p>
      <p className="text-blue-300 text-sm mt-0.5">{label}</p>
    </div>
  );
}

function ProblemCard({ stat, label, desc, color }: {
  stat: string; label: string; desc: string; color: 'red' | 'blue' | 'green';
}) {
  const colors = {
    red:   'text-red-600 bg-red-50 border border-red-100',
    blue:  'text-blue-600 bg-blue-50 border border-blue-100',
    green: 'text-emerald-600 bg-emerald-50 border border-emerald-100',
  };
  return (
    <div className={`rounded-2xl p-6 space-y-2 ${colors[color]}`}>
      <p className="text-4xl font-extrabold">{stat}</p>
      <p className="font-bold text-slate-800">{label}</p>
      <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
    </div>
  );
}

function CtaCard({ href, icon, title, desc, primary }: {
  href: string; icon: React.ReactNode; title: string; desc: string; primary?: boolean;
}) {
  return (
    <Link href={href} className={`block rounded-2xl p-6 text-center transition-all hover:-translate-y-1 ${
      primary
        ? 'bg-white text-brand-500 shadow-card-md hover:shadow-card-lg'
        : 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
    }`}>
      <div className={`w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center ${primary ? 'bg-brand-50' : 'bg-white/20'}`}>
        {icon}
      </div>
      <h3 className={`font-bold text-sm mb-1 ${primary ? 'text-brand-600' : 'text-white'}`}>{title}</h3>
      <p className={`text-xs ${primary ? 'text-brand-400' : 'text-blue-200'}`}>{desc}</p>
    </Link>
  );
}

/* ── 아이콘 ────────────────────────────────────── */
function ShieldIcon({ sm }: { sm?: boolean }) {
  const s = sm ? 12 : 16;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}
function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
  );
}
function ParentIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
}
function TeacherIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>;
}
function StudentIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>;
}
function DashboardIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1B4F8A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
}
