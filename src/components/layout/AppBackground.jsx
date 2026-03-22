import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const THEMES = {
  default: { c1: 'rgba(34,197,94,0.12)',  c2: 'rgba(59,130,246,0.1)',   c3: 'rgba(139,92,246,0.08)' }, // Today, Dashboard, Generic
  plan:    { c1: 'rgba(239,68,68,0.15)',  c2: 'rgba(245,158,11,0.12)',  c3: 'rgba(239,68,68,0.08)' }, // Workouts
  eat:     { c1: 'rgba(74,222,128,0.15)', c2: 'rgba(250,204,21,0.1)',   c3: 'rgba(34,197,94,0.1)' }, // Diet
  wellness:{ c1: 'rgba(168,85,247,0.15)', c2: 'rgba(96,165,250,0.12)',  c3: 'rgba(192,132,252,0.1)' }, // Me / Wellness
  shopping:{ c1: 'rgba(6,182,212,0.15)',  c2: 'rgba(147,51,234,0.12)',  c3: 'rgba(56,189,248,0.1)' }, // Shop
  gym:     { c1: 'rgba(220,38,38,0.15)',  c2: 'rgba(60,60,60,0.1)',     c3: 'rgba(185,28,28,0.1)' }, // Gym
};

/**
 * AppBackground — Fixed mesh blob layer with smooth transition between colors 
 * according to current route. Extremely lightweight via `translate3d` and radial gradients.
 */
export default function AppBackground() {
  const location = useLocation();
  const path = location.pathname.toLowerCase();
  
  let key = 'default';
  if (path.includes('plan')) key = 'plan';
  else if (path.includes('eat')) key = 'eat';
  else if (path.includes('wellness') || path.includes('profile') || path.includes('me')) key = 'wellness';
  else if (path.includes('shopping')) key = 'shopping';
  else if (path.includes('gym')) key = 'gym';

  const theme = THEMES[key] || THEMES.default;

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        pointerEvents: 'none',
        backgroundColor: 'var(--bg-base)',
        overflow: 'hidden',
      }}
    >
      {/* Blob 1 — Top Left */}
      <div
        style={{
          position: 'absolute',
          width: '65vw',
          height: '65vh',
          top: '-15%',
          left: '-15%',
          background: `radial-gradient(ellipse at center, ${theme.c1} 0%, transparent 65%)`,
          animation: 'blobDrift1 22s ease-in-out infinite alternate',
          willChange: 'transform',
          transition: 'background 1.5s ease-in-out',
        }}
      />
      {/* Blob 2 — Bottom Right */}
      <div
        style={{
          position: 'absolute',
          width: '55vw',
          height: '60vh',
          bottom: '-10%',
          right: '-10%',
          background: `radial-gradient(ellipse at center, ${theme.c2} 0%, transparent 62%)`,
          animation: 'blobDrift2 28s ease-in-out infinite alternate-reverse',
          willChange: 'transform',
          transition: 'background 1.5s ease-in-out',
        }}
      />
      {/* Blob 3 — Mid Right */}
      <div
        style={{
          position: 'absolute',
          width: '40vw',
          height: '45vh',
          top: '35%',
          right: '10%',
          background: `radial-gradient(ellipse at center, ${theme.c3} 0%, transparent 58%)`,
          animation: 'blobDrift3 32s ease-in-out infinite alternate',
          willChange: 'transform',
          transition: 'background 1.5s ease-in-out',
        }}
      />
      {/* Noise texture overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          opacity: 0.025,
          mixBlendMode: 'overlay',
        }}
      />
    </div>
  );
}
