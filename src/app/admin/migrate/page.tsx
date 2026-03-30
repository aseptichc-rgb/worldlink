'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { migrateGroupConnectionMethods, debugUserConnections, getUserByEmail, onAuthChange, getUser } from '@/lib/firebase-services';
import { ArrowLeft, Loader2, Shield, AlertTriangle, CheckCircle, Search } from 'lucide-react';

const ADMIN_EMAIL = 'kjykjj04@naver.com';

export default function MigratePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, setUser } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        const userData = await getUser(firebaseUser.uid);
        setUser(userData);
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, [setUser]);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<{ fixed: number; groups: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [debugUserId, setDebugUserId] = useState('');
  const [debugResult, setDebugResult] = useState<any>(null);
  const [isDebugging, setIsDebugging] = useState(false);

  const isAdmin = isAuthenticated && user?.email === ADMIN_EMAIL;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <Loader2 size={32} className="text-[#58A6FF] animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <p className="text-[#8B949E]">관리자만 접근 가능합니다.</p>
      </div>
    );
  }

  const handleMigrate = async () => {
    setIsRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await migrateGroupConnectionMethods();
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : '마이그레이션 실패');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] px-4 py-8">
      <div className="max-w-lg mx-auto">
        <button
          onClick={() => router.push('/admin')}
          className="flex items-center gap-2 text-[#8B949E] hover:text-white mb-8"
        >
          <ArrowLeft size={18} />
          어드민으로 돌아가기
        </button>

        <div className="flex items-center gap-3 mb-6">
          <Shield size={24} className="text-[#F0883E]" />
          <h1 className="text-xl font-bold text-white">데이터 마이그레이션</h1>
        </div>

        <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-5 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle size={20} className="text-[#F0883E] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white font-medium mb-1">그룹 연결 method 수정</p>
              <p className="text-[#8B949E] text-sm">
                관리 모임 멤버 간 잘못된 &apos;invite&apos; 연결을 &apos;managed_group&apos;으로 수정합니다.
                이를 통해 다른 모임 멤버가 네트워크에 노출되는 보안 이슈를 해결합니다.
              </p>
            </div>
          </div>

          <button
            onClick={handleMigrate}
            disabled={isRunning}
            className="w-full py-3 bg-[#F0883E] hover:bg-[#F0883E]/90 text-white font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                마이그레이션 실행 중...
              </>
            ) : (
              '마이그레이션 실행'
            )}
          </button>
        </div>

        {result && (
          <div className="bg-[#0D1117] border border-[#3FB950]/30 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle size={20} className="text-[#3FB950]" />
              <p className="text-[#3FB950] font-medium">완료</p>
            </div>
            <p className="text-white text-sm mb-2">수정된 연결: {result.fixed}건</p>
            {result.groups.length > 0 ? (
              <ul className="text-[#8B949E] text-sm space-y-1">
                {result.groups.map((g, i) => (
                  <li key={i}>• {g}</li>
                ))}
              </ul>
            ) : (
              <p className="text-[#8B949E] text-sm">수정이 필요한 데이터가 없습니다.</p>
            )}
          </div>
        )}

        {error && (
          <div className="bg-[#0D1117] border border-[#F85149]/30 rounded-xl p-5">
            <p className="text-[#F85149] text-sm">{error}</p>
          </div>
        )}

        {/* 디버그: 사용자 연결 분석 */}
        <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-5 mt-6">
          <div className="flex items-center gap-2 mb-4">
            <Search size={20} className="text-[#58A6FF]" />
            <p className="text-white font-medium">사용자 연결 디버그</p>
          </div>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={debugUserId}
              onChange={(e) => setDebugUserId(e.target.value)}
              placeholder="User ID 입력"
              className="flex-1 px-3 py-2 bg-[#0D1117] border border-[#30363D] rounded-lg text-white text-sm placeholder-[#484F58] outline-none focus:border-[#58A6FF]"
            />
            <button
              onClick={async () => {
                if (!debugUserId.trim()) return;
                setIsDebugging(true);
                try {
                  let uid = debugUserId.trim();
                  // 이메일인 경우 User ID로 변환
                  if (uid.includes('@')) {
                    const found = await getUserByEmail(uid);
                    if (!found) {
                      setDebugResult({ error: `이메일 "${uid}"에 해당하는 사용자를 찾을 수 없습니다.` });
                      setIsDebugging(false);
                      return;
                    }
                    uid = found.id;
                    setDebugResult({ resolvedUserId: uid, name: found.name, loading: true });
                  }
                  const res = await debugUserConnections(uid);
                  setDebugResult({ userId: uid, ...res });
                } catch (err) {
                  setDebugResult({ error: err instanceof Error ? err.message : '조회 실패' });
                } finally {
                  setIsDebugging(false);
                }
              }}
              disabled={isDebugging}
              className="px-4 py-2 bg-[#58A6FF] text-white text-sm font-medium rounded-lg disabled:opacity-50"
            >
              {isDebugging ? <Loader2 size={16} className="animate-spin" /> : '조회'}
            </button>
          </div>
          {debugResult && (
            <pre className="bg-[#0D1117] border border-[#30363D] rounded-lg p-3 text-xs text-[#8B949E] overflow-auto max-h-96">
              {JSON.stringify(debugResult, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
