/**
 * MotionCard.jsx — Animated card wrapper with press + entrance
 * ─────────────────────────────────────────────────────────────
 * Wraps any content in a motion.div with:
 *  - fadeUp entrance (staggered if inside a stagger container)
 *  - press feedback on tap (scale: 0.98)
 *  - optional hover lift
 *
 * Usage:
 *   <MotionCard onClick={...}>...</MotionCard>
 *   <MotionCard hover lift className="card">...</MotionCard>
 */
import React from 'react';
import { motion } from 'framer-motion';
import { fadeUp, press, spring } from '../utils/motion.js';

export default function MotionCard({
  children,
  className = 'card',
  style = {},
  onClick,
  hover = false,
  lift = false,       // adds translateY(-3px) on hover
  press: pressFlag = true,
  variants = fadeUp,
  ...rest
}) {
  return (
    <motion.div
      className={className}
      style={style}
      variants={variants}
      whileTap={pressFlag && onClick ? { scale: 0.98, transition: { type: 'spring', damping: 35, stiffness: 420 } } : undefined}
      whileHover={
        hover || lift
          ? {
              scale: hover ? 1.01 : 1,
              y: lift ? -3 : 0,
              boxShadow: lift ? 'var(--glow-primary)' : undefined,
              transition: { type: 'spring', damping: 25, stiffness: 300 },
            }
          : undefined
      }
      onClick={onClick}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────
   PressButton — animated button with spring tap + hover
───────────────────────────────────────────────────── */
export function PressButton({
  children,
  onClick,
  disabled,
  style = {},
  className,
  variant = 'primary', // 'primary' | 'ghost' | 'subtle'
  ...rest
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={{
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        border: 'none',
        ...style,
      }}
      whileHover={!disabled ? { scale: 1.02, transition: { type: 'spring', damping: 25, stiffness: 300 } } : undefined}
      whileTap={!disabled  ? { scale: 0.96, transition: { type: 'spring', damping: 35, stiffness: 420 } } : undefined}
      {...rest}
    >
      {children}
    </motion.button>
  );
}

/* ─────────────────────────────────────────────────────
   AnimatedCheckmark — bouncy icon swap for toggles
───────────────────────────────────────────────────── */
import { AnimatePresence } from 'framer-motion';
import { iconBounce } from '../utils/motion.js';

export function AnimatedIcon({ show, ShowIcon, HideIcon, color, size = 18 }) {
  return (
    <AnimatePresence mode="wait">
      {show ? (
        <motion.div key="show" variants={iconBounce} initial="initial" animate="animate" exit="exit">
          <ShowIcon size={size} color={color} />
        </motion.div>
      ) : (
        <motion.div key="hide" variants={iconBounce} initial="initial" animate="animate" exit="exit">
          <HideIcon size={size} color="var(--text-muted)" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─────────────────────────────────────────────────────
   PageWrapper — standard page enter/exit wrapper
───────────────────────────────────────────────────── */
import { pageVariants } from '../utils/motion.js';

export function PageWrapper({ children, style = {}, ...rest }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ minHeight: '100vh', paddingBottom: 80, ...style }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────
   StaggerList — wraps children in a stagger container
───────────────────────────────────────────────────── */
import { stagger, staggerFast } from '../utils/motion.js';

export function StaggerList({ children, fast = false, style = {}, ...rest }) {
  return (
    <motion.div
      variants={fast ? staggerFast : stagger}
      initial="initial"
      animate="animate"
      style={style}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
