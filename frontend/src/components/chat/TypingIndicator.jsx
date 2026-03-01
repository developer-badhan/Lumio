import React, { useEffect, useRef } from "react";

const TypingIndicator = ({ username = "User", isActive = false }) => {
  const audioRef = useRef(null);

  // Play sound when typing becomes active
  useEffect(() => {
    if (isActive && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Prevent autoplay crash in some browsers
      });
    }
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div className="flex items-end mb-4 animate-[fadeIn_0.25s_ease-out]">
      
      {/* Bubble */}
      <div
        className="
          relative 
          bg-[#1d1736] 
          border border-purple-500/10 
          px-4 py-3 
          rounded-2xl 
          rounded-bl-none 
          shadow-md shadow-purple-900/20
          backdrop-blur-sm
        "
      >
        {/* Text */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-purple-300/70 font-medium">
            {username} is typing...
          </span>

          {/* Animated Dots */}
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
          </div>
        </div>

        {/* Soft glow layer */}
        <div className="absolute inset-0 bg-purple-500/5 blur-xl rounded-2xl pointer-events-none" />
      </div>

      {/* Sound file */}
      <audio ref={audioRef} preload="auto">
        {/* Replace with your own sound file path if needed */}
        <source src="/sounds/typing.mp3" type="audio/mpeg" />
      </audio>
    </div>
  );
};

export default TypingIndicator;