"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF, Html, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { getModelUrl, extendGltfLoader } from "@/lib/modelAssets";
import { optimizeModelForGpu } from "@/lib/gpuModelOptimize";
import { getDeviceProfile } from "@/lib/deviceProfile";

function TableModel({ textureMax, isMobile }: { textureMax: number; isMobile: boolean }) {
  // Load the GLB model from public / media CDN
  const { scene } = useGLTF(getModelUrl("Kiosk_Centre.glb"), false, false, extendGltfLoader);
  const groupRef = useRef<THREE.Group>(null);

  // Clone the scene so we can modify it safely without caching side-effects
  const clonedScene = useMemo(() => {
    if (!scene) return null;
    const cloned = scene.clone(true);
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
  }, [scene]);

  useEffect(() => {
    if (!clonedScene) return;

    // Reset transformations
    clonedScene.scale.setScalar(1);
    clonedScene.position.set(0, 0, 0);
    clonedScene.rotation.set(0, Math.PI, 0); // Rotate 180 degrees so back side is in front

    // Compute bounding box based only on meshes to ignore helper locators, cameras, grids, etc.
    const box = new THREE.Box3();
    let hasMesh = false;
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        box.expandByObject(child);
        hasMesh = true;
      }
    });
    if (!hasMesh) {
      box.setFromObject(clonedScene);
    }
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    // Shifted right (+0.6) to align the table's gap/cut with the center shelf
    clonedScene.position.x = 0.6;
    clonedScene.position.y = -box.min.y;
    clonedScene.position.z = -0.5;

    // Beautiful, natural scale
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
      // Made slightly smaller as requested
      const targetScale = 1.75 / maxDim; 
      clonedScene.scale.setScalar(targetScale);
    }

    // Dynamic texture downscaling and model optimization for mobile GPU performance
    optimizeModelForGpu(clonedScene, textureMax);

    // Apply materials while preserving the model's original colors and textures
    clonedScene.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.frustumCulled = true;
        if (!isMobile) {
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        }
        if (mesh.material) {
          const mat = (mesh.material as THREE.MeshStandardMaterial).clone();
          mesh.material = mat;
          
          mat.envMapIntensity = 1.35; 
          
          const isGlass = mat.transparent || mat.opacity < 1 || (mat.name && mat.name.toLowerCase().includes('glass'));
          const isMetal = mat.metalness && mat.metalness > 0.5;
          const isGold = mat.name && mat.name.toLowerCase().includes('gold');

          if (isGlass) {
            mat.transparent = true;
            mat.opacity = 0.25; // Make glass more transparent so background image colors show through properly
            mat.roughness = 0.05;
            mat.metalness = 0.9;
            mat.color.setHex(0xffffff); // Pure clear glass tint
          } else if (isMetal || isGold || mat.color.getHex() > 0xaaaaaa) {
            // Apply #DDBEA0 shades to the table frame/metal
            mat.color.setHex(0xddbea0);
            mat.metalness = Math.max(0.6, mat.metalness || 0);
            mat.roughness = Math.min(0.3, mat.roughness || 1);
          }
        }
      }
    });
  }, [clonedScene, textureMax, isMobile]);

  if (!clonedScene) return null;

  return (
    <group ref={groupRef}>
      <primitive object={clonedScene} />
    </group>
  );
}

interface Table3DProps {
  opacity?: number;
}

export default function Table3D({ opacity = 1 }: Table3DProps) {
  const profile = useMemo(() => getDeviceProfile(), []);
  
  // Keep textures fully HD (2048) on mobile to make it look optimized and beautiful
  const textureMax = profile.lowEnd ? 1024 : 2048;

  return (
    <div
      className="table-3d-wrapper absolute bottom-[80px] left-[50%] -translate-x-1/2 z-[60] w-[100vw] h-[400px] md:h-[600px]"
      style={{
        opacity,
        pointerEvents: "none", // Disable all interactions to keep it static and perfect
        transition: "opacity 0.6s ease-out, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      aria-label="3D Display Table Showcase"
    >
      <Canvas
        shadows={!profile.mobile} // Disable shadow maps on mobile to boost performance and prevent crashes
        dpr={[1, 2]} // Enforce HD rendering on high density screens
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          precision: "highp", // Max precision for perfect HD textures
        }}
        camera={{ position: [0, 1.8, 5.0], fov: 17.5 }}
        onCreated={({ gl, camera }) => {
          gl.setClearColor(0x000000, 0);
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.2; // Brighter luxury exposure
          camera.lookAt(0, 0.24, 0); // Reverted to original lookAt for perfect room alignment
        }}
      >
        <Environment preset="lobby" environmentIntensity={1.35} />
        <ambientLight intensity={0.7} color="#FFFBF8" />
        <pointLight position={[0, 1.2, 1.2]} intensity={0.8} color="#FAF5F2" distance={5} />

        <Suspense
          fallback={
            <Html center>
              <div className="text-[#D4AF37] font-serif text-[10px] uppercase tracking-[0.2em] whitespace-nowrap animate-pulse select-none">
                Loading 3D Table...
              </div>
            </Html>
          }
        >
          <TableModel textureMax={textureMax} isMobile={profile.mobile} />
        </Suspense>

        {/* Render smooth contact shadow plane */}
        <ContactShadows
          position={[0, 0, 0]}
          opacity={0.45}
          scale={15.0}
          blur={3.0}
          far={2.5}
          color="#2C1F15"
          frames={1} // Only render contact shadows once to avoid rendering loop lag
        />
      </Canvas>
    </div>
  );
}

// Preload the large table model on the client side only
if (typeof window !== "undefined") {
  useGLTF.preload(getModelUrl("Kiosk_Centre.glb"), false, false, extendGltfLoader);
}
