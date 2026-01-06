'use client';

import { GraphNode, getCategoryColor } from '@/types';
import Image from 'next/image';
import { useState } from 'react';

interface ProfileCardProps {
  node: GraphNode | null;
  onClose: () => void;
}

export default function ProfileCard({ node, onClose }: ProfileCardProps) {
  const [imageError, setImageError] = useState(false);

  if (!node) return null;

  const { member } = node;
  const categoryColor = getCategoryColor(member.category);

  return (
    <>
      {/* 모바일 오버레이 */}
      <div
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={onClose}
      />

      {/* 카드 */}
      <div className="fixed right-0 top-0 h-screen w-full md:w-[380px] bg-gray-900 border-l border-gray-700 z-50 overflow-y-auto animate-slide-in shadow-2xl">
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors z-10"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* 프로필 헤더 */}
        <div className="p-6 pt-16">
          {/* 프로필 이미지 */}
          <div className="relative w-24 h-24 md:w-32 md:h-32 mx-auto mb-4 md:mb-6">
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: `linear-gradient(135deg, ${categoryColor}40, ${categoryColor}20)`,
                padding: '4px',
              }}
            >
              <div className="w-full h-full rounded-full overflow-hidden bg-gray-800 flex items-center justify-center">
                {!imageError && member.photoUrl ? (
                  <Image
                    src={member.photoUrl}
                    alt={member.name}
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <span
                    className="text-3xl md:text-4xl font-bold"
                    style={{ color: categoryColor }}
                  >
                    {member.name.charAt(0)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 이름 및 직함 */}
          <div className="text-center mb-4 md:mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-2">{member.name}</h2>
            <p className="text-gray-400 text-sm md:text-base">{member.role}</p>
            <p className="text-gray-500 text-xs md:text-sm mt-1">{member.company}</p>
          </div>

          {/* 카테고리 배지 */}
          <div className="flex justify-center mb-4 md:mb-6">
            <span
              className="px-3 md:px-4 py-1 md:py-1.5 rounded-full text-xs md:text-sm font-medium"
              style={{
                backgroundColor: `${categoryColor}20`,
                color: categoryColor,
                border: `1px solid ${categoryColor}40`,
              }}
            >
              {member.category}
            </span>
          </div>
        </div>

        {/* 구분선 */}
        <div className="border-t border-gray-800 mx-6" />

        {/* 상세 정보 */}
        <div className="p-6 space-y-4">
          {/* 설명 */}
          <div>
            <h3 className="text-xs md:text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
              소속 기관 소개
            </h3>
            <p className="text-gray-300 text-sm md:text-base leading-relaxed">
              {member.description}
            </p>
          </div>

          {/* 키워드 태그 */}
          {member.tags.length > 0 && (
            <div>
              <h3 className="text-xs md:text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
                관련 키워드
              </h3>
              <div className="flex flex-wrap gap-2">
                {member.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 md:px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-xs md:text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 구분선 */}
        <div className="border-t border-gray-800 mx-6" />

        {/* 연락처 액션 버튼 */}
        <div className="p-6 space-y-3">
          <h3 className="text-xs md:text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            연락하기
          </h3>

          {/* 이메일 */}
          <a
            href={`mailto:${member.email}`}
            className="flex items-center gap-3 w-full px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="flex-1 text-left text-sm md:text-base">이메일 보내기</span>
            <span className="text-blue-200 text-xs md:text-sm truncate max-w-[120px] md:max-w-none">{member.email}</span>
          </a>

          {/* 전화 */}
          <a
            href={`tel:${member.phone}`}
            className="flex items-center gap-3 w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span className="flex-1 text-left text-sm md:text-base">전화 걸기</span>
            <span className="text-gray-400 text-xs md:text-sm">{member.phone}</span>
          </a>
        </div>

        {/* 모바일 하단 여백 */}
        <div className="h-6 md:hidden" />
      </div>
    </>
  );
}
