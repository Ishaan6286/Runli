import React from 'react';
import { PlayCircle, Clock, Dumbbell, Flame } from 'lucide-react';

export default function ExploreVideoCard({ video, progress, duration, onClick }) {
  if (!video) return null;

  // Calculate progress percentage if we have continue watching data
  const progressPercent = progress && duration ? Math.min((progress / duration) * 100, 100) : 0;

  return (
    <div 
      className="video-card"
      onClick={() => onClick(video)}
      style={{
        width: '240px',
        minWidth: '240px',
        flexShrink: 0,
        borderRadius: 'var(--r-xl)',
        overflow: 'hidden',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}
    >
      <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#111' }}>
        <img 
          src={video.thumbnail}
          alt={video.title} 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          loading="lazy"
        />
        
        {/* Play Icon Overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: 0, transition: 'opacity 0.2s',
          className: 'hover-overlay' // We'll add this class logic below if needed, or rely on CSS
        }}>
          <PlayCircle size={40} color="var(--text-inverse)" fill="rgba(0,0,0,0.5)" />
        </div>

        {/* Top Badges */}
        <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 4 }}>
          {video.isNew && (
            <span style={{ 
              background: 'var(--danger-500)', color: 'white', 
              fontSize: '0.65rem', fontWeight: 800, padding: '0.15rem 0.4rem', 
              borderRadius: 4, textTransform: 'uppercase'
            }}>
              New
            </span>
          )}
        </div>

        {/* Bottom Right Duration Badge */}
        <span style={{
          position: 'absolute', bottom: 8, right: 8,
          background: 'rgba(0,0,0,0.8)', color: '#fff',
          fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0.4rem', borderRadius: 4,
          display: 'flex', alignItems: 'center', gap: '0.2rem'
        }}>
          {video.duration}
        </span>
        
        {/* Progress Bar (if in Continue Watching) */}
        {progressPercent > 0 && (
          <div style={{ 
            position: 'absolute', bottom: 0, left: 0, right: 0, 
            height: 4, background: 'rgba(255,255,255,0.3)' 
          }}>
            <div style={{ 
              width: `${progressPercent}%`, height: '100%', 
              background: 'var(--primary-500)' 
            }} />
          </div>
        )}
      </div>

      <div style={{ padding: '0.875rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ 
          fontSize: '0.9375rem', fontWeight: 700, margin: '0 0 0.4rem 0',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          overflow: 'hidden', lineHeight: 1.3
        }}>
          {video.title}
        </h3>
        
        <div style={{ 
          display: 'flex', flexWrap: 'wrap', gap: '0.5rem', 
          fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 'auto'
        }}>
          {video.difficulty && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <Flame size={12} color={video.difficulty === 'Beginner' ? 'var(--green-500)' : video.difficulty === 'Intermediate' ? 'var(--amber-500)' : 'var(--danger-500)'} />
              {video.difficulty}
            </span>
          )}
          {video.muscleGroup && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <Dumbbell size={12} />
              {video.muscleGroup}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
