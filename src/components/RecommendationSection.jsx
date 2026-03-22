import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Salad, PlayCircle, ChevronRight, Sparkles, Clock, Flame, Info } from 'lucide-react';

/* ── helpers ─────────────────────────────────────── */
const TYPE_META = {
  workout: { Icon: Dumbbell, color: 'var(--primary-500)', label: 'Workout', dim: 'var(--primary-dim)', dest: '/gym' },
  meal:    { Icon: Salad,   color: 'var(--amber-500)',   label: 'Meal',    dim: 'rgba(245,158,11,0.1)', dest: '/eat' },
  video:   { Icon: PlayCircle, color: 'var(--blue-500)',  label: 'Video',   dim: 'var(--blue-dim)', dest: '/gym' },
};

/* ── Single Card ─────────────────────────────────── */
const RecommendationCard = ({ item, index, onDismiss }) => {
  const [showReasons, setShowReasons] = useState(false);
  const navigate = useNavigate();
  const meta = TYPE_META[item.type];
  if (!meta) return null;

  const handleTap = () => navigate(meta.dest);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0, transition: { delay: index * 0.06, duration: 0.35, ease: [0.16,1,0.3,1] } }}
      exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0, transition: { duration: 0.2 } }}
      style={{
        borderRadius: 'var(--r-xl)',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        overflow: 'hidden',
        cursor: 'pointer',
        flexShrink: 0,
        width: 200,
        transition: 'box-shadow 200ms',
      }}
      onMouseOver={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)'}
      onMouseOut={e => e.currentTarget.style.boxShadow = 'none'}
      onClick={handleTap}
    >
      {/* Accent bar */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${meta.color}, ${meta.color}99)` }} />

      <div style={{ padding: '0.75rem' }}>
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
            fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
            color: meta.color, background: meta.dim, borderRadius: 'var(--r-sm)', padding: '0.2rem 0.4rem',
          }}>
            <meta.Icon size={9} /> {meta.label}
          </span>

          {/* Score badge */}
          <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            {item.score}%
          </span>
        </div>

        {/* Title */}
        <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.2rem', lineHeight: 1.25 }}>
          {item.emoji || ''} {item.title || item.name}
        </div>

        {/* Subtitle */}
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
          {item.focus || item.meal_type?.replace(/_/g, ' ') || item.channel || ''}
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
          {item.duration && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              <Clock size={10} /> {item.duration}
              {item.type === 'meal' ? ' kcal' : 'min'}
            </span>
          )}
          {item.calories && item.type === 'meal' && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              <Flame size={10} /> {item.calories} kcal
            </span>
          )}
          {item.protein && item.type === 'meal' && (
            <span style={{ fontSize: '0.7rem', color: meta.color, fontWeight: 600 }}>
              {item.protein}g protein
            </span>
          )}
        </div>

        {/* Reason */}
        {item.reasons?.[0] && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: '0.35rem',
            padding: '0.375rem 0.5rem', borderRadius: 'var(--r-md)',
            background: meta.dim, fontSize: '0.7rem', color: meta.color,
          }}>
            <Sparkles size={9} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
            {item.reasons[0]}
          </div>
        )}
      </div>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════
   RECOMMENDATION SECTION (exported)
   Takes pre-computed { workouts, meals, videos } from engine
═══════════════════════════════════════════════════ */
export default function RecommendationSection({ recommendations }) {
  const [tab, setTab]         = useState('workout');
  const [dismissed, setDismissed] = useState([]);
  const navigate = useNavigate();

  if (!recommendations) return null;
  const { workouts = [], meals = [], videos = [], meta = {} } = recommendations;

  const TABS = [
    { key: 'workout', label: '💪 Workouts', items: workouts },
    { key: 'meal',    label: '🥗 Meals',    items: meals },
    { key: 'video',   label: '📺 Videos',   items: videos },
  ];

  const currentItems = TABS.find(t => t.key === tab)?.items.filter(i => !dismissed.includes(i.id)) || [];

  const dismiss = (id, e) => {
    e.stopPropagation();
    setDismissed(prev => [...prev, id]);
  };

  return (
    <div style={{
      background: '#111113',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 16,
      padding: '1rem 1.125rem',
      boxShadow: '0 2px 8px rgba(0,0,0,0.45)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={17} color="var(--primary-500)" />
          For You
          <span style={{ fontSize: '0.65rem', background: 'var(--primary-dim)', color: 'var(--primary-400)', borderRadius: 'var(--r-sm)', padding: '0.15rem 0.4rem', fontWeight: 600 }}>
            AI
          </span>
        </h2>
        {meta.goal && (
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            Goal: {meta.goal}
          </span>
        )}
      </div>

      {/* Context pills (why we're recommending this) */}
      {(meta.sleep != null || meta.mood != null || meta.streak > 0) && (
        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          {meta.sleep != null && (
            <span style={{ padding: '0.2rem 0.5rem', borderRadius: 'var(--r-full)', background: 'var(--blue-dim)', color: 'var(--blue-400)', fontSize: '0.65rem', fontWeight: 600 }}>
              🌙 {meta.sleep}h sleep
            </span>
          )}
          {meta.mood != null && (
            <span style={{ padding: '0.2rem 0.5rem', borderRadius: 'var(--r-full)', background: 'var(--bg-raised)', color: 'var(--text-secondary)', fontSize: '0.65rem', fontWeight: 600 }}>
              {['😔','😐','🙂','😊','🤩'][meta.mood - 1]} mood {meta.mood}/5
            </span>
          )}
          {meta.streak > 0 && (
            <span style={{ padding: '0.2rem 0.5rem', borderRadius: 'var(--r-full)', background: 'rgba(245,158,11,0.1)', color: 'var(--amber-400)', fontSize: '0.65rem', fontWeight: 600 }}>
              🔥 {meta.streak}-day streak
            </span>
          )}
          {meta.proteinTarget > 0 && (
            <span style={{ padding: '0.2rem 0.5rem', borderRadius: 'var(--r-full)', background: 'var(--bg-raised)', color: 'var(--text-muted)', fontSize: '0.65rem' }}>
              Target: {meta.proteinTarget}g protein
            </span>
          )}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '0.875rem' }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--r-full)',
              border: tab === t.key ? '1px solid var(--primary-500)' : '1px solid var(--border-subtle)',
              background: tab === t.key ? 'var(--primary-dim)' : 'var(--bg-raised)',
              color: tab === t.key ? 'var(--primary-400)' : 'var(--text-secondary)',
              fontSize: '0.75rem', fontWeight: tab === t.key ? 600 : 500,
              cursor: 'pointer', transition: 'all 150ms',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Horizontal scroll of cards */}
      <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.75rem', minHeight: 180 }}>
        <AnimatePresence mode="popLayout">
          {currentItems.map((item, i) => (
            <RecommendationCard key={item.id} item={item} index={i} onDismiss={dismiss} />
          ))}
        </AnimatePresence>

        {/* See all CTA */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0, transition: { delay: 0.25 } }}
          onClick={() => navigate(TYPE_META[tab]?.dest || '/today')}
          style={{
            borderRadius: 'var(--r-xl)',
            border: '1px dashed var(--border-subtle)',
            width: 100, flexShrink: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: '0.5rem', cursor: 'pointer',
            color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600,
            padding: '1rem 0.5rem',
            transition: 'border-color 200ms, color 200ms',
          }}
          onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--primary-500)'; e.currentTarget.style.color = 'var(--primary-400)'; }}
          onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <ChevronRight size={18} />
          See all
        </motion.div>
      </div>
    </div>
  );
}
