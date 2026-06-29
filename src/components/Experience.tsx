"use client";

import { useCallback, useEffect, useState } from "react";
import { LoadingProvider } from "@/context/LoadingContext";
import Loader from "./Loader";
import DoorBackground from "./DoorBackground";
import UIOverlay from "./UIOverlay";
import ScrollOpenModal from "./ScrollOpenModal";
import DoorChimeAudio from "./DoorChimeAudio";
import CursorGlitterTrail from "./CursorGlitterTrail";
import DoorSceneCanvas from "./DoorSceneCanvas";
import ModelPreloader from "./ModelPreloader";
import ShopExperience from "./jewelry/ShopExperience";
import {
  preloadBoutiqueAudio,
  startBoutiqueAudioFromGesture,
  stopBoutiqueAudio,
} from "@/lib/boutiqueAudio";
import { getDeviceProfile } from "@/lib/deviceProfile";
import { useExperienceScroll } from "@/hooks/useExperienceScroll";

function ExperienceInner() {
  const [ready, setReady] = useState(false);
  const [scrollModalOpen, setScrollModalOpen] = useState(false);
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
  } = useExperienceScroll(ready);

  const handleLoadComplete = useCallback(() => {
    setReady(true);
  }, []);

  const doorOpacity = Math.min(1, Math.max(0, canvasOpacity));
  const onDoorScreen = ready && !entered;

  const closeScrollModal = useCallback(() => {
    setScrollModalOpen(false);
  }, []);

  useEffect(() => {
    if (onDoorScreen) setScrollModalOpen(true);
    else setScrollModalOpen(false);
  }, [onDoorScreen]);

  useEffect(() => {
    if (!scrollModalOpen || !onDoorScreen) return;
    const el = scrollRef.current;
    if (!el) return;

    const onScroll = () => {
      if (el.scrollTop > 1) closeScrollModal();
    };
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > 0) closeScrollModal();
    };
    const onTouchMove = () => closeScrollModal();

    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("wheel", onWheel, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });

    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchmove", onTouchMove);
    };
  }, [scrollModalOpen, onDoorScreen, scrollRef, closeScrollModal]);

  useEffect(() => {
    setShowCursorGlitter(!getDeviceProfile().lowEnd);
  }, []);

  useEffect(() => {
    if (!ready) return;
    preloadBoutiqueAudio();
  }, [ready]);

  useEffect(() => {
    if (entered) stopBoutiqueAudio();
  }, [entered]);

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
      if (!entered) {
        const openDist = getOpenDistance();
        const p = Math.min(1, Math.max(0, el.scrollTop / openDist));
        startBoutiqueAudioFromGesture(p);
      }
    };

    const onTouchMove = () => {
      if (entered) return;
      const openDist = getOpenDistance();
      const p = Math.min(1, Math.max(0, el.scrollTop / openDist));
      startBoutiqueAudioFromGesture(p);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: true });

    return () => {
      window.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchmove", onTouchMove);
    };
  }, [ready, entered, scrollRef, getOpenDistance]);

  return (
    <div className="relative h-full w-full bg-maj-cream">
      <ModelPreloader doorsReady={ready} />
      {!showCursorGlitter ? null : <CursorGlitterTrail />}
      <Loader onComplete={handleLoadComplete} />

      {ready && (
        <DoorChimeAudio
          active={ready}
          doorProgress={doorProgress}
          doorScreenActive={onDoorScreen}
        />
      )}

      {onDoorScreen && <DoorBackground fadeProgress={doorProgress} />}

      {ready && entered && <ShopExperience visible={entered} focusProgress={focusProgress} />}
      {onDoorScreen && (
        <DoorSceneCanvas
          progressRef={progressRef}
          brightness={0}
          opacity={doorOpacity}
        />
      )}

      {onDoorScreen && (
        <ScrollOpenModal open={scrollModalOpen} onClose={closeScrollModal} />
      )}
      {onDoorScreen && (
        <UIOverlay
          doorProgress={doorProgress}
          showHint={!scrollModalOpen && doorProgress < 0.88}
        />
      )}


      {ready && (
        <div
          ref={scrollRef}
          className={`experience-scroll-layer shop-scroll-layer fixed inset-0 z-[45] overflow-x-hidden overflow-y-auto overscroll-none${entered ? " shop-scroll-layer--passthrough" : ""}`}
          style={{ WebkitOverflowScrolling: "touch" }}
          aria-hidden
        >
          <div style={{ height: scrollHeight || "200vh", minHeight: scrollHeight || "200vh" }} />
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
