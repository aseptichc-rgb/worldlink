'use client';

import { useState, useMemo } from 'react';
import { Member, CATEGORY_COLORS } from '@/types';
import membersData from '../../../data/members.json';
import EditMemberModal from '@/components/EditMemberModal';

const MAIN_CATEGORIES = [
  '의료기기/솔루션',
  '투자/법률/특허',
  '제약/바이오',
  '의료기관',
  '기타',
];

export default function AdminPage() {
  const [members, setMembers] = useState<Member[]>(membersData as Member[]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // 필터링된 멤버
  const filteredMembers = useMemo(() => {
    return members.filter(member => {
      const query = searchQuery.toLowerCase();
      const searchMatch = searchQuery === '' ||
        member.name.toLowerCase().includes(query) ||
        member.company.toLowerCase().includes(query) ||
        member.email.toLowerCase().includes(query) ||
        member.phone.includes(query);

      const categoryMatch = selectedCategory === '' ||
        member.category.includes(selectedCategory);

      return searchMatch && categoryMatch;
    });
  }, [members, searchQuery, selectedCategory]);

  // 멤버 저장
  const handleSaveMember = async (updatedMember: Member) => {
    setSaveStatus('saving');

    try {
      const updatedMembers = isAddingNew
        ? [...members, updatedMember]
        : members.map(m => m.id === updatedMember.id ? updatedMember : m);

      // API 호출하여 저장
      const response = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedMembers),
      });

      if (response.ok) {
        setMembers(updatedMembers);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        throw new Error('저장 실패');
      }
    } catch (error) {
      console.error('저장 오류:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }

    setEditingMember(null);
    setIsAddingNew(false);
  };

  // 멤버 삭제
  const handleDeleteMember = async (memberId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    setSaveStatus('saving');

    try {
      const updatedMembers = members.filter(m => m.id !== memberId);

      const response = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedMembers),
      });

      if (response.ok) {
        setMembers(updatedMembers);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        throw new Error('삭제 실패');
      }
    } catch (error) {
      console.error('삭제 오류:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  // 새 멤버 추가
  const handleAddNew = () => {
    const newMember: Member = {
      id: `member_${Date.now()}`,
      name: '',
      company: '',
      role: '',
      phone: '',
      email: '',
      description: '',
      category: '의료기기/솔루션',
      tags: [],
      photoUrl: null,
    };
    setEditingMember(newMember);
    setIsAddingNew(true);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white overflow-y-auto">
      {/* 헤더 */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a href="/" className="text-gray-400 hover:text-white transition-colors">
                ← 네트워크로 돌아가기
              </a>
              <h1 className="text-xl font-bold">LinkFlow 어드민</h1>
            </div>
            <div className="flex items-center gap-4">
              {saveStatus === 'saving' && (
                <span className="text-yellow-400">저장 중...</span>
              )}
              {saveStatus === 'saved' && (
                <span className="text-green-400">저장 완료!</span>
              )}
              {saveStatus === 'error' && (
                <span className="text-red-400">저장 실패</span>
              )}
              <button
                onClick={handleAddNew}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors"
              >
                + 새 멤버 추가
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 필터 바 */}
      <div className="bg-gray-850 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex gap-4">
            {/* 검색 */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="이름, 소속, 이메일, 전화번호 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            {/* 카테고리 필터 */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">전체 카테고리</option>
              {MAIN_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 멤버 목록 */}
      <main className="max-w-7xl mx-auto px-6 py-6 pb-20">
        <div className="mb-4 text-sm text-gray-400">
          총 {filteredMembers.length}명 / {members.length}명
        </div>

        <div className="grid gap-4">
          {filteredMembers.map(member => (
            <div
              key={member.id}
              className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-start gap-4">
                {/* 프로필 이미지 */}
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
                  {member.photoUrl ? (
                    <img
                      src={member.photoUrl}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-500">
                      {member.name.charAt(0)}
                    </div>
                  )}
                </div>

                {/* 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-semibold">{member.name}</h3>
                    <span
                      className="px-2 py-0.5 rounded text-xs font-medium"
                      style={{
                        backgroundColor: CATEGORY_COLORS[member.category.split('/')[0]] || '#6B7280',
                        color: 'white',
                      }}
                    >
                      {member.category}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm">{member.company} · {member.role}</p>
                  <p className="text-gray-500 text-sm mt-1">{member.email} · {member.phone}</p>
                  <p className="text-gray-400 text-sm mt-2 line-clamp-2">{member.description}</p>
                  {member.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {member.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-gray-700 rounded text-xs text-gray-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 액션 버튼 */}
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => setEditingMember(member)}
                    className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm font-medium transition-colors"
                  >
                    편집
                  </button>
                  <button
                    onClick={() => handleDeleteMember(member.id)}
                    className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded text-sm font-medium transition-colors"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredMembers.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            검색 결과가 없습니다.
          </div>
        )}
      </main>

      {/* 편집 모달 */}
      {editingMember && (
        <EditMemberModal
          member={editingMember}
          isNew={isAddingNew}
          onSave={handleSaveMember}
          onClose={() => {
            setEditingMember(null);
            setIsAddingNew(false);
          }}
        />
      )}
    </div>
  );
}
