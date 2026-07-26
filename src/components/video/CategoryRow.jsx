import React, { useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import ExploreVideoCard from './ExploreVideoCard';

export default function CategoryRow({ title, videos, onVideoClick, onSeeAll }) {
  const scrollRef = useRef(null);

  if (!videos || videos.length === 0) return null;

  return (
    <div style={{ marginBottom: '2rem' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '1rem', padding: '0 1.5rem'
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{title}</h2>
        {onSeeAll && (
          <button 
            onClick={onSeeAll}
            className="btn-text" 
            style={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem', color: 'var(--primary-500)', fontWeight: 600, padding: 0 }}
          >
            See All <ChevronRight size={16} />
          </button>
        )}
      </div>

      <div 
        ref={scrollRef}
        className="hide-scrollbar"
        style={{
          display: 'flex',
          gap: '1rem',
          overflowX: 'auto',
          padding: '0 1.5rem 1rem 1.5rem',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {videos.map(video => (
          <div key={video.id} style={{ scrollSnapAlign: 'start' }}>
            <ExploreVideoCard video={video} onClick={onVideoClick} />
          </div>
        ))}
      </div>
    </div>
  );
}
