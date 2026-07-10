import * as THREE from "three";

const TEXTURE_COLOR_KEYS = [
  "map",
  "emissiveMap",
  "aoMap",
] as const;

type JewelryMaterialKind = "gem" | "gold" | "silver" | "enamel" | "pearl" | "default";

function meshLabel(mesh: THREE.Mesh, mat?: THREE.MeshStandardMaterial): string {
  return `${mesh.name} ${mesh.parent?.name ?? ""} ${mat?.name ?? ""}`.toLowerCase();
}

function classifyJewelryMaterial(mesh: THREE.Mesh, mat: THREE.MeshStandardMaterial, productId?: string): JewelryMaterialKind {
  const name = meshLabel(mesh, mat);

  // Special overrides for products
  if (productId === "pro6") {
    // pro6.glb (Perfume Showcase) override
    if (/Object_(4|5|8|11|12)$/i.test(mesh.name)) {
      return "gem";
    }
    return "gold"; // Everything else is metallic body
  }

  if (productId === "pro5") {
    if (/dmesh/i.test(mesh.name) || /Material_2/i.test(mat.name)) {
      return "gem";
    }
  }

  if (productId === "pro1") {
    if (/dimond/i.test(name)) {
      return "gem";
    }
  }

  if (productId === "pro2") {
    if (/dimond/i.test(name)) {
      return "gem";
    }
  }

  if (/pearl|nacre/i.test(name)) return "pearl";
  if (/enamel|inlay|peacock|floral|colour|color/i.test(name)) return "enamel";

  // Translucent / glassy / gemstones / crystal / liquid detection
  const isGlassy =
    (mat instanceof THREE.MeshPhysicalMaterial && (mat.transmission > 0.05 || mat.thickness > 0)) ||
    mat.transparent ||
    (mat.opacity !== undefined && mat.opacity < 0.98) ||
    /dmesh|dimond|diamond|gem|jewel|stone|crystal|cz|ruby|sapphire|emerald|topaz|amethyst|brilliant|glass|liquid|fluid|lens|dial|face/i.test(name);

  if (isGlassy) return "gem";

  // Metallic body / parts detection
  const isMetallic =
    mat.metalness > 0.25 ||
    /gold|brass|bronze|vermeil|metal|ring|band|bangle|chain|link|frame|trim|silver|platinum|white.?gold|steel|rhodium|chrome|iron|copper|aluminum|nickel|zinc|buckle|case|bezel|crown|hands|marker/i.test(name);

  if (isMetallic) {
    const hsl = { h: 0, s: 0, l: 0 };
    mat.color.getHSL(hsl);
    if (hsl.s < 0.18 || /silver|platinum|white.?gold|steel|rhodium|chrome/i.test(name)) {
      return "silver";
    }
    return "gold";
  }

  // Fallback to original HSL / metalness heuristics
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
    if (tex && tex !== null && "colorSpace" in tex) {
      tex.colorSpace = THREE.SRGBColorSpace;
    }
  }
}

function asPhysicalMaterial(mat: THREE.MeshStandardMaterial): THREE.MeshPhysicalMaterial {
  if (mat instanceof THREE.MeshPhysicalMaterial) return mat;
  const physical = new THREE.MeshPhysicalMaterial();

  // Always do full manual copy — avoids cross-version prototype chain crashes.
  try { physical.color.copy(mat.color); } catch { physical.color.set("#D4AF37"); }
  physical.roughness = isFinite(mat.roughness) ? mat.roughness : 0.3;
  physical.metalness = isFinite(mat.metalness) ? mat.metalness : 0.5;
  physical.map = mat.map ?? null;
  physical.normalMap = mat.normalMap ?? null;
  try { if (mat.normalScale) physical.normalScale.copy(mat.normalScale); } catch { /* ignore */ }
  physical.roughnessMap = mat.roughnessMap ?? null;
  physical.metalnessMap = mat.metalnessMap ?? null;
  physical.aoMap = mat.aoMap ?? null;
  physical.aoMapIntensity = isFinite(mat.aoMapIntensity) ? mat.aoMapIntensity : 1;
  try { physical.emissive.copy(mat.emissive); } catch { physical.emissive.set(0, 0, 0); }
  physical.emissiveIntensity = isFinite(mat.emissiveIntensity) ? mat.emissiveIntensity : 1;
  physical.emissiveMap = mat.emissiveMap ?? null;
  physical.envMapIntensity = isFinite(mat.envMapIntensity) ? mat.envMapIntensity : 1;
  physical.transparent = mat.transparent;
  physical.opacity = isFinite(mat.opacity) ? mat.opacity : 1;
  physical.alphaMap = mat.alphaMap ?? null;
  physical.side = mat.side;
  physical.depthWrite = mat.depthWrite;
  physical.depthTest = mat.depthTest;

  // Restore MeshPhysicalMaterial identity so the WebGLRenderer uses the correct physical shader program!
  physical.type = "MeshPhysicalMaterial";
  (physical as any).isMeshPhysicalMaterial = true;
  (physical as any).isMeshStandardMaterial = false;
  physical.defines = { ...(physical.defines ?? {}), PHYSICAL: "" };

  return physical;
}

