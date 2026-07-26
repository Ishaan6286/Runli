const HISTORY_KEY = 'runli_video_history';
const FAVORITES_KEY = 'runli_video_favorites';
const WATCH_LATER_KEY = 'runli_video_watch_later';

// HISTORY
export const getWatchHistory = () => {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
};

export const saveWatchProgress = (videoId, progressSeconds, totalDurationSeconds) => {
  if (!videoId) return;
  try {
    const history = getWatchHistory();
    history[videoId] = {
      progress: progressSeconds,
      duration: totalDurationSeconds,
      lastWatched: Date.now()
    };
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (e) {
    console.error("Failed to save watch progress", e);
  }
};

export const getProgressForVideo = (videoId) => {
  const history = getWatchHistory();
  return history[videoId]?.progress || 0;
};

export const getContinueWatching = () => {
  const history = getWatchHistory();
  return Object.entries(history)
    // Filter out videos that are less than 10 seconds in, or finished (e.g. within 10s of the end)
    .filter(([_, data]) => data.progress > 10 && data.progress < (data.duration - 10))
    .sort((a, b) => b[1].lastWatched - a[1].lastWatched)
    .map(([id, data]) => ({ id, ...data }));
};

// FAVORITES
export const getFavorites = () => {
  try {
    const data = localStorage.getItem(FAVORITES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const toggleFavorite = (videoId) => {
  const favs = getFavorites();
  const newFavs = favs.includes(videoId) 
    ? favs.filter(id => id !== videoId)
    : [...favs, videoId];
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavs));
  return newFavs.includes(videoId);
};

export const isFavorite = (videoId) => getFavorites().includes(videoId);

// WATCH LATER
export const getWatchLater = () => {
  try {
    const data = localStorage.getItem(WATCH_LATER_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const toggleWatchLater = (videoId) => {
  const wl = getWatchLater();
  const newWl = wl.includes(videoId) 
    ? wl.filter(id => id !== videoId)
    : [...wl, videoId];
  localStorage.setItem(WATCH_LATER_KEY, JSON.stringify(newWl));
  return newWl.includes(videoId);
};

export const isWatchLater = (videoId) => getWatchLater().includes(videoId);
