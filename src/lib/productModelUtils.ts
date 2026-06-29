import * as THREE from "three";

const TEXTURE_COLOR_KEYS = [
  "map",
  "emissiveMap",
  "aoMap",
] as const;

type JewelryMaterialKind = "gem" | "gold" | "silver" | "enamel" | "pearl" | "default";

function meshLabel(mesh: THREE.Mesh): string {
  return `${mesh.name} ${mesh.parent?.name ?? ""}`.toLowerCase();
}

function classifyJewelryMaterial(mesh: THREE.Mesh, mat: THREE.MeshStandardMaterial): JewelryMaterialKind {
  const name = meshLabel(mesh);

  if (/pearl|nacre/i.test(name)) return "pearl";
  if (/diamond|gem|jewel|stone|crystal|cz|ruby|sapphire|emerald|topaz|amethyst|brilliant/i.test(name)) {
    return "gem";
  }
  if (/enamel|inlay|peacock|floral|colour|color/i.test(name)) return "enamel";
  if (/silver|platinum|white.?gold|steel|rhodium/i.test(name)) return "silver";
  if (/gold|brass|bronze|vermeil|metal|ring|band|bangle|chain|link|frame|trim/i.test(name)) {
    return "gold";
  }

  const hsl = { h: 0, s: 0, l: 0 };
  mat.color.getHSL(hsl);

  if (mat.metalness > 0.62) {
    if (hsl.h < 0.14 || hsl.h > 0.92) return "gold";
    return "silver";
  }

  if (hsl.s > 0.42 && hsl.l > 0.2 && hsl.l < 0.82) {
    if (hsl.h > 0.22 && hsl.h < 0.55) return "enamel";
    return "gem";
  }

  if (hsl.l > 0.78 && hsl.s < 0.18) return "pearl";
  if (mat.metalness > 0.35 && hsl.s < 0.28) return "gold";

  return "default";
}

function ensureJewelryColorSpace(mat: THREE.MeshStandardMaterial) {
  for (const key of TEXTURE_COLOR_KEYS) {
    const tex = mat[key];
    if (tex && "colorSpace" in tex) {
      tex.colorSpace = THREE.SRGBColorSpace;
    }
  }
}

function asPhysicalMaterial(mat: THREE.MeshStandardMaterial): THREE.MeshPhysicalMaterial {
  if (mat instanceof THREE.MeshPhysicalMaterial) return mat;
  const physical = new THREE.MeshPhysicalMaterial();
  physical.copy(mat);
  return physical;
}

