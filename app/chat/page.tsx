'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatShell } from '@/components/chat/chat-shell';
import { ChatSidebar } from '@/components/chat/chat-sidebar';
import { ChatHeader } from '@/components/chat/chat-header';
import { MessageList } from '@/components/chat/message-list';
import { ChatInput } from '@/components/chat/chat-input';
import { EmptyState } from '@/components/chat/empty-state';
import type { ChatMessage, Suggestion } from '@/components/chat/types';

interface User {
  id: number;
  email: string;
  full_name: string;
  user_type: string;
  specialization?: string;
  phone_number?: string;
  profile_image?: string;
}

interface Conversation {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: number | string;
  message: string;
  is_user_message: boolean;
  created_at: string;
  isStreaming?: boolean;
}

const SUGGESTIONS: Suggestion[] = [
  {
    initials: 'DM',
    title: 'Diabetes Management',
    description: 'Create a precision meal plan for a 55-year-old with T2DM and CKD stage 3',
    prompt: 'Create a precision meal plan for a 55-year-old with T2DM and CKD stage 3.',
  },
  {
    initials: 'DD',
    title: 'Drug–Nutrient Interactions',
    description: 'Warfarin and vitamin K interactions with counseling tips',
    prompt: 'List key interactions between warfarin and vitamin K–rich foods, with counseling tips.',
  },
  {
    initials: 'GE',
    title: 'Geriatric Nutrition',
    description: 'Nutritional considerations for elderly with sarcopenia',
    prompt: 'What are the nutritional considerations for elderly patients with sarcopenia?',
  },
  {
    initials: 'CV',
    title: 'Cardiovascular Health',
    description: 'Mediterranean diet benefits for heart health',
    prompt: 'Explain the Mediterranean diet and its benefits for cardiovascular health.',
  },
];

const PLACEHOLDER_TITLES = [
  'Diabetes meal planning',
  'Renal diet consultation',
  'Cardiac nutrition plan',
  'Pediatric nutrition',
  'Sports nutrition',
];

export default function ChatPage() {
  const [user, setUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        if (data.user.user_type === 'admin') {
          router.push('/dashboard/admin');
          return;
        }
        setUser(data.user);
        loadConversations();
      } else {
        router.push('/login');
      }
    } catch (error) {
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  };

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/chat/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations);
        if (data.conversations.length > 0) {
          setActiveConversation(data.conversations[0].id);
          loadMessages(data.conversations[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const loadMessages = async (conversationId: number) => {
    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const createNewConversation = async () => {
    try {
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Chat' }),
      });

      if (response.ok) {
        const data = await response.json();
        setConversations([data.conversation, ...conversations]);
        setActiveConversation(data.conversation.id);
        setMessages([]);
        setIsSidebarOpen(false);
      }
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeConversation || isSending) return;

    const userMessage = input;
    setInput('');
    setIsSending(true);

    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      message: userMessage,
      is_user_message: true,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);

    const tempAiMessage: Message = {
      id: `temp-ai-${Date.now()}`,
      message: '',
      is_user_message: false,
      created_at: new Date().toISOString(),
      isStreaming: true,
    };
    setMessages((prev) => [...prev, tempAiMessage]);

    try {
      const response = await fetch(`/api/chat/conversations/${activeConversation}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });

      if (response.ok) {
        const reader = response.body?.getReader();
        if (reader) {
          const decoder = new TextDecoder();
          let aiResponse = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            aiResponse += chunk;

            setMessages((prev) => {
              const newMessages = [...prev];
              const aiMessageIndex = newMessages.findIndex((m) => m.id === tempAiMessage.id);
              if (aiMessageIndex !== -1) {
                newMessages[aiMessageIndex] = {
                  ...newMessages[aiMessageIndex],
                  message: aiResponse,
                };
              }
              return newMessages;
            });
          }

          setMessages((prev) => {
            const newMessages = [...prev];
            const aiMessageIndex = newMessages.findIndex((m) => m.id === tempAiMessage.id);
            if (aiMessageIndex !== -1) {
              newMessages[aiMessageIndex] = {
                ...newMessages[aiMessageIndex],
                id: Date.now(),
                isStreaming: false,
              };
            }
            return newMessages;
          });
        }
      } else {
        setMessages((prev) =>
          prev.filter((m) => m.id !== tempUserMessage.id && m.id !== tempAiMessage.id)
        );
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) =>
        prev.filter((m) => m.id !== tempUserMessage.id && m.id !== tempAiMessage.id)
      );
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          message: 'Sorry, there was an error sending your message. Please try again.',
          is_user_message: false,
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsSending(false);
      loadConversations();
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted">Loading chat…</p>
        </div>
      </div>
    );
  }

  const uiMessages: ChatMessage[] = messages.map((m) => ({
    id: m.id,
    content: m.message,
    isUser: m.is_user_message,
    timestamp: m.created_at,
    isStreaming: m.isStreaming,
  }));

  const sidebar = (
    <ChatSidebar
      onNewChat={createNewConversation}
      conversations={conversations}
      activeConversationId={activeConversation}
      onSelectConversation={(id) => {
        setActiveConversation(id);
        loadMessages(id);
        setIsSidebarOpen(false);
      }}
      placeholderTitles={PLACEHOLDER_TITLES}
      userName={user?.full_name || 'Nutritionist'}
      userEmail={user?.email || 'dietech.ai'}
      userImage={user?.profile_image}
      footer={
        <Button variant="secondary" size="sm" className="w-full" onClick={handleLogout}>
          <LogOut size={16} />
          Logout
        </Button>
      }
    />
  );

  return (
    <ChatShell
      sidebarOpen={isSidebarOpen}
      onCloseSidebar={() => setIsSidebarOpen(false)}
      sidebar={sidebar}
      header={<ChatHeader onMenuClick={() => setIsSidebarOpen(true)} />}
    >
      <MessageList
        messages={uiMessages}
        emptyState={
          <EmptyState
            suggestions={SUGGESTIONS}
            onPick={(prompt) => setInput(prompt)}
            footer="Powered by evidence-based clinical nutrition guidelines"
          />
        }
      />
      <ChatInput
        value={input}
        onChange={setInput}
        onSubmit={sendMessage}
        disabled={isSending || !activeConversation}
      />
    </ChatShell>
  );
}
