/**
 * PoseCamera.jsx
 * ─────────────────────────────────────────────────────────
 * Full-screen pose detection modal.
 *
 * Props:
 *   exerciseName  string          — e.g. "Barbell Squat"
 *   onClose       (result) => void — called with { reps, overallScore }
 *
 * Internally runs the mock pose engine frame-by-frame,
 * draws a skeleton overlay on a <canvas>, and shows
 * live form feedback chips.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Camera, Play, Pause, RotateCcw,
  CheckCircle2, AlertTriangle, XCircle, Zap,
} from 'lucide-react';
import { createPoseDetector, SKELETON_CONNECTIONS } from '../utils/poseEngine.js';
import { createFormAnalyzer } from '../utils/formAnalyzer.js';

/* ─────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────── */
const JOINT_COLORS = { good: '#10b981', warn: '#f59e0b', error: '#ef4444' };
const DEFAULT_JOINT = 'rgba(255,255,255,0.7)';
const BONE_COLOR    = 'rgba(16,185,129,0.55)';

/* ─────────────────────────────────────────────────────────
   DRAW SKELETON on canvas
───────────────────────────────────────────────────────── */
function drawPose(ctx, keypoints, issues, w, h) {
  if (!keypoints?.length) return;

  // Map index → coords
  const kpMap = {};
  for (const kp of keypoints) {
    if (kp.score > 0.3) kpMap[kp.index] = { x: kp.x * w, y: kp.y * h };
  }

  // Build joint → severity map from feedback
  const jointSeverity = {};
  for (const issue of (issues || [])) {
    jointSeverity[issue.joint] = issue.severity;
  }

  // Draw skeleton connections
  ctx.lineWidth = 3;
  ctx.strokeStyle = BONE_COLOR;
  for (const [a, b] of SKELETON_CONNECTIONS) {
    if (kpMap[a] && kpMap[b]) {
      ctx.beginPath();
      ctx.moveTo(kpMap[a].x, kpMap[a].y);
      ctx.lineTo(kpMap[b].x, kpMap[b].y);
      ctx.stroke();
    }
  }

  // Draw joints
  for (const [idx, pos] of Object.entries(kpMap)) {
    const kp = keypoints.find(k => k.index === Number(idx));
    const sev = kp ? jointSeverity[kp.name] : null;
    const color = sev ? JOINT_COLORS[sev] : DEFAULT_JOINT;

    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 6, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();

    // Glow for flagged joints
    if (sev && sev !== 'good') {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 11, 0, 2 * Math.PI);
      ctx.strokeStyle = color + '80';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
}

/* ─────────────────────────────────────────────────────────
   SEVERITY ICON
───────────────────────────────────────────────────────── */
function SevIcon({ sev }) {
  if (sev === 'good')  return <CheckCircle2 size={13} color={JOINT_COLORS.good} />;
  if (sev === 'warn')  return <AlertTriangle size={13} color={JOINT_COLORS.warn} />;
  return <XCircle size={13} color={JOINT_COLORS.error} />;
}

/* ─────────────────────────────────────────────────────────
   SCORE RING
───────────────────────────────────────────────────────── */
function ScoreRing({ score }) {
  const r = 28, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 80 ? JOINT_COLORS.good : score >= 60 ? JOINT_COLORS.warn : JOINT_COLORS.error;
  return (
    <svg width={70} height={70} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={35} cy={35} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={6} />
      <circle cx={35} cy={35} r={r} fill="none" stroke={color} strokeWidth={6}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.4s ease' }} />
      <text x={35} y={40} textAnchor="middle" fill="white" fontSize={14} fontWeight={700}
        style={{ transform: 'rotate(90deg)', transformOrigin: '35px 35px' }}>
        {score}
      </text>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────── */
export default function PoseCamera({ exerciseName, onClose }) {
  const canvasRef  = useRef(null);
  const videoRef   = useRef(null);
  const rafRef     = useRef(null);
  const detectorRef = useRef(null);
  const analyzerRef = useRef(null);

  const [phase,    setPhase]    = useState('permission'); // permission|loading|active|paused|error
  const [feedback, setFeedback] = useState(null);       // FormFeedback
  const [paused,   setPaused]   = useState(false);
  const [stream,   setStream]   = useState(null);
  const [elapsed,  setElapsed]  = useState(0);
  const elapsedRef = useRef(0);
  const timerRef   = useRef(null);

  /* ── start camera & model ── */
  const startCamera = useCallback(async () => {
    setPhase('loading');
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        await videoRef.current.play();
      }
      // Simulate model load (1.2s)
      await new Promise(r => setTimeout(r, 1200));
      detectorRef.current = createPoseDetector(exerciseName);
      analyzerRef.current = createFormAnalyzer(exerciseName);
      setPhase('active');
      startTimer();
    } catch {
      // Camera not available — run in mock-only mode
      detectorRef.current = createPoseDetector(exerciseName);
      analyzerRef.current = createFormAnalyzer(exerciseName);
      setPhase('active');
      startTimer();
    }
  }, [exerciseName]);

  /* ── timer ── */
  const startTimer = () => {
    timerRef.current = setInterval(() => {
      elapsedRef.current += 1;
      setElapsed(e => e + 1);
    }, 1000);
  };

  /* ── render loop ── */
  useEffect(() => {
    if (phase !== 'active') return;

    const loop = () => {
      if (paused) return;
      const canvas  = canvasRef.current;
      const detector = detectorRef.current;
      const analyzer = analyzerRef.current;
      if (!canvas || !detector || !analyzer) return;

      const ctx = canvas.getContext('2d');
      const W = canvas.width  = canvas.offsetWidth;
      const H = canvas.height = canvas.offsetHeight;
      ctx.clearRect(0, 0, W, H);

      // If real camera: draw video frame
      if (videoRef.current?.readyState >= 2) {
        ctx.save();
        ctx.scale(-1, 1); // mirror
        ctx.drawImage(videoRef.current, -W, 0, W, H);
        ctx.restore();
      } else {
        // No camera — draw a dark bg
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        ctx.fillRect(0, 0, W, H);
      }

      // Pose + analysis
      const frame = detector.getFrame();
      if (frame) {
        const fb = analyzer.analyze(frame);
        if (fb) setFeedback(fb);
        drawPose(ctx, frame.keypoints, fb?.issues || [], W, H);
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [phase, paused]);

  /* ── cleanup ── */
  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      clearInterval(timerRef.current);
      stream?.getTracks().forEach(t => t.stop());
      detectorRef.current?.destroy();
    };
  }, [stream]);

  /* ── pause toggle ── */
  const togglePause = () => setPaused(p => {
    if (!p) clearInterval(timerRef.current);
    else startTimer();
    return !p;
  });

  /* ── done ── */
  const handleDone = () => {
    clearInterval(timerRef.current);
    stream?.getTracks().forEach(t => t.stop());
    detectorRef.current?.destroy();
    onClose?.({
      reps:         feedback?.reps || 0,
      overallScore: feedback?.overallScore || 0,
    });
  };

  /* ── reset ── */
  const handleReset = () => {
    analyzerRef.current?.reset();
    setFeedback(null);
    elapsedRef.current = 0;
    setElapsed(0);
  };

  const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  /* ─────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────── */
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: '#000',
        display: 'flex', flexDirection: 'column',
        fontFamily: 'inherit',
      }}
    >
      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.75rem 1rem',
        background: 'rgba(0,0,0,0.7)',
        borderBottom: '1px solid rgba(16,185,129,0.2)',
        zIndex: 10, flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: phase === 'active' && !paused ? '#10b981' : '#ef4444',
            boxShadow: phase === 'active' && !paused ? '0 0 8px #10b981' : 'none',
            animation: phase === 'active' && !paused ? 'pulse 1.5s infinite' : 'none',
          }} />
          <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{exerciseName}</span>
          <span style={{ color: 'var(--text-muted, #737373)', fontSize: '0.75rem' }}>Form Analysis</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {phase === 'active' && (
            <>
              <span style={{ fontSize: '0.8125rem', color: '#10b981', fontFamily: 'monospace', fontWeight: 700 }}>
                {fmt(elapsed)}
              </span>
              <button onClick={togglePause} style={btnStyle('#1f2937')}>
                {paused ? <Play size={14} /> : <Pause size={14} />}
              </button>
              <button onClick={handleReset} style={btnStyle('#1f2937')}>
                <RotateCcw size={14} />
              </button>
            </>
          )}
          <button onClick={handleDone} style={btnStyle('#1f2937')}>
            <X size={16} />
          </button>
        </div>
      </div>

      {/* ── Camera / Canvas Area ── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* Hidden video for camera input */}
        <video ref={videoRef} muted playsInline
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0 }} />

        {/* Canvas (skeleton overlay) */}
        <canvas ref={canvasRef}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />

        {/* Permission screen */}
        {phase === 'permission' && (
          <CenteredCard>
            <Camera size={48} color="#10b981" style={{ marginBottom: '1rem' }} />
            <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>Allow Camera Access</div>
            <div style={{ fontSize: '0.8125rem', color: '#737373', textAlign: 'center', maxWidth: 260, marginBottom: '1.5rem' }}>
              Your camera feed stays on-device. Nothing is uploaded.
            </div>
            <button onClick={startCamera} style={primaryBtn}>
              <Camera size={15} /> Enable Camera
            </button>
          </CenteredCard>
        )}

        {/* Loading screen */}
        {phase === 'loading' && (
          <CenteredCard>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
              style={{ marginBottom: '1rem' }}>
              <Zap size={36} color="#10b981" fill="#10b981" />
            </motion.div>
            <div style={{ fontWeight: 600 }}>Loading pose model…</div>
            <div style={{ fontSize: '0.75rem', color: '#737373', marginTop: '0.4rem' }}>First load ~1.2s</div>
          </CenteredCard>
        )}

        {/* Paused overlay */}
        {phase === 'active' && paused && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.65)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>⏸ Paused</div>
              <button onClick={togglePause} style={primaryBtn}><Play size={15} /> Resume</button>
            </div>
          </div>
        )}

        {/* Rep counter overlay (top-left on canvas) */}
        {phase === 'active' && feedback && (
          <div style={{
            position: 'absolute', top: 12, left: 12,
            background: 'rgba(0,0,0,0.75)',
            border: '1px solid rgba(16,185,129,0.35)',
            borderRadius: 12, padding: '0.5rem 0.9rem',
            display: 'flex', alignItems: 'center', gap: '0.6rem',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#10b981', lineHeight: 1 }}>
                {feedback.reps}
              </div>
              <div style={{ fontSize: '0.6rem', color: '#737373', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                REPS
              </div>
            </div>
            <div style={{
              fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
              color: feedback.phase === 'down' ? '#f59e0b' : '#10b981',
              background: feedback.phase === 'down' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
              padding: '0.2rem 0.5rem', borderRadius: 6,
            }}>
              {feedback.phase}
            </div>
          </div>
        )}

        {/* Score ring (top-right) */}
        {phase === 'active' && feedback && (
          <div style={{ position: 'absolute', top: 12, right: 12 }}>
            <ScoreRing score={feedback.overallScore} />
          </div>
        )}
      </div>

      {/* ── Feedback Panel (bottom) ── */}
      <AnimatePresence>
        {phase === 'active' && feedback?.issues?.length > 0 && (
          <motion.div
            initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
            transition={{ type: 'spring', damping: 24, stiffness: 220 }}
            style={{
              background: 'rgba(10,10,10,0.95)',
              borderTop: '1px solid rgba(16,185,129,0.2)',
              padding: '0.9rem 1rem 0.75rem',
              flexShrink: 0,
              maxHeight: '38vh',
              overflowY: 'auto',
            }}
          >
            {/* Issues */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginBottom: '0.9rem' }}>
              {feedback.issues.map((issue, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '0.3rem',
                  padding: '0.3rem 0.65rem', borderRadius: 20,
                  background: `color-mix(in srgb, ${JOINT_COLORS[issue.severity]} 12%, #111)`,
                  border: `1px solid color-mix(in srgb, ${JOINT_COLORS[issue.severity]} 28%, transparent)`,
                  fontSize: '0.75rem', fontWeight: 600,
                  color: JOINT_COLORS[issue.severity],
                }}>
                  <SevIcon sev={issue.severity} />
                  {issue.message}
                </div>
              ))}
            </div>

            {/* Done button */}
            <button
              onClick={handleDone}
              style={{
                ...primaryBtn,
                width: '100%',
                justifyContent: 'center',
                fontSize: '0.9375rem',
                padding: '0.7rem',
              }}
            >
              <CheckCircle2 size={16} />
              Done — Log {feedback.reps} rep{feedback.reps !== 1 ? 's' : ''}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Permission-phase show Done anyway */}
      {phase === 'permission' && (
        <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={handleDone} style={{ ...secondaryBtn, width: '100%', justifyContent: 'center' }}>
            Skip &amp; close
          </button>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1 }
          50%       { opacity: 0.4 }
        }
      `}</style>
    </motion.div>
  );
}

/* ── Shared micro-styles ── */
function CenteredCard({ children }) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '2rem',
    }}>
      {children}
    </div>
  );
}

const btnStyle = (bg) => ({
  background: bg, border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, padding: '0.4rem 0.6rem',
  color: 'white', cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: '0.3rem',
  fontSize: '0.8125rem', fontWeight: 600,
  transition: 'all 0.15s',
});

const primaryBtn = {
  background: 'linear-gradient(135deg, #10b981, #059669)',
  border: 'none', borderRadius: 10,
  padding: '0.55rem 1.25rem',
  color: 'white', cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: '0.45rem',
  fontSize: '0.875rem', fontWeight: 700,
};

const secondaryBtn = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10, padding: '0.55rem 1.25rem',
  color: 'white', cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: '0.45rem',
  fontSize: '0.875rem', fontWeight: 600,
};
