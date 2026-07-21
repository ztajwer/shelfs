"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getDoorOpenDistance } from "@/lib/doorFraming";
import {
  easeLuxuryCinematic,
  getShopFocusScrollRange,
} from "@/lib/shopScrollFocus";
import {
  getShopFocusRawFromScroll,
  getShopFocusStartPx,
  getUnifiedExperienceScrollHeight,
  SHOP_FOCUS_AFTER_ENTER_PX,
  SHOP_FOCUS_IDLE_MS,
} from "@/lib/experienceScroll";

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * One scroll container for door + boutique: door uses scrollTop 0→openDist,
 * table zoom only after openDist + deadzone so door gesture never zooms the table.
 */
export function useExperienceScroll(ready: boolean, skipIntro = false) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(skipIntro ? 1 : 0);
  const targetFocusRef = useRef(0);
  const smoothedFocusRef = useRef(0);
  const [doorProgress, setDoorProgress] = useState(skipIntro ? 1 : 0);
  const [entered, setEntered] = useState(skipIntro);
  const [focusProgress, setFocusProgress] = useState(0);
  const [scrollHeight, setScrollHeight] = useState(0);
  const enteredAtScrollRef = useRef<number | null>(null);
  const shopLatchedRef = useRef(skipIntro);
  const scrollTopRef = useRef(0);
  const openDistRef = useRef(0);
  const shopRangeRef = useRef(0);
  const effectiveFocusStartRef = useRef(0);
  const lastScrollTsRef = useRef(0);
  const focusArmedRef = useRef(false);
  const prevEnteredRef = useRef(false);
  const lastLoggedScrollRef = useRef(-1);

  const getOpenDistance = useCallback(() => getDoorOpenDistance(), []);
  const getShopRange = useCallback(() => getShopFocusScrollRange(), []);

  useEffect(() => {
    if (!ready) return;
    const openDist = getOpenDistance();
    const shopRange = getShopRange();
    setScrollHeight(getUnifiedExperienceScrollHeight(openDist, shopRange));
    
    if (skipIntro && scrollRef.current && !enteredAtScrollRef.current) {
      enteredAtScrollRef.current = openDist;
      const targetScroll = openDist + shopRange;
      scrollRef.current.scrollTop = targetScroll;
      scrollTopRef.current = targetScroll;
      focusArmedRef.current = true;
    }
  }, [ready, getOpenDistance, getShopRange, skipIntro]);

  useEffect(() => {
    if (!ready) return;
    if (!prefersReducedMotion()) return;

    progressRef.current = 1;
    setDoorProgress(1);
    shopLatchedRef.current = true;
    const openDist = getOpenDistance();
    enteredAtScrollRef.current = openDist;
    setEntered(true);
    targetFocusRef.current = 0;
    smoothedFocusRef.current = 0;
    setFocusProgress(0);

    if (scrollRef.current) {
      scrollRef.current.scrollTop = openDist;
    }
  }, [ready, getOpenDistance]);


  useEffect(() => {
    if (!ready || prefersReducedMotion()) return;

    const el = scrollRef.current;
    if (!el) return;

    const update = () => {
      const openDist = getOpenDistance();
      const shopRange = getShopRange();
      let st = el.scrollTop;

      const doorFullyOpen = st >= openDist;
      if (doorFullyOpen && !shopLatchedRef.current) {
        enteredAtScrollRef.current = openDist;
        shopLatchedRef.current = true;
        setEntered(true);
      }

      // Once in the boutique, never scroll back into the door zone (prevents door UI / progress rewind).
      if (shopLatchedRef.current && st < openDist) {
        el.scrollTop = openDist;
        st = openDist;

      }

      const dp = shopLatchedRef.current ? 1 : Math.min(1, Math.max(0, st / openDist));
      progressRef.current = dp;
      setDoorProgress(dp);

      scrollTopRef.current = st;
      openDistRef.current = openDist;
      shopRangeRef.current = shopRange;
      lastScrollTsRef.current = performance.now();

      const enterAnchor = enteredAtScrollRef.current;
      effectiveFocusStartRef.current =
        enterAnchor != null
          ? Math.max(getShopFocusStartPx(openDist), enterAnchor + shopRange * SHOP_FOCUS_AFTER_ENTER_PX)
          : getShopFocusStartPx(openDist);


    };

    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, [ready, getOpenDistance, getShopRange, scrollHeight]);

  useEffect(() => {
    if (!ready || prefersReducedMotion()) return;

    let raf = 0;
    const tick = () => {
      const st = scrollTopRef.current;
      const openDist = openDistRef.current;
      const shopRange = shopRangeRef.current;
      const scrollIdle = performance.now() - lastScrollTsRef.current >= SHOP_FOCUS_IDLE_MS;

      if (shopLatchedRef.current && scrollIdle) {
        focusArmedRef.current = true;
      }

      const focusRaw =
        shopLatchedRef.current && focusArmedRef.current
          ? getShopFocusRawFromScroll(st, openDist, shopRange, enteredAtScrollRef.current)
          : 0;
      const eased = easeLuxuryCinematic(focusRaw);
      targetFocusRef.current = eased;

      const current = smoothedFocusRef.current;
      const next = current + (eased - current) * 0.11;
      smoothedFocusRef.current = Math.abs(eased - next) < 0.0004 ? eased : next;
      setFocusProgress(smoothedFocusRef.current);



      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ready]);

  const brightness = Math.min(1, Math.max(0, (doorProgress - 0.2) / 0.75));
  const canvasOpacity = Math.min(1, Math.max(0, 1 - (doorProgress - 0.55) / 0.45));

  const forceEnter = useCallback(() => {
    const openDist = getOpenDistance();
    if (scrollRef.current) {
      scrollRef.current.scrollTop = openDist;
    }
    progressRef.current = 1;
    setDoorProgress(1);
    shopLatchedRef.current = true;
    enteredAtScrollRef.current = openDist;
    setEntered(true);
  }, [getOpenDistance]);

  return {
    scrollRef,
    progressRef,
    doorProgress,
    entered,
    focusProgress,
    scrollHeight,
    brightness,
    canvasOpacity,
    getOpenDistance,
    forceEnter,
  };
}
