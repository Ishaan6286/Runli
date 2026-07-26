import React, { useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Filter, Search, X } from 'lucide-react';
import CategoryRow from '../components/video/CategoryRow';
import VideoPlayerOverlay from '../components/video/VideoPlayerOverlay';
import { exerciseVideos, fitnessVideos, recipeVideos } from '../data/videoData';
import { searchVideos } from '../data/videoCatalog';

const EXERCISE_SUBCATEGORIES = [
  { label: 'Chest', matches: ['Chest'] },
  { label: 'Back', matches: ['Back'] },
  { label: 'Shoulders', matches: ['Shoulders'] },
  { label: 'Arms', matches: ['Biceps', 'Triceps', 'Forearms'] },
  { label: 'Legs', matches: ['Legs (Quads)', 'Hamstrings & Glutes', 'Calves'] },
  { label: 'Core', matches: ['Core / Abs'] }
];

function Section({ title, description, children }) {
  return (
    <section style={{ marginBottom: '2.5rem' }}>
      <div style={{ padding: '0 1.5rem', marginBottom: '1rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>{title}</h1>
        {description && (
          <p style={{ margin: '0.35rem 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

function SearchResults({ videos, onVideoClick }) {
  return (
    <div style={{ padding: '1.5rem' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 1.5rem' }}>
        Search Results ({videos.length})
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}>
        {videos.map(video => (
          <button
            key={video.id}
            type="button"
            onClick={() => onVideoClick(video)}
            style={{ padding: 0, border: 0, background: 'none', color: 'inherit', textAlign: 'left', cursor: 'pointer' }}
          >
            <div style={{ width: '100%', aspectRatio: '16/9', borderRadius: 'var(--r-lg)', overflow: 'hidden', marginBottom: '0.5rem' }}>
              <img src={video.thumbnail} alt={video.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: '0 0 0.25rem', lineHeight: 1.3 }}>{video.title}</h3>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {video.subcategory || video.category}
            </div>
          </button>
        ))}
        {videos.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            No videos found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
}

export default function ExploreVideos() {
  const [activeVideo, setActiveVideo] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ difficulty: [], type: [] });

  const isSearching = searchQuery.trim().length > 0 || Object.values(filters).some(values => values.length > 0);
  const searchResults = useMemo(
    () => searchVideos(searchQuery, filters),
    [searchQuery, filters]
  );

  const groupedExercises = useMemo(() => (
    EXERCISE_SUBCATEGORIES.map(({ label, matches }) => ({
      label,
      videos: exerciseVideos.filter(video => matches.includes(video.subcategory))
    })).filter(group => group.videos.length > 0)
  ), []);

  const toggleFilter = (category, value) => {
    setFilters(previous => {
      const selected = previous[category];
      return {
        ...previous,
        [category]: selected.includes(value)
          ? selected.filter(item => item !== value)
          : [...selected, value]
      };
    });
  };

  const clearSearch = () => {
    setSearchQuery('');
    setFilters({ difficulty: [], type: [] });
  };

  return (
    <div className="page-wrapper" style={{ paddingBottom: '5rem', minHeight: '100vh', background: 'var(--bg-default)' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(11,15,25,0.86)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border-subtle)', padding: '1rem 1.5rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search exercises, recipes, or general fitness..."
              value={searchQuery}
              onChange={event => setSearchQuery(event.target.value)}
              style={{ width: '100%', background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', borderRadius: 99, padding: '0.75rem 2.75rem', color: 'var(--text-primary)', fontSize: '0.9375rem' }}
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery('')} aria-label="Clear search" style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(open => !open)}
            aria-label="Toggle video filters"
            style={{ background: isSearching ? 'var(--primary-500)' : 'var(--bg-raised)', border: '1px solid var(--border-subtle)', color: isSearching ? '#fff' : 'var(--text-primary)', width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <Filter size={18} />
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
              <div style={{ paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 1200, margin: '0 auto' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Difficulty</div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {['Beginner', 'Intermediate', 'Advanced'].map(value => (
                      <button key={value} type="button" onClick={() => toggleFilter('difficulty', value)} className={`chip ${filters.difficulty.includes(value) ? 'chip-primary' : ''}`} style={{ border: '1px solid var(--border-subtle)', background: filters.difficulty.includes(value) ? '' : 'var(--bg-card)' }}>{value}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Section</div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {[{ label: 'Exercise Videos', value: 'exercise' }, { label: 'General Fitness', value: 'general fitness' }, { label: 'Recipes', value: 'recipe' }].map(filter => (
                      <button key={filter.value} type="button" onClick={() => toggleFilter('type', filter.value)} className={`chip ${filters.type.includes(filter.value) ? 'chip-primary' : ''}`} style={{ border: '1px solid var(--border-subtle)', background: filters.type.includes(filter.value) ? '' : 'var(--bg-card)' }}>{filter.label}</button>
                    ))}
                  </div>
                </div>
                {isSearching && <button type="button" onClick={clearSearch} className="btn-text" style={{ alignSelf: 'flex-start', color: 'var(--primary-500)' }}>Clear filters</button>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <main style={{ maxWidth: 1200, margin: '0 auto', paddingTop: '1.5rem' }}>
        {isSearching ? (
          <SearchResults videos={searchResults} onVideoClick={setActiveVideo} />
        ) : (
          <>
            <Section title="Exercise Videos" description="Form guides organized by muscle group.">
              {groupedExercises.map(group => (
                <CategoryRow key={group.label} title={group.label} videos={group.videos} onVideoClick={setActiveVideo} />
              ))}
            </Section>

            <section style={{ marginBottom: '2.5rem' }}>
              <CategoryRow title="General Fitness" videos={fitnessVideos} onVideoClick={setActiveVideo} />
            </section>

            <section style={{ marginBottom: '2.5rem' }}>
              <CategoryRow title="Recipes" videos={recipeVideos} onVideoClick={setActiveVideo} />
            </section>
          </>
        )}
      </main>

      {activeVideo && <VideoPlayerOverlay video={activeVideo} onClose={() => setActiveVideo(null)} />}
    </div>
  );
}
