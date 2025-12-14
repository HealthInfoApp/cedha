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
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 text-slate-900 transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out md:relative md:translate-x-0 flex flex-col`}
      >
        {/* Top Section */}
        <div className="p-4 border-b border-slate-200">
          <button
            onClick={createNewConversation}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl text-white"
          >
            <Plus size={18} />
            New Consultation
          </button>
          <div className="mt-3">
            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-md transition-colors">
              <Search size={16} />
              Search consultations
            </button>
          </div>
        </div>

        {/* Recent Consultations */}
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-xs text-slate-500 uppercase font-semibold mb-3">Recent Consultations</h3>
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
                      ? 'bg-emerald-50 text-emerald-900 border-l-2 border-emerald-500' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="truncate">
                    {conversation.title}
                  </div>
                </button>
              ))
            ) : (
              <div className="text-sm text-slate-400">
                <div className="px-3 py-2">Diabetes meal planning</div>
                <div className="px-3 py-2">Renal diet consultation</div>
                <div className="px-3 py-2">Cardiac nutrition plan</div>
                <div className="px-3 py-2">Pediatric nutrition</div>
                <div className="px-3 py-2">Sports nutrition</div>
              </div>
            )}
          </div>
        </div>

        {/* User Profile Section */}
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3 px-3 py-2 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-lg">
              <User size={18} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-slate-900">{user?.full_name || 'Nutritionist'}</div>
              <div className="text-xs text-slate-500">{user?.email || 'dietech.ai'}</div>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all duration-200"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-slate-200 px-4 py-3 flex items-center justify-between bg-white shadow-sm">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden p-2 rounded-md hover:bg-slate-100 transition-colors">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 px-4 py-2 rounded-lg transition-colors group">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                <span className="text-white font-bold text-sm">D</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-900">DietechAI</h1>
                <p className="text-xs text-slate-500">Clinical Nutrition Assistant</p>
              </div>
              <ChevronDown size={16} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400">
              <div className="w-4 h-4 bg-gradient-to-br from-amber-400 to-orange-500 rounded"></div>
              Pro Features
            </button>
            <div className="text-sm text-slate-500 flex items-center gap-2 px-3 py-1 bg-amber-50 rounded-full border border-amber-200">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
              <span className="text-amber-700 font-medium">5 consultations left</span>
            </div>
            <div className="w-8 h-8 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center cursor-pointer hover:from-slate-300 hover:to-slate-400 transition-all duration-200 shadow-sm hover:shadow-md">
              <User size={16} className="text-slate-600" />
            </div>
            <button className="p-2 rounded-lg hover:bg-slate-100 transition-colors group">
              <svg className="w-5 h-5 text-slate-600 group-hover:text-slate-800 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </header>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full bg-gradient-to-br from-emerald-50 to-teal-50">
              <div className="text-center max-w-4xl mx-auto px-6">
                <div className="mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-4">
                    <span className="text-white font-bold text-2xl">D</span>
                  </div>
                  <h2 className="text-4xl font-bold text-slate-900 mb-3">
                    Welcome to DietechAI
                  </h2>
                  <p className="text-lg text-slate-600 mb-8">
                    Your clinical nutrition assistant for evidence-based dietary guidance
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  <button
                    onClick={() => setInput('Create a precision meal plan for a 55-year-old with T2DM and CKD stage 3.')}
                    className="p-4 text-left border border-slate-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-200 text-sm group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-200 transition-colors">
                        <span className="text-emerald-600 font-semibold text-xs">DM</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 mb-1">Diabetes Management</h3>
                        <p className="text-slate-600 text-xs">Create a precision meal plan for a 55-year-old with T2DM and CKD stage 3</p>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => setInput('List key interactions between warfarin and vitamin K–rich foods, with counseling tips.')}
                    className="p-4 text-left border border-slate-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-sm group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                        <span className="text-blue-600 font-semibold text-xs">DD</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 mb-1">Drug-Nutrient Interactions</h3>
                        <p className="text-slate-600 text-xs">Warfarin and vitamin K interactions with counseling tips</p>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => setInput('What are the nutritional considerations for elderly patients with sarcopenia?')}
                    className="p-4 text-left border border-slate-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 text-sm group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-purple-200 transition-colors">
                        <span className="text-purple-600 font-semibold text-xs">GE</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 mb-1">Geriatric Nutrition</h3>
                        <p className="text-slate-600 text-xs">Nutritional considerations for elderly with sarcopenia</p>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => setInput('Explain the Mediterranean diet and its benefits for cardiovascular health.')}
                    className="p-4 text-left border border-slate-200 rounded-xl hover:border-amber-300 hover:bg-amber-50 transition-all duration-200 text-sm group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-amber-200 transition-colors">
                        <span className="text-amber-600 font-semibold text-xs">CV</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 mb-1">Cardiovascular Health</h3>
                        <p className="text-slate-600 text-xs">Mediterranean diet benefits for heart health</p>
                      </div>
                    </div>
                  </button>
                </div>
                <div className="text-sm text-slate-500">
                  <p>Powered by evidence-based clinical nutrition guidelines</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto py-6 px-4">
              {messages.map((message) => (
                <div
// ... (rest of the code remains the same)
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
                          : 'bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 text-slate-800 rounded-bl-none shadow-sm backdrop-blur-sm'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{message.message}</div>
                      <div className={`text-xs mt-2 ${
                        message.is_user_message ? 'text-blue-200' : 'text-emerald-600'
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
                  <div className="px-4 py-3 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 text-slate-800 rounded-2xl rounded-bl-none shadow-sm backdrop-blur-sm">
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
        <div className="border-t border-slate-200 bg-white px-4 py-4">
          <form onSubmit={sendMessage} className="max-w-3xl mx-auto">
            <div className="relative">
              <button
                type="button"
                className="absolute left-3 bottom-3 p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all duration-200"
              >
                <Plus size={20} />
              </button>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about clinical nutrition, meal planning, or dietary guidelines..."
                rows={1}
                className="w-full pl-12 pr-32 py-4 text-slate-900 bg-slate-50 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none max-h-32 transition-all duration-200 placeholder-slate-500"
                disabled={isSending || !activeConversation}
              />
              <div className="absolute right-2 bottom-2 flex items-center gap-1">
                <button
                  type="button"
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all duration-200"
                >
                  <Mic size={20} />
                </button>
                <button
                  type="button"
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all duration-200"
                >
                  <Activity size={20} />
                </button>
                <button
                  type="submit"
                  disabled={!input.trim() || isSending || !activeConversation}
                  className="p-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-slate-300 disabled:text-slate-500 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-500 text-center flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              DietechAI provides evidence-based nutrition guidance. Always verify critical clinical decisions.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}