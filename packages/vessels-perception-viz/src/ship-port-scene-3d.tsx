/**
 * 3D variant of ShipPortScene. Walks the same procedural-kit Scene
 * produced by `buildShipPortScene(seed)` and lays it out as real
 * three.js meshes so operators can orbit the hull and port. Geometry
 * is fully deterministic — the same `seed` always produces the same
 * meshes, transforms, and prim count, matching the USD round-trip
 * fixture lock.
 *
 * No randomness is introduced here: positions, sizes, and colors are
 * a pure function of (scene tree path, partId). The mounted camera
 * pose is also deterministic; only user pointer drag rotates the view.
 */

import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {
  bomOf,
  partGraphHash,
  type Scene,
} from '@szl-holdings/procedural-kit';
import {
  buildShipPortScene,
  shipPortMeshAssetUrl,
  shipPortMeshResolver,
} from './ship-library.js';
import { fromPartGraphAdapter } from './usd-adapter.js';
import type { UsdStageDescriptor } from './usd-adapter.js';

/** Module-level cache so repeated mounts (e.g. seed changes, deck slide
 *  navigation) reuse parsed geometry instead of re-fetching the asset.
 *  Keyed by partId; the value is the geometry from the first mesh in
 *  the loaded glTF, or `null` if loading failed (so we don't retry a
 *  known-broken URL on every mount). */
const GLTF_GEOMETRY_CACHE = new Map<string, Promise<THREE.BufferGeometry | null>>();

function loadPartGeometry(partId: string): Promise<THREE.BufferGeometry | null> {
  const cached = GLTF_GEOMETRY_CACHE.get(partId);
  if (cached) return cached;
  const url = shipPortMeshAssetUrl(partId);
  if (!url) {
    const miss = Promise.resolve(null);
    GLTF_GEOMETRY_CACHE.set(partId, miss);
    return miss;
  }
  const loader = new GLTFLoader();
  const p = new Promise<THREE.BufferGeometry | null>((resolve) => {
    loader.load(
      url,
      (gltf) => {
        let geom: THREE.BufferGeometry | null = null;
        gltf.scene.traverse((obj) => {
          if (!geom && (obj as THREE.Mesh).isMesh) {
            geom = ((obj as THREE.Mesh).geometry as THREE.BufferGeometry).clone();
          }
        });
        resolve(geom);
      },
      undefined,
      (err) => {
        // Swallow the error and fall back to the in-line primitive
        // geometry — the 3D scene must keep rendering even when assets
        // can't be fetched (offline preview, CSP, etc.).
        // eslint-disable-next-line no-console
        console.warn(`[vessels-perception-viz] failed to load ${url}`, err);
        resolve(null);
      },
    );
  });
  GLTF_GEOMETRY_CACHE.set(partId, p);
  return p;
}

export interface ShipPortScene3DProps {
  readonly seed: number;
  readonly rootTag?: 'ship-root' | 'port-root';
  readonly maxDepth?: number;
  readonly fillProbability?: number;
  readonly width?: number;
  readonly height?: number;
  readonly accentColor?: string;
  readonly mutedColor?: string;
  readonly textColor?: string;
  readonly showUsdSummary?: boolean;
  readonly className?: string;
  readonly ariaLabel?: string;
}

interface LaidOutPart {
  readonly partId: string;
  readonly path: string;
  readonly depth: number;
  readonly position: readonly [number, number, number];
}

function djb2(value: string): string {
  let h = 5381;
  for (let i = 0; i < value.length; i++) h = ((h << 5) + h + value.charCodeAt(i)) | 0;
  return (h >>> 0).toString(16).padStart(8, '0');
}

/** Walk the scene tree and assign deterministic 3D coordinates per
 *  node. The first pass counts siblings per depth so we can lay them
 *  out on concentric rings; the second pass emits positions. */
function layoutScene3D(scene: Scene): LaidOutPart[] {
  const perDepth = new Map<number, number>();
  const collect = (node: Scene['root'], depth: number, path: string): void => {
    perDepth.set(depth, (perDepth.get(depth) ?? 0) + 1);
    const slotKeys = Object.keys(node.slotBindings).sort();
    for (const k of slotKeys) {
      const children = node.slotBindings[k]!;
      children.forEach((child, i) => collect(child, depth + 1, `${path}/${k}[${i}]`));
    }
  };
  collect(scene.root, 0, '');

  const totals = new Map<number, number>(perDepth);
  const cursor = new Map<number, number>();
  const out: LaidOutPart[] = [];
  const walk = (node: Scene['root'], depth: number, path: string): void => {
    const idx = cursor.get(depth) ?? 0;
    cursor.set(depth, idx + 1);
    const total = totals.get(depth) ?? 1;
    const ring = depth === 0 ? 0 : 2.2 * depth;
    const theta = total <= 1 ? 0 : (2 * Math.PI * idx) / total;
    const x = Math.cos(theta) * ring;
    const z = Math.sin(theta) * ring;
    const y = depth === 0 ? 0 : Math.sin(idx * 0.7) * 0.15;
    out.push({ partId: node.partId, path, depth, position: [x, y, z] });
    const slotKeys = Object.keys(node.slotBindings).sort();
    for (const k of slotKeys) {
      const children = node.slotBindings[k]!;
      children.forEach((child, i) => walk(child, depth + 1, `${path}/${k}[${i}]`));
    }
  };
  walk(scene.root, 0, '');
  return out;
}

