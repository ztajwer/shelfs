import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

globalThis.self = globalThis;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG = path.resolve(__dirname, "../../.cursor/debug-44e59c.log");
const GLB = path.resolve(__dirname, "../public/table-3d.glb");

const MOBILE_ANCHOR = { surfaceY: 0.058, topWidth: 0.32, forwardZ: 0.508 };

function hideRoomKeepCounter(root) {
  root.updateMatrixWorld(true);
  const sceneBox = new THREE.Box3().setFromObject(root);
  const sceneSize = sceneBox.getSize(new THREE.Vector3());
  root.traverse((child) => {
    const mesh = child;
    if (!mesh.isMesh) return;
    const box = new THREE.Box3().setFromObject(mesh);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const width = Math.max(size.x, size.z);
    const flatness = size.y / Math.max(width, 0.001);
    const isFloor = flatness < 0.06 && width > 1.8 && center.y < sceneBox.min.y + sceneSize.y * 0.1;
    const isWall = size.y > 2.0 && width > 1.6;
    const isCeiling = center.y > sceneBox.min.y + sceneSize.y * 0.82;
    mesh.visible = !(isFloor || isWall || isCeiling);
  });
}

function fitTableToSize(root, targetSize) {
  root.scale.set(1, 1, 1);
  root.position.set(0, 0, 0);
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  root.position.set(-center.x, -box.min.y, -center.z);
  const maxDim = Math.max(size.x, size.y, size.z);
  if (maxDim > 0) root.scale.setScalar(targetSize / maxDim);
  root.updateMatrixWorld(true);
  const fitted = new THREE.Box3().setFromObject(root);
  root.position.y -= fitted.min.y;
  const centered = new THREE.Box3().setFromObject(root);
  const finalCenter = centered.getCenter(new THREE.Vector3());
  root.position.x -= finalCenter.x;
  root.position.z -= finalCenter.z;
}

function findCounterSurfaceMetrics(root, expectedSurfaceY) {
  root.updateMatrixWorld(true);
  const rootBox = new THREE.Box3().setFromObject(root);
  const rootMinY = rootBox.min.y;
  const rootCenter = rootBox.getCenter(new THREE.Vector3());
  const sceneSize = rootBox.getSize(new THREE.Vector3());
  const compactCounter = sceneSize.y < 0.4;
  const yMin = rootMinY + sceneSize.y * (compactCounter ? 0.42 : 0.04);
  const yMax = rootMinY + sceneSize.y * (compactCounter ? 1.01 : 0.55);
  const flatnessMax = compactCounter ? 0.72 : 0.55;
  let best = null;
  let bestScore = -Infinity;
  const candidates = [];

  root.traverse((child) => {
    const mesh = child;
    if (!mesh.isMesh || !mesh.visible) return;
    const box = new THREE.Box3().setFromObject(mesh);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const topY = box.max.y;
    const surfaceY = topY - rootMinY;
    if (topY < yMin || topY > yMax) return;
    if (!compactCounter && center.y > rootMinY + sceneSize.y * 0.55) return;
    const width = Math.max(size.x, size.z);
    const flatness = size.y / Math.max(width, 0.001);
    if (flatness > flatnessMax || width < 0.035) return;
    let score = width * 10;
    score -= Math.abs(center.x - rootCenter.x) * 14;
    score -= Math.abs(center.z - rootCenter.z) * 10;
    score -= Math.abs(surfaceY - expectedSurfaceY) * 55;
    const name = `${mesh.name} ${mesh.parent?.name || ""}`.toLowerCase();
    if (/velvet|tray|pad|display|inner|shelf|mat/i.test(name)) score += 42;
    if (/counter|table|display|top|tray|stand|pad|round|circle/i.test(name)) score += 28;
    if (/glass|pane/i.test(name)) score -= 40;
    candidates.push({ name: mesh.name, surfaceY, topWidth: width, score });
    if (score > bestScore) {
      bestScore = score;
      best = {
        surfaceY,
        topWidth: width,
        forwardZ: center.z - rootCenter.z,
        centerX: center.x - rootCenter.x,
      };
    }
  });

  const allMeshes = [];
  root.traverse((child) => {
    const mesh = child;
    if (!mesh.isMesh) return;
    const box = new THREE.Box3().setFromObject(mesh);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const topY = box.max.y;
    const surfaceY = topY - rootMinY;
    const width = Math.max(size.x, size.z);
    const flatness = size.y / Math.max(width, 0.001);
    allMeshes.push({
      name: mesh.name,
      visible: mesh.visible,
      surfaceY: +surfaceY.toFixed(4),
      topWidth: +width.toFixed(4),
      flatness: +flatness.toFixed(4),
      inYRange: topY >= yMin && topY <= yMax,
    });
  });

  return { best, candidates: candidates.sort((a, b) => b.score - a.score).slice(0, 5), allMeshes: allMeshes.filter((m) => m.visible).slice(0, 20) };
}

const loader = new GLTFLoader();
const buffer = fs.readFileSync(GLB);
loader.parse(
  buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
  "",
  (gltf) => {
    const root = gltf.scene;
    const worldSize = 0.236;
    hideRoomKeepCounter(root);
    fitTableToSize(root, worldSize);
    const { best, candidates, allMeshes } = findCounterSurfaceMetrics(root, MOBILE_ANCHOR.surfaceY);
    const meshValid =
      best &&
      best.topWidth >= 0.06 &&
      best.topWidth <= 0.5 &&
      best.surfaceY >= 0.08 &&
      best.surfaceY <= 0.16;

    const rootBox = new THREE.Box3().setFromObject(root);
    const sceneSize = rootBox.getSize(new THREE.Vector3());
    const rootMinY = rootBox.min.y;
    const yMin = rootMinY + sceneSize.y * 0.04;
    const yMax = rootMinY + sceneSize.y * 0.55;

    const entry = {
      sessionId: "44e59c",
      location: "measure-table-surface.mjs",
      message: "offline glb surface scan",
      data: {
        worldSize,
        sceneSize: { x: sceneSize.x, y: sceneSize.y, z: sceneSize.z },
        yRange: { yMin, yMax },
        meshBest: best,
        meshValid,
        anchor: MOBILE_ANCHOR,
        resolved: meshValid ? best : MOBILE_ANCHOR,
        topCandidates: candidates,
        visibleMeshes: allMeshes,
      },
      timestamp: Date.now(),
      hypothesisId: "mesh-surface-offline",
      runId: "hero-products-v3-offline",
    };

    fs.mkdirSync(path.dirname(LOG), { recursive: true });
    fs.appendFileSync(LOG, JSON.stringify(entry) + "\n");
    console.log(JSON.stringify(entry.data, null, 2));
  },
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
