"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import LineShelfProductMini from "./LineShelfProductMini";
import { PRODUCTS, type ProductId } from "@/lib/products";
import { getModelUrl } from "@/lib/modelAssets";
import type { LineShelfProductConfig } from "@/lib/lineShelfProductLayout";

const CAROUSEL_PRODUCT_IDS: ProductId[] = ["pro2", "pro3", "pro4"];

const CAROUSEL_SCALES: Record<ProductId, number> = {
  pro1: 0.33, // Heritage Ring (made smaller)
  pro2: 0.58, // Luna Bracelet (made larger)
  pro3: 0.50, // Royal Bangles
  pro4: 0.54, // Cascade Necklace
  pro5: 0.38, // Starlight Earrings (Sovereign Pendant)
  pro6: 0.32, // Signature Perfume Showcase
  proo: 0.40, // New exclusive addition
};

function getCarouselProductConfig(productId: ProductId, index: number): LineShelfProductConfig {
  const product = PRODUCTS[productId];
  return {
    slotIndex: index,
    rowIndex: 0,
    side: "left",
    tier: "middle",
    url: getModelUrl(product.modelFile),
    modelFile: product.modelFile,
    productId,
    productSizePx: 130,
    displaySize: CAROUSEL_SCALES[productId] ?? 0.48,
    isTable: true,
  };
}

export default function ProductCarousel3D() {
  const productIds: ProductId[] = ["pro2", "pro3", "pro4"];

  return (
    <div className="flex flex-row items-center justify-center w-full pointer-events-auto overflow-visible" style={{ gap: "10px", marginLeft: "0px", marginRight: "0px" }}>
      {productIds.map((id, idx) => {
        // Curve Logic for 3 products: 0, 1, 2
        const isEdge = idx === 0 || idx === 2;
        const isCenter = idx === 1;
        
        // Push edges UP (negative translateY) but everything is shifted DOWN by 5px as requested
        // Original center was 0px, now 5px. Original edges were -15px, now -10px.
        const translateY = isEdge ? "-10px" : "5px";
        const translateX = "0px"; 
        
        // Maintain the big sizes that the user liked for the 3 main products
        const scale = isEdge ? 1.15 : 1.35;
        
        // zIndex ensures center item is on top
        const zIndex = isCenter ? 30 : 20;

        return (
          <div
            key={id}
            className="straight-product-item relative flex items-center justify-center transition-transform duration-300"
            style={{
              ["--product-size" as any]: "var(--product-carousel-size, 140px)",
              transform: `translate(${translateX}, ${translateY}) scale(${scale})`,
              zIndex
            }}
          >
            {/* Circular Blurred Background */}
            <div className="product-circle-bg absolute rounded-full bg-white/[0.04] backdrop-blur-md border border-white/10 shadow-[inset_0_0_12px_rgba(255,255,255,0.06),0_4px_24px_rgba(0,0,0,0.12)] pointer-events-none -z-10" />
            <LineShelfProductMini config={getCarouselProductConfig(id, idx)} mountDelay={idx * 120} />
          </div>
        );
      })}
    </div>
  );
}
