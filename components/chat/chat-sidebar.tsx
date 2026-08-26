'use client';

import { Plus, Search, Stethoscope } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { ConversationSummary } from './types';

interface ChatSidebarProps {
  onNewChat: () => void;
  newChatLabel?: string;
  conversations?: ConversationSummary[];
  activeConversationId?: number | null;
  onSelectConversation?: (id: number) => void;
  placeholderTitles?: string[];
  userName: string;
  userEmail: string;
  userImage?: string | null;
  footer: React.ReactNode;
}

export function ChatSidebar({
  onNewChat,
  newChatLabel = 'New Consultation',
  conversations,
  activeConversationId,
  onSelectConversation,
  placeholderTitles = [],
  userName,
  userEmail,
  userImage,
  footer,
}: ChatSidebarProps) {
  const hasReal = conversations && conversations.length > 0;

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-soft">
          <Stethoscope size={17} />
        </div>
        <span className="font-display text-lg font-semibold text-foreground">DietechAI</span>
      </div>

      {/* New chat + search */}
      <div className="space-y-2 px-3">
        <button
          onClick={onNewChat}
          className="flex w-full cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-sm font-medium text-white shadow-soft transition-all hover:from-emerald-700 hover:to-teal-700 hover:shadow-lift dark:from-emerald-500 dark:to-teal-500"
        >
          <Plus size={18} />
          {newChatLabel}
        </button>
        <button className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-elevated hover:text-foreground">
          <Search size={16} />
          Search consultations
        </button>
      </div>

      {/* Conversations */}
      <div className="scrollbar-slim mt-4 flex-1 overflow-y-auto px-3 pb-2">
        <h3 className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-subtle">
          Recent Consultations
        </h3>
        <div className="space-y-0.5">
          {hasReal
            ? conversations!.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onSelectConversation?.(c.id)}
                  className={cn(
                    'w-full cursor-pointer truncate rounded-lg px-3 py-2 text-left text-sm transition-colors',
                    activeConversationId === c.id
                      ? 'bg-primary/10 font-medium text-primary'
                      : 'text-muted hover:bg-elevated hover:text-foreground'
                  )}
                >
                  {c.title}
                </button>
              ))
            : placeholderTitles.map((title) => (
                <div key={title} className="truncate rounded-lg px-3 py-2 text-sm text-subtle">
                  {title}
                </div>
              ))}
        </div>
      </div>

      {/* User + footer action */}
      <div className="border-t border-border p-3">
        <div className="mb-2 flex items-center gap-3 rounded-xl px-2 py-1.5">
          <Avatar name={userName} src={userImage} size={38} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-foreground">{userName}</div>
            <div className="truncate text-xs text-subtle">{userEmail}</div>
          </div>
        </div>
        {footer}
      </div>
    </div>
  );
}
