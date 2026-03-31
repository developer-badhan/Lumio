import React from 'react';
import {
  Mic, MicOff,
  Video, VideoOff,
  PhoneOff,
} from 'lucide-react';
import { useCall } from '../../hooks/useCall';

/* *
  CallControls.jsx
  ──────────────────────────────────────────────────────────────────────────────
  Renders the call control buttons (mute/unmute mic, toggle camera, end call).
  The camera toggle button is only shown for video calls. The end call button
  is always centered and styled in red to indicate its importance.
  The component uses the useCall hook to access call state and actions, and
  applies conditional styling based on the current state (e.g., muted, camera off).
  Note: The actual call logic (e.g., handling media streams, signaling) is
  managed by the useCall hook and is not implemented in this component.
*/


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