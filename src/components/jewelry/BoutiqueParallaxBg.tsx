"use client";

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { useLuxuryParallax, CINEMATIC_PARALLAX } from "@/hooks/useLuxuryParallax";
import type { BoutiqueParallaxMotion } from "@/lib/boutiqueParallaxMotion";
import { getFocusBlurPx, getFocusBgScale, getFocusVeilOpacity } from "@/lib/shopScrollFocus";

interface BoutiqueParallaxBgProps {
  mobileVideoSrc: string;
  mobilePosterSrc?: string;
  desktopSrc: string;
  roomRef: RefObject<HTMLElement | null>;
  active: boolean;
  motionRef?: RefObject<BoutiqueParallaxMotion | null>;
  focusProgress?: number;
  children?: ReactNode;
}

const MOBILE_MAX_WIDTH = 767;

export default function BoutiqueParallaxBg({
  mobileVideoSrc,
  mobilePosterSrc,
  desktopSrc,
  roomRef,
  active,
  motionRef,
  focusProgress = 0,
  children,
}: BoutiqueParallaxBgProps) {
  const bgMediaRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`);
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useLuxuryParallax(roomRef, bgMediaRef, null, {
    ...CINEMATIC_PARALLAX,
    enabled: active && focusProgress < 0.06,
    motionOut: motionRef,
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isMobile) return;
    video.pause();
    video.currentTime = 0;
  }, [isMobile, mobileVideoSrc, active]);

  const variant = isMobile ? "mobile" : "desktop";
  const blurPx = getFocusBlurPx(focusProgress);
  const veilOpacity = getFocusVeilOpacity(focusProgress);
  const bgScale = getFocusBgScale(focusProgress);
  const mediaStyle = {
    filter: blurPx > 0.1 ? `blur(${blurPx}px) saturate(0.96)` : undefined,
    transform: bgScale < 0.999 ? `scale(${bgScale})` : undefined,
    transformOrigin: "50% 50%",
  } as const;

  return (
    <div
      className={`boutique-room__parallax-bg boutique-hero__bg boutique-room__parallax-bg--${variant}`}
      aria-hidden
    >
      <div className="boutique-room__parallax-pan boutique-hero__bg-pan">
        <div ref={bgMediaRef} className="boutique-room__parallax-media boutique-hero__bg-media">
          {isMobile ? (
            <video
              ref={videoRef}
              className="boutique-room__parallax-img boutique-room__parallax-video boutique-hero__bg-img"
              src={mobileVideoSrc}
              poster={mobilePosterSrc}
              muted
              playsInline
              preload="metadata"
              disablePictureInPicture
              disableRemotePlayback
              style={mediaStyle}
            />
          ) : (
            <img
              src={desktopSrc}
              alt=""
              className="boutique-room__parallax-img boutique-hero__bg-img"
              draggable={false}
              decoding="async"
              fetchPriority="high"
              style={mediaStyle}
            />
          )}
          <div
            className="boutique-room__focus-veil boutique-hero__veil"
            style={{ opacity: veilOpacity }}
            aria-hidden
          />
          {children}
        </div>
      </div>
    </div>
  );
}
