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

    // Shifted slightly back to the right (4px -> -0.16) for absolute perfection
    clonedScene.position.x = -0.16;
    clonedScene.position.y = -box.min.y;
    clonedScene.position.z = -0.5;

    // Beautiful, natural scale
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
      // Scale increased to ensure the table is larger and has equal edge cuts
      const targetScale = 1.65 / maxDim; 
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
            mat.envMapIntensity = 2.0; // Enhance glass reflection
          } else if (isMetal || isGold || mat.color.getHex() > 0xaaaaaa) {
            // Apply requested rich gold/bronze color (#CCAB89)
            mat.color.setHex(0xccab89);
            mat.metalness = Math.max(0.7, mat.metalness || 0);
            mat.roughness = Math.min(0.2, mat.roughness || 1);
            mat.envMapIntensity = 2.5; // Stronger lighting reflection for perfect look
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
      className="table-3d-wrapper absolute bottom-[60px] left-[50%] -translate-x-1/2 z-[60] w-[100vw] h-[400px] md:h-[600px]"
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
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15
        }}
        camera={{ position: [0, 1.8, 5.0], fov: 17.5 }}
        onCreated={({ gl, camera }) => {
          gl.setClearColor(0x000000, 0);
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.2; // Brighter luxury exposure
          camera.lookAt(0, 0.24, 0); // Reverted to original lookAt for perfect room alignment
        }}
      >
        {/* Warm interior environment reflections to make the gold/metal look hyper-realistic */}
        <Environment preset="apartment" environmentIntensity={1.4} />
        {/* Luxurious Photorealistic Lighting Setup */}
        {/* Soft overall room fill light matching the cream background */}
        <ambientLight intensity={0.9} color="#F8F1E9" />
        
        {/* Main ceiling chandelier light (top center pointing down) to cast realistic highlights on the metal */}
        <spotLight position={[0, 5, 0]} intensity={2.0} color="#FFF5E6" angle={0.8} penumbra={0.8} />
        
        {/* Soft front fill to bring out the details in the glass and metal */}
        <pointLight position={[0, 1.5, 2.5]} intensity={0.8} color="#F8F1E9" distance={8} />

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

        {/* Render smooth contact shadow plane to ground it on the floor */}
        <ContactShadows
          position={[0, 0, 0]}
          opacity={0.80}
          scale={15.0}
          blur={2.2}
          far={4.0}
          resolution={1024}
          color="#3D2817" // Warm dark brown shadow to blend naturally with the cream floor
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
