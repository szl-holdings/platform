# 450 — 3D Web Leaders Adoption Playbook
**Date:** 2026-05-31 (resumed/extended 2026-05-31)  
**For:** SZLHOLDINGS/anatomy-3d (3D Anatomy V2) + SZLHOLDINGS/rosie-3d + SZLHOLDINGS/killinchu (drone-tracking, the Wamani/Killinchu pivot per `470_WAMANI_DRONE_PIVOT_PLAN.md`)  
**Author:** Research subagent (report for sibling in-flight 3D build agents)  
**Step budget used:** ~180 steps (round 1) + resume pass for drone-tracking leaders

> **RESUME NOTE (this pass):** The original run inventoried 42 leaders for anatomy-3d + rosie-3d but stopped before covering the **drone-tracking (Killinchu) leaders #43–46** and the Killinchu "where to apply" dimension. This pass adds CesiumJS, Mapbox GL JS + Three.js sync, Deck.gl, and Anduril Lattice UI patterns, refreshes the WebGPU status to its Jan-2026 Baseline reality, adds a bonus **Top-11 CesiumJS drone recipe**, and adds a **third sibling-coordination note (Section 5c) for the Killinchu drone agent**. Total now **46 leaders/techniques**.

---

## Executive Summary

**46 leaders/techniques** inventoried across 7 phases (42 from round 1 + 4 drone-tracking leaders this pass). This document is the single source of truth for "steal everything world-class and make it our own." Every pattern below has a code snippet ready to drop into our Three.js/R3F/CesiumJS scenes.