function tuneJewelryMaterial(
  mesh: THREE.Mesh,
  mat: THREE.MeshStandardMaterial,
  kind: JewelryMaterialKind,
): THREE.MeshStandardMaterial {
  ensureJewelryColorSpace(mat);

  const hasMap = Boolean(mat.map);
  let tuned = mat;

  if (kind === "gem" || kind === "pearl" || kind === "enamel") {
    tuned = asPhysicalMaterial(mat);
  }

  switch (kind) {
    case "gem":
      tuned.metalness = 0.0;
      tuned.roughness = Math.min(tuned.roughness, 0.06);
      tuned.envMapIntensity = 1.75;
      if (tuned instanceof THREE.MeshPhysicalMaterial) {
        tuned.transmission = Math.max(tuned.transmission ?? 0, 0.18);
        tuned.thickness = tuned.thickness || 0.42;
        tuned.ior = tuned.ior || 2.35;
        tuned.clearcoat = 1.0;
        tuned.clearcoatRoughness = 0.015;
        tuned.attenuationColor = tuned.attenuationColor ?? new THREE.Color("#ffffff");
        tuned.attenuationDistance = tuned.attenuationDistance || 2.4;
      }
      if (!hasMap) {
        tuned.emissive.copy(tuned.color).multiplyScalar(0.04);
        tuned.emissiveIntensity = 0.35;
      }
      break;
    case "pearl":
      tuned.metalness = 0.12;
      tuned.roughness = THREE.MathUtils.clamp(tuned.roughness, 0.18, 0.34);
      tuned.envMapIntensity = 1.05;
      if (tuned instanceof THREE.MeshPhysicalMaterial) {
        tuned.sheen = 0.72;
        tuned.sheenRoughness = 0.28;
        tuned.sheenColor = new THREE.Color("#FFF6EC");
        tuned.clearcoat = 0.55;
        tuned.clearcoatRoughness = 0.12;
      }
      break;
    case "enamel":
      tuned.metalness = 0.04;
      tuned.roughness = THREE.MathUtils.clamp(tuned.roughness, 0.12, 0.32);
      tuned.envMapIntensity = 0.82;
      if (tuned instanceof THREE.MeshPhysicalMaterial) {
        tuned.clearcoat = 0.92;
        tuned.clearcoatRoughness = 0.06;
      }
      if (!hasMap) {
        tuned.color.multiplyScalar(1.06);
      }
      break;
    case "gold":
      tuned.metalness = Math.max(tuned.metalness, 0.9);
      tuned.roughness = THREE.MathUtils.clamp(tuned.roughness, 0.12, 0.26);
      tuned.envMapIntensity = 1.42;
      if (tuned instanceof THREE.MeshPhysicalMaterial) {
        tuned.clearcoat = 0.52;
        tuned.clearcoatRoughness = 0.1;
      }
      if (!hasMap) {
        tuned.color.set("#D4AF37");
      }
      break;
    case "silver":
      tuned.metalness = Math.max(tuned.metalness, 0.93);
      tuned.roughness = THREE.MathUtils.clamp(tuned.roughness, 0.06, 0.2);
      tuned.envMapIntensity = 1.28;
      if (tuned instanceof THREE.MeshPhysicalMaterial) {
        tuned.clearcoat = 0.38;
        tuned.clearcoatRoughness = 0.08;
      }
      if (!hasMap) {
        tuned.color.set("#E8E8EC");
      }
      break;
    default:
      tuned.envMapIntensity = Math.max(tuned.envMapIntensity ?? 0.5, 1.12);
      if (tuned.metalness > 0.35) {
        tuned.metalness = Math.min(tuned.metalness, 0.94);
        tuned.roughness = Math.min(tuned.roughness, 0.3);
      }
      break;
  }

  tuned.side = THREE.FrontSide;
  tuned.needsUpdate = true;
  return tuned;
}

/** Center product on ground plane and scale to target visual span. */
export function fitProductToUniformSize(root: THREE.Object3D, targetSpan: number) {
  root.scale.set(1, 1, 1);
  root.position.set(0, 0, 0);
  root.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const visualSpan = Math.max(size.x, size.y, size.z);
  if (visualSpan > 0) {
    root.scale.setScalar(targetSpan / visualSpan);
  }

  root.updateMatrixWorld(true);
  const fitted = new THREE.Box3().setFromObject(root);
  const center = fitted.getCenter(new THREE.Vector3());
  root.position.set(-center.x, -fitted.min.y, -center.z);
}

export interface PrepareProductMaterialsOptions {
  castShadow?: boolean;
  receiveShadow?: boolean;
}

/** Preserve GLB textures while tuning metals, gems, and enamels for boutique lighting. */
export function prepareProductMaterials(
  root: THREE.Object3D,
  options: PrepareProductMaterialsOptions = {},
) {
  const castShadow = options.castShadow ?? false;
  const receiveShadow = options.receiveShadow ?? false;

  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;

    mesh.castShadow = castShadow;
    mesh.receiveShadow = receiveShadow;

    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const tuned: THREE.Material[] = [];

    for (const mat of materials) {
      if (!mat) continue;
      if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial) {
        const kind = classifyJewelryMaterial(mesh, mat);
        tuned.push(tuneJewelryMaterial(mesh, mat, kind));
      } else {
        tuned.push(mat);
      }
    }

    mesh.material = tuned.length === 1 ? tuned[0] : tuned;
  });
}

/** Recommended renderer settings for true-to-life jewelry color. */
export function applyJewelryRendererSettings(gl: THREE.WebGLRenderer, exposure = 1.08) {
  gl.outputColorSpace = THREE.SRGBColorSpace;
  gl.toneMapping = THREE.ACESFilmicToneMapping;
  gl.toneMappingExposure = exposure;
}
