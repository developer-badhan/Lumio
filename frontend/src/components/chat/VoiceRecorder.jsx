import React, { useEffect, useRef, useState } from "react";
import { Trash2, Mic, Send, Pause, Play } from "lucide-react";
import WaveSurfer from "wavesurfer.js";
import RecordPlugin from "wavesurfer.js/dist/plugins/record.esm.js";

const NUM_BARS = 12; // WhatsApp style

const VoiceRecorder = ({ onCancel, onSend }) => {
  const waveSurferRef = useRef(null);
  const playbackRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const animationFrameRef = useRef(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timer, setTimer] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [barHeights, setBarHeights] = useState(Array(NUM_BARS).fill(5));

  // Initialize WaveSurfer + RecordPlugin
  useEffect(() => {
    if (!waveSurferRef.current) {
      waveSurferRef.current = WaveSurfer.create({
        container: "#waveform",
        waveColor: "rgba(255,255,255,0.2)",
        progressColor: "rgba(255,255,255,0.6)",
        cursorWidth: 0,
        height: 40,
        responsive: true,
        plugins: [
          RecordPlugin.create({
            audioContext: null,
            bufferSize: 4096,
            leaveStreamOpen: true,
            onStop: (blob) => setRecordedBlob(blob),
          }),
        ],
      });
    }

    return () => {
      waveSurferRef.current?.destroy();
      waveSurferRef.current = null;
    };
  }, []);

  // Timer
  useEffect(() => {
    let interval;
    if (isRecording && !isPaused) {
      interval = setInterval(() => setTimer((prev) => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  // Animate Bars
  const animateBars = () => {
    if (!analyserRef.current || !dataArrayRef.current) return;

    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    const newHeights = Array.from({ length: NUM_BARS }, (_, i) => {
      // map frequency bands to bar heights
      const index = Math.floor((i / NUM_BARS) * dataArrayRef.current.length);
      return Math.max(4, (dataArrayRef.current[index] / 255) * 20);
    });
    setBarHeights(newHeights);
    animationFrameRef.current = requestAnimationFrame(animateBars);
  };

  // Start recording
  const startRecording = async () => {
    if (!waveSurferRef.current) return;
    await waveSurferRef.current.startRecording();
    setIsRecording(true);
    setIsPaused(false);
    setTimer(0);
    setRecordedBlob(null);
    setIsPlayingPreview(false);

    // Setup analyser for live bars
    const stream = waveSurferRef.current.microphone?.mediaStream;
    if (stream) {
      const audioContext = waveSurferRef.current.backend.getAudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
      animateBars();
    }
  };

  const pauseRecording = () => {
    waveSurferRef.current?.pause();
    setIsPaused(true);
    cancelAnimationFrame(animationFrameRef.current);
  };

  const resumeRecording = () => {
    waveSurferRef.current?.play();
    setIsPaused(false);
    animateBars();
  };

  const stopRecording = async () => {
    const blob = await waveSurferRef.current?.stopRecording();
    setRecordedBlob(blob);
    setIsRecording(false);
    setIsPaused(false);
    setTimer(0);
    cancelAnimationFrame(animationFrameRef.current);

    if (playbackRef.current) playbackRef.current.destroy();
    playbackRef.current = WaveSurfer.create({
      container: "#waveform",
      waveColor: "rgba(255,255,255,0.2)",
      progressColor: "white",
      cursorWidth: 1,
      height: 40,
      responsive: true,
    });
    if (blob) playbackRef.current.loadBlob(blob);
    playbackRef.current.on("finish", () => setIsPlayingPreview(false));
  };

  const togglePreviewPlayback = () => {
    if (!playbackRef.current) return;
    if (isPlayingPreview) {
      playbackRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      playbackRef.current.play();
      setIsPlayingPreview(true);
    }
  };

  const handleSend = () => {
    if (recordedBlob) {
      onSend(recordedBlob);
      setRecordedBlob(null);
      if (playbackRef.current) playbackRef.current.destroy();
      playbackRef.current = null;
      setIsPlayingPreview(false);
    }
  };

  const handleCancel = () => {
    waveSurferRef.current?.stopRecording();
    setIsRecording(false);
    setIsPaused(false);
    setTimer(0);
    setRecordedBlob(null);
    cancelAnimationFrame(animationFrameRef.current);
    if (playbackRef.current) playbackRef.current.destroy();
    playbackRef.current = null;
    setIsPlayingPreview(false);
    onCancel();
  };

  const formatTime = (seconds) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="flex items-center gap-4 w-full bg-purple-600 px-4 py-2 rounded-2xl animate-in zoom-in-95 duration-200">
      <button onClick={handleCancel} className="text-white/70 hover:text-white transition-colors">
        <Trash2 size={18} />
      </button>

      <div className="flex-1 flex flex-col items-center gap-1">
        {/* Live Bars */}
        {isRecording && !recordedBlob ? (
          <div className="flex gap-1 w-full justify-center h-10">
            {barHeights.map((h, i) => (
              <div
                key={i}
                className="w-1 bg-white rounded-full"
                style={{ height: `${h}px`, transition: "height 0.1s" }}
              ></div>
            ))}
          </div>
        ) : (
          <div id="waveform" className="w-full h-10"></div>
        )}

        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs font-mono text-white">{formatTime(timer)}</span>

          {!recordedBlob && isRecording && !isPaused && (
            <button onClick={pauseRecording} className="text-white">
              <Pause size={16} />
            </button>
          )}

          {!recordedBlob && isRecording && isPaused && (
            <button onClick={resumeRecording} className="text-white">
              <Play size={16} />
            </button>
          )}

          {!recordedBlob && !isRecording && (
            <button onClick={startRecording} className="text-white">
              <Mic size={16} />
            </button>
          )}

          {recordedBlob && (
            <button onClick={togglePreviewPlayback} className="text-white">
              {isPlayingPreview ? <Pause size={16} /> : <Play size={16} />}
            </button>
          )}
        </div>
      </div>

      <button
        onClick={handleSend}
        disabled={!recordedBlob}
        className={`p-2 rounded-xl transition-all ${
          recordedBlob ? "bg-white text-purple-600 hover:scale-105 active:scale-95" : "bg-white/30 text-white cursor-not-allowed"
        }`}
      >
        <Send size={18} />
      </button>
    </div>
  );
};

export default VoiceRecorder;