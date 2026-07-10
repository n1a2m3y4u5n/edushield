'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { use } from 'react';

interface StatusResult {
  id: number;
  type: string;
  status: string;
  response: string | null;
  resolved: boolean;
  created_at: string;
}

export default function StatusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [result, setResult] = useState<StatusResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [dotCount, setDotCount] = useState(0);

  useEffect(() => {
    fetchStatus();
    // 미처리 상태면 10초마다 폴링
    const pollInterval = setInterval(fetchStatus, 10000);
    // 대기 중 점 애니메이션
    const dotInterval = setInterval(() => setDotCount((d) => (d + 1) % 4), 600);
    return () => { clearInterval(pollInterval); clearInterval(dotInterval); };
  }, [id]);

  async function fetchStatus() {
    try {
      const res = await fetch(`/api/complaint-status?id=${id}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setResult(data);
    } catch {
      setError('서버와 연결할 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }

  const dots = '.'.repeat(dotCount);

  return (
    <main className="min-h-screen">
      <header className="bg-[#1B4F8A] text-white py-5 px-8 shadow-md">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/parent" className="text-blue-200 hover:text-white text-sm transition-colors">← 민원 접수로</Link>
          <span className="text-blue-300">|</span>
          <h1 className="text-xl font-bold">민원 처리 현황</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto py-10 px-6 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 space-y-6">
          {/* 접수 번호 */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <span className="text-sm text-gray-500">접수 번호</span>
            <span className="font-bold text-gray-800 text-lg">#{id}</span>
          </div>

          {loading && (
            <div className="text-center py-8 text-gray-400">조회 중...</div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
          )}

          {result && (
            <>
              {/* 처리 상태 스텝 */}
              <StatusStepper status={result.status} type={result.type} />

              {/* 대기 중 안내 */}
              {!result.resolved && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl px-6 py-5 text-center space-y-2">
                  <p className="text-blue-800 font-semibold text-lg">담당 교사 확인 중{dots}</p>
                  <p className="text-blue-600 text-sm">답변이 완료되면 이 페이지에 자동으로 표시됩니다.<br/>페이지를 닫아도 나중에 다시 접수 번호로 확인할 수 있습니다.</p>
                  <p className="text-blue-400 text-xs mt-2">10초마다 자동 갱신 중</p>
                </div>
              )}

              {/* 답변 완료 */}
              {result.resolved && result.response && (
                <div className="bg-green-50 border border-green-200 rounded-xl px-6 py-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">✓</span>
                    <p className="text-green-800 font-semibold">답변이 완료되었습니다</p>
                  </div>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{result.response}</p>
                  <p className="text-xs text-gray-400">접수일시: {new Date(result.created_at).toLocaleString('ko-KR')}</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="text-center">
          <Link href="/parent" className="text-[#1B4F8A] text-sm hover:underline">새 민원 접수하기</Link>
        </div>
      </div>
    </main>
  );
}

function StatusStepper({ status, type }: { status: string; type: string }) {
  const steps = [
    { key: 'received', label: '접수 완료' },
    { key: 'processing', label: '교사 확인 중' },
    { key: 'resolved', label: '답변 완료' },
  ];

  const currentStep =
    status === 'resolved' ? 2 :
    type === 'B' && status === 'pending' ? 1 : 0;

  return (
    <div className="flex items-center justify-between">
      {steps.map((step, i) => (
        <div key={step.key} className="flex items-center flex-1">
          <div className="flex flex-col items-center gap-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
              i <= currentStep ? 'bg-[#1B4F8A] text-white' : 'bg-gray-100 text-gray-400'
            }`}>
              {i < currentStep ? '✓' : i + 1}
            </div>
            <span className={`text-xs whitespace-nowrap ${i <= currentStep ? 'text-[#1B4F8A] font-medium' : 'text-gray-400'}`}>
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mx-2 mb-4 ${i < currentStep ? 'bg-[#1B4F8A]' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}