export interface CustomizationSettings {
  body: "gold" | "silver" | "bronze";
  stone: "diamond" | "ruby" | "emerald" | "sapphire" | "amethyst";
}

function tuneJewelryMaterial(
  mesh: THREE.Mesh,
  mat: THREE.MeshStandardMaterial,
  kind: JewelryMaterialKind,
  customization?: CustomizationSettings,
): THREE.MeshStandardMaterial {
  ensureJewelryColorSpace(mat);

  // Use userData.hasMap if already cached (avoids inconsistency after cloning)
  const hasMap = mat.userData.hasMap !== undefined ? Boolean(mat.userData.hasMap) : Boolean(mat.map);
  let tuned = mat;

  if (kind === "gem" || kind === "pearl" || kind === "enamel") {
    tuned = asPhysicalMaterial(mat);
    // Carry over userData so classification is preserved
    tuned.userData = { ...mat.userData };
  }

  // Restore original state first
  tuned.map = mat.userData.originalMap ?? null;
  tuned.emissiveMap = mat.userData.originalEmissiveMap ?? null;
  if (mat.userData.originalColor) {
    tuned.color.copy(mat.userData.originalColor);
  }
  if (isFinite(mat.userData.originalRoughness)) {
    tuned.roughness = mat.userData.originalRoughness;
  }
  if (isFinite(mat.userData.originalMetalness)) {
    tuned.metalness = mat.userData.originalMetalness;
  }
  if (tuned instanceof THREE.MeshPhysicalMaterial) {
    if (isFinite(mat.userData.originalTransmission)) {
      tuned.transmission = mat.userData.originalTransmission;
    }
    if (isFinite(mat.userData.originalIor)) {
      tuned.ior = mat.userData.originalIor;
    }
    if (isFinite(mat.userData.originalThickness)) {
      tuned.thickness = mat.userData.originalThickness;
    }
    if (mat.userData.originalAttenuationColor && tuned.attenuationColor) {
      tuned.attenuationColor.copy(mat.userData.originalAttenuationColor);
    }
  }

  // Check if customization is active for this material kind
  let applyCustomBody = false;
  let applyCustomStone = false;

  if (customization) {
    if (kind === "gold" || kind === "silver") {
      applyCustomBody = true;
    }
    if (kind === "gem" || kind === "pearl" || kind === "enamel") {
      applyCustomStone = true;
    }
  }

  if (applyCustomBody && customization?.body) {
    const body = customization.body;
    tuned.metalness = body === "silver" ? 0.98 : body === "bronze" ? 0.90 : 0.95;
    tuned.roughness = body === "silver" ? 0.05 : body === "bronze" ? 0.18 : 0.08;
    tuned.envMapIntensity = body === "silver" ? 1.5 : body === "bronze" ? 1.3 : 1.6;

    // Clear maps to allow clean color tinting
    tuned.map = null;
    tuned.emissiveMap = null;

    if (tuned instanceof THREE.MeshPhysicalMaterial) {
      tuned.clearcoat = 1.0;
      tuned.clearcoatRoughness = 0.02;
    }

    if (body === "silver") {
      tuned.color.set("#E8E8EC");
    } else if (body === "bronze") {
      tuned.color.set("#A87A54");
    } else {
      tuned.color.set("#D4AF37");
    }
  } else if (applyCustomStone && customization?.stone) {
    const stone = customization.stone;
    tuned.metalness = 0.0;
    tuned.envMapIntensity = 2.5;

    // Clear maps for transparent gemstones
    tuned.map = null;
    tuned.emissiveMap = null;

    if (tuned instanceof THREE.MeshPhysicalMaterial) {
      tuned.clearcoat = 1.0;
      tuned.clearcoatRoughness = 0.0;
      tuned.transmission = 0.99;
      tuned.thickness = 0.8;

      if (stone === "diamond") {
        tuned.roughness = 0.0;
        tuned.ior = 2.417;
        tuned.transmission = 0.99;
        tuned.thickness = 0.8;
        tuned.color.set("#FFFFFF");
        if (tuned.attenuationColor) tuned.attenuationColor.set("#FFFFFF");
        tuned.attenuationDistance = 3.0;
        tuned.emissive.set("#FFFFFF");
        tuned.emissiveIntensity = 0.08;
      } else if (stone === "ruby") {
        tuned.roughness = 0.01;
        tuned.ior = 1.76;
        tuned.transmission = 0.88;
        tuned.color.set("#E0115F");
        if (tuned.attenuationColor) tuned.attenuationColor.set("#E0115F");
        tuned.attenuationDistance = 0.3;
        tuned.emissive.set("#E0115F");
        tuned.emissiveIntensity = 0.15;
      } else if (stone === "emerald") {
        tuned.roughness = 0.01;
        tuned.ior = 1.57;
        tuned.transmission = 0.85;
        tuned.color.set("#097969");
        if (tuned.attenuationColor) tuned.attenuationColor.set("#097969");
        tuned.attenuationDistance = 0.35;
        tuned.emissive.set("#097969");
        tuned.emissiveIntensity = 0.12;
      } else if (stone === "sapphire") {
        tuned.roughness = 0.01;
        tuned.ior = 1.76;
        tuned.transmission = 0.88;
        tuned.color.set("#0F52BA");
        if (tuned.attenuationColor) tuned.attenuationColor.set("#0F52BA");
        tuned.attenuationDistance = 0.3;
        tuned.emissive.set("#0F52BA");
        tuned.emissiveIntensity = 0.15;
      } else if (stone === "amethyst") {
        tuned.roughness = 0.01;
        tuned.ior = 1.54;
        tuned.transmission = 0.92;
        tuned.color.set("#9966CC");
        if (tuned.attenuationColor) tuned.attenuationColor.set("#9966CC");
        tuned.attenuationDistance = 0.4;
        tuned.emissive.set("#9966CC");
        tuned.emissiveIntensity = 0.1;
      }
    } else {
      if (stone === "diamond") tuned.color.set("#FFFFFF");
      else if (stone === "ruby") tuned.color.set("#E0115F");
      else if (stone === "emerald") tuned.color.set("#097969");
      else if (stone === "sapphire") tuned.color.set("#0F52BA");
      else if (stone === "amethyst") tuned.color.set("#9966CC");
    }
  } else {
    // Standard jewelry tuning using cached parameters or default classification
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
          tuned.color.copy(mat.userData.originalColor || new THREE.Color("#D4AF37"));
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
          tuned.color.copy(mat.userData.originalColor || new THREE.Color("#E8E8EC"));
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
  }

  tuned.side = THREE.FrontSide;
  tuned.needsUpdate = true;
  return tuned;
}

