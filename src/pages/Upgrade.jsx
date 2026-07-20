/**
 * Upgrade.jsx — /upgrade
 * 3-tier pricing page: FREE, PRO (₹99/mo), ELITE (₹199/mo)
 * with Razorpay Subscription checkout integration.
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Check, X, ArrowLeft, Shield, ChevronDown, ChevronUp,
  Brain, Mic, Camera, Salad, TrendingUp, Star, Crown, Sparkles,
  BarChart2, Activity,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import usePlan from '../hooks/usePlan.js';
import { createCheckoutSession, verifySubscriptionPayment, activateTrial } from '../services/api.js';

/* ── Motion variants ── */
const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
};

/* ── Tier definitions ── */
const TIERS = [
  {
    id: 'free',
    label: 'Free',
    price: null,
    badge: null,
    color: 'var(--text-muted)',
    gradient: 'var(--bg-surface)',
    borderColor: 'var(--border-subtle)',
    icon: Star,
    tagline: 'Get started on your fitness journey',
    features: [
      { label: 'Workout Tracking', included: true },
      { label: 'Habit Tracking', included: true },
      { label: 'Basic Analytics (7 days)', included: true },
      { label: 'Daily AI Insight (1/day)', included: true },
      { label: '5 Habit slots', included: true },
      { label: 'Voice AI Coach', included: false },
      { label: 'Fitness Score', included: false },
      { label: 'Recovery Intelligence', included: false },
      { label: 'Advanced Insights', included: false },
      { label: 'AI Fitness Twin', included: false },
      { label: 'Elite Pose Coach', included: false },
      { label: 'Nutrition Scanner', included: false },
      { label: 'Predictive Analytics', included: false },
    ],
  },
  {
    id: 'pro',
    label: 'Pro',
    price: 99,
    badge: 'Most Popular',
    color: '#10b981',
    gradient: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.04))',
    borderColor: 'rgba(16,185,129,0.45)',
    icon: Zap,
    tagline: 'AI coaching to accelerate your results',
    features: [
      { label: 'Everything in Free', included: true },
      { label: 'Voice AI Coach (30 min/mo)', included: true },
      { label: 'Fitness Score', included: true },
      { label: 'Recovery Intelligence', included: true },
      { label: 'Advanced Insights & Trends', included: true },
      { label: 'Unlimited Habits', included: true },
      { label: 'Full Video Library', included: true },
      { label: 'All-Time Progress Charts', included: true },
      { label: 'Custom Diet Plans', included: true },
      { label: 'AI Fitness Twin', included: false },
      { label: 'Elite Pose Coach', included: false },
      { label: 'Nutrition Scanner', included: false },
      { label: 'Predictive Analytics', included: false },
    ],
  },
  {
    id: 'elite',
    label: 'Elite',
    price: 199,
    badge: 'Best Value',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(239,68,68,0.06))',
    borderColor: 'rgba(245,158,11,0.5)',
    icon: Crown,
    tagline: 'Everything Runli can offer, unlocked',
    features: [
      { label: 'Everything in Pro', included: true },
      { label: 'AI Fitness Twin', included: true },
      { label: 'Elite Pose Coach (unlimited)', included: true },
      { label: 'Nutrition Scanner (100 scans/mo)', included: true },
      { label: 'Predictive Analytics', included: true },
      { label: 'Premium Voice Coach (120 min/mo)', included: true },
      { label: 'Priority Support', included: true },
      { label: 'Early Access to New Features', included: true },
      { label: 'Unlimited AI Requests', included: true },
    ],
  },
];

const FAQS = [
  { q: 'Can I cancel anytime?', a: 'Yes — no long-term commitment. Cancel anytime from your Billing dashboard and keep your plan until the period ends.' },
  { q: 'What payment methods are supported?', a: 'UPI, debit/credit cards, net banking, and wallets via Razorpay — all major Indian payment methods.' },
  { q: 'Can I upgrade from Pro to Elite?', a: 'Absolutely. You can upgrade or downgrade your plan at any time from the Billing dashboard.' },
  { q: 'Is my health data safe?', a: 'Yes. We never sell your data. All health data is encrypted at rest and in transit.' },
  { q: 'Will I be charged immediately?', a: 'Your first charge is immediate, and then on the same date each month. A 7-day trial will be available soon.' },
];

