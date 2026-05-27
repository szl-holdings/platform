#!/usr/bin/env node
/**
 * Generates one glTF 2.0 file per shipPortMeshResolver partId. Output
 * is committed to src/assets/meshes/<partId>.gltf so the runtime can
 * load real mesh assets (not in-line primitive geometry) and Vite
 * picks them up as hashed static assets via `new URL(..., import.meta.url)`.
 *
 * Re-run this script if a partId is added or a geometry needs to change.
 * The output is fully deterministic — same partId always serializes to
 * the same bytes — so re-running on a clean tree yields no diff.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as THREE from 'three';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'assets', 'meshes');
mkdirSync(OUT_DIR, { recursive: true });

/** Build a shape that's a step up from the in-line primitive for each
 *  partId. Same overall silhouette as the fallback, but real authored
 *  geometry: hulls get a tapered bow, tanks get extra subdivisions,
 *  the bridge gets a stacked deckhouse, jetty/arm get pilings/joints. */
function geometryFor(partId) {
  switch (partId) {
    case 'hull-lgc': return buildHull(3.2, 0.7, 1.2, 0.35);
    case 'hull-vlcc': return buildHull(3.8, 0.8, 1.4, 0.30);
    case 'bridge-house': return buildBridgeHouse();
    case 'cargo-tank-c': return new THREE.SphereGeometry(0.55, 32, 24);
    case 'cargo-tank-prismatic': return buildPrismaticTank();
    case 'manifold': return buildManifold();
    case 'port-jetty': return buildJetty();
    case 'port-loading-arm': return buildLoadingArm();
    default: return new THREE.BoxGeometry(0.5, 0.5, 0.5);
  }
}

/** Hull silhouette: box, but bow is tapered into a wedge. Authored as
 *  an extruded shape so the rendered geometry is recognizably a ship
 *  (pointed prow) and not a generic block. */
function buildHull(length, height, beam, bowFraction) {
  const halfL = length / 2;
  const halfB = beam / 2;
  const bow = halfL;
  const bowStart = halfL - length * bowFraction;
  const shape = new THREE.Shape();
  shape.moveTo(-halfL, -halfB);
  shape.lineTo(bowStart, -halfB);
  shape.lineTo(bow, 0);
  shape.lineTo(bowStart, halfB);
  shape.lineTo(-halfL, halfB);
  shape.closePath();
  const geom = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false, steps: 1 });
  // ExtrudeGeometry extrudes along +Z; we want the hull lying flat
  // (length on X, beam on Z, height on Y), so rotate -90° about X.
  geom.rotateX(-Math.PI / 2);
  geom.translate(0, 0, 0);
  return geom;
}

function buildBridgeHouse() {
  // Two stacked boxes: a wide lower deckhouse and a narrower wheelhouse.
  const lower = new THREE.BoxGeometry(0.7, 0.55, 0.7);
  const upper = new THREE.BoxGeometry(0.45, 0.35, 0.5);
  upper.translate(0, 0.45, 0);
  return mergeGeometries([lower, upper]);
}

function buildPrismaticTank() {
  // Octagonal prism approximating a Moss-style prismatic LNG tank.
  return new THREE.CylinderGeometry(0.45, 0.45, 0.6, 8);
}

function buildManifold() {
  // Vertical pipe with two horizontal cross-headers.
  const trunk = new THREE.CylinderGeometry(0.12, 0.12, 0.6, 18);
  const headerA = new THREE.CylinderGeometry(0.08, 0.08, 0.5, 12);
  headerA.rotateZ(Math.PI / 2);
  headerA.translate(0, 0.18, 0);
  const headerB = new THREE.CylinderGeometry(0.08, 0.08, 0.5, 12);
  headerB.rotateZ(Math.PI / 2);
  headerB.translate(0, -0.18, 0);
  return mergeGeometries([trunk, headerA, headerB]);
}

function buildJetty() {
  // Deck plate + four pilings dropping below.
  const deck = new THREE.BoxGeometry(4.0, 0.25, 0.8);
  const pilings = [];
  for (const x of [-1.7, -0.55, 0.55, 1.7]) {
    for (const z of [-0.3, 0.3]) {
      const p = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 10);
      p.translate(x, -0.42, z);
      pilings.push(p);
    }
  }
  return mergeGeometries([deck, ...pilings]);
}

function buildLoadingArm() {
  // Two pipe segments hinged at the middle.
  const lower = new THREE.CylinderGeometry(0.1, 0.1, 0.8, 14);
  lower.translate(0, -0.3, 0);
  const upper = new THREE.CylinderGeometry(0.09, 0.09, 0.7, 14);
  upper.rotateZ(Math.PI / 3);
  upper.translate(0.3, 0.25, 0);
  const joint = new THREE.SphereGeometry(0.12, 14, 10);
  joint.translate(0, 0.1, 0);
  return mergeGeometries([lower, joint, upper]);
}

/** Tiny in-script merge that concatenates POSITION+NORMAL+INDEX from
 *  many BufferGeometry into one. Avoids pulling in BufferGeometryUtils
 *  (which only ships in three/examples). */
