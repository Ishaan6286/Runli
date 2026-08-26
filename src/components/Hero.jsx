import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Dumbbell, Salad, Brain, Zap, TrendingUp, ShieldCheck } from 'lucide-react';
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
  { icon: Brain,      label: 'AI Coach',          desc: '24/7 personalized fitness intelligence built around your body' },
  { icon: Dumbbell,   label: 'Workout Planning',  desc: 'Adaptive training splits & exercise tracking' },
  { icon: Salad,      label: 'Nutrition Tracking',desc: 'Smart macro logging, meal plans & food vision analysis' },
  { icon: TrendingUp, label: 'Progress Analytics',desc: 'Fitness score trends, body metrics & AI health insights' },
  { icon: Zap,        label: 'Habit Streaks',     desc: 'Consistency rings, daily XP rewards & achievement badges' },
  { icon: ShieldCheck,label: 'Data Privacy',      desc: 'Encrypted health data & private personalization engine' },
];

const Hero = () => {
  const { user, token, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users directly to /today (dashboard)
  useEffect(() => {
    if (!loading && (user || token)) {
      navigate('/today', { replace: true });
    }
  }, [user, token, loading, navigate]);

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
        padding: 'clamp(2.5rem, 6vw, 5rem) clamp(1.25rem, 5vw, 3rem)',
        position: 'relative',
        color: 'var(--text-primary)',
      }}
    >
      {/* Content Container */}
      <div
        style={{
          maxWidth: '840px',
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
            alt="Runli Logo"
            style={{
              width: 'clamp(180px, 50vw, 260px)',
              height: 'auto',
              filter: 'drop-shadow(0 0 24px rgba(34,197,94,0.22))',
            }}
          />
        </motion.div>

        {/* Eyebrow chip */}
        <motion.div variants={staggerItem} initial="initial" animate="animate">
          <span className="chip chip-primary">✦ Your AI Workout & Nutrition Coach</span>
        </motion.div>

        {/* Main Headline */}
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

        {/* Subtitle */}
        <motion.p
          variants={staggerItem}
          initial="initial"
          animate="animate"
          style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.125rem)',
            color: 'var(--text-secondary)',
            lineHeight: 1.65,
            maxWidth: '620px',
            margin: 0,
          }}
        >
          Runli is an intelligent fitness companion that learns your unique biology, optimizes your nutrition, tracks habit streaks, and coaches your workout sessions in real time.
        </motion.p>

        {/* Call to Action Buttons */}
        <motion.div
          variants={staggerItem}
          initial="initial"
          animate="animate"
          style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}
        >
          <Link
            to="/login"
            className="btn btn-primary"
            style={{ fontSize: '0.9375rem', padding: '0.875rem 1.875rem', borderRadius: 'var(--r-xl)', textDecoration: 'none' }}
          >
            Get Started
            <ArrowRight size={18} />
          </Link>

          <Link
            to="/login"
            className="btn btn-secondary"
            style={{ fontSize: '0.9375rem', padding: '0.8125rem 1.75rem', borderRadius: 'var(--r-xl)', textDecoration: 'none' }}
          >
            Sign In
          </Link>
        </motion.div>

        {/* Feature Highlights Grid */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '0.875rem',
            width: '100%',
            maxWidth: '780px',
            marginTop: '1rem',
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
                padding: '1.125rem 1.25rem',
                textAlign: 'left',
                cursor: 'default',
              }}
            >
              <span
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 'var(--r-lg)',
                  background: 'var(--primary-dim)',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon size={20} color="var(--primary-500)" />
              </span>
              <div>
                <div style={{ fontWeight: 650, fontSize: '0.9375rem', marginBottom: '0.2rem' }}>
                  {label}
                </div>
                <div style={{ fontSize: '0.78125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {desc}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Social Proof */}
        <motion.p
          variants={staggerItem}
          initial="initial"
          animate="animate"
          style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0.5rem 0 0' }}
        >
          Free to start · Instant setup · Built for performance
        </motion.p>
      </div>
    </motion.div>
  );
};

export default Hero;
