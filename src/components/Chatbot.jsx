import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Sparkles, X, Send, ChevronDown, Dumbbell, Salad,
  Moon, Activity, Zap, Flame, RefreshCw, Bot
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════
   CONTEXT BUILDER — injects ALL user data into system prompt
══════════════════════════════════════════════════════════ */
function buildSystemPrompt(context) {
  const { userInfo, wellness, progress, weightLog } = context;

  const gymDays = Object.values(progress).filter(p => p.wentToGym).length;
  const totalDays = Object.keys(progress).length;

  // Streak calc
  let streak = 0;
  const sorted = Object.entries(progress).sort(([a], [b]) => b.localeCompare(a));
  for (let i = 0; i < sorted.length; i++) {
    const expected = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
    if (sorted[i]?.[0] === expected && sorted[i]?.[1]?.wentToGym) streak++;
    else break;
  }

  const latestWeight = weightLog.length
    ? [...weightLog].sort((a, b) => b.date.localeCompare(a.date))[0].weight
    : userInfo.weight;

  return `You are Runli Coach — a premium, elite AI fitness operating system and personal coach.
You are sharp, highly analytical, deeply knowledgeable, and empathetic. Your tone is that of a high-end personal trainer who knows the user's data inside and out.

## USER PROFILE
- Name: ${userInfo.name || 'Athlete'}
- Age: ${userInfo.age || 'unknown'} | Gender: ${userInfo.gender || 'unknown'}
- Weight: ${latestWeight || userInfo.weight || 'unknown'} kg | Height: ${userInfo.height || 'unknown'} cm
- Goal: ${userInfo.target || 'general fitness'} | Frequency: ${userInfo.frequency || 4}x/week
- Target weight: ${userInfo.targetWeight || 'not set'} kg in ${userInfo.targetDuration || '?'} months

## LIVE BIOMETRICS & ACTIVITY
- Sleep: ${wellness.sleep != null ? wellness.sleep + 'h' : 'not logged'}
- Mood: ${wellness.mood ? ['Low', 'Meh', 'Ok', 'Good', 'Amazing'][wellness.mood - 1] : 'not logged'} (${wellness.mood || '?'}/5)
- Steps: ${wellness.steps > 0 ? wellness.steps.toLocaleString() : 'not logged'}
- Total gym sessions: ${gymDays} (Current Streak: ${streak} days)

## COACHING DIRECTIVES
- **Be Concise & Direct:** This is a mobile UI. Keep replies to 2-4 punchy sentences. No fluff.
- **Data-Driven:** Always reference their specific data (e.g., "Given your ${streak}-day streak..." or "Since you only slept ${wellness.sleep}h...").
- **Empathy First:** If they report low mood, tiredness, or skipped workouts, validate their feelings before offering a solution. Recovery is as important as training.
- **Action-Oriented:** End with a clear, actionable step or suggestion.
- **No AI Disclaimers:** Never say as an AI. Speak as the Runli Coach.
- Format with short paragraphs. Moderate emoji use (1-2 max).`;
}

/* ══════════════════════════════════════════════════════════
   NAVIGATION SHORTCUTS — handles "go to gym", "open diet", etc.
   Only runs for explicit navigation intent, NOT general queries.
══════════════════════════════════════════════════════════ */
function getNavShortcut(input, navigate, close) {
  const q = input.toLowerCase().trim();
  // Only trigger on very explicit navigation phrases
  if (/^(go to |open |show me |take me to )?(gym tab|gym mode|gym)$/i.test(q)) {
    setTimeout(() => { navigate('/gym'); close(); }, 800);
    return 'Opening your Gym tab now 💪';
  }
  if (/^(go to |open |show me |take me to )?(diet|eat|food|meal plan)$/i.test(q)) {
    setTimeout(() => { navigate('/eat'); close(); }, 800);
    return 'Opening your meal plan now 🥗';
  }
  if (/^(go to |open |show me |take me to )?(progress|analytics|stats)$/i.test(q)) {
    setTimeout(() => { navigate('/progress'); close(); }, 800);
    return 'Opening your progress dashboard 📈';
  }
  if (/^(go to |open |show me |take me to )?(today|home|dashboard)$/i.test(q)) {
    setTimeout(() => { navigate('/today'); close(); }, 800);
    return 'Here\'s your today view 🏠';
  }
  return null;
}

