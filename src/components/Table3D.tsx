"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useGLTF, Html, Environment, ContactShadows, View, PerspectiveCamera } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRouter } from "next/navigation";
import * as THREE from "three";
import { getModelUrl, extendGltfLoader } from "@/lib/modelAssets";
import { optimizeModelForGpu } from "@/lib/gpuModelOptimize";
import { getDeviceProfile } from "@/lib/deviceProfile";
import { type ProductId } from "@/lib/products";
import { prepareProductMaterials } from "@/lib/productModelUtils";
import { useCustomization } from "@/context/CustomizationContext";

interface ShowcaseProductConfig {
  productId: ProductId;
  modelFile: string;
  side: "left" | "right";
  slotIndex: number;
  targetMaxDim: number;
}

// Exactly 6 products: 3 on left, 3 on right, center completely empty
const SHOWCASE_PRODUCTS: ShowcaseProductConfig[] = [
  // Left side (3 products)
  { productId: "pro1", modelFile: "pro1.glb", side: "left", slotIndex: 0, targetMaxDim: 0.12 },
  { productId: "pro2", modelFile: "pro2.glb", side: "left", slotIndex: 1, targetMaxDim: 0.17 },
  { productId: "pro5", modelFile: "pro5.glb", side: "left", slotIndex: 2, targetMaxDim: 0.13 },
  // Right side (3 products)
  { productId: "pro3", modelFile: "pro3.glb", side: "right", slotIndex: 0, targetMaxDim: 0.16 },
  { productId: "pro4", modelFile: "pro4.glb", side: "right", slotIndex: 1, targetMaxDim: 0.18 },
  { productId: "pro6", modelFile: "pro6.glb", side: "right", slotIndex: 2, targetMaxDim: 0.15 },
];

/** Dynamic Structure Detection using Box3 and Vertex Traversal */
function detectShowcaseStructure(scene: THREE.Group) {
  let minY = Infinity, maxY = -Infinity, maxR = 0;
  const yCounts = new Map<number, number>();

  scene.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      const pos = mesh.geometry.attributes.position;
      if (pos) {
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i);
          const y = pos.getY(i);
          const z = pos.getZ(i);
          const r = Math.sqrt(x * x + z * z);

          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          if (r > maxR) maxR = r;

          const key = Math.round(y * 100) / 100;
          yCounts.set(key, (yCounts.get(key) || 0) + 1);
        }
      }
    }
  });

  const upperLevels = Array.from(yCounts.entries())
    .filter(([y, count]) => y > 0 && count > 100)
    .sort((a, b) => a[0] - b[0]);

  // Detected internal display platform base & top glass roof
  const displayBaseY = upperLevels.length > 0 ? upperLevels[0][0] : 0.052;
  const topGlassY = upperLevels.length > 0 ? upperLevels[upperLevels.length - 1][0] : 0.365;
  const internalHeight = topGlassY - displayBaseY;
  const glassRadius = maxR > 0 ? maxR * 0.95 : 0.92;
  const safeRadius = glassRadius * 0.65;

  return {
    displayBaseY,
    topGlassY,
    internalHeight,
    glassRadius,
    safeRadius,
  };
}

/** Collision detection & position auto-correction helper */
function calculateVerifiedProductPositions(
  products: ShowcaseProductConfig[],
  displayBaseY: number,
  safeRadius: number,
  glassRadius: number
) {
  const leftAngles = [140, 180, 220].map((a) => (a * Math.PI) / 180);
  const rightAngles = [40, 0, -40].map((a) => (a * Math.PI) / 180);

  const positions = products.map((p) => {
    const angleList = p.side === "left" ? leftAngles : rightAngles;
    const angle = angleList[p.slotIndex];
    return {
      productId: p.productId,
      x: safeRadius * Math.cos(angle),
      z: safeRadius * Math.sin(angle),
      y: displayBaseY,
      radius: p.targetMaxDim * 0.5,
    };
  });

  // Iterative collision resolution loop
  let collisionsResolved = false;
  let iterations = 0;

  while (!collisionsResolved && iterations < 50) {
    iterations++;
    collisionsResolved = true;

    for (let i = 0; i < positions.length; i++) {
      const p1 = positions[i];

      // 1. Ensure clearance from glass wall
      const distFromCenter = Math.sqrt(p1.x * p1.x + p1.z * p1.z);
      const maxAllowedRadius = glassRadius - p1.radius - 0.15;
      if (distFromCenter > maxAllowedRadius) {
        collisionsResolved = false;
        const scaleFactor = maxAllowedRadius / (distFromCenter || 1);
        p1.x *= scaleFactor;
        p1.z *= scaleFactor;
      }

      // 2. Guarantee center region is completely empty (|x| >= 0.30)
      if (Math.abs(p1.x) < 0.30) {
        collisionsResolved = false;
        p1.x = p1.x >= 0 ? 0.30 : -0.30;
      }

      // 3. Resolve pairwise product overlaps
      for (let j = i + 1; j < positions.length; j++) {
        const p2 = positions[j];
        const dx = p1.x - p2.x;
        const dz = p1.z - p2.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        const minRequiredDist = p1.radius + p2.radius + 0.04;

        if (dist < minRequiredDist) {
          collisionsResolved = false;
          const overlap = minRequiredDist - dist;
          const nx = dx / (dist || 1);
          const nz = dz / (dist || 1);
          p1.x += (nx * overlap) / 2;
          p1.z += (nz * overlap) / 2;
          p2.x -= (nx * overlap) / 2;
          p2.z -= (nz * overlap) / 2;
        }
      }
    }
  }

  const map = new Map<ProductId, { x: number; y: number; z: number }>();
  positions.forEach((p) => {
    map.set(p.productId, {
      x: Number(p.x.toFixed(4)),
      y: Number(p.y.toFixed(4)),
      z: Number(p.z.toFixed(4)),
    });
  });

  return map;
}