function mergeGeometries(list) {
  const positions = [];
  const normals = [];
  const indices = [];
  let indexOffset = 0;
  for (const g of list) {
    g.computeVertexNormals();
    const pos = g.getAttribute('position');
    const nrm = g.getAttribute('normal');
    const idx = g.getIndex();
    for (let i = 0; i < pos.count; i++) {
      positions.push(pos.getX(i), pos.getY(i), pos.getZ(i));
      normals.push(nrm.getX(i), nrm.getY(i), nrm.getZ(i));
    }
    if (idx) {
      for (let i = 0; i < idx.count; i++) indices.push(idx.getX(i) + indexOffset);
    } else {
      for (let i = 0; i < pos.count; i++) indices.push(i + indexOffset);
    }
    indexOffset += pos.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  out.setIndex(indices);
  return out;
}

/** Serialize a BufferGeometry to a minimal, spec-compliant glTF 2.0
 *  JSON document with the buffer embedded as a base64 data URI. We
 *  emit one POSITION accessor, one NORMAL accessor, one INDICES
 *  accessor (uint32), and a single mesh primitive (triangles). */
function toGltf(geometry, name) {
  geometry.computeVertexNormals();
  if (!geometry.getIndex()) {
    const count = geometry.getAttribute('position').count;
    const idx = new Uint32Array(count);
    for (let i = 0; i < count; i++) idx[i] = i;
    geometry.setIndex(new THREE.Uint32BufferAttribute(idx, 1));
  }
  const posAttr = geometry.getAttribute('position');
  const nrmAttr = geometry.getAttribute('normal');
  const idxAttr = geometry.getIndex();

  const posArr = new Float32Array(posAttr.count * 3);
  for (let i = 0; i < posAttr.count; i++) {
    posArr[i * 3 + 0] = posAttr.getX(i);
    posArr[i * 3 + 1] = posAttr.getY(i);
    posArr[i * 3 + 2] = posAttr.getZ(i);
  }
  const nrmArr = new Float32Array(nrmAttr.count * 3);
  for (let i = 0; i < nrmAttr.count; i++) {
    nrmArr[i * 3 + 0] = nrmAttr.getX(i);
    nrmArr[i * 3 + 1] = nrmAttr.getY(i);
    nrmArr[i * 3 + 2] = nrmAttr.getZ(i);
  }
  const idxArr = new Uint32Array(idxAttr.count);
  for (let i = 0; i < idxAttr.count; i++) idxArr[i] = idxAttr.getX(i);

  // bufferView byteOffsets must satisfy each accessor's alignment
  // (4 bytes for float/uint32). All three arrays are already 4-aligned.
  const posBytes = posArr.byteLength;
  const nrmBytes = nrmArr.byteLength;
  const idxBytes = idxArr.byteLength;
  const total = posBytes + nrmBytes + idxBytes;
  const merged = new Uint8Array(total);
  merged.set(new Uint8Array(posArr.buffer), 0);
  merged.set(new Uint8Array(nrmArr.buffer), posBytes);
  merged.set(new Uint8Array(idxArr.buffer), posBytes + nrmBytes);

  // Per-attribute min/max are required for POSITION.
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i), y = posAttr.getY(i), z = posAttr.getZ(i);
    if (x < minX) minX = x; if (y < minY) minY = y; if (z < minZ) minZ = z;
    if (x > maxX) maxX = x; if (y > maxY) maxY = y; if (z > maxZ) maxZ = z;
  }

  const gltf = {
    asset: { version: '2.0', generator: 'vessels-perception-viz/build-meshes.mjs' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, name }],
    meshes: [{
      name,
      primitives: [{
        attributes: { POSITION: 0, NORMAL: 1 },
        indices: 2,
        mode: 4,
      }],
    }],
    buffers: [{
      uri: 'data:application/octet-stream;base64,' + Buffer.from(merged).toString('base64'),
      byteLength: total,
    }],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: posBytes, target: 34962 },
      { buffer: 0, byteOffset: posBytes, byteLength: nrmBytes, target: 34962 },
      { buffer: 0, byteOffset: posBytes + nrmBytes, byteLength: idxBytes, target: 34963 },
    ],
    accessors: [
      { bufferView: 0, componentType: 5126, count: posAttr.count, type: 'VEC3', min: [minX, minY, minZ], max: [maxX, maxY, maxZ] },
      { bufferView: 1, componentType: 5126, count: nrmAttr.count, type: 'VEC3' },
      { bufferView: 2, componentType: 5125, count: idxAttr.count, type: 'SCALAR' },
    ],
  };
  return JSON.stringify(gltf, null, 2) + '\n';
}

const PART_IDS = [
  'hull-lgc',
  'hull-vlcc',
  'bridge-house',
  'cargo-tank-c',
  'cargo-tank-prismatic',
  'manifold',
  'port-jetty',
  'port-loading-arm',
];

for (const partId of PART_IDS) {
  const geom = geometryFor(partId);
  const gltf = toGltf(geom, partId);
  const outPath = join(OUT_DIR, `${partId}.gltf`);
  writeFileSync(outPath, gltf);
  console.log(`wrote ${outPath} (${gltf.length} bytes)`);
}
