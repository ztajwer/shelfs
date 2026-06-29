"use client";

import BoutiqueRoom from "./BoutiqueRoom";

interface ShopExperienceProps {
  visible: boolean;
  focusProgress: number;
}

export default function ShopExperience({ visible, focusProgress }: ShopExperienceProps) {
  if (!visible) return null;

  return (
    <div className="shop-experience boutique-hero-stage fixed inset-0 z-[40] overflow-hidden pointer-events-none">
      <BoutiqueRoom visible={visible} focusProgress={focusProgress} />
    </div>
  );
}
