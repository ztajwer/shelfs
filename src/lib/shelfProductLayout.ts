import * as THREE from "three";
import {
  DESKTOP_BG_IMAGE,
  MOBILE_BG_IMAGE,
  imageUVToScreenPx,
  screenPxToNdc,
} from "@/lib/mobileBgAlign";
import { getWorldSizeFromScreenPixels } from "@/lib/worldSizing";

/** Primary shelf body — dark espresso wood */
export const SHELF_COLOR = "#1E1510";

/** Highlight / sheen tone */
export const SHELF_IVORY = "#FFF4E6";

/** Recessed interior & shadow tone */
export const SHELF_WARM = "#110C08";

/** Sleek Italian brass trim & dividers */
export const SHELF_GOLD = "#C5A059";

/** Exact viewport margins (px) — mobile-first */
export const SHELF_MARGIN_TOP_PX = 70;
export const SHELF_MARGIN_BOTTOM_PX = 60;

export type ShelfSide = "left" | "right" | "center";

export interface ShelfModelSlot {
  side: ShelfSide;
}

export const SHELF_PLACEMENT = {
  mobile: {
    left: { u: 0.142, screenPxScale: 1 },
    center: { u: 0.5, screenPxScale: 1 },
    right: { u: 0.858, screenPxScale: 1 },
  },
  desktop: {
    left: { u: 0.098, screenPxScale: 1 },
    center: { u: 0.5, screenPxScale: 1 },
    right: { u: 0.902, screenPxScale: 1 },
  },
} as const;

export const MOBILE_SHELF_MODELS: ShelfModelSlot[] = [{ side: "left" }, { side: "center" }, { side: "right" }];
export const DESKTOP_SHELF_MODELS: ShelfModelSlot[] = [{ side: "left" }, { side: "center" }, { side: "right" }];

export const BOUTIQUE_SHELF_CAMERA = {
  mobile: {
    position: [0, 0.18, 2.28] as [number, number, number],
    fov: 37,
    lookAt: [0, 0.2, -0.55] as [number, number, number],
  },
  desktop: {
    position: [0, 0.12, 2.42] as [number, number, number],
    fov: 32,
    lookAt: [0, 0.14, -0.5] as [number, number, number],
  },
} as const;

export const SHELF_DISPLAY_Z = { mobile: -0.64, desktop: -0.58 } as const;
export const SHELF_FORWARD_YAW = 0;

export interface ShelfModelLayoutItem {
  side: ShelfSide;
  position: [number, number, number];
  rotation: [number, number, number];
  displaySize: number;
  floorNdc: { x: number; y: number };
  topNdc: number;
  centerNdc: { x: number; y: number };
}

function getPlacement(side: ShelfSide, isMobile: boolean) {
  const bp = isMobile ? SHELF_PLACEMENT.mobile : SHELF_PLACEMENT.desktop;
  return bp[side];
}

export function getShelfVerticalBand(viewportH: number) {
  const top = SHELF_MARGIN_TOP_PX;
  const bottom = viewportH - SHELF_MARGIN_BOTTOM_PX;
  const center = (top + bottom) / 2;
  return {
    topPx: top,
    bottomPx: bottom,
    centerPx: center,
    heightPx: bottom - top,
  };
}

function getShelfBandNdc(
  side: ShelfSide,
  viewportW: number,
  viewportH: number,
  isMobile: boolean,
) {
  const band = getShelfVerticalBand(viewportH);
  const { u } = getPlacement(side, isMobile);
  const image = isMobile ? MOBILE_BG_IMAGE : DESKTOP_BG_IMAGE;
  const anchor = imageUVToScreenPx(u, 0.5, viewportW, viewportH, image.width, image.height);

  const floorNdc = screenPxToNdc(anchor.x, band.bottomPx, viewportW, viewportH);
  const topNdc = screenPxToNdc(anchor.x, band.topPx, viewportW, viewportH).y;
  const centerNdc = screenPxToNdc(anchor.x, band.centerPx, viewportW, viewportH);

  return { floorNdc, topNdc, centerNdc, bottomNdcY: floorNdc.y };
}

function rayHitDepthPlane(
  ndcX: number,
  ndcY: number,
  camera: THREE.PerspectiveCamera,
  planeZ: number,
): THREE.Vector3 {
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -planeZ);
  const hit = new THREE.Vector3();
  if (raycaster.ray.intersectPlane(plane, hit)) return hit;
  return new THREE.Vector3(0, 0, planeZ);
}

function prepareShelfCamera(
  camera: THREE.PerspectiveCamera,
  isMobile: boolean,
  viewportW: number,
  viewportH: number,
) {
  const cfg = isMobile ? BOUTIQUE_SHELF_CAMERA.mobile : BOUTIQUE_SHELF_CAMERA.desktop;
  camera.position.set(cfg.position[0], cfg.position[1], cfg.position[2]);
  camera.fov = cfg.fov;
  camera.near = 0.05;
  camera.far = 50;
  camera.aspect = viewportW / Math.max(viewportH, 1);
  camera.lookAt(cfg.lookAt[0], cfg.lookAt[1], cfg.lookAt[2]);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);
}

