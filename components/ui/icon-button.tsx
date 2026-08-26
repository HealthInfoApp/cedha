'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export const IconButton = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, type = 'button', ...props }, ref) => (
  <button
    ref={ref}
    type={type}
    className={cn(
      'inline-flex h-10 w-10 items-center justify-center rounded-xl cursor-pointer',
      'text-muted transition-colors hover:text-foreground hover:bg-elevated',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      className
    )}
    {...props}
  />
));
IconButton.displayName = 'IconButton';
