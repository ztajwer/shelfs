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
    let endedFired = false;
    const triggerEnd = () => {
      if (endedFired) return;
      endedFired = true;
      if (onVideoEnd) onVideoEnd();
    };

    if (isMobile) {
      const timer = setTimeout(triggerEnd, 5000); // 5s for image intro
      return () => clearTimeout(timer);
    }

    const video = videoRef.current;
    if (!video) return;

    video.play().catch((err) => {
      if (err.name === "NotAllowedError") {
        setNeedsInteraction(true);
      } else {
        console.warn("Video play warning, proceeding:", err);
        triggerEnd();
      }
    });

    const onTimeUpdate = () => {
      if (video.duration) {
        const progress = video.currentTime / video.duration;
        if (onProgress) onProgress(progress);
      }
    };

    const onEnded = () => {
      triggerEnd();
    };

    const onError = () => {
      console.warn("Video load error, proceeding to boutique.");
      triggerEnd();
    };

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("ended", onEnded);
    video.addEventListener("error", onError);

    // Fail-safe safety timer (4.5s max) so intro never gets stuck
    const safetyTimer = setTimeout(() => {
      triggerEnd();
    }, 4500);

    return () => {
      clearTimeout(safetyTimer);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("error", onError);
    };
  }, [isMobile, onVideoEnd, onProgress]);

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
          className="h-full object-cover"
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
          className="h-full object-cover"
          style={{ 
            width: "100%", 
            minWidth: "100%",
            maxWidth: "100%"
          }} 
          muted={true}
          playsInline
          autoPlay
          preload="auto"
        />
      )}
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
