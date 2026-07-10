"use client";

import { useEffect, useRef, useState } from "react";
import { startShopModelLoads } from "@/lib/modelPreload";
import { createBoutiqueParallaxMotion } from "@/lib/boutiqueParallaxMotion";
import BoutiqueParallaxBg from "./BoutiqueParallaxBg";
import Table3D from "../Table3D";
import LineShelfProductMini from "./LineShelfProductMini";
import ProductCarousel3D from "./ProductCarousel3D";
import { PRODUCTS, type ProductId } from "@/lib/products";
import { getModelUrl } from "@/lib/modelAssets";
import {
  LINE_SHELF_PRODUCT_SIZE_PX,
  type LineShelfProductConfig,
} from "@/lib/lineShelfProductLayout";
import { Canvas } from "@react-three/fiber";
import { View } from "@react-three/drei";
import { applyJewelryRendererSettings } from "@/lib/productModelUtils";

interface BoutiqueRoomProps {
  visible: boolean;
  focusProgress?: number;
}

const BOUTIQUE_IMAGE = "/image.png";
const BOUTIQUE_VIDEO_MOBILE = "/vidmob.mp4";
const BOUTIQUE_IMAGE_MOBILE_POSTER = "/imagemob.png";

// Custom premium scales for realistic real-world jewelry sizing on display shelves
const PRODUCT_SHELF_SCALES: Record<ProductId, number> = {
  pro1: 0.32, // Heritage Ring
  pro2: 0.38, // Luna Bracelet
  pro3: 0.39, // Royal Bangles
  pro4: 0.43, // Cascade Necklace
  pro5: 0.33, // Starlight Earrings
  pro6: 0.28, // Signature Perfume Showcase
};

// Custom resolver to build correct metadata config for any product in any slot
function getCustomProductConfig(
  productId: ProductId,
  slotIndex: number,
  side: "left" | "right"
): LineShelfProductConfig {
  const product = PRODUCTS[productId];
  const rowIndex = Math.floor(slotIndex / 2);
  const tier = rowIndex === 0 ? "upper" : rowIndex === 1 ? "middle" : "lower";

  return {
    slotIndex,
    rowIndex,
    side,
    tier,
    url: getModelUrl(product.modelFile),
    modelFile: product.modelFile,
    productId,
    productSizePx: LINE_SHELF_PRODUCT_SIZE_PX,
    displaySize: PRODUCT_SHELF_SCALES[productId] ?? 0.48,
  };
}

function getTableProductConfig(
  productId: ProductId,
  slotIndex: number,
  tier: "upper" | "middle" | "lower"
): LineShelfProductConfig {
  const product = PRODUCTS[productId];
  const tableScales: Record<ProductId, number> = {
    pro1: 0.44, // Heritage Ring
    pro2: 0.48, // Luna Bracelet
    pro3: 0.48,
    pro4: 0.52, // Cascade Necklace
    pro5: 0.44,
    pro6: 0.40,
  };

  const sizePx = tier === "upper" ? 48 : tier === "middle" ? 55 : 62;
  const scaleMult = tier === "upper" ? 0.78 : tier === "middle" ? 0.95 : 1.12;

  return {
    slotIndex,
    rowIndex: 0,
    side: "left",
    tier,
    url: getModelUrl(product.modelFile),
    modelFile: product.modelFile,
    productId,
    productSizePx: sizePx,
    displaySize: (tableScales[productId] ?? 0.48) * scaleMult,
    isTable: true,
  };
}

