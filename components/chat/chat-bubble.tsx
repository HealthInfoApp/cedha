'use client';

import { useState } from 'react';
import Markdown from 'react-markdown';
import { Bot, Check, Copy, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatMessage } from './types';
import { TypingIndicator } from './typing-indicator';

function formatTime(ts?: string | Date) {
  if (!ts) return '';
  const d = typeof ts === 'string' ? new Date(ts) : ts;
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function ChatBubble({ message }: { message: ChatMessage }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.isUser;
  const showTyping = !isUser && message.isStreaming && !message.content;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard may be unavailable */
    }
  };

  return (
    <div className={cn('group animate-fade-up flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      <div
        className={cn(
          'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-soft',
          isUser
            ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
            : 'bg-elevated text-primary'
        )}
      >
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>

      {/* Bubble */}
      <div className={cn('flex max-w-[85%] flex-col md:max-w-[75%]', isUser && 'items-end')}>
        <div
          className={cn(
            'rounded-2xl px-4 py-3 text-[15px] leading-relaxed shadow-soft',
            isUser
              ? 'rounded-tr-sm bg-gradient-to-br from-emerald-600 to-teal-600 text-white dark:from-emerald-500 dark:to-teal-500'
              : 'rounded-tl-sm border border-border bg-surface text-foreground'
          )}
        >
          {showTyping ? (
            <TypingIndicator />
          ) : isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="md">
              <Markdown>{message.content}</Markdown>
            </div>
          )}
        </div>

        {/* Meta row */}
        <div
          className={cn(
            'mt-1 flex items-center gap-2 px-1 text-[11px] text-subtle',
            isUser && 'flex-row-reverse'
          )}
        >
          <span>{formatTime(message.timestamp)}</span>
          {!isUser && !showTyping && message.content && (
            <button
              onClick={copy}
              aria-label="Copy message"
              className="flex cursor-pointer items-center gap-1 opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
