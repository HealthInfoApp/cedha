'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Send, User, Bot, Plus, Menu, X, LogOut, MessageSquare, Settings, User as UserIcon, Search, Book, Folder, Grid3X3, Mic, Activity, ChevronDown, Diamond } from 'lucide-react';
import Markdown from 'react-markdown';

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

export default function ChatPage() {
  const [user, setUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'New Chat',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setConversations([data.conversation, ...conversations]);
        setActiveConversation(data.conversation.id);
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeConversation || isSending) return;

    const userMessage = input;
    setInput('');
    setIsSending(true);

    // Add user message immediately
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      message: userMessage,
      is_user_message: true,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, tempUserMessage]);

    // Add temporary AI message for streaming
    const tempAiMessage: Message = {
      id: `temp-ai-${Date.now()}`,
      message: '',
      is_user_message: false,
      created_at: new Date().toISOString(),
      isStreaming: true,
    };

    setMessages(prev => [...prev, tempAiMessage]);

    try {
      const response = await fetch(`/api/chat/conversations/${activeConversation}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
        }),
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

            // Update the streaming message
            setMessages(prev => {
              const newMessages = [...prev];
              const aiMessageIndex = newMessages.findIndex(m => m.id === tempAiMessage.id);
              if (aiMessageIndex !== -1) {
                newMessages[aiMessageIndex] = {
                  ...newMessages[aiMessageIndex],
                  message: aiResponse,
                };
              }
              return newMessages;
            });
          }

          // Final update to mark streaming as complete
          setMessages(prev => {
            const newMessages = [...prev];
            const aiMessageIndex = newMessages.findIndex(m => m.id === tempAiMessage.id);
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
        // Remove temporary messages if failed
        setMessages(prev => prev.filter(m => m.id !== tempUserMessage.id && m.id !== tempAiMessage.id));
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove temporary messages if error
      setMessages(prev => prev.filter(m => m.id !== tempUserMessage.id && m.id !== tempAiMessage.id));
      
      // Add error message
      setMessages(prev => [
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
      
      // Update conversation list
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-gray-900 text-white transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out md:relative md:translate-x-0 flex flex-col`}
      >
        {/* Top Section */}
        <div className="p-4 border-b border-gray-700">
          <button
            onClick={createNewConversation}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md border border-gray-600 hover:bg-gray-800 transition-colors"
          >
            <Plus size={16} />
            New chat
            <span className="ml-auto text-xs text-gray-400">Ctrl+Shift+O</span>
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded-md transition-colors mt-2">
            <Search size={16} />
            Search chats
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded-md transition-colors">
            <Book size={16} />
            Library
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded-md transition-colors">
            <Folder size={16} />
            Projects
          </button>
        </div>

        {/* GPTs Section */}
        <div className="border-b border-gray-700 p-4">
          <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded-md transition-colors">
            <Grid3X3 size={16} />
            Explore
          </button>
          <div className="mt-3 space-y-1">
            <div className="flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded-md transition-colors cursor-pointer">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              AI Humanizer
            </div>
            <div className="flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded-md transition-colors cursor-pointer">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              Website Generator
            </div>
            <div className="flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded-md transition-colors cursor-pointer">
              <div className="w-4 h-4 bg-purple-500 rounded"></div>
              Code Tutor
            </div>
          </div>
        </div>

        {/* Your chats Section */}
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-xs text-gray-400 uppercase font-semibold mb-2">Your chats</p>
          <div className="space-y-1">
            {conversations.length > 0 ? (
              conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => {
                    setActiveConversation(conversation.id);
                    loadMessages(conversation.id);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    activeConversation === conversation.id 
                      ? 'bg-gray-800 text-white' 
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <div className="truncate">
                    {conversation.title}
                  </div>
                </button>
              ))
            ) : (
              <div className="text-sm text-gray-500">
                <div className="px-3 py-2">Reply message draft</div>
                <div className="px-3 py-2">Group name suggestions</div>
                <div className="px-3 py-2">Project report structure</div>
                <div className="px-3 py-2">Calculate total cost</div>
                <div className="px-3 py-2">Generate it now</div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-3 px-3 py-2 mb-3">
            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
              <User size={16} />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">{user?.full_name || 'User'}</div>
              <div className="text-xs text-gray-400">chatopt.com</div>
            </div>
          </div>
          <button className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors">
            Upgrade
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-gray-200 px-4 py-3 flex items-center justify-between bg-white">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden p-2 rounded-md hover:bg-gray-100">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-3 py-1 rounded-md transition-colors">
              <h1 className="text-lg font-semibold">ChatGPT</h1>
              <ChevronDown size={16} className="text-gray-500" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-1 px-3 py-1 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors border border-gray-300 rounded-md hover:bg-gray-50">
              <Diamond size={14} />
              Upgrade to Go
            </button>
            <div className="text-sm text-gray-500 flex items-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              Memory full
            </div>
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-400 transition-colors">
              <User size={16} className="text-gray-600" />
            </div>
            <button className="p-2 rounded-md hover:bg-gray-100 transition-colors">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </header>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <h2 className="text-3xl font-semibold text-gray-800 mb-4">
                  Where should we begin?
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8 max-w-2xl mx-auto">
                  <button
                    onClick={() => setInput('Create a precision meal plan for a 55-year-old with T2DM and CKD stage 3.')}
                    className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    Create a precision meal plan for a 55-year-old with T2DM and CKD stage 3.
                  </button>
                  <button
                    onClick={() => setInput('List key interactions between warfarin and vitamin K–rich foods, with counseling tips.')}
                    className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    List key interactions between warfarin and vitamin K–rich foods, with counseling tips.
                  </button>
                  <button
                    onClick={() => setInput('What are the nutritional considerations for elderly patients with sarcopenia?')}
                    className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    What are the nutritional considerations for elderly patients with sarcopenia?
                  </button>
                  <button
                    onClick={() => setInput('Explain the Mediterranean diet and its benefits for cardiovascular health.')}
                    className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    Explain the Mediterranean diet and its benefits for cardiovascular health.
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto py-6 px-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.is_user_message ? 'justify-end' : 'justify-start'} mb-6`}
                >
                  <div
                    className={`flex max-w-[85%] md:max-w-[80%] ${
                      message.is_user_message ? 'flex-row-reverse' : ''
                    }`}
                  >
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        message.is_user_message ? 'bg-blue-600 text-white ml-3' : 'bg-gray-200 text-gray-700 mr-3'
                      }`}
                    >
                      {message.is_user_message ? <User size={16} /> : <Bot size={16} />}
                    </div>
                    <div
                      className={`px-4 py-3 rounded-2xl ${
                        message.is_user_message
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-white border border-gray-200 rounded-bl-none shadow-sm'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{message.message}</div>
                      <div className={`text-xs mt-2 ${
                        message.is_user_message ? 'text-blue-200' : 'text-gray-500'
                      }`}>
                        {new Date(message.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {isSending && (
                <div className="flex items-center justify-start mb-6">
                  <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center mr-3">
                    <Bot size={16} className="animate-pulse" />
                  </div>
                  <div className="px-4 py-3 bg-white border border-gray-200 rounded-2xl rounded-bl-none shadow-sm">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-100" />
                      <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 bg-white px-4 py-4">
          <form onSubmit={sendMessage} className="max-w-3xl mx-auto">
            <div className="relative">
              <button
                type="button"
                className="absolute left-3 bottom-3 p-1 rounded-md text-gray-400 hover:text-gray-600"
              >
                <Plus size={20} />
              </button>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything"
                rows={1}
                className="w-full pl-10 pr-24 py-3 text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none max-h-32"
                disabled={isSending || !activeConversation}
              />
              <div className="absolute right-2 bottom-2 flex items-center gap-1">
                <button
                  type="button"
                  className="p-1 rounded-md text-gray-400 hover:text-gray-600"
                >
                  <Mic size={20} />
                </button>
                <button
                  type="button"
                  className="p-1 rounded-md text-gray-400 hover:text-gray-600"
                >
                  <Activity size={20} />
                </button>
                <button
                  type="submit"
                  disabled={!input.trim() || isSending || !activeConversation}
                  className="p-1 rounded-md text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:hover:text-gray-400"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500 text-center">
              ChatGPT can make mistakes. Consider checking important information.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}