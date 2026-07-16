"use client";

import { useCallback, useEffect, useState } from "react";
import { LoadingProvider } from "@/context/LoadingContext";
import Loader from "./Loader";
import CursorGlitterTrail from "./CursorGlitterTrail";
import ModelPreloader from "./ModelPreloader";
import ShopExperience from "./jewelry/ShopExperience";
import VideoIntro from "./VideoIntro";
import { getDeviceProfile } from "@/lib/deviceProfile";
import { useExperienceScroll } from "@/hooks/useExperienceScroll";
import Footer from "./Footer";

// Module-level variable persists during Next.js client-side navigation (e.g. back button)
// but resets to false on a hard page refresh!
let hasWatchedIntro = false;

function ExperienceInner() {
  const [skipIntro] = useState(hasWatchedIntro);
  const [ready, setReady] = useState(skipIntro);

  useEffect(() => {
    // Session storage is no longer used; we use module-level state for perfect back-button behavior
  }, []);

  const [showCursorGlitter, setShowCursorGlitter] = useState(false);
  const {
    scrollRef,
    progressRef,
    doorProgress,
    entered,
    focusProgress,
    canvasOpacity,
    scrollHeight,
    getOpenDistance,
    forceEnter,
  } = useExperienceScroll(ready, skipIntro);

  const [flashPhase, setFlashPhase] = useState<"none" | "start" | "in" | "out">("none");

  const handleVideoEnd = useCallback(() => {
    setFlashPhase("start");
    
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setFlashPhase("in");
      });
    });

    setTimeout(() => {
      forceEnter();
      hasWatchedIntro = true; // Mark intro as watched for any future back navigation in this session
      setFlashPhase("out");
      
      setTimeout(() => {
        setFlashPhase("none");
      }, 3000);
    }, 1200);
  }, [forceEnter]);

  const handleLoadComplete = useCallback(() => {
    setReady(true);
  }, []);

  const onDoorScreen = ready && !entered;

  useEffect(() => {
    setShowCursorGlitter(!getDeviceProfile().lowEnd);
  }, []);



  useEffect(() => {
    if (!ready || !entered) return;
    const el = scrollRef.current;
    if (!el) return;

    let touchStartY = 0;
    let touchStartScroll = 0;
    let tracking = false;

    const isShelfProductTarget = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return false;
      return Boolean(target.closest(".line-shelf__product-interactive"));
    };

    const onTouchStart = (e: TouchEvent) => {
      if (isShelfProductTarget(e.target)) return;
      touchStartY = e.touches[0]?.clientY ?? 0;
      touchStartScroll = el.scrollTop;
      tracking = true;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!tracking || isShelfProductTarget(e.target)) return;
      const clientY = e.touches[0]?.clientY ?? touchStartY;
      const dy = touchStartY - clientY;
      const maxScroll = el.scrollHeight - el.clientHeight;
      const openDist = getOpenDistance();
      el.scrollTop = Math.min(maxScroll, Math.max(openDist, touchStartScroll + dy));
      if (Math.abs(dy) > 2) e.preventDefault();
    };

    const onTouchEnd = () => {
      tracking = false;
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    document.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [ready, entered, scrollRef, getOpenDistance]);

  useEffect(() => {
    if (!ready) return;
    const el = scrollRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < 1) return;
      e.preventDefault();
      const maxScroll = el.scrollHeight - el.clientHeight;
      const openDist = getOpenDistance();
      const minScroll = entered ? openDist : 0;
      el.scrollTop = Math.min(maxScroll, Math.max(minScroll, el.scrollTop + e.deltaY));
    };

    window.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      window.removeEventListener("wheel", onWheel);
    };
  }, [ready, entered, scrollRef, getOpenDistance]);

  return (
    <div className="relative h-full w-full bg-maj-cream">
      <ModelPreloader doorsReady={ready} />
      {!showCursorGlitter ? null : <CursorGlitterTrail />}
      {!skipIntro && <Loader onComplete={handleLoadComplete} />}

      {ready && <ShopExperience visible={true} focusProgress={focusProgress} />}

      {onDoorScreen && (
        <VideoIntro opacity={1} onVideoEnd={handleVideoEnd} />
      )}

      {/* The beautiful light flash transition overlay */}
      <div 
        className={`fixed inset-0 z-[100] pointer-events-none ease-in-out ${
          flashPhase === "in" ? "opacity-100 duration-[1200ms]" : 
          flashPhase === "out" ? "opacity-0 duration-[3000ms]" : "opacity-0 duration-0"
        }`}
        style={{
          background: "radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(253,246,227,1) 40%, rgba(255,215,0,0.6) 100%)",
          mixBlendMode: "screen",
          visibility: flashPhase === "none" ? "hidden" : "visible",
          transitionProperty: "opacity"
        }}
      >
        <div className="absolute inset-0 bg-white/60 animate-pulse mix-blend-overlay" style={{ animationDuration: '0.8s' }}></div>
        <div className="absolute top-1/4 left-1/4 w-[60vw] h-[60vw] bg-white rounded-full blur-[100px] opacity-90 animate-ping" style={{ animationDuration: '2s' }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-[70vw] h-[70vw] bg-[#fff5cc] rounded-full blur-[120px] opacity-90 animate-pulse" style={{ animationDuration: '1.5s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[100vw] bg-white rounded-full blur-[150px] opacity-100"></div>
        <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-[#ffeaa7] rounded-full blur-[130px] opacity-70 animate-pulse" style={{ animationDuration: '2.5s' }}></div>
      </div>


      {ready && (
        <div
          ref={scrollRef}
          className={`experience-scroll-layer shop-scroll-layer fixed inset-0 z-[45] overflow-x-hidden overflow-y-auto overscroll-none ${entered ? "shop-scroll-layer--passthrough" : ""}`}
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <div aria-hidden style={{ height: scrollHeight || "200vh", minHeight: scrollHeight || "200vh" }} />
          {entered && <Footer />}
        </div>
      )}

    </div>
  );
}

export default function Experience() {
  return (
    <LoadingProvider>
      <ExperienceInner />
    </LoadingProvider>
  );
}
