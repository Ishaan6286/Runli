/**
 * Upgrade.jsx — /upgrade
 * Premium pricing page for Runli Pro.
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Zap, Check, X, ArrowLeft, Star, Shield, ChevronDown, ChevronUp,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import usePlan from '../hooks/usePlan.js';

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

/* ── Feature comparison ──────────────────────────────── */
const FEATURES = [
  { label: 'Workout & Diet Logging',        free: true,  pro: true  },
  { label: 'Basic Progress Charts (7 days)',  free: true,  pro: true  },
  { label: 'AI Daily Insight (1/day)',        free: true,  pro: true  },
  { label: 'Habit Tracker',                  free: '3 habits', pro: 'Unlimited' },
  { label: 'Video Library',                  free: '5 videos', pro: 'Full library' },
  { label: 'AI Weekly Digest',               free: false, pro: true  },
  { label: 'Food Scanner (photo → calories)',free: false, pro: true  },
  { label: 'Pose Detection & Form Analysis', free: false, pro: true  },
  { label: 'Full Analytics Dashboard',       free: false, pro: true  },
  { label: 'Fitness Archetype Breakdown',    free: false, pro: true  },
  { label: 'All-Time Progress Charts',       free: false, pro: true  },
  { label: 'Custom Diet Plans (unlimited)',  free: false, pro: true  },
  { label: 'Priority Support',               free: false, pro: true  },
];

const FAQS = [
  { q: 'Can I cancel anytime?', a: 'Yes — no long-term commitment. Cancel anytime and keep Pro until the period ends.' },
  { q: 'Is my data safe?', a: 'Absolutely. We never sell your data. All health data is encrypted and stored securely.' },
  { q: 'What payment methods are supported?', a: 'UPI, debit/credit cards, net banking, and wallets via Razorpay.' },
  { q: 'Can I try Pro before paying?', a: 'Yes — tap "Start 7-day free trial" to get full access with no charge upfront.' },
];

function FeatureRow({ label, free, pro }) {
  const Cell = ({ val, highlight }) => (
    <td style={{
      padding: '0.6rem 0.75rem', textAlign: 'center', fontSize: '0.8125rem',
      color: highlight ? '#10b981' : val === false ? 'var(--text-muted)' : 'var(--text-primary)',
      fontWeight: highlight ? 700 : 400,
    }}>
      {val === true  ? <Check size={15} color="#10b981" strokeWidth={2.5} style={{ margin: '0 auto', display: 'block' }} /> :
       val === false ? <X    size={13} color="var(--text-muted)" style={{ margin: '0 auto', display: 'block' }} /> :
       val}
    </td>
  );
  return (
    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
      <td style={{ padding: '0.6rem 0.75rem', fontSize: '0.8125rem', color: 'var(--text-primary)' }}>{label}</td>
      <Cell val={free} />
      <Cell val={pro} highlight />
    </tr>
  );
}

