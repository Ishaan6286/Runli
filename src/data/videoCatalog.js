import { workoutVideos } from './workoutVideos';
import { recipeVideos } from './recipeVideos';
import { fitnessVideos } from './fitnessVideos';

// Combine all catalogs
export const videoCatalog = [
  ...workoutVideos.map(v => ({ ...v, type: 'workout' })),
  ...recipeVideos.map(v => ({ ...v, type: 'recipe' })),
  ...fitnessVideos.map(v => ({ ...v, type: 'fitness' }))
];

// Helper to find a video by ID
export function getVideoById(id) {
  return videoCatalog.find(v => v.id === id);
}

// Helper to find a video by exercise name
export function getVideoByExerciseName(exerciseName) {
  if (!exerciseName) return null;
  const name = exerciseName.toLowerCase();
  return videoCatalog.find(v => v.exercises && v.exercises.some(ex => ex.toLowerCase() === name || name.includes(ex.toLowerCase())));
}

// Netflix-style row helpers
export function getTrending() {
  // Mock trending: just grab a mix of popular categories
  return videoCatalog
    .filter(v => ['chest', 'legs', 'science', 'dinner'].includes(v.category))
    .slice(0, 10);
}

export function getNewReleases() {
  return videoCatalog.filter(v => v.isNew);
}

export function getBeginnerVideos() {
  return videoCatalog.filter(v => v.difficulty === 'Beginner').slice(0, 15);
}

export function getAdvancedVideos() {
  return videoCatalog.filter(v => v.difficulty === 'Advanced' || v.difficulty === 'Intermediate').slice(0, 15);
}

export function getVideosByCategory(category) {
  return videoCatalog.filter(v => v.category === category);
}

export function getVideosByType(type) {
  return videoCatalog.filter(v => v.type === type);
}

export function getVideosByMuscle(muscle) {
  return videoCatalog.filter(v => v.muscleGroup && v.muscleGroup.toLowerCase().includes(muscle.toLowerCase()));
}

// ── Search & Filter ────────────────────────────────────────────────────────
export function searchVideos(query, filters = {}) {
  let results = [...videoCatalog];

  // Apply search text
  if (query) {
    const q = query.toLowerCase();
    results = results.filter(v => 
      v.title.toLowerCase().includes(q) ||
      (v.muscleGroup && v.muscleGroup.toLowerCase().includes(q)) ||
      (v.category && v.category.toLowerCase().includes(q)) ||
      (v.tags && v.tags.some(tag => tag.toLowerCase().includes(q))) ||
      (v.exercises && v.exercises.some(ex => ex.toLowerCase().includes(q)))
    );
  }

  // Apply filters
  if (filters.difficulty && filters.difficulty.length > 0) {
    results = results.filter(v => filters.difficulty.includes(v.difficulty));
  }
  
  if (filters.type && filters.type.length > 0) {
    results = results.filter(v => filters.type.includes(v.type));
  }

  if (filters.equipment && filters.equipment.length > 0) {
    results = results.filter(v => {
      if (!v.equipment) return false;
      const eq = v.equipment.toLowerCase();
      return filters.equipment.some(f => eq.includes(f.toLowerCase()));
    });
  }

  return results;
}
