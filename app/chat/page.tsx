'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

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
  id: number;
  message: string;
  is_user_message: boolean;
  created_at: string;
}

export default function ChatPage() {
  const [user, setUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

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
    if (!newMessage.trim() || !activeConversation) return;

    const userMessage = newMessage;
    setNewMessage('');
    setIsSending(true);

    // Add user message immediately
    const tempUserMessage: Message = {
      id: Date.now(), // Temporary ID
      message: userMessage,
      is_user_message: true,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, tempUserMessage]);

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
        const data = await response.json();
        // Replace temporary message with actual message from server
        setMessages(prev => [...prev.filter(m => m.id !== tempUserMessage.id), ...data.messages]);
        
        // Update conversation list with new title if it's the first message
        if (messages.length === 0) {
          loadConversations();
        }
      } else {
        // Remove temporary message if failed
        setMessages(prev => prev.filter(m => m.id !== tempUserMessage.id));
        alert('Failed to send message. Please try again.');
      }
    } catch (error) {
      // Remove temporary message if error
      setMessages(prev => prev.filter(m => m.id !== tempUserMessage.id));
      alert('Network error. Please check your connection.');
    } finally {
      setIsSending(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading Chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} bg-white border-r border-slate-200 transition-all duration-300 flex flex-col`}>
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Chat History</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <button
            onClick={createNewConversation}
            className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            + New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => {
                setActiveConversation(conversation.id);
                loadMessages(conversation.id);
              }}
              className={`w-full text-left p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                activeConversation === conversation.id ? 'bg-blue-50 border-blue-200' : ''
              }`}
            >
              <div className="font-medium text-slate-900 truncate">
                {conversation.title}
              </div>
              <div className="text-sm text-slate-500">
                {new Date(conversation.updated_at).toLocaleDateString()}
              </div>
            </button>
          ))}
        </div>

        {/* User Profile Section */}
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full flex items-center justify-center">
              {user?.profile_image ? (
                <img 
                  src={user.profile_image} 
                  alt={user.full_name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <span className="text-white font-bold text-sm">
                  {user?.full_name?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {user?.full_name}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {user?.user_type}
              </p>
            </div>
            <div className="flex space-x-1">
              <button
                onClick={() => router.push('/profile')}
                className="p-2 text-slate-600 hover:text-slate-900 transition-colors"
                title="Profile Settings"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-600 hover:text-slate-900 transition-colors"
                title="Logout"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {!sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              )}
              <h1 className="text-xl font-semibold text-slate-900">
                {conversations.find(c => c.id === activeConversation)?.title || 'Medical AI Assistant'}
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-slate-600">
                Powered by AI
              </span>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-blue-600 text-2xl">🩺</span>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  Welcome to MediAI Assistant
                </h3>
                <p className="text-slate-600 mb-6 max-w-md">
                  I'm here to help you with medical questions, case studies, drug information, and clinical decision support. How can I assist you today?
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-lg mx-auto">
                  <button
                    onClick={() => setNewMessage('Can you help me with a differential diagnosis for chest pain?')}
                    className="p-3 text-left bg-white border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <div className="font-medium text-slate-900">Differential Diagnosis</div>
                    <div className="text-sm text-slate-600">Help with clinical reasoning</div>
                  </button>
                  <button
                    onClick={() => setNewMessage('What are the side effects of metformin?')}
                    className="p-3 text-left bg-white border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <div className="font-medium text-slate-900">Drug Information</div>
                    <div className="text-sm text-slate-600">Medication details and interactions</div>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.is_user_message ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-3xl rounded-2xl px-4 py-3 ${
                    message.is_user_message
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-white border border-slate-200 text-slate-900 rounded-bl-none shadow-sm'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.message}</div>
                  <div className={`text-xs mt-2 ${
                    message.is_user_message ? 'text-blue-200' : 'text-slate-500'
                  }`}>
                    {new Date(message.created_at).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-slate-200 bg-white p-4">
          <form onSubmit={sendMessage} className="flex space-x-4">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your medical question here..."
              className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              disabled={isSending}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || isSending || !activeConversation}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </form>
          <div className="mt-2 text-xs text-slate-500 text-center">
            MediAI can make mistakes. Always verify important medical information.
          </div>
        </div>
      </div>
    </div>
  );
}