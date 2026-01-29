'use client';

import Image from 'next/image';
import { User } from 'lucide-react';

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  hasGlow?: boolean;
  status?: 'available' | 'busy' | 'pending';
  className?: string;
}

export default function Avatar({
  src,
  name,
  size = 'md',
  hasGlow = false,
  status,
  className = '',
}: AvatarProps) {
  const sizes = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const statusSizes = {
    xs: 'w-2 h-2',
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
    xl: 'w-5 h-5',
  };

  const statusColors = {
    available: 'bg-[#00E676]',
    busy: 'bg-[#FF4081]',
    pending: 'bg-[#FFA726]',
  };

  const initials = name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={`relative ${sizes[size]} ${className}`}>
      <div
        className={`
          ${sizes[size]} rounded-full overflow-hidden
          border-2 ${hasGlow ? 'border-[#86C9F2]' : 'border-[#1E3A5F]'}
          ${hasGlow ? 'shadow-[0_0_20px_rgba(134,201,242,0.25)]' : ''}
          bg-[#162A4A] flex items-center justify-center
        `}
      >
        {src ? (
          <Image
            src={src}
            alt={name || 'Avatar'}
            fill
            className="object-cover rounded-full"
          />
        ) : initials ? (
          <span className="text-[#8BA4C4] font-medium">
            {initials}
          </span>
        ) : (
          <User className="text-[#4A5E7A]" size={size === 'xs' ? 12 : size === 'sm' ? 16 : size === 'md' ? 20 : size === 'lg' ? 28 : 36} />
        )}
      </div>
      {status && (
        <span
          className={`
            absolute bottom-0 right-0 rounded-full
            ${statusSizes[size]} ${statusColors[status]}
            border-2 border-[#101D33]
          `}
        />
      )}
    </div>
  );
}
