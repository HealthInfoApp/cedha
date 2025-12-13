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
        className={`fixed inset-y-0 left-0 z-20 w-64 bg-gray-900 text-white transition-transform duration-300 ease-in-out transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:relative md:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-700">
            <button
              onClick={startNewChat}
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
              <div className="text-sm text-gray-500">
                <div className="px-3 py-2">Reply message draft</div>
                <div className="px-3 py-2">Group name suggestions</div>
                <div className="px-3 py-2">Project report structure</div>
                <div className="px-3 py-2">Calculate total cost</div>
                <div className="px-3 py-2">Generate it now</div>
              </div>
            </div>
          </div>
          
          {/* Bottom Section */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex items-center gap-3 px-3 py-2 mb-3">
              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                <User size={16} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">Demo User</div>
                <div className="text-xs text-gray-400">chatopt.com</div>
              </div>
            </div>
            {messageCount >= MESSAGE_LIMIT ? (
              <button
                onClick={() => router.push('/login?redirect=/chat')}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                Upgrade
              </button>
            ) : (
              <button
                onClick={() => router.push('/login?redirect=/chat')}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                Upgrade
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-white">
        {/* Header */}
        <header className="border-b border-gray-200 px-4 py-3 flex items-center justify-between bg-white">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="md:hidden p-2 rounded-md hover:bg-gray-100"
          >
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
            <div className="h-full flex flex-col items-center justify-center px-4">
              <div className="max-w-2xl w-full text-center">
                <h2 className="text-3xl font-semibold text-gray-800 mb-4">
                  Where should we begin?
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
                  {[
                    'What is nutrition counseling?',
                    'How can I improve my diet?',
                    'What are superfoods?',
                    'How much water should I drink daily?',
                  ].map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(suggestion)}
                      className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto py-6 px-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
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
                          : 'bg-gray-50 border border-gray-200 rounded-bl-none'
                      }`}
                    >
                      {message.role === 'assistant' ? (
                        <div className="prose prose-sm max-w-none">
                          <Markdown>{message.content}</Markdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      )}
                      <div className="mt-1 text-xs opacity-70 text-right">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex items-center justify-start mb-6">
                  <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center mr-3">
                    <Bot size={16} className="animate-pulse" />
                  </div>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl rounded-bl-none">
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
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
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
                disabled={isLoading || messageCount >= MESSAGE_LIMIT}
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
                  disabled={!input.trim() || isLoading || messageCount >= MESSAGE_LIMIT}
                  className="p-1 rounded-md text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:hover:text-gray-400"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
            {messageCount >= MESSAGE_LIMIT && (
              <div className="mt-2 text-center">
                <p className="text-sm text-gray-600">
                  You've reached the message limit.{' '}
                  <button
                    onClick={() => router.push('/login?redirect=/chat')}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Login
                  </button>{' '}
                  for unlimited messages.
                </p>
              </div>
            )}
            <div className="mt-2 text-xs text-gray-500 text-center">
              ChatGPT can make mistakes. Consider checking important information.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
