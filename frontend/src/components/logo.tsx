import React from 'react';
import { cn } from '@/lib/utils';

const ChanakyaIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn(className)}
  >
    <path d="M19.38 6.28a9 9 0 1 0-14.76 0" />
    <path d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
  </svg>
);

export function Logo({
  iconOnly = false,
  className,
}: {
  iconOnly?: boolean;
  className?: string;
}) {
  if (iconOnly) {
    return (
      <div
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground',
          className
        )}
      >
        <ChanakyaIcon className="h-6 w-6" />
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <ChanakyaIcon className="h-6 w-6" />
      </div>
      <span className="text-xl font-bold tracking-tight text-foreground">
        Personal Chanakya
      </span>
    </div>
  );
}
