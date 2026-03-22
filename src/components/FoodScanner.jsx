/**
 * FoodScanner.jsx
 * ─────────────────────────────────────────────────────────
 * Upload a food photo → AI detects dish → shows macros → log to food diary.
 *
 * States: idle → analyzing → results (or error)
 * Falls back to client-side foodVisionEngine if backend is offline.
 */

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, Upload, Zap, X, CheckCircle2,
  Flame, Beef, Wheat, Droplets, ChevronDown, RotateCcw, ScanLine,
} from 'lucide-react';
import { analyzeFood, logFood } from '../services/api.js';
import { validateImageFile } from '../utils/foodVisionEngine.js';
import { Capacitor } from '@capacitor/core';
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera';

/* ── helpers ── */
const MEALS = ['Breakfast', 'Brunch', 'Lunch', 'Dinner', 'Snacks'];

const ConfBar = ({ value, color }) => (
  <div style={{ flex: 1, height: 4, borderRadius: 4, background: 'var(--bg-raised)', overflow: 'hidden' }}>
    <motion.div
      initial={{ width: 0 }}
      animate={{ width: `${Math.round(value * 100)}%` }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      style={{ height: '100%', background: color, borderRadius: 4 }}
    />
  </div>
);

/* ── shimmer placeholder ── */
const Shimmer = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', padding: '0.5rem 0' }}>
    {[80, 60, 90].map((w, i) => (
      <div key={i} style={{
        height: 14, width: `${w}%`, borderRadius: 8,
        background: 'linear-gradient(90deg, var(--bg-raised) 25%, var(--bg-surface) 50%, var(--bg-raised) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.4s infinite',
      }} />
    ))}
  </div>
);

/* ── macro pill ── */
const MacroPill = ({ icon: Icon, label, value, color }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '0.35rem',
    background: `color-mix(in srgb, ${color} 10%, var(--bg-raised))`,
    border: `1px solid color-mix(in srgb, ${color} 25%, transparent)`,
    padding: '0.3rem 0.6rem', borderRadius: 'var(--r-md)',
    fontSize: '0.6875rem', fontWeight: 600, color, whiteSpace: 'nowrap',
  }}>
    <Icon size={11} />
    <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{label}:</span>
    <span>{value}</span>
  </div>
);

