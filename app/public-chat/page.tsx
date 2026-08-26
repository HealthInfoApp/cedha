'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChatShell } from '@/components/chat/chat-shell';
import { ChatSidebar } from '@/components/chat/chat-sidebar';
import { ChatHeader } from '@/components/chat/chat-header';
import { MessageList } from '@/components/chat/message-list';
import { ChatInput } from '@/components/chat/chat-input';
import { EmptyState } from '@/components/chat/empty-state';
import type { ChatMessage, Suggestion } from '@/components/chat/types';

type Message = {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
};

const MESSAGE_LIMIT = 5;

const SUGGESTIONS: Suggestion[] = [
  {
    initials: 'NC',
    title: 'Nutrition Counseling',
    description: 'What is nutrition counseling and how can it help me?',
    prompt: 'What is nutrition counseling and how can it help me?',
  },
  {
    initials: 'DI',
    title: 'Diet Improvement',
    description: 'How can I improve my daily diet for better health?',
    prompt: 'How can I improve my daily diet for better health?',
  },
  {
    initials: 'SF',
    title: 'Superfoods',
    description: 'What are the most important superfoods for overall wellness?',
    prompt: 'What are the most important superfoods for overall wellness?',
  },
  {
    initials: 'HY',
    title: 'Hydration',
    description: 'How much water should I drink daily and why is it important?',
    prompt: 'How much water should I drink daily and why is it important?',
  },
];

const PLACEHOLDER_TITLES = [
  'Diabetes meal planning',
  'Renal diet consultation',
  'Cardiac nutrition plan',
  'Pediatric nutrition',
  'Sports nutrition',
];

export default function PublicChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();

  const limitReached = messageCount >= MESSAGE_LIMIT;

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;

    if (messageCount >= MESSAGE_LIMIT) {
      router.push('/login?redirect=/chat');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setMessageCount((prev) => prev + 1);

    try {
      const response = await fetch('/api/chat/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: '',
        role: 'assistant',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      const messageIndex = messages.length + 1; // Account for the newly added user message

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        setMessages((prev) => {
          const newMessages = [...prev];
          if (newMessages[messageIndex]) {
            newMessages[messageIndex] = {
              ...newMessages[messageIndex],
              content: newMessages[messageIndex].content + chunk,
            };
          }
          return newMessages;
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          content: 'Sorry, I encountered an error. Please try again.',
          role: 'assistant',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = () => {
    if (messageCount >= MESSAGE_LIMIT) {
      router.push('/login?redirect=/chat');
    } else {
      setMessages([]);
      setIsSidebarOpen(false);
    }
  };

  const uiMessages: ChatMessage[] = messages.map((m) => ({
    id: m.id,
    content: m.content,
    isUser: m.role === 'user',
    timestamp: m.timestamp,
    isStreaming: m.role === 'assistant' && m.content === '',
  }));

  const streamingAssistantExists = messages.some((m) => m.role === 'assistant' && m.content === '');

  const sidebar = (
    <ChatSidebar
      onNewChat={startNewChat}
      placeholderTitles={PLACEHOLDER_TITLES}
      userName="Public User"
      userEmail="dietech.ai"
      footer={
        <Button
          variant="secondary"
          size="sm"
          className="w-full"
          onClick={() => router.push('/login?redirect=/chat')}
        >
          Login for unlimited chats
        </Button>
      }
    />
  );

  const headerRight = (
    <div className="flex items-center gap-2 rounded-full border border-amber-300/70 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
      <span>{Math.max(0, MESSAGE_LIMIT - messageCount)} left</span>
    </div>
  );

  return (
    <ChatShell
      sidebarOpen={isSidebarOpen}
      onCloseSidebar={() => setIsSidebarOpen(false)}
      sidebar={sidebar}
      header={<ChatHeader onMenuClick={() => setIsSidebarOpen(true)} right={headerRight} />}
    >
      <MessageList
        messages={uiMessages}
        isTyping={isLoading && !streamingAssistantExists}
        emptyState={
          <EmptyState
            suggestions={SUGGESTIONS}
            onPick={(prompt) => setInput(prompt)}
            footer={`Try DietechAI free for ${MESSAGE_LIMIT} consultations • Login for unlimited access`}
          />
        }
      />
      <ChatInput
        value={input}
        onChange={setInput}
        onSubmit={handleSubmit}
        disabled={isLoading || limitReached}
        banner={
          limitReached ? (
            <div className="mb-2 rounded-xl border border-amber-300/70 bg-amber-50 px-4 py-2.5 text-center text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
              You&apos;ve reached the free consultation limit.{' '}
              <button
                onClick={() => router.push('/login?redirect=/chat')}
                className="cursor-pointer font-medium text-primary underline underline-offset-2"
              >
                Login
              </button>{' '}
              for unlimited access.
            </div>
          ) : null
        }
      />
    </ChatShell>
  );
}