/* ══ Main Page ══════════════════════════════════════════ */
export default function Upgrade() {
  const [annual, setAnnual]   = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const navigate  = useNavigate();
  const { isPro, grantPro } = usePlan();

  const monthlyPrice = 299;
  const annualPrice  = 1999;
  const saving       = Math.round(100 - (annualPrice / (monthlyPrice * 12)) * 100);

  const handleUpgrade = () => {
    // TODO: integrate Razorpay here
    // For now: grant pro immediately (dev mode / demo)
    grantPro(annual ? 12 : 1);
    navigate(-1);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{
        minHeight: '100vh', padding: 'clamp(1rem, 4vw, 2rem)',
        maxWidth: 560, margin: '0 auto',
      }}>

      {/* Back */}
      <button onClick={() => navigate(-1)} style={{
        display: 'flex', alignItems: 'center', gap: '0.4rem',
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'var(--text-secondary)', fontSize: '0.875rem', padding: '0 0 1rem', fontWeight: 600,
      }}>
        <ArrowLeft size={16} /> Back
      </button>

      {/* ── Hero ── */}
      <motion.div variants={fadeUp} initial="initial" animate="animate" style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%', margin: '0 auto 1rem',
          background: 'linear-gradient(135deg, #f59e0b22, #ef444422)',
          border: '1.5px solid rgba(245,158,11,0.4)',
          display: 'grid', placeItems: 'center',
        }}>
          <Zap size={28} color="#f59e0b" fill="#f59e0b" />
        </div>
        <h1 style={{ margin: '0 0 0.4rem', fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.04em' }}>
          Runli Pro
        </h1>
        <p style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          AI-powered coaching, advanced analytics, and every premium feature — unlocked.
        </p>
      </motion.div>

      {/* ── Already Pro ── */}
      {isPro && (
        <motion.div variants={fadeUp} initial="initial" animate="animate"
          style={{
            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: 'var(--r-lg)', padding: '1rem', textAlign: 'center',
            marginBottom: '1.5rem', color: '#10b981', fontWeight: 700, fontSize: '0.9375rem',
          }}>
          ✅ You're already on Runli Pro!
        </motion.div>
      )}

      {/* ── Toggle ── */}
      <motion.div variants={fadeUp} initial="initial" animate="animate"
        style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
        <div style={{
          display: 'inline-flex', background: 'var(--bg-raised)',
          borderRadius: 99, padding: '0.2rem', gap: '0.2rem',
          border: '1px solid var(--border-subtle)',
        }}>
          {[false, true].map(isAnnual => (
            <button key={String(isAnnual)} onClick={() => setAnnual(isAnnual)}
              style={{
                padding: '0.4rem 1rem', borderRadius: 99, border: 'none', cursor: 'pointer',
                fontWeight: 700, fontSize: '0.8125rem', transition: 'all 200ms',
                background: annual === isAnnual
                  ? 'linear-gradient(135deg, #f59e0b, #ef4444)' : 'transparent',
                color: annual === isAnnual ? '#fff' : 'var(--text-secondary)',
              }}>
              {isAnnual ? `Annual · Save ${saving}%` : 'Monthly'}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── Pricing card ── */}
      <motion.div variants={fadeUp} initial="initial" animate="animate"
        style={{
          background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(239,68,68,0.08))',
          border: '1.5px solid rgba(245,158,11,0.35)',
          borderRadius: 'var(--r-xl)', padding: '1.5rem',
          marginBottom: '1.25rem', textAlign: 'center',
          boxShadow: '0 8px 32px rgba(245,158,11,0.1)',
        }}>
        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#f59e0b', fontWeight: 700, marginBottom: '0.5rem' }}>
          {annual ? 'Best Value' : 'Monthly'}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '0.25rem', marginBottom: '0.25rem' }}>
          <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 600, paddingBottom: '0.35rem' }}>₹</span>
          <span style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, color: 'var(--text-primary)' }}>
            {annual ? Math.round(annualPrice / 12) : monthlyPrice}
          </span>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', paddingBottom: '0.35rem' }}>/mo</span>
        </div>
        {annual && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            ₹{annualPrice} billed annually · saves ₹{monthlyPrice * 12 - annualPrice}/yr
          </div>
        )}

        <button
          onClick={handleUpgrade}
          disabled={isPro}
          style={{
            width: '100%', padding: '0.9rem', borderRadius: 'var(--r-lg)',
            background: isPro ? 'var(--bg-raised)' : 'linear-gradient(135deg, #f59e0b, #ef4444)',
            border: 'none', color: isPro ? 'var(--text-muted)' : '#fff',
            fontWeight: 800, fontSize: '1rem', cursor: isPro ? 'default' : 'pointer',
            letterSpacing: '-0.01em',
            boxShadow: isPro ? 'none' : '0 4px 20px rgba(245,158,11,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem',
            marginBottom: '0.5rem',
          }}
        >
          <Zap size={16} fill={isPro ? 'var(--text-muted)' : '#fff'} color={isPro ? 'var(--text-muted)' : '#fff'} />
          {isPro ? 'Already Pro' : 'Start 7-Day Free Trial'}
        </button>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          <Shield size={10} style={{ verticalAlign: 'middle', marginRight: 3 }} />
          No charge for 7 days. Cancel anytime.
        </div>
      </motion.div>

      {/* ── Trust badges ── */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
        {[
          { icon: '🔒', label: 'Encrypted & Private' },
          { icon: '↩️', label: 'Cancel Anytime' },
          { icon: '⚡', label: 'Instant Unlock' },
        ].map(b => (
          <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            <span>{b.icon}</span>{b.label}
          </div>
        ))}
      </div>

      {/* ── Feature comparison table ── */}
      <motion.div variants={fadeUp} initial="initial" animate="animate"
        className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '1.25rem' }}>
        <div style={{ padding: '0.875rem 1rem 0', fontWeight: 700, fontSize: '0.9375rem' }}>All Features</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Feature</th>
              <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Free</th>
              <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontSize: '0.7rem', color: '#f59e0b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>⚡ Pro</th>
            </tr>
          </thead>
          <tbody>
            {FEATURES.map(f => <FeatureRow key={f.label} {...f} />)}
          </tbody>
        </table>
      </motion.div>

      {/* ── User testimonials ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {[
          { name: 'Arjun K.', text: 'Food scanner alone is worth it — saves me 10 mins a day.', stars: 5 },
          { name: 'Priya M.', text: 'The AI weekly digest keeps me accountable every Sunday.', stars: 5 },
        ].map(t => (
          <div key={t.name} className="card" style={{ padding: '0.875rem' }}>
            <div style={{ display: 'flex', gap: '0.2rem', marginBottom: '0.4rem' }}>
              {Array.from({ length: t.stars }).map((_, i) => <Star key={i} size={11} color="#f59e0b" fill="#f59e0b" />)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.4rem' }}>"{t.text}"</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>— {t.name}</div>
          </div>
        ))}
      </div>

      {/* ── FAQ ── */}
      <motion.div variants={fadeUp} initial="initial" animate="animate" className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ margin: '0 0 0.875rem', fontSize: '0.9375rem', fontWeight: 700 }}>FAQs</h2>
        {FAQS.map((faq, i) => (
          <div key={i} style={{ borderTop: i > 0 ? '1px solid var(--border-subtle)' : 'none' }}>
            <button
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              style={{
                width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.75rem 0', textAlign: 'left', color: 'var(--text-primary)',
                fontWeight: 600, fontSize: '0.8125rem', gap: '0.5rem',
              }}
            >
              {faq.q}
              {openFaq === i ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {openFaq === i && (
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6, paddingBottom: '0.75rem' }}>
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </motion.div>

      {/* Final CTA */}
      <button
        onClick={handleUpgrade}
        disabled={isPro}
        style={{
          width: '100%', padding: '0.9rem', borderRadius: 'var(--r-lg)',
          background: isPro ? 'var(--bg-raised)' : 'linear-gradient(135deg, #f59e0b, #ef4444)',
          border: 'none', color: isPro ? 'var(--text-muted)' : '#fff',
          fontWeight: 800, fontSize: '1rem', cursor: isPro ? 'default' : 'pointer',
          boxShadow: isPro ? 'none' : '0 4px 20px rgba(245,158,11,0.3)',
          marginBottom: '0.5rem',
        }}
      >
        {isPro ? 'Already on Pro ✅' : `Get Pro ${annual ? '· ₹' + Math.round(annualPrice / 12) + '/mo' : '· ₹' + monthlyPrice + '/mo'}`}
      </button>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', paddingBottom: '2rem' }}>
        7-day free trial. Cancel anytime. No hidden fees.
      </div>
    </motion.div>
  );
}
