/**
 * BottomNav.jsx — Mobile navigation bar with animated active indicator
 * Uses the centralized motion system for the active tab pill.
 */
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, TrendingUp, ClipboardList, Dumbbell, UserCircle2, Salad } from 'lucide-react';
import { motion } from 'framer-motion';
import { spring } from '../../utils/motion.js';
import QuickActionFAB from './QuickActionFAB';

const HIDDEN_ON = [
  '/', '/login', '/signup', '/forgot-password',
  '/userinfo', '/auth/callback', '/onboarding'
];

const NAV_ITEMS = [
  { to: '/today',    label: 'Today',    Icon: Home },
  { to: '/progress', label: 'Progress', Icon: TrendingUp },
  { to: '/plan',     label: 'Plan',     Icon: ClipboardList },
  { to: '/gym',      label: 'Gym',      Icon: Dumbbell },
  { to: '/profile',  label: 'Profile',  Icon: UserCircle2 },
];

const BottomNav = () => {
  const { pathname } = useLocation();
  if (HIDDEN_ON.includes(pathname)) return null;

  return (
    <nav
      className="bottom-nav"
      role="navigation"
      aria-label="Main navigation"
      style={{ position: 'relative' }}
    >
      <QuickActionFAB />

      {NAV_ITEMS.map(({ to, label, Icon }, idx) => (
        <React.Fragment key={to}>
          {/* Space for center FAB replaced with Diet NavLink */}
          {idx === 2 && (
            <NavLink
              to="/diet-plan"
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              aria-label="Diet"
              style={{ width: 56, flexShrink: 0, position: 'relative', textDecoration: 'none' }}
            >
              {({ isActive }) => (
                <>
                  {/* Animated active background pill */}
                  {isActive && (
                    <motion.span
                      layoutId="bottom-nav-pill"
                      transition={spring.snappy}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: 'var(--r-lg)',
                        background: 'var(--primary-dim)',
                        zIndex: 0,
                      }}
                    />
                  )}
                  <motion.span
                    className="nav-icon"
                    aria-hidden="true"
                    animate={isActive
                      ? { scale: 1.15, y: -2, rotate: [-5, 5, 0] }
                      : { scale: 1, y: 0, rotate: 0 }
                    }
                    transition={{ ...spring.snappy, duration: 0.3 }}
                    style={{ position: 'relative', zIndex: 1 }}
                  >
                    <Salad
                      size={20}
                      strokeWidth={isActive ? 2.5 : 1.75}
                    />
                  </motion.span>
                  <motion.span
                    animate={isActive
                      ? { color: 'var(--primary-400)', fontWeight: 700, opacity: 1 }
                      : { color: 'var(--text-muted)', fontWeight: 400, opacity: 0.8 }
                    }
                    transition={{ duration: 0.2 }}
                    style={{ position: 'relative', zIndex: 1, fontSize: '0.625rem', letterSpacing: '0.02em', marginTop: '2px', textTransform: 'uppercase' }}
                  >
                    Diet
                  </motion.span>
                </>
              )}
            </NavLink>
          )}

          <NavLink
            to={to}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            aria-label={label}
            style={{ position: 'relative' }}
          >
            {({ isActive }) => (
              <>
                {/* Animated active background pill */}
                {isActive && (
                  <motion.span
                    layoutId="bottom-nav-pill"
                    transition={spring.snappy}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: 'var(--r-lg)',
                      background: 'var(--primary-dim)',
                      zIndex: 0,
                    }}
                  />
                )}

                {/* Icon — bounces in when newly active */}
                <motion.span
                  className="nav-icon"
                  aria-hidden="true"
                  animate={isActive
                    ? { scale: 1.15, y: -2, rotate: [-5, 5, 0] }
                    : { scale: 1, y: 0, rotate: 0 }
                  }
                  transition={{ ...spring.snappy, duration: 0.3 }}
                  style={{ position: 'relative', zIndex: 1 }}
                >
                  <Icon
                    size={20}
                    strokeWidth={isActive ? 2.5 : 1.75}
                  />
                </motion.span>

                {/* Label */}
                <motion.span
                  animate={isActive
                    ? { color: 'var(--primary-400)', fontWeight: 700, opacity: 1 }
                    : { color: 'var(--text-muted)', fontWeight: 400, opacity: 0.8 }
                  }
                  transition={{ duration: 0.2 }}
                  style={{ position: 'relative', zIndex: 1, fontSize: '0.625rem', letterSpacing: '0.02em', marginTop: '2px' }}
                >
                  {label}
                </motion.span>
              </>
            )}
          </NavLink>
        </React.Fragment>
      ))}
    </nav>
  );
};

export default BottomNav;