export function fitProductToUniformSize(root: THREE.Object3D, targetSpan: number) {
  // Strip any embedded lights from the model hierarchy to prevent light count mismatch crashes in WebGLRenderer
  const lightsToRemove: THREE.Object3D[] = [];
  root.traverse((child) => {
    if ((child as any).isLight) {
      lightsToRemove.push(child);
    }
  });
  lightsToRemove.forEach((light) => {
    light.parent?.remove(light);
  });

  root.scale.set(1, 1, 1);
  root.position.set(0, 0, 0);
  root.updateMatrixWorld(true);

  // Compute bounding box based only on meshes to ignore helper locators, cameras, grids, etc.
  const box = new THREE.Box3();
  let hasMesh = false;
  root.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      box.expandByObject(child);
      hasMesh = true;
    }
  });
  if (!hasMesh) {
    box.setFromObject(root);
  }

  const size = box.getSize(new THREE.Vector3());
  const visualSpan = Math.max(size.x, size.y, size.z);
  if (visualSpan > 0) {
    root.scale.setScalar(targetSpan / visualSpan);
  }

  root.updateMatrixWorld(true);
  
  const fitted = new THREE.Box3();
  let hasMeshFitted = false;
  root.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      fitted.expandByObject(child);
      hasMeshFitted = true;
    }
  });
  if (!hasMeshFitted) {
    fitted.setFromObject(root);
  }

  const center = fitted.getCenter(new THREE.Vector3());
  root.position.set(-center.x, -fitted.min.y, -center.z);
}

export interface PrepareProductMaterialsOptions {
  castShadow?: boolean;
  receiveShadow?: boolean;
  customization?: CustomizationSettings;
  productId?: string;
}

/** Preserve GLB textures while tuning metals, gems, and enamels for boutique lighting. */
export function prepareProductMaterials(
  root: THREE.Object3D,
  options: PrepareProductMaterialsOptions = {},
) {
  const castShadow = options.castShadow ?? false;
  const receiveShadow = options.receiveShadow ?? false;
  const customization = options.customization;
  const productId = options.productId;

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
        // Cache original values in userData so we can restore/change dynamically
        // IMPORTANT: only store if not already cached (deep clone resets userData)
        if (!mat.userData.originalKind) {
          mat.userData.originalKind = classifyJewelryMaterial(mesh, mat, productId);
          mat.userData.originalColor = mat.color.clone();
          mat.userData.originalRoughness = mat.roughness;
          mat.userData.originalMetalness = mat.metalness;
          mat.userData.originalMap = mat.map ?? null;
          mat.userData.originalEmissiveMap = mat.emissiveMap ?? null;
          mat.userData.hasMap = Boolean(mat.map);
          if (mat instanceof THREE.MeshPhysicalMaterial) {
            mat.userData.originalTransmission = mat.transmission;
            mat.userData.originalIor = mat.ior;
            mat.userData.originalThickness = mat.thickness;
            mat.userData.originalAttenuationColor = mat.attenuationColor?.clone();
          }
        }
        const kind = mat.userData.originalKind as JewelryMaterialKind;
        tuned.push(tuneJewelryMaterial(mesh, mat, kind, customization));
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
