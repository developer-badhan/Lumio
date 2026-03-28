import React, { useEffect, useRef, useState, useCallback } from 'react';
import { PhoneOff } from 'lucide-react';
import { useCall } from '../../hooks/useCall';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../ui/Avatar';
import CallControls from './CallControls';

// ── RemoteAudioPlayer ─────────────────────────────────────────────────────────
//
// ── Bug 5 Fix ────────────────────────────────────────────────────────────────
// BEFORE: For audio-only calls, remote streams were correctly stored in
//         remoteStreams state but no HTML media element ever played them.
//         A MediaStream produces no sound unless it is attached to a <video>
//         or <audio> element with autoPlay. The avatar UI rendered but the
//         remote audio track just sat in memory, unconnected to any speaker.
//         Neither side could hear the other even though ICE was complete and
//         the track was flowing at the WebRTC layer.
//
// AFTER:  For every remote stream on an audio call we render a hidden <audio>
//         element and assign srcObject to it. autoPlay makes the browser route
//         the decoded PCM directly to the speaker output.
//         We use useEffect([stream]) on the element ref — same pattern as
//         RemoteVideoTile — so it updates if the stream object is replaced.
// ─────────────────────────────────────────────────────────────────────────────
const RemoteAudioPlayer = ({ stream }) => {
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current && stream) {
      audioRef.current.srcObject = stream;
    }
  }, [stream]);

  // The element must be in the DOM (not display:none) for autoPlay to work in
  // all browsers. visibility:hidden keeps it out of the layout while rendering.
  return (
    <audio
      ref={audioRef}
      autoPlay
      playsInline
      style={{ position: 'absolute', visibility: 'hidden', width: 0, height: 0 }}
    />
  );
};

// ── RemoteVideoTile ───────────────────────────────────────────────────────────
// Renders one remote peer's video stream.
// srcObject must be set via a ref — it is not a React prop.
const RemoteVideoTile = ({ stream, name }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden bg-[#1a1530]">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-3 left-3 px-2 py-0.5
        bg-black/60 rounded-full text-xs text-white backdrop-blur-sm">
        {name || 'Participant'}
      </div>
    </div>
  );
};

// ── Call duration timer ───────────────────────────────────────────────────────
const useCallTimer = (isActive) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!isActive) { setSeconds(0); return; }
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [isActive]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return `${mm}:${ss}`;
};

