'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, User, Maximize2, Minimize2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export default function DashboardAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
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
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className={`${isFullscreen ? 'w-screen h-screen max-w-[100vw] max-h-[100vh]' : 'w-[500px] h-[600px]'} bg-white border border-slate-200 rounded-2xl shadow-xl flex flex-col overflow-hidden`}>
          {/* Header */}
          <div className="bg-amber-500 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <h3 className="font-bold">Asisten Analis Data</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="text-white hover:bg-amber-600 rounded-full p-1 transition-colors"
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-amber-600 rounded-full p-1 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-amber-500 text-white rounded-br-none'
                      : 'bg-slate-200 text-slate-800 rounded-bl-none'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {message.role === 'assistant' && (
                      <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="text-sm prose prose-sm max-w-none whitespace-pre-wrap">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                    {message.role === 'user' && (
                      <User className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-200 text-slate-800 rounded-2xl rounded-bl-none px-4 py-2">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 mt-0.5" />
                    <div className="flex space-x-1">
                      <div className="h-2 w-2 bg-slate-500 rounded-full animate-bounce"></div>
                      <div className="h-2 w-2 bg-slate-500 rounded-full animate-bounce delay-75"></div>
                      <div className="h-2 w-2 bg-slate-500 rounded-full animate-bounce delay-150"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="border-t border-slate-200 p-3 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Tanyakan tentang laporan keamanan..."
                className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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
                className="bg-amber-500 hover:bg-amber-600 text-white rounded-lg p-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-amber-500 hover:bg-amber-600 text-white rounded-full p-4 shadow-lg flex items-center gap-2 transition-all hover:scale-105"
        >
          <MessageSquare className="h-5 w-5" />
          <span className="hidden sm:inline">Asisten</span>
        </button>
      )}
    </div>
  );
}