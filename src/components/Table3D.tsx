"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF, Html, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { getModelUrl, extendGltfLoader } from "@/lib/modelAssets";
import { optimizeModelForGpu } from "@/lib/gpuModelOptimize";
import { getDeviceProfile } from "@/lib/deviceProfile";

function TableModel({ textureMax, isMobile }: { textureMax: number; isMobile: boolean }) {
  // Load the GLB model from public / media CDN
  const { scene } = useGLTF(getModelUrl("table-3d.glb"), false, false, extendGltfLoader);
  const groupRef = useRef<THREE.Group>(null);

  // Clone the scene so we can modify it safely without caching side-effects
  const clonedScene = useMemo(() => {
    if (!scene) return null;
    return scene.clone(true);
  }, [scene]);

  useEffect(() => {
    if (!clonedScene) return;

    // Reset transformations
    clonedScene.scale.setScalar(1);
    clonedScene.position.set(0, 0, 0);
    clonedScene.rotation.set(0, 0, 0);

    // Compute bounding box to center and normalize scale
    const box = new THREE.Box3().setFromObject(clonedScene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    // Center and sit flat on Y=0
    clonedScene.position.x = -center.x;
    clonedScene.position.y = -box.min.y;
    clonedScene.position.z = -center.z;

    // Beautiful, natural scale - increased size as requested
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
      const targetScale = 1.5 / maxDim; // Made a little bigger
      clonedScene.scale.setScalar(targetScale);
    }

    // Dynamic texture downscaling and model optimization for mobile GPU performance
    optimizeModelForGpu(clonedScene, textureMax);

    // Apply perfectly light texture and color while preserving geometry
    clonedScene.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.frustumCulled = true;
        if (!isMobile) {
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        }
        if (mesh.material) {
          const mat = mesh.material as THREE.MeshStandardMaterial;
          // Set color to a very, very light tint while keeping the texture map intact
          mat.color.set("#FFFFFF");
          mat.roughness = 0.1; // Perfect smooth texture
          mat.metalness = 0.2; // Slight premium sheen
          mat.envMapIntensity = 1.5; // Make reflections pop for perfect texture
        }
      }
    });
  }, [clonedScene, textureMax, isMobile]);

  // Rotation and movement removed as requested
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
  const shadowMapSize = profile.mobile ? 256 : 1024;

  return (
    <div
      className="table-3d-wrapper absolute bottom-[130px] left-[45%] -translate-x-1/2 z-[60] w-[85%] max-w-[395px] h-[275px] md:max-w-[695px] md:h-[445px]"
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
        camera={{ position: [0, 2.0, 5.0], fov: 15 }}
        onCreated={({ gl, camera }) => {
          gl.setClearColor(0x000000, 0);
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.2; // Brighter luxury exposure
          camera.lookAt(0, 0.1, 0);
        }}
      >
        <ambientLight intensity={0.7} color="#FFF5EB" />
        <Environment preset="city" /> {/* Fixes shattered metal reflections by providing realistic HDR reflections */}

        {/* Dynamic Key Lighting to bring out metallic edges and curves */}
        <directionalLight
          position={[1.5, 4, 2]}
          intensity={1.0}
          color="#FFF8F2"
          castShadow={!profile.mobile}
          shadow-mapSize={[shadowMapSize, shadowMapSize]}
          shadow-bias={-0.0001}
        />
        <directionalLight position={[-2, 2.5, 1.5]} intensity={0.6} color="#EDD7C2" />
        <pointLight position={[0, 1.2, 1.2]} intensity={0.8} color="#DBBC9E" distance={5} />

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
          <Environment preset="apartment" environmentIntensity={0.35} />
        </Suspense>

        {/* Render smooth contract shadow plane */}
        <ContactShadows
          position={[0, 0, 0]}
          opacity={0.5}
          scale={4.0}
          blur={2.5}
          far={1.5}
          color="#2C1F15"
          frames={1} // Only render contact shadows once to avoid rendering loop lag
        />

      </Canvas>
    </div>
  );
}

// Preload the large table model on the client side only
if (typeof window !== "undefined") {
  useGLTF.preload(getModelUrl("table-3d.glb"), false, false, extendGltfLoader);
}

