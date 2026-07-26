import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, X, PlayCircle, Flame, Dumbbell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CategoryRow from '../components/video/CategoryRow';
import VideoPlayerOverlay from '../components/video/VideoPlayerOverlay';
import { 
  getTrending, getNewReleases, getBeginnerVideos, 
  getAdvancedVideos, getVideosByCategory, searchVideos,
  getVideoById 
} from '../data/videoCatalog';
import { getContinueWatching } from '../services/videoHistory';
import usePlan from '../hooks/usePlan';

export default function ExploreVideos() {
  const navigate = useNavigate();
  const { isPro, triggerUpgrade } = usePlan();
  const [activeVideo, setActiveVideo] = useState(null);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ difficulty: [], type: [], equipment: [] });
  const [isSearching, setIsSearching] = useState(false);
  
  // Data State
  const [trending, setTrending] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [continueWatching, setContinueWatching] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [heroVideo, setHeroVideo] = useState(null);

  useEffect(() => {
    // Load rows on mount
    const trend = getTrending();
    setTrending(trend);
    setNewReleases(getNewReleases());
    
    // Set a hero video (e.g. the first trending video)
    if (trend.length > 0) setHeroVideo(trend[0]);

    // Load continue watching
    const cw = getContinueWatching();
    // Resolve the full video objects for CW
    const cwFull = cw.map(h => {
      const v = getVideoById(h.id);
      return v ? { ...v, progress: h.progress, lastWatched: h.lastWatched } : null;
    }).filter(Boolean);
    setContinueWatching(cwFull);
  }, []);

  // Handle Search
  useEffect(() => {
    if (searchQuery.trim().length > 0 || Object.values(filters).some(arr => arr.length > 0)) {
      setIsSearching(true);
      setSearchResults(searchVideos(searchQuery, filters));
    } else {
      setIsSearching(false);
    }
  }, [searchQuery, filters]);

  const handleVideoClick = (video) => {
    // PRO Gate: if video is advanced or certain type, require Pro (example logic)
    // For now, allow all, but could wrap in: if (!isPro && video.difficulty === 'Advanced') return triggerUpgrade('videos_full');
    setActiveVideo(video);
  };

  const closePlayer = () => {
    setActiveVideo(null);
    // Refresh continue watching when player closes
    const cw = getContinueWatching();
    const cwFull = cw.map(h => {
      const v = getVideoById(h.id);
      return v ? { ...v, progress: h.progress, duration: h.duration, lastWatched: h.lastWatched } : null;
    }).filter(Boolean);
    setContinueWatching(cwFull);
  };

  const toggleFilter = (category, value) => {
    setFilters(prev => {
      const current = prev[category];
      if (current.includes(value)) {
        return { ...prev, [category]: current.filter(v => v !== value) };
      } else {
        return { ...prev, [category]: [...current, value] };
      }
    });
  };

  return (
    <div className="page-wrapper" style={{ paddingBottom: '5rem', minHeight: '100vh', background: 'var(--bg-default)' }}>
      
      {/* ── HEADER & SEARCH ── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(11,15,25,0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border-subtle)', padding: '1rem 1.5rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search exercises, recipes, or science..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%', background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)',
                borderRadius: 99, padding: '0.75rem 1rem 0.75rem 2.75rem',
                color: 'var(--text-primary)', fontSize: '0.9375rem'
              }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)' }}>
                <X size={16} />
              </button>
            )}
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            style={{ 
              background: Object.values(filters).some(arr => arr.length > 0) ? 'var(--primary-500)' : 'var(--bg-raised)',
              border: '1px solid var(--border-subtle)',
              color: Object.values(filters).some(arr => arr.length > 0) ? '#fff' : 'var(--text-primary)',
              width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <Filter size={18} />
          </button>
        </div>
        
        {/* Filter Drawer */}
        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 1200, margin: '0 auto' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Difficulty</div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {['Beginner', 'Intermediate', 'Advanced'].map(f => (
                      <button key={f} onClick={() => toggleFilter('difficulty', f)} className={`chip ${filters.difficulty.includes(f) ? 'chip-primary' : ''}`} style={{ border: '1px solid var(--border-subtle)', background: filters.difficulty.includes(f) ? '' : 'var(--bg-card)' }}>{f}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Type</div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {[{l:'Workouts', v:'workout'}, {l:'Recipes', v:'recipe'}, {l:'Science', v:'fitness'}].map(f => (
                      <button key={f.v} onClick={() => toggleFilter('type', f.v)} className={`chip ${filters.type.includes(f.v) ? 'chip-primary' : ''}`} style={{ border: '1px solid var(--border-subtle)', background: filters.type.includes(f.v) ? '' : 'var(--bg-card)' }}>{f.l}</button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* ── SEARCH RESULTS ── */}
        {isSearching ? (
          <div style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem' }}>
              Search Results ({searchResults.length})
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}>
              {searchResults.map(video => (
                <div key={video.id} onClick={() => handleVideoClick(video)} style={{ cursor: 'pointer' }}>
                  <div style={{ width: '100%', aspectRatio: '16/9', borderRadius: 'var(--r-lg)', overflow: 'hidden', marginBottom: '0.5rem', position: 'relative' }}>
                    <img src={video.thumbnail} alt={video.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: '0 0 0.25rem 0', lineHeight: 1.3 }}>{video.title}</h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{video.duration} • {video.difficulty || video.category}</div>
                </div>
              ))}
              {searchResults.length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  No videos found matching your criteria.
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* ── HERO SECTION ── */}
            {heroVideo && (
              <div 
                style={{ 
                  position: 'relative', width: '100%', aspectRatio: '16/9', maxHeight: '500px', 
                  backgroundImage: `url(${heroVideo.thumbnail})`,
                  backgroundSize: 'cover', backgroundPosition: 'center',
                  marginBottom: '2rem',
                  display: 'flex', alignItems: 'flex-end',
                  borderBottom: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, var(--bg-default) 0%, rgba(11,15,25,0.4) 50%, transparent 100%)' }} />
                <div style={{ position: 'relative', zIndex: 10, padding: 'clamp(1.5rem, 4vw, 3rem)', width: '100%', maxWidth: 800 }}>
                  {heroVideo.isNew && <div className="chip chip-primary" style={{ marginBottom: '0.75rem' }}>New Release</div>}
                  <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', fontWeight: 800, color: '#fff', marginBottom: '0.5rem', lineHeight: 1.1 }}>
                    {heroVideo.title}
                  </h1>
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9375rem', marginBottom: '1.25rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {heroVideo.content?.introduction || "Watch the latest featured content on Runli."}
                  </p>
                  <button 
                    onClick={() => handleVideoClick(heroVideo)}
                    className="btn btn-primary" 
                    style={{ padding: '0.75rem 2rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <PlayCircle size={20} /> Watch Now
                  </button>
                </div>
              </div>
            )}

            {/* ── ROWS ── */}
            <div style={{ marginTop: heroVideo ? '-2rem' : '1.5rem', position: 'relative', zIndex: 20 }}>
              
              {continueWatching.length > 0 && (
                <CategoryRow title="Continue Watching" videos={continueWatching} onVideoClick={handleVideoClick} />
              )}
              
              <CategoryRow title="Trending Now" videos={trending} onVideoClick={handleVideoClick} />
              
              {newReleases.length > 0 && (
                <CategoryRow title="New Releases" videos={newReleases} onVideoClick={handleVideoClick} />
              )}
              
              <CategoryRow title="Master The Basics" videos={getBeginnerVideos()} onVideoClick={handleVideoClick} />
              
              <CategoryRow title="High Protein Meals" videos={getVideosByCategory('dinner').concat(getVideosByCategory('lunch'))} onVideoClick={handleVideoClick} />
              
              <CategoryRow title="Build Your Chest" videos={getVideosByCategory('chest')} onVideoClick={handleVideoClick} />
              <CategoryRow title="Leg Day Essentials" videos={getVideosByCategory('legs')} onVideoClick={handleVideoClick} />
              <CategoryRow title="Bigger Arms" videos={getVideosByCategory('biceps').concat(getVideosByCategory('triceps'))} onVideoClick={handleVideoClick} />
              <CategoryRow title="Core & Abs" videos={getVideosByCategory('core')} onVideoClick={handleVideoClick} />
              
              <CategoryRow title="Fitness Science & Education" videos={getVideosByCategory('science')} onVideoClick={handleVideoClick} />
              <CategoryRow title="Yoga & Recovery" videos={getVideosByCategory('yoga').concat(getVideosByCategory('recovery'))} onVideoClick={handleVideoClick} />
            </div>
          </>
        )}
      </div>

      {/* Video Player Modal */}
      {activeVideo && (
        <VideoPlayerOverlay 
          video={activeVideo}
          onClose={closePlayer}
        />
      )}
    </div>
  );
}
