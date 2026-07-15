import * as THREE from "three";
import { SHELF_COLOR, SHELF_GOLD, SHELF_IVORY, SHELF_WARM } from "./shelfProductLayout";

export type ShelfMeshKind = "glass" | "metal" | "divider" | "wood" | "interior";

const woodMaterials = new Map<string, THREE.MeshPhysicalMaterial>();
const metalMaterial = createMetalMaterial();
const dividerMaterial = createGoldDividerMaterial();
const glassMaterial = createGlassMaterial();

function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function createWoodMaterial(variant: number, interior = false): THREE.MeshPhysicalMaterial {
  const jitter = (variant % 17) / 240;
  const base = interior ? SHELF_WARM : SHELF_COLOR;
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(base),
    roughness: interior ? 0.25 + jitter : 0.15 + jitter,
    metalness: interior ? 0.1 : 0.2,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    envMapIntensity: interior ? 0.6 : 0.8,
    reflectivity: 0.6,
    sheen: 0.1,
    sheenRoughness: 0.2,
    sheenColor: new THREE.Color(SHELF_IVORY),
    emissive: new THREE.Color(interior ? "#3A2A18" : "#2A1F12"),
    emissiveIntensity: interior ? 0.05 : 0.08,
  });
}

function createMetalMaterial(): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(SHELF_GOLD),
    roughness: 0.16,
    metalness: 0.88,
    clearcoat: 0.7,
    clearcoatRoughness: 0.1,
    envMapIntensity: 0.92,
    emissive: new THREE.Color("#C9A04A"),
    emissiveIntensity: 0.04,
  });
}

function createGoldDividerMaterial(): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#E8C868"),
    roughness: 0.05,
    metalness: 0.95,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    envMapIntensity: 1.2,
    emissive: new THREE.Color(SHELF_GOLD),
    emissiveIntensity: 0.12,
    reflectivity: 0.78,
  });
}

function createGlassMaterial(): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#FFFFFF"),
    metalness: 0,
    roughness: 0.03,
    transmission: 0.95,
    thickness: 1.15,
    ior: 1.52,
    transparent: true,
    opacity: 1,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    envMapIntensity: 1.0,
    attenuationColor: new THREE.Color(SHELF_IVORY),
    attenuationDistance: 2.8,
    reflectivity: 0.58,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
}

function isThinGlassPanel(mesh: THREE.Mesh, root: THREE.Object3D): boolean {
  const rootBox = new THREE.Box3().setFromObject(root);
  const meshBox = new THREE.Box3().setFromObject(mesh);
  const rootSize = rootBox.getSize(new THREE.Vector3());
  const meshSize = meshBox.getSize(new THREE.Vector3());
  const thin = Math.min(meshSize.x, meshSize.y, meshSize.z);
  const wide = Math.max(meshSize.x, meshSize.y, meshSize.z);
  const rootWide = Math.max(rootSize.x, rootSize.y, rootSize.z);
  return thin / Math.max(wide, 0.001) < 0.07 && wide > rootWide * 0.08;
}

function isInteriorPanel(mesh: THREE.Mesh, root: THREE.Object3D): boolean {
  const name = `${mesh.name} ${mesh.parent?.name ?? ""}`.toLowerCase();
  if (/inner|interior|back|liner|lining|cabinet|void|cavity/i.test(name)) return true;

  const rootBox = new THREE.Box3().setFromObject(root);
  const meshBox = new THREE.Box3().setFromObject(mesh);
  const rootSize = rootBox.getSize(new THREE.Vector3());
  const rootH = Math.max(rootSize.y, 0.001);
  const rootVolume = Math.max(rootSize.x * rootSize.y * rootSize.z, 0.0001);
  const meshVolume = Math.max(
    meshBox.getSize(new THREE.Vector3()).x *
      meshBox.getSize(new THREE.Vector3()).y *
      meshBox.getSize(new THREE.Vector3()).z,
    0.0001,
  );
  const centerT = (meshBox.getCenter(new THREE.Vector3()).y - rootBox.min.y) / rootH;
  return centerT > 0.18 && centerT < 0.82 && meshVolume < rootVolume * 0.35;
}

function isGoldDividerPanel(mesh: THREE.Mesh, root: THREE.Object3D): boolean {
  const name = `${mesh.name} ${mesh.parent?.name ?? ""}`.toLowerCase();
  if (/divid|section|partition|mullion|bar|rail|slot|compartment|shelf.?board|tier|level/i.test(name)) {
    return true;
  }

  const rootBox = new THREE.Box3().setFromObject(root);
  const meshBox = new THREE.Box3().setFromObject(mesh);
  const rootSize = rootBox.getSize(new THREE.Vector3());
  const meshSize = meshBox.getSize(new THREE.Vector3());
  const rootH = Math.max(rootSize.y, 0.001);
  const thin = Math.min(meshSize.x, meshSize.y, meshSize.z);
  const wide = Math.max(meshSize.x, meshSize.y, meshSize.z);
  const centerT = (meshBox.getCenter(new THREE.Vector3()).y - rootBox.min.y) / rootH;
  const flatness = thin / Math.max(wide, 0.001);

  const isHorizontalShelf = flatness < 0.14 && wide > rootSize.x * 0.22 && centerT > 0.12 && centerT < 0.92;
  const isVerticalDivider = meshSize.y > rootH * 0.35 && thin < rootSize.x * 0.08 && wide < rootSize.z * 0.5;

  return isHorizontalShelf || isVerticalDivider;
}

