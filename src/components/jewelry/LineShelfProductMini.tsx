"use client";

import { Suspense, memo, useEffect, useLayoutEffect, useMemo, useRef, useCallback, useState, Component, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, OrbitControls, PerspectiveCamera, useGLTF, useFBX, View } from "@react-three/drei";
import * as THREE from "three";
import { extendGltfLoader, getModelUrl } from "@/lib/modelAssets";
import { fitProductToUniformSize, prepareProductMaterials, applyJewelryRendererSettings } from "@/lib/productModelUtils";
import { useCustomization } from "@/context/CustomizationContext";
import type { CustomizationSettings } from "@/lib/productModelUtils";
import {
  getLineShelfProductModelUrls,
  LINE_SHELF_PRODUCT_PITCH_RAD,
  type LineShelfProductConfig,
} from "@/lib/lineShelfProductLayout";
import { SHOP_GLB_FILES } from "@/lib/glbConfig";
import { SHOP_LINE_SHELF_PRODUCTS_ENABLED } from "@/lib/shopTableEnabled";
import { optimizeModelForGpu } from "@/lib/gpuModelOptimize";
import { getDeviceProfile } from "@/lib/deviceProfile";
import { prefetchProductGlb } from "@/lib/modelPreload";

class CanvasErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("[CanvasErrorBoundary]", error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}



const DRAG_THRESHOLD_PX = 12;

function RenderInvalidator() {
  const invalidate = useThree((state) => state.invalidate);
  useLayoutEffect(() => {
    invalidate();
  }, [invalidate]);
  return null;
}

function ProductPlaceholder() {
  return (
    <mesh>
      <sphereGeometry args={[0.08, 8, 8]} />
      <meshStandardMaterial color="#D4AF37" metalness={0.9} roughness={0.2} />
    </mesh>
  );
}

const ShelfProductGlb = memo(function ShelfProductGlb({
  config,
  textureMax,
  customization,
  isSelected,
}: {
  config: LineShelfProductConfig;
  textureMax: number;
  customization?: CustomizationSettings;
  isSelected: boolean;
}) {
  const { scene: productRoot } = useGLTF(config.url, false, false, extendGltfLoader);
  const scene = useMemo(() => {
    const cloned = productRoot.clone(true);
    
    // Deep clone materials so instances do not share and mutate them in-place
    cloned.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh) {
        if (Array.isArray(mesh.material)) {
          mesh.material = mesh.material.map((m) => m.clone());
        } else if (mesh.material) {
          mesh.material = mesh.material.clone();
        }
      }
    });

    // Strip any embedded lights to prevent light count mismatch crashes in WebGLRenderer
    const lightsToRemove: THREE.Object3D[] = [];
    cloned.traverse((child) => {
      if ((child as any).isLight) {
        lightsToRemove.push(child);
      }
    });
    lightsToRemove.forEach((light) => {
      light.parent?.remove(light);
    });
    return cloned;
  }, [productRoot]);
  const groupRef = useRef<THREE.Group>(null);
  const invalidate = useThree((state) => state.invalidate);

  useLayoutEffect(() => {
    fitProductToUniformSize(scene, config.displaySize);
    optimizeModelForGpu(scene, textureMax);
    if (config.productId !== "proo") {
      prepareProductMaterials(scene, { castShadow: true, receiveShadow: true, customization, productId: config.productId });
    }
    scene.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh) mesh.renderOrder = 12;
    });
    invalidate();
  }, [scene, config.displaySize, textureMax, customization, invalidate, config.productId]);

  useFrame((state, delta) => {
    if (groupRef.current) {
      // Auto-rotation
      groupRef.current.rotation.y += delta * 0.5;

      // Scale model in sync with HTML container scale (bigger on hover)
      let hoverScale = 1.0;
      if (isSelected) {
        hoverScale = 1.15;
      }
      groupRef.current.scale.lerp(new THREE.Vector3(hoverScale, hoverScale, hoverScale), 0.22);
    }
  });

  const pitch = config.isTable ? 0 : LINE_SHELF_PRODUCT_PITCH_RAD;
  const tiltX = config.isTable && (config.slotIndex === 0 || config.slotIndex === 2)
    ? (config.slotIndex === 0 ? -0.08 : 0.08)
    : 0;
  const tiltZ = config.isTable && (config.slotIndex === 0 || config.slotIndex === 2)
    ? (config.slotIndex === 0 ? -0.03 : 0.03)
    : 0;
  return (
    <group ref={groupRef} rotation={[pitch + tiltX, 0, tiltZ]}>
      <primitive object={scene} />
    </group>
  );
});

