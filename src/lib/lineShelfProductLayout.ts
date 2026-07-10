import { getModelUrl } from "@/lib/modelAssets";
import type { ProductId } from "@/lib/products";
import { LINE_SHELF_COUNT } from "@/lib/lineShelfLayout";

/** Uniform product canvas size on each shelf line (px) */
export const LINE_SHELF_PRODUCT_SIZE_PX = 56;

/** 3D model scale inside product canvas */
export const LINE_SHELF_VIEW_PRODUCT_SIZE = 0.486;

/** Row 0 = top line, 1 = middle, 2 = bottom — one product per line, 3 per column */
export const LINE_SHELF_MERCH_ROWS = [
  {
    row: 0,
    tier: "upper" as const,
    left: "pro2.glb",
    right: "pro3.glb",
  },
  {
    row: 1,
    tier: "middle" as const,
    left: "pro1.glb",
    right: "pro4.glb",
  },
  {
    row: 2,
    tier: "lower" as const,
    left: "pro6.glb",
    right: "pro5.glb",
  },
] as const;

export const LINE_SHELF_SLOT_COUNT = LINE_SHELF_COUNT * 2;

/** Flush on glass — no floating gap */
export const LINE_SHELF_PRODUCT_ON_SHELF_PX = 0;

/** Front-facing camera — customer view */
export const LINE_SHELF_VIEW_CAMERA = {
  position: [0, 0.048, 1.14] as [number, number, number],
  fov: 40,
  lookAt: [0, 0.024, 0] as [number, number, number],
} as const;

/** Slight pitch — matches 8deg glass tilt */
export const LINE_SHELF_PRODUCT_PITCH_RAD = -0.12;

export interface LineShelfProductConfig {
  slotIndex: number;
  rowIndex: number;
  side: "left" | "right";
  tier: "upper" | "middle" | "lower";
  url: string;
  modelFile: string;
  productId: ProductId;
  productSizePx: number;
  displaySize: number;
  isTable?: boolean;
}

export function getLineShelfProductModelUrls(): string[] {
  const files = new Set<string>();
  for (const row of LINE_SHELF_MERCH_ROWS) {
    files.add(row.left);
    files.add(row.right);
  }
  return [...files].map((file) => getModelUrl(file));
}

export function getLineShelfProductConfig(
  slotIndex: number,
  side: "left" | "right",
): LineShelfProductConfig {
  const rowIndex = side === "left" ? slotIndex : slotIndex - LINE_SHELF_COUNT;
  const row = LINE_SHELF_MERCH_ROWS[rowIndex] ?? LINE_SHELF_MERCH_ROWS[0];
  const modelFile = side === "left" ? row.left : row.right;

  return {
    slotIndex,
    rowIndex,
    side,
    tier: row.tier,
    url: getModelUrl(modelFile),
    modelFile,
    productId: modelFile.replace(".glb", "") as ProductId,
    productSizePx: LINE_SHELF_PRODUCT_SIZE_PX,
    displaySize: LINE_SHELF_VIEW_PRODUCT_SIZE,
  };
}
