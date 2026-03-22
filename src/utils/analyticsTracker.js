/**
 * analyticsTracker.js
 * ─────────────────────────────────────────────────────
 * Fire-and-forget client-side event tracker.
 *
 * Usage:
 *   import { track } from '../utils/analyticsTracker';
 *   track('workout_started', { exerciseCount: 6, focus: 'Push' });
 *
 * - Zero-await: never blocks UI
 * - Offline queue: events are stored in localStorage if offline,
 *   and flushed on the next call
 * - Tiny footprint: ~2KB
 */

const QUEUE_KEY    = 'runliAnalyticsQueue';
const SESSION_KEY  = 'runliSessionId';
const API_ENDPOINT = '/api/analytics/event';
const APP_VERSION  = '1.0.0';

/* ─────────────────────────────────────────────────────
   SESSION ID (per browser tab)
───────────────────────────────────────────────────── */
function getOrCreateSession() {
  let sid = sessionStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

/* ─────────────────────────────────────────────────────
   DEVICE TYPE
───────────────────────────────────────────────────── */
function getDeviceType() {
  const w = window.innerWidth;
  if (w < 768) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
}

/* ─────────────────────────────────────────────────────
   AUTH TOKEN (from localStorage)
───────────────────────────────────────────────────── */
function getToken() {
  try { return localStorage.getItem('runliToken') || ''; } catch { return ''; }
}

/* ─────────────────────────────────────────────────────
   OFFLINE QUEUE
───────────────────────────────────────────────────── */
function enqueue(payload) {
  try {
    const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    queue.push(payload);
    // Keep only last 50 events to avoid storage bloat
    if (queue.length > 50) queue.splice(0, queue.length - 50);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {}
}

function flushQueue() {
  try {
    const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    if (!queue.length) return;
    localStorage.removeItem(QUEUE_KEY);
    queue.forEach(payload => sendEvent(payload, false)); // no re-queuing on flush
  } catch {}
}

/* ─────────────────────────────────────────────────────
   SEND SINGLE EVENT
───────────────────────────────────────────────────── */
function sendEvent(payload, requeueOnFail = true) {
  const token = getToken();
  fetch(API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
    keepalive: true, // survives page unloads
  }).catch(() => {
    if (requeueOnFail) enqueue(payload);
  });
}

/* ─────────────────────────────────────────────────────
   EVENT CATEGORY MAP
───────────────────────────────────────────────────── */
const EVENT_CATEGORIES = {
  page_view:                'navigation',
  workout_started:          'workout',
  workout_completed:        'workout',
  set_logged:               'workout',
  meal_logged:              'diet',
  food_scanned:             'feature',
  pose_analyzed:            'feature',
  habit_checked:            'habit',
  ai_insight_viewed:        'feature',
  cluster_assigned:         'system',
  recommendation_clicked:   'feature',
};

/* ─────────────────────────────────────────────────────
   PUBLIC API
───────────────────────────────────────────────────── */

/**
 * Track a named event. Fire-and-forget — never awaited.
 *
 * @param {string} event - Event name from the catalogue
 * @param {object} [properties={}] - Arbitrary extra data
 */
export function track(event, properties = {}) {
  // Flush any offline queue first
  flushQueue();

  const payload = {
    event,
    category: EVENT_CATEGORIES[event] || 'feature',
    properties,
    sessionId:  getOrCreateSession(),
    deviceType: getDeviceType(),
    appVersion: APP_VERSION,
    timestamp:  new Date().toISOString(),
  };

  sendEvent(payload);
}

/**
 * Convenience: track a page view. Call in each page component's useEffect.
 *
 * @param {string} page - Route name e.g. '/gym'
 * @param {string} [from] - Previous route
 */
export function trackPage(page, from = '') {
  track('page_view', { page, from });
}

/**
 * Convenience: track a recommendation click.
 */
export function trackRecommendationClick(item) {
  track('recommendation_clicked', {
    itemId:   item.id,
    itemType: item.type,
    score:    item.score,
    title:    item.title,
  });
}
