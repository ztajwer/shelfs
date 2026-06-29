"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getDoorOpenDistance, getDoorScrollContentHeight } from "@/lib/doorFraming";

const AUTO_NAV_AT = 0.96;
const WHEEL_IDLE_MS = 200;

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useScrollDoorProgress(active: boolean) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const [doorProgress, setDoorProgress] = useState(0);
  const [entered, setEntered] = useState(false);
  const autoNavDone = useRef(false);
  const pendingEnterRef = useRef(false);
  const touchCountRef = useRef(0);
  const idleTimerRef = useRef(0);

  const getOpenDistance = useCallback(() => getDoorOpenDistance(), []);

  useEffect(() => {
    if (!active || !prefersReducedMotion()) return;
    progressRef.current = 1;
    setDoorProgress(1);
    autoNavDone.current = true;
    setEntered(true);
  }, [active]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !active) return;

    const commitEnter = (reason: string) => {
      if (autoNavDone.current || !pendingEnterRef.current) return;
      autoNavDone.current = true;
      pendingEnterRef.current = false;
      window.clearTimeout(idleTimerRef.current);
      setEntered(true);
      // #region agent log
      fetch("http://127.0.0.1:7647/ingest/287705b7-8654-4083-8fd8-eca8e5fb1f44", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "44e59c" },
        body: JSON.stringify({
          sessionId: "44e59c",
          location: "useScrollDoorProgress.ts:enter",
          message: "door entered shop after gesture end",
          data: {
            reason,
            doorProgress: progressRef.current,
            doorScrollTop: el.scrollTop,
            touchCount: touchCountRef.current,
          },
          timestamp: Date.now(),
          hypothesisId: "H5-deferred-enter",
          runId: "door-shop-v3",
        }),
      }).catch(() => {});
      // #endregion
    };

    const scheduleWheelIdleEnter = () => {
      if (touchCountRef.current > 0) return;
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = window.setTimeout(() => {
        if (touchCountRef.current === 0) commitEnter("wheel-idle");
      }, WHEEL_IDLE_MS);
    };

    const update = () => {
      const openDist = getOpenDistance();
      const p = Math.min(1, Math.max(0, el.scrollTop / openDist));
      progressRef.current = p;
      setDoorProgress(p);

      if (p >= AUTO_NAV_AT && !autoNavDone.current) {
        if (!pendingEnterRef.current) {
          pendingEnterRef.current = true;
          // #region agent log
          fetch("http://127.0.0.1:7647/ingest/287705b7-8654-4083-8fd8-eca8e5fb1f44", {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "44e59c" },
            body: JSON.stringify({
              sessionId: "44e59c",
              location: "useScrollDoorProgress.ts:pending",
              message: "door ready — waiting for gesture end",
              data: { doorProgress: p, touchCount: touchCountRef.current },
              timestamp: Date.now(),
              hypothesisId: "H5-deferred-enter",
              runId: "door-shop-v3",
            }),
          }).catch(() => {});
          // #endregion
        }
        if (touchCountRef.current === 0) scheduleWheelIdleEnter();
      }
    };

    const onTouchStart = () => {
      touchCountRef.current += 1;
      window.clearTimeout(idleTimerRef.current);
    };

    const onTouchEnd = () => {
      touchCountRef.current = Math.max(0, touchCountRef.current - 1);
      if (touchCountRef.current === 0 && pendingEnterRef.current) {
        commitEnter("touchend");
      }
    };

    const onMouseUp = () => {
      if (pendingEnterRef.current && touchCountRef.current === 0) {
        commitEnter("mouseup");
      }
    };

    const onWheel = () => {
      update();
      if (pendingEnterRef.current && !autoNavDone.current) {
        scheduleWheelIdleEnter();
      }
    };

    const onScroll = () => update();

    update();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });
    window.addEventListener("mouseup", onMouseUp, { passive: true });
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);

    return () => {
      window.clearTimeout(idleTimerRef.current);
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, [active, getOpenDistance]);

  const brightness = Math.min(1, Math.max(0, (doorProgress - 0.2) / 0.75));
  const canvasOpacity = Math.min(1, Math.max(0, 1 - (doorProgress - 0.55) / 0.45));

  return {
    scrollRef,
    progressRef,
    doorProgress,
    entered,
    brightness,
    canvasOpacity,
    scrollHeight: getDoorScrollContentHeight(),
    getOpenDistance,
  };
}
