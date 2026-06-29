/** Fraction of shop scroll range after enter anchor before table zoom counts */
export const SHOP_FOCUS_AFTER_ENTER_PX = 0.55;

/** Pixels of scroll after door fully open before table zoom can begin (baseline) */
export const SHOP_FOCUS_DEADZONE_PX = 120;

/** Ms without scroll before table zoom can arm (blocks same-gesture fling bleed) */
export const SHOP_FOCUS_IDLE_MS = 220;

/** Door progress threshold to reveal the boutique */
export const SHOP_ENTER_DOOR_PROGRESS = 0.96;

export function getShopFocusStartPx(openDist: number): number {
  return openDist + SHOP_FOCUS_DEADZONE_PX;
}

export function getUnifiedExperienceScrollHeight(openDist: number, shopRange: number): number {
  if (typeof window === "undefined") return 2400;
  const focusStart = getShopFocusStartPx(openDist);
  return Math.round(focusStart + shopRange + window.innerHeight * 0.35);
}

/**
 * Table zoom only after BOTH: past door deadzone AND intentional scroll beyond enter point.
 * Prevents one continuous door fling from zooming the table.
 */
export function getShopFocusRawFromScroll(
  scrollTop: number,
  openDist: number,
  shopRange: number,
  enteredAtScrollTop?: number | null,
): number {
  if (shopRange <= 0) return 0;

  const baselineStart = getShopFocusStartPx(openDist);
  const enterAnchor =
    typeof enteredAtScrollTop === "number"
      ? enteredAtScrollTop + shopRange * SHOP_FOCUS_AFTER_ENTER_PX
      : baselineStart;
  const focusStart = Math.max(baselineStart, enterAnchor);

  if (scrollTop <= focusStart) return 0;
  return Math.min(1, (scrollTop - focusStart) / shopRange);
}
