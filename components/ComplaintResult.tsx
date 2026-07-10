'use client';

interface Props {
  result: {
    id: number;
    type: 'A' | 'B' | 'C' | 'D';
    response: string;
    emotion: string;
    is_violence_risk: boolean;
    neis_source?: string | null;
    status: string;
  };
  onReset: () => void;
}

const CONFIG = {
  A: {
    wrapClass:   'result-a',
    headerBg:    'bg-emerald-600',
    iconBg:      'bg-emerald-100',
    label:       'A타입 · 즉시 답변',
    headline:    '바로 답변드릴게요',
    subline:     '공공데이터(NEIS)를 기반으로 즉시 답변했습니다. 교사 개입 없이 처리되었습니다.',
    icon:        '✓',
    textColor:   'text-emerald-700',
    badgeClass:  'badge-a',
  },
  B: {
    wrapClass:   'result-b',
    headerBg:    'bg-blue-600',
    iconBg:      'bg-blue-100',
    label:       'B타입 · 교사 확인 중',
    headline:    '담당 교사에게 확인 후 답변드릴게요',
    subline:     '교사에게 필요한 정보만 요청했습니다. 민원 원문은 전달되지 않습니다.',
    icon:        '···',
    textColor:   'text-blue-700',
    badgeClass:  'badge-b',
  },
  C: {
    wrapClass:   'result-c',
    headerBg:    'bg-red-600',
    iconBg:      'bg-red-100',
    label:       'C타입 · 접수 불가',
    headline:    '접수가 어려운 내용입니다',
    subline:     '공식 민원은 국민신문고(epeople.go.kr)를 이용해 주세요.',
    icon:        '×',
    textColor:   'text-red-700',
    badgeClass:  'badge-c',
  },
  D: {
    wrapClass:   'result-d',
    headerBg:    'bg-orange-500',
    iconBg:      'bg-orange-100',
    label:       'D타입 · 긴급 전달',
    headline:    '담당 교사에게 즉시 전달했습니다',
    subline:     '긴급 사안으로 분류되어 교사에게 즉각 알림을 보냈습니다.',
    icon:        '!',
    textColor:   'text-orange-700',
    badgeClass:  'badge-d',
  },
} as const;

export function ComplaintResult({ result, onReset }: Props) {
  const c = CONFIG[result.type];

  return (
    <div className={`${c.wrapClass} animate-slide-up space-y-4`}>

      {/* 타입 헤더 */}
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-2xl ${c.iconBg} flex items-center justify-center shrink-0`}>
          <span className={`text-xl font-black ${c.textColor}`}>{c.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={c.badgeClass}>{c.label}</span>
            {result.neis_source && (
              <span className="badge bg-slate-100 text-slate-600 border-slate-200">
                {result.neis_source}
              </span>
            )}
            {result.is_violence_risk && (
              <span className="badge bg-red-100 text-red-700 border-red-300">
                학폭 위험 감지
              </span>
            )}
          </div>
          <h3 className="font-bold text-slate-900 text-base">{c.headline}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{c.subline}</p>
        </div>
      </div>

      {/* AI 답변 */}
      {result.response && (
        <div className="bg-white/70 rounded-xl p-4 border border-white/80">
          <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">답변 내용</p>
          <p className="text-sm text-slate-800 leading-relaxed">{result.response}</p>
        </div>
      )}

      {/* B타입 대기 안내 */}
      {result.type === 'B' && (
        <div className="flex items-center gap-3 bg-blue-100/60 rounded-xl px-4 py-3">
          <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          <div>
            <p className="text-xs font-semibold text-blue-800">접수번호: #{result.id}</p>
            <p className="text-xs text-blue-600">교사 확인 후 자동으로 답변이 업데이트됩니다. (통상 1~2 영업일)</p>
          </div>
        </div>
      )}

      {/* C타입 안내 링크 */}
      {result.type === 'C' && (
        <a
          href="https://www.epeople.go.kr"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between bg-white/70 rounded-xl px-4 py-3 border border-red-200/60 hover:bg-white/90 transition-colors"
        >
          <span className="text-sm font-medium text-red-700">국민신문고 바로가기</span>
          <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>
      )}

      {/* 감정 지표 (분노/불안 표시) */}
      {(result.emotion === '분노' || result.emotion === '불안') && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <svg className="w-3.5 h-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          감정 분석: <span className="font-medium text-amber-600">{result.emotion}</span> 상태가 감지되었습니다
        </div>
      )}

      {/* 리셋 버튼 */}
      <button onClick={onReset} className="btn-secondary w-full py-2.5 text-sm">
        다른 문의 접수하기
      </button>
    </div>
  );
}
