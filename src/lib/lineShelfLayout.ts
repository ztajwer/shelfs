/** Horizontal line length on screen (px) — exact per shelf */
export const LINE_SHELF_WIDTH_PX = 600;

/** Distance from screen edge to each side column (px) */
export const LINE_SHELF_SIDE_INSET_PX = 18;

/** Vertical gap between shelf lines within one side (px) */
export const LINE_SHELF_GAP_PX = 100;

/** Lines per side (left & right) */
export const LINE_SHELF_COUNT = 3;

/** Lift shelf columns upward from vertical center (px) */
export const LINE_SHELF_VERTICAL_LIFT_PX = 64;

/** Visual thickness of glass plank (px) */
export const LINE_SHELF_THICKNESS_PX = 5;

export const LINE_SHELF_COLOR = "#F0DFB8";
export const LINE_SHELF_GLOW = "#FFE4A8";
export const LINE_SHELF_GOLD = "#D4AF37";

export function getLineShelfBlockHeightPx(): number {
  return (
    LINE_SHELF_COUNT * LINE_SHELF_THICKNESS_PX +
    (LINE_SHELF_COUNT - 1) * LINE_SHELF_GAP_PX
  );
}
