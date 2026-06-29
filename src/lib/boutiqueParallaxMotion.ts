export type BoutiqueParallaxMotion = {
  panX: number;
  panY: number;
  angX: number;
  angY: number;
};

export function createBoutiqueParallaxMotion(): BoutiqueParallaxMotion {
  return { panX: 0, panY: 0, angX: 0, angY: 0 };
}
