'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

type UserAvatarProps = {
  photoURL?: string | null;
  displayName?: string | null;
  email?: string | null;
  className?: string;
  fallbackClassName?: string;
  imageClassName?: string;
  alt?: string;
};

export function UserAvatar({
  photoURL,
  displayName,
  email,
  className,
  fallbackClassName,
  imageClassName,
  alt,
}: UserAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const label = displayName || email || 'User';
  const fallbackLetter = (displayName || email || '?').trim().charAt(0).toUpperCase() || '?';
  const shouldShowImage = !!photoURL && !imageFailed;

  return (
    <div className={cn('relative flex shrink-0 overflow-hidden rounded-full bg-primary/10', className)}>
      {shouldShowImage ? (
        <img
          src={photoURL}
          alt={alt || `${label} avatar`}
          className={cn('h-full w-full object-cover', imageClassName)}
          referrerPolicy="no-referrer"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div
          className={cn(
            'flex h-full w-full items-center justify-center text-primary font-medium',
            fallbackClassName
          )}
          aria-label={alt || `${label} avatar fallback`}
        >
          {fallbackLetter}
        </div>
      )}
    </div>
  );
}
