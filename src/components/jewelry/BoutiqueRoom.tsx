"use client";

import { useEffect, useRef } from "react";
import { startShopModelLoads } from "@/lib/modelPreload";
import { SHOP_LINE_SHELVES_ENABLED, SHOP_SHELVES_ENABLED } from "@/lib/shopTableEnabled";
import { createBoutiqueParallaxMotion } from "@/lib/boutiqueParallaxMotion";
import BoutiqueShelfProducts from "./BoutiqueShelfProducts";
import BoutiqueLineShelves from "./BoutiqueLineShelves";
import BoutiqueParallaxBg from "./BoutiqueParallaxBg";
import Table3D from "../Table3D";

interface BoutiqueRoomProps {
  visible: boolean;
  focusProgress?: number;
}

const BOUTIQUE_IMAGE = "/image.png";
const BOUTIQUE_VIDEO_MOBILE = "/vidmob.mp4";
const BOUTIQUE_IMAGE_MOBILE_POSTER = "/imagemob.png";

export default function BoutiqueRoom({ visible, focusProgress = 0 }: BoutiqueRoomProps) {
  const roomRef = useRef<HTMLDivElement>(null);
  const motionRef = useRef(createBoutiqueParallaxMotion());

  useEffect(() => {
    if (!visible) return;
    startShopModelLoads();

    const img = new window.Image();
    img.src = BOUTIQUE_IMAGE;

    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.src = BOUTIQUE_VIDEO_MOBILE;
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      ref={roomRef}
      className="boutique-room boutique-hero"
      aria-label="MAJ Boutique showroom"
    >
      <BoutiqueParallaxBg
        mobileVideoSrc={BOUTIQUE_VIDEO_MOBILE}
        mobilePosterSrc={BOUTIQUE_IMAGE_MOBILE_POSTER}
        desktopSrc={BOUTIQUE_IMAGE}
        roomRef={roomRef}
        active={visible}
        motionRef={motionRef}
        focusProgress={focusProgress}
      >
        {SHOP_LINE_SHELVES_ENABLED && (
          <BoutiqueLineShelves visible={visible} />
        )}
        {SHOP_SHELVES_ENABLED && (
          <BoutiqueShelfProducts visible={visible} />
        )}
        <Table3D opacity={1} />
      </BoutiqueParallaxBg>
    </div>
  );
}