const ShelfProductFbx = memo(function ShelfProductFbx({
  config,
  textureMax,
  customization,
  isSelected,
}: {
  config: LineShelfProductConfig;
  textureMax: number;
  customization?: CustomizationSettings;
  isSelected: boolean;
}) {
  const fbx = useFBX(config.url);
  const scene = useMemo(() => {
    const cloned = fbx.clone(true);
    
    // Deep clone materials so instances do not share and mutate them in-place
    cloned.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh) {
        if (Array.isArray(mesh.material)) {
          mesh.material = mesh.material.map((m) => m.clone());
        } else if (mesh.material) {
          mesh.material = mesh.material.clone();
        }
      }
    });

    // Strip any embedded lights to prevent light count mismatch crashes in WebGLRenderer
    const lightsToRemove: THREE.Object3D[] = [];
    cloned.traverse((child) => {
      if ((child as any).isLight) {
        lightsToRemove.push(child);
      }
    });
    lightsToRemove.forEach((light) => {
      light.parent?.remove(light);
    });
    return cloned;
  }, [fbx]);
  const groupRef = useRef<THREE.Group>(null);
  const invalidate = useThree((state) => state.invalidate);

  useLayoutEffect(() => {
    fitProductToUniformSize(scene, config.displaySize);
    optimizeModelForGpu(scene, textureMax);
    if (config.productId !== "proo") {
      prepareProductMaterials(scene, { castShadow: true, receiveShadow: true, customization, productId: config.productId });
    }
    scene.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh) mesh.renderOrder = 12;
    });
    invalidate();
  }, [scene, config.displaySize, textureMax, customization, invalidate, config.productId]);

  useFrame((state, delta) => {
    if (groupRef.current) {
      // Auto-rotation
      groupRef.current.rotation.y += delta * 0.5;

      // Scale model in sync with HTML container scale (bigger on hover)
      let hoverScale = 1.0;
      if (isSelected) {
        hoverScale = 1.15;
      }
      groupRef.current.scale.lerp(new THREE.Vector3(hoverScale, hoverScale, hoverScale), 0.22);
    }
  });

  const pitch = config.isTable ? 0 : LINE_SHELF_PRODUCT_PITCH_RAD;
  const tiltX = config.isTable && (config.slotIndex === 0 || config.slotIndex === 2)
    ? (config.slotIndex === 0 ? -0.08 : 0.08)
    : 0;
  const tiltZ = config.isTable && (config.slotIndex === 0 || config.slotIndex === 2)
    ? (config.slotIndex === 0 ? -0.03 : 0.03)
    : 0;
  return (
    <group ref={groupRef} rotation={[pitch + tiltX, 0, tiltZ]}>
      <primitive object={scene} />
    </group>
  );
});

const ShelfProduct = memo(function ShelfProduct({
  config,
  textureMax,
  customization,
  isSelected,
}: {
  config: LineShelfProductConfig;
  textureMax: number;
  customization?: CustomizationSettings;
  isSelected: boolean;
}) {
  const isFbx = config.url.toLowerCase().endsWith(".fbx");

  if (isFbx) {
    return <ShelfProductFbx config={config} textureMax={textureMax} customization={customization} isSelected={isSelected} />;
  }
  return <ShelfProductGlb config={config} textureMax={textureMax} customization={customization} isSelected={isSelected} />;
});

function ShelfControls({ target }: { target: [number, number, number] }) {
  return (
    <OrbitControls
      makeDefault
      target={target}
      enablePan={false}
      enableZoom={false}
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.85}
      minPolarAngle={0.15}
      maxPolarAngle={Math.PI - 0.15}
    />
  );
}

function getCameraConfig(config: LineShelfProductConfig) {
  if (config.isTable) {
    const centerY = config.displaySize * 0.45;
    return {
      position: [0, centerY, 1.34] as [number, number, number],
      fov: 38,
      lookAt: [0, centerY, 0] as [number, number, number],
    };
  }
  const tier = config.tier;
  if (tier === "upper") {
    return {
      position: [0, -0.015, 1.15] as [number, number, number],
      fov: 38,
      lookAt: [0, 0.032, 0] as [number, number, number],
    };
  }
  if (tier === "lower") {
    return {
      position: [0, 0.09, 1.12] as [number, number, number],
      fov: 40,
      lookAt: [0, 0.018, 0] as [number, number, number],
    };
  }
  return {
    position: [0, 0.03, 1.14] as [number, number, number],
    fov: 40,
    lookAt: [0, 0.024, 0] as [number, number, number],
  };
}

interface LineShelfProductMiniProps {
  config: LineShelfProductConfig;
  /** Stagger WebGL canvas creation to avoid browser context limits. */
  mountDelay?: number;
}

