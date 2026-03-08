'use client';

import { useState } from 'react';
import { Handshake, Phone, MessageCircle, Coffee, FileText, StickyNote, ChevronDown, Zap } from 'lucide-react';
import { useInteractionStore } from '@/store/interactionStore';
import { InteractionType } from '@/types';

interface InteractionTimelineProps {
  targetUserId: string;
}

const TYPE_CONFIG: Record<InteractionType, { icon: typeof Handshake; label: string; color: string }> = {
  meeting: { icon: Handshake, label: '만남', color: '#58A6FF' },
  call: { icon: Phone, label: '전화', color: '#3FB950' },
  message: { icon: MessageCircle, label: '메시지', color: '#D29922' },
  coffee_chat: { icon: Coffee, label: '커피챗', color: '#FF6B8A' },
  memo: { icon: StickyNote, label: '메모', color: '#8B949E' },
  other: { icon: FileText, label: '기타', color: '#A371F7' },
};

export default function InteractionTimeline({ targetUserId }: InteractionTimelineProps) {
  const [showAll, setShowAll] = useState(false);
  const { getInteractions } = useInteractionStore();

  const interactions = getInteractions(targetUserId);
  if (interactions.length === 0) return null;

  const displayItems = showAll ? interactions : interactions.slice(0, 5);

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    return `${month}/${day}`;
  };

  return (
    <div className="space-y-1.5">
      {displayItems.map((interaction, index) => {
        const config = TYPE_CONFIG[interaction.type];
        const Icon = config.icon;

        return (
          <div key={interaction.id} className="flex items-start gap-2.5 group">
            {/* Timeline line + icon */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ backgroundColor: config.color + '20' }}
              >
                <Icon size={12} style={{ color: config.color }} />
              </div>
              {index < displayItems.length - 1 && (
                <div className="w-px h-full min-h-[16px] bg-[#363636]" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pb-2.5">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[11px] font-medium" style={{ color: config.color }}>
                  {config.label}
                </span>
                <span className="text-[10px] text-[#484F58]">
                  {formatDate(interaction.date)}
                </span>
                {interaction.isAutoTracked && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[#363636] text-[8px] text-[#8B949E]">
                    <Zap size={7} />
                    자동
                  </span>
                )}
              </div>
              {interaction.note && (
                <p className="text-xs text-[#C9D1D9] leading-relaxed">{interaction.note}</p>
              )}
              {interaction.nextAction && (
                <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#D29922]/10 border border-[#D29922]/20">
                  <span className="text-[10px] text-[#D29922]">TODO: {interaction.nextAction}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {interactions.length > 5 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="flex items-center gap-1 text-[11px] text-[#58A6FF] hover:text-[#58A6FF]/80 transition-colors pl-8"
        >
          <ChevronDown size={12} />
          {interactions.length - 5}건 더 보기
        </button>
      )}
    </div>
  );
}