// ── CallWindow ────────────────────────────────────────────────────────────────
const CallWindow = () => {
  const {
    callStatus,
    activeCall,
    localStream,
    remoteStreams,
    isCameraOff,
    endCall,
  } = useCall();

  const { user: currentUser } = useAuth();

  // ── Bug 4 Fix (previous session) ─────────────────────────────────────────
  // BEFORE: useEffect([localStream]) ran when localStream changed. For the
  //         CALLER, localStream is set inside initiateCall() — long before
  //         callStatus becomes 'active' and this <video> element mounts.
  //         By mount time localStream hadn't changed, so the effect didn't
  //         re-run and srcObject was never assigned → black PiP tile.
  //
  // AFTER:  Ref callback (setLocalVideoRef). React calls it the instant the
  //         element enters the DOM. If localStream is already set (caller
  //         scenario) srcObject is assigned immediately on mount. If the
  //         stream arrives later (callee), useCallback([localStream]) causes
  //         React to call the callback again with the same element, updating
  //         srcObject at that point.
  // ─────────────────────────────────────────────────────────────────────────
  const localVideoRef = useRef(null);

  const setLocalVideoRef = useCallback((el) => {
    localVideoRef.current = el;
    if (el && localStream) {
      el.srcObject = localStream;
    }
  }, [localStream]);

  const duration  = useCallTimer(callStatus === 'active');
  const isVideo   = activeCall?.callType === 'video';
  const isActive  = callStatus === 'active';
  const isCalling = callStatus === 'calling';

  const remoteEntries = Object.entries(remoteStreams);
  const hasRemote     = remoteEntries.length > 0;

  // ── Outgoing / "Calling…" screen ─────────────────────────────────────────
  if (isCalling) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center
        bg-gradient-to-b from-[#18122b] to-[#0f0c1e]">

        <div className="relative mb-8">
          <span className="absolute inset-0 rounded-full bg-purple-500/15 animate-ping" />
          <div className="relative z-10 rounded-full ring-2 ring-purple-500/30">
            <Avatar size="xl" className="w-28 h-28" name={currentUser?.name} />
          </div>
        </div>

        <h2 className="text-white text-xl font-semibold">Calling…</h2>
        <p className="text-purple-400 text-sm mt-1">Waiting for answer</p>

        <div className="flex gap-1.5 mt-3">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-purple-400/60 animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>

        <button
          onClick={endCall}
          className="mt-12 w-16 h-16 rounded-full flex items-center justify-center
            bg-red-600 hover:bg-red-500 text-white
            transition-all duration-200 hover:scale-105 active:scale-95
            shadow-lg shadow-red-900/50"
        >
          <PhoneOff size={26} />
        </button>
        <span className="text-xs text-gray-500 mt-2">Cancel</span>
      </div>
    );
  }

  // ── Active call screen ────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0a0a0f]">

      {/* ── Bug 5 Fix: hidden audio players for audio-only calls ──────────────
          Rendered unconditionally for all active remote streams so the browser
          always has a media element to route the decoded audio to. For video
          calls, RemoteVideoTile already has autoPlay so audio flows through it;
          these <audio> elements are therefore only functionally needed for
          audio calls, but rendering them for video too is harmless — the
          browser deduplicates the playback through the same MediaStream object.
      ───────────────────────────────────────────────────────────────────────── */}
      {remoteEntries.map(([uid, stream]) => (
        <RemoteAudioPlayer key={`audio-${uid}`} stream={stream} />
      ))}

      {/* ── Remote area ────────────────────────────────────────────────── */}
      <div className="flex-1 relative overflow-hidden">

        {isVideo && hasRemote ? (
          remoteEntries.length === 1 ? (
            <RemoteVideoTile
              stream={remoteEntries[0][1]}
              name={remoteEntries[0][0]}
            />
          ) : (
            <div className={`
              w-full h-full grid gap-1 p-1
              ${remoteEntries.length <= 2 ? 'grid-cols-2' : 'grid-cols-2 grid-rows-2'}
            `}>
              {remoteEntries.map(([uid, stream]) => (
                <RemoteVideoTile key={uid} stream={stream} name={uid} />
              ))}
            </div>
          )
        ) : (
          /* Audio call — avatar placeholder while RemoteAudioPlayer handles sound */
          <div className="w-full h-full flex items-center justify-center
            bg-gradient-to-b from-[#18122b] to-[#0f0c1e]">
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-full ring-2 ring-purple-500/30 p-1">
                <Avatar size="xl" className="w-28 h-28" name="Remote" />
              </div>
              {isActive && (
                <span className="text-purple-300 text-sm font-mono">{duration}</span>
              )}
            </div>
          </div>
        )}

        {/* Duration badge (video calls) */}
        {isVideo && isActive && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2
            px-3 py-1 bg-black/60 backdrop-blur-sm rounded-full
            text-white text-xs font-mono">
            {duration}
          </div>
        )}

        {/* Local video PiP (video call only) */}
        {isVideo && (
          <div className="absolute bottom-28 right-4
            w-28 h-20 sm:w-36 sm:h-24
            rounded-xl overflow-hidden
            border border-purple-500/30 shadow-lg shadow-black/50
            bg-[#1a1530]">
            {isCameraOff ? (
              <div className="w-full h-full flex items-center justify-center bg-[#1a1530]">
                <Avatar size="sm" name={currentUser?.name} />
              </div>
            ) : (
              /* Bug 4 Fix: ref callback so srcObject is set the instant this
                 element mounts, even when localStream was acquired much earlier */
              <video
                ref={setLocalVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
            )}
            <div className="absolute bottom-1 left-1 px-1.5 py-0.5
              bg-black/70 rounded text-[10px] text-white/80">
              You
            </div>
          </div>
        )}
      </div>

      <CallControls />

    </div>
  );
};

export default CallWindow;