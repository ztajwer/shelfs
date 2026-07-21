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
  const productIds: ProductId[] = ["pro5", "pro4", "pro2"];

  return (
    <div
      className="flex flex-row items-center justify-center w-full pointer-events-auto overflow-visible"
      style={{ gap: "24px" }}
    >
      {productIds.map((id, idx) => {
        const isLeft = idx === 0;
        const isCenter = idx === 1;
        const isRight = idx === 2;

        // Curved Arc Layout matching circular 3D glass showcase
        // Center item sits down front-and-center inside the glass bed
        // Left & Right items curve outward and back along the round glass rim
        const translateY = isCenter ? "12px" : "-10px";
        const translateX = isLeft ? "-22px" : isRight ? "22px" : "0px";
        const rotateDeg = isLeft ? "-7deg" : isRight ? "7deg" : "0deg";
        const scale = isCenter ? 1.28 : 1.06;
        const zIndex = isCenter ? 30 : 20;

        return (
          <div
            key={id}
            className="straight-product-item relative flex flex-col items-center justify-center transition-transform duration-300"
            style={{
              ["--product-size" as any]: "var(--product-carousel-size, 130px)",
              transform: `translate(${translateX}, ${translateY}) rotate(${rotateDeg}) scale(${scale})`,
              zIndex,
            }}
          >
            {/* Elegant inner glass display pad & shadow resting inside the showcase bed */}
            <div
              className="product-table-pedestal absolute pointer-events-none -z-10 rounded-full transition-opacity duration-300"
              style={{
                bottom: "4px",
                width: "56px",
                height: "14px",
                background: "radial-gradient(ellipse at center, rgba(212, 175, 55, 0.3) 0%, rgba(160, 120, 70, 0.15) 55%, transparent 85%)",
                boxShadow: "0 6px 14px rgba(0,0,0,0.22), inset 0 1px 3px rgba(255,255,255,0.35)",
                border: "1px solid rgba(212, 175, 55, 0.3)",
              }}
            />
            <LineShelfProductMini config={getCarouselProductConfig(id, idx)} mountDelay={idx * 120} />
          </div>
        );
      })}
    </div>
  );
}
