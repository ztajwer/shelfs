"use client";

import { useRef, useMemo, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

import type { DoorFrameState } from "@/lib/doorFraming";
import { getModelUrl, extendGltfLoader } from "@/lib/modelAssets";
import { applyDoorMaterials } from "@/lib/shelfMaterials";

const DOOR_MODEL_URL = getModelUrl("door_col.glb");

interface GlassDoorsProps {
  progressRef: MutableRefObject<number>;
  frameRef?: MutableRefObject<DoorFrameState>;
  animRef?: MutableRefObject<{ phase: string }>;
}

export const PANEL_W = 1.4;
export const PANEL_H = 4.8;
export const DOOR_ASSEMBLY_H = PANEL_H + 0.2;

const GLASS_W = 1.66;
const GLASS_H = 5.0;
const PANEL_D = 0.04;
const MAX_OPEN = Math.PI * 0.44;

const FRAME_COLOR = "#251E1A"; // Dark bronze/espresso to match the frame

function FrameMat({ roughness = 0.1, metalness = 0.95 }: { roughness?: number; metalness?: number }) {
  return (
    <meshPhysicalMaterial
      color={FRAME_COLOR}
      metalness={metalness}
      roughness={roughness}
      clearcoat={1.0}
      clearcoatRoughness={0.1}
      envMapIntensity={1.5}
    />
  );
}

function ClearGlassMat() {
  return (
    <meshPhysicalMaterial
      color="#000000"
      transmission={0}
      opacity={0.35}
      transparent={true}
      roughness={0.15}
      metalness={0.3}
      ior={1.5}
      thickness={0.05}
      envMapIntensity={1.5}
      clearcoat={1.0}
      clearcoatRoughness={0.05}
      side={THREE.DoubleSide}
      reflectivity={0.8}
    />
  );
}

function DoorLattice() {
  const { alphaMap } = useMemo(() => {
    if (typeof document === 'undefined') return { alphaMap: null };
    const size = 128;
    const aCanvas = document.createElement("canvas");
    aCanvas.width = size;
    aCanvas.height = size;
    const aCtx = aCanvas.getContext("2d");
    if (aCtx) {
      aCtx.fillStyle = "#000000";
      aCtx.fillRect(0, 0, size, size);
      aCtx.strokeStyle = "#ffffff";
      aCtx.lineWidth = 14; 
      aCtx.lineJoin = "miter";
      aCtx.beginPath();
      aCtx.moveTo(size/2, 0);
      aCtx.lineTo(size, size/2);
      aCtx.lineTo(size/2, size);
      aCtx.lineTo(0, size/2);
      aCtx.closePath();
      aCtx.stroke();
    }
    const aTex = new THREE.CanvasTexture(aCanvas);
    aTex.wrapS = THREE.RepeatWrapping;
    aTex.wrapT = THREE.RepeatWrapping;
    aTex.repeat.set(GLASS_W * 5, GLASS_H * 5); // Diamond density
    aTex.anisotropy = 16;
    return { alphaMap: aTex };
  }, []);

  return (
    <>
      <mesh position={[0, 0, PANEL_D * 0.25 + 0.001]} castShadow receiveShadow>
        <planeGeometry args={[GLASS_W, GLASS_H]} />
        <meshStandardMaterial 
          color={FRAME_COLOR}
          metalness={0.9}
          roughness={0.3}
          alphaMap={alphaMap}
          transparent={true}
          alphaTest={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, 0, -(PANEL_D * 0.25 + 0.001)]} castShadow receiveShadow>
        <planeGeometry args={[GLASS_W, GLASS_H]} />
        <meshStandardMaterial 
          color={FRAME_COLOR}
          metalness={0.9}
          roughness={0.3}
          alphaMap={alphaMap}
          transparent={true}
          alphaTest={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
    </>
  );
}

function DoorHandle({ side }: { side: "left" | "right" }) {
  const handleInset = 0.18; // move handle slightly further from edge
  const x = side === "left" ? GLASS_W / 2 - handleInset : -GLASS_W / 2 + handleInset;
  const handleHeight = 1.4;
  const handleRadius = 0.016;
  const zPos = PANEL_D * 0.25 + 0.03;

  return (
    <group position={[x, 0, zPos]}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[handleRadius, handleRadius, handleHeight, 16]} />
        <FrameMat roughness={0.2} metalness={0.95} />
      </mesh>
      <mesh position={[0, handleHeight / 2 - 0.05, -0.015]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.015, 0.015, 0.03, 16]} />
        <FrameMat roughness={0.2} metalness={0.95} />
      </mesh>
      <mesh position={[0, -handleHeight / 2 + 0.05, -0.015]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.015, 0.015, 0.03, 16]} />
        <FrameMat roughness={0.2} metalness={0.95} />
      </mesh>
    </group>
  );
}

