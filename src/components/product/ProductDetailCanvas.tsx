"use client";

import { Suspense, useLayoutEffect, useMemo, Component, type ReactNode } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Html, OrbitControls, useGLTF, useFBX } from "@react-three/drei";
import * as THREE from "three";
import { extendGltfLoader, getModelUrl } from "@/lib/modelAssets";
import { optimizeModelForGpu } from "@/lib/gpuModelOptimize";
import {
  fitProductToUniformSize,
  prepareProductMaterials,
  applyJewelryRendererSettings,
  type CustomizationSettings,
} from "@/lib/productModelUtils";
import { colors } from "@/lib/colors";
import type { Product } from "@/lib/products";

class CanvasErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("[CanvasErrorBoundary Detail]", error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function DetailLights() {
  return (
    <>
      <ambientLight intensity={0.58} color={colors.white} />
      <hemisphereLight args={[colors.cream, "#7A6654", 0.55]} />
      <directionalLight position={[2.4, 4.8, 3.2]} intensity={1.45} color="#FFF9F2" />
      <directionalLight position={[-2.6, 2.4, -1.4]} intensity={0.52} color={colors.roseGoldLight} />
      <directionalLight position={[0.6, 1.2, -2.2]} intensity={0.22} color="#FFE8C8" />
      <pointLight position={[0.6, 1.5, 2.2]} intensity={0.62} color={colors.goldLight} distance={7} decay={2} />
      <pointLight position={[1.8, 3.6, 2.4]} intensity={0.55} color="#FFFFFF" distance={8} decay={2} />
    </>
  );
}

function DetailProductModelGlb({
  url,
  displaySize,
  customization,
  productId,
}: {
  url: string;
  displaySize: number;
  customization?: CustomizationSettings;
  productId?: string;
}) {
  const { scene: gltfScene } = useGLTF(url, false, false, extendGltfLoader);
  const scene = useMemo(() => {
    const cloned = gltfScene.clone(true);
    
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
  }, [gltfScene]);

  useLayoutEffect(() => {
    fitProductToUniformSize(scene, displaySize);
    optimizeModelForGpu(scene, 768);
    prepareProductMaterials(scene, { customization, productId });
    scene.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh) mesh.renderOrder = 12;
    });
  }, [scene, displaySize, customization, productId]);

  return <primitive object={scene} />;
}

function DetailProductModelFbx({
  url,
  displaySize,
  customization,
  productId,
}: {
  url: string;
  displaySize: number;
  customization?: CustomizationSettings;
  productId?: string;
}) {
  const fbx = useFBX(url);
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

  useLayoutEffect(() => {
    fitProductToUniformSize(scene, displaySize);
    optimizeModelForGpu(scene, 768);
    prepareProductMaterials(scene, { customization, productId });
    scene.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh) mesh.renderOrder = 12;
    });
  }, [scene, displaySize, customization, productId]);

  return <primitive object={scene} />;
}

function DetailProductModel({
  modelFile,
  displaySize,
  customization,
  productId,
}: {
  modelFile: string;
  displaySize: number;
  customization?: CustomizationSettings;
  productId?: string;
}) {
  const url = useMemo(() => getModelUrl(modelFile), [modelFile]);
  const isFbx = modelFile.toLowerCase().endsWith(".fbx");

  if (isFbx) {
    return <DetailProductModelFbx url={url} displaySize={displaySize} customization={customization} productId={productId} />;
  }
  return <DetailProductModelGlb url={url} displaySize={displaySize} customization={customization} productId={productId} />;
}

function ModelFallback() {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-2">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-maj-gold/25 border-t-maj-gold" />
        <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-maj-brown/50">Loading 3D</p>
      </div>
    </Html>
  );
}

function ResponsiveCamera() {
  const { camera, size } = useThree();

  useLayoutEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    const mobile = size.width < 768;
    camera.position.set(0, mobile ? 0.12 : 0.08, mobile ? 2.05 : 2.25);
    camera.fov = mobile ? 32 : 28;
    camera.near = 0.01;
    camera.far = 100;
    camera.lookAt(0, mobile ? 0.06 : 0.04, 0);
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height]);

  return null;
}

function DetailScene({
  product,
  displaySize,
  customization,
}: {
  product: Product;
  displaySize: number;
  customization?: CustomizationSettings;
}) {
  const { size } = useThree();
  const mobile = size.width < 768;
  const targetY = mobile ? 0.06 : 0.04;
  const minZoom = Math.max(0.22, displaySize * 0.38);
  const maxZoom = mobile ? 5.5 : 6.5;

  return (
    <>
      <ResponsiveCamera />
      <DetailLights />
      <Environment preset="lobby" environmentIntensity={1.05} />
      <OrbitControls
        makeDefault
        target={[0, targetY, 0]}
        enableDamping
        dampingFactor={0.06}
        enableZoom
        enablePan
        screenSpacePanning
        minDistance={minZoom}
        maxDistance={maxZoom}
        rotateSpeed={mobile ? 0.65 : 0.55}
        zoomSpeed={mobile ? 1.05 : 1.2}
        panSpeed={mobile ? 0.85 : 0.95}
        minPolarAngle={0.08}
        maxPolarAngle={Math.PI - 0.08}
      />
      <Suspense fallback={<ModelFallback />}>
        <DetailProductModel
          modelFile={product.modelFile}
          displaySize={displaySize}
          customization={customization}
          productId={product.id}
        />
      </Suspense>
      <ContactShadows
        position={[0, 0, 0]}
        opacity={0.14}
        scale={mobile ? 2.2 : 2.6}
        blur={3.5}
        far={2}
        color="#3D2B1F"
        frames={1}
        resolution={256}
      />
    </>
  );
}

interface ProductDetailCanvasProps {
  product: Product;
  displaySize: number;
  customization?: CustomizationSettings;
}

export default function ProductDetailCanvas({
  product,
  displaySize,
  customization,
}: ProductDetailCanvasProps) {
  return (
    <div className="relative h-full w-full" style={{ touchAction: "none" }}>
      <CanvasErrorBoundary
        fallback={
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-maj-cream/10 border border-maj-gold/10 rounded-lg p-8 text-center">
            <span className="font-serif text-sm tracking-widest text-maj-gold">M.A.J Boutique</span>
            <p className="max-w-[240px] font-sans text-[10px] leading-relaxed tracking-wider text-maj-brown/70 uppercase">
              Failed to load 3D viewer. Please refresh or try again.
            </p>
          </div>
        }
      >
        <Canvas
          fallback={<div className="w-full h-full flex items-center justify-center text-maj-gold/50 text-xs bg-black">3D Viewer requires WebGL</div>}
          className="w-full h-full touch-pan-y"
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          camera={{ position: [0, 0.08, 2.25], fov: 28, near: 0.01, far: 100 }}
          onCreated={({ gl }) => {
            applyJewelryRendererSettings(gl, 1.12);
          }}
        >
          <DetailScene product={product} displaySize={displaySize} customization={customization} />
        </Canvas>
      </CanvasErrorBoundary>
    </div>
  );
}
