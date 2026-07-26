import React, { useRef, useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import ExploreVideoCard from './ExploreVideoCard';

export default function CategoryRow({ title, videos, onVideoClick, onSeeAll }) {
  const scrollRef = useRef(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  if (!videos || videos.length === 0) return null;

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeft(scrollLeft > 20);
      setShowRight(scrollLeft < scrollWidth - clientWidth - 20);
    }
  };

  useEffect(() => {
    handleScroll();
    window.addEventListener('resize', handleScroll);
    return () => window.removeEventListener('resize', handleScroll);
  }, [videos]);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const amount = direction === 'left' ? -300 : 300;
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  return (
    <div style={{ marginBottom: '2rem', position: 'relative' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '1rem', padding: '0 1.5rem'
      }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 800, margin: 0, letterSpacing: '-0.01em' }}>{title}</h2>
        {onSeeAll && (
          <button 
            onClick={onSeeAll}
            className="btn-text" 
            style={{ display: 'flex', alignItems: 'center', fontSize: '0.8125rem', color: 'var(--primary-500)', fontWeight: 700, padding: 0 }}
          >
            See All <ChevronRight size={14} />
          </button>
        )}
      </div>

      {/* Desktop Scroll Arrows */}
      <div className="desktop-only" style={{ display: 'none' }}> {/* Add media query in CSS to show these on desktop later if needed */}
        {showLeft && (
          <button onClick={() => scroll('left')} style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 10, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <ChevronLeft size={20} />
          </button>
        )}
        {showRight && (
          <button onClick={() => scroll('right')} style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 10, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <ChevronRight size={20} />
          </button>
        )}
      </div>

      <div 
        ref={scrollRef}
        onScroll={handleScroll}
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
          <div key={video.id || video.videoId} style={{ scrollSnapAlign: 'start' }}>
            <ExploreVideoCard 
              video={video} 
              progress={video.progress} // Passed from Continue Watching history
              duration={video.duration} // Passed from Continue Watching history
              onClick={onVideoClick} 
            />
          </div>
        ))}
      </div>
    </div>
  );
}
