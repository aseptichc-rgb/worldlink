'use client';

import { useState } from 'react';
import { Member } from '@/types';

const MAIN_CATEGORIES = [
  '의료기기',
  '솔루션',
  '투자',
  '법률',
  '특허',
  '제약',
  '바이오',
  '의료기관',
  '비즈니스',
];

interface EditMemberModalProps {
  member: Member;
  isNew: boolean;
  onSave: (member: Member) => void;
  onClose: () => void;
}

export default function EditMemberModal({
  member,
  isNew,
  onSave,
  onClose,
}: EditMemberModalProps) {
  const [formData, setFormData] = useState<Member>({ ...member });
  const [tagsInput, setTagsInput] = useState(member.tags.join(', '));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 태그 파싱
    const tags = tagsInput
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    onSave({
      ...formData,
      tags,
      specialRole: formData.specialRole?.trim() || null,
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 bg-gray-800 px-6 py-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {isNew ? '새 멤버 추가' : '멤버 편집'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 기본 정보 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                이름 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                카테고리 <span className="text-red-400">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                {MAIN_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                소속 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                직책 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* 특별 보직 */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              특별 보직
            </label>
            <input
              type="text"
              name="specialRole"
              value={formData.specialRole || ''}
              onChange={handleChange}
              placeholder="예: 👑 회장, 부회장, 고문 등"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              네트워크 그래프에서 이름 아래 금색으로 표시됩니다. (비워두면 표시되지 않음)
            </p>
          </div>

          {/* 연락처 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                전화번호
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="010-0000-0000"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                이메일
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="example@email.com"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* 프로필 이미지 URL */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              프로필 이미지 URL
            </label>
            <input
              type="text"
              name="photoUrl"
              value={formData.photoUrl || ''}
              onChange={handleChange}
              placeholder="/faces/example.jpg 또는 https://..."
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
            {formData.photoUrl && (
              <div className="mt-2 flex items-center gap-2">
                <img
                  src={formData.photoUrl}
                  alt="미리보기"
                  className="w-12 h-12 rounded-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <span className="text-sm text-gray-500">미리보기</span>
              </div>
            )}
          </div>

          {/* 설명 */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              설명
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="멤버에 대한 설명을 입력하세요..."
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* 태그 */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              태그 (쉼표로 구분)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="AI, 의료기기, 스타트업"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              태그는 노드 간 연결에 사용됩니다. 공유 태그가 있으면 연결선이 표시됩니다.
            </p>
          </div>

          {/* 버튼 */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors"
            >
              {isNew ? '추가' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
