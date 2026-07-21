import * as THREE from "three";

const TEXTURE_KEYS = [
  "map",
  "normalMap",
  "roughnessMap",
  "metalnessMap",
  "aoMap",
  "emissiveMap",
  "alphaMap",
] as const;

function downscaleTextureIfNeeded(texture: THREE.Texture, maxSize: number) {
  const image = texture.image as CanvasImageSource & { width?: number; height?: number };
  if (!image || typeof image !== "object" || !image.width || !image.height) return;

  texture.anisotropy = 1;

  if (image.width <= maxSize && image.height <= maxSize) return;

  const scale = maxSize / Math.max(image.width, image.height);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.floor(image.width * scale));
  canvas.height = Math.max(1, Math.floor(image.height * scale));

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  try {
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    texture.image = canvas;
    texture.needsUpdate = true;
  } catch {
    // Skip textures that cannot be drawn to canvas.
  }
}

export function optimizeModelForGpu(root: THREE.Object3D, maxTextureSize = 1024) {
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;

    mesh.castShadow = false;
    mesh.receiveShadow = false;
    mesh.frustumCulled = true;

    // We no longer manually downscale textures here using Canvas API as it 
    // synchronously blocks the main thread for several seconds on huge assets.
    // Textures should be optimized via Draco/WEBP beforehand.
  });
}
