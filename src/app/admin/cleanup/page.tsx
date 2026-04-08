'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc, query, where, updateDoc } from 'firebase/firestore';

const KEEP_NAMES = ['김재영'];

export default function CleanupPage() {
  const [log, setLog] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [preview, setPreview] = useState<{ keep: string[]; delete: string[] } | null>(null);

  const addLog = (msg: string) => setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const handlePreview = async () => {
    setLog([]);
    addLog('사용자 목록 조회 중...');
    const snap = await getDocs(collection(db, 'users'));
    const keep: string[] = [];
    const toDelete: string[] = [];

    snap.docs.forEach(d => {
      const data = d.data();
      const name = data.name || '(이름없음)';
      const id = d.id;
      if (id.startsWith('demo_') || KEEP_NAMES.includes(name)) {
        keep.push(`${name} (${id})`);
      } else {
        toDelete.push(`${name} (${id})`);
      }
    });

    setPreview({ keep, delete: toDelete });
    addLog(`보존: ${keep.length}명, 삭제 대상: ${toDelete.length}명`);
  };

  const handleDelete = async () => {
    if (!confirm(`정말 ${preview?.delete.length}명의 사용자를 삭제하시겠습니까?`)) return;

    setRunning(true);
    addLog('삭제 시작...');

    const snap = await getDocs(collection(db, 'users'));
    let deletedCount = 0;

    for (const userDoc of snap.docs) {
      const data = userDoc.data();
      const userId = userDoc.id;
      const userName = data.name || '';

      if (userId.startsWith('demo_') || KEEP_NAMES.includes(userName)) continue;

      // 1. connections 삭제
      let connCount = 0;
      for (const field of ['userId', 'connectedUserId', 'fromUserId', 'toUserId']) {
        try {
          const connSnap = await getDocs(query(collection(db, 'connections'), where(field, '==', userId)));
          for (const d of connSnap.docs) {
            await deleteDoc(d.ref);
            connCount++;
          }
        } catch { /* field가 없는 경우 무시 */ }
      }

      // 2. managedGroups에서 멤버 제거
      let groupCount = 0;
      try {
        const groupSnap = await getDocs(query(collection(db, 'managedGroups'), where('memberUserIds', 'array-contains', userId)));
        for (const d of groupSnap.docs) {
          const gData = d.data();
          const members = (gData.members || []).filter((m: any) => m.userId !== userId);
          const memberUserIds = (gData.memberUserIds || []).filter((mid: string) => mid !== userId);
          await updateDoc(d.ref, { members, memberUserIds });
          groupCount++;
        }
      } catch { /* 무시 */ }

      // 3. users 문서 삭제
      await deleteDoc(doc(db, 'users', userId));

      deletedCount++;
      addLog(`삭제완료: ${userName} (${userId}) - connections: ${connCount}, groups: ${groupCount}`);
    }

    addLog(`===== 완료: 총 ${deletedCount}명 삭제 =====`);
    setRunning(false);
    setPreview(null);
  };

  return (
    <div className="min-h-screen bg-[#0D1117] text-white p-6">
      <h1 className="text-xl font-bold mb-4">사용자 정리</h1>
      <p className="text-sm text-[#8B949E] mb-6">데모 계정과 김재영을 제외한 모든 사용자를 삭제합니다.</p>

      <div className="flex gap-3 mb-6">
        <button
          onClick={handlePreview}
          disabled={running}
          className="px-4 py-2 bg-[#21262D] border border-[#30363D] rounded-lg hover:bg-[#30363D] disabled:opacity-50"
        >
          미리보기
        </button>
        {preview && (
          <button
            onClick={handleDelete}
            disabled={running}
            className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {running ? '삭제 중...' : `${preview.delete.length}명 삭제 실행`}
          </button>
        )}
      </div>

      {preview && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-[#161B22] p-4 rounded-lg border border-[#30363D]">
            <h3 className="text-green-400 font-semibold mb-2">보존 ({preview.keep.length}명)</h3>
            {preview.keep.map((u, i) => <p key={i} className="text-xs text-[#8B949E]">{u}</p>)}
          </div>
          <div className="bg-[#161B22] p-4 rounded-lg border border-red-900/50">
            <h3 className="text-red-400 font-semibold mb-2">삭제 대상 ({preview.delete.length}명)</h3>
            {preview.delete.map((u, i) => <p key={i} className="text-xs text-[#8B949E]">{u}</p>)}
          </div>
        </div>
      )}

      <div className="bg-[#161B22] p-4 rounded-lg border border-[#30363D] max-h-96 overflow-y-auto">
        <h3 className="text-sm font-semibold mb-2">로그</h3>
        {log.length === 0 ? (
          <p className="text-xs text-[#484F58]">미리보기를 먼저 실행하세요.</p>
        ) : (
          log.map((l, i) => <p key={i} className="text-xs text-[#8B949E] font-mono">{l}</p>)
        )}
      </div>
    </div>
  );
}