/* ══════════════════════════════════════════════════════════
   SUGGESTED PROMPTS by tab context
══════════════════════════════════════════════════════════ */
const SUGGESTED_PROMPTS = {
  '/today':    ['What should I eat today?', 'Design my workout', 'Improve my sleep?', 'Motivate me 🔥'],
  '/gym':      ['Best warm-up routine?', 'How to increase bench?', 'Rest time between sets?', 'Injury prevention tips'],
  '/eat':      ['High protein breakfast ideas?', 'Best pre-workout meal?', 'How to hit my protein goal?', 'Meal prep for the week?'],
  '/progress': ['Why am I not losing weight?', 'How to break a plateau?', 'Am I progressing too slow?', 'Best way to track gains?'],
  '/wellness': ['How to sleep better?', 'Improve recovery?', 'Best cooldown after workout?', 'Signs of overtraining?'],
  '/plan':     ['Explain my workout split', 'Adjust my plan?', 'How many rest days?', 'Add cardio to my plan?'],
  default:     ['Design my workout today', 'What should I eat?', 'How to improve sleep?', 'Am I making progress?'],
};

const QUICK_REPLY_SETS = {
  diet:     ['More high-protein meals?', 'Meal prep tips?', 'Best cut foods?', 'Open diet plan →'],
  workout:  ['Show my split', 'Best warm-up?', 'Rest day tips?', 'Go to Gym →'],
  wellness: ['Better sleep tips?', 'Recovery protocol?', 'Log wellness →'],
  progress: ['View my progress →', 'How to track weight?', 'Break plateau?'],
  general:  ['Improve recovery?', 'What to eat today?', 'Workout advice?'],
};

function getQuickReplies(botText) {
  const t = botText.toLowerCase();
  if (/protein|diet|eat|meal|calorie|nutrition/.test(t)) return QUICK_REPLY_SETS.diet;
  if (/workout|exercise|gym|train|lift/.test(t))       return QUICK_REPLY_SETS.workout;
  if (/sleep|recover|rest|wellness/.test(t))           return QUICK_REPLY_SETS.wellness;
  if (/progress|weight|track|result/.test(t))          return QUICK_REPLY_SETS.progress;
  return QUICK_REPLY_SETS.general;
}

/* ══════════════════════════════════════════════════════════
   LOADING DOTS ANIMATION
══════════════════════════════════════════════════════════ */
const TypingDots = () => (
  <div style={{ display: 'flex', gap: 4, padding: '4px 0', alignItems: 'center', height: 20 }}>
    {[0, 1, 2].map(i => (
      <motion.div key={i}
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
        style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary-500)' }}
      />
    ))}
  </div>
);

