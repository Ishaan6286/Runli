/**
 * motion.js — Centralized Framer Motion System for Runli
 * ─────────────────────────────────────────────────────
 * Single source of truth for all animations.
 * Import what you need — no runtime overhead for unused exports.
 *
 * Usage:
 *   import { pageVariants, fadeUp, stagger, spring, press } from '../utils/motion';
 */

/* ── Spring physics ──────────────────────────────────── */
export const spring = {
  /** Default snappy spring — navs, modals, sheets */
  snappy:  { type: 'spring', damping: 28, stiffness: 320, mass: 0.8 },
  /** Gentle spring — cards floating in */
  gentle:  { type: 'spring', damping: 22, stiffness: 200, mass: 1 },
  /** Bouncy spring — success states, checkmarks */
  bouncy:  { type: 'spring', damping: 16, stiffness: 350, mass: 0.6 },
  /** Stiff spring — instant-feeling UI feedback */
  stiff:   { type: 'spring', damping: 35, stiffness: 420, mass: 0.7 },
};

/* ── Easing curves ───────────────────────────────────── */
export const ease = {
  /** iOS-like deceleration */
  out:     [0.16, 1, 0.3, 1],
  /** Smooth in-out */
  inOut:   [0.4, 0, 0.2, 1],
  /** Sharp in */
  in:      [0.4, 0, 1, 1],
};

/* ══ PAGE TRANSITIONS ════════════════════════════════ */

/**
 * Standard mobile page enter/exit.
 * Slides up 14px + fades in + blur clears on enter.
 * Slides up 8px + fades out on exit.
 */
export const pageVariants = {
  initial: { opacity: 0, y: 14, filter: 'blur(6px)' },
  animate: {
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { duration: 0.5, ease: ease.out },
  },
  exit: {
    opacity: 0, y: -8,
    transition: { duration: 0.22, ease: ease.in },
  },
};

/**
 * Slide-in from right (push navigation).
 */
export const slidePage = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.38, ease: ease.out } },
  exit:    { opacity: 0, x: -16, transition: { duration: 0.2, ease: ease.in } },
};

/**
 * Bottom sheet / modal enter.
 * Snaps up from below using spring physics.
 */
export const sheetVariants = {
  initial: { y: '100%', opacity: 0 },
  animate: { y: 0, opacity: 1, transition: spring.snappy },
  exit:    { y: '100%', opacity: 0, transition: { duration: 0.25, ease: ease.in } },
};

/* ══ CARD / ELEMENT ENTRANCES ════════════════════════ */

/**
 * Fade + slide up from 16px below.
 * For use as child variants inside a stagger container.
 */
export const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1, y: 0,
    transition: { duration: 0.4, ease: ease.out },
  },
};

/**
 * Fade + scale in slightly. Good for chips, badges, icons.
 */
export const fadeScale = {
  initial: { opacity: 0, scale: 0.9 },
  animate: {
    opacity: 1, scale: 1,
    transition: spring.bouncy,
  },
  exit: {
    opacity: 0, scale: 0.9,
    transition: { duration: 0.15, ease: ease.in },
  },
};

/**
 * Slide in from left. Good for list items entering one by one.
 */
export const slideIn = {
  initial: { opacity: 0, x: -14 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.35, ease: ease.out } },
};

/* ══ STAGGER CONTAINERS ══════════════════════════════ */

/**
 * Standard stagger — children animate 90ms apart.
 * Used for card lists, stacked rows.
 */
export const stagger = {
  animate: {
    transition: { staggerChildren: 0.09, delayChildren: 0.05 },
  },
};

/**
 * Fast stagger — 50ms apart. Good for tight chip lists.
 */
export const staggerFast = {
  animate: {
    transition: { staggerChildren: 0.05, delayChildren: 0 },
  },
};

/**
 * Slow stagger — 140ms apart. Good for hero sections.
 */
export const staggerSlow = {
  animate: {
    transition: { staggerChildren: 0.14, delayChildren: 0.08 },
  },
};

/* ══ MICROINTERACTIONS ═══════════════════════════════ */

/**
 * Press feedback for tappable cards.
 * Scales down 2% on tap, snaps back.
 */
export const press = {
  whileTap: { scale: 0.98, transition: spring.stiff },
};

/**
 * Strong press for primary buttons (CTAs).
 * More noticeable scale down.
 */
export const pressButton = {
  whileHover: { scale: 1.02, transition: spring.snappy },
  whileTap:   { scale: 0.96, transition: spring.stiff },
};

/**
 * Icon bounce — for success checkmarks, toggles.
 */
export const iconBounce = {
  initial: { scale: 0.4, opacity: 0 },
  animate: { scale: 1, opacity: 1, transition: spring.bouncy },
  exit:    { scale: 0.4, opacity: 0, transition: { duration: 0.12 } },
};

/**
 * Floating card — subtle idle animation for hero elements.
 */
export const float = {
  animate: {
    y: [0, -4, 0],
    transition: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' },
  },
};

/**
 * Shake — for error states (wrong input, failed validation).
 */
export const shake = {
  animate: {
    x: [0, -8, 8, -6, 6, -3, 3, 0],
    transition: { duration: 0.5, ease: 'easeInOut' },
  },
};

/**
 * Progress bar fill — left-to-right width animation.
 * Use animate={{ width: `${pct}%` }}
 */
export const progressFill = {
  initial: { width: '0%' },
  transition: { duration: 0.8, ease: ease.out },
};

/**
 * Number counter — for animated stat reveals.
 * Works with framer-motion's useSpring + useTransform.
 */
export const counterSpring = { damping: 30, stiffness: 80 };

/* ══ LAYOUT TRANSITIONS ══════════════════════════════ */

/**
 * Smooth height animate — for accordion / expandable sections.
 * Set on the container, then use AnimatePresence inside.
 */
export const expandCollapse = {
  initial: { height: 0, opacity: 0 },
  animate: { height: 'auto', opacity: 1, transition: { duration: 0.28, ease: ease.out } },
  exit:    { height: 0, opacity: 0, transition: { duration: 0.2, ease: ease.in } },
};

/**
 * Tab switch — for bottom nav indicator or tab underline.
 */
export const tabIndicator = {
  layoutId: 'tab-indicator',
  transition: spring.snappy,
};

/* ══ CONVENIENCE WRAPPERS ════════════════════════════ */

/**
 * Returns combined initial/animate/exit props for a motion.div
 * from a given variants object. Reduces boilerplate.
 *
 * Usage:
 *   <motion.div {...applyVariants(fadeUp)}>
 */
export function applyVariants(variants) {
  return { variants, initial: 'initial', animate: 'animate', exit: 'exit' };
}

/**
 * Returns transition for progress bar.
 * Usage: <motion.div animate={{ width: `${pct}%` }} transition={barTransition(pct)}>
 */
export function barTransition(delay = 0) {
  return { duration: 0.75, ease: ease.out, delay };
}
