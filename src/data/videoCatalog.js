import { runliVideos } from './videoData';

// Combine all catalogs (already combined in videoData.js)
export const videoCatalog = runliVideos;

// Helper to find a video by ID
export function getVideoById(id) {
  return videoCatalog.find(v => v.id === id);
}

// Helper to find a video by exercise name
export function getVideoByExerciseName(exerciseName) {
  if (!exerciseName) return null;
  const name = exerciseName.toLowerCase();
  return videoCatalog.find(v => 
    v.category === "Exercise" && 
    (v.title.toLowerCase() === name || v.title.toLowerCase().includes(name) || name.includes(v.title.toLowerCase()))
  );
}

// Netflix-style row helpers
export function getTrending() {
  // Mock trending: just grab a mix of popular categories
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
  
  // Try subcategory for exercises
  const matches = videoCatalog.filter(v => 
    (v.subcategory && v.subcategory.toLowerCase().includes(category.toLowerCase())) ||
    (v.category && v.category.toLowerCase() === category.toLowerCase())
  );
  return matches;
}

export function getVideosByType(type) {
  return videoCatalog.filter(v => v.category.toLowerCase() === type.toLowerCase());
}

export function getVideosByMuscle(muscle) {
  return videoCatalog.filter(v => v.subcategory && v.subcategory.toLowerCase().includes(muscle.toLowerCase()));
}

// ── Search & Filter ────────────────────────────────────────────────────────
export function searchVideos(query, filters = {}) {
  let results = [...videoCatalog];

  // Apply search text
  if (query) {
    const q = query.toLowerCase();
    results = results.filter(v => 
      v.title.toLowerCase().includes(q) ||
      (v.subcategory && v.subcategory.toLowerCase().includes(q)) ||
      (v.category && v.category.toLowerCase().includes(q))
    );
  }

  // Apply filters
  if (filters.difficulty && filters.difficulty.length > 0) {
    results = results.filter(v => filters.difficulty.includes(v.difficulty));
  }
  
  if (filters.type && filters.type.length > 0) {
    results = results.filter(v => filters.type.includes(v.category.toLowerCase()));
  }

  return results;
}
