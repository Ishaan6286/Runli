/**
 * AICoach.jsx — Runli AI Coach
 *
 * Layout contract:
 *   #root / body → no overflow, no page-level scroll
 *   .coach-shell → position:fixed, 0 0 0 0, flex-column
 *   .coach-header → flex-shrink:0, sticky
 *   .coach-messages → flex:1, overflow-y:auto  ← ONLY this scrolls
 *   .coach-composer → flex-shrink:0, sticky
 *   BottomNav → position:fixed (from BottomNav.jsx)
 *
 * The bottom padding of .coach-messages accounts for the BottomNav height.
 */

import React, {
  useState, useEffect, useRef, useCallback, memo
} from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Trash2, Send, Zap, WifiOff, X,
  Dumbbell, Apple, BarChart2, Flame
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { sendCoachMessage } from '../services/api';

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const BOTTOM_NAV_HEIGHT = 74; // px — matches BottomNav CSS
const SCROLL_THRESHOLD = 120; // px from bottom to consider "near bottom"

const QUICK_PROMPTS = [
  { icon: BarChart2, text: 'How is my progress this week?',   color: 'var(--primary-500)' },
  { icon: Dumbbell,  text: 'What did I do in my last workout?', color: 'var(--blue-400)' },
  { icon: Apple,     text: 'What should I eat today?',         color: 'var(--amber-400)' },
  { icon: Flame,     text: 'Create a workout plan for me',     color: 'var(--purple-400)' },
];

// ─────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────

/** Minimal animated typing indicator */
const TypingIndicator = memo(() => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '5px',
    padding: '14px 16px',
    background: 'var(--bg-raised)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '18px 18px 18px 4px',
    width: 'fit-content',
    maxWidth: 80,
  }}>
    {[0, 1, 2].map(i => (
      <motion.span
        key={i}
        style={{
          width: 7, height: 7,
          borderRadius: '50%',
          background: 'var(--primary-500)',
          display: 'block',
          opacity: 0.4,
        }}
        animate={{ opacity: [0.35, 1, 0.35], y: [0, -4, 0] }}
        transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.22, ease: 'easeInOut' }}
      />
    ))}
  </div>
));

/** RAG source badge */
const SourceBadge = memo(({ sources }) => {
  if (!sources?.length) return null;
  const hasTool = sources.some(s => s.source_type === 'tool');
  const hasPdf  = sources.some(s => s.source_type === 'pdf');

  let label = '';
  if (hasTool && hasPdf) label = 'Your data + fitness knowledge';
  else if (hasTool)       label = 'Based on your data';
  else if (hasPdf)        label = 'Fitness knowledge base';
  else return null;

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      marginTop: 6,
      fontSize: '0.68rem',
      fontWeight: 500,
      color: 'var(--primary-500)',
      opacity: 0.85,
      letterSpacing: '0.01em',
    }}>
      <Zap size={9} strokeWidth={2.5} />
      <span>{label}</span>
    </div>
  );
});

/** Single message bubble */
const MessageBubble = memo(({ msg }) => {
  const isUser = msg.type === 'user';

  // Parse [SEARCH_VIDEO: query] action tokens
  let displayText = msg.text || '';
  let videoQuery = null;
  const videoMatch = displayText.match(/\[SEARCH_VIDEO:\s*(.+?)\]/);
  if (videoMatch) {
    videoQuery = videoMatch[1];
    displayText = displayText.replace(videoMatch[0], '').trim();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.975 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        maxWidth: '100%',
      }}
    >
      {/* Bubble */}
      <div
        className={isUser ? undefined : 'markdown-body'}
        style={{
          maxWidth: 'min(82%, 520px)',
          padding: isUser ? '10px 14px' : '12px 15px',
          borderRadius: isUser
            ? '18px 18px 4px 18px'
            : '4px 18px 18px 18px',
          background: isUser
            ? 'var(--primary-600)'
            : 'var(--bg-raised)',
          border: isUser
            ? 'none'
            : '1px solid var(--border-subtle)',
          color: 'var(--text-primary)',
          fontSize: '0.9rem',
          lineHeight: 1.6,
          wordBreak: 'break-word',
          boxShadow: isUser
            ? '0 2px 12px rgba(22,163,74,0.3)'
            : 'var(--shadow-xs)',
        }}
      >
        {isUser ? (
          <span style={{ whiteSpace: 'pre-wrap' }}>{displayText}</span>
        ) : (
          <ReactMarkdown>{displayText}</ReactMarkdown>
        )}

        {/* Video search action */}
        {videoQuery && (
          <button
            onClick={() => {/* handled by existing logic */}}
            className="btn btn-secondary"
            style={{ marginTop: 10, fontSize: '0.78rem', width: '100%' }}
          >
            🎥 Search: "{videoQuery}"
          </button>
        )}
      </div>

      {/* RAG source indicator for AI messages */}
      {!isUser && msg.rag_enabled && (
        <SourceBadge sources={msg.rag_sources} />
      )}
    </motion.div>
  );
});

