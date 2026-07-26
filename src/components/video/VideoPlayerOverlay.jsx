import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Clock, Share2, AlertCircle, Dumbbell, Flame } from 'lucide-react';
import { saveWatchProgress, getProgressForVideo, toggleFavorite, isFavorite, toggleWatchLater, isWatchLater } from '../../services/videoHistory';

export default function VideoPlayerOverlay({ video, onClose }) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const timerRef = useRef(null);
  
  const [isFav, setIsFav] = useState(false);
  const [isWL, setIsWL] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const youtubeVideoId = video?.videoId;

  useEffect(() => {
    if (!video) return;
    setIsFav(isFavorite(video.id));
    setIsWL(isWatchLater(video.id));
  }, [video]);

  // Load YouTube IFrame API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      
      window.onYouTubeIframeAPIReady = () => setScriptLoaded(true);
    } else {
      setScriptLoaded(true);
    }
  }, []);

  // Initialize Player
  useEffect(() => {
    if (!scriptLoaded || !video || !youtubeVideoId) return;

    const startSeconds = getProgressForVideo(video.id) || 0;

    playerRef.current = new window.YT.Player('yt-player-container', {
      height: '100%',
      width: '100%',
      videoId: youtubeVideoId,
      playerVars: {
        autoplay: 1,
        start: Math.floor(startSeconds),
        modestbranding: 1,
        rel: 0,
        playsinline: 1,
      },
      events: {
        onStateChange: handlePlayerStateChange,
      }
    });

    return () => {
      saveCurrentProgress();
      if (timerRef.current) clearInterval(timerRef.current);
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        playerRef.current.destroy();
      }
    };
  }, [scriptLoaded, video, youtubeVideoId]);

  const saveCurrentProgress = () => {
    if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
      const currentTime = playerRef.current.getCurrentTime();
      const duration = playerRef.current.getDuration();
      if (duration > 0) {
        saveWatchProgress(video.id, currentTime, duration);
      }
    }
  };

  const handlePlayerStateChange = (event) => {
    // 1 = PLAYING, 2 = PAUSED, 0 = ENDED
    if (event.data === window.YT.PlayerState.PLAYING) {
      // Save every 30 seconds while playing
      timerRef.current = setInterval(() => {
        saveCurrentProgress();
      }, 30000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      saveCurrentProgress(); // Save immediately on pause/end
    }
  };

  const handleToggleFav = () => setIsFav(toggleFavorite(video.id));
  const handleToggleWL = () => setIsWL(toggleWatchLater(video.id));

  if (!video) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: '100%' }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'var(--bg-base)', zIndex: 9999,
          display: 'flex', flexDirection: 'column',
          overflowY: 'auto'
        }}
      >
        {/* Sticky Header */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)'
        }}>
          <button onClick={onClose} className="btn-icon" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <X size={24} />
          </button>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={handleToggleWL} className="btn-icon" style={{ background: 'rgba(255,255,255,0.1)', color: isWL ? 'var(--primary-500)' : '#fff' }}>
              <Clock size={20} />
            </button>
            <button onClick={handleToggleFav} className="btn-icon" style={{ background: 'rgba(255,255,255,0.1)', color: isFav ? 'var(--danger-500)' : '#fff' }}>
              <Heart size={20} fill={isFav ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>

        {/* Video Player Area */}
        <div style={{ width: '100%', aspectRatio: '16/9', background: '#000', flexShrink: 0 }}>
          {youtubeVideoId ? (
            <div id="yt-player-container"></div>
          ) : (
            <div style={{ height: '100%', display: 'grid', placeItems: 'center', padding: '1rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
              This video is unavailable right now.
            </div>
          )}
        </div>

        {/* Content Area */}
        <div style={{ padding: '1.5rem', paddingBottom: '4rem', flex: 1 }}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', padding: '2px 8px', background: 'var(--bg-raised)', borderRadius: 99, textTransform: 'capitalize' }}>
              {video.category}
            </span>
            {video.difficulty && (
              <span style={{ fontSize: '0.75rem', padding: '2px 8px', background: 'var(--bg-raised)', borderRadius: 99, color: 'var(--amber-500)' }}>
                {video.difficulty}
              </span>
            )}
            {video.protein && (
              <span style={{ fontSize: '0.75rem', padding: '2px 8px', background: 'var(--bg-raised)', borderRadius: 99, color: 'var(--blue-400)' }}>
                {video.protein} Protein
              </span>
            )}
          </div>
          
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 1rem', lineHeight: 1.3 }}>{video.title}</h1>

          {video.content && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {video.content.introduction && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6, margin: 0 }}>
                  {video.content.introduction}
                </p>
              )}
              
              {video.content.correctForm && (
                <div className="card" style={{ padding: '1.25rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Dumbbell size={18} color="var(--primary-500)" />
                    Correct Form
                  </h3>
                  <div style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                    {video.content.correctForm}
                  </div>
                </div>
              )}

              {video.content.commonMistakes && (
                <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--danger-500)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={18} color="var(--danger-500)" />
                    Common Mistakes
                  </h3>
                  <div style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                    {video.content.commonMistakes}
                  </div>
                </div>
              )}

              {video.content.ingredients && (
                <div className="card" style={{ padding: '1.25rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 0.5rem' }}>Ingredients</h3>
                  <div style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                    {video.content.ingredients}
                  </div>
                </div>
              )}

              {video.content.instructions && (
                <div className="card" style={{ padding: '1.25rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 0.5rem' }}>Instructions</h3>
                  <div style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                    {video.content.instructions}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
