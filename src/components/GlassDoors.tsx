"use client";

import { useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import type { DoorFrameState } from "@/lib/doorFraming";

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

const FRAME_COLOR = "#D4AF37"; // Shiny gold

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
      color="#ffffff"
      transmission={0.8} // 80% see through
      opacity={1.0} // Prevents HTML background image from showing through
      transparent={true}
      roughness={0.1} // Just a little blurry
      metalness={0.1}
      ior={1.5}
      thickness={0.05}
      envMapIntensity={1.5}
      clearcoat={1.0}
      clearcoatRoughness={0.05}
      side={THREE.DoubleSide}
      reflectivity={0.6}
    />
  );
}

function DoorHandle({ side }: { side: "left" | "right" }) {
  const handleInset = 0.08;
  const x = side === "left" ? GLASS_W / 2 - handleInset : -GLASS_W / 2 + handleInset;

  return (
    <group position={[x, -0.15, PANEL_D / 2 + 0.025]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.007, 0.007, 1.2, 16]} />
        <FrameMat roughness={0.2} metalness={0.95} />
      </mesh>
      <mesh position={[0, 0.45, -0.015]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.005, 0.005, 0.03, 16]} />
        <FrameMat roughness={0.2} metalness={0.95} />
      </mesh>
      <mesh position={[0, -0.45, -0.015]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.005, 0.005, 0.03, 16]} />
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
    <group position={[hingeX, 0, 0]}>
      <group ref={pivotRef}>
        <group position={[panelCenterX, 0, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[GLASS_W, GLASS_H, PANEL_D * 0.5]} />
            <ClearGlassMat />
          </mesh>

          <mesh position={[0, GLASS_H / 2 - frameThickness / 2, 0]} castShadow>
            <boxGeometry args={[GLASS_W, frameThickness, PANEL_D]} />
            <FrameMat />
          </mesh>
          <mesh position={[0, -GLASS_H / 2 + frameThickness / 2, 0]} castShadow>
            <boxGeometry args={[GLASS_W, frameThickness, PANEL_D]} />
            <FrameMat />
          </mesh>
          <mesh position={[side === "left" ? -GLASS_W / 2 + frameThickness / 2 : GLASS_W / 2 - frameThickness / 2, 0, 0]} castShadow>
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

function DoorFrame() {
  const totalW = GLASS_W * 2 + 0.01;

  return (
    <group position={[0, 0, -0.02]}>
      <mesh position={[0, GLASS_H / 2 + 0.01, 0]} castShadow>
        <boxGeometry args={[totalW, 0.02, 0.04]} />
        <FrameMat roughness={0.5} />
      </mesh>
      <mesh position={[-totalW / 2 - 0.01, 0, 0]} castShadow>
        <boxGeometry args={[0.02, GLASS_H + 0.04, 0.04]} />
        <FrameMat roughness={0.5} />
      </mesh>
      <mesh position={[totalW / 2 + 0.01, 0, 0]} castShadow>
        <boxGeometry args={[0.02, GLASS_H + 0.04, 0.04]} />
        <FrameMat roughness={0.5} />
      </mesh>
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
      <DoorFrame />
      <DoorPanel side="left" targetAngleRef={leftTargetRef} animRef={animRef} />
      <DoorPanel side="right" targetAngleRef={rightTargetRef} animRef={animRef} />
      <mesh position={[0, -GLASS_H / 2 - 0.026, 0.22]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 5]} />
        <shadowMaterial ref={shadowMatRef} transparent opacity={0.14} color="#4A3728" />
      </mesh>
    </group>
  );
}
