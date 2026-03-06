'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, getDocs, query, where, serverTimestamp, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export default function ImportContactsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [status, setStatus] = useState<string>('');
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<{name: string; status: string}[]>([]);
  const [csvInput, setCsvInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvInput(content);
      setStatus(`파일 로드됨: ${file.name} (${content.split('\n').length - 1}개 행)`);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const importContacts = async () => {
    if (!user) {
      setStatus('로그인이 필요합니다');
      return;
    }

    // kjykjj04@naver.com 계정의 인맥으로 추가 (현재 로그인 사용자 기준)

    setImporting(true);
    setStatus('연락처 가져오는 중...');
    const importResults: {name: string; status: string}[] = [];

    try {
      const lines = csvInput.trim().split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        setStatus('CSV 데이터가 없습니다');
        setImporting(false);
        return;
      }

      // 헤더 건너뛰기
      for (let i = 1; i < lines.length; i++) {
        const fields = parseCSVLine(lines[i]);
        if (fields.length < 2) continue;

        const name = fields[0]?.trim();
        const phone = fields[1]?.trim();
        const company = fields[2]?.trim() || '';
        const department = fields[3]?.trim() || '';
        const position = fields[4]?.trim() || '';
        const email = fields[5]?.trim() || '';

        if (!name) continue;

        try {
          const contactData = {
            id: `contact_${Date.now()}_${i}`,
            name,
            phone,
            company,
            position: [department, position].filter(Boolean).join(' '),
            email,
            importedAt: new Date().toISOString(),
          };

          // 사용자 문서에 importedContacts 배열로 저장
          const userRef = doc(db, 'users', user.id);
          await updateDoc(userRef, {
            importedContacts: arrayUnion(contactData)
          });

          // 해당 전화번호나 이메일로 등록된 사용자 찾아서 인맥 연결
          let matchedUserId: string | null = null;

          if (email) {
            const emailQuery = query(
              collection(db, 'users'),
              where('email', '==', email)
            );
            const emailSnap = await getDocs(emailQuery);
            if (!emailSnap.empty) {
              matchedUserId = emailSnap.docs[0].id;
            }
          }

          if (!matchedUserId && phone) {
            const phoneQuery = query(
              collection(db, 'users'),
              where('phone', '==', phone)
            );
            const phoneSnap = await getDocs(phoneQuery);
            if (!phoneSnap.empty) {
              matchedUserId = phoneSnap.docs[0].id;
            }
          }

          // 매칭된 사용자가 있으면 인맥 연결
          if (matchedUserId && matchedUserId !== user.id) {
            const connRef = doc(collection(db, 'connections'));
            await setDoc(connRef, {
              id: connRef.id,
              fromUserId: user.id,
              toUserId: matchedUserId,
              status: 'accepted',
              method: 'import',
              createdAt: serverTimestamp(),
              acceptedAt: serverTimestamp(),
            });
            importResults.push({ name, status: 'connected' });
          } else {
            importResults.push({ name, status: 'saved' });
          }

          if (i % 10 === 0) {
            setStatus(`처리 중... ${i}/${lines.length - 1}`);
          }
        } catch (err: any) {
          importResults.push({ name, status: `error: ${err.message}` });
        }
      }

      setResults(importResults);
      const connected = importResults.filter(r => r.status === 'connected').length;
      const saved = importResults.filter(r => r.status === 'saved').length;
      const errors = importResults.filter(r => r.status.includes('error')).length;
      setStatus(`완료! 인맥 연결: ${connected}명, 저장: ${saved}명, 오류: ${errors}개`);
    } catch (error: any) {
      setStatus(`오류: ${error.message}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D1117] text-white px-6 py-8 sm:px-12 lg:px-16">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.push('/network')}
            className="p-2 rounded-lg hover:bg-[#1C2333] transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold">연락처 가져오기</h1>
        </div>

        <div className="bg-[#161B22] rounded-xl p-6 mb-6">
          <p className="mb-2 text-[#8B949E]">현재 로그인: <span className="text-white">{user?.email || '로그인 필요'}</span></p>
          <p className="text-gray-400 text-sm mb-4">
            CSV 파일을 업로드하거나 데이터를 붙여넣고 가져오기 버튼을 클릭하세요.
          </p>

          <div className="mb-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded mr-2"
            >
              CSV 파일 선택
            </button>
            <span className="text-gray-400 text-sm">또는 아래에 직접 붙여넣기</span>
          </div>

          <textarea
            className="w-full h-64 bg-[#0D1117] border border-gray-700 rounded p-3 text-sm font-mono mb-4"
            placeholder='CSV 데이터를 붙여넣으세요 (첫 줄은 헤더)
예: "이름","휴대폰","회사","부서","직함","전자 메일 주소",...'
            value={csvInput}
            onChange={(e) => setCsvInput(e.target.value)}
          />

          <button
            onClick={importContacts}
            disabled={importing || !csvInput}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-2 rounded font-medium"
          >
            {importing ? '가져오는 중...' : '연락처 가져오기'}
          </button>

          {status && (
            <p className="mt-4 text-yellow-400">{status}</p>
          )}
        </div>

        {results.length > 0 && (
          <div className="bg-[#161B22] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">결과 ({results.length}개)</h2>
              <button
                onClick={() => router.push('/network')}
                className="bg-[#3FB950] hover:bg-[#2ea043] px-4 py-2 rounded-lg font-medium transition-colors"
              >
                인맥 화면으로 돌아가기
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-700">
                    <th className="pb-2 pl-2">이름</th>
                    <th className="pb-2">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr key={i} className="border-b border-gray-800 hover:bg-[#1C2333]">
                      <td className="py-2 pl-2">{r.name}</td>
                      <td className={`py-2 ${
                        r.status === 'connected' ? 'text-green-400' :
                        r.status === 'saved' ? 'text-blue-400' :
                        r.status.includes('error') ? 'text-red-400' :
                        'text-gray-400'
                      }`}>
                        {r.status === 'connected' ? '인맥 연결됨' :
                         r.status === 'saved' ? '저장됨' : r.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
