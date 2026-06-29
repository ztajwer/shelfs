import { useEffect, type RefObject } from "react";
import type { BoutiqueParallaxMotion } from "@/lib/boutiqueParallaxMotion";

export interface LuxuryParallaxOptions {
  bgRangePx?: number;
  bgRotateDeg?: number;
  bgScale?: number;
  /** Extra scale toward edges — Casa-style expand / reveal */
  expandBoost?: number;
  /** Pivot shift % — scene rotates from cursor area */
  originInfluence?: number;
  /** Extra-smooth layer for angle / tilt only */
  angleSmoothness?: number;
  textRangePx?: number;
  idleMs?: number;
  followSmoothness?: number;
  smoothness?: number;
  returnSmoothness?: number;
  velocityInfluence?: number;
  pointerGain?: number;
  responseExponent?: number;
}

/**
 * Casa di Solare–inspired preset: pan + expand + cursor pivot, tiny tilt.
 * @see https://casadisolare.com/
 */
export const CINEMATIC_PARALLAX = {
  bgRangePx: 30,
  bgRotateDeg: 2.1,
  bgScale: 1.16,
  expandBoost: 0.045,
  originInfluence: 16,
  angleSmoothness: 1.55,
  textRangePx: 6,
  idleMs: 420,
  followSmoothness: 2.75,
  smoothness: 1.92,
  returnSmoothness: 1.35,
  velocityInfluence: 0.11,
  pointerGain: 1.88,
  responseExponent: 0.74,
} as const;

const DEFAULTS = CINEMATIC_PARALLAX;

type Vec2 = { x: number; y: number };

function lerpExp(current: number, target: number, delta: number, smoothness: number) {
  const t = 1 - Math.exp(-smoothness * delta);
  return current + (target - current) * t;
}

function softClampAxis(value: number, limit = 1) {
  const abs = Math.abs(value);
  if (abs <= limit) return value;
  const sign = Math.sign(value);
  return sign * (limit + (abs - limit) * 0.18);
}

function shapePointerAxis(linear: number, gain: number, exponent: number) {
  if (Math.abs(linear) < 0.0001) return 0;
  const sign = Math.sign(linear);
  const shaped = Math.pow(Math.abs(linear), exponent) * gain;
  return softClampAxis(sign * shaped);
}

function createMotionState() {
  return {
    raw: { x: 0, y: 0 },
    aim: { x: 0, y: 0 },
    current: { x: 0, y: 0 },
    angle: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    lastNorm: { x: 0, y: 0 },
    lastMove: performance.now(),
    pointerActive: false,
    pointerType: "mouse",
  };
}

/**
 * Premium parallax — Casa-style pan, expand, cursor pivot, minimal tilt.
 */
