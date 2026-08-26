'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const fieldStyles =
  'w-full rounded-xl border border-border-strong bg-surface px-3.5 py-2.5 text-sm text-foreground ' +
  'placeholder:text-subtle transition-colors ' +
  'focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring/40 ' +
  'disabled:opacity-60 disabled:cursor-not-allowed';

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(fieldStyles, className)} {...props} />
  )
);
Input.displayName = 'Input';

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select ref={ref} className={cn(fieldStyles, 'cursor-pointer', className)} {...props} />
  )
);
Select.displayName = 'Select';

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn('block text-sm font-medium text-muted mb-1.5', className)}
      {...props}
    />
  );
}
