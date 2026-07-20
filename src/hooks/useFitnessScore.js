// src/hooks/useFitnessScore.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { getFitnessScore, getFitnessScoreHistory, recalculateFitnessScore } from '../services/api';
import { useAuth } from '../context/AuthContext';

/**
 * useFitnessScore
 * ─────────────────────────────────────────────
 * Provides today's fitness score, its category breakdown,
 * natural language reasoning, and a 30-day history for
 * trend charts.
 *
 * Usage:
 *   const { score, loading, refresh } = useFitnessScore();
 */
export function useFitnessScore({ historyDays = 30, autoRefresh = false } = {}) {
  const { user } = useAuth();
  const [score, setScore]         = useState(null);
  const [history, setHistory]     = useState([]);
  const [loading, setLoading]     = useState(false);
  const [histLoading, setHistLoading] = useState(false);
  const [error, setError]         = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const fetchScore = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getFitnessScore();
      if (isMounted.current) setScore(data);
    } catch (err) {
      if (isMounted.current) setError(err.message);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [user]);

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    try {
      setHistLoading(true);
      const data = await getFitnessScoreHistory(historyDays);
      if (isMounted.current) setHistory(data.history ?? []);
    } catch {
      // Non-fatal — chart simply won't render
    } finally {
      if (isMounted.current) setHistLoading(false);
    }
  }, [user, historyDays]);

  /** Force-recalculate (call this after the user logs data). */
  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const data = await recalculateFitnessScore();
      if (isMounted.current) setScore(data);
    } catch (err) {
      if (isMounted.current) setError(err.message);
    } finally {
      if (isMounted.current) setLoading(false);
    }
    // Reload history after refresh
    await fetchHistory();
  }, [user, fetchHistory]);

  // Initial fetch
  useEffect(() => {
    fetchScore();
    fetchHistory();
  }, [fetchScore, fetchHistory]);

  // Optional auto-refresh every 5 minutes
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(fetchScore, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [autoRefresh, fetchScore]);

  return {
    score,         // Full score object { totalScore, breakdown, reasoning, grade, ... }
    history,       // Array of { date, totalScore, breakdown } for charts
    loading,
    histLoading,
    error,
    refresh,       // Force recalculate
    fetchScore,    // Soft refetch (uses cache)
  };
}
