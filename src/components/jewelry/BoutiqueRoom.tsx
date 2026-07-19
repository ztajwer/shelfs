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
const BOUTIQUE_VIDEO_MOBILE = "";
const BOUTIQUE_IMAGE_MOBILE_POSTER = "/imagemob.png";

// Custom premium scales for realistic real-world jewelry sizing on display shelves
const PRODUCT_SHELF_SCALES: Record<ProductId, number> = {
  pro1: 0.32, // Heritage Ring
  pro2: 0.38, // Luna Bracelet
  pro3: 0.39, // Royal Bangles
  pro4: 0.43, // Cascade Necklace
  pro5: 0.33, // Starlight Earrings
  pro6: 0.28, // Signature Perfume Showcase
  proo: 0.65, // Increased scale for bigger product
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

function getCarouselProductConfig(
  productId: ProductId,
  slotIndex: number
): LineShelfProductConfig {
  const product = PRODUCTS[productId];
  return {
    slotIndex,
    rowIndex: 0,
    side: "left",
    tier: "middle",
    url: getModelUrl(product.modelFile),
    modelFile: product.modelFile,
    productId,
    productSizePx: 80,
    displaySize: 0.48,
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
          src="/shelf.png?v=4"
          alt=""
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            top: "calc(32% + 5px)", // Moved 5px bottom
            left: "7%", // Slightly more space between shelves than original 8%
            width: "clamp(85px, calc(40vw - 25px), 500px)", // A little smaller
            height: "clamp(45px, calc(34vh - 145px), 330px)", // A little smaller
            objectFit: "fill",
            transform: "scaleX(1.35) scaleY(0.9)",
            zIndex: 10,
          }}
        />

        {/* Left shelf 3D products overlay container */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "calc(32% + 5px)",
            left: "7%", // Slightly more space between shelves than original 8%
            width: "clamp(85px, calc(40vw - 25px), 500px)",
            height: "clamp(45px, calc(34vh - 145px), 330px)",
            transform: "scaleX(1.35) scaleY(0.9)",
            zIndex: 15,
          }}
        >
          <div className="pointer-events-auto" style={{ position: "absolute", top: "75%", left: "50%", transform: "translate(-50%, -93%)" }}>
            <div style={{ position: "relative", zIndex: 20 }}>
              <LineShelfProductMini config={getCustomProductConfig("pro1", 0, "left")} mountDelay={120} />
            </div>
            {/* Display Pedestal Box */}
            <div 
              style={{
                position: "absolute",
                bottom: "15px", 
                left: "50%",
                transform: "translateX(-50%)", 
                width: "45px", 
                height: "18px", 
                background: "#D6B697", 
                border: "1px solid rgba(212, 175, 55, 0.4)", 
                boxShadow: "0 6px 12px rgba(0,0,0,0.15), inset 0 2px 4px rgba(255,255,255,0.4)",
                borderRadius: "2px",
                zIndex: 10
              }}
            />
          </div>
        </div>

        {/* Center shelf PNG */}
        <img
          src="/shelf.png?v=4"
          alt=""
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            top: "calc(32% + 5px)",
            left: "50%",
            width: "clamp(85px, calc(40vw - 25px), 500px)",
            height: "clamp(45px, calc(34vh - 145px), 330px)",
            objectFit: "fill",
            transform: "translateX(-50%) scaleX(1.35) scaleY(0.9)",
            zIndex: 10,
          }}
        />

        {/* Center shelf 3D products overlay container */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "calc(32% + 5px)",
            left: "50%",
            width: "clamp(85px, calc(40vw - 25px), 500px)",
            height: "clamp(45px, calc(34vh - 145px), 330px)",
            transform: "translateX(-50%) scaleX(1.35) scaleY(0.9)",
            zIndex: 15,
          }}
        >
          <div className="pointer-events-auto" style={{ position: "absolute", top: "75%", left: "50%", transform: "translate(-50%, -93%)" }}>
            <div style={{ position: "relative", zIndex: 20 }}>
              <LineShelfProductMini config={getCustomProductConfig("pro6", 1, "left")} mountDelay={240} />
            </div>
            {/* Display Pedestal Box */}
            <div 
              style={{
                position: "absolute",
                bottom: "15px", 
                left: "50%",
                transform: "translateX(-50%)", 
                width: "45px", 
                height: "18px", 
                background: "#D6B697", 
                border: "1px solid rgba(212, 175, 55, 0.4)", 
                boxShadow: "0 6px 12px rgba(0,0,0,0.15), inset 0 2px 4px rgba(255,255,255,0.4)",
                borderRadius: "2px",
                zIndex: 10
              }}
            />
          </div>
        </div>

        {/* Right shelf PNG — aligned to the right shelf unit in image.png (mirrored) */}
        <img
          src="/shelf.png?v=4"
          alt=""
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            top: "calc(32% + 5px)", // Moved 5px bottom
            right: "7%", // Slightly more space between shelves than original 8%
            width: "clamp(85px, calc(40vw - 25px), 500px)", // A little smaller
            height: "clamp(45px, calc(34vh - 145px), 330px)", // A little smaller
            objectFit: "fill",
            transform: "scaleX(-1.35) scaleY(0.9)",
            zIndex: 10,
          }}
        />

        {/* Right shelf 3D products overlay container */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "calc(32% + 5px)",
            right: "7%", // Slightly more space between shelves than original 8%
            width: "clamp(85px, calc(40vw - 25px), 500px)",
            height: "clamp(45px, calc(34vh - 145px), 330px)",
            transform: "scaleX(1.35) scaleY(0.9)",
            zIndex: 15,
          }}
        >
          <div className="pointer-events-auto" style={{ position: "absolute", top: "75%", left: "50%", transform: "translate(-50%, -93%)" }}>
            <div style={{ position: "relative", zIndex: 20 }}>
              <LineShelfProductMini config={getCustomProductConfig("pro3", 2, "right")} mountDelay={360} />
            </div>
            {/* Display Pedestal Box */}
            <div 
              style={{
                position: "absolute",
                bottom: "15px", 
                left: "50%",
                transform: "translateX(-50%)", 
                width: "45px", 
                height: "18px", 
                background: "#D6B697", 
                border: "1px solid rgba(212, 175, 55, 0.4)", 
                boxShadow: "0 6px 12px rgba(0,0,0,0.15), inset 0 2px 4px rgba(255,255,255,0.4)",
                borderRadius: "2px",
                zIndex: 10
              }}
            />
          </div>
        </div>

        {/* 3D Display Table — inside parallax so it moves with the background */}
        <Table3D opacity={1} />

        {/* Luxury 3D Product Carousel positioned directly on the display table surface */}
        <div
          className="table-products-overlay flex justify-center items-center z-[65]"
          aria-label="Table products showcase"
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
          dpr={[1, 1.5]}
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
