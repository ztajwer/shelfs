"use client";

import { Suspense, memo, useLayoutEffect, useMemo, useRef, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, Environment, OrbitControls, PerspectiveCamera, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { extendGltfLoader } from "@/lib/modelAssets";
import { fitProductToUniformSize, prepareProductMaterials, applyJewelryRendererSettings } from "@/lib/productModelUtils";
import {
  getLineShelfProductModelUrls,
  LINE_SHELF_PRODUCT_PITCH_RAD,
  LINE_SHELF_VIEW_CAMERA,
  type LineShelfProductConfig,
} from "@/lib/lineShelfProductLayout";
import { SHOP_LINE_SHELF_PRODUCTS_ENABLED } from "@/lib/shopTableEnabled";
import { optimizeModelForGpu } from "@/lib/gpuModelOptimize";
import { getDeviceProfile } from "@/lib/deviceProfile";
import { prefetchProductGlb } from "@/lib/modelPreload";

if (SHOP_LINE_SHELF_PRODUCTS_ENABLED) {
  for (const url of getLineShelfProductModelUrls()) {
    useGLTF.preload(url, false, false, extendGltfLoader);
  }
}

const DRAG_THRESHOLD_PX = 12;

const ShelfProduct = memo(function ShelfProduct({
  config,
  textureMax,
}: {
  config: LineShelfProductConfig;
  textureMax: number;
}) {
  const { scene: productRoot } = useGLTF(config.url, false, false, extendGltfLoader);
  const scene = useMemo(() => productRoot.clone(true), [productRoot]);

  useLayoutEffect(() => {
    fitProductToUniformSize(scene, config.displaySize);
    optimizeModelForGpu(scene, textureMax);
    prepareProductMaterials(scene, { castShadow: true, receiveShadow: true });
    scene.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh) mesh.renderOrder = 12;
    });
  }, [scene, config.displaySize, textureMax]);

  return (
    <group rotation={[LINE_SHELF_PRODUCT_PITCH_RAD, 0, 0]}>
      <primitive object={scene} />
    </group>
  );
});

function ShelfControls() {
  return (
    <OrbitControls
      makeDefault
      target={[0, 0.024, 0]}
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

interface LineShelfProductMiniProps {
  config: LineShelfProductConfig;
}

export default function LineShelfProductMini({ config }: LineShelfProductMiniProps) {
  const router = useRouter();
  const profile = useMemo(() => getDeviceProfile(), []);
  const textureMax = profile.lowEnd ? 512 : profile.mobile ? 768 : 1024;
  const cam = LINE_SHELF_VIEW_CAMERA;
  const draggedRef = useRef(false);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const navigatingRef = useRef(false);
  const [isSelected, setIsSelected] = useState(false);

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
      className={`line-shelf__product-interactive ${isSelected ? "line-shelf__product-interactive--selected" : ""}`}
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
      <Canvas
        className="line-shelf__product-canvas"
        frameloop="demand"
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
          applyJewelryRendererSettings(gl, 1.1);
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
        }}
      >
        <PerspectiveCamera
          makeDefault
          position={cam.position}
          fov={cam.fov}
          near={0.02}
          far={10}
          onUpdate={(c) => c.lookAt(...cam.lookAt)}
        />
        <ShelfControls />
        <ambientLight intensity={0.52} color="#FFFCF8" />
        <hemisphereLight args={["#FFF9F2", "#8A7358", 0.38]} />
        <directionalLight
          position={[0.9, 3.4, 2.6]}
          intensity={0.62}
          color="#FFF8F0"
          castShadow
          shadow-mapSize-width={512}
          shadow-mapSize-height={512}
        />
        <directionalLight position={[-1.4, 2.2, 1.8]} intensity={0.22} color="#E8C872" />
        <directionalLight position={[0.4, 1.6, -1.2]} intensity={0.1} color="#FFE8C8" />
        <pointLight position={[0, 0.42, 0.75]} intensity={0.32} color="#FFF0D8" distance={3.2} decay={2} />
        <spotLight
          position={[0.3, 1.8, 1.4]}
          angle={0.42}
          penumbra={0.9}
          intensity={0.28}
          color="#FFFFFF"
          distance={4}
        />
        <Environment preset="studio" environmentIntensity={0.52} />
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
        <Suspense fallback={null}>
          <ShelfProduct config={config} textureMax={textureMax} />
        </Suspense>
      </Canvas>
    </div>
  );
}
