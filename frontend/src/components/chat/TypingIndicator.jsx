import React, { useEffect, useRef } from 'react';

const TypingIndicator = ({ isActive = false }) => {
  const audioRef = useRef(null);

  useEffect(() => {
    if (isActive && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  }, [isActive]);

  if (!isActive) return null;

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