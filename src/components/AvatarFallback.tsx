'use client';

import { CircleUserRound } from 'lucide-react';

interface AvatarFallbackProps {
  className?: string;
  label?: string;
}

export default function AvatarFallback({
  className = 'w-10 h-10',
  label = 'User avatar',
}: AvatarFallbackProps) {
  return (
    <div
      role="img"
      aria-label={label}
      className={`
        ${className}
        rounded-full
        bg-white
        flex items-center justify-center
      `}
    >
      <CircleUserRound className="w-full h-full text-green-900" />
    </div>
  );
}
