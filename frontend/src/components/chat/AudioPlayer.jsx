import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';

/**
 * AudioPlayer — Upgraded
 * ──────────────────────
 * New features vs previous version:
 *
 * 1. DRAG SCRUBBING (Spotify/YouTube style)
 *    • onMouseDown / onMouseMove / onMouseUp on the progress track
 *    • onTouchStart / onTouchMove / onTouchEnd for mobile
 *    • Audio pauses while dragging, resumes from new position on release
 *      (only if it was playing before drag started — matches Spotify behaviour)
 *    • Global mousemove/mouseup listeners attached to document during drag
 *      so scrubbing doesn't break if cursor leaves the track element
 *    • transition-all removed from fill bar during drag to avoid lag
 *
 * 2. PLAYBACK SPEED (1x → 1.5x → 1.75x → 2x → back to 1x)
 *    • Cycles through SPEED_STEPS on each click
 *    • Sets audio.playbackRate directly
 *    • Active speed displayed as a small label button
 *
 * 3. SKIP TO START / END
 *    • SkipBack    button → sets currentTime = 0
 *    • SkipForward button → sets currentTime = duration (triggers ended event naturally)
 *
 * Props (unchanged):
 *   src      string   — Cloudinary audio URL from message.media.url
 *   duration number   — pre-known duration from message.media.duration (optional)
 *   isOwn    boolean  — colour theme
 */

const SPEED_STEPS = [1, 1.5, 1.75, 2];

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const AudioPlayer = ({ src, duration: propDuration, isOwn }) => {
  const audioRef = useRef(null);
  const trackRef = useRef(null);

  const [isPlaying,   setIsPlaying]   = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration,    setDuration]    = useState(propDuration || 0);
  const [speedIndex,  setSpeedIndex]  = useState(0);
  const [isDragging,  setIsDragging]  = useState(false);

  // Track whether audio was playing before drag started
  const wasPlayingRef = useRef(false);

  // ── Audio event listeners ─────────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoaded     = () => { if (!propDuration) setDuration(audio.duration); };
    const onTimeUpdate = () => { if (!isDragging) setCurrentTime(audio.currentTime); };
    const onEnded      = () => { setIsPlaying(false); setCurrentTime(0); };

    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('timeupdate',     onTimeUpdate);
    audio.addEventListener('ended',          onEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('timeupdate',     onTimeUpdate);
      audio.removeEventListener('ended',          onEnded);
    };
  }, [propDuration, isDragging]);

  // ── Compute seek ratio from pointer X ────────────────────────────────────
  const getRatioFromClientX = useCallback((clientX) => {
    const track = trackRef.current;
    if (!track) return 0;
    const rect  = track.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    return Math.max(0, Math.min(1, ratio));
  }, []);

  // ── Apply seek to audio ───────────────────────────────────────────────────
  const applySeek = useCallback((ratio) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const newTime     = ratio * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  }, [duration]);

  // ── Global mouse handlers (defined with useCallback for cleanup) ──────────
  const handleMouseMove = useCallback((e) => {
    applySeek(getRatioFromClientX(e.clientX));
  }, [applySeek, getRatioFromClientX]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup',   handleMouseUp);
    if (wasPlayingRef.current) {
      audioRef.current?.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [handleMouseMove]);

  // ── Mouse down on track ───────────────────────────────────────────────────
  const handleMouseDown = (e) => {
    const audio = audioRef.current;
    if (!audio) return;
    wasPlayingRef.current = isPlaying;
    if (isPlaying) audio.pause();
    setIsDragging(true);
    applySeek(getRatioFromClientX(e.clientX));
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup',   handleMouseUp);
  };

  // Cleanup global listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup',   handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // ── Touch handlers ────────────────────────────────────────────────────────
  const handleTouchStart = (e) => {
    const audio = audioRef.current;
    if (!audio) return;
    wasPlayingRef.current = isPlaying;
    if (isPlaying) audio.pause();
    setIsDragging(true);
    applySeek(getRatioFromClientX(e.touches[0].clientX));
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    applySeek(getRatioFromClientX(e.touches[0].clientX));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (wasPlayingRef.current) {
      audioRef.current?.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  // ── Play / Pause ──────────────────────────────────────────────────────────
  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(err => console.error('Audio play failed:', err));
      setIsPlaying(true);
    }
  };

  // ── Skip to start ─────────────────────────────────────────────────────────
  const skipToStart = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    setCurrentTime(0);
  };

  // ── Skip to end ───────────────────────────────────────────────────────────
  const skipToEnd = () => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    audio.currentTime = duration;
    setCurrentTime(duration);
  };

  // ── Cycle playback speed ──────────────────────────────────────────────────
  const cycleSpeed = () => {
    const nextIndex              = (speedIndex + 1) % SPEED_STEPS.length;
    setSpeedIndex(nextIndex);
    if (audioRef.current) audioRef.current.playbackRate = SPEED_STEPS[nextIndex];
  };

  const progress     = duration ? (currentTime / duration) * 100 : 0;
  const currentSpeed = SPEED_STEPS[speedIndex];

  return (
    <div className="flex items-center gap-2 w-64 py-1">

      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Skip to start */}
      <button
        onClick={skipToStart}
        className="text-white/60 hover:text-white transition-colors shrink-0"
        title="Skip to start"
      >
        <SkipBack size={14} />
      </button>

      {/* Play / Pause */}
      <button
        onClick={togglePlay}
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
          isOwn
            ? 'bg-white/20 hover:bg-white/30'
            : 'bg-purple-500/20 hover:bg-purple-500/30'
        }`}
        title={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying
          ? <Pause size={14} className="text-white" />
          : <Play  size={14} className="ml-0.5 text-white" />
        }
      </button>

      {/* Skip to end */}
      <button
        onClick={skipToEnd}
        className="text-white/60 hover:text-white transition-colors shrink-0"
        title="Skip to end"
      >
        <SkipForward size={14} />
      </button>

      {/* Progress track + timestamps */}
      <div className="flex-1 flex flex-col gap-1">

        <div
          ref={trackRef}
          className="h-2 rounded-full cursor-pointer bg-white/20 relative select-none group"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Filled portion */}
          <div
            className={`h-full rounded-full ${isOwn ? 'bg-white' : 'bg-purple-400'} ${
              isDragging ? '' : 'transition-all duration-100'
            }`}
            style={{ width: `${progress}%` }}
          />

          {/* Draggable thumb */}
          <div
            className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full shadow-md
              ${isOwn ? 'bg-white' : 'bg-purple-300'}
              ${isDragging ? 'opacity-100 scale-125' : 'opacity-0 group-hover:opacity-100'}
              transition-all duration-100 pointer-events-none`}
            style={{ left: `calc(${progress}% - 6px)` }}
          />
        </div>

        {/* Time display */}
        <div className="flex justify-between text-[10px] select-none opacity-70">
          <span className="text-white">{formatTime(currentTime)}</span>
          <span className="text-white">{formatTime(duration)}</span>
        </div>

      </div>

      {/* Speed toggle */}
      <button
        onClick={cycleSpeed}
        className={`text-[10px] font-bold shrink-0 px-1.5 py-0.5 rounded transition-colors ${
          currentSpeed !== 1
            ? 'bg-white/20 text-white'
            : 'text-white/50 hover:text-white'
        }`}
        title="Playback speed"
      >
        {currentSpeed}x
      </button>

    </div>
  );
};

export default AudioPlayer;