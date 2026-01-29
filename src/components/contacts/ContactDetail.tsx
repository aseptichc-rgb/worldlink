'use client';

import { motion } from 'framer-motion';
import { CATEGORY_INFO } from '@/types/contacts';
import { InvitableContact } from '@/store/contactStore';
import { Phone, Mail, Building2, MapPin, Calendar, Briefcase, Copy, ExternalLink, MessageCircle } from 'lucide-react';
import { useState } from 'react';

interface ContactDetailProps {
  contact: InvitableContact;
}

export default function ContactDetail({ contact }: ContactDetailProps) {
  const info = CATEGORY_INFO[contact.category];
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(field);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      console.error('Failed to copy');
    }
  };

  const InfoRow = ({
    icon: Icon,
    label,
    value,
    copyable = false,
    action,
  }: {
    icon: React.ElementType;
    label: string;
    value: string;
    copyable?: boolean;
    action?: () => void;
  }) => {
    if (!value) return null;

    return (
      <div className="flex items-start gap-3 py-3 border-b border-[#1E3A5F] last:border-0">
        <div className="w-8 h-8 rounded-lg bg-[#1E3A5F] flex items-center justify-center shrink-0">
          <Icon size={16} className="text-[#8BA4C4]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-[#8BA4C4] mb-0.5">{label}</div>
          <div className="text-sm text-white break-words">{value}</div>
        </div>
        {copyable && (
          <button
            onClick={() => copyToClipboard(value, label)}
            className="p-2 rounded-lg hover:bg-[#1E3A5F] transition-colors"
          >
            {copied === label ? (
              <span className="text-xs text-[#10B981]">복사됨!</span>
            ) : (
              <Copy size={16} className="text-[#4A5E7A]" />
            )}
          </button>
        )}
        {action && (
          <button
            onClick={action}
            className="p-2 rounded-lg hover:bg-[#1E3A5F] transition-colors"
          >
            <ExternalLink size={16} className="text-[#4A5E7A]" />
          </button>
        )}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen pb-20"
    >
      {/* Profile Header */}
      <div className="relative">
        {/* Background Gradient */}
        <div
          className="h-32 w-full"
          style={{
            background: `linear-gradient(135deg, ${info.color}40 0%, ${info.color}10 100%)`,
          }}
        />

        {/* Profile Card */}
        <div className="px-4 -mt-16">
          <div className="bg-[#162A4A] border border-[#1E3A5F] rounded-2xl p-5">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold shrink-0 shadow-lg"
                style={{
                  backgroundColor: info.bgColor,
                  color: info.color,
                  border: `2px solid ${info.borderColor}`,
                }}
              >
                {contact.name.charAt(0)}
              </div>

              {/* Basic Info */}
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-white mb-1">{contact.name}</h2>
                {contact.position && (
                  <p className="text-sm text-[#8BA4C4] mb-2 line-clamp-2">{contact.position}</p>
                )}
                <div
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: info.bgColor,
                    color: info.color,
                  }}
                >
                  <span>{info.icon}</span>
                  <span>{info.name}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 mt-5">
              {contact.phone && (
                <a
                  href={`tel:${contact.phone}`}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#86C9F2]/10 text-[#86C9F2] rounded-xl hover:bg-[#86C9F2]/20 transition-colors"
                >
                  <Phone size={18} />
                  <span className="text-sm font-medium">전화</span>
                </a>
              )}
              {contact.email && (
                <a
                  href={`mailto:${contact.email}`}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#8B5CF6]/10 text-[#8B5CF6] rounded-xl hover:bg-[#8B5CF6]/20 transition-colors"
                >
                  <Mail size={18} />
                  <span className="text-sm font-medium">이메일</span>
                </a>
              )}
              <button
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#10B981]/10 text-[#10B981] rounded-xl hover:bg-[#10B981]/20 transition-colors"
              >
                <MessageCircle size={18} />
                <span className="text-sm font-medium">메시지</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="px-4 mt-4">
        <div className="bg-[#162A4A] border border-[#1E3A5F] rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-[#86C9F2]" />
            연락처 정보
          </h3>

          <InfoRow icon={Phone} label="휴대폰" value={contact.phone} copyable />
          <InfoRow icon={Phone} label="회사 전화" value={contact.workPhone} copyable />
          <InfoRow icon={Mail} label="이메일" value={contact.email} copyable />
          {contact.workFax && (
            <InfoRow icon={Phone} label="팩스" value={contact.workFax} copyable />
          )}
        </div>
      </div>

      {/* Company Information */}
      {(contact.company || contact.department) && (
        <div className="px-4 mt-4">
          <div className="bg-[#162A4A] border border-[#1E3A5F] rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-[#8B5CF6]" />
              회사 정보
            </h3>

            <InfoRow icon={Building2} label="회사" value={contact.company} />
            <InfoRow icon={Briefcase} label="부서" value={contact.department} />
            <InfoRow icon={Briefcase} label="직함" value={contact.position} />
            <InfoRow icon={MapPin} label="주소" value={contact.address} />
          </div>
        </div>
      )}

      {/* Additional Info */}
      {(contact.registeredDate || contact.memo) && (
        <div className="px-4 mt-4">
          <div className="bg-[#162A4A] border border-[#1E3A5F] rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-[#F59E0B]" />
              추가 정보
            </h3>

            <InfoRow icon={Calendar} label="등록일" value={contact.registeredDate} />
            {contact.memo && (
              <div className="py-3">
                <div className="text-xs text-[#8BA4C4] mb-1">메모</div>
                <div className="text-sm text-white bg-[#1E3A5F] rounded-lg p-3">
                  {contact.memo}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Category Badge */}
      <div className="px-4 mt-4">
        <div
          className="rounded-2xl p-4 text-center"
          style={{
            backgroundColor: info.bgColor,
            border: `1px solid ${info.borderColor}`,
          }}
        >
          <div className="text-3xl mb-2">{info.icon}</div>
          <div className="text-sm font-medium" style={{ color: info.color }}>
            {info.name} 분야
          </div>
          <div className="text-xs text-[#8BA4C4] mt-1">
            자동 분류된 카테고리입니다
          </div>
        </div>
      </div>
    </motion.div>
  );
}
