import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Trash2, Send, RotateCcw, Play, Pause, MicOff, Loader2 } from 'lucide-react';

/**
 * VoiceRecorder — Definitive Rewrite
 * ─────────────────────────────────────
 *
 * B1 FIXED — MIME_TYPE='' caused MediaRecorder constructor to throw NotSupportedError.
 *   Was: new MediaRecorder(stream, { mimeType: '' }) → throws → catch showed
 *        "Microphone access denied" even though mic was fine.
 *   Fix: Only pass mimeType option when MIME_TYPE is non-empty.
 *
 * B2 FIXED — ResizeObserver never stored → never disconnected → fired startDrawing
 *   on stale unmounted canvas after component died.
 *   Fix: Stored in roRef, disconnected in cleanup.
 *
 * B3 FIXED — AudioContext created but never closed → memory leak per recording.
 *   Fix: audioCtxRef stored, closed in cleanup.
 *
 * B4 FIXED — cleanup() called inside r.onstop AND again in useEffect cleanup.
 *   On some browsers, stopping already-stopped tracks throws.
 *   Fix: cleanup only called in useEffect return. onstop just builds the file.
 *
 * B5 FIXED — amplitudeHistory stored sum/COUNT (average across all bins ~0.05–0.15).
 *   review bars: 0.1 * 36 = 3.6px → completely flat waveform in review.
 *   Fix: Store peak amplitude per frame (max bin / 255), not average.
 *        Peak values are in 0.3–1.0 range when speaking → visible bars.
 *
 * B6 FIXED — loadedmetadata may fire before useEffect([objectUrl]) listener attaches.
 *   Fix: After adding listener, check audio.readyState >= 1 (HAVE_METADATA).
 *        If already loaded, read duration directly without waiting for event.
 */

// ─── B1 FIX: safe MIME detection ──────────────────────────────────────────────
const MIME_TYPE = (() => {
  try {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg',
      'audio/mp4',
    ];
    return types.find(t => MediaRecorder.isTypeSupported(t)) ?? null;
  } catch {
    return null;
  }
})();

