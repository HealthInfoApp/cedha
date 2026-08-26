'use client';

import { useEffect, useRef } from 'react';
import { ChatBubble } from './chat-bubble';
import type { ChatMessage } from './types';

interface MessageListProps {
  messages: ChatMessage[];
  /** Show a standalone typing indicator (when no empty streaming bubble exists yet). */
  isTyping?: boolean;
  emptyState: React.ReactNode;
}

export function MessageList({ messages, isTyping, emptyState }: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (messages.length === 0) {
    return <div className="scrollbar-slim flex-1 overflow-y-auto">{emptyState}</div>;
  }

  return (
    <div className="scrollbar-slim flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        {messages.map((m) => (
          <ChatBubble key={m.id} message={m} />
        ))}
        {isTyping && (
          <ChatBubble message={{ id: '__typing__', content: '', isUser: false, isStreaming: true }} />
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
