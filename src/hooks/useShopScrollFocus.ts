"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { easeLuxuryCinematic, getShopFocusScrollHeight, getShopFocusScrollRange } from "@/lib/shopScrollFocus";

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** RAF-smoothed scroll progress for fluid hero animations */
export function useShopScrollFocus(active: boolean) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const targetProgressRef = useRef(0);
  const smoothedRef = useRef(0);
  const [focusProgress, setFocusProgress] = useState(0);
  const [scrollHeight, setScrollHeight] = useState(0);

  const getScrollRange = useCallback(() => getShopFocusScrollRange(), []);

  const bindScrollRef = useCallback(
    (node: HTMLDivElement | null) => {
      scrollRef.current = node;
      if (node && active) {
        node.scrollTop = 0;
      }
    },
    [active],
  );

  useEffect(() => {
    if (!active) return;
    setScrollHeight(getShopFocusScrollHeight());
  }, [active]);

  useLayoutEffect(() => {
    if (!active || prefersReducedMotion()) return;

    targetProgressRef.current = 0;
    progressRef.current = 0;
    smoothedRef.current = 0;
    setFocusProgress(0);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;

    // #region agent log
    fetch("http://127.0.0.1:7647/ingest/287705b7-8654-4083-8fd8-eca8e5fb1f44", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "44e59c" },
      body: JSON.stringify({
        sessionId: "44e59c",
        location: "useShopScrollFocus.ts:mount",
        message: "shop scroll fresh start",
        data: { scrollTop: scrollRef.current?.scrollTop ?? null },
        timestamp: Date.now(),
        hypothesisId: "H2-reset",
        runId: "door-shop-v3",
      }),
    }).catch(() => {});
    // #endregion
  }, [active]);

  useEffect(() => {
    if (!active || prefersReducedMotion()) return;

    let el = scrollRef.current;
    if (!el) return;

    const updateTarget = () => {
      if (!el) return;
      const range = getScrollRange();
      const raw = Math.min(1, Math.max(0, el.scrollTop / range));
      const eased = easeLuxuryCinematic(raw);
      targetProgressRef.current = eased;
      progressRef.current = eased;

      // #region agent log
      if (raw > 0.02) {
        fetch("http://127.0.0.1:7647/ingest/287705b7-8654-4083-8fd8-eca8e5fb1f44", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "44e59c" },
          body: JSON.stringify({
            sessionId: "44e59c",
            location: "useShopScrollFocus.ts:update",
            message: "shop focus scroll",
            data: { scrollTop: el.scrollTop, range, raw, eased },
            timestamp: Date.now(),
            hypothesisId: "H1-bleed",
            runId: "door-shop-v3",
          }),
        }).catch(() => {});
      }
      // #endregion
    };

    updateTarget();
    el.addEventListener("scroll", updateTarget, { passive: true });
    window.addEventListener("resize", updateTarget);
    window.addEventListener("orientationchange", updateTarget);

    return () => {
      el?.removeEventListener("scroll", updateTarget);
      window.removeEventListener("resize", updateTarget);
      window.removeEventListener("orientationchange", updateTarget);
    };
  }, [active, getScrollRange, scrollHeight]);

  useEffect(() => {
    if (!active || prefersReducedMotion()) return;

    let raf = 0;
    const tick = () => {
      const target = targetProgressRef.current;
      const current = smoothedRef.current;
      const next = current + (target - current) * 0.11;
      smoothedRef.current = Math.abs(target - next) < 0.0004 ? target : next;
      setFocusProgress(smoothedRef.current);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  return {
    scrollRef,
    bindScrollRef,
    progressRef,
    focusProgress,
    scrollHeight,
    getScrollRange,
  };
}