export function getShelfFloorNdc(
  side: ShelfSide,
  viewportW: number,
  viewportH: number,
  isMobile: boolean,
) {
  return getShelfBandNdc(side, viewportW, viewportH, isMobile).floorNdc;
}

export function getShelfModelLayout(
  viewportW: number,
  viewportH: number,
  isMobile: boolean,
  camera: THREE.PerspectiveCamera,
): ShelfModelLayoutItem[] {
  const slots = isMobile ? MOBILE_SHELF_MODELS : DESKTOP_SHELF_MODELS;
  const cfg = isMobile ? BOUTIQUE_SHELF_CAMERA.mobile : BOUTIQUE_SHELF_CAMERA.desktop;
  const planeZ = isMobile ? SHELF_DISPLAY_Z.mobile : SHELF_DISPLAY_Z.desktop;
  const band = getShelfVerticalBand(viewportH);

  prepareShelfCamera(camera, isMobile, viewportW, viewportH);

  const referenceDist = camera.position.distanceTo(new THREE.Vector3(0, 0.2, planeZ));
  const maxBandPx = band.heightPx * 0.92;
  const basePx = isMobile ? 320 : 380;

  const image = isMobile ? MOBILE_BG_IMAGE : DESKTOP_BG_IMAGE;

  return slots.map((slot) => {
    const placement = getPlacement(slot.side, isMobile);
    const bandNdc = getShelfBandNdc(slot.side, viewportW, viewportH, isMobile);
    const screenPx = Math.min(basePx, maxBandPx) * placement.screenPxScale;
    const displaySize = getWorldSizeFromScreenPixels(screenPx, viewportH, cfg.fov, referenceDist);

    const ndc = screenPxToNdc(
      imageUVToScreenPx(placement.u, 0.5, viewportW, viewportH, image.width, image.height).x,
      band.topPx + band.heightPx * 0.08,
      viewportW,
      viewportH,
    );
    const hit = rayHitDepthPlane(ndc.x, ndc.y, camera, planeZ);

    return {
      side: slot.side,
      position: [hit.x, hit.y, planeZ] as [number, number, number],
      rotation: [0, SHELF_FORWARD_YAW, 0] as [number, number, number],
      displaySize,
      floorNdc: bandNdc.floorNdc,
      topNdc: bandNdc.topNdc,
      centerNdc: bandNdc.centerNdc,
    };
  });
}

/** Fit shelf in band — top locked at 70px, bottom respects margin */
export function refineShelfToVerticalBand(
  root: THREE.Object3D,
  camera: THREE.PerspectiveCamera,
  targetNdcX: number,
  bottomNdcY: number,
  topNdcY: number,
  _centerNdcY: number,
  position: [number, number, number],
  rotation: [number, number, number],
): { x: number; y: number } {
  const scratch = new THREE.Vector3();
  const box = new THREE.Box3();

  const metrics = (x: number, y: number) => {
    root.position.set(x, y, position[2]);
    root.rotation.set(rotation[0], rotation[1], rotation[2]);
    root.updateMatrixWorld(true);
    box.setFromObject(root);
    const bottom = new THREE.Vector3((box.min.x + box.max.x) * 0.5, box.min.y, box.max.z);
    const top = new THREE.Vector3((box.min.x + box.max.x) * 0.5, box.max.y, box.max.z);
    const center = box.getCenter(new THREE.Vector3());
    bottom.project(camera);
    top.project(camera);
    center.project(camera);
    return { bottomY: bottom.y, topY: top.y, centerY: center.y, centerX: center.x };
  };

  let lowY = position[1] - 0.6;
  let highY = position[1] + 0.6;
  let y = position[1];

  for (let i = 0; i < 44; i++) {
    const mid = (lowY + highY) / 2;
    const m = metrics(position[0], mid);
    if (m.topY > topNdcY) highY = mid;
    else lowY = mid;
    y = mid;
  }

  const afterTop = metrics(position[0], y);
  if (afterTop.bottomY < bottomNdcY) {
    let bLow = y;
    let bHigh = y + 0.5;
    for (let i = 0; i < 32; i++) {
      const mid = (bLow + bHigh) / 2;
      const m = metrics(position[0], mid);
      if (m.bottomY < bottomNdcY) bLow = mid;
      else bHigh = mid;
      y = mid;
    }
  }

  let lowX = position[0] - 0.22;
  let highX = position[0] + 0.22;
  let x = position[0];

  for (let i = 0; i < 32; i++) {
    const mid = (lowX + highX) / 2;
    const m = metrics(mid, y);
    if (m.centerX > targetNdcX) highX = mid;
    else lowX = mid;
    x = mid;
  }

  return { x, y };
}

/** @deprecated use refineShelfToVerticalBand */
export function refineShelfBottomToFloor(
  root: THREE.Object3D,
  camera: THREE.PerspectiveCamera,
  targetNdcX: number,
  targetNdcY: number,
  position: [number, number, number],
  rotation: [number, number, number],
): { x: number; y: number } {
  return refineShelfToVerticalBand(
    root,
    camera,
    targetNdcX,
    targetNdcY,
    1,
    0,
    position,
    rotation,
  );
}
