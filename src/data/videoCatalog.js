import { workoutVideos } from './workoutVideos';
import { recipeVideos } from './recipeVideos';
import { fitnessVideos } from './fitnessVideos';

export const videoCatalog = [
  ...workoutVideos.map(v => ({ ...v, type: 'workout' })),
  ...recipeVideos.map(v => ({ ...v, type: 'recipe' })),
  ...fitnessVideos.map(v => ({ ...v, type: 'fitness' }))
];

export const getAllVideos = () => videoCatalog;

export const getVideoById = (id) => videoCatalog.find(v => v.id === id);

export const getVideosByCategory = (category) => 
  videoCatalog.filter(v => v.category.toLowerCase() === category.toLowerCase());

export const getVideosByType = (type) => 
  videoCatalog.filter(v => v.type === type);

export const searchVideos = (query) => {
  if (!query) return [];
  const lowerQuery = query.toLowerCase();
  
  return videoCatalog.filter(v => {
    return v.title.toLowerCase().includes(lowerQuery) ||
           v.category.toLowerCase().includes(lowerQuery) ||
           (v.muscleGroup && v.muscleGroup.toLowerCase().includes(lowerQuery)) ||
           (v.tags && v.tags.some(tag => tag.toLowerCase().includes(lowerQuery)));
  });
};

export const getVideoByExerciseName = (exerciseName) => {
  if (!exerciseName) return null;
  const lowerName = exerciseName.toLowerCase();
  
  // Direct match in tags or title
  return videoCatalog.find(v => 
    v.type === 'workout' && 
    (v.title.toLowerCase().includes(lowerName) || 
    (v.tags && v.tags.some(tag => tag.toLowerCase() === lowerName)))
  );
};
