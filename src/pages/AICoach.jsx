import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendCoachMessage } from '../services/api';
import Navbar from '../components/layout/Navbar';
import BottomNav from '../components/layout/BottomNav';
import { ErrorBoundary } from '../components/ErrorBoundary';

const AICoach = () => {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('ai_coach_history');
    return saved ? JSON.parse(saved) : [{
      id: 'greeting',
      type: 'model',
      text: "Hey there! I'm your Runli AI Coach. I remember your workouts, nutrition, and goals. How can I help you today?",
      timestamp: Date.now()
    }];
  });
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  // Handle offline/online status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save history to local storage
  useEffect(() => {
    localStorage.setItem('ai_coach_history', JSON.stringify(messages.slice(-50)));
  }, [messages]);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (e) => {
    e?.preventDefault();
    
    if (!input.trim() || isLoading) return;
    
    if (isOffline) {
      setError("You are offline. AI Coach requires an internet connection.");
      return;
    }

    const userMsg = {
      id: Date.now().toString(),
      type: 'user',
      text: input.trim(),
      timestamp: Date.now()
    };
    
    const currentHistory = [...messages, userMsg];
    setMessages(currentHistory);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      // Pass the recent history (excluding the very first greeting if it's too old)
      const historyForApi = currentHistory.slice(-10).map(m => ({
        type: m.type,
        text: m.text
      }));
      
      const response = await sendCoachMessage(userMsg.text, historyForApi);
      
      const modelMsg = {
        id: Date.now().toString() + '-model',
        type: 'model',
        text: response.text,
        timestamp: Date.now(),
        rag_enabled: response.rag_enabled,
        rag_sources: response.rag_sources
      };
      
      setMessages(prev => [...prev, modelMsg]);
    } catch (err) {
      console.error('AI Coach Error:', err);
      setError(err.message || 'Failed to get a response from the coach.');
      // Remove the user message if it failed, so they can try again? No, better to keep it and show error.
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    if (window.confirm('Clear conversation history?')) {
      const defaultMsg = {
        id: 'greeting',
        type: 'model',
        text: "Conversation cleared. How can I help you?",
        timestamp: Date.now()
      };
      setMessages([defaultMsg]);
      localStorage.removeItem('ai_coach_history');
      setError(null);
    }
  };

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-screen bg-gray-50 pb-16">
        <Navbar />
        
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center z-10 sticky top-[60px]">
          <div className="flex items-center space-x-3">
            <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 leading-tight">AI Coach</h1>
                <p className="text-xs text-gray-500">Personalized Fitness Assistant</p>
              </div>
            </div>
          </div>
          <button onClick={clearHistory} className="text-xs text-gray-400 hover:text-red-500 font-medium px-2 py-1">
            Clear
          </button>
        </div>

        {/* Status Banners */}
        {isOffline && (
          <div className="bg-amber-50 border-b border-amber-200 p-2 text-center text-amber-700 text-xs font-medium">
            You are offline. AI Coach requires an internet connection.
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border-b border-red-200 p-2 text-center text-red-600 text-xs font-medium flex justify-between items-center px-4">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-800 font-bold ml-2">×</button>
          </div>
        )}

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'} max-w-full`}
            >
              <div 
                className={`px-4 py-2 rounded-2xl max-w-[85%] sm:max-w-[75%] whitespace-pre-wrap text-[15px] shadow-sm ${
                  msg.type === 'user' 
                    ? 'bg-emerald-600 text-white rounded-tr-sm' 
                    : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm'
                }`}
              >
                {msg.text}
              </div>
              
              {msg.type === 'model' && msg.rag_enabled && (
                <div className="text-[10px] text-gray-400 mt-1 flex items-center space-x-1 ml-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Based on your data</span>
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex items-start">
              <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 p-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <form onSubmit={handleSend} className="flex space-x-2 max-w-4xl mx-auto">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isOffline ? "Waiting for connection..." : "Ask your coach..."}
              disabled={isOffline || isLoading}
              className="flex-1 bg-gray-100 border-0 rounded-full px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={!input.trim() || isOffline || isLoading}
              className="bg-emerald-600 text-white rounded-full p-2.5 w-11 h-11 flex items-center justify-center hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform rotate-90" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </form>
        </div>

        <BottomNav />
      </div>
    </ErrorBoundary>
  );
};

export default AICoach;
