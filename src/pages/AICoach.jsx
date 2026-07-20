import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendCoachMessage } from '../services/api';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Zap, Trash2, WifiOff, X, ChevronLeft } from 'lucide-react';

// ── Typing indicator dots ───────────────────────────────────────────────────
const TypingDots = () => (
  <div style={{ display: 'flex', gap: '5px', padding: '4px 2px', alignItems: 'center' }}>
    {[0, 1, 2].map(i => (
      <motion.div
        key={i}
        style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }}
        animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }}
      />
    ))}
  </div>
);

// ── Single message bubble ───────────────────────────────────────────────────
const MessageBubble = ({ msg }) => {
  const isUser = msg.type === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        maxWidth: '100%',
      }}
    >
      <div
        style={{
          maxWidth: '82%',
          padding: '0.7rem 1rem',
          borderRadius: isUser ? '1.2rem 1.2rem 0.3rem 1.2rem' : '1.2rem 1.2rem 1.2rem 0.3rem',
          background: isUser
            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
            : 'rgba(255,255,255,0.07)',
          border: isUser ? 'none' : '1px solid rgba(255,255,255,0.1)',
          color: '#fff',
          fontSize: '0.92rem',
          lineHeight: 1.55,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          boxShadow: isUser
            ? '0 4px 20px rgba(16,185,129,0.25)'
            : '0 2px 8px rgba(0,0,0,0.3)',
        }}
      >
        {msg.text}
      </div>
      {msg.type === 'model' && msg.rag_enabled && (
        <div style={{
          marginTop: '0.25rem',
          marginLeft: '0.4rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.3rem',
          fontSize: '0.68rem',
          color: '#10b981',
          opacity: 0.8,
        }}>
          <Zap size={10} />
          <span>Based on your data</span>
        </div>
      )}
    </motion.div>
  );
};