function SingleShowcaseProduct({
  config,
  displayBaseY,
  topGlassY,
  positionX,
  positionZ,
}: {
  config: ShowcaseProductConfig;
  displayBaseY: number;
  topGlassY: number;
  positionX: number;
  positionZ: number;
}) {
  const { scene: rawScene } = useGLTF(getModelUrl(config.modelFile), true, false, extendGltfLoader);
  const router = useRouter();
  const { customizations } = useCustomization();
  const customization = customizations[config.productId];
  const [hovered, setHovered] = useState(false);
  const itemGroupRef = useRef<THREE.Group>(null);

  const preparedScene = useMemo(() => {
    if (!rawScene) return null;
    const cloned = rawScene.clone(true);

    // Deep clone materials and apply boutique shaders
    cloned.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material = mesh.material.map((m) => m.clone());
          } else {
            mesh.material = mesh.material.clone();
          }
        }
      }
    });

    prepareProductMaterials(cloned, { castShadow: true, receiveShadow: true, customization, productId: config.productId });

    // Compute bounding box using Box3
    const box = new THREE.Box3().setFromObject(cloned);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    // Normalize scale so product fits realistically inside showcase
    let scale = config.targetMaxDim / (maxDim || 1);
    cloned.scale.setScalar(scale);

    // Re-check Box3 bounding box to enforce 5-15 mm air gap clearance below top glass
    const scaledBox = new THREE.Box3().setFromObject(cloned);
    const scaledHeight = scaledBox.max.y - scaledBox.min.y;
    const maxAllowedHeight = topGlassY - displayBaseY - 0.015; // 15mm clearance below top glass

    if (scaledHeight > maxAllowedHeight) {
      scale *= maxAllowedHeight / scaledHeight;
      cloned.scale.setScalar(scale);
    }

    // Ground product bottom naturally onto internal display surface
    const finalBox = new THREE.Box3().setFromObject(cloned);
    cloned.position.y = displayBaseY - finalBox.min.y;
    cloned.position.x = positionX;
    cloned.position.z = positionZ;

    // Face outwards towards front of circular showcase
    const angleFromCenter = Math.atan2(positionX, positionZ);
    cloned.rotation.y = angleFromCenter + (config.side === "left" ? 0.2 : -0.2);

    return cloned;
  }, [rawScene, config, customization, displayBaseY, topGlassY, positionX, positionZ]);

  // Interactive smooth hover rotation
  useFrame((_, delta) => {
    if (itemGroupRef.current && hovered) {
      itemGroupRef.current.rotation.y += delta * 1.2;
    }
  });

  if (!preparedScene) return null;

  return (
    <group
      ref={itemGroupRef}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        router.push(`/product/${config.productId}`);
      }}
    >
      <primitive object={preparedScene} />
      {/* Sleek luxury pedestal base ring resting under product inside showcase */}
      <mesh position={[positionX, displayBaseY + 0.002, positionZ]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.04, 0.07, 32]} />
        <meshStandardMaterial color="#CCAB89" metalness={0.9} roughness={0.1} transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

function ShowcaseProductsGroup({
  displayBaseY,
  topGlassY,
  safeRadius,
  glassRadius,
}: {
  displayBaseY: number;
  topGlassY: number;
  safeRadius: number;
  glassRadius: number;
}) {
  const verifiedPositions = useMemo(
    () => calculateVerifiedProductPositions(SHOWCASE_PRODUCTS, displayBaseY, safeRadius, glassRadius),
    [displayBaseY, safeRadius, glassRadius]
  );

  return (
    <group>
      {SHOWCASE_PRODUCTS.map((config) => {
        const pos = verifiedPositions.get(config.productId) || { x: 0, y: displayBaseY, z: 0 };

        return (
          <SingleShowcaseProduct
            key={config.productId}
            config={config}
            displayBaseY={displayBaseY}
            topGlassY={topGlassY}
            positionX={pos.x}
            positionZ={pos.z}
          />
        );
      })}
    </group>
  );
}

