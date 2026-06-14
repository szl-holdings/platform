import * as THREE from 'three';

// ---- SZL Energy Loop: 8-node circulation with flowing energy particles ----
const canvas = document.getElementById('loop-canvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0.4, 9.2);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const COL = {
  teal:  new THREE.Color('#28E0D0'),
  cyan:  new THREE.Color('#3DD6FF'),
  violet:new THREE.Color('#7C5CFF'),
  deep:  new THREE.Color('#01696F'),
};

// 8 nodes of the loop arranged on an ellipse
const STAGES = ['harvest','SAMAY','KALLPA','heart','YARQA','reservoir','provenance','ayni'];
const N = STAGES.length;
const RX = 4.6, RY = 2.5;
const nodePos = [];
for (let i = 0; i < N; i++) {
  const a = (i / N) * Math.PI * 2 - Math.PI / 2;
  nodePos.push(new THREE.Vector3(Math.cos(a) * RX, Math.sin(a) * RY, Math.sin(a * 1.3) * 0.6));
}

// Curve through nodes (closed loop)
const curve = new THREE.CatmullRomCurve3(nodePos, true, 'catmullrom', 0.4);

// ---- loop ribbon (tube) ----
const tubeGeo = new THREE.TubeGeometry(curve, 220, 0.045, 12, true);
const tubeMat = new THREE.MeshBasicMaterial({ color: COL.deep, transparent: true, opacity: 0.42 });
const tube = new THREE.Mesh(tubeGeo, tubeMat);
scene.add(tube);

// faint outer glow tube
const glowGeo = new THREE.TubeGeometry(curve, 220, 0.11, 12, true);
const glowMat = new THREE.MeshBasicMaterial({ color: COL.teal, transparent: true, opacity: 0.07 });
scene.add(new THREE.Mesh(glowGeo, glowMat));

// ---- node spheres ----
const nodeMeshes = [];
nodePos.forEach((p, i) => {
  const g = new THREE.SphereGeometry(0.17, 24, 24);
  const c = i === 0 ? COL.teal : (i % 2 ? COL.cyan : COL.violet);
  const m = new THREE.MeshBasicMaterial({ color: c });
  const s = new THREE.Mesh(g, m);
  s.position.copy(p);
  scene.add(s);
  // halo
  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(0.34, 20, 20),
    new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.16 })
  );
  halo.position.copy(p);
  scene.add(halo);
  nodeMeshes.push({ s, halo, base: c });
});

// ---- flowing energy particles along the curve ----
const P = 280;
const pGeo = new THREE.BufferGeometry();
const pPos = new Float32Array(P * 3);
const pCol = new Float32Array(P * 3);
const pOffset = new Float32Array(P);
const pSpeed = new Float32Array(P);
for (let i = 0; i < P; i++) {
  pOffset[i] = Math.random();
  pSpeed[i] = 0.018 + Math.random() * 0.02;
  const c = [COL.teal, COL.cyan, COL.violet][i % 3];
  pCol[i*3] = c.r; pCol[i*3+1] = c.g; pCol[i*3+2] = c.b;
}
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
const pMat = new THREE.PointsMaterial({
  size: 0.085, vertexColors: true, transparent: true, opacity: 0.92,
  blending: THREE.AdditiveBlending, depthWrite: false,
});
const points = new THREE.Points(pGeo, pMat);
scene.add(points);

// ---- ambient starfield ----
const starGeo = new THREE.BufferGeometry();
const SC = 380;
const sPos = new Float32Array(SC * 3);
for (let i = 0; i < SC; i++) {
  sPos[i*3]   = (Math.random() - 0.5) * 40;
  sPos[i*3+1] = (Math.random() - 0.5) * 24;
  sPos[i*3+2] = -6 - Math.random() * 18;
}
starGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
  size: 0.05, color: 0x6E8C8B, transparent: true, opacity: 0.5, depthWrite: false,
}));
scene.add(stars);

// ---- speed factor controlled by harvest posture (should_soak) ----
let flowFactor = 1.0;
window.__setLoopFlow = (soak) => { flowFactor = soak ? 1.6 : 0.7; };

// ---- stage highlight sync with legend ----
const legendItems = Array.from(document.querySelectorAll('.stages li'));
let activeStage = -1;

const tmp = new THREE.Vector3();
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  // move particles along curve
  for (let i = 0; i < P; i++) {
    pOffset[i] = (pOffset[i] + pSpeed[i] * flowFactor * 0.016) % 1;
    curve.getPointAt(pOffset[i], tmp);
    pPos[i*3] = tmp.x; pPos[i*3+1] = tmp.y; pPos[i*3+2] = tmp.z;
  }
  pGeo.attributes.position.needsUpdate = true;

  // pulse nodes
  nodeMeshes.forEach((nm, i) => {
    const ph = Math.sin(t * 1.5 + i * 0.8) * 0.5 + 0.5;
    const sc = 1 + ph * 0.22;
    nm.halo.scale.setScalar(sc);
    nm.halo.material.opacity = 0.10 + ph * 0.14;
  });

  // which stage is "lit" — travels around loop
  const stage = Math.floor((t * 0.55 * flowFactor) % N);
  if (stage !== activeStage) {
    activeStage = stage;
    legendItems.forEach((li, i) => li.classList.toggle('active', i === stage));
  }

  // gentle camera drift
  camera.position.x = Math.sin(t * 0.12) * 0.6;
  camera.position.y = 0.4 + Math.cos(t * 0.1) * 0.3;
  camera.lookAt(0, 0, 0);

  // slow loop rotation
  tube.rotation.z = Math.sin(t * 0.05) * 0.04;

  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
