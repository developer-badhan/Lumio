import React, { useEffect } from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { useCall } from '../../hooks/useCall';
import Avatar from '../ui/Avatar';

// ── Ringtone via Web Audio API ────────────────────────────────────────────────
// Generates a classic two-tone ring pattern (480 Hz → 440 Hz, 0.5 s on, 1.2 s off).
// Returns a stop() function that the caller uses to clean up on unmount.
const startRingtone = () => {
  const AudioContextClass =
    window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass) return () => {};

  const ctx = new AudioContextClass();
  let active = true;

  const playOnce = () => {
    if (!active) return;

    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    // Two-tone sweep: 480 Hz → 440 Hz over 500 ms
    osc.frequency.setValueAtTime(480, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(440, ctx.currentTime + 0.25);

    // Fade in then out
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.25, ctx.currentTime + 0.4);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);

    // Schedule next ring 1.2 s after this one started
    setTimeout(() => { if (active) playOnce(); }, 1200);
  };

  playOnce();

  return () => {
    active = false;
    ctx.close().catch(() => {});
  };
};

const IncomingCall = () => {
  const { incomingCall, acceptCall, rejectCall } = useCall();

  // Start ringtone when component mounts; stop when it unmounts (accept/reject)
  useEffect(() => {
    const stop = startRingtone();
    return stop;
  }, []);

  if (!incomingCall) return null;

  const { callType, caller, groupName, conversationType } = incomingCall;
  const isVideo    = callType === 'video';
  const isGroup    = conversationType === 'group';
  const callerName = isGroup ? (groupName || 'Group Call') : (caller?.name || 'Unknown');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center
      bg-black/85 backdrop-blur-sm">

      {/* Card */}
      <div className="relative flex flex-col items-center px-10 py-10
        bg-gradient-to-b from-[#18122b] to-[#0f0c1e]
        border border-purple-500/25 rounded-3xl shadow-2xl
        shadow-purple-900/40 w-full max-w-sm mx-4 overflow-hidden">

        {/* Subtle background glow behind avatar */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64
          rounded-full bg-purple-700/10 blur-3xl pointer-events-none" />

        {/* Animated pulsing rings — visual "ringing" cue */}
        <div className="relative mb-6">
          {/* Outer pulse ring */}
          <span className="absolute inset-0 rounded-full
            bg-purple-500/15 animate-ping" />
          {/* Middle pulse ring — delayed */}
          <span className="absolute inset-0 rounded-full
            bg-purple-500/10 animate-ping [animation-delay:300ms]" />

          {/* Avatar */}
          <div className="relative z-10 rounded-full ring-2 ring-purple-500/40">
            <Avatar
              src={caller?.profilePic}
              name={callerName}
              size="xl"
              className="w-24 h-24"
            />
          </div>
        </div>

        {/* Caller name */}
        <h2 className="text-white text-2xl font-bold tracking-wide text-center">
          {callerName}
        </h2>

        {/* Call type label */}
        <p className="mt-1.5 text-purple-400 text-sm flex items-center gap-1.5">
          {isVideo ? <Video size={13} /> : <Phone size={13} />}
          Incoming {isVideo ? 'video' : 'audio'} call
        </p>

        {/* Subtle animated dots to indicate ringing */}
        <div className="flex gap-1.5 mt-3">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-purple-400/60 animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-10 mt-10">

          {/* Decline */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={rejectCall}
              className="w-16 h-16 rounded-full flex items-center justify-center
                bg-red-500/15 hover:bg-red-500/30 border border-red-500/30
                text-red-400 hover:text-red-300 transition-all duration-200
                hover:scale-105 active:scale-95 shadow-lg shadow-red-900/20"
            >
              <PhoneOff size={26} />
            </button>
            <span className="text-xs text-gray-500">Decline</span>
          </div>

          {/* Accept */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={acceptCall}
              className="w-16 h-16 rounded-full flex items-center justify-center
                bg-gradient-to-br from-purple-600 to-purple-800
                hover:from-purple-500 hover:to-purple-700
                text-white transition-all duration-200
                hover:scale-105 active:scale-95
                shadow-lg shadow-purple-900/40"
            >
              {isVideo ? <Video size={26} /> : <Phone size={26} />}
            </button>
            <span className="text-xs text-gray-500">Accept</span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default IncomingCall;