/* ══════════════════════════════════════════════════════════
   CHAT BUBBLE
══════════════════════════════════════════════════════════ */
const ChatBubble = ({ msg, onQuickReply }) => {
  const isUser = msg.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start', gap: '0.4rem' }}
    >
      <div style={{
        maxWidth: '82%',
        padding: '0.625rem 0.875rem',
        borderRadius: isUser ? '1.125rem 1.125rem 0.25rem 1.125rem' : '0.25rem 1.125rem 1.125rem 1.125rem',
        background: isUser
          ? 'linear-gradient(135deg, var(--primary-600), var(--primary-500))'
          : 'var(--bg-raised)',
        border: isUser ? 'none' : '1px solid var(--border-subtle)',
        color: 'var(--text-primary)',
        fontSize: '0.875rem',
        lineHeight: 1.55,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
        {!isUser && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.3rem' }}>
            <Sparkles size={10} color="var(--primary-500)" />
            <span style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--primary-500)' }}>Runli Coach</span>
          </div>
        )}
        {msg.text}
      </div>
      {/* Quick reply chips — only on last bot message */}
      {!isUser && msg.chips && msg.chips.length > 0 && (
        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', maxWidth: '92%' }}>
          {msg.chips.map((chip, i) => (
            <button
              key={i}
              onClick={() => onQuickReply(chip.replace(' →', ''))}
              style={{
                padding: '0.3rem 0.625rem',
                borderRadius: 'var(--r-2xl)',
                background: 'var(--bg-raised)',
                border: '1px solid var(--border-base)',
                color: 'var(--text-secondary)',
                fontSize: '0.7rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 150ms',
                whiteSpace: 'nowrap',
              }}
              onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--primary-500)'; e.currentTarget.style.color = 'var(--primary-400)'; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border-base)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              {chip}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
};

/* ══════════════════════════════════════════════════════════
   MAIN CHATBOT COMPONENT
══════════════════════════════════════════════════════════ */
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export default function Chatbot() {
  const [isOpen, setIsOpen]     = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [input, setInput]       = useState('');
  const [messages, setMessages] = useState([]);
  const endRef   = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  /* ── Load user context from localStorage ── */
  const getContext = useCallback(() => {
    const load = (key) => { try { return JSON.parse(localStorage.getItem(key)) || {}; } catch { return {}; } };
    const loadArr = (key) => { try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; } };
    const userInfo = load('runliUserInfo');
    const progress = load('runliProgress');
    const rawWell  = load('runliWellness');
    const today    = new Date().toISOString().split('T')[0];
    const wellness = rawWell.date === today ? rawWell : { sleep: null, mood: null, steps: 0 };
    const weightLog = loadArr('runliWeightLog');

    let streak = 0;
    const sortedProg = Object.entries(progress).sort(([a], [b]) => b.localeCompare(a));
    for (let i = 0; i < sortedProg.length; i++) {
      const expected = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
      if (sortedProg[i]?.[0] === expected && sortedProg[i]?.[1]?.wentToGym) streak++;
      else break;
    }
    return { userInfo, progress, wellness, weightLog, streak };
  }, []);

  /* ── Opening greeting ── */
  const buildGreeting = useCallback((ctx) => {
    const { userInfo, wellness, streak } = ctx;
    const name = userInfo.name ? ` ${userInfo.name.split(' ')[0]}` : '';
    const h = new Date().getHours();
    const time = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
    const parts = [`Good ${time}${name}! I'm your Runli Coach. 🏆`];
    if (streak > 0) parts.push(`You're on a ${streak}-day streak — don't break it!`);
    if (wellness.sleep != null && wellness.sleep < 6) parts.push(`Only ${wellness.sleep}h sleep last night — I'll factor that into my advice.`);
    if (userInfo.target) parts.push(`Goal: ${userInfo.target}. Let's get to work.`);
    parts.push('What can I help you with today?');
    return parts.join(' ');
  }, []);

  /* ── Open handler ── */
  const open = useCallback(() => {
    if (messages.length === 0) {
      const ctx = getContext();
      const greeting = buildGreeting(ctx);
      setMessages([{ role: 'bot', text: greeting, chips: [] }]);
    }
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 200);
  }, [messages.length, getContext, buildGreeting]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  /* ── Send message — always calls real AI API ── */
  const send = useCallback(async (text) => {
    const userText = text || input.trim();
    if (!userText || isLoading) return;
    setInput('');

    const userMsg = { role: 'user', text: userText };
    setMessages(prev => [...prev, userMsg]);

    const ctx = getContext();
    const close = () => setIsOpen(false);

    // 1. Check for explicit navigation shortcuts ONLY
    const navResult = getNavShortcut(userText, navigate, close);
    if (navResult) {
      setMessages(prev => [...prev, {
        role: 'bot',
        text: navResult,
        chips: [],
      }]);
      return;
    }

    // 2. Call the real Gemini AI endpoint for ALL coaching queries
    setLoading(true);
    try {
      const systemPrompt = buildSystemPrompt(ctx);
      // Pass history as alternating user/bot pairs for multi-turn context
      const history = messages
        .filter(m => m.text?.trim())
        .slice(-10)
        .map(m => ({ type: m.role === 'user' ? 'user' : 'bot', text: m.text }));

      const token = localStorage.getItem('runliToken');
      const res = await fetch(`${API_URL}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: userText,
          history,
          systemPrompt,
        }),
      });

      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      const botText = data.text || data.message || "I'm here — what would you like to know?";

      setMessages(prev => [...prev, {
        role: 'bot',
        text: botText,
        chips: getQuickReplies(botText),
      }]);
    } catch {
      // 3. Empathetic offline fallback
      const fallback = generateOfflineFallback(userText, ctx);
      setMessages(prev => [...prev, {
        role: 'bot',
        text: fallback.text,
        chips: fallback.chips,
      }]);
    } finally {
      setLoading(false);
    }
  }, [input, isLoading, messages, getContext, navigate]);

  /* ── Empathetic offline fallback ── */
  function generateOfflineFallback(q, ctx) {
    const { userInfo, wellness, streak } = ctx;
    const lq = q.toLowerCase();
    const weight = userInfo.weight;
    const goal = (userInfo.target || '').toLowerCase();
    const sleep = wellness.sleep;

    // Emotional / Low Energy
    if (/tired|exhausted|drained|low energy|burnout/.test(lq)) {
      return {
        text: `I hear you. Pushing through exhaustion usually leads to injury, not progress. ${sleep && sleep < 6 ? `Since you only got ${sleep}h of sleep, ` : ''}Let's make today about active recovery. A light walk or stretching will do more for you right now than a heavy lift.`,
        chips: ['Active recovery list', 'How to sleep better?']
      };
    }
    if (/feel low|feeling low|sad|down|unmotivated/.test(lq)) {
      return {
        text: `It's completely normal to have off days. Motivation works in waves. Don't worry about smashing records today — just protect the habit. A 10-minute session is infinitely better than 0.`,
        chips: ['10-min workout?', 'Quick mood booster']
      };
    }
    if (/skip|missed|didn.?t go/.test(lq)) {
      return {
        text: `Don't stress over one missed day. Consistency over months > perfection over a week. We just pick right back up tomorrow. You've got this.`,
        chips: ['Tomorrow\'s plan', 'Diet tips?']
      };
    }

    // Nutrition
    if (/eat|food|meal|diet|protein/.test(lq)) {
      if (/muscle|bulk|gain/.test(goal)) {
        return {
          text: `For muscle gain, the math is simple: a slight calorie surplus and high protein (${weight ? Math.round(weight * 1.8) : 150}g+ daily). Carbs around your workout will maximize your training capacity.`,
          chips: ['Open Diet Plan →', 'Pre-workout meals?']
        };
      }
      return {
        text: `Nutrition is 80% of the game. Focus on high protein to preserve muscle and stay satiated, plus volumetric eating (tons of greens) so you don't feel restricted. Need some quick meal ideas?`,
        chips: ['Open Diet Plan →', 'High-protein snacks?']
      };
    }

    // Workouts
    if (/workout|train|lift|gym|exercise/.test(lq)) {
      if (streak > 0) {
        return {
          text: `You're riding a ${streak}-day streak right now. Your momentum is excellent. Let's hit the Gym tab and keep pushing that progressive overload.`,
          chips: ['Go to Gym →', 'Best warm-up?']
        };
      }
      return {
        text: `Ready to get moving? The best workout is the one you actually do. Let's start with your customized split in the Gym tab. Focus on strict form over weight today.`,
        chips: ['Go to Gym →', 'Stretching guide']
      };
    }

    // Progress
    if (/progress|weight|plateau|track|results/.test(lq)) {
      return {
        text: `Progress isn't perfectly linear. If the scale is stuck, let's look at the mirror, your energy levels, and how your clothes fit. We can check your data in the analytics dashboard.`,
        chips: ['View Analytics →', 'How to break a plateau?']
      };
    }

    return {
      text: `I'm analyzing your data offline right now. I'm here to build your workouts, optimize your meals, or just help you recover. What's the focus today?`,
      chips: ['Workout plan', 'Nutrition tips', 'Recovery']
    };
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const prompts = SUGGESTED_PROMPTS[pathname] || SUGGESTED_PROMPTS.default;
  const showSuggested = messages.length <= 1;

  return (
    <>
      {/* ── FAB ── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            onClick={open}
            aria-label="Open AI Coach"
            style={{
              position: 'fixed', bottom: 84, right: 20, zIndex: 200,
              width: 52, height: 52, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary-600), var(--primary-500))',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(34,197,94,0.45)',
            }}
          >
            <Sparkles size={22} color="white" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Chat Panel ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed', bottom: 84, right: 16, zIndex: 200,
              width: Math.min(400, window.innerWidth - 32),
              height: Math.min(600, window.innerHeight - 120),
              display: 'flex', flexDirection: 'column',
              borderRadius: 'var(--r-2xl)',
              background: 'var(--bg-overlay)',
              border: '1px solid var(--border-base)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
              backdropFilter: 'blur(24px)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '0.875rem 1rem',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexShrink: 0,
              background: 'rgba(34,197,94,0.06)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <div style={{ width: 34, height: 34, borderRadius: 'var(--r-lg)', background: 'var(--primary-dim)', display: 'grid', placeItems: 'center' }}>
                  <Sparkles size={17} color="var(--primary-500)" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9375rem', letterSpacing: '-0.01em' }}>Runli Coach</div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--primary-400)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary-500)', display: 'inline-block' }} />
                    AI-powered · context-aware
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.375rem' }}>
                <button
                  onClick={() => { setMessages([]); setTimeout(open, 50); }}
                  title="New conversation"
                  style={{ background: 'var(--bg-raised)', border: 'none', borderRadius: 'var(--r-md)', padding: '0.35rem', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
                >
                  <RefreshCw size={14} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  style={{ background: 'var(--bg-raised)', border: 'none', borderRadius: 'var(--r-md)', padding: '0.35rem', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
                >
                  <ChevronDown size={16} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0.875rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {messages.map((msg, i) => (
                <ChatBubble key={i} msg={msg} onQuickReply={(chip) => send(chip)} />
              ))}
              {isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 'var(--r-md)', background: 'var(--primary-dim)', display: 'grid', placeItems: 'center' }}>
                    <Sparkles size={13} color="var(--primary-500)" />
                  </div>
                  <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', borderRadius: '0.25rem 1.125rem 1.125rem 1.125rem', padding: '0.5rem 0.75rem' }}>
                    <TypingDots />
                  </div>
                </motion.div>
              )}
              <div ref={endRef} />
            </div>

            {/* Suggested prompts — shown only at start */}
            <AnimatePresence>
              {showSuggested && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ padding: '0 1rem 0.625rem', flexShrink: 0 }}
                >
                  <div style={{ fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    Suggested
                  </div>
                  <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                    {prompts.map((p, i) => (
                      <button
                        key={i}
                        onClick={() => send(p)}
                        style={{
                          padding: '0.35rem 0.625rem',
                          borderRadius: 'var(--r-2xl)',
                          background: 'var(--bg-raised)',
                          border: '1px solid var(--border-base)',
                          color: 'var(--text-secondary)',
                          fontSize: '0.7rem', fontWeight: 500,
                          cursor: 'pointer', transition: 'all 150ms',
                          whiteSpace: 'nowrap',
                        }}
                        onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--primary-500)'; e.currentTarget.style.color = 'var(--primary-400)'; e.currentTarget.style.background = 'var(--primary-dim)'; }}
                        onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border-base)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'var(--bg-raised)'; }}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input */}
            <div style={{
              padding: '0.75rem 1rem',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex', gap: '0.5rem', flexShrink: 0,
              background: 'rgba(0,0,0,0.2)',
            }}>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask your coach..."
                disabled={isLoading}
                className="input"
                style={{
                  flex: 1, padding: '0.6rem 0.875rem',
                  fontSize: '0.875rem', borderRadius: 'var(--r-xl)',
                  background: 'var(--bg-raised)',
                }}
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || isLoading}
                className="btn btn-primary"
                style={{
                  padding: '0.6rem 0.875rem',
                  borderRadius: 'var(--r-xl)',
                  opacity: !input.trim() || isLoading ? 0.45 : 1,
                  transition: 'opacity 150ms',
                  flexShrink: 0,
                }}
              >
                <Send size={15} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
