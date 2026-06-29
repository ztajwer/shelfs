"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, PerspectiveCamera, SoftShadows, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import {
  BOUTIQUE_SHELF_CAMERA,
  getShelfModelLayout,
  refineShelfToVerticalBand,
  type ShelfModelLayoutItem,
} from "@/lib/shelfProductLayout";
import { applyLuxuryShelfMaterials, getShelfInteriorLightLayout, SHELF_LIGHT_COLORS } from "@/lib/shelfMaterials";
import { SHELF_COLOR, SHELF_IVORY } from "@/lib/shelfProductLayout";
import { SHOP_SHELVES_ENABLED } from "@/lib/shopTableEnabled";
import { extendGltfLoader, getModelUrl } from "@/lib/modelAssets";

const MOBILE_MAX_WIDTH = 767;
const SHELF_MODEL_URL = getModelUrl("shelf.glb");

if (SHOP_SHELVES_ENABLED) {
  useGLTF.preload(SHELF_MODEL_URL, false, false, extendGltfLoader);
}

function fitShelfToSize(root: THREE.Object3D, targetSpan: number) {
  root.scale.set(1, 1, 1);
  root.position.set(0, 0, 0);
  root.rotation.set(0, 0, 0);
  root.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const visualSpan = Math.max(size.x, size.y, size.z);
  if (visualSpan > 0) root.scale.setScalar(targetSpan / visualSpan);

  root.updateMatrixWorld(true);
  const fitted = new THREE.Box3().setFromObject(root);
  const center = fitted.getCenter(new THREE.Vector3());
  root.position.set(-center.x, -fitted.min.y, -center.z);
}

function ShelfContactShadow({
  layout,
  floorY,
  floorX,
}: {
  layout: ShelfModelLayoutItem;
  floorY: number;
  floorX: number;
}) {
  return (
    <ContactShadows
      position={[floorX, floorY + 0.001, layout.position[2]]}
      opacity={0.34}
      scale={layout.displaySize * 1.35}
      blur={2.2}
      far={layout.displaySize * 0.65}
      color={SHELF_LIGHT_COLORS.shadow}
      frames={1}
      resolution={1024}
    />
  );
}

function ShelfLedStrip({
  position,
  width,
  height,
}: {
  position: [number, number, number];
  width: number;
  height: number;
}) {
  return (
    <mesh position={position}>
      <boxGeometry args={[width, height, height * 0.35]} />
      <meshBasicMaterial color={SHELF_LIGHT_COLORS.glow} toneMapped={false} />
    </mesh>
  );
}

function ShelfLedAccent({
  position,
  scale = 0.012,
}: {
  position: [number, number, number];
  scale?: number;
}) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[scale, 12, 12]} />
      <meshBasicMaterial color={SHELF_LIGHT_COLORS.led} toneMapped={false} />
    </mesh>
  );
}

function ShelfInteriorLights({ root }: { root: THREE.Object3D }) {
  const layout = useMemo(() => getShelfInteriorLightLayout(root), [root]);

  return (
    <group>
      {layout.points.map((level, index) => (
        <group key={index}>
          <ShelfLedStrip
            position={[level.glow.x, level.glow.y, level.glow.z + 0.006]}
            width={layout.stripWidth}
            height={layout.stripHeight}
          />
          <pointLight
            position={level.point}
            intensity={0.95}
            color={SHELF_LIGHT_COLORS.key}
            distance={layout.distance}
            decay={2}
          />
          <pointLight
            position={level.glow}
            intensity={0.55}
            color={SHELF_LIGHT_COLORS.warm}
            distance={layout.distance * 0.75}
            decay={2.4}
          />
          <spotLight
            position={[level.glow.x, level.glow.y + 0.025, level.glow.z]}
            angle={0.48}
            penumbra={0.92}
            intensity={0.58}
            color={SHELF_LIGHT_COLORS.accent}
            distance={layout.distance * 1.15}
            decay={2}
            castShadow={false}
          >
            <object3D position={level.spotTarget} attach="target" />
          </spotLight>
          <ShelfLedAccent position={[level.glow.x, level.glow.y, level.glow.z + 0.008]} />
          <ShelfLedAccent
            position={[level.glow.x - layout.stripWidth * 0.35, level.glow.y, level.glow.z + 0.006]}
            scale={0.008}
          />
          <ShelfLedAccent
            position={[level.glow.x + layout.stripWidth * 0.35, level.glow.y, level.glow.z + 0.006]}
            scale={0.008}
          />
        </group>
      ))}
      <pointLight
        position={layout.topGlow}
        intensity={0.38}
        color={SHELF_LIGHT_COLORS.accent}
        distance={layout.distance * 0.9}
        decay={2}
      />
      <ShelfLedAccent position={[layout.topGlow.x, layout.topGlow.y, layout.topGlow.z + 0.01]} scale={0.014} />
    </group>
  );
}