/** Pure mapping from partId to geometry + color. No RNG. */
function geometryFor(partId: string): { geom: THREE.BufferGeometry; color: number; emissive: number } {
  switch (partId) {
    case 'hull-lgc':
      return { geom: new THREE.BoxGeometry(3.2, 0.7, 1.2), color: 0xc9b787, emissive: 0x221a08 };
    case 'hull-vlcc':
      return { geom: new THREE.BoxGeometry(3.8, 0.8, 1.4), color: 0xb89c66, emissive: 0x1c1404 };
    case 'bridge-house':
      return { geom: new THREE.BoxGeometry(0.7, 0.9, 0.7), color: 0xeae0c2, emissive: 0x2a2618 };
    case 'cargo-tank-c':
      return { geom: new THREE.SphereGeometry(0.55, 24, 16), color: 0x9fb8c8, emissive: 0x0a1218 };
    case 'cargo-tank-prismatic':
      return { geom: new THREE.BoxGeometry(0.9, 0.6, 0.7), color: 0x7ea3b8, emissive: 0x0a1218 };
    case 'manifold':
      return { geom: new THREE.CylinderGeometry(0.18, 0.18, 0.6, 18), color: 0xd4c598, emissive: 0x2a2210 };
    case 'port-jetty':
      return { geom: new THREE.BoxGeometry(4.0, 0.25, 0.8), color: 0x6a6a6a, emissive: 0x0a0a0a };
    case 'port-loading-arm':
      return { geom: new THREE.CylinderGeometry(0.1, 0.1, 1.4, 14), color: 0xc9b787, emissive: 0x221a08 };
    default:
      return { geom: new THREE.BoxGeometry(0.5, 0.5, 0.5), color: 0x888888, emissive: 0x111111 };
  }
}

