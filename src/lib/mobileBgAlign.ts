/** imagemob.png intrinsic size — must match public/imagemob.png */
export const MOBILE_BG_IMAGE = { width: 852, height: 1846 } as const;

/** image.png intrinsic size — must match public/image.png */
export const DESKTOP_BG_IMAGE = { width: 1536, height: 1024 } as const;

export function getBgContainRect(
  viewportW: number,
  viewportH: number,
  imageW: number,
  imageH: number,
  objectPositionX = 0.5,
  objectPositionY = 0.5,
) {
  const imgAspect = imageW / imageH;
  const vpAspect = viewportW / viewportH;

  if (vpAspect > imgAspect) {
    const height = viewportH;
    const width = height * imgAspect;
    return {
      width,
      height,
      offsetX: (viewportW - width) * objectPositionX,
      offsetY: 0,
    };
  }

  const width = viewportW;
  const height = width / imgAspect;
  return {
    width,
    height,
    offsetX: 0,
    offsetY: (viewportH - height) * objectPositionY,
  };
}

export function getMobileBgContainRect(
  viewportW: number,
  viewportH: number,
  objectPositionX = 0.5,
  objectPositionY = 0.5,
) {
  return getBgContainRect(
    viewportW,
    viewportH,
    MOBILE_BG_IMAGE.width,
    MOBILE_BG_IMAGE.height,
    objectPositionX,
    objectPositionY,
  );
}

/** Normalized image UV (0–1) → viewport pixel coords (object-fit: contain, centered). */
export function imageUVToScreenPx(
  u: number,
  v: number,
  viewportW: number,
  viewportH: number,
  imageW: number,
  imageH: number,
  objectPositionX = 0.5,
  objectPositionY = 0.5,
) {
  const rect = getBgContainRect(viewportW, viewportH, imageW, imageH, objectPositionX, objectPositionY);
  return {
    x: rect.offsetX + rect.width * u,
    y: rect.offsetY + rect.height * v,
  };
}

/** Viewport pixel → NDC (-1…1), origin top-left of viewport. */
export function screenPxToNdc(x: number, y: number, viewportW: number, viewportH: number) {
  return {
    x: (x / viewportW) * 2 - 1,
    y: 1 - (y / viewportH) * 2,
  };
}
