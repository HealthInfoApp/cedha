'use client';

import { Menu } from 'lucide-react';
import { IconButton } from '@/components/ui/icon-button';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface ChatHeaderProps {
  onMenuClick: () => void;
  subtitle?: string;
  right?: React.ReactNode;
}

export function ChatHeader({ onMenuClick, subtitle = 'Clinical Nutrition Assistant', right }: ChatHeaderProps) {
  return (
    <header className="flex h-16 items-center gap-2 border-b border-border bg-surface/80 px-3 backdrop-blur md:px-5">
      <IconButton onClick={onMenuClick} aria-label="Open menu" className="md:hidden">
        <Menu size={20} />
      </IconButton>

      <div className="flex flex-1 items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-bold text-white shadow-soft">
          D
        </div>
        <div className="leading-tight">
          <h1 className="text-[15px] font-semibold text-foreground">DietechAI</h1>
          <p className="hidden text-xs text-subtle sm:block">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {right}
        <ThemeToggle />
      </div>
    </header>
  );
}
