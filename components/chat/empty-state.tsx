'use client';

import { Stethoscope } from 'lucide-react';
import type { Suggestion } from './types';

interface EmptyStateProps {
  title?: string;
  subtitle?: string;
  suggestions: Suggestion[];
  onPick: (prompt: string) => void;
  footer?: string;
}

export function EmptyState({
  title = 'Welcome to DietechAI',
  subtitle = 'Your clinical nutrition assistant for evidence-based dietary guidance',
  suggestions,
  onPick,
  footer,
}: EmptyStateProps) {
  return (
    <div className="flex min-h-full items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl text-center">
        <div className="animate-fade-up mb-8">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lift">
            <Stethoscope size={30} />
          </div>
          <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">{title}</h2>
          <p className="mx-auto mt-3 max-w-lg text-muted">{subtitle}</p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {suggestions.map((s, i) => (
            <button
              key={s.title}
              onClick={() => onPick(s.prompt)}
              style={{ animationDelay: `${0.05 + i * 0.06}s` }}
              className="group animate-fade-up flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-surface p-4 text-left shadow-soft transition-all hover:border-primary/50 hover:shadow-lift"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary transition-colors group-hover:bg-primary/15">
                {s.initials}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-foreground">{s.title}</h3>
                <p className="mt-0.5 text-xs leading-relaxed text-muted">{s.description}</p>
              </div>
            </button>
          ))}
        </div>

        {footer && <p className="mt-8 text-sm text-subtle">{footer}</p>}
      </div>
    </div>
  );
}