function PhysicalShelfModel({ layout }: { layout: ShelfModelLayoutItem }) {
  const { scene } = useGLTF(SHELF_MODEL_URL, false, false, extendGltfLoader);
  const { camera, invalidate } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const alignedRef = useRef(false);
  const [floorPos, setFloorPos] = useState<[number, number] | null>(null);

  const cloned = useMemo(() => {
    const obj = scene.clone(true);
    fitShelfToSize(obj, layout.displaySize);
    applyLuxuryShelfMaterials(obj);
    return obj;
  }, [scene, layout.displaySize]);

  useEffect(() => {
    alignedRef.current = false;
    setFloorPos(null);
  }, [layout.displaySize, layout.floorNdc.x, layout.floorNdc.y, layout.topNdc, layout.centerNdc.y, layout.position, layout.rotation]);

  useFrame(() => {
    if (!(camera instanceof THREE.PerspectiveCamera) || !groupRef.current || alignedRef.current) return;

    const pos: [number, number, number] = [...layout.position];
    const refined = refineShelfToVerticalBand(
      groupRef.current,
      camera,
      layout.floorNdc.x,
      layout.floorNdc.y,
      layout.topNdc,
      layout.centerNdc.y,
      pos,
      layout.rotation,
    );

    groupRef.current.position.set(refined.x, refined.y, pos[2]);
    groupRef.current.rotation.set(...layout.rotation);
    groupRef.current.updateMatrixWorld(true);
    setFloorPos([refined.x, refined.y]);
    alignedRef.current = true;
    invalidate();
  });

  return (
    <group ref={groupRef}>
      <primitive object={cloned} />
      <ShelfInteriorLights root={cloned} />
      {floorPos && (
        <ShelfContactShadow layout={layout} floorX={floorPos[0]} floorY={floorPos[1]} />
      )}
    </group>
  );
}

function ShelfScene({ isMobile }: { isMobile: boolean }) {
  const { camera, size } = useThree();
  const cfg = isMobile ? BOUTIQUE_SHELF_CAMERA.mobile : BOUTIQUE_SHELF_CAMERA.desktop;

  const shelfModels = useMemo(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return [];
    return getShelfModelLayout(size.width, size.height, isMobile, camera);
  }, [camera, size.width, size.height, isMobile]);

  return (
    <>
      <SoftShadows size={12} samples={12} focus={0.52} />
      <PerspectiveCamera
        makeDefault
        position={cfg.position}
        fov={cfg.fov}
        near={0.05}
        far={50}
        onUpdate={(cam) => cam.lookAt(cfg.lookAt[0], cfg.lookAt[1], cfg.lookAt[2])}
      />
      <ambientLight intensity={0.46} color={SHELF_IVORY} />
      <hemisphereLight args={[SHELF_IVORY, SHELF_COLOR, 0.4]} />
      <directionalLight
        position={[2.0, 5.8, 4.8]}
        intensity={0.44}
        color={SHELF_LIGHT_COLORS.key}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={12}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
        shadow-bias={-0.00015}
        shadow-normalBias={0.02}
      />
      <directionalLight position={[-2.4, 3.8, 2.0]} intensity={0.18} color={SHELF_LIGHT_COLORS.warm} />
      <directionalLight position={[0, 2.8, 5.5]} intensity={0.1} color={SHELF_LIGHT_COLORS.accent} />
      <spotLight
        position={[0, 5.6, 3.8]}
        angle={0.34}
        penumbra={0.96}
        intensity={0.28}
        color={SHELF_LIGHT_COLORS.glow}
        castShadow={false}
      />
      <pointLight position={[0, 4.2, 0.6]} intensity={0.12} color={SHELF_LIGHT_COLORS.warm} distance={10} decay={2} />
      <Environment preset="apartment" environmentIntensity={0.32} />
      {shelfModels.map((shelf) => (
        <Suspense key={shelf.side} fallback={null}>
          <PhysicalShelfModel layout={shelf} />
        </Suspense>
      ))}
    </>
  );
}

interface BoutiqueShelfProductsProps {
  visible: boolean;
}

export default function BoutiqueShelfProducts({ visible }: BoutiqueShelfProductsProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`);
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  if (!SHOP_SHELVES_ENABLED || !visible) return null;

  return (
    <div className="boutique-shelf-products boutique-hero__shelves">
      <Canvas
        frameloop="demand"
        shadows
        dpr={[1, 2]}
        className="boutique-shelf-products__canvas"
        style={{ pointerEvents: "none" }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 0.98;
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
          gl.outputColorSpace = THREE.SRGBColorSpace;
        }}
      >
        <ShelfScene isMobile={isMobile} />
      </Canvas>
    </div>
  );
}
