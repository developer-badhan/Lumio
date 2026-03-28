import React from 'react';
import {
  Mic, MicOff,
  Video, VideoOff,
  PhoneOff,
} from 'lucide-react';
import { useCall } from '../../hooks/useCall';

const CallControls = () => {
  const {
    activeCall,
    callStatus,
    isMuted,
    isCameraOff,
    toggleMic,
    toggleCamera,
    endCall,
  } = useCall();

  const isVideoCall = activeCall?.callType === 'video';

  return (
    <div className="flex items-center justify-center gap-4 py-6 px-6
      bg-gradient-to-t from-black/80 to-transparent">

      {/* ── Mute / Unmute mic ─────────────────────────────────────────── */}
      <button
        onClick={toggleMic}
        title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        className={`
          w-14 h-14 rounded-full flex items-center justify-center
          transition-all duration-200 hover:scale-105 active:scale-95
          ${isMuted
            ? 'bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30'
            : 'bg-white/10  border border-white/15  text-white     hover:bg-white/20'
          }
        `}
      >
        {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
      </button>

      {/* ── End call (always center, always red) ─────────────────────── */}
      <button
        onClick={endCall}
        title="End call"
        className="w-16 h-16 rounded-full flex items-center justify-center
          bg-red-600 hover:bg-red-500 text-white
          transition-all duration-200 hover:scale-105 active:scale-95
          shadow-lg shadow-red-900/50"
      >
        <PhoneOff size={26} />
      </button>

      {/* ── Toggle camera (only rendered for video calls) ─────────────── */}
      {isVideoCall && (
        <button
          onClick={toggleCamera}
          title={isCameraOff ? 'Turn on camera' : 'Turn off camera'}
          className={`
            w-14 h-14 rounded-full flex items-center justify-center
            transition-all duration-200 hover:scale-105 active:scale-95
            ${isCameraOff
              ? 'bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30'
              : 'bg-white/10  border border-white/15  text-white     hover:bg-white/20'
            }
          `}
        >
          {isCameraOff ? <VideoOff size={22} /> : <Video size={22} />}
        </button>
      )}

    </div>
  );
};

export default CallControls;