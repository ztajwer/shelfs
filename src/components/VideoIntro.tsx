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
  const [needsInteraction, setNeedsInteraction] = useState(false);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (isMobile) return;

    const video = videoRef.current;
    if (!video) return;

    video.play().catch((err) => {
      console.warn("Video play warning:", err);
    });

    const onTimeUpdate = () => {
      if (video.duration && onProgress) {
        onProgress(video.currentTime / video.duration);
      }
    };

    video.addEventListener("timeupdate", onTimeUpdate);
    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, [isMobile, onProgress]);

  const handleStartInteraction = () => {
    setNeedsInteraction(false);
    if (onVideoEnd) onVideoEnd();
  };

  const videoSrc = "/fuvid.mp4";
  const imgSrc = "/door.jpeg";

  return (
    <div 
      className="fixed inset-0 w-full h-full z-[60] bg-black overflow-hidden flex items-center justify-center cursor-pointer"
      style={{ opacity, pointerEvents: "auto" }}
      onClick={handleStartInteraction}
    >
      {isMobile ? (
        <img
          src={imgSrc}
          alt="Doors"
          className="h-full object-contain"
          style={{ 
            width: "100%", 
            minWidth: "100%",
            maxWidth: "100%"
          }} 
        />
      ) : (
        <video
          key={videoSrc} // Force video reload when source changes
          ref={videoRef}
          src={videoSrc}
          className="h-full object-contain"
          style={{ 
            width: "100%", 
            minWidth: "100%",
            maxWidth: "100%"
          }} 
          muted={true}
          playsInline
          autoPlay
          loop={true}
          preload="auto"
        />
      )}
      
      {/* Always show the Enter overlay since it now waits indefinitely for interaction */}
      <div 
        className="absolute inset-0 z-[70] flex items-center justify-center bg-black/20 hover:bg-black/40 backdrop-blur-[2px] cursor-pointer transition-all duration-500"
        onClick={handleStartInteraction}
      >
        <div className="font-sans text-[11px] uppercase tracking-[0.3em] text-maj-gold border border-maj-gold/50 px-8 py-4 bg-black/60 hover:bg-maj-gold hover:text-black transition-colors duration-300">
          Enter Boutique
        </div>
      </div>
    </div>
  );
}
