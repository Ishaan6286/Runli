import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Dumbbell, Salad, Brain, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';

const pageVariants = {
  initial: { opacity: 0, y: 16, filter: 'blur(8px)' },
  animate: {
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0, y: -8,
    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
  },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
};

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1, y: 0,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
  },
};

const FEATURES = [
  { icon: Brain,    label: 'AI Coach',      desc: 'Plans built around your body' },
  { icon: Dumbbell, label: 'Smart Training', desc: 'Adaptive workout sessions' },
  { icon: Salad,    label: 'Nutrition OS',  desc: 'Macro tracking that thinks' },
  { icon: Zap,      label: 'Daily Streaks', desc: 'XP, badges, and habit rings' },
];

const Hero = () => {
  const { user } = useAuth();

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(2rem, 6vw, 4rem) clamp(1.25rem, 5vw, 3rem)',
        position: 'relative',
        color: 'var(--text-primary)',
      }}
    >
      {/* Content */}
      <div
        style={{
          maxWidth: '760px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 'clamp(1.5rem, 4vw, 2.5rem)',
        }}
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }}
        >
          <img
            src={logo}
            alt="Runli"
            style={{
              width: 'clamp(180px, 50vw, 260px)',
              height: 'auto',
              filter: 'drop-shadow(0 0 24px rgba(34,197,94,0.22))',
            }}
          />
        </motion.div>

        {/* Eyebrow chip */}
        <motion.div variants={staggerItem} initial="initial" animate="animate">
          <span className="chip chip-primary">✦ AI Fitness Operating System</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={staggerItem}
          initial="initial"
          animate="animate"
          style={{
            fontFamily: "'Plus Jakarta Sans', Inter, sans-serif",
            fontSize: 'clamp(2.25rem, 7vw, 4.25rem)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            margin: 0,
          }}
        >
          Your body runs{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, var(--primary-400) 0%, var(--primary-600) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            on Runli.
          </span>
        </motion.h1>

        {/* Sub */}
        <motion.p
          variants={staggerItem}
          initial="initial"
          animate="animate"
          style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.125rem)',
            color: 'var(--text-secondary)',
            lineHeight: 1.65,
            maxWidth: '560px',
            margin: 0,
          }}
        >
          One intelligent layer that learns your body, plans your nutrition, tracks your habits, and coaches your workouts — so every decision is backed by data.
        </motion.p>

        {/* CTAs */}
        <motion.div
          variants={staggerItem}
          initial="initial"
          animate="animate"
          style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}
        >
          <Link
            to={user ? '/userinfo' : '/login'}
            className="btn btn-primary"
            style={{ fontSize: '0.9375rem', padding: '0.875rem 1.75rem', borderRadius: 'var(--r-xl)' }}
          >
            Get your free AI fitness plan
            <ArrowRight size={18} />
          </Link>
          {user && (
            <Link
              to="/dashboard"
              className="btn btn-secondary"
              style={{ fontSize: '0.9375rem', padding: '0.8125rem 1.5rem', borderRadius: 'var(--r-xl)' }}
            >
              Go to Dashboard
            </Link>
          )}
        </motion.div>

        {/* Feature grid */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '0.75rem',
            width: '100%',
            maxWidth: '600px',
          }}
        >
          {FEATURES.map(({ icon: Icon, label, desc }) => (
            <motion.div
              key={label}
              variants={staggerItem}
              className="card"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                padding: '1rem 1.25rem',
                textAlign: 'left',
                cursor: 'default',
              }}
            >
              <span
                style={{
                  width: 36, height: 36,
                  borderRadius: 'var(--r-lg)',
                  background: 'var(--primary-dim)',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon size={18} color="var(--primary-500)" />
              </span>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.15rem' }}>
                  {label}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {desc}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Social proof */}
        <motion.p
          variants={staggerItem}
          initial="initial"
          animate="animate"
          style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}
        >
          Free to start · No credit card required
        </motion.p>
      </div>
    </motion.div>
  );
};

export default Hero;
