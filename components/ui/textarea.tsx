'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'w-full rounded-xl border border-border-strong bg-surface px-3.5 py-2.5 text-sm text-foreground',
      'placeholder:text-subtle transition-colors resize-none',
      'focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring/40',
      'disabled:opacity-60 disabled:cursor-not-allowed',
      className
    )}
    {...props}
  />
));
Textarea.displayName = 'Textarea';
