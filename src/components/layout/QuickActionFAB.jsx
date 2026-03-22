import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus, Salad, Dumbbell, Moon, Scale, X } from 'lucide-react';

export default function QuickActionFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const toggle = () => setIsOpen(!isOpen);

  const actions = [
    { id: 'meal', icon: Salad, label: 'Log Meal', color: 'var(--amber-500)', path: '/eat' },
    { id: 'workout', icon: Dumbbell, label: 'Workout', color: 'var(--primary-500)', path: '/gym' },
    { id: 'sleep', icon: Moon, label: 'Sleep', color: 'var(--blue-500)', path: '/wellness' },
    { id: 'weight', icon: Scale, label: 'Weight', color: 'var(--purple-500)', path: '/progress' },
  ];

  const handleAction = (path) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <div style={{ position: 'fixed', bottom: 84, left: '50%', transform: 'translateX(-50%)', zIndex: 100 }}>
      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(5, 5, 5, 0.6)',
              backdropFilter: 'blur(4px)',
              zIndex: -1,
            }}
          />
        )}
      </AnimatePresence>

      {/* Expanded Actions */}
      <AnimatePresence>
        {isOpen && (
          <div style={{ position: 'absolute', bottom: 64, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center' }}>
            {actions.map((action, i) => (
              <motion.button
                key={action.id}
                initial={{ opacity: 0, y: 15, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                whileHover={{ scale: 1.03, backgroundColor: 'var(--bg-overlay)' }}
                whileTap={{ scale: 0.94 }}
                exit={{ opacity: 0, y: 10, scale: 0.8, transition: { duration: 0.15, delay: (actions.length - 1 - i) * 0.04 } }}
                transition={{ type: 'spring', stiffness: 400, damping: 25, delay: i * 0.05 }}
                onClick={() => handleAction(action.path)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.625rem 1rem 0.625rem 0.75rem',
                  borderRadius: 'var(--r-full)',
                  background: 'var(--bg-raised)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem', fontWeight: 600,
                  boxShadow: 'var(--shadow-lg)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${action.color}20`, display: 'grid', placeItems: 'center' }}>
                  <action.icon size={14} color={action.color} />
                </div>
                {action.label}
              </motion.button>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Main Button */}
      <motion.button
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.88 }}
        onClick={toggle}
        style={{
          width: 56, height: 56,
          borderRadius: '50%',
          background: isOpen ? 'var(--bg-raised)' : 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
          border: isOpen ? '1px solid var(--border-strong)' : 'none',
          color: isOpen ? 'var(--text-primary)' : '#000',
          display: 'grid', placeItems: 'center',
          cursor: 'pointer',
          boxShadow: isOpen ? 'var(--shadow-md)' : '0 8px 32px rgba(34, 197, 94, 0.4)',
          position: 'relative',
          transition: 'background 200ms, border 200ms',
        }}
        animate={{ rotate: isOpen ? 135 : 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        <Plus size={24} strokeWidth={2.5} style={{ display: isOpen ? 'none' : 'block' }} />
        <X size={24} strokeWidth={2.5} color="var(--text-primary)" style={{ display: isOpen ? 'block' : 'none', transform: 'rotate(-135deg)' }} />
      </motion.button>
    </div>
  );
}
