/**
 * videoHistory.js
 * LocalStorage wrapper for video progress tracking
 */

const HISTORY_KEY = 'runli_video_history';

export const getWatchHistory = () => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
};

/**
 * Update history with current progress
 */
export const saveWatchProgress = (videoId, progressSeconds, totalDurationSeconds) => {
  if (!videoId) return;
  try {
    const history = getWatchHistory();
    const isCompleted = progressSeconds > 0 && totalDurationSeconds > 0 && (progressSeconds / totalDurationSeconds) >= 0.9;
    
    history[videoId] = {
      progress: progressSeconds,
      duration: totalDurationSeconds,
      lastWatched: Date.now(),
      isCompleted
    };
    
    // Prune if > 100 items (keep latest 100)
    const keys = Object.keys(history);
    if (keys.length > 100) {
      const sortedKeys = keys.sort((a, b) => history[b].lastWatched - history[a].lastWatched);
      const pruned = {};
      sortedKeys.slice(0, 100).forEach(k => pruned[k] = history[k]);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(pruned));
    } else {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    }
  } catch (e) {
    console.error("Failed to save watch progress", e);
  }
};

/**
 * Remove a specific video from history
 */
export const clearVideoFromHistory = (videoId) => {
  const history = getWatchHistory();
  delete history[videoId];
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
};

/**
 * Clear all video history
 */
export const clearAllHistory = () => {
  localStorage.removeItem(HISTORY_KEY);
};

export const getProgressForVideo = (videoId) => {
  return getWatchHistory()[videoId] || null;
};

/**
 * Get all history sorted by recent
 */
export const getRecentlyWatched = () => {
  const history = getWatchHistory();
  return Object.entries(history)
    .sort((a, b) => b[1].lastWatched - a[1].lastWatched)
    .map(([id, data]) => ({ id, ...data }));
};

export const getContinueWatching = () => {
  const history = getWatchHistory();
  return Object.entries(history)
    // Filter out videos that are less than 10 seconds in, or finished
    .filter(([_, data]) => data.progress > 10 && !data.isCompleted)
    .sort((a, b) => b[1].lastWatched - a[1].lastWatched)
    .map(([id, data]) => ({ id, ...data }));
};

// ── Favorites & Watch Later ──────────────────────────────────────────

const FAV_KEY = 'runli_video_favorites';
const WL_KEY = 'runli_video_watch_later';

const getList = (key) => {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } 
  catch { return []; }
};

export const toggleFavorite = (videoId) => {
  let list = getList(FAV_KEY);
  if (list.includes(videoId)) list = list.filter(id => id !== videoId);
  else list.push(videoId);
  localStorage.setItem(FAV_KEY, JSON.stringify(list));
  return list.includes(videoId);
};

export const isFavorite = (videoId) => getList(FAV_KEY).includes(videoId);

export const toggleWatchLater = (videoId) => {
  let list = getList(WL_KEY);
  if (list.includes(videoId)) list = list.filter(id => id !== videoId);
  else list.push(videoId);
  localStorage.setItem(WL_KEY, JSON.stringify(list));
  return list.includes(videoId);
};

export const isWatchLater = (videoId) => getList(WL_KEY).includes(videoId);
