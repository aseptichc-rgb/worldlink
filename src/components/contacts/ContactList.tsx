'use client';

import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { CATEGORY_INFO, flattenGroupedContacts, VirtualListItem } from '@/types/contacts';
import { InvitableContact } from '@/store/contactStore';
import { useAuthStore } from '@/store/authStore';
import { Phone, Mail, Building2, Send, Check, UserPlus, X, Copy, MessageCircle } from 'lucide-react';

// 메모이제이션된 연락처 카드 컴포넌트
const ContactCard = React.memo(function ContactCard({
  contact,
  categoryColor,
  categoryBgColor,
  onSelect,
  onInvite,
  showInviteButton,
}: {
  contact: InvitableContact;
  categoryColor: string;
  categoryBgColor: string;
  onSelect: (contact: InvitableContact) => void;
  onInvite?: (e: React.MouseEvent, contact: InvitableContact) => void;
  showInviteButton: boolean;
}) {
  return (
    <div className="w-full bg-[#1C2333] border border-[#30363D] rounded-xl p-4 hover:border-[#30363D] hover:bg-[#161B22] transition-all group contact-card-enter">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <button
          onClick={() => onSelect(contact)}
          className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0"
          style={{ backgroundColor: categoryBgColor, color: categoryColor }}
        >
          {contact.name.charAt(0)}
        </button>

        {/* Info */}
        <button
          onClick={() => onSelect(contact)}
          className="flex-1 min-w-0 text-left"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-white group-hover:text-[#58A6FF] transition-colors">
              {contact.name}
            </span>
            {contact.position && (
              <span className="text-sm text-[#8B949E] truncate">
                {contact.position.split('/')[0].trim()}
              </span>
            )}
          </div>

          {contact.company && (
            <div className="flex items-center gap-1.5 text-base text-[#8B949E] mb-2">
              <Building2 size={14} className="shrink-0" />
              <span className="truncate">{contact.company}</span>
            </div>
          )}

          <div className="flex items-center gap-3 text-sm text-[#484F58]">
            {contact.phone && (
              <div className="flex items-center gap-1">
                <Phone size={12} />
                <span>{contact.phone}</span>
              </div>
            )}
            {contact.email && (
              <div className="flex items-center gap-1">
                <Mail size={12} />
                <span className="truncate max-w-[120px]">{contact.email}</span>
              </div>
            )}
          </div>
        </button>

        {/* Invite Button */}
        {showInviteButton && (
          <div className="shrink-0">
            {contact.isInvited ? (
              <div className="flex items-center gap-1 px-3 py-1.5 bg-[#238636]/20 text-[#3FB950] rounded-lg text-xs">
                <Check size={14} />
                <span>초대됨</span>
              </div>
            ) : (
              <button
                onClick={(e) => onInvite?.(e, contact)}
                className="flex items-center gap-1 px-3 py-1.5 bg-[#58A6FF]/20 text-[#58A6FF] rounded-lg text-xs hover:bg-[#58A6FF]/30 transition-colors active:scale-95"
              >
                <UserPlus size={14} />
                <span>초대</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

interface ContactListProps {
  contacts: InvitableContact[];
  onSelectContact: (contact: InvitableContact) => void;
  onInvite?: (contactId: string) => void;
  showInviteButton?: boolean;
}

export default function ContactList({
  contacts,
  onSelectContact,
  onInvite,
  showInviteButton = true,
}: ContactListProps) {
  const { user: currentUser } = useAuthStore();
  const [inviteModal, setInviteModal] = useState<InvitableContact | null>(null);
  const [copied, setCopied] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const inviterName = currentUser?.name || 'Nodded 사용자';

  // 플랫 리스트 메모이제이션
  const flatItems = useMemo(
    () => flattenGroupedContacts(contacts) as (VirtualListItem & { contact?: InvitableContact })[],
    [contacts]
  );

  // 스크롤 오프셋에서 현재 sticky 헤더 계산
  const [stickyHeader, setStickyHeader] = useState<VirtualListItem | null>(null);

  const virtualizer = useWindowVirtualizer({
    count: flatItems.length,
    estimateSize: (index) => {
      const item = flatItems[index];
      return item.type === 'header' ? 48 : 96;
    },
    overscan: 8,
    scrollMargin: listRef.current?.offsetTop ?? 0,
  });

  // sticky 헤더 업데이트
  useEffect(() => {
    const handleScroll = () => {
      if (!listRef.current) return;
      const scrollTop = window.scrollY;
      const listTop = listRef.current.offsetTop;

      let currentHeader: VirtualListItem | null = null;
      let accumulatedHeight = 0;

      for (const item of flatItems) {
        const itemTop = listTop + accumulatedHeight;
        if (itemTop > scrollTop + 160) break; // 160px = 헤더 높이 + 여유
        if (item.type === 'header') {
          currentHeader = item;
        }
        accumulatedHeight += item.type === 'header' ? 48 : 96;
      }

      setStickyHeader(currentHeader);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [flatItems]);

  const handleInvite = useCallback((e: React.MouseEvent, contact: InvitableContact) => {
    e.stopPropagation();
    setInviteModal(contact);
  }, []);

  const confirmInvite = useCallback((method: 'sms' | 'kakao' | 'copy') => {
    if (!inviteModal) return;

    const inviteLink = `${window.location.origin}/onboarding?inviter=${encodeURIComponent(inviterName)}`;
    const message = `안녕하세요 ${inviteModal.name}님! ${inviterName}입니다. 인맥 네트워크 서비스 Nodded에 초대합니다. ${inviteLink}`;

    if (method === 'sms') {
      window.open(`sms:${inviteModal.phone}?body=${encodeURIComponent(message)}`);
    } else if (method === 'kakao') {
      if (navigator.share) {
        navigator.share({ title: 'Nodded 초대', text: message });
      }
    } else if (method === 'copy') {
      navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }

    onInvite?.(inviteModal.id);
    setTimeout(() => setInviteModal(null), 500);
  }, [inviteModal, inviterName, onInvite]);

  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-6xl mb-4">🔍</div>
        <div className="text-lg font-semibold text-white mb-2">검색 결과가 없습니다</div>
        <div className="text-base text-[#8B949E]">다른 검색어를 시도해보세요</div>
      </div>
    );
  }

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <>
      {/* Sticky Category Header Overlay */}
      {stickyHeader && stickyHeader.type === 'header' && (
        <div
          className="sticky top-[140px] z-20 px-4 py-3 backdrop-blur-xl"
          style={{ backgroundColor: 'rgba(22, 27, 34, 0.95)' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">{stickyHeader.info.icon}</span>
              <span className="font-semibold" style={{ color: stickyHeader.info.color }}>
                {stickyHeader.info.name}
              </span>
            </div>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: stickyHeader.info.bgColor,
                color: stickyHeader.info.color,
              }}
            >
              {stickyHeader.count}명
            </span>
          </div>
        </div>
      )}

      {/* Virtual List Container */}
      <div ref={listRef} className="pb-20">
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualItems.map((virtualRow) => {
            const item = flatItems[virtualRow.index];
            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start - (virtualizer.options.scrollMargin ?? 0)}px)`,
                }}
              >
                {item.type === 'header' ? (
                  <div className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{item.info.icon}</span>
                        <span className="font-semibold" style={{ color: item.info.color }}>
                          {item.info.name}
                        </span>
                      </div>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: item.info.bgColor,
                          color: item.info.color,
                        }}
                      >
                        {item.count}명
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="px-4 py-1">
                    <ContactCard
                      contact={item.contact as InvitableContact}
                      categoryColor={CATEGORY_INFO[item.category].color}
                      categoryBgColor={CATEGORY_INFO[item.category].bgColor}
                      onSelect={onSelectContact}
                      onInvite={handleInvite}
                      showInviteButton={showInviteButton}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Invite Modal */}
      <AnimatePresence>
        {inviteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end"
            onClick={() => setInviteModal(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-[#1C2333] rounded-t-2xl border-t border-[#30363D] p-6"
            >
              <button
                onClick={() => setInviteModal(null)}
                className="absolute top-4 right-4 p-2"
              >
                <X size={20} className="text-[#8B949E]" />
              </button>

              <div className="w-12 h-1 bg-[#484F58] rounded-full mx-auto mb-6" />

              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#58A6FF]/20 to-[#1F6FEB]/20 flex items-center justify-center">
                  <Send size={28} className="text-[#58A6FF]" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {inviteModal.name}님 초대하기
                </h3>
                <p className="text-base text-[#8B949E]">
                  {inviteModal.company && `${inviteModal.company} · `}
                  {inviteModal.position?.split('/')[0].trim()}
                </p>
              </div>

              <div className="space-y-3">
                {inviteModal.phone && (
                  <button
                    onClick={() => confirmInvite('sms')}
                    className="w-full py-4 bg-[#58A6FF] text-white font-semibold rounded-xl flex items-center justify-center gap-2"
                  >
                    <MessageCircle size={20} />
                    문자로 초대하기
                  </button>
                )}
                <button
                  onClick={() => confirmInvite('copy')}
                  className="w-full py-4 bg-[#30363D] text-white font-medium rounded-xl flex items-center justify-center gap-2 border border-[#30363D]"
                >
                  {copied ? (
                    <>
                      <Check size={20} className="text-[#3FB950]" />
                      복사됨!
                    </>
                  ) : (
                    <>
                      <Copy size={20} />
                      초대 링크 복사
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CSS animation for cards entering viewport */}
      <style jsx global>{`
        @keyframes contactCardEnter {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .contact-card-enter {
          animation: contactCardEnter 0.15s ease-out;
        }
      `}</style>
    </>
  );
}
