'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Contact, ContactCategory, CATEGORY_INFO, groupByCategory } from '@/types/contacts';
import { InvitableContact } from '@/store/contactStore';
import { Phone, Mail, Building2, Send, Check, UserPlus, X, Copy, MessageCircle } from 'lucide-react';

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
  const [inviteModal, setInviteModal] = useState<InvitableContact | null>(null);
  const [copied, setCopied] = useState(false);

  const grouped = groupByCategory(contacts);

  const sortedCategories = Array.from(grouped.entries())
    .filter(([_, list]) => list.length > 0)
    .sort((a, b) => b[1].length - a[1].length);

  const handleInvite = (e: React.MouseEvent, contact: InvitableContact) => {
    e.stopPropagation();
    setInviteModal(contact);
  };

  const confirmInvite = (method: 'sms' | 'kakao' | 'copy') => {
    if (!inviteModal) return;

    const inviteLink = `${window.location.origin}/onboarding?inviter=${encodeURIComponent('김재영')}`;
    const message = `안녕하세요 ${inviteModal.name}님! 김재영입니다. 인맥 네트워크 서비스 Nodded에 초대합니다. ${inviteLink}`;

    if (method === 'sms') {
      window.open(`sms:${inviteModal.phone}?body=${encodeURIComponent(message)}`);
    } else if (method === 'kakao') {
      // 카카오톡 공유 (실제로는 Kakao SDK 필요)
      if (navigator.share) {
        navigator.share({
          title: 'Nodded 초대',
          text: message,
        });
      }
    } else if (method === 'copy') {
      navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }

    onInvite?.(inviteModal.id);
    setTimeout(() => setInviteModal(null), 500);
  };

  return (
    <>
      <div className="pb-20">
        {sortedCategories.map(([category, categoryContacts]) => {
          const info = CATEGORY_INFO[category];
          const invitableContacts = categoryContacts as InvitableContact[];

          return (
            <div key={category} className="mb-6">
              {/* Category Header */}
              <div
                className="sticky top-[140px] z-20 px-4 py-3 backdrop-blur-xl"
                style={{ backgroundColor: 'rgba(13, 17, 23, 0.95)' }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{info.icon}</span>
                    <span className="font-semibold" style={{ color: info.color }}>
                      {info.name}
                    </span>
                  </div>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: info.bgColor,
                      color: info.color,
                    }}
                  >
                    {categoryContacts.length}명
                  </span>
                </div>
              </div>

              {/* Contact Cards */}
              <div className="px-4 space-y-2">
                {invitableContacts.map((contact, index) => (
                  <motion.div
                    key={contact.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="w-full bg-[#161B22] border border-[#21262D] rounded-xl p-4 hover:border-[#30363D] hover:bg-[#1C2128] transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <button
                        onClick={() => onSelectContact(contact)}
                        className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0"
                        style={{
                          backgroundColor: info.bgColor,
                          color: info.color,
                        }}
                      >
                        {contact.name.charAt(0)}
                      </button>

                      {/* Info */}
                      <button
                        onClick={() => onSelectContact(contact)}
                        className="flex-1 min-w-0 text-left"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-white group-hover:text-[#00D9FF] transition-colors">
                            {contact.name}
                          </span>
                          {contact.position && (
                            <span className="text-xs text-[#8B949E] truncate">
                              {contact.position.split('/')[0].trim()}
                            </span>
                          )}
                        </div>

                        {contact.company && (
                          <div className="flex items-center gap-1.5 text-sm text-[#8B949E] mb-2">
                            <Building2 size={14} className="shrink-0" />
                            <span className="truncate">{contact.company}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-3 text-xs text-[#484F58]">
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
                            <motion.button
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => handleInvite(e, contact)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-[#00D9FF]/20 text-[#00D9FF] rounded-lg text-xs hover:bg-[#00D9FF]/30 transition-colors"
                            >
                              <UserPlus size={14} />
                              <span>초대</span>
                            </motion.button>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}

        {contacts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <div className="text-lg font-semibold text-white mb-2">검색 결과가 없습니다</div>
            <div className="text-sm text-[#8B949E]">다른 검색어를 시도해보세요</div>
          </div>
        )}
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
              className="w-full bg-[#161B22] rounded-t-3xl border-t border-[#21262D] p-6"
            >
              <button
                onClick={() => setInviteModal(null)}
                className="absolute top-4 right-4 p-2"
              >
                <X size={20} className="text-[#8B949E]" />
              </button>

              <div className="w-12 h-1 bg-[#484F58] rounded-full mx-auto mb-6" />

              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#00D9FF]/20 to-[#7B68EE]/20 flex items-center justify-center">
                  <Send size={28} className="text-[#00D9FF]" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {inviteModal.name}님 초대하기
                </h3>
                <p className="text-sm text-[#8B949E]">
                  {inviteModal.company && `${inviteModal.company} · `}
                  {inviteModal.position?.split('/')[0].trim()}
                </p>
              </div>

              <div className="space-y-3">
                {inviteModal.phone && (
                  <button
                    onClick={() => confirmInvite('sms')}
                    className="w-full py-4 bg-[#00D9FF] text-[#0A0E1A] font-semibold rounded-xl flex items-center justify-center gap-2"
                  >
                    <MessageCircle size={20} />
                    문자로 초대하기
                  </button>
                )}
                <button
                  onClick={() => confirmInvite('copy')}
                  className="w-full py-4 bg-[#21262D] text-white font-medium rounded-xl flex items-center justify-center gap-2 border border-[#30363D]"
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
    </>
  );
}