export default function LineShelfProductMini({ config, mountDelay = 0 }: LineShelfProductMiniProps) {
  const router = useRouter();
  const profile = useMemo(() => getDeviceProfile(), []);
  const textureMax = profile.lowEnd ? 1024 : 2048;
  const cam = useMemo(() => getCameraConfig(config), [config]);
  const draggedRef = useRef(false);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const navigatingRef = useRef(false);
  const [isSelected, setIsSelected] = useState(false);
  const [canvasReady, setCanvasReady] = useState(mountDelay <= 0);
  const trackingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mountDelay <= 0) {
      setCanvasReady(true);
      return;
    }
    const timer = window.setTimeout(() => setCanvasReady(true), mountDelay);
    return () => window.clearTimeout(timer);
  }, [mountDelay]);

  const { customizations } = useCustomization();
  const customization = customizations[config.productId];

  const handlePointerDown = useCallback((event: React.PointerEvent) => {
    draggedRef.current = false;
    pointerStartRef.current = { x: event.clientX, y: event.clientY };
  }, []);

  const handlePointerMove = useCallback((event: React.PointerEvent) => {
    const start = pointerStartRef.current;
    if (!start) return;
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > DRAG_THRESHOLD_PX) {
      draggedRef.current = true;
    }
  }, []);

  const openProduct = useCallback(() => {
    if (navigatingRef.current) return;
    navigatingRef.current = true;
    router.push(`/product/${config.productId}`);
    window.setTimeout(() => {
      navigatingRef.current = false;
    }, 600);
  }, [config.productId, router]);

  const handlePointerUp = useCallback(
    (event: React.PointerEvent) => {
      const start = pointerStartRef.current;
      pointerStartRef.current = null;
      if (!start || draggedRef.current) return;

      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      if (Math.hypot(dx, dy) > DRAG_THRESHOLD_PX) return;

      if (event.pointerType === "mouse") return;
      if (!isSelected) {
        setIsSelected(true);
      } else {
        openProduct();
      }
    },
    [isSelected, openProduct],
  );

  const handleClick = useCallback(
    (event: React.MouseEvent) => {
      if (draggedRef.current) {
        draggedRef.current = false;
        return;
      }
      event.preventDefault();
      if (!isSelected) {
        setIsSelected(true);
      } else {
        openProduct();
      }
    },
    [isSelected, openProduct],
  );

  const handlePointerEnter = useCallback((event: React.PointerEvent) => {
    if (event.pointerType === "mouse") {
      setIsSelected(true);
    }
    prefetchProductGlb(config.modelFile);
  }, [config.modelFile]);

  const handlePointerLeave = useCallback(() => {
    setIsSelected(false);
  }, []);

  return (
    <div
      ref={trackingRef}
      className={`line-shelf__product-interactive ${isSelected ? "line-shelf__product-interactive--selected" : ""} ${config.tier === "middle" ? "line-shelf__product-interactive--middle-row" : ""} ${config.tier === "lower" ? "line-shelf__product-interactive--lower-row" : ""}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        pointerStartRef.current = null;
        setIsSelected(false);
      }}
      onClick={handleClick}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      role="link"
      aria-label={`View ${config.productId} details`}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openProduct();
        }
      }}
    >
      {/* Spotlight glow lighting effect to highlight the jewelry product */}
      <div
        className="absolute pointer-events-none rounded-full"
        style={{
          inset: "-25%",
          background: "radial-gradient(circle, rgba(255, 240, 205, 0.32) 0%, rgba(255, 240, 205, 0) 70%)",
          zIndex: 0,
          mixBlendMode: "screen",
        }}
      />
      <CanvasErrorBoundary
        fallback={
          <div
            className="flex flex-col items-center justify-center bg-maj-cream/30 border border-maj-gold/20 rounded-lg cursor-pointer"
            style={{ width: "100%", height: "100%", backdropFilter: "blur(4px)" }}
            onClick={openProduct}
          >
            <span className="font-serif text-[10px] uppercase tracking-[0.2em] text-maj-gold">View Jewelry</span>
          </div>
        }
      >
        {canvasReady ? (
        <View track={trackingRef as any} className="line-shelf__product-canvas">
          <RenderInvalidator />
          <PerspectiveCamera
            makeDefault
            position={cam.position}
            fov={cam.fov}
            near={0.02}
            far={10}
            onUpdate={(c) => c.lookAt(...cam.lookAt)}
          />
          <Environment preset="lobby" environmentIntensity={1.05} />
          <ContactShadows
            position={[0, 0, 0]}
            opacity={0.42}
            scale={config.displaySize * 2.8}
            blur={2.4}
            far={config.displaySize * 1.2}
            color="#8A7358"
            frames={1}
            resolution={256}
          />
          <Suspense fallback={<ProductPlaceholder />}>
            <ShelfProduct config={config} textureMax={textureMax} customization={customization} isSelected={isSelected} />
          </Suspense>
        </View>
        ) : (
          <div
            className="line-shelf__product-canvas animate-pulse rounded bg-maj-gold/10"
            style={{ width: "100%", height: "100%" }}
            aria-hidden
          />
        )}
      </CanvasErrorBoundary>
    </div>
  );
}