/** Welcome / empty state */
const WelcomeState = memo(({ onPrompt }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      padding: '2rem 1.25rem 1rem',
      gap: '0.5rem',
    }}
  >
    {/* Icon */}
    <div style={{
      width: 64, height: 64,
      borderRadius: '20px',
      background: 'linear-gradient(135deg, var(--primary-600), var(--primary-500))',
      display: 'grid', placeItems: 'center',
      boxShadow: '0 0 0 1px rgba(34,197,94,0.2), 0 8px 24px rgba(34,197,94,0.2)',
      marginBottom: '0.5rem',
      flexShrink: 0,
    }}>
      <Zap size={28} color="#000" strokeWidth={2.5} />
    </div>

    <h2 style={{
      margin: 0,
      fontSize: '1.25rem',
      fontWeight: 800,
      fontFamily: "'Plus Jakarta Sans', Inter, sans-serif",
      letterSpacing: '-0.02em',
      color: 'var(--text-primary)',
    }}>
      AI Coach
    </h2>
    <p style={{
      margin: 0,
      fontSize: '0.85rem',
      color: 'var(--text-secondary)',
      maxWidth: 280,
      lineHeight: 1.55,
    }}>
      Ask me about your workouts, nutrition, progress, recovery, or anything inside Runli.
    </p>

    {/* Suggested prompts */}
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '0.5rem',
      width: '100%',
      maxWidth: 380,
      marginTop: '1.25rem',
    }}>
      {QUICK_PROMPTS.map(({ icon: Icon, text, color }) => (
        <button
          key={text}
          onClick={() => onPrompt(text)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '0.5rem',
            padding: '0.75rem',
            background: 'var(--bg-raised)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--r-xl)',
            color: 'var(--text-primary)',
            fontSize: '0.78rem',
            fontWeight: 600,
            lineHeight: 1.4,
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'border-color 200ms, background 200ms',
          }}
          onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--border-base)'; e.currentTarget.style.background = 'var(--bg-overlay)'; }}
          onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.background = 'var(--bg-raised)'; }}
        >
          <Icon size={16} color={color} strokeWidth={2} />
          {text}
        </button>
      ))}
    </div>
  </motion.div>
));

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
const AICoach = () => {
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('ai_coach_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch { /* ignore */ }
    return [];
  });

  const [input, setInput]             = useState('');
  const [isLoading, setIsLoading]     = useState(false);
  const [error, setError]             = useState(null);
  const [isOffline, setIsOffline]     = useState(!navigator.onLine);
  const [pendingAction, setPendingAction] = useState(null);

  const messagesEndRef  = useRef(null);
  const messagesAreaRef = useRef(null); // ← the scrollable container
  const inputRef        = useRef(null);
  const isNearBottomRef = useRef(true); // track if user is near bottom
  const userJustSentRef = useRef(false);
  const navigate        = useNavigate();

  // ── Online/offline ──────────────────────────────────────────────
  useEffect(() => {
    const on  = () => setIsOffline(false);
    const off = () => setIsOffline(true);
    window.addEventListener('online',  on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  // ── Persist history ─────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('ai_coach_history', JSON.stringify(messages.slice(-60)));
  }, [messages]);

  // ── Smart scroll: only scroll when appropriate ──────────────────
  const scrollToBottom = useCallback((force = false) => {
    const area = messagesAreaRef.current;
    if (!area) return;
    if (force || userJustSentRef.current || isNearBottomRef.current) {
      // Use scrollTop instead of scrollIntoView to keep scroll inside the container
      area.scrollTop = area.scrollHeight;
    }
    userJustSentRef.current = false;
  }, []);

  // Track whether user is near bottom (for smart scroll)
  const handleScroll = useCallback(() => {
    const area = messagesAreaRef.current;
    if (!area) return;
    const distFromBottom = area.scrollHeight - area.scrollTop - area.clientHeight;
    isNearBottomRef.current = distFromBottom < SCROLL_THRESHOLD;
  }, []);

  // Scroll on new messages / loading state changes
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // Scroll to very bottom on initial mount (show most recent)
  useEffect(() => {
    const area = messagesAreaRef.current;
    if (area) {
      area.scrollTop = area.scrollHeight;
      isNearBottomRef.current = true;
    }
  }, []);

  // ── Send message ────────────────────────────────────────────────
  const handleSend = useCallback(async (textOverride) => {
    const text = (textOverride ?? input).trim();
    if (!text || isLoading) return;
    if (isOffline) { setError('You are offline. AI Coach requires internet.'); return; }

    const userMsg = {
      id: `${Date.now()}-user`,
      type: 'user',
      text,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setError(null);
    userJustSentRef.current = true;
    isNearBottomRef.current = true;

    try {
      const historyForApi = [...messages, userMsg]
        .slice(-12)
        .map(m => ({ type: m.type, text: m.text }));

      const response = await sendCoachMessage(text, historyForApi, pendingAction);

      // Handle navigation action
      if (response?.action?.type === 'navigate' && response.action.route) {
        navigate(response.action.route);
        return;
      }

      // Update pending action state
      setPendingAction(response?.pending_action ?? null);

      setMessages(prev => [...prev, {
        id: `${Date.now()}-model`,
        type: 'model',
        text: response.text ?? '',
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
  }, [input, isLoading, isOffline, messages, pendingAction, navigate]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // ── Clear history ───────────────────────────────────────────────
  const clearHistory = useCallback(() => {
    if (!window.confirm('Clear conversation history?')) return;
    setMessages([]);
    setPendingAction(null);
    localStorage.removeItem('ai_coach_history');
    setError(null);
  }, []);

  const hasMessages = messages.length > 0;
  const canSend = input.trim().length > 0 && !isOffline && !isLoading;

  return (
    <ErrorBoundary>
      {/*
        .coach-shell fills the fixed viewport.
        It sits between the top of the screen and the bottom of BottomNav.
        We do NOT render BottomNav here — it's global in App.jsx.
        We just account for its height via paddingBottom / CSS custom property.
      */}
      <div
        className="coach-shell"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          // The bottom edge is just above the BottomNav (fixed at bottom:0)
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-base)',
          // Ensure we're above AppBackground but below BottomNav's z-index
          zIndex: 10,
          // Safe area top (for notched phones)
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
      >

        {/* ══ HEADER ════════════════════════════════════════════ */}
        <header
          style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.625rem 0.875rem',
            background: 'rgba(10,10,11,0.88)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid var(--border-subtle)',
            zIndex: 2,
          }}
        >
          {/* Left: Back + identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => navigate(-1)}
              aria-label="Go back"
              style={{
                width: 36, height: 36,
                display: 'grid', placeItems: 'center',
                background: 'var(--bg-raised)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--r-lg)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'background 180ms',
              }}
            >
              <ChevronLeft size={18} />
            </button>

            {/* Avatar */}
            <div style={{
              width: 36, height: 36,
              borderRadius: '11px',
              background: 'linear-gradient(135deg, var(--primary-600), var(--primary-500))',
              display: 'grid', placeItems: 'center',
              boxShadow: '0 0 0 1px rgba(34,197,94,0.2)',
              flexShrink: 0,
            }}>
              <Zap size={17} color="#000" strokeWidth={2.5} />
            </div>

            <div>
              <div style={{
                fontFamily: "'Plus Jakarta Sans', Inter, sans-serif",
                fontWeight: 700,
                fontSize: '0.9375rem',
                color: 'var(--text-primary)',
                lineHeight: 1.2,
                letterSpacing: '-0.01em',
              }}>
                AI Coach
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4,
                fontSize: '0.68rem',
                color: isOffline ? 'var(--amber-400)' : 'var(--primary-500)',
                fontWeight: 500,
              }}>
                <span style={{
                  width: 6, height: 6,
                  borderRadius: '50%',
                  background: 'currentColor',
                  display: 'inline-block',
                }} />
                {isOffline ? 'Offline' : 'Online'}
              </div>
            </div>
          </div>

          {/* Right: Clear */}
          {hasMessages && (
            <button
              onClick={clearHistory}
              aria-label="Clear conversation"
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '0.375rem 0.625rem',
                background: 'transparent',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--r-lg)',
                color: 'var(--text-muted)',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'border-color 180ms, color 180ms',
              }}
              onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.35)'; e.currentTarget.style.color = 'var(--error-500)'; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <Trash2 size={13} />
              Clear
            </button>
          )}
        </header>

        {/* ══ BANNERS ═══════════════════════════════════════════ */}
        <AnimatePresence>
          {isOffline && (
            <motion.div
              key="offline-banner"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{
                flexShrink: 0,
                overflow: 'hidden',
                background: 'rgba(245,158,11,0.08)',
                borderBottom: '1px solid rgba(245,158,11,0.15)',
                color: 'var(--amber-400)',
                fontSize: '0.78rem',
                fontWeight: 600,
                padding: '0.4rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <WifiOff size={13} />
              No internet connection
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <motion.div
              key="error-banner"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{
                flexShrink: 0,
                overflow: 'hidden',
                background: 'rgba(239,68,68,0.08)',
                borderBottom: '1px solid rgba(239,68,68,0.15)',
                color: '#f87171',
                fontSize: '0.78rem',
                fontWeight: 600,
                padding: '0.4rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.5rem',
              }}
            >
              <span style={{ flex: 1 }}>{error}</span>
              <button
                onClick={() => setError(null)}
                aria-label="Dismiss error"
                style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: 2, display: 'grid', placeItems: 'center' }}
              >
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══ MESSAGES (independently scrollable) ═══════════════ */}
        <div
          ref={messagesAreaRef}
          className="coach-messages-area"
          onScroll={handleScroll}
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            overscrollBehavior: 'contain',
            // Center content on desktop
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Inner constrainer — keeps bubbles readable on wide screens */}
          <div
            style={{
              width: '100%',
              maxWidth: 720,
              marginLeft: 'auto',
              marginRight: 'auto',
              padding: '1rem 0.875rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              // Bottom padding accounts for BottomNav so last message isn't hidden
              paddingBottom: `calc(${BOTTOM_NAV_HEIGHT}px + env(safe-area-inset-bottom, 0px) + 0.5rem)`,
              flexGrow: 1,
            }}
          >
            {/* Welcome state */}
            {!hasMessages && <WelcomeState onPrompt={(text) => handleSend(text)} />}

            {/* Messages */}
            {messages.map(msg => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{ alignSelf: 'flex-start' }}
              >
                <TypingIndicator />
              </motion.div>
            )}

            {/* Scroll anchor — we use scrollTop directly so this is a fallback */}
            <div ref={messagesEndRef} style={{ height: 0 }} />
          </div>
        </div>

        {/* ══ COMPOSER ══════════════════════════════════════════ */}
        <div
          style={{
            flexShrink: 0,
            background: 'rgba(10,10,11,0.92)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderTop: '1px solid var(--border-subtle)',
            // Bottom padding accounts for BottomNav + safe area
            paddingBottom: `calc(${BOTTOM_NAV_HEIGHT}px + env(safe-area-inset-bottom, 0px) + 0.125rem)`,
            zIndex: 2,
          }}
        >
          <form
            onSubmit={e => { e.preventDefault(); handleSend(); }}
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: '0.5rem',
              padding: '0.625rem 0.875rem 0',
              maxWidth: 720,
              margin: '0 auto',
            }}
          >
            {/* Textarea */}
            <div style={{ flex: 1, position: 'relative' }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => {
                  setInput(e.target.value);
                  // Auto-grow (max ~5 lines)
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
                onKeyDown={handleKeyDown}
                placeholder={isOffline ? 'No internet…' : 'Ask your coach…'}
                disabled={isOffline || isLoading}
                rows={1}
                aria-label="Message input"
                style={{
                  width: '100%',
                  minHeight: 44,
                  maxHeight: 120,
                  resize: 'none',
                  overflow: 'auto',
                  background: 'var(--bg-raised)',
                  border: '1px solid var(--border-base)',
                  borderRadius: 'var(--r-2xl)',
                  padding: '0.6875rem 1rem',
                  color: 'var(--text-primary)',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.9375rem', // prevents iOS zoom
                  lineHeight: 1.5,
                  outline: 'none',
                  transition: 'border-color 200ms, box-shadow 200ms',
                  opacity: (isOffline || isLoading) ? 0.5 : 1,
                  display: 'block',
                }}
                onFocus={e => {
                  e.target.style.borderColor = 'rgba(34,197,94,0.45)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(34,197,94,0.1)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'var(--border-base)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Send button */}
            <motion.button
              type="submit"
              disabled={!canSend}
              aria-label="Send message"
              whileTap={canSend ? { scale: 0.88 } : {}}
              style={{
                width: 44,
                height: 44,
                flexShrink: 0,
                borderRadius: '50%',
                background: canSend
                  ? 'linear-gradient(135deg, var(--primary-500), var(--primary-600))'
                  : 'var(--bg-raised)',
                color: canSend ? '#000' : 'var(--text-muted)',
                display: 'grid',
                placeItems: 'center',
                cursor: canSend ? 'pointer' : 'not-allowed',
                boxShadow: canSend ? '0 4px 16px rgba(34,197,94,0.3)' : 'none',
                border: canSend ? 'none' : '1px solid var(--border-subtle)',
                transition: 'background 200ms, box-shadow 200ms, border-color 200ms',
              }}
            >
              <Send size={17} strokeWidth={2.2} />
            </motion.button>
          </form>
        </div>

      </div>
    </ErrorBoundary>
  );
};

export default AICoach;
