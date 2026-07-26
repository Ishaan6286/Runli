import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Trophy } from 'lucide-react';

// A singleton-like event emitter for achievements so we can trigger from anywhere
class AchievementEmitter {
  constructor() {
    this.listeners = [];
  }
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
  emit(achievements) {
    this.listeners.forEach(l => l(achievements));
  }
}
export const achievementEvents = new AchievementEmitter();

export default function AchievementToast() {
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    const unsubscribe = achievementEvents.subscribe((achievements) => {
      if (!achievements || achievements.length === 0) return;
      setQueue(prev => [...prev, ...achievements]);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (queue.length > 0) {
      // Fire confetti
      const duration = 2500;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#22c55e', '#a855f7', '#3b82f6']
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#22c55e', '#a855f7', '#3b82f6']
        });
        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();

      // Clear the first item after 4 seconds
      const timer = setTimeout(() => {
        setQueue(prev => prev.slice(1));
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [queue]);

  return (
    <AnimatePresence>
      {queue.length > 0 && (
        <motion.div
          key={queue[0].id || queue[0].title}
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          style={{
            position: 'fixed',
            bottom: '100px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            background: 'rgba(10, 10, 11, 0.95)',
            border: '1px solid var(--primary-500)',
            borderRadius: 'var(--r-xl)',
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            minWidth: '280px',
            boxShadow: '0 10px 40px rgba(34, 197, 94, 0.2)'
          }}
        >
          <div style={{
            width: '45px', height: '45px', borderRadius: '50%',
            background: 'var(--primary-dim)', display: 'grid', placeItems: 'center', flexShrink: 0
          }}>
            <Trophy size={24} color="var(--primary-500)" />
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--primary-500)', fontWeight: 700, letterSpacing: '0.05em' }}>
              Achievement Unlocked!
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
              {queue[0].title}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
              +{queue[0].xp} XP
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
