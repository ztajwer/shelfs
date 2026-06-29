/** Luxury ease-out — slow start, refined deceleration (Apple-style) */
export function easeLuxuryCinematic(t: number): number {
  const c = Math.min(1, Math.max(0, t));
  return 1 - Math.pow(1 - c, 4);
}

/** Smooth 0→1 for overlays and blends */
export function easeFocusProgress(t: number): number {
  const clamped = Math.min(1, Math.max(0, t));
  return clamped * clamped * (3 - 2 * clamped);
}

function delayedProgress(progress: number, start = 0.12): number {
  if (progress <= start) return 0;
  return easeLuxuryCinematic((progress - start) / (1 - start));
}

/** Subtle world scale — jewelry grows slightly as camera approaches */
export function getFocusTableScale(progress: number): number {
  return 1 + easeLuxuryCinematic(progress) * 0.04;
}

export function getFocusProductScale(progress: number): number {
  return 1 + easeLuxuryCinematic(progress) * 0.08;
}

/** Camera dolly — depth-only zoom toward the display table */
export function getFocusCameraDolly(progress: number): number {
  return easeLuxuryCinematic(progress) * 0.22;
}

/** Subtle vertical camera rise while dollying in */
export function getFocusCameraLift(progress: number): number {
  return easeLuxuryCinematic(progress) * 0.035;
}

export function getFocusCameraFovDelta(progress: number): number {
  return easeLuxuryCinematic(progress) * 1.8;
}

/** Subtle luxurious background blur */
export function getFocusBlurPx(progress: number): number {
  return delayedProgress(progress, 0.14) * 5.5;
}

/** Warm white boutique veil */
export function getFocusVeilOpacity(progress: number): number {
  return delayedProgress(progress, 0.1) * 0.4;
}

/** Background stays fixed — micro scale-down for depth separation */
export function getFocusBgScale(progress: number): number {
  return 1 - delayedProgress(progress, 0.08) * 0.022;
}

/** Vertical lift only — table rises toward center while zooming (no lateral motion) */
export function getFocusBottomLiftPx(progress: number): number {
  return easeLuxuryCinematic(progress) * 14;
}

/** Products fully visible on hero load */
export function getFocusProductReveal(progress: number): number {
  return 1;
}

/** No extra CSS scale — zoom handled by camera + world scale only */
export function getFocusHeroCssScale(_progress: number): number {
  return 1;
}

export function getShopFocusScrollRange(): number {
  if (typeof window === "undefined") return 1000;
  return Math.max(480, Math.round(window.innerHeight * 1.12));
}

export function getShopFocusScrollHeight(): number {
  if (typeof window === "undefined") return 2000;
  return Math.round(window.innerHeight + getShopFocusScrollRange());
}