// ══════════════════════════════════════════════════════════════════
//  AI COACH PAGE
// ══════════════════════════════════════════════════════════════════
const AICoach = () => {
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('ai_coach_history');
      return saved ? JSON.parse(saved) : [{
        id: 'greeting',
        type: 'model',
        text: "Hey there! I'm your Runli AI Coach. I remember your workouts, nutrition, and goals. How can I help you today? 💪",
        timestamp: Date.now(),
      }];
    } catch {
      return [{
        id: 'greeting',
        type: 'model',
        text: "Hey there! I'm your Runli AI Coach. How can I help you today? 💪",
        timestamp: Date.now(),
      }];
    }
  });

  const [input, setInput]       = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]       = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);
  const navigate       = useNavigate();

  // Offline detection
  useEffect(() => {
    const on  = () => setIsOffline(false);
    const off = () => setIsOffline(true);
    window.addEventListener('online',  on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  // Persist history
  useEffect(() => {
    localStorage.setItem('ai_coach_history', JSON.stringify(messages.slice(-50)));
  }, [messages]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    if (isOffline) { setError('You are offline. AI Coach requires internet.'); return; }

    const userMsg = { id: Date.now().toString(), type: 'user', text: input.trim(), timestamp: Date.now() };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const historyForApi = history.slice(-10).map(m => ({ type: m.type, text: m.text }));
      const response = await sendCoachMessage(userMsg.text, historyForApi);
      setMessages(prev => [...prev, {
        id: Date.now().toString() + '-model',
        type: 'model',
        text: response.text,
        timestamp: Date.now(),
        rag_enabled: response.rag_enabled,
        rag_sources: response.rag_sources,
      }]);
    } catch (err) {
      setError(err.message || 'Failed to get a response. Please try again.');
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const clearHistory = () => {
    if (!window.confirm('Clear conversation history?')) return;
    const greeting = {
      id: 'greeting-new',
      type: 'model',
      text: 'Conversation cleared. Fresh start! How can I help you? 💪',
      timestamp: Date.now(),
    };
    setMessages([greeting]);
    localStorage.removeItem('ai_coach_history');
    setError(null);
  };

  // ── Suggested quick prompts ──────────────────────────────────────
  const QUICK_PROMPTS = [
    'Create a workout plan for me',
    'What should I eat today?',
    'How can I lose weight faster?',
    'Motivate me to train 💪',
  ];

  const showQuickPrompts = messages.length <= 1;

  return (
    <ErrorBoundary>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        background: '#000',
        color: '#fff',
        fontFamily: "'Plus Jakarta Sans', Inter, sans-serif",
        // leave room for the global BottomNav (~64px) + safe area
        paddingBottom: 'calc(64px + env(safe-area-inset-bottom, 0px))',
      }}>

        {/* ── Header ──────────────────────────────────────────────── */}
        <div style={{
          position: 'sticky',
          top: 0,
          zIndex: 30,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.85rem 1.1rem',
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          gap: '0.75rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: 'none',
                borderRadius: '0.65rem',
                color: '#fff',
                cursor: 'pointer',
                padding: '0.45rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ChevronLeft size={20} />
            </button>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 0 16px rgba(16,185,129,0.4)',
            }}>
              <Zap size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', lineHeight: 1.2 }}>AI Coach</div>
              <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 500 }}>
                {isOffline ? '● Offline' : '● Online'}
              </div>
            </div>
          </div>

          <button
            onClick={clearHistory}
            title="Clear history"
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: '0.65rem',
              color: '#ef4444',
              cursor: 'pointer',
              padding: '0.45rem 0.7rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
          >
            <Trash2 size={14} />
            Clear
          </button>
        </div>

        {/* ── Offline banner ───────────────────────────────────────── */}
        <AnimatePresence>
          {isOffline && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{
                background: 'rgba(245,158,11,0.1)',
                borderBottom: '1px solid rgba(245,158,11,0.2)',
                color: '#f59e0b',
                fontSize: '0.8rem',
                fontWeight: 600,
                padding: '0.5rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <WifiOff size={14} />
              You are offline — AI Coach requires internet connection.
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Error banner ─────────────────────────────────────────── */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{
                background: 'rgba(239,68,68,0.1)',
                borderBottom: '1px solid rgba(239,68,68,0.2)',
                color: '#f87171',
                fontSize: '0.8rem',
                fontWeight: 600,
                padding: '0.5rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.5rem',
              }}
            >
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '2px' }}
              >
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Messages area ───────────────────────────────────────── */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.25rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
          overscrollBehavior: 'contain',
        }}>
          {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}

          {/* Typing indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                alignSelf: 'flex-start',
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '1.2rem 1.2rem 1.2rem 0.3rem',
                padding: '0.5rem 0.9rem',
              }}
            >
              <TypingDots />
            </motion.div>
          )}

          {/* Quick prompts (only on empty chat) */}
          {showQuickPrompts && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}
            >
              {QUICK_PROMPTS.map(p => (
                <button
                  key={p}
                  onClick={() => { setInput(p); inputRef.current?.focus(); }}
                  style={{
                    background: 'rgba(16,185,129,0.08)',
                    border: '1px solid rgba(16,185,129,0.25)',
                    borderRadius: '999px',
                    color: '#10b981',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    padding: '0.4rem 0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(16,185,129,0.15)'}
                  onMouseOut={e => e.currentTarget.style.background = 'rgba(16,185,129,0.08)'}
                >
                  {p}
                </button>
              ))}
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Input area ──────────────────────────────────────────── */}
        <div style={{
          padding: '0.75rem 1rem',
          background: 'rgba(0,0,0,0.9)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255,255,255,0.07)',
        }}>
          <form
            onSubmit={handleSend}
            style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-end', maxWidth: 720, margin: '0 auto' }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={isOffline ? 'No internet connection…' : 'Ask your coach…'}
              disabled={isOffline || isLoading}
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '1rem',
                padding: '0.75rem 1.1rem',
                color: '#fff',
                fontSize: '0.92rem',
                outline: 'none',
                transition: 'border-color 0.2s',
                opacity: (isOffline || isLoading) ? 0.5 : 1,
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(16,185,129,0.5)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
            />
            <button
              type="submit"
              disabled={!input.trim() || isOffline || isLoading}
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: input.trim() && !isOffline && !isLoading
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : 'rgba(255,255,255,0.08)',
                border: 'none',
                color: '#fff',
                cursor: input.trim() && !isOffline && !isLoading ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.2s',
                boxShadow: input.trim() && !isOffline && !isLoading
                  ? '0 4px 16px rgba(16,185,129,0.4)'
                  : 'none',
              }}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default AICoach;
