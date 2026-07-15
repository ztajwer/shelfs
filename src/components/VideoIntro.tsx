"use client";

import { useEffect, useRef, useState } from "react";
import { preloadBoutiqueAudio } from "@/lib/boutiqueAudio";

interface VideoIntroProps {
  progress?: number;
  opacity?: number;
  onVideoEnd?: () => void;
  onProgress?: (progress: number) => void;
}

export default function VideoIntro({ opacity = 1, onVideoEnd, onProgress }: VideoIntroProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [needsInteraction, setNeedsInteraction] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    audioRef.current = new Audio("/door-chime.mp3");
    audioRef.current.loop = true;
    audioRef.current.volume = 0.36;
    
    const playAudio = () => {
      audioRef.current?.play().catch(() => {});
    };

    video.play().then(() => {
      playAudio();
    }).catch((err) => {
      if (err.name === "NotAllowedError") {
        setNeedsInteraction(true);
      } else {
        console.error("Video play error:", err);
      }
    });

    const onTimeUpdate = () => {
      if (video.duration) {
        const progress = video.currentTime / video.duration;
        if (onProgress) onProgress(progress);
      }
    };

    const onEnded = () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if (onVideoEnd) onVideoEnd();
    };

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("ended", onEnded);

    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("ended", onEnded);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [onVideoEnd, onProgress]);

  const handleStartInteraction = () => {
    setNeedsInteraction(false);
    if (videoRef.current) {
      videoRef.current.play().catch(console.error);
    }
    if (audioRef.current) {
      audioRef.current.play().catch(console.error);
    }
  };

  return (
    <div 
      className="fixed inset-0 w-full h-full z-[60] bg-black overflow-hidden flex items-center justify-center"
      style={{ opacity, pointerEvents: needsInteraction ? "auto" : "none" }}
    >
      <video
        ref={videoRef}
        src="/door_st.mp4"
        className="h-full object-fill"
        style={{ 
          width: "100%", 
          minWidth: "100%",
          maxWidth: "100%"
        }} 
        muted={false}
        playsInline
        autoPlay
        preload="auto"
      />
      {needsInteraction && (
        <div 
          className="absolute inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm cursor-pointer"
          onClick={handleStartInteraction}
        >
          <div className="font-sans text-[11px] uppercase tracking-[0.3em] text-maj-gold border border-maj-gold/50 px-8 py-4 bg-black/60 hover:bg-maj-gold hover:text-black transition-colors duration-300">
            Enter Boutique
          </div>
        </div>
      )}
    </div>
  );
}
