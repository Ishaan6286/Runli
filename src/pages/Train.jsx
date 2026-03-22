import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Dumbbell, Play, Pause, RotateCcw, CheckCircle, Circle,
  Calculator, Clock, Video as VideoIcon, X, Disc, Volume2,
  VolumeX, ChevronRight, Zap
} from 'lucide-react';
import GymMode from './GymMode';

/* ── Motion variants ─────────────────────────────────── */
const pageVariants = {
  initial: { opacity: 0, y: 14, filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } },
};

/**
 * Train tab wraps GymMode in the Neo-Glass page shell with AnimatePresence.
 * All GymMode logic is preserved.
 */
export default function Train() {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="page-wrapper"
      style={{ padding: 0 }}
    >
      {/* GymMode fills the full content area */}
      <GymModeShell />
    </motion.div>
  );
}

/**
 * Wraps GymMode with the Neo-Glass Elite header title bar,
 * replacing the old pure-black background root div.
 */
const GymModeShell = () => {
  // Re-render GymMode but intercept its root background via a wrapper
  return (
    <div style={{ minHeight: '100vh', color: 'var(--text-primary)', paddingBottom: 80 }}>
      {/* Page header visible above GymMode content */}
      <div style={{
        padding: 'clamp(1.25rem, 4vw, 2rem) clamp(1rem, 3vw, 1.5rem) 0',
        maxWidth: 960,
        margin: '0 auto 0.5rem',
      }}>
        <h1 style={{ fontSize: 'clamp(1.375rem, 3vw, 1.75rem)', fontWeight: 700, letterSpacing: '-0.02em', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Dumbbell size={22} color="var(--primary-500)" />
          Train
        </h1>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0' }}>
          Today's workout · Live session · Video library
        </p>
      </div>
      <GymMode />
    </div>
  );
};