export function ShipPortScene3D(props: ShipPortScene3DProps) {
  const {
    seed,
    rootTag = 'ship-root',
    maxDepth = 2,
    fillProbability = 0.9,
    width = 360,
    height = 280,
    accentColor = '#c9b787',
    mutedColor = '#6a6a6a',
    textColor = '#f5f5f5',
    showUsdSummary = true,
    className,
    ariaLabel,
  } = props;

  const scene = useMemo(
    () => buildShipPortScene(seed, { rootTag, maxDepth, fillProbability }),
    [seed, rootTag, maxDepth, fillProbability],
  );
  const bomEntries = useMemo(() => Object.entries(bomOf(scene)), [scene]);
  const stage: UsdStageDescriptor = useMemo(
    () => fromPartGraphAdapter(scene, shipPortMeshResolver),
    [scene],
  );
  const sceneHash = useMemo(
    () => partGraphHash(scene, (v: unknown) => djb2(String(v))),
    [scene],
  );
  const laidOut = useMemo(() => layoutScene3D(scene), [scene]);

  const mountRef = useRef<HTMLDivElement | null>(null);
  const renderedMeshes = useRef<number>(0);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(typeof window !== 'undefined' ? window.devicePixelRatio : 1);
    renderer.setSize(width, height, false);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const threeScene = new THREE.Scene();
    threeScene.background = null;

    // Deterministic camera pose — same for every render of the same seed.
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    const initialRadius = Math.max(6, 2 + laidOut.length * 0.25);
    const initialYaw = Math.PI / 4;
    const initialPitch = Math.PI / 7;
    const cameraTarget = new THREE.Vector3(0, 0, 0);
    const cameraState = { yaw: initialYaw, pitch: initialPitch, radius: initialRadius };

    const placeCamera = (): void => {
      const { yaw, pitch, radius } = cameraState;
      camera.position.set(
        Math.cos(pitch) * Math.cos(yaw) * radius,
        Math.sin(pitch) * radius,
        Math.cos(pitch) * Math.sin(yaw) * radius,
      );
      camera.lookAt(cameraTarget);
    };
    placeCamera();

    // Deterministic lighting (fixed positions, no animation).
    threeScene.add(new THREE.AmbientLight(0x4a5566, 0.7));
    const key = new THREE.DirectionalLight(0xfff2cc, 1.0);
    key.position.set(4, 6, 3);
    threeScene.add(key);
    const fill = new THREE.DirectionalLight(0x8aa6c4, 0.45);
    fill.position.set(-4, 2, -3);
    threeScene.add(fill);

    // Ground plane reference.
    const grid = new THREE.GridHelper(12, 12, 0x2a3340, 0x1a2230);
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.45;
    threeScene.add(grid);

    // Build meshes from the laid-out scene tree. Each mesh starts on
    // its in-line primitive geometry so the first frame paints with
    // something visible even if the glTF asset is still in flight; we
    // then swap in the real authored geometry once the loader resolves.
    const disposables: Array<THREE.BufferGeometry | THREE.Material> = [];
    let meshCount = 0;
    let cancelled = false;
    for (const part of laidOut) {
      const { geom: fallbackGeom, color, emissive } = geometryFor(part.partId);
      const mat = new THREE.MeshStandardMaterial({
        color,
        emissive,
        roughness: 0.55,
        metalness: 0.35,
      });
      const mesh = new THREE.Mesh(fallbackGeom, mat);
      mesh.position.set(part.position[0], part.position[1] + 0.4, part.position[2]);
      // Orient hull-like parts along the radial direction so they read
      // as ships pointing at the dock; deterministic from position.
      if (part.depth === 0 && (part.partId === 'hull-lgc' || part.partId === 'hull-vlcc')) {
        mesh.rotation.y = 0;
      } else if (part.depth > 0) {
        mesh.rotation.y = Math.atan2(part.position[2], part.position[0]);
      }
      threeScene.add(mesh);
      disposables.push(fallbackGeom, mat);
      meshCount += 1;

      // Async swap: replace the placeholder geometry with the real glTF
      // mesh when it arrives. If the load fails (cache returns null) we
      // keep the fallback in place — the prim count panel doesn't move
      // either way because we still rendered one mesh per laid-out part.
      void loadPartGeometry(part.partId).then((real) => {
        if (cancelled || !real) return;
        const prev = mesh.geometry;
        mesh.geometry = real;
        // Don't dispose the cached glTF geometry — it's shared across
        // mounts; only dispose the per-mount fallback we replaced.
        prev.dispose();
        renderer.render(threeScene, camera);
      });
    }
    renderedMeshes.current = meshCount;

    // Pointer-drag orbit. No inertia, no animation loop while idle —
    // deterministic identity transform on first frame.
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    const onDown = (e: PointerEvent): void => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      renderer.domElement.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent): void => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      cameraState.yaw += dx * 0.01;
      cameraState.pitch = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, cameraState.pitch + dy * 0.01));
      placeCamera();
      renderer.render(threeScene, camera);
    };
    const onUp = (e: PointerEvent): void => {
      dragging = false;
      try {
        renderer.domElement.releasePointerCapture(e.pointerId);
      } catch {
        /* noop */
      }
    };
    const onWheel = (e: WheelEvent): void => {
      e.preventDefault();
      cameraState.radius = Math.max(3, Math.min(30, cameraState.radius * (1 + e.deltaY * 0.001)));
      placeCamera();
      renderer.render(threeScene, camera);
    };
    renderer.domElement.addEventListener('pointerdown', onDown);
    renderer.domElement.addEventListener('pointermove', onMove);
    renderer.domElement.addEventListener('pointerup', onUp);
    renderer.domElement.addEventListener('pointercancel', onUp);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

    renderer.render(threeScene, camera);

    return () => {
      cancelled = true;
      renderer.domElement.removeEventListener('pointerdown', onDown);
      renderer.domElement.removeEventListener('pointermove', onMove);
      renderer.domElement.removeEventListener('pointerup', onUp);
      renderer.domElement.removeEventListener('pointercancel', onUp);
      renderer.domElement.removeEventListener('wheel', onWheel);
      for (const d of disposables) d.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [laidOut, width, height]);

  return (
    <div
      className={className}
      data-component="ship-port-scene-3d"
      data-seed={seed}
      data-scene-hash={sceneHash}
      data-prim-count={stage.prims.length}
      data-mesh-count={laidOut.length}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        background: 'rgba(10,20,25,0.65)',
        border: `1px solid ${accentColor}33`,
        padding: 12,
      }}
    >
      <div
        ref={mountRef}
        role="img"
        aria-label={ariaLabel ?? `Procedural ${rootTag} 3D scene, seed ${seed}`}
        style={{
          width,
          height,
          cursor: 'grab',
          borderRadius: 4,
          overflow: 'hidden',
          touchAction: 'none',
        }}
      />
      {showUsdSummary ? (
        <div
          style={{
            fontFamily: 'DM Mono, monospace',
            fontSize: 10,
            color: mutedColor,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 4,
          }}
        >
          <span>scene-hash: <span style={{ color: textColor }}>{sceneHash}</span></span>
          <span>parts: <span style={{ color: textColor }}>{bomEntries.length}</span></span>
          <span>usd-prims: <span style={{ color: textColor }}>{stage.prims.length}</span></span>
          <span>meshes: <span style={{ color: textColor }}>{laidOut.length}</span></span>
        </div>
      ) : null}
    </div>
  );
}

/** Pure-data export used by the deterministic-layout unit test so the
 *  3D layout can be locked to seed without spinning up WebGL. */
export function layoutShipPortScene3D(seed: number, options?: {
  rootTag?: 'ship-root' | 'port-root';
  maxDepth?: number;
  fillProbability?: number;
}): LaidOutPart[] {
  const scene = buildShipPortScene(seed, options);
  return layoutScene3D(scene);
}