export function classifyShelfMesh(mesh: THREE.Mesh, root: THREE.Object3D): ShelfMeshKind {
  const name = `${mesh.name} ${mesh.parent?.name ?? ""}`.toLowerCase();

  if (/glass|pane|window|vitrine|display.?case|cover|glazing|mirror|shield/i.test(name)) {
    return "glass";
  }
  if (isGoldDividerPanel(mesh, root)) return "divider";
  if (/gold|trim|rim|edge|frame|metal|brass|handle|chrome|steel|hinge/i.test(name)) {
    return "metal";
  }
  if (isThinGlassPanel(mesh, root)) return "glass";
  if (isInteriorPanel(mesh, root)) return "interior";

  return "wood";
}

function getWoodMaterial(variant: number, interior = false): THREE.MeshPhysicalMaterial {
  const key = `${interior ? "in" : "out"}-${variant}`;
  if (!woodMaterials.has(key)) {
    woodMaterials.set(key, createWoodMaterial(variant, interior));
  }
  return woodMaterials.get(key)!;
}

export function applyLuxuryShelfMaterials(root: THREE.Object3D) {
  root.updateMatrixWorld(true);

  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh || !mesh.visible) return;

    const kind = classifyShelfMesh(mesh, root);
    const name = mesh.name || mesh.uuid;

    mesh.castShadow = kind !== "glass";
    mesh.receiveShadow = true;

    if (kind === "glass") {
      mesh.material = glassMaterial;
      mesh.renderOrder = 12;
      return;
    }

    if (kind === "divider") {
      mesh.material = dividerMaterial;
      mesh.renderOrder = 6;
      return;
    }

    if (kind === "metal") {
      mesh.material = metalMaterial;
      mesh.renderOrder = 4;
      return;
    }

    if (kind === "interior") {
      mesh.material = getWoodMaterial(hashName(name), true);
      mesh.renderOrder = 1;
      return;
    }

    mesh.material = getWoodMaterial(hashName(name), false);
    mesh.renderOrder = 2;
  });
}

export function applyDoorMaterials(root: THREE.Object3D) {
  root.updateMatrixWorld(true);
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh || !mesh.visible) return;

    const name = mesh.name.toLowerCase();
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    if (/glass|pane/i.test(name)) {
      mesh.material = glassMaterial;
      mesh.renderOrder = 12;
      mesh.castShadow = false;
    } else if (/metal|brass|gold|trim|handle/i.test(name)) {
      mesh.material = metalMaterial;
      mesh.renderOrder = 4;
    } else {
      // Default to rich dark espresso wood for the doors
      mesh.material = getWoodMaterial(hashName(name), false);
      mesh.renderOrder = 2;
    }
  });
}

export function getShelfInteriorLightLayout(root: THREE.Object3D) {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const { min } = box;

  const levels = [0.2, 0.38, 0.56, 0.74, 0.88];
  const innerZ = min.z + size.z * 0.6;
  const glowZ = min.z + size.z * 0.67;

  const points = levels.map((t) => {
    const y = min.y + size.y * t;
    return {
      point: new THREE.Vector3(center.x, y, innerZ),
      glow: new THREE.Vector3(center.x, y + size.y * 0.035, glowZ),
      spotTarget: new THREE.Vector3(center.x, y - size.y * 0.03, min.z + size.z * 0.32),
    };
  });

  return {
    points,
    topGlow: new THREE.Vector3(center.x, min.y + size.y * 0.92, glowZ),
    distance: Math.max(size.x, size.y, size.z) * 0.58,
    stripWidth: size.x * 0.42,
    stripHeight: size.y * 0.018,
    center,
  };
}

export function getShelfGlassMaterial() {
  return glassMaterial;
}

export function getShelfMetalMaterial() {
  return metalMaterial;
}

export function getShelfDividerMaterial() {
  return dividerMaterial;
}

export const SHELF_LIGHT_COLORS = {
  key: "#FFF9F0",
  fill: SHELF_COLOR,
  glow: "#FFE4A8",
  accent: "#F5D060",
  warm: "#FFD98A",
  shadow: "#C4A574",
  led: "#FFF2CC",
} as const;
