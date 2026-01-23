'use client';

import { motion } from 'framer-motion';
import { Contact, ContactCategory, CATEGORY_INFO, groupByCategory } from '@/types/contacts';
import { Phone, Mail, Building2, MapPin } from 'lucide-react';

interface ContactListProps {
  contacts: Contact[];
  onSelectContact: (contact: Contact) => void;
}

export default function ContactList({ contacts, onSelectContact }: ContactListProps) {
  const grouped = groupByCategory(contacts);

  const sortedCategories = Array.from(grouped.entries())
    .filter(([_, list]) => list.length > 0)
    .sort((a, b) => b[1].length - a[1].length);

  return (
    <div className="pb-20">
      {sortedCategories.map(([category, categoryContacts]) => {
        const info = CATEGORY_INFO[category];

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
              {categoryContacts.map((contact, index) => (
                <motion.button
                  key={contact.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  onClick={() => onSelectContact(contact)}
                  className="w-full text-left bg-[#161B22] border border-[#21262D] rounded-xl p-4 hover:border-[#30363D] hover:bg-[#1C2128] transition-all group"
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0"
                      style={{
                        backgroundColor: info.bgColor,
                        color: info.color,
                      }}
                    >
                      {contact.name.charAt(0)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
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
                    </div>

                    {/* Arrow */}
                    <div className="text-[#484F58] group-hover:text-[#8B949E] transition-colors">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path
                          d="M7.5 15L12.5 10L7.5 5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                </motion.button>
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
  );
}