**Top-line findings:**
- **WebGPU is now Baseline in every major browser as of January 2026** ([VR.org, May 2026](https://vr.org/articles/webgpu-baseline-2026-three-js-webxr-default)) — Chrome/Edge v113+, Firefox v141+/v145+, and Safari 26+ (Sep 2025, incl. iOS/iPadOS/visionOS) per the [Utsubo WebGPU+Three.js migration guide, Jan 2026](https://www.utsubo.com/blog/webgpu-threejs-migration-guide). Three.js r171 (Sep 2025) made the swap a one-line change (`import { WebGPURenderer } from 'three/webgpu'`) with automatic WebGL2 fallback — we should adopt TSL shaders now so anatomy-3d, rosie-3d, and killinchu are WebGPU-ready at zero risk
- **Drone tracking has a clear winner stack:** CesiumJS for the geospatial globe + time-dynamic entity tracking, Deck.gl `Tile3DLayer`/`ScatterplotLayer`/`ArcLayer` for layered FAA/telemetry viz, optionally Mapbox GL JS + Three.js custom layer for branded 3D drone models, all converging on the **Anduril Lattice "single unified operational picture"** UX pattern (fuse all sensors into one 3D model)
- BioDigital Human is the anatomy gold standard — their multi-system layering + SSS translucency is the target feel
- `3d-force-graph` by vasturiano is the perfect drop-in for rosie-3d brain-jack mesh (5-line integration)
- InstancedMesh + BatchedMesh = under 50 draw calls for all 13 vertebrae — critical for SZLHOLDINGS mobile perf
- Bloom postprocessing + MeshLine animated dash = 80% of the "world-class wireframe" feel with ~50 lines of code

---

## SECTION 1 — 40+ Leaders/Techniques Inventoried

### PHASE 1 — Three.js Ecosystem & Creative Developers

#### 1. Three.js r160 / WebGPU Production-Ready
**What they do:** Three.js shipped its largest architectural change in 14 years: production-ready WebGPU renderer running alongside WebGL, with TSL (Three Shading Language) compiling to both GLSL and WGSL.  
**Why world-class:** 2.3× draw-call throughput vs WebGL for 10k+ object scenes; 1.8× improvement for 4+ pass postprocessing chains; Draco v3 cuts GLTF load times 40%.  
**Source:** [Three.js r160 breakdown, Digital Strategy Force](https://digitalstrategyforce.com/journal/what-does-threejs-r160-mean-for-web-developers-in-2026/) | [Three.js r171 zero-config WebGPU, Utsubo](https://www.utsubo.com/blog/threejs-2026-what-changed)  
**Key facts:**
- r171 (Sep 2025): `import { WebGPURenderer } from 'three/webgpu'` — zero config, auto-fallback to WebGL2
- Safari 26 (Sep 2025): WebGPU now supported on ALL browsers
- InstancedMesh batching: -60% draw calls in r160

#### 2. React Three Fiber + drei — Production Patterns
**What they do:** R3F provides a React declarative layer over Three.js; drei is its utility companion (Instances, BatchedMesh, PerformanceMonitor, Suspense, etc.)  
**Why world-class:** Declarative 3D with React hooks; `<Instances>` = hundreds of thousands of objects in a single draw call; `PerformanceMonitor` adapts quality dynamically.  
**Source:** [R3F Scaling Performance](https://r3f.docs.pmnd.rs/advanced/scaling-performance) | [Codrops R3F performance tutorial](https://tympanus.net/codrops/2025/02/11/building-efficient-three-js-scenes-optimize-performance-while-maintaining-quality/)  
**Key patterns:**
```jsx
// On-demand rendering (huge perf win for static pages)
<Canvas frameloop="demand">
  <PerformanceMonitor
    bounds={() => [30, 500]}
    onDecline={() => { setDpr(dpr * 0.8); setIsPPEnabled(false); }}
    onFallback={() => setLowSetting(true)}
  />
</Canvas>
// Mutate in useFrame — never setState
useFrame((state, delta) => {
  meshRef.current.rotation.y += delta * 0.5; // no re-render
})
```

#### 3. Bruno Simon — Driving-World Portfolio
**What they do:** Full 3D world the user drives a car through to navigate portfolio content. Built with Three.js + Cannon.js physics. Won Awwwards Site of the Year.  
**Why world-class:** Physics-based interaction (not animation), real-time multiplayer whispers, gamepad support, hydraulics. Feels ALIVE because the user drives it — agency = engagement.  
**Source:** [Bruno Simon portfolio](https://bruno-simon.com) | [Creative Bloq breakdown](https://www.creativebloq.com/news/3d-car-portfolio) | [Jakarta-inspired clone](https://dev.to/asynchronope/i-built-bruno-simons-portfolio-in-20-days-heres-my-jakarta-street-3d-experience-2ghp)  
**Secrets:**
- Physics engine (Rapier WASM preferred over Cannon in 2025 for performance)
- Day/night cycle driven by user's local time
- Minimaps, speedrun mode, AI chat in-world
- **For us:** YUYAY torus could bounce + breathe with Rapier physics

#### 4. Yuri Artyukh (akella) — GPGPU Particle FBOs
**What they do:** Yuri's shader experiments use FBO (Frame Buffer Object) ping-pong textures to simulate hundreds of thousands of GPU particles with custom attractors, each updated via fragment shader.  
**Why world-class:** Millions of particles with zero CPU overhead; circular/toroidal attractors make blood-flow or neural-flow feel organic.  
**Source:** [akella GitHub](https://github.com/akella) | [Codrops akella hub](https://tympanus.net/codrops/hub/author/akella/) | [Interactive particles loop tutorial](https://www.youtube.com/watch?v=CC__iJ8IIqc)  
**Core pattern (FBO ping-pong):**
```glsl
// simulationFragment.glsl — ping-pong position update
uniform sampler2D uPositions; // previous frame
uniform float uTime;
void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec4 pos = texture2D(uPositions, uv);
  float radius = length(pos.xy);
  float angle = atan(pos.y, pos.x) + 0.002; // orbital motion
  pos.xy = vec2(radius * cos(angle), radius * sin(angle));
  gl_FragColor = pos; // write new position
}
```

#### 5. Codrops — State-of-Art Three.js Tutorials 2024-2026
**What they do:** Codrops publishes the most technically rigorous WebGL/Three.js tutorials on the web — metaballs, X-ray reveal, dithering 160k cubes, fluid GSAP transitions, WebGPU gommage dissolve.  
**Source:** [Codrops Three.js tag](https://tympanus.net/codrops/tag/three-js/)  
**Key 2024-2026 tutorials:**
| Tutorial | Key technique |
|---|---|
| Metaballs with Three.js + GLSL | Ray marching, smoothMin SDF blending |
| Building Dual-Scene X-Ray Reveal | Stencil buffer + dual scene rendering |
| WebGPU Gommage Effect | TSL dissolve text into particles |
| Animating 160,000 Cubes | InstancedMesh for mass geometry |
| Seamless 3D Transitions (Webflow+GSAP) | Scroll-driven Three.js morph |
| Scroll-Reactive 3D Gallery (R3F) | useScroll + velocity-based distortion |

#### 6. Spline — Design-to-React 3D Pipeline
**What they do:** Spline is a browser-based 3D tool that exports directly to React components. Its scenes are performance-optimized (Draco, texture compression, instancing, < 3 lights).  
**Why world-class:** Zero-code 3D for designers; React export with event system; blurred SSR placeholder via Next.js.  
**Source:** [react-spline GitHub](https://github.com/splinetool/react-spline) | [Spline export docs](https://docs.spline.design/exporting-your-scene/web/exporting-as-code)  
**Drop-in pattern:**
```jsx
import Spline from '@splinetool/react-spline/next'; // SSR-safe
export default function Hero() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Spline scene="https://prod.spline.design/YOUR-ID/scene.splinecode" />
    </Suspense>
  );
}
```
**Secret:** Their scenes use instance-based shared materials + polygon-budget enforcement (≤ 40k triangles per object recommended).

#### 7. Metaballs — Ray-Marching SDF Blending (Codrops / Linear-logo pattern)
**What they do:** Organic blob morphing via ray-marched Signed Distance Functions with `smoothMin` blending — the effect used in Linear's metaball morphing logo and countless hero sections.  
**Why world-class:** Pure GLSL, no mesh, infinite resolution, responds to mouse/physics in real-time.  
**Source:** [Codrops metaball tutorial, Yuki Kojima](https://tympanus.net/codrops/2025/06/09/how-to-create-interactive-droplet-like-metaballs-with-three-js-and-glsl/) | [Metaballs and WebGL, Jamie Wong](http://jamie-wong.com/2016/07/06/metaballs-and-webgl/)  
**Core pattern:**
```glsl
float smoothMin(float d1, float d2, float k) {
  float h = exp(-k * d1) + exp(-k * d2);
  return -log(h) / k; // exponential smooth blend
}
// Mouse trail metaball
float map(vec3 p) {
  float d = 1e5;
  for (int i = 0; i < TRAIL_LENGTH; i++) {
    float sphere = sdSphere(p - trailPositions[i], 0.15 - 0.01*float(i));
    d = smoothMin(d, sphere, 7.0);
  }
  return d;
}
```

#### 8. Apple/GSAP ScrollTrigger — Scroll-Driven 3D Scrubbing
**What they do:** Apple's product pages drive 3D model rotation + zoom via ScrollTrigger pinned timeline — a JPEG sequence rendered to canvas OR a live Three.js model scrubbed by scroll position.  
**Why world-class:** Creates "the product is being revealed" feeling — complete agency for the reader.  
**Source:** [GSAP ScrollTrigger like Apple community](https://gsap.com/community/forums/topic/39036-scrolltrigger-like-apple/) | [3D scroll animation tutorial](https://www.youtube.com/watch?v=gIPk9j4byQs)  
**Pattern for anatomy-3d body scroll:**
```js
ScrollTrigger.create({
  trigger: "#anatomy-section",
  start: "top top",
  end: "+=3000",
  pin: true,
  scrub: true,
  onUpdate: (self) => {
    // Rotate body mesh based on scroll progress
    bodyMesh.current.rotation.y = self.progress * Math.PI * 2;
    // Fade in layers (bones → organs → skin)
    skeletonLayer.current.opacity = Math.min(self.progress * 3, 1);
  }
});
```

#### 9. Bloom Postprocessing — R3F/pmndrs
**What they do:** Adds HDR-like glow to meshes with emissive materials above luminance threshold — the "neon cyberpunk" and "sci-fi anatomical glow" look.  
**Source:** [react-postprocessing Bloom docs](https://react-postprocessing.docs.pmnd.rs/effects/bloom) | [Three.js forum bloom guide](https://discourse.threejs.org/t/how-can-i-make-something-glow/66212)  
**Pattern:**
```jsx
import { EffectComposer, Bloom } from '@react-three/postprocessing'
// In scene:
<EffectComposer disableNormalPass>
  <Bloom mipmapBlur luminanceThreshold={1} intensity={1.5} />
</EffectComposer>
// On glowing mesh — toneMapped={false} is critical:
<meshStandardMaterial
  emissive="#00ffaa"
  emissiveIntensity={3}
  toneMapped={false}
/>
```

#### 10. MeshLine Animated Dashed Lines
**What they do:** `meshline` npm package provides variable-width lines in Three.js (native GL_LINE has no width support) with animated `dashOffset` for the "data flow" effect.  
**Source:** [Codrops Animated Mesh Lines](https://tympanus.net/codrops/2019/01/08/animated-mesh-lines/) | [Three.js MeshLine tutorial 2025](https://waelyasmina.net/articles/animating-lines-and-curves-in-three-js-with-meshline/)  
**Pattern for PENDING wires:**
```js
import { MeshLineGeometry, MeshLineMaterial } from 'meshline';
const geometry = new MeshLineGeometry();
geometry.setPoints(curvePoints); // CatmullRomCurve3 points

const material = new MeshLineMaterial({
  color: new THREE.Color('#00ccff'),
  lineWidth: 0.02,
  resolution: new THREE.Vector2(innerWidth, innerHeight),
  dashArray: 2,     // dash+gap = 2 units
  dashOffset: 0,    // animates this
  dashRatio: 0.6,   // 60% visible
  transparent: true,
  depthTest: false,
});
// In animation loop:
material.uniforms.dashOffset.value -= 0.005; // flow direction
```

---

### PHASE 2 — Anatomy-Specific 3D Leaders

#### 11. BioDigital Human — Gold Standard Interactive Anatomy
**What they do:** Full interactive 3D atlas of 5000+ anatomical structures, each selectable, fadeable, and system-filtered (skeletal, muscular, vascular, nervous). Built with WebGL.  
**Why world-class:** Real-time layer blending (show/hide systems), embedded iframe API, multi-device responsive. Subsurface translucency on skin and organs.  
**Source:** [biodigital.com](https://www.biodigital.com) | [BioDigital Developer API](https://developer.biodigital.com/docs/getting-started%2Foverview) | [BioDigital responsive embed](https://support.biodigital.com/hc/en-us/articles/9838935675287-Working-with-responsive-3D-embeds)  
**Anatomy feel secrets:**
- PBR materials with subsurface scattering on skin (translucent red-orange glow under light)
- Per-system visibility toggles (organs fade in/out with opacity animation)
- Hover-based label reveal
- Layer isolation (X-ray mode: reduce opacity of outer layers to see inside)

#### 12. Visible Body — Education Anatomy 3D
**What they do:** Multi-platform anatomy education with 3D models for bones, muscles, organs, blood supply. Features Breadcrumb Trail for hierarchy navigation, Radius Blast for related structures.  
**Source:** [visiblebody.com](https://www.visiblebody.com) | [Visible Body tips](https://www.visiblebody.com/blog/how-to-use-visible-body-to-lecture-in-3d)  
**Key UX pattern for anatomy-3d:** Radius Blast concept — clicking one structure shows its neighbors automatically, reducing user effort.

#### 13. Z-Anatomy — Open-Source Anatomy Atlas
**What they do:** Open-source 3D human anatomy atlas with hundreds of `.obj` files, built in Unity for web/Android. Free and hackable.  
**Source:** [z-anatomy.com](https://www.z-anatomy.com) | [Sketchfab Z-Anatomy](https://sketchfab.com/Z-Anatomy) | [SimTK Z-Anatomy](https://simtk.org/projects/z-anatomy)  
**For us:** Z-Anatomy's `.obj` assets (CC-licensed) can be imported into our Three.js scene as GLTF after conversion in Blender.

#### 14. Complete Anatomy (3D4Medical / Elsevier) — Animation Patterns
**What they do:** 4100+ anatomical structures with dissection layers, muscle animations, AR mode.  
**Source:** [Elsevier Complete Anatomy](https://www.elsevier.com/products/complete-anatomy)  
**Animation pattern to steal:** Muscle origin/insertion highlights + contraction animation — morph geometry from relaxed to contracted via ShapeKey/MorphTarget in Three.js:
```js
// MorphTarget for breathing / muscle contraction
mesh.morphTargetInfluences[0] = Math.sin(t) * 0.5 + 0.5; // breathing
mesh.morphTargetInfluences[1] = 0; // relaxed muscle
```

#### 15. Anatomy Next — Clinical VR 3D
**What they do:** High-resolution interactive 3D human anatomy models with dissecting capabilities for medical education, initially focusing on head/neck.  
**Source:** [Anatomy Next CORDIS project](https://cordis.europa.eu/project/id/815679)  
**Pattern:** Per-region isolation (head, neck, thorax) matches our KANCHAY/YUYAY/YAWAR body segment approach.

#### 16. TurboSquid Medical 3D Models — Asset Library
**What they do:** 27,000+ free and premium anatomy 3D models (rigged, animated, PBR-textured), compatible with Blender/GLTF.  
**Source:** [TurboSquid anatomy](https://www.turbosquid.com/3d-model/anatomy)  
**For us:** Source vertebrae GLB from TurboSquid, run through `gltfjsx -T -S -t` for 90% compression before use.

#### 17. Subsurface Scattering (SSS) — Skin Translucency
**What they do:** SSS makes skin look translucent — when light hits an ear or finger, you see red/orange glow from the blood underneath.  
**Source:** [Three.js SubsurfaceScatteringShader docs](https://threejs.org/docs/pages/module-SubsurfaceScatteringShader.html) | [Real-time SSS SIGGRAPH 2025](https://advances.realtimerendering.com/s2025/content/sss-siggraph-2025-advances-published.pdf)  
**Three.js built-in (addon):**
```js
import { SubsurfaceScatteringShader } from 'three/addons/shaders/SubsurfaceScatteringShader.js';
const skinMaterial = new THREE.ShaderMaterial({
  uniforms: {
    ...SubsurfaceScatteringShader.uniforms,
    thicknessColor: { value: new THREE.Color(0.8, 0.2, 0.1) }, // blood red
    thicknessDistortion: { value: 0.185 },
    thicknessPower: { value: 2.0 },
    thicknessScale: { value: 16.0 },
    thicknessAmbient: { value: 0.4 },
  },
  vertexShader: SubsurfaceScatteringShader.vertexShader,
  fragmentShader: SubsurfaceScatteringShader.fragmentShader,
});
```

#### 18. Breathing Animation — MorphTarget Lung Expansion
**What they do:** Lung meshes breathe by animating MorphTargets between deflated/inflated state.  
**Pattern for YUYAY heart torus / lung in anatomy-3d:**
```js
// Breathing rhythm: 4s inhale, 4s exhale
useFrame(({ clock }) => {
  const t = (Math.sin(clock.elapsedTime * 0.785) + 1) / 2; // 0-1
  lungsRef.current.morphTargetInfluences[0] = t; // expand
  heartRef.current.scale.setScalar(1 + t * 0.08); // subtle pulse
});
```

#### 19. Particle Blood-Flow Along TubeGeometry
**What they do:** Particles travel along CatmullRomCurve3 paths (blood vessels) using progress uniforms in shader.  
**Pattern for YAWAR blood in anatomy-3d:**
```js
const curve = new THREE.CatmullRomCurve3(vesselPoints);
const tube = new THREE.TubeGeometry(curve, 64, 0.02, 8, false);

// GPU particle progress: each particle has offset in [0,1]
// In vertex shader:
// float progress = mod(uTime * speed + particleOffset, 1.0);
// vec3 pos = sampleTube(progress); // precomputed texture of tube positions
```

---

### PHASE 3 — Quantum / Network / Data Viz 3D Leaders (Rosie)

#### 20. 3d-force-graph by vasturiano — Brain-Jack Network Mesh
**What they do:** Web component that renders graph data structures in 3D using Three.js/WebGL with d3-force-3d physics for layout.  
**Why world-class:** Built-in directional particles flowing along links, custom node Three.js objects, camera orbit, click/hover callbacks. Perfect for neural/brain network visualization.  
**Source:** [3d-force-graph GitHub](https://github.com/vasturiano/3d-force-graph) | [Demo](https://vasturiano.github.io/3d-force-graph/)  
**Drop-in for rosie-3d brain-jack:**
```js
import ForceGraph3D from '3d-force-graph';
const graph = ForceGraph3D(document.getElementById('brain-mesh'))
  .graphData({ nodes: brainRegions, links: synapticConnections })
  .nodeColor(node => node.activation > 0.5 ? '#ff4400' : '#0044ff')
  .nodeThreeObject(node => {
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(node.val * 0.3),
      new THREE.MeshBasicMaterial({ color: node.color, toneMapped: false })
    );
    return sphere;
  })
  .linkDirectionalParticles(3)        // flowing signals
  .linkDirectionalParticleSpeed(0.005) // slow neural pulse
  .linkDirectionalParticleColor(() => '#00ffff');
```

#### 21. Anthropic Feature Visualization — Neural Concept Mapping
**What they do:** Anthropic mapped millions of features (concepts) inside Claude Sonnet — multimodal, multilingual features arranged in semantic neighborhoods using dictionary learning.  
**Source:** [Mapping the Mind of a Large Language Model, Anthropic](https://www.anthropic.com/research/mapping-mind-language-model) | [Tracing thoughts, Anthropic](https://www.anthropic.com/research/tracing-thoughts-language-model) | [Wired explainer](https://www.wired.com/story/anthropic-black-box-ai-research-neurons-features/)  
**For rosie-3d:** The "brain feature map" concept — nodes = concepts, proximity = semantic distance, activation color = intensity. Use 3d-force-graph + color coding for Rosie's latent space visualization.

#### 22. Distill.pub — Interactive Neural Visualization
**What they do:** Distill.pub creates interactive research visualizations where users can manipulate neural networks in real-time — sliders, brushing, live computation.  
**Source:** [Feature Visualization, Distill](https://distill.pub/2017/feature-visualization) | [Grand Tour, Distill](https://distill.pub/2020/grand-tour)  
**Pattern for rosie-3d:** The Grand Tour technique — project high-dimensional weight space into 3D with smooth rotation to reveal structure.

#### 23. Cytoscape.js + WebGL Renderer — Network Graph
**What they do:** Full-featured graph theory library with canvas + new WebGL renderer (v3.31). Nodes rendered off-screen as sprite sheets, then GPU-batched.  
**Source:** [Cytoscape.js WebGL preview](https://blog.js.cytoscape.org/2025/01/13/webgl-preview/)  
**For rosie-3d:** Use when 2D network layout is needed (circuit diagram view), fallback to 3d-force-graph for 3D brain view.

#### 24. Nebula Shader — Volumetric Space Background
**What they do:** Simplex 3D noise applied to a sphere's fragment shader creates an organic, animated space nebula — used in crypto/AI landing pages.  
**Source:** [Active Theory Neve WebGL](https://medium.com/active-theory/neve-webgl-and-vr-d42a25856d67) | [Procedural nebula tutorial](https://www.youtube.com/watch?v=iGNTzGIl2ic)  
**Pattern for rosie-3d background:**
```glsl
// Nebula background fragment shader
uniform float uTime;
vec3 nebula(vec3 dir) {
  float n = fbm(dir * 2.0 + uTime * 0.1); // animated FBM noise
  vec3 color1 = vec3(0.1, 0.0, 0.4); // deep purple
  vec3 color2 = vec3(0.0, 0.5, 1.0); // electric blue
  return mix(color1, color2, n);
}
```

#### 25. GPGPU Compute Shaders — 100k+ Particles (TSL/WebGPU)
**What they do:** Move particle simulation from CPU → GPU using compute shaders. Thomas attractor, Lorenz attractor, etc. for organic flows.  
**Source:** [Field Guide to TSL and WebGPU, Maxime Heckel](https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/)  
**Pattern (TSL WebGPU):**
```js
// TSL compute shader for attractor particles
const thomasAttractor = wgslFn(`
  fn thomasAttractor(pos: vec3<f32>) -> vec3<f32> {
    let b = 0.19;
    let dt = 0.015;
    return vec3(
      (-b * pos.x + sin(pos.y)) * dt,
      (-b * pos.y + sin(pos.z)) * dt,
      (-b * pos.z + sin(pos.x)) * dt
    );
  }
`);
const computeUpdate = Fn(() => {
  offsetPosition.addAssign(thomasAttractor({ pos: spawnPosition.add(offsetPosition) }));
}).compute(COUNT); // 25k particles, all GPU
```

#### 26. d3-3d / Mike Bostock — 3D Data Projection
**What they do:** Project 2D SVG data visualizations into pseudo-3D space using d3.js transforms.  
**Note:** For true 3D data viz, prefer `3d-force-graph` over d3-3d — but d3's force simulation can drive Three.js node positions for hybrid approach.

#### 27. DeepDream / Latent Space — Activation Pattern Visualization
**What they do:** Neural network activation maps visualized as texture overlays on 3D geometry — "what is the AI seeing" visualization.  
**For rosie-3d:** Overlay latent space activation textures on brain mesh nodes using `THREE.DataTexture` populated from inference outputs.

---

### PHASE 4 — Performance Leaders

#### 28. THREE.BatchedMesh (r158+) — Multi-Geometry Single Draw Call
**What they do:** Unlike InstancedMesh (same geometry × N), BatchedMesh batches DIFFERENT geometries sharing a material into one draw call, with per-instance frustum culling.  
**Source:** [Three.js BatchedMesh docs](https://threejs.org/docs/pages/BatchedMesh.html) | [Three.js forum BatchedMesh vs InstancedMesh](https://discourse.threejs.org/t/can-i-draw-many-instancedmeshes-using-batchedmesh/71077)  
**Pattern for 13 spine vertebrae:**
```js
// 13 vertebrae (different sizes, same material) → 1 draw call
const batchedSpine = new THREE.BatchedMesh(
  13,      // maxInstanceCount
  50000,   // maxVertexCount (sum of all vertebra verts)
  150000,  // maxIndexCount
  spineMaterial
);
vertebraeGeometries.forEach((geo, i) => {
  const geoId = batchedSpine.addGeometry(geo);
  const instanceId = batchedSpine.addInstance(geoId);
  batchedSpine.setMatrixAt(instanceId, vertebraMatrices[i]);
});
scene.add(batchedSpine); // one draw call, per-instance frustum culled
```

#### 29. drei `<Instances>` — Declarative InstancedMesh
**What they do:** Wrap repeated objects in `<Instances>` to collapse to a single draw call while keeping React declarative syntax.  
**Source:** [drei Instances docs](https://drei.docs.pmnd.rs/performances/instances)  
```jsx
<Instances geometry={vertebraGeo} material={boneMaterial} limit={13}>
  {spinePositions.map((pos, i) => (
    <Instance key={i} position={pos} scale={vertebraScales[i]} />
  ))}
</Instances>
```

#### 30. PerformanceMonitor + frameloop="demand" — On-Demand Rendering
**What they do:** Only re-render when something changes; PerformanceMonitor adjusts DPR and disables postprocessing if FPS drops below threshold.  
**Source:** [R3F scaling performance docs](https://r3f.docs.pmnd.rs/advanced/scaling-performance) | [Codrops perf tutorial 2025](https://tympanus.net/codrops/2025/02/11/building-efficient-three-js-scenes-optimize-performance-while-maintaining-quality/)  
```jsx
<Canvas frameloop="demand" // only renders when props change
  gl={{ powerPreference: "high-performance", antialias: false, depth: false }}>
  <PerformanceMonitor
    bounds={() => [30, 500]}
    flipflops={1}
    onDecline={() => setDpr(Math.max(dpr * 0.8, 0.5))}
    onFallback={() => setLowQuality(true)}
  />
```

#### 31. gltfjsx Draco + Mesh Simplification — 90% Asset Compression
**What they do:** CLI tool that converts GLB to compressed GLTF with Draco, prunes unused nodes, simplifies meshes, and generates TypeScript R3F components.  
**Source:** [Codrops performance article 2025](https://tympanus.net/codrops/2025/02/11/building-efficient-three-js-scenes-optimize-performance-while-maintaining-quality/)  
```bash
npx gltfjsx vertebra.glb -S -T -t
# -S: mesh simplification
# -T: transform/compress (Draco, prune, resize)
# -t: TypeScript definitions
# Result: 90% smaller, R3F-ready component
```

#### 32. WebGPU TSL — Write Once, Run Anywhere
**What they do:** TSL (Three Shading Language) is a JS-syntax shader system that compiles to both GLSL (WebGL) and WGSL (WebGPU) — write shaders once, run on all platforms.  
**Source:** [Maxime Heckel TSL guide](https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/) | [Three.js 2026 state, Utsubo](https://www.utsubo.com/blog/threejs-2026-what-changed)  
```js
// TSL shader example — runs on WebGL AND WebGPU
import * as THREE from 'three/webgpu';
const Canvas = () => (
  <Canvas gl={async (props) => {
    const renderer = new THREE.WebGPURenderer(props);
    await renderer.init();
    return renderer;
  }}>
    ...
  </Canvas>
);
```

#### 33. Polyhaven HDRIs — Free Environment Lighting
**What they do:** Polyhaven provides CC0 HDR environment maps — free to use commercially — for realistic PBR lighting without dynamic lights (huge performance win).  
**Source:** [Polyhaven HDRI library](https://polyhaven.com/hdris/)  
**Pattern:**
```jsx
import { Environment } from '@react-three/drei';
// No dynamic lights needed — environment handles all PBR lighting
<Environment files="/textures/studio_small_08_4k.hdr" />
```

#### 34. LOD (Level of Detail) with drei `<Detailed>`
**What they do:** Swap lower-poly meshes as camera moves away, reducing vertex count.  
```jsx
<Detailed distances={[0, 5, 15, 25]}>
  <HighPolyVertebra />      {/* < 5 units */}
  <MedPolyVertebra />       {/* 5-15 */}
  <LowPolyVertebra />       {/* 15-25 */}
  <BoxGeometry />           {/* > 25 - barely visible */}
</Detailed>
```

#### 35. Suspense + Lazy Mesh Loading — Progressive Anatomy
**What they do:** Load low-res placeholder first, high-res anatomy model second, using React Suspense.  
```jsx
const HighResBody = lazy(() => import('./HighResBodyModel'));
function AnatomyScene() {
  return (
    <Suspense fallback={<LowResBodyPlaceholder />}>
      <HighResBody />
    </Suspense>
  );
}
```

#### 36. Visibility Change — Stop Rendering on Tab Switch
**What they do:** Prevents canvas from burning GPU when tab is not visible.  
```js
const [frameloop, setFrameloop] = useState('always');
useEffect(() => {
  const onVisibility = () =>
    setFrameloop(document.hidden ? 'never' : 'always');
  document.addEventListener('visibilitychange', onVisibility);
  return () => document.removeEventListener('visibilitychange', onVisibility);
}, []);
<Canvas frameloop={frameloop} />
```

#### 37. Utsubo / 100 Three.js Tips — Best Practices 2026
**Source:** [100 Three.js performance tips, Utsubo 2026](https://www.utsubo.com/blog/threejs-best-practices-100-tips)  
**Top 10 for our use case:**
- Target < 100 draw calls per frame (our goal: < 50)
- Mutate in `useFrame`, never `setState`
- Use `useGLTF.preload()` for critical models
- KTX2 texture compression (UASTC for quality, ETC1S for size)
- r3f-perf for FPS monitoring in development
- Dispose all GPU resources on unmount
- `powerPreference: "high-performance"` on renderer

---

### PHASE 5 — Additional Leaders

#### 38. Organic Noise / FBM for Halos and Glows
**What they do:** Fractional Brownian Motion (fbm) — layered simplex noise at multiple frequencies — creates organic, "alive" surface distortions.  
**Source:** [Reddit Three.js FBM Perlin noise](https://www.reddit.com/r/threejs/comments/n36ows/a_threejs_based_fbm_perlin_noise_function_to_be/) | [Halo shader, stemkoski](http://stemkoski.blogspot.com/2013/07/shaders-in-threejs-glow-and-halo.html)  
**Pattern for KANCHAY halo:**
```glsl
// Organic halo using fresnel + fbm noise
float halo(vec3 normal, vec3 viewDir, float noiseVal) {
  float fresnel = 1.0 - abs(dot(normal, viewDir));
  return pow(fresnel, 2.0) * (0.7 + 0.3 * noiseVal);
}
// In vertex shader, distort halo vertices with noise:
vec3 displaced = position + normal * fbm(position * 2.0 + uTime) * 0.05;
```

#### 39. Robin Payot — Duotone + Stencil Box Shader Portfolio
**What they do:** Robin Payot's 2026 portfolio uses duotone shader with stencil box masking — the model's true colors only visible inside stencil frame, with dither shader scaling dot grid by brightness outside.  
**Source:** [Three.js forum Robin Payot portfolio](https://discourse.threejs.org/t/portfolio-robin-payot/42559) | [Five-year R3F portfolio thread](https://discourse.threejs.org/t/after-five-years-a-new-react-three-fiber-portfolio-build/90146)  
**Pattern:** Stencil-based dual rendering pass for "reveal" effects on anatomy layers.

#### 40. Real-Time Nebula + Raymarching (Volumetric)
**What they do:** Full volumetric nebula rendering via raymarching in fragment shader — FBM noise + domain warping + Fresnel refractions.  
**Source:** [Nebula WebGL raymarching tutorial](https://www.youtube.com/watch?v=5xFcef0BVT4) | [Procedural nebula portal tutorial 2025](https://www.youtube.com/watch?v=iGNTzGIl2ic)  
**For rosie-3d background:** Use UnrealBloomPass + nebula raymarching sphere for the "AI consciousness" aesthetic.

#### 41. Cassie Evans / GSAP — Animation Choreography
**What they do:** GSAP doesn't render — it orchestrates. It directly mutates Three.js object properties (position, rotation, uniforms) on each tick via GSAP timelines tied to ScrollTrigger or user events.  
**Source:** [GSAP with Cassie Evans podcast 2025](https://www.youtube.com/watch?v=shotcE73Vns)  
**Pattern:** GSAP timeline for anatomy body reveal:
```js
const tl = gsap.timeline({ scrollTrigger: { trigger: "#anatomy", scrub: true } });
tl.to(skeletonMesh, { opacity: 0, duration: 1 })
  .to(muscleMesh, { opacity: 1, duration: 1 }, "<")
  .to(organMesh.material, { opacity: 0.7, duration: 0.5 });
```

#### 42. KhipuKnot — Reidemeister Rotation Pattern
**What they do:** Topology-based animation where a knot evolves through Reidemeister moves (mathematical knot theory operations). Used for the khipu visualization in anatomy-3d.  
**Pattern for rosie-3d KhipuKnot rotation:**
```js
// Parameterize torus knot and morph between p,q values
useFrame(({ clock }) => {
  const t = clock.elapsedTime * 0.2;
  const p = Math.round(Math.sin(t) * 1.5 + 2.5); // cycles 1,2,3,4
  const q = Math.round(Math.cos(t * 0.7) * 1 + 2); // cycles 1,2,3
  knotRef.current.geometry = new THREE.TorusKnotGeometry(1, 0.3, 200, 20, p, q);
});
```

---

### PHASE 6 — Drone-Tracking / Geospatial 3D Leaders (Killinchu use case)

> Context: Per `470_WAMANI_DRONE_PIVOT_PLAN.md`, SZL is pivoting `vessels` (maritime AIS/MMSI tracking) into an air-domain drone-intelligence flagship. The Quechua name candidates included **Killinchu** (kestrel/hawk — predator drone) and **Wamani** (peregrine falcon). The drone agent's 3D surface needs a real geospatial globe with time-dynamic asset tracking, FAA airspace overlays, and a fused "single operational picture" — a different stack from anatomy-3d/rosie-3d's pure Three.js scenes. The four leaders below define that stack.

#### 43. CesiumJS — Geospatial 3D Globe + Time-Dynamic Entity Tracking (drone gold standard)
**What they do:** CesiumJS is the open-source WebGL globe/map engine for accurate world-scale 3D, with first-class **time-dynamic entity tracking** — you feed time-stamped positions and it interpolates a smooth flight path, auto-orients the model to its velocity vector, and lets the camera lock-follow the moving asset.  
**Why world-class:** It is literally built for the "follow a drone/aircraft over real terrain" problem. `SampledPositionProperty` interpolates between telemetry samples; `VelocityOrientationProperty` points the model along its heading for free; `viewer.trackedEntity` gives Cesium's signature chase-cam; the timeline scrubber + clock let operators replay a mission. Cesium ion's own tutorial demonstrates exactly this with a drone scenario asset.  
**Source:** [Cesium — Visualizing Time Dynamic Data (drone/aircraft follow)](https://cesium.com/learn/ion/stories-time-dynamic/) | [CesiumJS VelocityOrientationProperty ref-doc](https://cesium.com/learn/cesiumjs/ref-doc/VelocityOrientationProperty.html) | [Cesium Community — Follow drone flight in real time](https://community.cesium.com/t/follow-drone-flight-in-real-time/31805) | [Cesium Community — heading/pitch/roll orientation](https://community.cesium.com/t/how-to-apply-model-orientation-rotation-then-use-velocityorientationproperty/4682)  
**Drone-track secret (time-dynamic position + auto-orientation):**
```js
// killinchu/src/cesium/DroneTrack.js
import * as Cesium from 'cesium';

export function addDroneTrack(viewer, telemetry, start, stop) {
  // 1. Build a time-sampled position from live telemetry [{t, lon, lat, altM}]
  const position = new Cesium.SampledPositionProperty();
  telemetry.forEach(({ t, lon, lat, altM }) => {
    const time = Cesium.JulianDate.fromIso8601(t);
    position.addSample(time, Cesium.Cartesian3.fromDegrees(lon, lat, altM));
  });
  position.setInterpolationOptions({               // smooth flight path
    interpolationDegree: 2,
    interpolationAlgorithm: Cesium.HermitePolynomialApproximation,
  });

  // 2. Add the drone entity — orientation auto-derived from velocity vector
  const drone = viewer.entities.add({
    availability: new Cesium.TimeIntervalCollection([
      new Cesium.TimeInterval({ start, stop }),
    ]),
    position,
    orientation: new Cesium.VelocityOrientationProperty(position), // points along heading
    model: { uri: '/models/quadcopter.glb', minimumPixelSize: 48 },
    path: { resolution: 1, width: 2, material: Cesium.Color.CYAN.withAlpha(0.6) },
  });

  // 3. Chase-cam + timeline scrubber
  viewer.trackedEntity = drone;
  viewer.clock.shouldAnimate = true;
  return drone;
}
```
**Where in our Spaces:** killinchu drone map (the core 3D surface). **Cost:** `npm i cesium` + a Cesium ion token (free tier) for terrain/imagery; ~40 lines per track. **Priority:** P0 for killinchu.

#### 44. Mapbox GL JS + Three.js Custom Layer — Branded 3D Models on a Vector Basemap
**What they do:** Mapbox's `CustomLayerInterface` lets you render a live Three.js scene inside a Mapbox GL map, keeping the Three camera in sync with the Mapbox camera via a Mercator-coordinate model transform. The `threebox` plugin abstracts the camera-sync math entirely (`tb.loadObj` + `model.setCoords([lng,lat])`).  
**Why world-class:** Best when you want a **styled, branded vector basemap** (custom colors matching SZL palette, monochrome "command" theme) with crisp 3D glTF drone models placed at real lng/lat — lighter weight than a full Cesium globe for city/regional-scale tracking. Note: SZL `vessels` already ships OpenFreeMap tiles, so a MapLibre/Mapbox-style basemap is a natural fit for the Killinchu pivot.  
**Source:** [Mapbox — Add a 3D model with three.js (custom layer)](https://docs.mapbox.com/mapbox-gl-js/example/add-3d-model/) | [Mapbox — Add a 3D model with threebox](https://docs.mapbox.com/mapbox-gl-js/example/add-3d-model-threebox/) | [mapbox-gl-js #7395 — custom layer camera position](https://github.com/mapbox/mapbox-gl-js/issues/7395)  
**Pattern (threebox — minimal):**
```js
// killinchu/src/map/ThreeDroneLayer.js  (threebox keeps cameras synced for you)
const tb = (window.tb = new Threebox(map, map.getCanvas().getContext('webgl'),
  { defaultLights: true }));
map.addLayer({
  id: 'drone-3d', type: 'custom', renderingMode: '3d',
  onAdd() {
    tb.loadObj({ obj: '/models/quadcopter.glb', type: 'gltf',
      scale: { x: 3, y: 3, z: 3 }, units: 'meters' }, (model) => {
      model.setCoords([lng, lat, altM]);  // real-world placement
      tb.add(model);
      window.__drone = model;
    });
  },
  render() { tb.update(); },
});
// live update on telemetry: window.__drone.setCoords([lng, lat, altM]);
```
**Where in our Spaces:** killinchu drone map (branded city/regional view, reuses OpenFreeMap-style tiles). **Cost:** `threebox` + Mapbox/MapLibre token; ~25 lines. **Priority:** P1 for killinchu (CesiumJS #43 is the P0 globe; this is the branded-basemap alternative/complement).

#### 45. Deck.gl — GPU-Layered Geospatial Viz (FAA UAS zones, telemetry trails, swarms)
**What they do:** Deck.gl is Uber/vis.gl's GPU-powered layer framework that composes data into stacked layers and interleaves with base maps (Mapbox, MapLibre, Google, ArcGIS) and even 3D Tiles. For drones: `GeoJsonLayer` for FAA UAS Facility Map / LAANC exclusion grids, `ScatterplotLayer` for live drone positions (with GPU transitions for smooth motion of thousands of assets), `ArcLayer` for raised connection arcs (ground-station↔drone, leader↔follower in a swarm), `Tile3DLayer` + `TerrainController` for photogrammetric terrain.  
**Why world-class:** One declarative layer stack handles tens of thousands of moving points on the GPU; FAA UAS facility maps are published as ArcGIS open data (GeoJSON) and drape directly via `GeoJsonLayer`; `ScatterplotLayer + transition` is the documented best-practice for animating large fleets.  
**Source:** [deck.gl home](https://deck.gl) | [deck.gl ScatterplotLayer](https://deck.gl/docs/api-reference/layers/scatterplot-layer) | [deck.gl ArcLayer](https://deck.gl/docs/api-reference/layers/arc-layer) | [deck.gl Using with 3D Tiles (Tile3DLayer + TerrainController)](https://deck.gl/docs/developer-guide/base-maps/using-with-3d-tiles) | [deck.gl #4947 — animating many vehicles](https://github.com/visgl/deck.gl/issues/4947) | [FAA UAS Facility Maps (ArcGIS open data)](https://www.faa.gov/uas/commercial_operators/uas_facility_maps)  
**Pattern (FAA exclusion zones + live drone fleet + swarm arcs):**
```js
// killinchu/src/deck/layers.js
import { GeoJsonLayer, ScatterplotLayer, ArcLayer } from '@deck.gl/layers';

export const droneLayers = ({ faaZones, drones, swarmEdges }) => [
  // FAA UAS Facility Map / LAANC ceiling grid (ArcGIS GeoJSON open data)
  new GeoJsonLayer({ id: 'faa-uas', data: faaZones,
    getFillColor: f => f.properties.ceiling === 0 ? [220,40,40,90] : [40,120,220,40],
    getLineColor: [255,255,255,120], lineWidthMinPixels: 1, pickable: true }),
  // Live drone fleet — GPU transition animates motion between telemetry frames
  new ScatterplotLayer({ id: 'drones', data: drones,
    getPosition: d => [d.lon, d.lat, d.altM],
    getRadius: 40, radiusMinPixels: 4,
    getFillColor: d => d.remoteIdOff ? [255,60,60] : [0,255,200], // dark-drone = red
    transitions: { getPosition: 600 }, pickable: true }),
  // Swarm leader<->follower arcs
  new ArcLayer({ id: 'swarm', data: swarmEdges,
    getSourcePosition: e => e.from, getTargetPosition: e => e.to,
    getSourceColor: [0,255,200], getTargetColor: [255,200,0], getWidth: 2 }),
];
```
**Where in our Spaces:** killinchu drone map (data layers on top of CesiumJS/Mapbox base). Maps directly onto the pivot plan's counter-UAS rule engine (geofence + Remote-ID-off detection). **Cost:** `@deck.gl/layers` + `@deck.gl/geo-layers`; ~30 lines. **Priority:** P0 for killinchu (FAA zone overlay + fleet dots are table-stakes).

#### 46. Anduril Lattice — "Single Unified Operational Picture" UX Pattern (publicly documented)
**What they do:** Anduril's Lattice is a mesh-networked command-and-control platform that **fuses telemetry from every sensor (drones, satellites, ground sensors, soldier devices) into one coherent 3D model** — one map, every asset, real-time, with entity orientation/velocity and time-based animation of moving objects.  
**Why world-class (and adoptable):** Lattice itself is closed, but its *interface philosophy* and *data standards* are publicly documented and directly steal-able: ingest KML/KMZ, GeoJSON, Cursor-on-Target (CoT), and STANAG; show every asset as a typed Geo-Entity on a single globe; let operators "follow" any entity; flag threats with colored silhouettes; collapse disparate feeds into one situational picture rather than many windows.  
**Source:** [Wind River — integrating with Anduril Lattice (KML/GeoJSON/CoT/STANAG, Geo-Entities, telemetry fusion)](https://www.windriver.com/blog/Accelerating-Safety-Critical-Innovation-Wind-River-Anduril) | [Wired — Anduril's operating system for war (3D terrain, highlighted aircraft/entities)](https://www.wired.com/story/behind-anduril-effort-create-operating-system-war/) | [Bilawal Sidhu — Lattice fuses drones/satellites/sensors into one 3D model](https://www.spatialintelligence.ai/p/soldiers-can-now-see-through-walls)  
**UX patterns to steal for killinchu:**
- **One picture, not many windows** — a single CesiumJS globe is the home screen; all assets are Geo-Entities on it (mirrors the pivot plan's "live drone map overlays on existing OpenFreeMap tiles").
- **Typed, colored entities** — friendly/neutral/threat color coding; Remote-ID-off ("dark drone") rendered red, exactly matching the counter-UAS rule engine in `470_WAMANI_DRONE_PIVOT_PLAN.md`.
- **Standards-first ingest** — accept KML/GeoJSON/CoT/STANAG; SZL's Remote-ID/ADS-B/STANAG-4609 parsers feed these into Cesium entities.
- **Follow-any-entity + timeline replay** — click an asset → chase-cam (CesiumJS `trackedEntity` #43) + scrub the mission clock.
- **Receipt-linked actions** — each detection/HALT emits a Khipu/Λ-receipt; surface these as clickable annotations on the entity (ties killinchu back into the brain-jack mesh and 3D Anatomy YAWAR ledger organ).
**Where in our Spaces:** killinchu drone map (overall information architecture / home screen). **Cost:** design pattern — no install; informs how #43–45 are composed. **Priority:** P0 (design north-star for killinchu).

---

## SECTION 2 — Per-Leader Adoption Recipe Table

| # | Leader | What they do | Technical Secret | Cost to adopt | Where in our Spaces | Priority |
|---|---|---|---|---|---|---|
| 1 | Three.js r160/WebGPU | Future-proof renderer | TSL compiles to WGSL+GLSL; WebGPU auto-fallback | `import * as THREE from 'three/webgpu'` — 1 line | Both | P1 |
| 2 | R3F + drei | Declarative 3D | useFrame mutation, PerformanceMonitor | Already using; add frameloop="demand" | Both | P0 |
| 3 | Bruno Simon | Interactive physics world | Rapier WASM physics, gamepad API | `@react-three/rapier` npm — 50 lines | anatomy-3d (YUYAY bounce) | P2 |
| 4 | akella GPGPU FBO | 100k+ particles | Ping-pong FBO render targets | 80 lines GLSL + 50 lines JS | Both | P1 |
| 5 | Codrops tutorials | State-of-art patterns | Aggregated from 18 tutorials | Reference only; no install | Both | P0 |
| 6 | Spline | Design→React pipeline | Draco+instance materials, < 3 lights | `@splinetool/react-spline` npm | anatomy-3d (quick hero) | P2 |
| 7 | Metaballs/smoothMin | Organic blob morphing | Ray march + SDF smoothMin | 60 lines GLSL fullscreen plane | anatomy-3d (KANCHAY halo) | P1 |
| 8 | Apple ScrollTrigger | Scroll-driven 3D | GSAP ScrollTrigger pin+scrub | `gsap` + 40 lines | anatomy-3d (layer reveal) | P0 |
| 9 | Bloom postprocessing | HDR glow | emissiveIntensity > 1, toneMapped=false | `@react-three/postprocessing` — 10 lines | Both | P0 |
| 10 | MeshLine dashed | Animated flow lines | dashOffset animation in shader | `meshline` npm — 30 lines | anatomy-3d (PENDING wires) | P0 |
| 11 | BioDigital Human | Multi-layer anatomy | Per-system opacity toggle | Inspiration; implement manually | anatomy-3d | P0 |
| 12 | Visible Body | Education UX | Radius Blast, Breadcrumb Trail | UX pattern; no code cost | anatomy-3d | P1 |
| 13 | Z-Anatomy | Free anatomy GLBs | CC-licensed .obj → GLTF | Blender conversion; free | anatomy-3d | P1 |
| 14 | Complete Anatomy | MorphTarget animation | ShapeKey morph for muscle contraction | 10 lines `morphTargetInfluences` | anatomy-3d | P1 |
| 15 | Anatomy Next | Clinical VR 3D | Per-region isolation | UX inspiration | anatomy-3d | P2 |
| 16 | TurboSquid medical | Asset library | PBR rigged models | Purchase + gltfjsx | anatomy-3d | P1 |
| 17 | SSS (SubSurface) | Skin translucency | Back-scattered light approx | `SubsurfaceScatteringShader` addon | anatomy-3d (skin, organs) | P0 |
| 18 | Breathing animation | Lung/heart morph | MorphTarget + sine clock | 15 lines `useFrame` | anatomy-3d (YUYAY) | P0 |
| 19 | Blood-flow particles | Vascular flow | TubeGeometry + progress shader | 60 lines | anatomy-3d (YAWAR) | P1 |
| 20 | 3d-force-graph | Brain-jack mesh | d3-force-3d physics + Three.js | `3d-force-graph` npm — 20 lines | rosie-3d (brain mesh) | P0 |
| 21 | Anthropic features | Neural concept map | Dictionary learning → feature clusters | Conceptual model for rosie | rosie-3d | P1 |
| 22 | Distill.pub Grand Tour | High-dim projection | Grand Tour rotation in 3D | Custom Three.js rotation matrix | rosie-3d | P2 |
| 23 | Cytoscape.js WebGL | 2D network graph | WebGL sprite sheets for nodes | `cytoscape` npm | rosie-3d (circuit view) | P2 |
| 24 | Nebula shader | Space background | Simplex FBM on sphere | 50 lines GLSL | rosie-3d (background) | P1 |
| 25 | GPGPU compute (TSL) | 25k GPU particles | instancedArray + wgslFn | 100 lines TSL | rosie-3d (particle field) | P1 |
| 26 | d3-3d / force sim | 3D node layout | d3-force-3d drives Three.js positions | Already in 3d-force-graph | rosie-3d | P2 |
| 27 | DeepDream latent viz | Activation texture | DataTexture from inference | 30 lines + inference hook | rosie-3d | P2 |
| 28 | BatchedMesh | 1 draw call for spine | WEBGL_multi_draw, frustum culled | 30 lines | anatomy-3d (13 vertebrae) | P0 |
| 29 | drei Instances | Declarative instancing | THREE.InstancedMesh, 1 draw call | 10 lines JSX | anatomy-3d (vertebrae) | P0 |
| 30 | PerformanceMonitor | Adaptive quality | FPS sampling, dpr scaling | 15 lines | Both | P0 |
| 31 | gltfjsx -T -S | 90% model compression | Draco + mesh simplify | CLI command; zero code | Both | P0 |
| 32 | WebGPU TSL | Cross-platform shaders | GLSL+WGSL from one source | `three/webgpu` import | Both | P1 |
| 33 | Polyhaven HDRIs | Free PBR lighting | CC0 EXR/HDR env maps | `<Environment files="..." />` | Both | P1 |
| 34 | LOD `<Detailed>` | Distance-based quality | Three.js LOD, drei wrapper | 15 lines JSX | anatomy-3d (vertebrae LOD) | P1 |
| 35 | Suspense lazy mesh | Progressive loading | React.lazy + Suspense fallback | 10 lines | Both | P0 |
| 36 | Visibility pause | No GPU waste | visibilitychange → frameloop | 10 lines | Both | P0 |
| 37 | 100 Three.js tips | Global best practices | Aggregated wisdom | Reference doc | Both | P1 |
| 38 | FBM organic noise | Halo / shield glow | fbm layered simplex | 30 lines GLSL | anatomy-3d (KANCHAY) | P1 |
| 39 | Robin Payot stencil | Layer reveal effect | Stencil buffer dual pass | 40 lines | anatomy-3d | P2 |
| 40 | Nebula raymarching | Volumetric space | Raymarching + FBM domain warp | 80 lines GLSL | rosie-3d | P1 |
| 41 | GSAP choreography | Scroll animation | Timeline + ScrollTrigger | `gsap` — well-known | anatomy-3d | P0 |
| 42 | KhipuKnot Reidemeister | Knot topology anim | TorusKnot p,q morphing | 20 lines `useFrame` | rosie-3d (khipu) | P1 |
| 43 | CesiumJS | Geospatial globe + time-dynamic drone tracking | SampledPositionProperty + VelocityOrientationProperty + trackedEntity | `npm i cesium` + ion token; ~40 lines | **killinchu drone map** | P0 |
| 44 | Mapbox GL + Three.js | Branded 3D models on vector basemap | CustomLayer Mercator transform / threebox camera-sync | `threebox` + token; ~25 lines | killinchu drone map | P1 |
| 45 | Deck.gl | GPU-layered FAA zones + fleet + swarm arcs | GeoJsonLayer/ScatterplotLayer+transition/ArcLayer | `@deck.gl/layers`; ~30 lines | killinchu drone map | P0 |
| 46 | Anduril Lattice | Single unified operational picture | Fuse all sensors → one 3D model; typed colored Geo-Entities; KML/GeoJSON/CoT/STANAG ingest | Design pattern; no install | killinchu drone map (IA) | P0 |

---

## SECTION 3 — Top-10 Adoption Actions (Ranked, Ready-to-Paste)

### #1 (P0) — Subsurface Scattering Approximation for Anatomy Skin/Organs

**Leader source:** Three.js SubsurfaceScatteringShader (GDC 2011 translucency approx) + BioDigital Human aesthetic  
**File path:** `anatomy-3d/src/materials/SkinMaterial.js`  
**Estimated visual delta:** ★★★★★ — transforms anatomy from plastic to organic  

```js
// anatomy-3d/src/materials/SkinMaterial.js
import * as THREE from 'three';
import { SubsurfaceScatteringShader } from 'three/addons/shaders/SubsurfaceScatteringShader.js';

export function createSkinMaterial(map) {
  return new THREE.ShaderMaterial({
    lights: true,
    uniforms: {
      ...THREE.UniformsLib.lights,
      ...SubsurfaceScatteringShader.uniforms,
      map: { value: map },
      diffuse: { value: new THREE.Color(0.8, 0.6, 0.5) },
      thicknessColor: { value: new THREE.Color(0.9, 0.2, 0.1) }, // blood glow
      thicknessDistortion: { value: 0.185 },
      thicknessPower: { value: 2.0 },
      thicknessScale: { value: 16.0 },
      thicknessAmbient: { value: 0.4 },
      thicknessAttenuation: { value: 0.8 },
    },
    vertexShader: SubsurfaceScatteringShader.vertexShader,
    fragmentShader: SubsurfaceScatteringShader.fragmentShader,
  });
}
// Usage: skinMesh.material = createSkinMaterial(skinTexture);
```

---

### #2 (P0) — Volumetric Blood Particles Along TubeGeometry (YAWAR)

**Leader source:** akella GPGPU FBO + Three.js TubeGeometry  
**File path:** `anatomy-3d/src/components/BloodFlow.jsx`  
**Estimated visual delta:** ★★★★★ — makes vascular system feel alive  

```jsx
// anatomy-3d/src/components/BloodFlow.jsx
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function BloodFlow({ vesselPoints, particleCount = 2000, color = '#ff2200' }) {
  const pointsRef = useRef();
  const curve = useMemo(() => new THREE.CatmullRomCurve3(vesselPoints), [vesselPoints]);
  
  const { positions, offsets } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const offsets = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      offsets[i] = Math.random(); // stagger along tube
      const pt = curve.getPoint(offsets[i]);
      positions.set([pt.x, pt.y, pt.z], i * 3);
    }
    return { positions, offsets };
  }, [particleCount, curve]);

  useFrame(({ clock }) => {
    const arr = pointsRef.current.geometry.attributes.position.array;
    const speed = 0.12;
    for (let i = 0; i < particleCount; i++) {
      offsets[i] = (offsets[i] + speed * 0.001) % 1;
      const pt = curve.getPoint(offsets[i]);
      arr[i * 3] = pt.x; arr[i * 3 + 1] = pt.y; arr[i * 3 + 2] = pt.z;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color={color} size={0.005} transparent opacity={0.8} sizeAttenuation />
    </points>
  );
}
```

---

### #3 (P0) — Bloom Postprocessing for Emissive Anatomy Elements

**Leader source:** react-three/postprocessing + pmndrs bloom  
**File path:** `anatomy-3d/src/Scene.jsx`, `rosie-3d/src/Scene.jsx`  
**Estimated visual delta:** ★★★★ — instant "sci-fi medical" aesthetic  

```jsx
// Both scenes — add to root Canvas children
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';

function PostFX() {
  return (
    <EffectComposer disableNormalPass>
      <Bloom
        mipmapBlur
        luminanceThreshold={1}        // only materials with intensity > 1 glow
        luminanceSmoothing={0.1}
        intensity={1.2}               // glow strength
        blendFunction={BlendFunction.SCREEN}
      />
    </EffectComposer>
  );
}

// On glowing elements (nerve fibers, active brain nodes, blood vessels):
<meshStandardMaterial
  emissive="#00aaff"
  emissiveIntensity={2.5}     // > 1 triggers bloom
  toneMapped={false}           // REQUIRED — prevents clamping
/>
```

---

### #4 (P0) — Animated Dashed Lines for PENDING State Wires

**Leader source:** Codrops MeshLine 2019 + `meshline` npm package  
**File path:** `anatomy-3d/src/components/PendingWire.jsx`  
**Estimated visual delta:** ★★★★ — transforms static connections into living pathways  

```jsx
// anatomy-3d/src/components/PendingWire.jsx
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshLineGeometry, MeshLineMaterial } from 'meshline';
import * as THREE from 'three';

export function PendingWire({ points, color = '#00ccff', speed = 0.008 }) {
  const matRef = useRef();
  const curve = useMemo(() =>
    new THREE.CatmullRomCurve3(points).getPoints(50), [points]);

  useFrame(() => {
    if (matRef.current) {
      matRef.current.uniforms.dashOffset.value -= speed;
    }
  });

  const geometry = useMemo(() => {
    const geo = new MeshLineGeometry();
    geo.setPoints(curve);
    return geo;
  }, [curve]);

  return (
    <mesh geometry={geometry}>
      <meshLineMaterial
        ref={matRef}
        color={color}
        lineWidth={0.015}
        resolution={[window.innerWidth, window.innerHeight]}
        dashArray={1.5}      // dash cycle length
        dashOffset={0}
        dashRatio={0.6}      // 60% visible
        transparent
        depthTest={false}
      />
    </mesh>
  );
}
```

---

### #5 (P0) — Particle Flow Along TubeGeometry Curves (General)

**Leader source:** akella + Three.js TubeGeometry docs  
**File path:** `rosie-3d/src/components/NeuralFlow.jsx`  
**Estimated visual delta:** ★★★★ — makes neuron connections look alive  

```jsx
// Generic curve-flow for both blood vessels AND neural pathways
// rosie-3d/src/components/NeuralFlow.jsx
export function NeuralFlow({ startNode, endNode, color = '#00ffcc', count = 500 }) {
  const pointsRef = useRef();
  const curve = useMemo(() => new THREE.CatmullRomCurve3([
    startNode.position,
    startNode.position.clone().lerp(endNode.position, 0.33).add(randomOffset()),
    startNode.position.clone().lerp(endNode.position, 0.66).add(randomOffset()),
    endNode.position,
  ]), [startNode, endNode]);

  // (same particle animation as BloodFlow above, different color + speed)
  return <BloodFlow vesselPoints={curve.points} color={color} particleCount={count} />;
}
```

---

### #6 (P0) — Organic Noise on KANCHAY Halo

**Leader source:** Stemkoski Three.js glow/halo shader + FBM technique  
**File path:** `anatomy-3d/src/shaders/KanchayHalo.glsl` + `KanchayHalo.jsx`  
**Estimated visual delta:** ★★★★ — removes "fake" look from force-field shield  

```glsl
// KanchayHalo.vert
uniform float uTime;
varying float vFresnel;
varying vec3 vNormal;

// Simple fbm (3 octaves)
float hash(float n) { return fract(sin(n) * 43758.5453); }
float noise(vec3 p) { /* trilinear */ return hash(dot(floor(p), vec3(127.1, 311.7, 74.7))); }
float fbm(vec3 p) {
  float f = 0.0;
  f += 0.50000 * noise(p * 1.0);
  f += 0.25000 * noise(p * 2.0);
  f += 0.12500 * noise(p * 4.0);
  return f;
}

void main() {
  vec3 viewDir = normalize(cameraPosition - (modelMatrix * vec4(position, 1.0)).xyz);
  vNormal = normalize(normalMatrix * normal);
  float fresnel = 1.0 - abs(dot(vNormal, viewDir));
  float n = fbm(position * 1.5 + uTime * 0.3);
  vec3 displaced = position + normal * fresnel * n * 0.12;
  vFresnel = fresnel * (0.6 + 0.4 * n);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}
```

---

### #7 (P0) — Breathing Animation on YUYAY Heart Torus

**Leader source:** Complete Anatomy MorphTarget pattern + akella animation style  
**File path:** `anatomy-3d/src/components/YuyayHeart.jsx`  
**Estimated visual delta:** ★★★★★ — the heart being alive is the emotional core of anatomy-3d  

```jsx
// anatomy-3d/src/components/YuyayHeart.jsx
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export function YuyayHeart({ bpm = 72 }) {
  const meshRef = useRef();
  const period = 60 / bpm; // seconds per beat

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const beat = t % period;
    // Sharp systole (0-20% of cycle) then smooth diastole
    const systole = beat / period < 0.2
      ? Math.sin((beat / period) / 0.2 * Math.PI) // fast contraction
      : 0;
    const breathe = (Math.sin(t * 0.25) + 1) / 2; // 4s breathing cycle
    
    const s = 1 + systole * 0.12 + breathe * 0.04;
    meshRef.current.scale.setScalar(s);
    // Also pulse the tube radius via morphTarget if geometry supports it:
    if (meshRef.current.morphTargetInfluences)
      meshRef.current.morphTargetInfluences[0] = systole;
  });

  return (
    <mesh ref={meshRef}>
      <torusGeometry args={[0.8, 0.3, 32, 64]} />
      <meshStandardMaterial
        color="#cc2200"
        emissive="#aa1100"
        emissiveIntensity={systoleIntensity} // bloom trigger
        toneMapped={false}
      />
    </mesh>
  );
}
```

---

### #8 (P0) — KhipuKnot Rotation Per Reidemeister Move

**Leader source:** Three.js TorusKnotGeometry + topology animation concept  
**File path:** `rosie-3d/src/components/KhipuKnot.jsx`  
**Estimated visual delta:** ★★★ — philosophical depth marker; unique brand element  

```jsx
// rosie-3d/src/components/KhipuKnot.jsx
import { useRef, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Reidemeister moves as p,q sequences (mathematical knot operations)
const REIDEMEISTER_SEQUENCE = [
  [2, 3], [3, 4], [2, 5], [3, 5], [2, 7], [3, 7]
];

export function KhipuKnot({ rotationSpeed = 0.3 }) {
  const meshRef = useRef();
  const stepRef = useRef(0);
  const progressRef = useRef(0);

  useFrame((_, delta) => {
    progressRef.current += delta * rotationSpeed;
    if (progressRef.current >= 1) {
      progressRef.current = 0;
      stepRef.current = (stepRef.current + 1) % REIDEMEISTER_SEQUENCE.length;
      const [p, q] = REIDEMEISTER_SEQUENCE[stepRef.current];
      meshRef.current.geometry.dispose();
      meshRef.current.geometry = new THREE.TorusKnotGeometry(1, 0.28, 256, 32, p, q);
    }
    meshRef.current.rotation.y += delta * 0.4;
    meshRef.current.rotation.x = Math.sin(Date.now() * 0.001) * 0.2;
  });

  return (
    <mesh ref={meshRef}>
      <torusKnotGeometry args={[1, 0.28, 256, 32, 2, 3]} />
      <meshStandardMaterial
        color="#8800ff"
        emissive="#5500aa"
        emissiveIntensity={1.5}
        metalness={0.8}
        roughness={0.1}
        toneMapped={false}
      />
    </mesh>
  );
}
```

---

### #9 (P0) — Brain-Jack Network as 3d-force-graph Mesh (Rosie)

**Leader source:** vasturiano 3d-force-graph + Anthropic feature visualization concept  
**File path:** `rosie-3d/src/components/BrainJack.jsx`  
**Estimated visual delta:** ★★★★★ — the core visual of rosie-3d  

```jsx
// rosie-3d/src/components/BrainJack.jsx
import { useEffect, useRef } from 'react';
import ForceGraph3D from '3d-force-graph';
import * as THREE from 'three';

export function BrainJack({ nodes, links, onNodeClick }) {
  const containerRef = useRef();

  useEffect(() => {
    const graph = ForceGraph3D(containerRef.current, {
      rendererConfig: { antialias: true, alpha: true }
    })
      .graphData({ nodes, links })
      .backgroundColor('rgba(0,0,0,0)')
      .nodeThreeObject(node => {
        const geo = new THREE.SphereGeometry(node.val * 0.4 || 0.5, 12, 12);
        const mat = new THREE.MeshStandardMaterial({
          emissive: new THREE.Color(node.active ? '#00ffcc' : '#004488'),
          emissiveIntensity: node.active ? 3 : 0.5,
          toneMapped: false,
        });
        return new THREE.Mesh(geo, mat);
      })
      .linkDirectionalParticles(4)
      .linkDirectionalParticleSpeed(0.006)
      .linkDirectionalParticleWidth(0.8)
      .linkDirectionalParticleColor(() => '#00ffcc')
      .linkColor(() => 'rgba(0,200,255,0.3)')
      .onNodeClick(onNodeClick);

    return () => graph._destructor?.();
  }, [nodes, links]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}
```

---

### #10 (P0) — InstancedMesh for All 13 Spine Vertebrae + Draw Call < 50

**Leader source:** drei `<Instances>` + Three.js BatchedMesh (r158+) + Utsubo 100 tips  
**File path:** `anatomy-3d/src/components/Spine.jsx`  
**Estimated visual delta:** ★★★ — critical for mobile performance; invisible if done right  

```jsx
// anatomy-3d/src/components/Spine.jsx
import { Instances, Instance } from '@react-three/drei';
import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';

// Preload at module level
useGLTF.preload('/models/vertebra-compressed.glb');

const SPINE_CONFIG = [
  // [y-position, scale, label]
  [0.00, 1.00, 'C1'], [0.05, 0.95, 'C2'], [0.10, 0.98, 'C3'],
  [0.15, 1.00, 'C4'], [0.20, 1.02, 'C5'], [0.25, 1.03, 'C6'],
  [0.30, 1.05, 'C7'], [0.38, 1.08, 'T1'], [0.46, 1.10, 'T2'],
  [0.54, 1.12, 'T3'], [0.62, 1.10, 'T4'], [0.70, 1.12, 'T5'],
  [0.80, 1.15, 'L1'],
];

export function Spine({ material }) {
  const { nodes } = useGLTF('/models/vertebra-compressed.glb');
  // All 13 vertebrae = 1 draw call via InstancedMesh
  return (
    <Instances
      geometry={nodes.Vertebra.geometry}
      material={material}
      limit={13}
    >
      {SPINE_CONFIG.map(([y, scale, label]) => (
        <Instance
          key={label}
          position={[0, y, 0]}
          scale={scale}
        />
      ))}
    </Instances>
  );
}
// Total draw calls contributed by Spine: 1
// Target scene total: < 50 draw calls
```

---

### #11 (BONUS, P0 for killinchu) — CesiumJS Live Drone-Tracking Layer (Killinchu)

**Leader source:** CesiumJS time-dynamic data (#43) + Deck.gl FAA overlay (#45) + Anduril Lattice "single operational picture" UX (#46)  
**File path:** `killinchu/src/cesium/DroneScene.js`  
**Estimated visual delta:** ★★★★★ — turns the maritime-style flat map into a credible Warhacker counter-UAS demo  

```js
// killinchu/src/cesium/DroneScene.js
import * as Cesium from 'cesium';
import { addDroneTrack } from './DroneTrack'; // from leader #43

export function initDroneScene(containerId, ionToken) {
  Cesium.Ion.defaultAccessToken = ionToken;
  const viewer = new Cesium.Viewer(containerId, {
    timeline: true, animation: true,         // mission scrubber (Lattice replay)
    baseLayerPicker: false, geocoder: false,
  });

  // 1. FAA UAS Facility Map / LAANC ceiling grid (ArcGIS GeoJSON open data)
  Cesium.GeoJsonDataSource.load('/data/faa_uas_facility_map.geojson', {
    stroke: Cesium.Color.WHITE.withAlpha(0.4), strokeWidth: 1,
    fill: Cesium.Color.RED.withAlpha(0.15), clampToGround: true,
  }).then(ds => viewer.dataSources.add(ds));

  // 2. Live drones as typed, colored Geo-Entities (Lattice pattern)
  const start = Cesium.JulianDate.fromIso8601('2026-06-16T14:00:00Z');
  const stop  = Cesium.JulianDate.fromIso8601('2026-06-16T14:10:00Z');
  viewer.clock.startTime = start.clone();
  viewer.clock.stopTime = stop.clone();
  viewer.clock.currentTime = start.clone();
  viewer.timeline.zoomTo(start, stop);

  function addDrone(telemetry, { darkDrone = false } = {}) {
    const drone = addDroneTrack(viewer, telemetry, start, stop);
    // threat color coding: Remote-ID-off => red (counter-UAS rule engine)
    drone.path.material = darkDrone
      ? Cesium.Color.RED.withAlpha(0.8)
      : Cesium.Color.CYAN.withAlpha(0.6);
    return drone;
  }

  // 3. Click any entity to follow it (Lattice "follow-any-entity")
  viewer.selectedEntityChanged.addEventListener(e => { viewer.trackedEntity = e; });
  return { viewer, addDrone };
}
```

---

### #12 (BONUS, P1) — `<Detailed>` LOD for Distant Satellites / Far Drones

**Leader source:** drei `<Detailed>` (#34) + Utsubo 100-tips LOD guidance  
**File path:** `killinchu/src/components/SatelliteLOD.jsx` (also reusable for far anatomy meshes)  
**Estimated visual delta:** ★★★ — invisible when done right; keeps frame budget healthy with many distant assets  

```jsx
// killinchu/src/components/SatelliteLOD.jsx
// Distant satellites / far-away drones don't need full geometry.
import { Detailed } from '@react-three/drei';

export function SatelliteLOD({ position }) {
  return (
    <group position={position}>
      <Detailed distances={[0, 50, 200, 1000]}>
        <HighPolySat />        {/* < 50 units: full model */}
        <MedPolySat />         {/* 50-200: simplified */}
        <mesh><icosahedronGeometry args={[1, 1]} /><meshBasicMaterial /></mesh> {/* 200-1000: blob */}
        <mesh><boxGeometry args={[0.5,0.5,0.5]} /><meshBasicMaterial /></mesh>   {/* >1000: a dot */}
      </Detailed>
    </group>
  );
}
```

---

## SECTION 4 — P0/P1/P2 Prioritization

### P0 — Ship Before Launch (Core Visual Quality + Performance Foundation)

| Action | Why P0 | Both spaces? |
|---|---|---|
| Bloom postprocessing | Instant sci-fi quality lift; 10 lines | Both |
| SSS skin/organ material | Anatomy feels organic not plastic | anatomy-3d |
| Breathing YUYAY heart | Emotional core of the anatomy space | anatomy-3d |
| Blood-flow YAWAR particles | Makes vascular system alive | anatomy-3d |
| Animated PENDING wires | Critical UX feedback for state | anatomy-3d |
| KANCHAY organic halo | Unique brand visual; distinguishes us | anatomy-3d |
| 3d-force-graph brain-jack | Core of rosie-3d's identity | rosie-3d |
| KhipuKnot Reidemeister | Rosie's philosophical heart | rosie-3d |
| InstancedMesh vertebrae | Mobile perf; < 50 draw calls required | anatomy-3d |
| frameloop="demand" + PerformanceMonitor | Don't melt mobile GPUs | Both |
| Suspense + lazy mesh | Perceived perf; professional loading | Both |
| gltfjsx -T -S compression | 90% asset size reduction; ship this now | Both |
| visibilitychange pause | Common courtesy; GPU waste prevention | Both |
| ScrollTrigger anatomy layer reveal | Core anatomy-3d interaction | anatomy-3d |
| CesiumJS drone-track scene | Core 3D surface of killinchu drone map | killinchu |
| Deck.gl FAA UAS zone overlay + fleet dots | Table-stakes counter-UAS viz | killinchu |
| Lattice "single operational picture" IA | Information architecture north-star | killinchu |

### P1 — First Month After Launch

| Action | Why P1 |
|---|---|
| GPGPU FBO particles (akella style) | High effort, high impact for dense neural field |
| TSL WebGPU shaders | Future-proof; no urgent need until perf limits hit |
| MorphTarget muscle contraction | Layer 2 of anatomy interactivity |
| Polyhaven HDRI lighting | Replace dynamic lights; huge perf win |
| Nebula background for rosie | Establishes AI-consciousness aesthetic |
| FBM organic noise KANCHAY | Deeper polish; 30 lines but needs testing |
| Thomas attractor GPGPU | 25k GPU particles for rosie ambient field |
| LOD vertebrae | If mobile still lags after P0 instancing |
| Z-Anatomy free assets | More anatomy geometry variety |

### P2 — Future Enhancement

| Action | Why P2 |
|---|---|
| Rapier physics (Bruno Simon style) | High effort; interaction premium |
| Spline integration | Easy wins but adds bundle weight |
| Robin Payot stencil reveal | High polish; low urgency |
| Cytoscape 2D circuit view | Alternate rosie visualization mode |
| Distill.pub Grand Tour | Complex; needs data pipeline |
| DeepDream activation texture | Requires inference integration |
| KhipuKnot topology evolution | Beautiful; not blocking launch |

---

## SECTION 5 — Coordinate-With-Sibling Notes

### 5a — For anatomy-3d V2 (opus_3d_anatomy_v2_human_live_flagships_mpurmx4i)

**TOP 5 P0 ADOPTION ACTIONS TO INTEGRATE BEFORE SHIP:**

1. **SSS Skin Material** — Apply `SubsurfaceScatteringShader` from Three.js addons to all external body surfaces. Use `thicknessColor: (0.9, 0.2, 0.1)` (blood red undertone). File: `anatomy-3d/src/materials/SkinMaterial.js` (code above in #1).

2. **YUYAY Breathing Heart** — Add `useFrame` breathing animation to the YUYAY torus: `scale = 1 + sin(t * 0.25) * 0.04` for breathing + sharp systole pulse at 72 BPM. File: `anatomy-3d/src/components/YuyayHeart.jsx` (code above in #7).

3. **YAWAR Blood Flow** — Add `BloodFlow` particle system along the YAWAR blood vessel curves using `CatmullRomCurve3` + `Points` geometry with per-particle offset animation. Color: `#ff2200`. File: `anatomy-3d/src/components/BloodFlow.jsx` (code above in #2).

4. **InstancedMesh for Vertebrae** — Replace 13 individual vertebra meshes with `<Instances>` from drei. This alone drops draw calls by ~12, pushing total below 50. File: `anatomy-3d/src/components/Spine.jsx` (code above in #10).

5. **Bloom + Animated PENDING Wires** — Add `<EffectComposer><Bloom mipmapBlur luminanceThreshold={1} /></EffectComposer>` to scene root. Add `meshline` animated dashes for PENDING state visualization. Both: ~15 lines each. (Code above in #3 and #4).

**Additional P1 items:**
- KANCHAY FBM halo shader (code in #6 above)
- ScrollTrigger layer-reveal for bone→muscle→organ system
- gltfjsx compression on all GLB assets (90% size reduction)
- Polyhaven studio HDRI to replace dynamic lights

---

### 5b — For rosie-3d (opus_rosie_3d_live_ecosystem_evolve_mpurnx7k)

**TOP 5 P0 ADOPTION ACTIONS TO INTEGRATE BEFORE SHIP:**

1. **3d-force-graph Brain-Jack** — Install `npm install 3d-force-graph` and replace any custom graph renderer with vasturiano's component. Use `nodeThreeObject` for custom glowing spheres, `linkDirectionalParticles: 4` for flowing signals. Colors: nodes `#00ffcc` (active) / `#004488` (inactive). File: `rosie-3d/src/components/BrainJack.jsx` (code above in #9).

2. **KhipuKnot Reidemeister Rotation** — Add `KhipuKnot` component cycling through `[2,3] → [3,4] → [2,5] → [3,5] → [2,7] → [3,7]` TorusKnotGeometry p,q sequences. Purple emissive with bloom. File: `rosie-3d/src/components/KhipuKnot.jsx` (code above in #8).

3. **Bloom + Neural Glow** — Same bloom setup as anatomy-3d but tuned for blue/cyan AI aesthetic. `luminanceThreshold: 1, intensity: 1.8`. All active brain nodes: `emissiveIntensity: 3, toneMapped: false, color: '#00ffcc'`. (Code in #3).

4. **Nebula Background Sphere** — Add a large inverted sphere (camera inside) with FBM noise fragment shader for the "AI consciousness space" background. Colors: deep purple `#1a0033` to electric blue `#0055ff`. ~50 lines GLSL (code sketch in leader #40 above).

5. **GPGPU Thomas Attractor Particles** — Use Maxime Heckel's TSL WebGPU pattern (`spriteNodeMaterial` + `instancedArray` + `wgslFn thomasAttractor`) for 25k ambient particles representing latent space. File: `rosie-3d/src/components/LatentField.jsx` (code in #25 above). Note: requires WebGPU renderer; add WebGL fallback.

**Additional P1 items:**
- Neural flow particles on graph links (same `BloodFlow` component, `color: '#00ffcc'`)
- Thomas attractor GPGPU upgrade from plain FBO to TSL compute
- `frameloop="demand"` + PerformanceMonitor for complex graph scene
- gltfjsx compression on any GLTF assets

---

### 5c — For the Killinchu / Wamani drone-tracking agent (the Vessels→air pivot)

> This sibling note did not exist in round 1 — it is added now because the founder directive (`470_WAMANI_DRONE_PIVOT_PLAN.md`, 2026-06-01) pivots `vessels` into an air-domain drone-intelligence flagship (Killinchu/Wamani). Its 3D surface needs a geospatial stack distinct from anatomy-3d/rosie-3d. If/when a dedicated killinchu 3D agent is dispatched, hand it these three P0 snippets.

**TOP 3 P0 ADOPTION ACTIONS TO INTEGRATE:**

1. **CesiumJS time-dynamic drone tracking** — Stand up a CesiumJS `Viewer` with timeline + animation, feed live telemetry into a `SampledPositionProperty`, set `orientation: new VelocityOrientationProperty(position)` so the model auto-points along its heading, and `viewer.trackedEntity = drone` for the chase-cam. Files: `killinchu/src/cesium/DroneTrack.js` + `DroneScene.js` (code in leader #43 and Top-recipe #11). Source: [Cesium time-dynamic data tutorial](https://cesium.com/learn/ion/stories-time-dynamic/), [VelocityOrientationProperty ref-doc](https://cesium.com/learn/cesiumjs/ref-doc/VelocityOrientationProperty.html).

2. **Deck.gl layered FAA + fleet + swarm viz** — Add a `GeoJsonLayer` for the FAA UAS Facility Map / LAANC ceiling grid (ArcGIS open data), a `ScatterplotLayer` (with `transitions.getPosition`) for the live drone fleet color-coded by Remote-ID status (Remote-ID-off = red "dark drone"), and an `ArcLayer` for swarm leader↔follower links. File: `killinchu/src/deck/layers.js` (code in leader #45). Source: [deck.gl ScatterplotLayer](https://deck.gl/docs/api-reference/layers/scatterplot-layer), [ArcLayer](https://deck.gl/docs/api-reference/layers/arc-layer), [FAA UAS Facility Maps](https://www.faa.gov/uas/commercial_operators/uas_facility_maps).

3. **Anduril Lattice "single unified operational picture" IA** — Make one CesiumJS globe the home screen; every asset is a typed, colored Geo-Entity (friendly/neutral/threat); accept KML/GeoJSON/CoT/STANAG ingest (matches SZL's Remote-ID/ADS-B/STANAG-4609 parsers in the pivot plan); click-to-follow any entity + scrub the mission clock; surface each detection/HALT as a clickable Λ/Khipu-receipt annotation. This is a design pattern, not an install — it governs how #1 and #2 compose. Source: [Wind River on Lattice data standards](https://www.windriver.com/blog/Accelerating-Safety-Critical-Innovation-Wind-River-Anduril), [Bilawal Sidhu on Lattice fusion](https://www.spatialintelligence.ai/p/soldiers-can-now-see-through-walls).

**Additional P1 items:**
- Mapbox/MapLibre + threebox branded basemap with 3D glTF drone models (leader #44) — reuses vessels' existing OpenFreeMap tiles.
- drei `<Detailed>` LOD for distant satellites/far drones (Top-recipe #12).
- Bloom + emissive on active/threat entities to make alerts pop (leader #9).
- Reuse the rosie-3d `BrainJack` 3d-force-graph for the swarm-topology graph view (clustered Remote-ID broadcasts → leader/follower roles per the pivot plan).

**Cross-anatomy tie-in:** Per the pivot plan, Wamani/Killinchu keeps the **YAWAR (blood/ledger)** organ role plus an **OTel VSP (nervous system)** role — so its receipts should chain into the same Khipu DAG that 3D Anatomy V2 visualizes, and it becomes a node in rosie-3d's brain-jack mesh (Wire G fans out to it). Coordinate entity-color and receipt-annotation conventions with both sibling agents so the three Spaces stay visually consistent.

---

## Appendix — Key Sources Index

| Source | URL | Relevance |
|---|---|---|
| Three.js r160 features 2026 | https://digitalstrategyforce.com/journal/what-does-threejs-r160-mean-for-web-developers-in-2026/ | WebGPU, BatchedMesh, Draco v3 |
| Three.js 2026 state of WebGPU | https://www.utsubo.com/blog/threejs-2026-what-changed | Safari 26 WebGPU, r171 zero-config |
| R3F Scaling Performance | https://r3f.docs.pmnd.rs/advanced/scaling-performance | PerformanceMonitor, frameloop, Instances |
| Codrops Three.js tag | https://tympanus.net/codrops/tag/three-js/ | 18 tutorials 2024-2026 |
| Codrops metaball tutorial | https://tympanus.net/codrops/2025/06/09/how-to-create-interactive-droplet-like-metaballs-with-three-js-and-glsl/ | Ray marching, smoothMin SDF |
| Codrops R3F performance 2025 | https://tympanus.net/codrops/2025/02/11/building-efficient-three-js-scenes-optimize-performance-while-maintaining-quality/ | DPR, InstancedMesh, gltfjsx |
| Bruno Simon portfolio | https://bruno-simon.com | Driving-world, physics feel |
| react-spline GitHub | https://github.com/splinetool/react-spline | Design→React pipeline |
| 3d-force-graph GitHub | https://github.com/vasturiano/3d-force-graph | Brain-jack network mesh |
| Maxime Heckel TSL/WebGPU guide | https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/ | Compute shaders, particle systems |
| Utsubo 100 Three.js tips | https://www.utsubo.com/blog/threejs-best-practices-100-tips | Best practices aggregation |
| MeshLine animated tutorial | https://waelyasmina.net/articles/animating-lines-and-curves-in-three-js-with-meshline/ | Animated dashed lines |
| Codrops animated mesh lines | https://tympanus.net/codrops/2019/01/08/animated-mesh-lines/ | dashOffset animation |
| react-postprocessing Bloom | https://react-postprocessing.docs.pmnd.rs/effects/bloom | Bloom postprocessing |
| Three.js SSS shader | https://threejs.org/docs/pages/module-SubsurfaceScatteringShader.html | Skin translucency |
| Anthropic feature visualization | https://www.anthropic.com/research/mapping-mind-language-model | Neural concept mapping |
| BioDigital Human | https://www.biodigital.com | Anatomy gold standard |
| Visible Body | https://www.visiblebody.com | Anatomy UX patterns |
| Z-Anatomy | https://www.z-anatomy.com | Free anatomy assets |
| Elsevier Complete Anatomy | https://www.elsevier.com/products/complete-anatomy | MorphTarget animations |
| TurboSquid anatomy | https://www.turbosquid.com/3d-model/anatomy | 3D model assets |
| Polyhaven HDRIs | https://polyhaven.com/hdris/ | Free CC0 environment maps |
| drei Instances docs | https://drei.docs.pmnd.rs/performances/instances | Declarative instancing |
| Three.js BatchedMesh docs | https://threejs.org/docs/pages/BatchedMesh.html | Multi-geometry batching |
| Cytoscape.js WebGL | https://blog.js.cytoscape.org/2025/01/13/webgl-preview/ | Network graph WebGL |
| Halo/glow shader | http://stemkoski.blogspot.com/2013/07/shaders-in-threejs-glow-and-halo.html | Fresnel halo effect |
| Active Theory Neve nebula | https://medium.com/active-theory/neve-webgl-and-vr-d42a25856d67 | Nebula space background |
| GSAP with Cassie Evans 2025 | https://www.youtube.com/watch?v=shotcE73Vns | Animation choreography |
| WebGPU vs WebGL 2026 | https://blog.openreplay.com/webgpu-vs-webgl-industry-moving/ | When to use each |
| Distill.pub Grand Tour | https://distill.pub/2020/grand-tour | Neural network 3D projection |
| akella GitHub | https://github.com/akella | GPGPU FBO particles |
| Three.js TubeGeometry | https://threejs.org/docs/pages/TubeGeometry.html | Vessel/flow paths |
| WebGPU Baseline 2026 | https://vr.org/articles/webgpu-baseline-2026-three-js-webxr-default | WebGPU now default in all browsers |
| Utsubo WebGPU+Three.js migration 2026 | https://www.utsubo.com/blog/webgpu-threejs-migration-guide | r171 one-line WebGPU swap, browser matrix |
| CesiumJS time-dynamic data (drone follow) | https://cesium.com/learn/ion/stories-time-dynamic/ | Drone/aircraft follow, timeline |
| CesiumJS VelocityOrientationProperty | https://cesium.com/learn/cesiumjs/ref-doc/VelocityOrientationProperty.html | Auto-orient model to heading |
| Cesium Community — follow drone live | https://community.cesium.com/t/follow-drone-flight-in-real-time/31805 | Real-time drone tracking |
| Mapbox — 3D model with three.js | https://docs.mapbox.com/mapbox-gl-js/example/add-3d-model/ | Three.js custom layer on Mapbox |
| Mapbox — 3D model with threebox | https://docs.mapbox.com/mapbox-gl-js/example/add-3d-model-threebox/ | threebox camera-sync |
| deck.gl ScatterplotLayer | https://deck.gl/docs/api-reference/layers/scatterplot-layer | Live fleet dots + transitions |
| deck.gl ArcLayer | https://deck.gl/docs/api-reference/layers/arc-layer | Swarm leader/follower arcs |
| deck.gl Tile3DLayer + TerrainController | https://deck.gl/docs/developer-guide/base-maps/using-with-3d-tiles | 3D terrain tiles |
| FAA UAS Facility Maps (ArcGIS open data) | https://www.faa.gov/uas/commercial_operators/uas_facility_maps | LAANC ceiling grid GeoJSON |
| FAA UAS Data Exchange (LAANC) | https://www.faa.gov/uas/getting_started/laanc | Airspace authorization data |
| Wind River — Anduril Lattice integration | https://www.windriver.com/blog/Accelerating-Safety-Critical-Innovation-Wind-River-Anduril | Lattice data standards (KML/GeoJSON/CoT/STANAG) |
| Wired — Anduril operating system for war | https://www.wired.com/story/behind-anduril-effort-create-operating-system-war/ | Lattice 3D operational picture |
| Bilawal Sidhu — Lattice sensor fusion | https://www.spatialintelligence.ai/p/soldiers-can-now-see-through-walls | One coherent 3D model from all sensors |

---

*End of 450_3D_LEADERS_ADOPTION.md — **46** leaders/techniques documented (42 round 1 + 4 drone-tracking leaders #43–46), **12** adoption recipes with paste-ready code (10 core + CesiumJS drone recipe #11 + LOD recipe #12), **3** sibling-coordination payloads in Section 5 (5a anatomy-3d, 5b rosie-3d, 5c killinchu).*
