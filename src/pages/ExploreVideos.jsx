import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, PlayCircle } from 'lucide-react';
import { getAllVideos, searchVideos } from '../data/videoCatalog';
import { getContinueWatching } from '../services/videoHistory';
import CategoryRow from '../components/video/CategoryRow';
import ExploreVideoCard from '../components/video/ExploreVideoCard';
import VideoPlayerOverlay from '../components/video/VideoPlayerOverlay';

export default function ExploreVideos() {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [activeVideo, setActiveVideo] = useState(null);
  const [continueWatching, setContinueWatching] = useState([]);

  // Fetch 'Continue Watching' on mount and when video closes
  useEffect(() => {
    if (!activeVideo) {
      loadContinueWatching();
    }
  }, [activeVideo]);

  const loadContinueWatching = () => {
    const historyItems = getContinueWatching(); // {id, progress, duration, lastWatched}
    const allVideos = getAllVideos();
    const cwVideos = historyItems.map(hi => allVideos.find(v => v.id === hi.id)).filter(Boolean);
    setContinueWatching(cwVideos);
  };

  // Debounced Search
  useEffect(() => {
    if (!query) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      setSearchResults(searchVideos(query));
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleVideoClick = (video) => {
    setActiveVideo(video);
  };

  // Group videos by categories for main view
  const allVideos = getAllVideos();
  const workoutVideos = allVideos.filter(v => v.type === 'workout');
  const recipeVideos = allVideos.filter(v => v.type === 'recipe');
  const fitnessVideos = allVideos.filter(v => v.type === 'fitness');

  // Helper to chunk by specific sub-categories if needed, but for now we'll just show the main types
  // or top-level muscle groups
  
  const chestVideos = workoutVideos.filter(v => v.category === 'chest');
  const backVideos = workoutVideos.filter(v => v.category === 'back');
  const legVideos = workoutVideos.filter(v => v.category === 'legs');
  const shoulderVideos = workoutVideos.filter(v => v.category === 'shoulders');
  const armVideos = workoutVideos.filter(v => v.category === 'biceps' || v.category === 'triceps');

  return (
    <div className="page-wrapper" style={{ paddingBottom: '6rem' }}>
      
      {/* Header & Search */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(9,9,11,0.85)', backdropFilter: 'blur(12px)',
        padding: 'env(safe-area-inset-top, 1rem) 1.5rem 1rem 1.5rem',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <PlayCircle color="var(--primary-500)" />
          Explore
        </h1>
        
        <div style={{ position: 'relative' }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: 11 }} />
          <input
            type="text"
            placeholder="Search exercises, recipes, or topics..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input"
            style={{ width: '100%', paddingLeft: '2.5rem', borderRadius: 99, background: 'var(--bg-raised)' }}
          />
        </div>
      </div>

      {/* Content */}
      <div style={{ paddingTop: '1.5rem' }}>
        
        {query ? (
          // SEARCH RESULTS
          <div style={{ padding: '0 1.5rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>
              Results for "{query}"
            </h2>
            {searchResults.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>
                No videos found. Try a different search term.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
                {searchResults.map(video => (
                  <ExploreVideoCard key={video.id} video={video} onClick={handleVideoClick} />
                ))}
              </div>
            )}
          </div>
        ) : (
          // MAIN DASHBOARD
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            
            {continueWatching.length > 0 && (
              <CategoryRow title="Continue Watching" videos={continueWatching} onVideoClick={handleVideoClick} />
            )}

            <CategoryRow title="Chest & Triceps" videos={[...chestVideos, ...armVideos.filter(v=>v.category==='triceps')]} onVideoClick={handleVideoClick} />
            <CategoryRow title="Back & Biceps" videos={[...backVideos, ...armVideos.filter(v=>v.category==='biceps')]} onVideoClick={handleVideoClick} />
            <CategoryRow title="Legs & Glutes" videos={legVideos} onVideoClick={handleVideoClick} />
            <CategoryRow title="Shoulders & Core" videos={[...shoulderVideos, ...workoutVideos.filter(v=>v.category==='core')]} onVideoClick={handleVideoClick} />
            
            <CategoryRow title="High Protein Recipes" videos={recipeVideos} onVideoClick={handleVideoClick} />
            <CategoryRow title="Fitness & Nutrition Science" videos={fitnessVideos.filter(v => v.category !== 'yoga' && v.category !== 'meditation')} onVideoClick={handleVideoClick} />
            <CategoryRow title="Yoga & Recovery" videos={fitnessVideos.filter(v => v.category === 'yoga' || v.category === 'mobility' || v.category === 'meditation')} onVideoClick={handleVideoClick} />

          </motion.div>
        )}
      </div>

      {/* Video Overlay */}
      {activeVideo && (
        <VideoPlayerOverlay video={activeVideo} onClose={() => setActiveVideo(null)} />
      )}
    </div>
  );
}