function TableModel({ textureMax, isMobile }: { textureMax: number; isMobile: boolean }) {
  // Load the GLB model from public / media CDN
  const { scene } = useGLTF(getModelUrl("Kiosk_Centre.glb"), true, false, extendGltfLoader);
  const groupRef = useRef<THREE.Group>(null);
  const [tableTransform, setTableTransform] = useState<{
    position: [number, number, number];
    rotation: [number, number, number];
    scale: number;
    displayBaseY: number;
    topGlassY: number;
    safeRadius: number;
    glassRadius: number;
  } | null>(null);

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

    // Scale table naturally
    let targetScale = 1;
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
      targetScale = 1.65 / maxDim;
      clonedScene.scale.setScalar(targetScale);
    }

    const posX = -center.x * targetScale;
    const posY = -box.min.y * targetScale;
    const posZ = -0.5;

    clonedScene.position.set(posX, posY, posZ);

    // Dynamically detect showcase structure parameters
    const structure = detectShowcaseStructure(clonedScene);

    setTableTransform({
      position: [posX, posY, posZ],
      rotation: [0, Math.PI, 0],
      scale: targetScale,
      displayBaseY: structure.displayBaseY,
      topGlassY: structure.topGlassY,
      safeRadius: structure.safeRadius,
      glassRadius: structure.glassRadius,
    });

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
            mat.opacity = 0.25; // Transparent glass so enclosed 3D products show through clearly
            mat.roughness = 0.05;
            mat.metalness = 0.9;
            mat.color.setHex(0xffffff); // Clear glass tint
            mat.envMapIntensity = 2.0; // Enhance glass reflection
          } else if (isMetal || isGold || mat.color.getHex() > 0xaaaaaa) {
            mat.color.setHex(0xccab89);
            mat.metalness = Math.max(0.7, mat.metalness || 0);
            mat.roughness = Math.min(0.2, mat.roughness || 1);
            mat.envMapIntensity = 2.5;
          }
        }
      }
    });
  }, [clonedScene, textureMax, isMobile]);

  if (!clonedScene) return null;

  return (
    <group ref={groupRef}>
      <primitive object={clonedScene} />
      {tableTransform && (
        <group
          position={tableTransform.position}
          rotation={tableTransform.rotation}
          scale={tableTransform.scale}
        >
          <ShowcaseProductsGroup
            displayBaseY={tableTransform.displayBaseY}
            topGlassY={tableTransform.topGlassY}
            safeRadius={tableTransform.safeRadius}
            glassRadius={tableTransform.glassRadius}
          />
        </group>
      )}
    </group>
  );
}

interface Table3DProps {
  opacity?: number;
}

export default function Table3D({ opacity = 1 }: Table3DProps) {
  const profile = useMemo(() => getDeviceProfile(), []);

  // Safe preloading inside useEffect after module hydration
  useEffect(() => {
    if (typeof window !== "undefined") {
      useGLTF.preload(getModelUrl("Kiosk_Centre.glb"), true, false, extendGltfLoader);
      SHOWCASE_PRODUCTS.forEach((p) => {
        useGLTF.preload(getModelUrl(p.modelFile), true, false, extendGltfLoader);
      });
    }
  }, []);

  // Keep textures fully HD (2048) on mobile
  const textureMax = profile.lowEnd ? 1024 : 2048;

  return (
    <div
      className="table-3d-wrapper absolute bottom-[57px] left-[50%] -translate-x-1/2 z-[60] w-[100vw] h-[400px] md:h-[600px]"
      style={{
        opacity,
        pointerEvents: "none",
        transition: "opacity 0.6s ease-out, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      aria-label="3D Display Table Showcase"
    >
      <View className="w-full h-full pointer-events-none">
        <PerspectiveCamera
          makeDefault
          position={[0, 1.8, 5.0]}
          fov={17.5}
          onUpdate={(c) => c.lookAt(0, 0.24, 0)}
        />
        {/* Warm interior environment reflections */}
        <Environment preset="apartment" environmentIntensity={1.4} />
        {/* Photorealistic Lighting Setup */}
        <ambientLight intensity={0.9} color="#F8F1E9" />
        <spotLight position={[0, 5, 0]} intensity={2.0} color="#FFF5E6" angle={0.8} penumbra={0.8} />
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

        {/* Contact shadow plane to ground table on the floor */}
        <ContactShadows
          position={[0, 0, 0]}
          opacity={0.80}
          scale={15.0}
          blur={2.2}
          far={4.0}
          resolution={1024}
          color="#3D2817"
          frames={1}
        />
      </View>
    </div>
  );
}
