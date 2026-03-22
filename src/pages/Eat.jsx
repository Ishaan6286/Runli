import React from 'react';
import { motion } from 'framer-motion';
import { Salad } from 'lucide-react';
import DietPlan from './DietPlan';
import FoodScanner from '../components/FoodScanner';
import ProGate from '../components/ProGate.jsx';

const pageVariants = {
  initial: { opacity: 0, y: 14, filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } },
};

/**
 * Eat tab — wraps DietPlan in the Neo-Glass OS shell.
 * Includes FoodScanner for image-based food detection.
 */
export default function Eat() {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="page-wrapper"
      style={{ padding: 0 }}
    >
      <div style={{ minHeight: '100vh', color: 'var(--text-primary)', paddingBottom: 80 }}>
        <div style={{
          padding: 'clamp(1.25rem, 4vw, 2rem) clamp(1rem, 3vw, 1.5rem) 0',
          maxWidth: 960,
          margin: '0 auto 0.5rem',
        }}>
          <h1 style={{ fontSize: 'clamp(1.375rem, 3vw, 1.75rem)', fontWeight: 700, letterSpacing: '-0.02em', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Salad size={22} color="var(--primary-500)" />
            Eat
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0.2rem 0 1rem' }}>
            Diet plan · Macro tracking · Food lookup · Image scan
          </p>

          {/* ── Food Scanner (AI image recognition) — Pro Feature ── */}
          <ProGate gate="food_scanner" variant="blur"
            fallback={<FoodScanner disabled />}
          >
            <FoodScanner />
          </ProGate>
        </div>
        <DietPlan />
      </div>
    </motion.div>
  );
}

