import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Dumbbell, Flame, CheckCircle, Play } from 'lucide-react';
import { getProgressForVideo } from '../../services/videoHistory';

export default function ExploreVideoCard({ video, onClick }) {
  const progress = getProgressForVideo(video.id);
  const totalSeconds = video.duration.split(':').reduce((acc, time) => (60 * acc) + +time, 0);
  const progressPercent = progress && totalSeconds ? Math.min(100, (progress / totalSeconds) * 100) : 0;
  
  // Calculate duration in minutes if it's formatted like MM:SS
  const mins = video.duration.includes(':') ? video.duration.split(':')[0] + 'm' : video.duration;

  const getDifficultyColor = (diff) => {
    if (!diff) return 'var(--text-secondary)';
    const d = diff.toLowerCase();
    if (d.includes('beginner')) return '#10b981';
    if (d.includes('intermediate')) return 'var(--amber-500)';
    if (d.includes('advanced')) return 'var(--danger-500)';
    return 'var(--text-secondary)';
  };

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(video)}
      style={{
        width: 260,
        flexShrink: 0,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        position: 'relative'
      }}
    >
      {/* Thumbnail Container */}
      <div style={{
        width: '100%',
        aspectRatio: '16/9',
        borderRadius: 'var(--r-lg)',
        overflow: 'hidden',
        position: 'relative',
        background: 'var(--bg-raised)'
      }}>
        <img 
          src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`} 
          alt={video.title}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        
        {/* Play Icon Overlay (visible on hover) */}
        <div className="play-overlay" style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: 0, transition: 'opacity 200ms'
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%', background: 'var(--primary-500)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000'
          }}>
            <Play fill="currentColor" size={24} style={{ marginLeft: 3 }} />
          </div>
        </div>

        {/* Duration Badge */}
        <div style={{
          position: 'absolute', bottom: 8, right: 8,
          background: 'rgba(0,0,0,0.8)', color: '#fff', fontSize: '0.7rem',
          fontWeight: 600, padding: '2px 6px', borderRadius: '4px'
        }}>
          {video.duration}
        </div>

        {/* Progress Bar */}
        {progressPercent > 0 && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 4,
            background: 'rgba(255,255,255,0.2)'
          }}>
            <div style={{
              height: '100%', background: 'var(--primary-500)', width: `${progressPercent}%`
            }} />
          </div>
        )}
      </div>

      {/* Info Container */}
      <div>
        <h3 style={{
          fontSize: '0.9375rem', fontWeight: 600, margin: '0 0 0.25rem',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          overflow: 'hidden', lineHeight: 1.3
        }}>
          {video.title}
        </h3>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {video.difficulty && (
            <span style={{ fontSize: '0.75rem', color: getDifficultyColor(video.difficulty), display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 500 }}>
              <Dumbbell size={12} /> {video.difficulty}
            </span>
          )}
          {video.protein && (
            <span style={{ fontSize: '0.75rem', color: 'var(--blue-400)', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 500 }}>
              <CheckCircle size={12} /> {video.protein} Pro
            </span>
          )}
          {video.calories && (
            <span style={{ fontSize: '0.75rem', color: 'var(--amber-400)', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 500 }}>
              <Flame size={12} /> {video.calories} kcal
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