export default function BoutiqueRoom({ visible, focusProgress = 0 }: BoutiqueRoomProps) {
  const roomRef = useRef<HTMLDivElement>(null);
  const motionRef = useRef(createBoutiqueParallaxMotion());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!visible) return;
    startShopModelLoads();

    const img = new window.Image();
    img.src = BOUTIQUE_IMAGE;

    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.src = BOUTIQUE_VIDEO_MOBILE;
  }, [visible]);

  if (!visible || !mounted) return null;

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
        {/* Left shelf PNG — aligned to the left shelf unit in image.png */}
        <img
          src="/shelf.png?v=3"
          alt=""
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            top: "27%",
            left: "9.5%",
            width: "clamp(90px, 29vw, 435px)",
            height: "clamp(190px, 32vh, 330px)",
            objectFit: "fill",
            transform: "translateY(15px)",
            zIndex: 10,
          }}
        />

        {/* Left shelf 3D products overlay container */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "27%",
            left: "9.5%",
            width: "clamp(90px, 29vw, 435px)",
            height: "clamp(190px, 32vh, 330px)",
            transform: "translateY(15px)",
            zIndex: 15,
          }}
        >
          {/* Upper Shelf Line: pro6 (Signature Perfume - Centered) — 18px above */}
          <div className="pointer-events-auto" style={{ position: "absolute", top: "29.5%", left: "50%", transform: "translate(-50%, -93%) translateY(22px)" }}>
            <LineShelfProductMini config={getCustomProductConfig("pro6", 0, "left")} mountDelay={0} />
          </div>

          {/* Middle Shelf Line: pro2 (Bracelet - Centered) — 8px above */}
          <div className="pointer-events-auto" style={{ position: "absolute", top: "56.0%", left: "50%", transform: "translate(-50%, -93%) translateY(8px)" }}>
            <LineShelfProductMini config={getCustomProductConfig("pro2", 2, "left")} mountDelay={120} />
          </div>

          {/* Lower Shelf Line: pro4 (Red Ruby Necklace - Centered) */}
          <div className="pointer-events-auto" style={{ position: "absolute", top: "82.5%", left: "50%", transform: "translate(-50%, -93%) translateY(-8px)" }}>
            <LineShelfProductMini config={getCustomProductConfig("pro4", 4, "left")} mountDelay={240} />
          </div>
        </div>

        {/* Right shelf PNG — aligned to the right shelf unit in image.png (mirrored) */}
        <img
          src="/shelf.png?v=3"
          alt=""
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            top: "27%",
            right: "9.5%",
            width: "clamp(90px, 29vw, 435px)",
            height: "clamp(190px, 32vh, 330px)",
            objectFit: "fill",
            transform: "scaleX(-1) translateY(15px)",
            zIndex: 10,
          }}
        />

        {/* Right shelf 3D products overlay container */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "27%",
            right: "9.5%",
            width: "clamp(90px, 29vw, 435px)",
            height: "clamp(190px, 32vh, 330px)",
            transform: "translateY(15px)",
            zIndex: 15,
          }}
        >
          {/* Upper Shelf Line: pro5 (Sovereign Pendant - Centered) */}
          <div className="pointer-events-auto" style={{ position: "absolute", top: "29.5%", left: "50%", transform: "translate(-50%, -93%) translateY(18px)" }}>
            <LineShelfProductMini config={getCustomProductConfig("pro5", 0, "right")} mountDelay={360} />
          </div>

          {/* Middle Shelf Line: pro3 (Bangles - Centered) */}
          <div className="pointer-events-auto" style={{ position: "absolute", top: "56.0%", left: "50%", transform: "translate(-50%, -93%) translateY(8px)" }}>
            <LineShelfProductMini config={getCustomProductConfig("pro3", 2, "right")} mountDelay={480} />
          </div>

          {/* Lower Shelf Line: pro1 (Ring - Centered) */}
          <div className="pointer-events-auto" style={{ position: "absolute", top: "82.5%", left: "50%", transform: "translate(-50%, -93%) translateY(-4px)" }}>
            <LineShelfProductMini config={getCustomProductConfig("pro1", 4, "right")} mountDelay={600} />
          </div>
        </div>

        {/* 3D Display Table — inside parallax so it moves with the background */}
        <Table3D opacity={1} />

        {/* Luxury 3D Product Carousel positioned directly on the display table surface */}
        <div
          className="absolute bottom-[375px] md:bottom-[460px] left-[50%] -translate-x-1/2 z-[65] w-[92%] max-w-[460px] md:max-w-[720px] flex justify-center items-center pointer-events-none"
        >
          <ProductCarousel3D />
        </div>

      </BoutiqueParallaxBg>

      {/* Global Canvas for all line shelf and table products overlay */}
      <div
        className="fixed inset-0 pointer-events-none w-screen h-screen"
        style={{ zIndex: 60 }}
      >
        <Canvas
          eventSource={roomRef as any}
          className="w-full h-full"
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0);
            applyJewelryRendererSettings(gl, 1.15);
          }}
        >
          <View.Port />
        </Canvas>
      </div>
    </div>
  );
}
