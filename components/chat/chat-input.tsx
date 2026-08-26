'use client';

import { useEffect, useRef } from 'react';
import { Plus, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder?: string;
  banner?: React.ReactNode;
  disclaimer?: string;
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  disabled,
  placeholder = 'Ask about clinical nutrition, meal planning, or dietary guidelines…',
  banner,
  disclaimer = 'DietechAI provides evidence-based nutrition guidance. Always verify critical clinical decisions.',
}: ChatInputProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Auto-resize
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  const submit = () => {
    if (disabled || !value.trim()) return;
    onSubmit();
  };

  return (
    <div className="border-t border-border bg-surface/80 px-3 py-3 backdrop-blur md:px-4 md:py-4">
      <div className="mx-auto max-w-3xl">
        {banner}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className={cn(
            'flex items-end gap-2 rounded-2xl border border-border-strong bg-surface p-2 shadow-soft transition-colors',
            'focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/30'
          )}
        >
          <button
            type="button"
            aria-label="Attach"
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl text-subtle transition-colors hover:bg-elevated hover:text-foreground"
          >
            <Plus size={20} />
          </button>
          <textarea
            ref={ref}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={1}
            placeholder={placeholder}
            className="max-h-[200px] flex-1 resize-none bg-transparent py-2 text-[15px] text-foreground placeholder:text-subtle focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Send message"
            disabled={disabled || !value.trim()}
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-soft transition-all hover:shadow-lift disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none dark:from-emerald-500 dark:to-teal-500"
          >
            <Send size={18} />
          </button>
        </form>
        <p className="mt-2.5 flex items-center justify-center gap-2 text-center text-xs text-subtle">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
          {disclaimer}
        </p>
      </div>
    </div>
  );
}
