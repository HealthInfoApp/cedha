'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Send, User, Bot, LogIn, Plus, Menu, X } from 'lucide-react';
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
    <div className="flex h-screen bg-gray-50 text-gray-900">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-20 w-64 bg-gray-900 text-white transition-transform duration-300 ease-in-out transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:relative md:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-gray-700">
            <h1 className="text-xl font-bold">Cedha AI</h1>
            <p className="text-sm text-gray-400">Your AI Assistant</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <button
              onClick={startNewChat}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 mb-4 text-sm font-medium rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              <Plus size={16} />
              New Chat
            </button>
            <div className="mt-4">
              <p className="text-xs text-gray-400 uppercase font-semibold mb-2">Chat History</p>
              <div className="text-sm text-gray-300">
                {messageCount >= MESSAGE_LIMIT ? (
                  <div className="p-3 bg-gray-800 rounded-lg mb-2">
                    <p className="text-yellow-400">Message limit reached</p>
                    <button
                      onClick={() => router.push('/login?redirect=/chat')}
                      className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-1.5 text-sm rounded-md bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <LogIn size={14} /> Login to Continue
                    </button>
                  </div>
                ) : (
                  <p className="text-gray-400">
                    Messages: {messageCount}/{MESSAGE_LIMIT}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="p-4 border-t border-gray-700">
            {messageCount >= MESSAGE_LIMIT ? (
              <button
                onClick={() => router.push('/login?redirect=/chat')}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                <LogIn size={16} /> Login for Unlimited Chats
              </button>
            ) : (
              <button
                onClick={() => router.push('/signup')}
                className="w-full text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                Create an account for unlimited chats
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 p-4 flex items-center justify-between md:justify-end">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="md:hidden p-2 rounded-md hover:bg-gray-100"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex items-center gap-4">
            <button
              onClick={startNewChat}
              className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <Plus size={16} />
              New Chat
            </button>
            <button
              onClick={() => router.push('/login')}
              className="px-4 py-2 text-sm font-medium rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              Login
            </button>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <div className="max-w-2xl mx-auto">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
                  Welcome to Cedha AI
                </h2>
                <p className="text-gray-600 mb-8">
                  Ask me anything! You can send up to {MESSAGE_LIMIT} messages without an account.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
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
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
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
                          : 'bg-white border border-gray-200 rounded-bl-none'
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
                <div className="flex items-center justify-start">
                  <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center mr-3">
                    <Bot size={16} className="animate-pulse" />
                  </div>
                  <div className="px-4 py-3 bg-white border border-gray-200 rounded-2xl rounded-bl-none">
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
        <div className="border-t border-gray-200 bg-white p-4">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className="relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message Cedha AI..."
                rows={1}
                className="w-full px-4 py-3 pr-12 text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none max-h-32"
                disabled={isLoading || messageCount >= MESSAGE_LIMIT}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading || messageCount >= MESSAGE_LIMIT}
                className="absolute right-2 bottom-2 p-2 rounded-md text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:hover:bg-transparent"
              >
                <Send size={20} />
              </button>
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
          </form>
        </div>
      </div>
    </div>
  );
}