const fmt = (s) => {
  if (!s || isNaN(s) || !isFinite(s)) return '0:00';
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(Math.floor(s % 60)).toString().padStart(2, '0')}`;
};

// Cross-browser rounded bar — avoids ctx.roundRect (not in Firefox < 112)
const drawBar = (ctx, x, y, w, h, r) => {
  if (h <= 0 || w <= 0) return;
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
};


// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 1 — RECORDING
// ═══════════════════════════════════════════════════════════════════════════════
const RecordingPhase = ({ onDiscard, onStopAndReview, isSending }) => {
  const [recordingTime, setRecordingTime] = useState(0);
  const [error,         setError]         = useState(null);

  // Refs — never cause re-renders, survive across frames
  const wrapperRef       = useRef(null);
  const canvasRef        = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef        = useRef([]);
  const streamRef        = useRef(null);
  const analyserRef      = useRef(null);
  const audioCtxRef      = useRef(null);   // B3 FIX: track to close
  const animFrameRef     = useRef(null);
  const roRef            = useRef(null);   // B2 FIX: track ResizeObserver
  const timerRef         = useRef(null);
  const peakHistoryRef   = useRef([]);     // B5 FIX: peak values per frame
  const MAX_HISTORY      = 150;
  const isMountedRef     = useRef(true);

  // B4 FIX: single cleanup — only called from useEffect return
  const cleanup = useCallback(() => {
    isMountedRef.current = false;
    clearInterval(timerRef.current);
    cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = null;
    roRef.current?.disconnect();          // B2 FIX
    roRef.current = null;
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioCtxRef.current?.close();         // B3 FIX
    audioCtxRef.current = null;
  }, []);

  // Canvas draw loop — called only after wrapper has real dimensions
  const startDrawing = useCallback((W, H) => {
    const canvas   = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser || W === 0) return;

    const dpr     = window.devicePixelRatio || 1;
    canvas.width  = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);

    const ctx    = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const data   = new Uint8Array(analyser.frequencyBinCount);
    const BAR_W  = 3;
    const GAP    = 2;
    const COUNT  = Math.max(1, Math.floor(W / (BAR_W + GAP)));

    const draw = () => {
      if (!isMountedRef.current) return;
      analyser.getByteFrequencyData(data);
      ctx.clearRect(0, 0, W, H);

      // B5 FIX: track PEAK bin per frame, not average
      let peak = 0;

      for (let i = 0; i < COUNT; i++) {
        const bin   = Math.floor((i / COUNT) * data.length);
        const ratio = data[bin] / 255;
        if (ratio > peak) peak = ratio;

        const barH  = Math.max(3, ratio * H * 0.9);
        const x     = i * (BAR_W + GAP);
        const y     = (H - barH) / 2;
        const alpha = 0.4 + ratio * 0.6;

        ctx.fillStyle = `rgba(168, 85, 247, ${alpha})`;
        drawBar(ctx, x, y, BAR_W, barH, 2);
      }

      // B5 FIX: push peak (0–1), not averaged-down value
      peakHistoryRef.current.push(Math.max(0.05, peak));
      if (peakHistoryRef.current.length > MAX_HISTORY) {
        peakHistoryRef.current.shift();
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!isMountedRef.current) { stream.getTracks().forEach(t => t.stop()); return; }

        streamRef.current = stream;

        // AudioContext for analyser
        const audioCtx = new AudioContext();
        audioCtxRef.current = audioCtx;           // B3 FIX: stored for close()
        const source   = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize               = 256;
        analyser.smoothingTimeConstant = 0.5;
        source.connect(analyser);
        analyserRef.current = analyser;

        // B2 FIX: store ResizeObserver in ref for cleanup
        const wrapper = wrapperRef.current;
        if (wrapper) {
          const ro = new ResizeObserver((entries) => {
            const { width, height } = entries[0].contentRect;
            if (width > 0 && !animFrameRef.current) {
              startDrawing(Math.floor(width), Math.floor(height) || 40);
            }
          });
          ro.observe(wrapper);
          roRef.current = ro;
        }

        // B1 FIX: only pass mimeType when non-null/non-empty
        const recorderOpts = MIME_TYPE ? { mimeType: MIME_TYPE } : {};
        const recorder     = new MediaRecorder(stream, recorderOpts);
        mediaRecorderRef.current = recorder;
        chunksRef.current = [];

        recorder.ondataavailable = e => {
          if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
        };

        // onstop: build file → hand to review (B4 FIX: no cleanup here)
        recorder.onstop = () => {
          if (!isMountedRef.current) return;
          const mimeUsed = MIME_TYPE || 'audio/webm';
          const blob = new Blob(chunksRef.current, { type: mimeUsed });
          const file = new File([blob], `voice-${Date.now()}.webm`, { type: mimeUsed });
          onStopAndReview(file, [...peakHistoryRef.current]);
        };

        recorder.start(100);
        timerRef.current = setInterval(() => {
          if (isMountedRef.current) setRecordingTime(t => t + 1);
        }, 1000);

      } catch (err) {
        if (!isMountedRef.current) return;
        // B1 FIX: distinguish mic denied vs other errors
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError('Microphone access denied. Please allow mic in browser settings.');
        } else {
          setError(`Recording failed: ${err.message || 'Unknown error'}`);
        }
      }
    })();

    return cleanup;   // B4 FIX: cleanup only here, not inside onstop
  }, [startDrawing, cleanup, onStopAndReview]);

  const handleDiscard = () => {
    const r = mediaRecorderRef.current;
    if (r && r.state !== 'inactive') {
      r.onstop = null;  // prevent onstop from firing onStopAndReview
      r.stop();
    }
    onDiscard();
    // cleanup runs via useEffect return on unmount
  };

  const handleStop = () => {
    const r = mediaRecorderRef.current;
    if (!r || r.state === 'inactive') return;
    r.stop(); // onstop handler will call onStopAndReview
  };

  if (error) {
    return (
      <div className="flex items-center gap-3 w-full bg-[#111] border border-red-500/30 rounded-2xl px-4 py-3">
        <MicOff size={18} className="text-red-400 shrink-0" />
        <span className="text-red-400 text-xs flex-1">{error}</span>
        <button onClick={onDiscard} className="text-gray-500 hover:text-red-400 transition-colors shrink-0">
          <Trash2 size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 w-full bg-[#111] border border-purple-500/40 rounded-2xl px-3 py-2.5">

      {/* Discard */}
      <button
        onClick={handleDiscard}
        className="text-gray-500 hover:text-red-400 transition-colors shrink-0 p-1"
        title="Discard recording"
      >
        <Trash2 size={18} />
      </button>

      {/* Red dot + timer */}
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-white font-mono text-xs tabular-nums w-10 select-none">
          {fmt(recordingTime)}
        </span>
      </div>

      {/* Canvas waveform — wrapper div measures, canvas fills it */}
      <div ref={wrapperRef} className="flex-1 h-10 relative min-w-0">
        <canvas
          ref={canvasRef}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        />
      </div>

      {/* Stop recording → go to review */}
      <button
        onClick={handleStop}
        disabled={isSending}
        className="w-9 h-9 bg-gradient-to-r from-purple-500 to-purple-700 rounded-full flex items-center justify-center hover:opacity-90 transition-opacity shrink-0 disabled:opacity-50"
        title="Preview & send"
      >
        {isSending
          ? <Loader2 size={15} className="text-white animate-spin" />
          : <Send size={15} className="ml-0.5 text-white" />
        }
      </button>

    </div>
  );
};


// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 2 — REVIEW (preview before sending)
// ═══════════════════════════════════════════════════════════════════════════════
const ReviewPhase = ({ file, peakHistory, onReRecord, onSend, isSending }) => {
  const [objectUrl,   setObjectUrl]   = useState(null);
  const [isPlaying,   setIsPlaying]   = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration,    setDuration]    = useState(0);

  const audioRef = useRef(null);
  const trackRef = useRef(null);

  // Create object URL — revoke on unmount
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // B6 FIX: wire audio events AND check if metadata already loaded
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !objectUrl) return;

    const onMeta  = () => {
      if (isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };
    const onTime  = () => setCurrentTime(audio.currentTime);
    const onEnded = () => { setIsPlaying(false); setCurrentTime(0); };

    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('timeupdate',     onTime);
    audio.addEventListener('ended',          onEnded);

    // B6 FIX: metadata may have already loaded before listener was attached
    if (audio.readyState >= 1 && isFinite(audio.duration) && audio.duration > 0) {
      setDuration(audio.duration);
    }

    return () => {
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('timeupdate',     onTime);
      audio.removeEventListener('ended',          onEnded);
    };
  }, [objectUrl]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(console.error);
      setIsPlaying(true);
    }
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    const track = trackRef.current;
    if (!audio || !track || !duration) return;
    const rect  = track.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * duration;
    setCurrentTime(audio.currentTime);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // B5 FIX: bars sourced from peak history → visible heights (0.3–1.0 range)
  const BAR_COUNT = 50;
  const bars = Array.from({ length: BAR_COUNT }, (_, i) => {
    if (!peakHistory?.length) return 0.3;
    const idx   = Math.floor((i / BAR_COUNT) * peakHistory.length);
    const peak  = peakHistory[Math.min(idx, peakHistory.length - 1)] ?? 0.3;
    return Math.min(1, Math.max(0.07, peak));
  });

  return (
    <div className="flex items-center gap-2.5 w-full bg-[#111] border border-purple-500/30 rounded-2xl px-3 py-2.5">

      {/* Hidden audio element — only rendered after URL is set (B6 FIX) */}
      {objectUrl && (
        <audio ref={audioRef} src={objectUrl} preload="auto" />
      )}

      {/* Re-record */}
      <button
        onClick={onReRecord}
        disabled={isSending}
        className="text-gray-500 hover:text-purple-400 transition-colors shrink-0 p-1 disabled:opacity-40"
        title="Re-record"
      >
        <RotateCcw size={17} />
      </button>

      {/* Play / Pause */}
      <button
        onClick={togglePlay}
        disabled={isSending}
        className="w-9 h-9 bg-purple-500/25 hover:bg-purple-500/40 rounded-full flex items-center justify-center transition-colors shrink-0 disabled:opacity-40"
        title={isPlaying ? 'Pause' : 'Play preview'}
      >
        {isPlaying
          ? <Pause size={14} className="text-white" />
          : <Play  size={14} className="ml-0.5 text-white" />
        }
      </button>

      {/* Waveform preview + timestamp */}
      <div className="flex-1 flex flex-col gap-0.5 min-w-0">

        {/* Clickable bars — purple = played, dim = remaining */}
        <div
          ref={trackRef}
          className="flex items-center gap-[2px] h-9 cursor-pointer select-none"
          onClick={!isSending ? handleSeek : undefined}
          title="Click to seek"
        >
          {bars.map((peak, i) => {
            const barH   = Math.max(4, peak * 34);
            const filled = (i / BAR_COUNT) * 100 < progress;
            return (
              <div
                key={i}
                className={`flex-1 rounded-full ${
                  filled ? 'bg-purple-400' : 'bg-white/20'
                }`}
                style={{ height: `${barH}px` }}
              />
            );
          })}
        </div>

        {/* Timestamps */}
        <div className="flex justify-between text-[10px] text-white/40 select-none tabular-nums px-0.5">
          <span>{fmt(currentTime)}</span>
          <span>{fmt(duration)}</span>
        </div>

      </div>

      {/* Send */}
      <button
        onClick={() => !isSending && onSend(file)}
        disabled={isSending}
        className="w-9 h-9 bg-gradient-to-r from-purple-500 to-purple-700 rounded-full flex items-center justify-center hover:opacity-90 disabled:opacity-50 transition-opacity shrink-0"
        title="Send voice message"
      >
        {isSending
          ? <Loader2 size={15} className="text-white animate-spin" />
          : <Send size={15} className="ml-0.5 text-white" />
        }
      </button>

    </div>
  );
};


// ═══════════════════════════════════════════════════════════════════════════════
// ROOT — manages phase state
// ═══════════════════════════════════════════════════════════════════════════════
const VoiceRecorder = ({ onCancel, onSend, isSending = false }) => {
  const [phase,       setPhase]       = useState('recording');
  const [audioFile,   setAudioFile]   = useState(null);
  const [peakHistory, setPeakHistory] = useState([]);

  const handleStopAndReview = useCallback((file, history) => {
    setAudioFile(file);
    setPeakHistory(history);
    setPhase('review');
  }, []);

  const handleReRecord = useCallback(() => {
    setAudioFile(null);
    setPeakHistory([]);
    setPhase('recording');
  }, []);

  if (phase === 'recording') {
    return (
      <RecordingPhase
        onDiscard={onCancel}
        onStopAndReview={handleStopAndReview}
        isSending={isSending}
      />
    );
  }

  return (
    <ReviewPhase
      file={audioFile}
      peakHistory={peakHistory}
      onReRecord={handleReRecord}
      onSend={onSend}
      isSending={isSending}
    />
  );
};

export default VoiceRecorder;