'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Bot, User, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export default function AdminChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Halo! Saya asisten analis data keamanan SiPatrol. Anda bisa bertanya tentang laporan keamanan, statistik, atau tren keselamatan menggunakan bahasa Indonesia.',
      role: 'assistant',
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Call the API
      const response = await fetch('/api/chat/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: inputValue }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(`Failed to get response from assistant: ${errorData.error || 'Unknown error'}`);
      }

      const data = await response.json();

      // Add assistant message
      const assistantMessage: Message = {
        id: Date.now().toString(),
        content: data.response,
        role: 'assistant',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error getting assistant response:', error);

      const errorMessage: Message = {
        id: Date.now().toString(),
        content: 'Terjadi kesalahan saat memproses permintaan Anda. Silakan coba lagi.',
        role: 'assistant',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center">
          <Link href="/admin/dashboard" className="mr-6 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div className="flex items-center">
            <MessageSquare className="h-8 w-8 text-amber-500 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">Asisten Analis Data</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 h-[calc(100vh-200px)] flex flex-col overflow-hidden">
          {/* Quick Questions */}
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Pertanyaan Cepat:</h2>
            <div className="flex flex-wrap gap-2">
              {[
                "Berapa banyak laporan minggu ini?",
                "Apa laporan terbaru?",
                "Tren bahaya minggu ini?",
                "Lokasi dengan laporan tertinggi?"
              ].map((question, index) => (
                <button
                  key={index}
                  onClick={() => setInputValue(question)}
                  className="px-3 py-2 text-sm bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-colors border border-amber-200"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
          
          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-5 py-3 ${
                    message.role === 'user'
                      ? 'bg-amber-500 text-white rounded-br-none'
                      : 'bg-slate-200 text-slate-800 rounded-bl-none'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {message.role === 'assistant' && (
                      <Bot className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                    {message.role === 'user' && (
                      <User className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-200 text-slate-800 rounded-2xl rounded-bl-none px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Bot className="h-5 w-5 mt-0.5" />
                    <div className="flex space-x-2">
                      <div className="h-3 w-3 bg-slate-500 rounded-full animate-bounce"></div>
                      <div className="h-3 w-3 bg-slate-500 rounded-full animate-bounce delay-75"></div>
                      <div className="h-3 w-3 bg-slate-500 rounded-full animate-bounce delay-150"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-4 bg-white">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Tanyakan tentang laporan keamanan, statistik, atau tren keselamatan..."
                className="flex-1 px-4 py-3 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl px-5 py-3 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-w-[50px]"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Asisten Analis Data SiPatrol - Silahkan tanyakan tentang laporan keamanan
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}