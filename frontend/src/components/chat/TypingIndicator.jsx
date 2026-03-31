import React, { useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';

/**
 * TypingIndicator
 * ───────────────
 * Props:
 *   isActive  — show the indicator
 *   isAI      — render the Lumio AI "thinking" variant (teal, slower dots, label)
 *
 * Human variant: purple bouncing dots + typing sound (unchanged)
 * AI variant:    teal dots + sparkle icon + "Lumio is thinking…" text, no sound
 */
const TypingIndicator = ({ isActive = false, isAI = false }) => {
  const audioRef = useRef(null);

  // Only play typing sound for human typing, not AI
  useEffect(() => {
    if (isActive && !isAI && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  }, [isActive, isAI]);

  if (!isActive) return null;

  // ── AI thinking variant ────────────────────────────────────────────────────
  if (isAI) {
    return (
      <div className="self-start mb-4 max-w-[75%]">
        <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-[#0c2020] border border-teal-500/20 flex items-center gap-2 w-fit">
          <Sparkles size={12} className="text-teal-400 shrink-0" />

          <div className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full bg-teal-400 animate-bounce"
              style={{ animationDelay: '0ms', animationDuration: '900ms' }}
            />
            <div
              className="w-2 h-2 rounded-full bg-teal-400 animate-bounce"
              style={{ animationDelay: '200ms', animationDuration: '900ms' }}
            />
            <div
              className="w-2 h-2 rounded-full bg-teal-400 animate-bounce"
              style={{ animationDelay: '400ms', animationDuration: '900ms' }}
            />
          </div>

          <span className="text-teal-300/70 text-[11px] font-medium tracking-wide">
            Lumio is thinking…
          </span>
        </div>
      </div>
    );
  }

  // ── Human typing variant (original, unchanged) ─────────────────────────────
  return (
    <div className="self-start mb-4 max-w-[75%]">
      <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-[#1a1a1a] border border-gray-800 flex items-center gap-1.5 w-fit">
        <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>

      <audio ref={audioRef} preload="auto">
        <source src="/sounds/typing.mp3" type="audio/mpeg" />
      </audio>
    </div>
  );
};

export default TypingIndicator;