/* ── Feature check row ── */
const FeatureRow = ({ label, included, accent }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '0.6rem',
    padding: '0.4rem 0', fontSize: '0.8125rem',
    color: included ? 'var(--text-primary)' : 'var(--text-muted)',
    borderBottom: '1px solid var(--border-subtle)',
  }}>
    {included
      ? <Check size={14} color={accent} strokeWidth={2.5} style={{ flexShrink: 0 }} />
      : <X     size={13} color="var(--text-muted)" style={{ flexShrink: 0 }} />
    }
    {label}
  </div>
);

/* ══ Main Page ══════════════════════════════════════════ */
export default function Upgrade() {
  const navigate = useNavigate();
  const { plan, isPro, isElite, reloadPlan, loading } = usePlan();
  const [paying, setPaying] = useState(null); // 'pro' | 'elite'
  const [openFaq, setOpenFaq] = useState(null);
  const [error, setError] = useState('');

  const currentPlan = plan || 'free';

  const handleUpgrade = async (tierId) => {
    if (tierId === 'free') return;
    if ((tierId === 'pro' && isPro) || (tierId === 'elite' && isElite)) return;

    setError('');
    setPaying(tierId);

    try {
      const data = await createCheckoutSession(tierId);
      
      // Load Razorpay checkout script dynamically
      const rzpScript = document.getElementById('razorpay-checkout-js');
      if (!rzpScript) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.id = 'razorpay-checkout-js';
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      const tier = TIERS.find(t => t.id === tierId);
      
      const options = {
        key: data.keyId,
        name: 'Runli',
        description: `Runli ${tier.label} — ₹${tier.price}/month`,
        image: '/icon-192.png',
        theme: { color: tier.color },
        handler: async (response) => {
          try {
            await verifySubscriptionPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_subscription_id: response.razorpay_subscription_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              planTier: tierId
            });
            await reloadPlan();
            navigate('/billing');
          } catch (err) {
            console.error('Payment verification failed:', err);
            setError('Payment verification failed. Please contact support.');
          } finally {
            setPaying(null);
          }
        },
        modal: {
          ondismiss: () => setPaying(null),
        },
      };

      if (data.subscriptionId) {
        options.subscription_id = data.subscriptionId;
      } else if (data.orderId) {
        options.order_id = data.orderId;
        options.amount = tier.price * 100;
        options.currency = 'INR';
      }

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error('Checkout error:', err);
      setError('Failed to start checkout. Please try again.');
      setPaying(null);
    }
  };

  const handleTrial = async () => {
    setError('');
    setPaying('trial');
    try {
      await activateTrial();
      await reloadPlan();
      navigate('/billing');
    } catch (err) {
      console.error('Trial error:', err);
      setError('Failed to activate trial.');
    } finally {
      setPaying(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ minHeight: '100vh', padding: 'clamp(1rem, 4vw, 2rem)', paddingBottom: '6rem' }}
    >
      <div style={{ maxWidth: 960, margin: '0 auto' }}>

        {/* Back */}
        <button onClick={() => navigate(-1)} style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-secondary)', fontSize: '0.875rem',
          padding: '0 0 1.5rem', fontWeight: 600,
        }}>
          <ArrowLeft size={16} /> Back
        </button>

        {/* ── Hero ── */}
        <motion.div {...fadeUp} style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: 99, padding: '0.3rem 0.85rem', marginBottom: '1rem',
          }}>
            <Sparkles size={13} color="#f59e0b" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Choose Your Plan
            </span>
          </div>
          <h1 style={{ margin: '0 0 0.5rem', fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', fontWeight: 900, letterSpacing: '-0.04em' }}>
            Level Up Your Fitness
          </h1>
          <p style={{ margin: 0, fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 480, marginInline: 'auto' }}>
            From free tracking to a full AI-powered fitness OS — pick the plan that matches your ambition.
          </p>
        </motion.div>

        {/* ── Error banner ── */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--r-md)', padding: '0.75rem 1rem', marginBottom: '1rem', color: 'var(--error-500)', fontSize: '0.875rem', textAlign: 'center' }}>
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Trial Button ── */}
        {!isPro && !isElite && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <button
              onClick={handleTrial}
              disabled={paying === 'trial'}
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff',
                border: 'none',
                padding: '0.875rem 2rem',
                borderRadius: '99px',
                fontSize: '1rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(16,185,129,0.4)',
                opacity: paying === 'trial' ? 0.7 : 1,
              }}
            >
              {paying === 'trial' ? 'Activating...' : 'Start 90 Days Free Trial'}
            </button>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Unlocks all features. No credit card required.
            </div>
          </motion.div>
        )}

        {/* ── Pricing cards grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '3rem' }}>
          {TIERS.map((tier, i) => {
            const TierIcon = tier.icon;
            const isCurrentPlan = currentPlan === tier.id;
            const canUpgradeToThis = tier.id !== 'free' && !isCurrentPlan && !loading;
            const isLoadingThis = paying === tier.id;

            return (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] } }}
                style={{
                  position: 'relative',
                  background: tier.gradient,
                  border: `1.5px solid ${isCurrentPlan ? tier.color : tier.borderColor}`,
                  borderRadius: 'var(--r-xl)',
                  padding: '1.5rem',
                  display: 'flex', flexDirection: 'column',
                  boxShadow: isCurrentPlan ? `0 0 0 3px ${tier.color}22, 0 8px 32px ${tier.color}18` : 'none',
                  transition: 'box-shadow 300ms',
                }}
              >
                {/* Badge */}
                {tier.badge && (
                  <div style={{
                    position: 'absolute', top: '-0.75rem', left: '50%', transform: 'translateX(-50%)',
                    background: tier.id === 'pro' ? '#10b981' : 'linear-gradient(135deg,#f59e0b,#ef4444)',
                    color: '#fff', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.06em',
                    textTransform: 'uppercase', padding: '0.2rem 0.85rem', borderRadius: 99,
                    whiteSpace: 'nowrap',
                  }}>
                    {tier.badge}
                  </div>
                )}

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.875rem' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 'var(--r-md)',
                    background: tier.id === 'free' ? 'var(--bg-raised)' : `${tier.color}20`,
                    border: `1px solid ${tier.id === 'free' ? 'var(--border-subtle)' : `${tier.color}33`}`,
                    display: 'grid', placeItems: 'center',
                  }}>
                    <TierIcon size={20} color={tier.id === 'free' ? 'var(--text-muted)' : tier.color} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1.125rem', letterSpacing: '-0.02em' }}>
                      Runli {tier.label}
                    </div>
                    {isCurrentPlan && (
                      <span style={{
                        fontSize: '0.625rem', fontWeight: 700, color: tier.color,
                        background: `${tier.color}18`, padding: '0.1rem 0.45rem', borderRadius: 99,
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                      }}>
                        Current Plan
                      </span>
                    )}
                  </div>
                </div>

                {/* Price */}
                <div style={{ marginBottom: '1rem' }}>
                  {tier.price
                    ? (
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.2rem' }}>
                        <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 600, paddingBottom: '0.3rem' }}>₹</span>
                        <span style={{ fontSize: '2.5rem', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.04em', color: tier.color }}>
                          {tier.price}
                        </span>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', paddingBottom: '0.3rem' }}>/month</span>
                      </div>
                    )
                    : <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-muted)' }}>Free</div>
                  }
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.2rem', lineHeight: 1.4 }}>
                    {tier.tagline}
                  </div>
                </div>

                {/* CTA */}
                <button
                  onClick={() => handleUpgrade(tier.id)}
                  disabled={!canUpgradeToThis || isLoadingThis || tier.id === 'free'}
                  style={{
                    width: '100%', padding: '0.75rem', borderRadius: 'var(--r-lg)', border: 'none',
                    background: isCurrentPlan
                      ? 'var(--bg-raised)'
                      : tier.id === 'free'
                        ? 'var(--bg-raised)'
                        : tier.id === 'pro'
                          ? '#10b981'
                          : 'linear-gradient(135deg, #f59e0b, #ef4444)',
                    color: (isCurrentPlan || tier.id === 'free') ? 'var(--text-secondary)' : '#fff',
                    fontWeight: 700, fontSize: '0.9375rem', cursor: canUpgradeToThis ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                    boxShadow: canUpgradeToThis
                      ? tier.id === 'elite'
                        ? '0 4px 20px rgba(245,158,11,0.35)'
                        : tier.id === 'pro'
                          ? '0 4px 20px rgba(16,185,129,0.35)'
                          : 'none'
                      : 'none',
                    marginBottom: '1.25rem',
                    transition: 'all 200ms',
                    opacity: isLoadingThis ? 0.7 : 1,
                  }}
                >
                  {isLoadingThis ? (
                    <>
                      <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>⟳</motion.span>
                      Opening checkout…
                    </>
                  ) : isCurrentPlan ? (
                    '✓ Current Plan'
                  ) : tier.id === 'free' ? (
                    'Your current plan'
                  ) : (
                    <>
                      <tier.icon size={14} /> Upgrade to {tier.label}
                    </>
                  )}
                </button>

                {/* Feature list */}
                <div style={{ flex: 1 }}>
                  {tier.features.map(f => (
                    <FeatureRow key={f.label} {...f} accent={tier.color} />
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ── Usage Limits comparison ── */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.3 } }}
          className="card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart2 size={18} color="var(--primary-500)" />
            Monthly Usage Limits
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 400 }}>
              <thead>
                <tr>
                  {['Feature', 'Free', 'Pro', 'Elite'].map((h, i) => (
                    <th key={h} style={{
                      padding: '0.5rem 0.75rem', textAlign: i === 0 ? 'left' : 'center',
                      fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em',
                      color: i === 2 ? '#10b981' : i === 3 ? '#f59e0b' : 'var(--text-muted)', fontWeight: 700,
                      borderBottom: '1px solid var(--border-subtle)',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: '🎙️ Voice Minutes', free: '0', pro: '30', elite: '120' },
                  { feature: '🤖 AI Requests', free: '10', pro: '50', elite: '500' },
                  { feature: '🏋️ Pose Analyses', free: '0', pro: '10', elite: 'Unlimited' },
                  { feature: '🥗 Nutrition Scans', free: '0', pro: '15', elite: '100' },
                ].map(row => (
                  <tr key={row.feature} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '0.65rem 0.75rem', fontSize: '0.8125rem' }}>{row.feature}</td>
                    <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{row.free}</td>
                    <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center', fontSize: '0.8125rem', color: '#10b981', fontWeight: 600 }}>{row.pro}</td>
                    <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center', fontSize: '0.8125rem', color: '#f59e0b', fontWeight: 600 }}>{row.elite}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* ── Trust badges ── */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
          {[
            { icon: '🔒', label: 'Encrypted & Private' },
            { icon: '↩️', label: 'Cancel Anytime' },
            { icon: '⚡', label: 'Instant Unlock' },
            { icon: '🇮🇳', label: 'Razorpay Secured' },
          ].map(b => (
            <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              <span>{b.icon}</span>{b.label}
            </div>
          ))}
        </div>

        {/* ── FAQ ── */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.35 } }}
          className="card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ margin: '0 0 0.875rem', fontSize: '1.0625rem', fontWeight: 700 }}>FAQs</h2>
          {FAQS.map((faq, i) => (
            <div key={i} style={{ borderTop: i > 0 ? '1px solid var(--border-subtle)' : 'none' }}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{
                  width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.875rem 0', textAlign: 'left', color: 'var(--text-primary)',
                  fontWeight: 600, fontSize: '0.875rem', gap: '0.5rem',
                }}
              >
                {faq.q}
                {openFaq === i ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              <AnimatePresence>
                {openFaq === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.7, paddingBottom: '0.875rem' }}>
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </motion.div>

        {/* ── Billing dashboard link ── */}
        {(isPro || isElite) && (
          <div style={{ textAlign: 'center' }}>
            <button onClick={() => navigate('/billing')} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: 600,
              textDecoration: 'underline',
            }}>
              Manage billing & usage →
            </button>
          </div>
        )}

      </div>
    </motion.div>
  );
}