function DoorPanel({
  side,
  targetAngleRef,
  animRef,
}: {
  side: "left" | "right";
  targetAngleRef: MutableRefObject<number>;
  animRef?: MutableRefObject<{ phase: string }>;
}) {
  const pivotRef = useRef<THREE.Group>(null);
  const angle = useRef(0);

  const hingeX = side === "left" ? -PANEL_W : PANEL_W;
  const openDir = side === "left" ? -1 : 1;

  useFrame((_, delta) => {
    if (!pivotRef.current) return;
    const target = targetAngleRef.current * openDir;
    const phase = animRef?.current?.phase;
    if (phase === "complete") {
      angle.current = target;
    } else {
      const follow = phase === "opening" ? 20 : 10;
      angle.current = THREE.MathUtils.lerp(angle.current, target, Math.min(1, delta * follow));
    }
    pivotRef.current.rotation.y = angle.current;
  });

  const centerGap = 0.002;
  const innerEdgeLocal = side === "left" ? PANEL_W - centerGap : -PANEL_W + centerGap;
  const outerEdgeLocal = side === "left" ? PANEL_W - GLASS_W : -PANEL_W + GLASS_W;
  const panelCenterX = (innerEdgeLocal + outerEdgeLocal) / 2;

  const frameThickness = 0.012;

  return (
    <group position={[hingeX, 0, -0.02]}>
      <group ref={pivotRef}>
        <group position={[panelCenterX, 0, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[GLASS_W, GLASS_H, PANEL_D * 0.5]} />
            <ClearGlassMat />
          </mesh>
          <DoorLattice />

          <mesh position={[0, GLASS_H / 2 - frameThickness / 2, 0]} castShadow>
            <boxGeometry args={[GLASS_W, frameThickness, PANEL_D]} />
            <FrameMat />
          </mesh>
          <mesh position={[0, -GLASS_H / 2 + frameThickness / 2, 0]} castShadow>
            <boxGeometry args={[GLASS_W, frameThickness, PANEL_D]} />
            <FrameMat />
          </mesh>
          {/* Outer vertical frame (hinge side) */}
          <mesh position={[side === "left" ? -GLASS_W / 2 + frameThickness / 2 : GLASS_W / 2 - frameThickness / 2, 0, 0]} castShadow>
            <boxGeometry args={[frameThickness, GLASS_H - frameThickness * 2, PANEL_D]} />
            <FrameMat />
          </mesh>
          {/* Inner vertical frame (center line where doors meet) */}
          <mesh position={[side === "left" ? GLASS_W / 2 - frameThickness / 2 : -GLASS_W / 2 + frameThickness / 2, 0, 0]} castShadow>
            <boxGeometry args={[frameThickness, GLASS_H - frameThickness * 2, PANEL_D]} />
            <FrameMat />
          </mesh>

          <DoorHandle side={side} />

          <group position={[-panelCenterX, 0, -0.01]}>
            {[GLASS_H * 0.4, 0, -GLASS_H * 0.4].map((y) => (
              <group key={y} position={[0, y, 0]}>
                <mesh castShadow>
                  <cylinderGeometry args={[0.012, 0.012, 0.06, 16]} />
                  <FrameMat roughness={0.4} />
                </mesh>
              </group>
            ))}
          </group>
        </group>
      </group>
    </group>
  );
}

function PhysicalDoorFrame() {
  const { scene } = useGLTF(DOOR_MODEL_URL, true, false, extendGltfLoader);
  
  const cloned = useMemo(() => {
    const obj = scene.clone(true);
    applyDoorMaterials(obj);

    // Fit to 3.36 x 5.04 so it works with the doorFraming math perfectly
    obj.scale.set(1, 1, 1);
    obj.position.set(0, 0, 0);
    obj.rotation.set(0, 0, 0);
    obj.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(obj);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    
    // DOOR_WIDTH = 3.36, DOOR_HEIGHT = 5.04
    obj.scale.set(3.36 / size.x, 5.04 / size.y, 3.36 / size.x);
    obj.position.set(-center.x * (3.36 / size.x), -center.y * (5.04 / size.y), -center.z);
    
    return obj;
  }, [scene]);

  return (
    <group position={[0, 0, -0.02]}>
      <primitive object={cloned} />
    </group>
  );
}

export default function GlassDoors({ progressRef, frameRef, animRef }: GlassDoorsProps) {
  const leftTargetRef = useRef(0);
  const rightTargetRef = useRef(0);
  const shadowMatRef = useRef<THREE.ShadowMaterial>(null);
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    const p = progressRef.current;
    leftTargetRef.current = p * MAX_OPEN;
    const delayed = Math.max(0, (p - 0.06) / 0.94);
    rightTargetRef.current = delayed * MAX_OPEN;

    if (shadowMatRef.current) {
      shadowMatRef.current.opacity = 0.14 + p * 0.16;
    }

    if (groupRef.current && frameRef?.current) {
      const { scale, groupZ } = frameRef.current;
      groupRef.current.scale.set(scale.x, scale.y, scale.x);
      groupRef.current.position.z = groupZ;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <PhysicalDoorFrame />
      <DoorPanel side="left" targetAngleRef={leftTargetRef} animRef={animRef} />
      <DoorPanel side="right" targetAngleRef={rightTargetRef} animRef={animRef} />
      <mesh position={[0, -GLASS_H / 2 - 0.026, 0.22]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 5]} />
        <shadowMaterial ref={shadowMatRef} transparent opacity={0.14} color="#4A3728" />
      </mesh>
    </group>
  );
}
