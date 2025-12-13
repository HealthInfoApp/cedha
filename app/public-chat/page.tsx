'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Send, User, Bot, LogIn, Plus, Menu, X, MessageSquare, Search, Book, Folder, Grid3X3, Mic, Activity, ChevronDown, Diamond } from 'lucide-react';
import Markdown from 'react-markdown';

type Message = {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
};

export default function PublicChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  const MESSAGE_LIMIT = 5;

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Check message limit
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
      // Simulate streaming response
      const response = await fetch('/api/chat/public', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
      const messageIndex = messages.length;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[messageIndex] = {
            ...newMessages[messageIndex],
            content: newMessages[messageIndex].content + chunk,
          };
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
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-20 w-64 bg-white border-r border-slate-200 text-slate-900 transition-transform duration-300 ease-in-out transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:relative md:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-slate-200">
            <button
              onClick={startNewChat}
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
              <div className="text-sm text-slate-400">
                <div className="px-3 py-2">Diabetes meal planning</div>
                <div className="px-3 py-2">Renal diet consultation</div>
                <div className="px-3 py-2">Cardiac nutrition plan</div>
                <div className="px-3 py-2">Pediatric nutrition</div>
                <div className="px-3 py-2">Sports nutrition</div>
              </div>
            </div>
          </div>
          
          {/* User Profile Section */}
          <div className="p-4 border-t border-slate-200">
            <div className="flex items-center gap-3 px-3 py-2 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-lg">
                <User size={18} className="text-white" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-900">Demo User</div>
                <div className="text-xs text-slate-500">dietech.ai</div>
              </div>
            </div>
            <button
              onClick={() => router.push('/login?redirect=/chat')}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all duration-200"
            >
              Login to access unlimited chats
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-white">
        {/* Header */}
        <header className="border-b border-slate-200 px-4 py-3 flex items-center justify-between bg-white shadow-sm">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="md:hidden p-2 rounded-md hover:bg-slate-100"
          >
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
              Login for Unlimited
            </button>
            <div className="text-sm text-slate-500 flex items-center gap-2 px-3 py-1 bg-amber-50 rounded-full border border-amber-200">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
              <span className="text-amber-700 font-medium">{MESSAGE_LIMIT - messageCount} left</span>
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
            <div className="h-full flex flex-col items-center justify-center px-4 bg-gradient-to-br from-emerald-50 to-teal-50">
              <div className="max-w-4xl w-full text-center">
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
                    onClick={() => setInput('What is nutrition counseling and how can it help me?')}
                    className="p-4 text-left border border-slate-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-200 text-sm group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-200 transition-colors">
                        <span className="text-emerald-600 font-semibold text-xs">NC</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 mb-1">Nutrition Counseling</h3>
                        <p className="text-slate-600 text-xs">What is nutrition counseling and how can it help me?</p>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => setInput('How can I improve my daily diet for better health?')}
                    className="p-4 text-left border border-slate-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-sm group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                        <span className="text-blue-600 font-semibold text-xs">DI</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 mb-1">Diet Improvement</h3>
                        <p className="text-slate-600 text-xs">How can I improve my daily diet for better health?</p>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => setInput('What are the most important superfoods for overall wellness?')}
                    className="p-4 text-left border border-slate-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 text-sm group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-purple-200 transition-colors">
                        <span className="text-purple-600 font-semibold text-xs">SF</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 mb-1">Superfoods</h3>
                        <p className="text-slate-600 text-xs">What are the most important superfoods for overall wellness?</p>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => setInput('How much water should I drink daily and why is it important?')}
                    className="p-4 text-left border border-slate-200 rounded-xl hover:border-amber-300 hover:bg-amber-50 transition-all duration-200 text-sm group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-amber-200 transition-colors">
                        <span className="text-amber-600 font-semibold text-xs">HY</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 mb-1">Hydration</h3>
                        <p className="text-slate-600 text-xs">How much water should I drink daily and why is it important?</p>
                      </div>
                    </div>
                  </button>
                </div>
                <div className="text-sm text-slate-500">
                  <p>Try DietechAI free for {MESSAGE_LIMIT} consultations • Login for unlimited access</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto py-6 px-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-6`}
                >
                  <div
                    className={`flex max-w-[85%] md:max-w-[80%] ${
                      message.role === 'user' ? 'flex-row-reverse' : ''
                    }`}
                  >
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        message.role === 'user' ? 'bg-blue-600 text-white ml-3' : 'bg-gray-200 text-gray-700 mr-3'
                      }`}
                    >
                      {message.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                    </div>
                    <div
                      className={`px-4 py-3 rounded-2xl ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-white border border-gray-200 rounded-bl-none shadow-sm'
                      }`}
                    >
                      {message.role === 'assistant' ? (
                        <div className="prose prose-sm max-w-none">
                          <Markdown>{message.content}</Markdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      )}
                      <div className={`text-xs mt-2 ${
                        message.role === 'user' ? 'text-blue-200' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
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
        <div className="border-t border-slate-200 bg-white px-4 py-4">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
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
                disabled={isLoading || messageCount >= MESSAGE_LIMIT}
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
                  disabled={!input.trim() || isLoading || messageCount >= MESSAGE_LIMIT}
                  className="p-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-slate-300 disabled:text-slate-500 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
            {messageCount >= MESSAGE_LIMIT && (
              <div className="mt-2 text-center">
                <p className="text-sm text-slate-600">
                  You've reached the free consultation limit.{' '}
                  <button
                    onClick={() => router.push('/login?redirect=/chat')}
                    className="text-emerald-600 hover:underline font-medium"
                  >
                    Login
                  </button>{' '}
                  or upgrade for unlimited access.
                </p>
              </div>
            )}
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
