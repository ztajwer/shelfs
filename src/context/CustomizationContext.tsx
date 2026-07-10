"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { PRODUCTS, type ProductId } from "@/lib/products";
import type { CustomizationSettings } from "@/lib/productModelUtils";

interface CustomizationContextValue {
  customizations: Record<ProductId, CustomizationSettings>;
  setCustomization: (productId: ProductId, settings: Partial<CustomizationSettings>) => void;
}

const CustomizationContext = createContext<CustomizationContextValue | null>(null);

function getDefaultBody(materials: string): "gold" | "silver" | "bronze" {
  const mats = materials.toLowerCase();
  if (mats.includes("silver") || mats.includes("platinum") || mats.includes("steel")) return "silver";
  if (mats.includes("bronze") || mats.includes("rose gold")) return "bronze";
  return "gold";
}

function getDefaultStone(materials: string): "diamond" | "ruby" | "emerald" | "sapphire" | "amethyst" {
  const mats = materials.toLowerCase();
  if (mats.includes("ruby")) return "ruby";
  if (mats.includes("emerald")) return "emerald";
  if (mats.includes("sapphire")) return "sapphire";
  if (mats.includes("amethyst")) return "amethyst";
  return "diamond";
}

export function CustomizationProvider({ children }: { children: ReactNode }) {
  const [customizations, setCustomizations] = useState<Record<ProductId, CustomizationSettings>>(() => {
    const defaults = {} as Record<ProductId, CustomizationSettings>;
    for (const key of Object.keys(PRODUCTS) as ProductId[]) {
      const prod = PRODUCTS[key];
      defaults[key] = {
        body: getDefaultBody(prod.materials),
        stone: getDefaultStone(prod.materials),
      };
    }
    return defaults;
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem("maj_boutique_customizations");
      if (saved) {
        const parsed = JSON.parse(saved);
        setCustomizations((prev) => ({ ...prev, ...parsed }));
      }
    } catch (e) {
      console.error("Failed to load customizations", e);
    }
  }, []);

  const setCustomization = (productId: ProductId, settings: Partial<CustomizationSettings>) => {
    setCustomizations((prev) => {
      const updated = {
        ...prev,
        [productId]: {
          ...prev[productId],
          ...settings,
        },
      };
      try {
        localStorage.setItem("maj_boutique_customizations", JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to save customizations", e);
      }
      return updated;
    });
  };

  return (
    <CustomizationContext.Provider value={{ customizations, setCustomization }}>
      {children}
    </CustomizationContext.Provider>
  );
}

export function useCustomization() {
  const ctx = useContext(CustomizationContext);
  if (!ctx) {
    return {
      customizations: {} as Record<ProductId, CustomizationSettings>,
      setCustomization: () => {},
    };
  }
  return ctx;
}
