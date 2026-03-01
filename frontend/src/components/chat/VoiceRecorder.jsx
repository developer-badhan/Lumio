import React, { useEffect, useRef, useState } from "react";
import {
  Trash2,
  Send,
  Pause,
  Play,
  Mic,
} from "lucide-react";
import WaveSurfer from "wavesurfer.js";

const VoiceRecorder = ({ onCancel, onSend }) => {
  const [isRecording, setIsRecording] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const waveformRef = useRef(null);
  const wavesurferRef = useRef(null);

  useEffect(() => {
    startRecording();

    return () => {
      cleanup();
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: "audio/webm",
        });
        setAudioBlob(blob);
        initWaveform(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Mic permission denied", err);
    }
  };

  const handlePauseResume = () => {
    const recorder = mediaRecorderRef.current;

    if (!recorder) return;

    if (recorder.state === "recording") {
      recorder.pause();
      clearInterval(timerRef.current);
      setIsPaused(true);
    } else if (recorder.state === "paused") {
      recorder.resume();
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
      setIsPaused(false);
    }
  };


  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    recorder.stop();
    recorder.stream.getTracks().forEach((t) => t.stop());
    clearInterval(timerRef.current);
    setIsRecording(false);
  };


  const initWaveform = (blob) => {
    if (!waveformRef.current) return;

    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: "#a78bfa",
      progressColor: "#6366f1",
      cursorColor: "#ffffff",
      height: 60,
      responsive: true,
    });

    wavesurfer.loadBlob(blob);

    wavesurfer.on("finish", () => {
      setIsPlaying(false);
    });

    wavesurferRef.current = wavesurfer;
  };


  const handlePlayPause = () => {
    if (!wavesurferRef.current) return;

    wavesurferRef.current.playPause();
    setIsPlaying((prev) => !prev);
  };


  const handleSend = () => {
    if (audioBlob) {
      onSend(audioBlob);
    }
  };


  const handleCancel = () => {
    cleanup();
    onCancel();
  };

  const cleanup = () => {
    clearInterval(timerRef.current);

    if (mediaRecorderRef.current?.stream) {
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
    }

    if (wavesurferRef.current) {
      wavesurferRef.current.destroy();
    }
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col gap-3 w-full bg-blue-600 p-4 rounded-2xl shadow-lg">

      {/* Top Controls */}
      <div className="flex items-center gap-4">

        <button
          onClick={handleCancel}
          className="text-white/70 hover:text-white transition"
        >
          <Trash2 size={20} />
        </button>

        <div className="flex-1 text-white font-mono text-sm">
          {formatTime(seconds)}
        </div>

        {isRecording && (
          <button
            onClick={handlePauseResume}
            className="text-white hover:scale-105 transition"
          >
            {isPaused ? <Mic size={20} /> : <Pause size={20} />}
          </button>
        )}

        {isRecording && (
          <button
            onClick={stopRecording}
            className="bg-white text-blue-600 p-2 rounded-xl"
          >
            <Send size={18} />
          </button>
        )}
      </div>

      {/* Waveform Preview */}
      {!isRecording && audioBlob && (
        <div className="flex items-center gap-3">

          <button
            onClick={handlePlayPause}
            className="bg-white text-blue-600 p-2 rounded-xl"
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>

          <div
            ref={waveformRef}
            className="flex-1"
          />

          <button
            onClick={handleSend}
            className="bg-white text-blue-600 p-2 rounded-xl"
          >
            <Send size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
