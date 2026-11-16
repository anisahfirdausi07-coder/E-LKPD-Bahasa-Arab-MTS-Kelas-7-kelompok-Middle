import { useEffect, useRef, useState } from "react";
import { Loader2, Pause, RotateCcw, Volume2 } from "lucide-react";
import type { LearningLevel } from "../types";

interface AudioPlayerProps {
  textArabic: string;
  label?: string;
  level: LearningLevel;
  compact?: boolean;
  onPlayed?: () => void;
}

const clientAudioCache = new Map<string, string>();

export function AudioPlayer({
  textArabic,
  label = "Putar Audio Bahasa Arab",
  level,
  compact = false,
  onPlayed,
}: AudioPlayerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<0.85 | 1>(1);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isMiddle = level === "middle";

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [textArabic]);

  const playBrowserFallback = (rate: number) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setStatusMessage("Audio browser tidak tersedia di perangkat ini.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textArabic);
    utterance.lang = "ar-SA";
    utterance.rate = rate === 0.85 ? 0.8 : 0.95;

    const voices = window.speechSynthesis.getVoices();
    const arabicVoice = voices.find((v) => v.lang.toLowerCase().startsWith("ar"));
    if (arabicVoice) utterance.voice = arabicVoice;

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => {
      setIsPlaying(false);
      onPlayed?.();
    };
    utterance.onerror = () => {
      setIsPlaying(false);
      setStatusMessage("Gagal memutar suara di perangkat.");
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  };

  const handlePlay = async (replay = false) => {
    if (isPlaying && !replay) {
      stopAudio();
      return;
    }
    stopAudio();
    setStatusMessage(null);

    const cachedBase64 = clientAudioCache.get(textArabic);
    if (cachedBase64) {
      playBase64Audio(cachedBase64);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textArabic,
          voiceName: isMiddle ? "Kore" : "Zephyr",
        }),
      });
      const data = await res.json();
      if (res.ok && data.audioBase64) {
        clientAudioCache.set(textArabic, data.audioBase64);
        playBase64Audio(data.audioBase64);
      } else {
        playBrowserFallback(playbackRate);
      }
    } catch {
      playBrowserFallback(playbackRate);
    } finally {
      setIsLoading(false);
    }
  };

  const playBase64Audio = (base64: string) => {
    const audio = new Audio(`data:audio/wav;base64,${base64}`);
    audio.playbackRate = playbackRate;
    audioRef.current = audio;
    audio.onplay = () => setIsPlaying(true);
    audio.onended = () => {
      setIsPlaying(false);
      onPlayed?.();
    };
    audio.onerror = () => {
      setIsPlaying(false);
      playBrowserFallback(playbackRate);
    };
    audio.play().catch(() => {
      playBrowserFallback(playbackRate);
    });
  };

  const toggleSpeed = () => {
    const next: 0.85 | 1 = playbackRate === 1 ? 0.85 : 1;
    setPlaybackRate(next);
    if (audioRef.current) {
      audioRef.current.playbackRate = next;
    }
  };

  const primaryBtnClasses = isMiddle
    ? "bg-teal-600 hover:bg-teal-700 text-white focus-visible:ring-teal-500"
    : "bg-indigo-600 hover:bg-indigo-700 text-white focus-visible:ring-indigo-500";

  if (compact) {
    return (
      <div className="inline-flex items-center gap-2">
        <button
          type="button"
          onClick={() => handlePlay(false)}
          disabled={isLoading}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 cursor-pointer ${primaryBtnClasses}`}
          aria-label={isPlaying ? "Hentikan audio" : label}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
          <span>{isLoading ? "Memuat..." : isPlaying ? "Berhenti" : label}</span>
        </button>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl p-4 border transition-colors ${
        isMiddle
          ? "bg-gradient-to-r from-teal-50/90 via-sky-50/80 to-orange-50/70 border-teal-200/80"
          : "bg-gradient-to-r from-indigo-50/90 via-sky-50/80 to-amber-50/60 border-indigo-200/80"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handlePlay(false)}
            disabled={isLoading}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 cursor-pointer ${primaryBtnClasses}`}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
            <span>{isLoading ? "Menyiapkan Audio..." : isPlaying ? "Hentikan Audio" : label}</span>
          </button>

          <button
            type="button"
            onClick={() => handlePlay(true)}
            disabled={isLoading}
            title="Putar Ulang Audio"
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Putar Ulang</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleSpeed}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors tabular-nums whitespace-nowrap shrink-0 cursor-pointer"
          >
            Kecepatan: {playbackRate === 1 ? "1.0x Normal" : "0.85x Pelan"}
          </button>
        </div>
      </div>

      {isPlaying && (
        <div className="mt-2.5 flex items-center gap-2 text-xs font-medium text-slate-600">
          <span className="inline-flex items-end gap-0.5 h-3" aria-hidden="true">
            <span className={`w-1 h-2 rounded-full animate-bounce ${isMiddle ? "bg-teal-500" : "bg-indigo-500"}`} />
            <span className={`w-1 h-3 rounded-full animate-bounce [animation-delay:120ms] ${isMiddle ? "bg-teal-500" : "bg-indigo-500"}`} />
            <span className={`w-1 h-1.5 rounded-full animate-bounce [animation-delay:240ms] ${isMiddle ? "bg-teal-500" : "bg-indigo-500"}`} />
          </span>
          <span>Audio bahasa Arab sedang diputar...</span>
        </div>
      )}

      {statusMessage && (
        <p className="mt-2 text-xs text-amber-700">{statusMessage}</p>
      )}
    </div>
  );
}