/* ═══════════════════════════════════════════════════════
   FOOD SCANNER
═══════════════════════════════════════════════════════ */
export default function FoodScanner({ onFoodLogged }) {
  const [open,      setOpen]      = useState(false);
  const [phase,     setPhase]     = useState('idle');   // idle | analyzing | results | error
  const [preview,   setPreview]   = useState(null);     // object URL
  const [file,      setFile]      = useState(null);
  const [result,    setResult]    = useState(null);
  const [error,     setError]     = useState('');
  const [dragging,  setDragging]  = useState(false);
  const [meal,      setMeal]      = useState('Lunch');
  const [logged,    setLogged]    = useState(false);
  const [logging,   setLogging]   = useState(false);

  const inputRef = useRef();

  /* ── cleanup ── */
  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null); setFile(null); setResult(null);
    setError(''); setPhase('idle'); setLogged(false); setLogging(false);
  };

  /* ── image ingestion ── */
  const handleFile = useCallback(async (f) => {
    const v = validateImageFile(f);
    if (!v.valid) { setError(v.error); setPhase('error'); return; }

    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(f));
    setFile(f);
    setLogged(false);
    setPhase('analyzing');

    try {
      const res = await analyzeFood(f);
      setResult(res);
      setPhase('results');
    } catch (err) {
      setError(err.message || 'Analysis failed. Please try again.');
      setPhase('error');
    }
  }, [preview]);

  /* ── drag-and-drop ── */
  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  /* ── log meal ── */
  const handleLog = async (food) => {
    setLogging(true);
    try {
      let mealType = meal.toLowerCase();
      if (mealType === 'snacks') mealType = 'snack';
      await logFood(new Date(), {
        name: food.name,
        quantity: food.servingSize || '1 serving',
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fats: food.fats,
        mealType,
      });
      setLogged(true);
      onFoodLogged?.({ ...food, mealType: meal });
    } catch {
      // Silently allow — user might not be logged in
      setLogged(true);
    } finally {
      setLogging(false);
    }
  };

  /* ── native camera ── */
  const handleNativeCamera = async (e) => {
    e.stopPropagation();
    if (Capacitor.isNativePlatform()) {
      try {
        const photo = await CapCamera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.Uri,
          source: CameraSource.Camera
        });
        
        // Convert to File object for existing pipeline
        const response = await fetch(photo.webPath);
        const blob = await response.blob();
        const f = new File([blob], `scanned_food_${Date.now()}.jpg`, { type: 'image/jpeg' });
        handleFile(f);
      } catch (err) {
        if (err.message !== 'User cancelled photos app') {
          setError('Camera failed. Please try again.');
          setPhase('error');
        }
      }
    } else {
      // Trigger Web fallback
      const hiddenInput = e.currentTarget.querySelector('input[type="file"]');
      if (hiddenInput) hiddenInput.click();
    }
  };

  /* ── confidence color ── */
  const confColor = (c) => c >= 0.7 ? 'var(--primary-500)' : c >= 0.5 ? 'var(--amber-500)' : 'var(--text-muted)';
  const confLabel = (c) => c >= 0.7 ? 'High' : c >= 0.5 ? 'Medium' : 'Low';

  return (
    <div style={{ marginBottom: '1rem' }}>
      {/* Shimmer keyframe (injected once) */}
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>

      {/* ── Toggle Header ── */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.75rem 1rem', borderRadius: open ? 'var(--r-xl) var(--r-xl) 0 0' : 'var(--r-xl)',
          background: open
            ? 'linear-gradient(135deg, color-mix(in srgb,var(--primary-500) 15%,var(--bg-surface)), var(--bg-surface))'
            : 'var(--bg-surface)',
          border: '1px solid color-mix(in srgb, var(--primary-500) 22%, var(--border-subtle))',
          borderBottom: open ? '1px solid transparent' : undefined,
          cursor: 'pointer', transition: 'all 0.25s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 'var(--r-md)',
            background: 'color-mix(in srgb, var(--primary-500) 15%, transparent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ScanLine size={16} color="var(--primary-500)" />
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>Scan Your Food</div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Upload a photo to detect calories</div>
          </div>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} color="var(--text-muted)" />
        </motion.div>
      </button>

      {/* ── Collapsible Panel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              padding: '1.25rem',
              background: 'var(--bg-surface)',
              border: '1px solid color-mix(in srgb, var(--primary-500) 22%, var(--border-subtle))',
              borderTop: 'none',
              borderRadius: '0 0 var(--r-xl) var(--r-xl)',
              display: 'flex', flexDirection: 'column', gap: '1rem',
            }}>

              {/* ── IDLE: Drop Zone ── */}
              {phase === 'idle' && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  onDragOver={e => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  onClick={() => inputRef.current?.click()}
                  style={{
                    border: `2px dashed ${dragging ? 'var(--primary-500)' : 'color-mix(in srgb, var(--primary-500) 35%, var(--border-subtle))'}`,
                    borderRadius: 'var(--r-xl)',
                    padding: '2.5rem 1rem',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: dragging ? 'color-mix(in srgb, var(--primary-500) 5%, transparent)' : 'transparent',
                  }}
                >
                  <motion.div
                    animate={dragging ? { scale: 1.2 } : { scale: 1 }}
                    style={{
                      width: 56, height: 56, borderRadius: 'var(--r-xl)',
                      background: 'color-mix(in srgb, var(--primary-500) 12%, transparent)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Upload size={24} color="var(--primary-500)" />
                  </motion.div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: '0.2rem' }}>
                      Drop a food photo here
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      JPG, PNG, WebP · max 10 MB
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}
                      className="btn btn-primary"
                      style={{ padding: '0.45rem 1.1rem', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <Upload size={13} /> Browse
                    </button>
                    <button
                      type="button"
                      onClick={handleNativeCamera}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.35rem',
                        padding: '0.45rem 1.1rem', borderRadius: 'var(--r-lg)',
                        background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)',
                        fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <Camera size={13} color="var(--text-secondary)" /> Camera
                      {!Capacitor.isNativePlatform() && (
                        <input
                          type="file" accept="image/*" capture="environment"
                          style={{ display: 'none' }}
                          onChange={e => e.target.files[0] && handleFile(e.target.files[0])}
                          onClick={e => e.stopPropagation()} // Prevent double trigger
                        />
                      )}
                    </button>
                  </div>
                  <input
                    ref={inputRef} type="file" accept="image/*"
                    style={{ display: 'none' }}
                    onChange={e => e.target.files[0] && handleFile(e.target.files[0])}
                  />
                </motion.div>
              )}

              {/* ── ANALYZING: Shimmer ── */}
              {phase === 'analyzing' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', gap: '1rem' }}>
                  {/* Thumbnail */}
                  {preview && (
                    <div style={{ flexShrink: 0, width: 90, height: 90, borderRadius: 'var(--r-lg)', overflow: 'hidden', border: '1px solid var(--border-subtle)', filter: 'blur(2px)', opacity: 0.7 }}>
                      <img src={preview} alt="Analyzing" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}>
                        <Zap size={15} color="var(--primary-500)" fill="var(--primary-500)" />
                      </motion.div>
                      <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Analyzing your food…</span>
                    </div>
                    <Shimmer />
                  </div>
                </motion.div>
              )}

              {/* ── RESULTS ── */}
              {phase === 'results' && result && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                  {/* Image + food cards row */}
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {/* Thumbnail */}
                    {preview && (
                      <div style={{ flexShrink: 0, width: 100, height: 100, borderRadius: 'var(--r-lg)', overflow: 'hidden', border: '2px solid var(--primary-500)', boxShadow: '0 0 16px color-mix(in srgb,var(--primary-500) 25%,transparent)' }}>
                        <img src={preview} alt="Scanned food" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}

                    {/* Detection cards */}
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      {result.foods.map((food, i) => (
                        <div key={i} style={{
                          padding: '0.75rem', borderRadius: 'var(--r-lg)',
                          background: i === 0 ? 'linear-gradient(135deg, color-mix(in srgb,var(--primary-500) 8%,var(--bg-raised)), var(--bg-raised))' : 'var(--bg-raised)',
                          border: `1px solid ${i === 0 ? 'color-mix(in srgb,var(--primary-500) 22%,var(--border-subtle))' : 'var(--border-subtle)'}`,
                        }}>
                          {/* Food name + confidence */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>
                              {i === 0 ? '🎯 ' : '·  '}{food.name}
                            </div>
                            <span style={{
                              fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase',
                              color: confColor(food.confidence),
                              background: `color-mix(in srgb, ${confColor(food.confidence)} 12%, transparent)`,
                              border: `1px solid color-mix(in srgb, ${confColor(food.confidence)} 28%, transparent)`,
                              padding: '0.1rem 0.4rem', borderRadius: 'var(--r-sm)',
                            }}>
                              {confLabel(food.confidence)} · {Math.round(food.confidence * 100)}%
                            </span>
                          </div>

                          {/* Serving & calorie headline */}
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{food.servingSize}</div>
                          <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--primary-500)', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
                            {food.calories} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)' }}>kcal</span>
                          </div>

                          {/* Macros */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.5rem' }}>
                            <MacroPill icon={Beef}     label="P"    value={`${food.protein}g`} color="var(--primary-500)" />
                            <MacroPill icon={Wheat}    label="C"    value={`${food.carbs}g`}   color="var(--amber-500)"   />
                            <MacroPill icon={Droplets} label="F"    value={`${food.fats}g`}    color="#a78bfa"            />
                          </div>

                          {/* Confidence bar */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Confidence</span>
                            <ConfBar value={food.confidence} color={confColor(food.confidence)} />
                            <span style={{ fontSize: '0.6rem', color: confColor(food.confidence), whiteSpace: 'nowrap', fontWeight: 700 }}>
                              {Math.round(food.confidence * 100)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Log to meal row */}
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', flexShrink: 0 }}>Log to:</span>
                    <select
                      value={meal}
                      onChange={e => setMeal(e.target.value)}
                      className="input"
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.8125rem', flex: '0 1 130px' }}
                    >
                      {MEALS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleLog(result.foods[0])}
                      disabled={logged || logging}
                      className="btn btn-primary"
                      style={{
                        padding: '0.45rem 1.25rem', fontSize: '0.8125rem',
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        opacity: logged || logging ? 0.75 : 1,
                        flex: '0 0 auto',
                      }}
                    >
                      {logged ? (
                        <><CheckCircle2 size={13} /> Logged!</>
                      ) : logging ? (
                        <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}><Zap size={13} /></motion.div> Logging…</>
                      ) : (
                        <><Flame size={13} /> Log {result.foods[0].name}</>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={reset}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.35rem',
                        background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--r-lg)', padding: '0.45rem 0.9rem',
                        fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <RotateCcw size={12} /> Retry
                    </button>
                  </div>

                  {/* Method badge */}
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Zap size={9} color="var(--text-muted)" />
                    Powered by: <strong style={{ textTransform: 'uppercase' }}>{result.method}</strong>
                    · {result.processingMs}ms
                    {result.method === 'mock' && ' · (demo mode — connect Gemini API for live detection)'}
                  </div>
                </motion.div>
              )}

              {/* ── ERROR ── */}
              {phase === 'error' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{
                    padding: '1rem', borderRadius: 'var(--r-lg)',
                    background: 'color-mix(in srgb, var(--amber-500) 8%, var(--bg-raised))',
                    border: '1px solid color-mix(in srgb, var(--amber-500) 25%, transparent)',
                    display: 'flex', flexDirection: 'column', gap: '0.75rem',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--amber-500)' }}>
                    ⚠ {error || 'Something went wrong'}
                  </div>
                  <button type="button" onClick={reset}
                    className="btn" style={{ alignSelf: 'flex-start', padding: '0.4rem 1rem', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <RotateCcw size={12} /> Try again
                  </button>
                </motion.div>
              )}

              {/* Close button when not idle */}
              {phase !== 'idle' && (
                <button
                  type="button" onClick={reset}
                  style={{
                    alignSelf: 'flex-end', background: 'none', border: 'none',
                    color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem',
                    display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0',
                  }}
                >
                  <X size={12} /> Clear &amp; scan another
                </button>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
