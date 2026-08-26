'use client';

import Image from 'next/image';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export function AppNavbar({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <nav className="border-b border-border bg-surface/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-white">
            <Image src="/dietech.png" alt="DietechAI" width={32} height={32} />
          </div>
          <span className="font-display text-lg font-semibold text-foreground">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {children}
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
