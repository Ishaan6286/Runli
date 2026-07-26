import { runliVideos } from './videoData';

// Combine all catalogs (already combined in videoData.js)
export const videoCatalog = runliVideos;

// Helper to find a video by ID
export function getVideoById(id) {
  return videoCatalog.find(v => v.id === id);
}

const normalizeExerciseName = (value) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

// Gym Mode uses concise workout names while the catalog uses form-guide titles.
// Keep those aliases here so every designated Gym Mode exercise opens its
// corresponding video instead of relying on a fragile partial-text match.
const exerciseVideoAliases = new Map([
  ['benchpress', 'Bench Press (Flat)'],
  ['inclinedbpress', 'Dumbbell Press (Incline)'],
  ['inclinedumbbellpress', 'Dumbbell Press (Incline)'],
  ['cableflyes', 'Cable Crossover'],
  ['triceppushdowns', 'Triceps Pushdown'],
  ['pullups', 'Pull-up / Chin-up'],
  ['chinups', 'Pull-up / Chin-up'],
  ['facepulls', 'Face Pull'],
  ['barbellsquat', 'Barbell Back Squat'],
  ['hamstringcurl', 'Lying Leg Curl'],
  ['hanginglegraises', 'Hanging Leg Raise'],
  ['ohp', 'Overhead Press (Military Press)'],
  ['lateralraises', 'Dumbbell Lateral Raise'],
  ['reardeltfly', 'Rear Delt Reverse Fly'],
  ['tricepextensions', 'Overhead Triceps Extension'],
  ['overheadextensions', 'Overhead Triceps Extension'],
  ['walkinglunges', 'Walking Lunge']
]);

export function getVideoByExerciseName(exerciseName) {
  if (!exerciseName) return null;

  const normalizedName = normalizeExerciseName(exerciseName);
  const exerciseVideos = videoCatalog.filter(video => video.category === 'Exercise');
  const aliasedTitle = exerciseVideoAliases.get(normalizedName);

  if (aliasedTitle) {
    return exerciseVideos.find(video => video.title === aliasedTitle) || null;
  }

  return exerciseVideos.find(video => {
    const normalizedTitle = normalizeExerciseName(video.title);
    return normalizedTitle === normalizedName ||
      normalizedTitle.includes(normalizedName) ||
      normalizedName.includes(normalizedTitle);
  }) || null;
}

export function getTrending() {
  return videoCatalog
    .filter(v => ['Chest', 'Legs (Quads)', 'General Fitness', 'Recipe'].includes(v.category) || ['Chest', 'Legs (Quads)'].includes(v.subcategory))
    .slice(0, 10);
}

export function getNewReleases() {
  return videoCatalog.filter(v => v.isNew || v.id.includes('fitness'));
}

export function getBeginnerVideos() {
  return videoCatalog.filter(v => v.difficulty === 'Beginner').slice(0, 15);
}

export function getAdvancedVideos() {
  return videoCatalog.filter(v => v.difficulty === 'Advanced' || v.difficulty === 'Intermediate').slice(0, 15);
}

export function getVideosByCategory(category) {
  if (category === 'dinner' || category === 'lunch') return videoCatalog.filter(v => v.category === 'Recipe');
  if (category === 'science' || category === 'yoga' || category === 'recovery') return videoCatalog.filter(v => v.category === 'General Fitness');

  return videoCatalog.filter(v =>
    (v.subcategory && v.subcategory.toLowerCase().includes(category.toLowerCase())) ||
    (v.category && v.category.toLowerCase() === category.toLowerCase())
  );
}

export function getVideosByType(type) {
  return videoCatalog.filter(v => v.category.toLowerCase() === type.toLowerCase());
}

export function getVideosByMuscle(muscle) {
  return videoCatalog.filter(v => v.subcategory && v.subcategory.toLowerCase().includes(muscle.toLowerCase()));
}

export function searchVideos(query, filters = {}) {
  let results = [...videoCatalog];

  if (query) {
    const q = query.toLowerCase();
    results = results.filter(v =>
      v.title.toLowerCase().includes(q) ||
      (v.subcategory && v.subcategory.toLowerCase().includes(q)) ||
      (v.category && v.category.toLowerCase().includes(q))
    );
  }

  if (filters.difficulty && filters.difficulty.length > 0) {
    results = results.filter(v => filters.difficulty.includes(v.difficulty));
  }

  if (filters.type && filters.type.length > 0) {
    results = results.filter(v => filters.type.includes(v.category.toLowerCase()));
  }

  return results;
}
