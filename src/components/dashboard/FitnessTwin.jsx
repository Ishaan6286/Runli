import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Activity, UtensilsCrossed, Moon, Flame, Target, RefreshCw } from 'lucide-react';
import { getTwin, learnTwin } from '../../services/api';

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.1 } },
};

const staggerItem = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};

export default function FitnessTwin() {
  const [twin, setTwin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [learning, setLearning] = useState(false);

  useEffect(() => {
    fetchTwin();
  }, []);

  const fetchTwin = async () => {
    try {
      setLoading(true);
      const res = await getTwin();
      if (res.twin) {
        setTwin(res.twin);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLearn = async () => {
    try {
      setLearning(true);
      const res = await learnTwin();
      if (res.twin) {
        setTwin(res.twin);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLearning(false);
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading AI Twin...</div>
      </div>
    );
  }

  return (
    <div className="card" style={{ overflow: 'hidden', position: 'relative' }}>
      {/* Background Glow */}
      <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, background: 'var(--primary-500)', opacity: 0.05, filter: 'blur(50px)', borderRadius: '50%' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.0625rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Brain size={18} color="var(--primary-500)" />
            AI Fitness Twin
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0' }}>
            Your digital representation learning from behavior.
          </p>
        </div>
        <button 
          onClick={handleLearn} 
          disabled={learning}
          className="btn btn-secondary" 
          style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', display: 'flex', gap: '0.35rem', borderColor: 'var(--border-subtle)' }}
        >
          <RefreshCw size={14} className={learning ? 'spin' : ''} />
          {learning ? 'Learning...' : 'Sync Twin'}
        </button>
      </div>

      {!twin ? (
        <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          No twin data yet. Click Sync Twin to analyze your logs.
        </div>
      ) : (
        <motion.div variants={staggerContainer} initial="initial" animate="animate" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          
          <CategoryCard title="Workout Behavior" icon={Activity} color="var(--primary-500)" data={twin.workoutBehavior} />
          <CategoryCard title="Diet Behavior" icon={UtensilsCrossed} color="var(--amber-500)" data={twin.dietBehavior} />
          <CategoryCard title="Recovery Patterns" icon={Moon} color="var(--blue-500)" data={twin.recoveryPatterns} />
          <CategoryCard title="Motivation Patterns" icon={Flame} color="var(--purple-500)" data={twin.motivationPatterns} />
          <CategoryCard title="Adherence Patterns" icon={Target} color="var(--green-500)" data={twin.adherencePatterns} />

        </motion.div>
      )}

      {twin && twin.lastUpdated && (
        <div style={{ marginTop: '1rem', fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'right' }}>
          Last updated: {new Date(twin.lastUpdated).toLocaleString()}
        </div>
      )}
    </div>
  );
}

const CategoryCard = ({ title, icon: Icon, color, data }) => {
  if (!data || data.length === 0) return null;

  return (
    <motion.div variants={staggerItem} style={{ background: 'var(--bg-raised)', padding: '1rem', borderRadius: 'var(--r-lg)', border: '1px solid var(--border-subtle)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <div style={{ width: 28, height: 28, borderRadius: 'var(--r-md)', background: `${color}1a`, display: 'grid', placeItems: 'center' }}>
          <Icon size={14} color={color} />
        </div>
        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>{title}</div>
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {data.map((item, idx) => (
          <li key={idx} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4, display: 'flex', gap: '0.4rem' }}>
            <span style={{ color: color, fontSize: '0.8rem' }}>•</span>
            {item}
          </li>
        ))}
      </ul>
    </motion.div>
  );
};