export function useLuxuryParallax(
  sectionRef: RefObject<HTMLElement | null>,
  bgRef: RefObject<HTMLElement | null>,
  textRef: RefObject<HTMLElement | null> | null,
  options: LuxuryParallaxOptions & { enabled?: boolean; motionOut?: RefObject<BoutiqueParallaxMotion | null> } = {},
) {
  const {
    bgRangePx,
    bgRotateDeg,
    bgScale,
    expandBoost,
    originInfluence,
    angleSmoothness,
    textRangePx,
    idleMs,
    followSmoothness,
    smoothness,
    returnSmoothness,
    velocityInfluence,
    pointerGain,
    responseExponent,
    enabled = true,
    motionOut,
  } = { ...DEFAULTS, ...options };

  const configSig = [
    bgRangePx,
    bgRotateDeg,
    bgScale,
    expandBoost,
    originInfluence,
    angleSmoothness,
    textRangePx,
    idleMs,
    followSmoothness,
    smoothness,
    returnSmoothness,
    velocityInfluence,
    pointerGain,
    responseExponent,
    enabled,
  ].join("|");

  useEffect(() => {
    if (!enabled) return;

    const section = sectionRef.current;
    const bg = bgRef.current;
    const text = textRef?.current ?? null;
    if (!section || !bg) return;

    const pan = bg.parentElement;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion) {
      bg.style.transform = `scale(${bgScale})`;
      return;
    }

    const motion = createMotionState();
    let raf = 0;
    let lastFrame = performance.now();

    const readPointer = (clientX: number, clientY: number, now: number) => {
      const w = Math.max(window.innerWidth, 1);
      const h = Math.max(window.innerHeight, 1);
      const linearX = (clientX / w - 0.5) * 2;
      const linearY = (clientY / h - 0.5) * 2;
      const norm = {
        x: shapePointerAxis(linearX, pointerGain, responseExponent),
        y: shapePointerAxis(linearY, pointerGain, responseExponent),
      };

      const dt = Math.max(0.008, (now - motion.lastMove) / 1000);
      const vx = (norm.x - motion.lastNorm.x) / dt;
      const vy = (norm.y - motion.lastNorm.y) / dt;

      motion.velocity.x = motion.velocity.x * 0.72 + vx * 0.28;
      motion.velocity.y = motion.velocity.y * 0.72 + vy * 0.28;
      motion.lastNorm = norm;
      motion.raw = norm;
      motion.lastMove = now;
      motion.pointerActive = true;
    };

    const onPointerMove = (event: PointerEvent) => {
      readPointer(event.clientX, event.clientY, performance.now());
      motion.pointerType = event.pointerType;
    };

    const onPointerDown = (event: PointerEvent) => {
      motion.pointerType = event.pointerType;
      motion.pointerActive = true;
      readPointer(event.clientX, event.clientY, performance.now());
    };

    const onPointerUp = (event: PointerEvent) => {
      motion.pointerActive = false;
      if (event.pointerType === "touch") {
        motion.raw.x = 0;
        motion.raw.y = 0;
        motion.velocity.x = 0;
        motion.velocity.y = 0;
        motion.lastMove = 0;
      }
    };

    const onPointerCancel = (event: PointerEvent) => onPointerUp(event);

    const onDocumentLeave = (event: MouseEvent) => {
      if (event.relatedTarget === null) {
        motion.raw.x = 0;
        motion.raw.y = 0;
        motion.velocity.x = 0;
        motion.velocity.y = 0;
        motion.pointerActive = false;
        motion.lastMove = 0;
      }
    };

    const onVisibility = () => {
      if (!document.hidden) return;
      motion.raw.x = 0;
      motion.raw.y = 0;
      motion.velocity.x = 0;
      motion.velocity.y = 0;
      motion.pointerActive = false;
    };

    const applyCasaTransform = (panX: number, panY: number, angX: number, angY: number) => {
      const pivotX = 50 + angX * originInfluence;
      const pivotY = 50 + angY * originInfluence * 0.9;
      const pivot = `${pivotX.toFixed(2)}% ${pivotY.toFixed(2)}%`;

      bg.style.transformOrigin = pivot;
      if (pan) pan.style.perspectiveOrigin = pivot;

      const dist = Math.min(1, Math.hypot(panX, panY));
      const scale = bgScale + dist * expandBoost;

      const shiftX = -panX * bgRangePx;
      const shiftY = -panY * bgRangePx * 0.93;
      const rotY = angX * bgRotateDeg;
      const rotX = -angY * bgRotateDeg * 0.88;
      const depthZ = dist * 6;

      bg.style.transform = [
        `translate3d(${shiftX.toFixed(3)}px, ${shiftY.toFixed(3)}px, ${depthZ.toFixed(3)}px)`,
        `rotateX(${rotX.toFixed(4)}deg)`,
        `rotateY(${rotY.toFixed(4)}deg)`,
        `scale(${scale.toFixed(5)})`,
      ].join(" ");
    };

    const tick = (now: number) => {
      const delta = Math.min(0.05, (now - lastFrame) / 1000);
      lastFrame = now;

      const mouseIdle = motion.pointerType === "mouse" && now - motion.lastMove > idleMs;
      const returning =
        !motion.pointerActive && (mouseIdle || motion.pointerType === "touch");

      if (mouseIdle) {
        motion.raw.x = 0;
        motion.raw.y = 0;
        motion.velocity.x *= 0.9;
        motion.velocity.y *= 0.9;
      }

      const velX = -motion.velocity.x * velocityInfluence * 0.016;
      const velY = -motion.velocity.y * velocityInfluence * 0.016;
      const intentX = motion.raw.x + (returning ? 0 : velX);
      const intentY = motion.raw.y + (returning ? 0 : velY);

      motion.aim.x = lerpExp(motion.aim.x, intentX, delta, followSmoothness);
      motion.aim.y = lerpExp(motion.aim.y, intentY, delta, followSmoothness);

      const drift = returning ? returnSmoothness : smoothness;
      motion.current.x = lerpExp(motion.current.x, motion.aim.x, delta, drift);
      motion.current.y = lerpExp(motion.current.y, motion.aim.y, delta, drift);

      const angleDrift = returning ? returnSmoothness * 0.92 : angleSmoothness;
      motion.angle.x = lerpExp(motion.angle.x, motion.current.x, delta, angleDrift);
      motion.angle.y = lerpExp(motion.angle.y, motion.current.y, delta, angleDrift);

      applyCasaTransform(
        motion.current.x,
        motion.current.y,
        motion.angle.x,
        motion.angle.y,
      );

      if (motionOut?.current) {
        motionOut.current.panX = motion.current.x;
        motionOut.current.panY = motion.current.y;
        motionOut.current.angX = motion.angle.x;
        motionOut.current.angY = motion.angle.y;
      }

      if (text) {
        const textX = motion.current.x * textRangePx;
        const textY = motion.current.y * textRangePx * 0.9;
        text.style.transform = `translate3d(${textX.toFixed(3)}px, ${textY.toFixed(3)}px, 0)`;
      }

      raf = requestAnimationFrame(tick);
    };

    applyCasaTransform(0, 0, 0, 0);

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    window.addEventListener("pointercancel", onPointerCancel, { passive: true });
    document.documentElement.addEventListener("mouseleave", onDocumentLeave);
    document.addEventListener("visibilitychange", onVisibility);
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
      document.documentElement.removeEventListener("mouseleave", onDocumentLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      cancelAnimationFrame(raf);
      bg.style.transform = "";
      bg.style.transformOrigin = "";
      if (pan) pan.style.perspectiveOrigin = "";
      if (text) text.style.transform = "";
    };
  }, [sectionRef, bgRef, textRef, configSig, motionOut]);
}
