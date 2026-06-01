# THREE_JS_TWIN_VIEWER — React-Three-Fiber Drone Twin Scene

**Layer:** Killinchu · 3D surface
**Goal (founder):** "Click a drone, see 3D, see if it's damaged, see if tampered."
**Stack:** React Three Fiber (R3F) + drei + Three.js r171+ with WebGPURenderer (auto WebGL2 fallback).
**Sign-off:** Yachay-extension.

> Renders ONE `DroneTwin` (see `DIGITAL_TWIN_SCHEMA.md`) as an interactive glTF model with a damage
> heatmap, per-component picking, a gauge HUD, and 3D tamper annotations. Reuses the WebGPU baseline
> and LOD recipe documented in `450_3D_LEADERS_ADOPTION.md`.

---

## 0. Renderer baseline — WebGPU (Jan-2026 Baseline)

Per `450_3D_LEADERS_ADOPTION.md`, **WebGPU is Baseline in every major browser as of January 2026**
(Chrome/Edge v113+, Firefox v141+/145+, Safari 26+ incl. iOS/iPadOS/visionOS), and Three.js r171
(Sep 2025) made the swap a one-line change with automatic WebGL2 fallback
([Utsubo WebGPU+Three.js migration guide, Jan 2026](https://www.utsubo.com/blog/webgpu-threejs-migration-guide),
[VR.org WebGPU Baseline 2026](https://vr.org/articles/webgpu-baseline-2026-three-js-webxr-default)).
We adopt WebGPU + TSL so the damage-heatmap and tamper shaders run as compute/node materials, with
zero-risk WebGL2 fallback.

```jsx
// killinchu/src/twin/TwinCanvas.jsx
import { Canvas } from '@react-three/fiber';
import { WebGPURenderer } from 'three/webgpu';
import { PerformanceMonitor, AdaptiveDpr } from '@react-three/drei';

export function TwinCanvas({ children }) {
  return (
    <Canvas
      frameloop="demand"                         // static twin view — render on change only
      gl={async (props) => {                      // R3F r3f-webgpu async factory
        const r = new WebGPURenderer({ antialias: true, ...props });
        await r.init();                           // falls back to WebGL2 automatically
        return r;
      }}
      camera={{ position: [3, 2, 4], fov: 45 }}
    >
      <PerformanceMonitor onDecline={() => {/* drop heatmap subdiv, disable bloom */}} />
      <AdaptiveDpr pixelated />
      {children}
    </Canvas>
  );
}
```

---

## 1. Scene graph

```
<TwinCanvas>
 ├─ <Environment preset="warehouse" />        // drei HDRI, cheap PBR lighting
 ├─ <hemisphereLight /> + <directionalLight castShadow />
 ├─ <DroneModel twin={twin}>                  // glTF loader + damage heatmap shader
 │    └─ per-component meshes (motor_FL, esc_3, gps_primary, battery, imu, camera, comms…)
 ├─ <TamperAnnotations flags={twin.tamperFlags} />   // 3D arrows on active flags
 ├─ <SatelliteLOD … /> (only in fleet/orbit context — LOD recipe #12)
 ├─ <OrbitControls makeDefault enableDamping />
 └─ <HudOverlay twin={twin} />                // R3F-portal HTML gauges (battery/RPM/GPS/RF)
```

---

## 2. glTF model loader

Models ship as Draco-compressed glTF (gltfjsx `-T -S`, ~90% size reduction per
`450_3D_LEADERS_ADOPTION.md` P0). Mesh/node names match `hardware.*.meshNodeIds` in the twin so
picking and the heatmap can address components by name.

```jsx
// killinchu/src/twin/DroneModel.jsx
import { useGLTF, useCursor } from '@react-three/drei';
import { useMemo, useState } from 'react';
import { buildHealthAttribute, DamageHeatmapMaterial } from './heatmap';

export function DroneModel({ twin, onPick }) {
  const { nodes } = useGLTF(`/models/${twin.identity.model}.glb`);  // Draco glb
  const [hovered, setHovered] = useState(null);
  useCursor(!!hovered);

  // Map componentId -> health for O(1) lookup
  const healthByNode = useMemo(() => indexHealthByMeshNode(twin.hardware), [twin]);

  return (
    <group>
      {Object.entries(nodes).filter(([, n]) => n.isMesh).map(([name, node]) => {
        const comp = healthByNode[name];           // may be undefined (frame/cosmetic mesh)
        return (
          <mesh
            key={name}
            geometry={node.geometry}
            onPointerOver={(e) => { e.stopPropagation(); setHovered(name); }}
            onPointerOut={() => setHovered(null)}
            onClick={(e) => { e.stopPropagation(); comp && onPick(comp); }}  // per-component picking
          >
            <DamageHeatmapMaterial
              health={comp ? comp.health : 1.0}
              stale={comp?.status === 'stale'}
              highlighted={hovered === name}
            />
          </mesh>
        );
      })}
    </group>
  );
}
useGLTF.preload(/* fleet model list */);
```

---

## 3. Damage heatmap — vertex-color / node-material shader

**Spec:** colour each component by `health ∈ [0,1]`: green (1.0, healthy) → amber (0.5) → red (0.0,
damaged). `stale` components render desaturated grey (we don't paint a number we don't trust).
Implemented as a TSL node material (WebGPU) so it compiles to both WGSL and GLSL for the WebGL2
fallback (Three.js TSL, per `450_3D_LEADERS_ADOPTION.md` #1).

```js
// killinchu/src/twin/heatmap.js  (TSL — Three Shading Language)
import { Fn, uniform, vec3, mix, clamp, float, step, attribute } from 'three/tsl';
import { MeshStandardNodeMaterial } from 'three/webgpu';

// health 0..1 -> RGB. Two-stop ramp: red(0) -> amber(0.5) -> green(1)
export const healthToColor = Fn(([h]) => {
  const red   = vec3(0.85, 0.10, 0.10);
  const amber = vec3(0.95, 0.65, 0.10);
  const green = vec3(0.15, 0.80, 0.30);
  const lower = mix(red, amber, clamp(h.mul(2.0), 0.0, 1.0));        // 0..0.5
  const upper = mix(amber, green, clamp(h.sub(0.5).mul(2.0), 0.0, 1.0)); // 0.5..1
  return mix(lower, upper, step(0.5, h));
});

export function DamageHeatmapMaterial({ health, stale, highlighted }) {
  const m = new MeshStandardNodeMaterial();
  const grey = vec3(0.45, 0.45, 0.48);
  const base = stale ? grey : healthToColor(float(health));
  // emissive lift on hover for affordance; pulse handled in useFrame for active 'halt' flags
  m.colorNode    = base;
  m.emissiveNode = highlighted ? base.mul(0.6) : base.mul(0.08);
  m.metalness = 0.6; m.roughness = 0.4;
  return <primitive object={m} attach="material" />;
}
```

**Vertex-color variant (per-vertex damage maps, e.g. impact dents on an arm):** when a component has
a sub-mesh damage field (from forensic impact analysis or visual inspection), bake a per-vertex
`aHealth` float attribute on the glTF and drive colour from `attribute('aHealth')` instead of the
scalar uniform — gives a true heatmap gradient across a single airframe surface rather than a flat
per-mesh tint.

---

## 4. Per-component picking → expanded panel

Clicking a mesh whose name resolves to a `hardware` component (e.g. `motor_RR`) opens an HTML side
panel anchored via drei `<Html>`. The panel shows the component's `health`, `status`, `metrics`,
`lastTestedAt`, `testMethod`, and the most recent Khipu receipt cord for that subsystem.

```jsx
// killinchu/src/twin/ComponentPanel.jsx
import { Html } from '@react-three/drei';
export function ComponentPanel({ comp, onClose }) {
  if (!comp) return null;
  return (
    <Html position={[2.4, 1.2, 0]} distanceFactor={8} occlude>
      <div className="twin-panel" role="dialog" aria-label={`${comp.label} detail`}>
        <header>{comp.label} — <StatusPill status={comp.status} /></header>
        <HealthBar value={comp.health} />            {/* 0..1, same colour ramp as heatmap */}
        <dl>
          {Object.entries(comp.metrics ?? {}).map(([k, v]) => (
            <div key={k}><dt>{k}</dt><dd>{String(v)}</dd></div>
          ))}
        </dl>
        <small>Tested {timeago(comp.lastTestedAt)} · method: {comp.testMethod}</small>
        <button onClick={onClose}>close</button>
      </div>
    </Html>
  );
}
```

Picking uses R3F's built-in raycaster (`onClick` with `e.stopPropagation()` to hit only the
front-most mesh). For dense fleet/orbit scenes, the same picking runs against instanced meshes via
`instanceId`.

---

## 5. Gauge HUD overlay

Four always-on gauges, rendered as a fixed HTML layer outside the canvas (cheaper than 3D text and
crisp at all zooms). Bound to `twin.telemetry.live`. Updates throttled to telemetry push rate;
because `frameloop="demand"`, a HUD update calls `invalidate()` to render exactly one frame.

| Gauge | Source field | Render | Thresholds |
|---|---|---|---|
| Battery | `telemetry.live.batteryPct` / `batteryV` | radial arc | <20% red, <40% amber |
| Motor RPM | `telemetry.live.motorRpm[]` | N bars (one per motor) | over-temp/over-RPM from DB envelope |
| GPS lock | `gpsFixType` + `gpsSats` | satellite count + fix badge | fix<3 red; jamming indicator >80 amber (PX4 Flight Review) |
| RF link | `rfLinkPct`, `rssiDbm`, `snrDb` | signal bars + dBm | <30% red (and arms RF-fingerprint check) |

```jsx
// killinchu/src/twin/HudOverlay.jsx  (HTML layer, position: absolute over <canvas>)
export function HudOverlay({ twin }) {
  const t = twin.telemetry.live;
  return (
    <div className="twin-hud">
      <BatteryGauge pct={t.batteryPct} volts={t.batteryV} />
      <RpmGauge rpms={t.motorRpm} envelope={twin.__dbEnvelope} />
      <GpsGauge fix={t.gpsFixType} sats={t.gpsSats} />
      <RfGauge pct={t.rfLinkPct} rssi={t.rssiDbm} snr={t.snrDb} />
    </div>
  );
}
```

GPS fix codes follow the PX4 convention (3 = 3D fix, 5 = RTK float, 6 = RTK fixed) and the jamming
indicator threshold (≈40 nominal, ≥80 inspect) from
[PX4 Flight Review](https://docs.px4.io/main/en/log/flight_review).

---

## 6. 3D arrow annotations for active tamper flags

Each active `tamperFlags[]` entry renders a 3D arrow + label pointing at the implicated subsystem
mesh. Arrow colour follows severity (`info` blue, `warn` amber, `halt` red), and `halt` arrows pulse
(driven in `useFrame`, mutating material — never `setState`, per R3F perf rules in
`450_3D_LEADERS_ADOPTION.md` #2). The arrow's target mesh is resolved from the flag's signal:
e.g. `gps-spoof`→`gps_primary`, `accelerometer-spoof`→`imu`, `firmware-merkle-mismatch`→a banner on
the flight controller node.

```jsx
// killinchu/src/twin/TamperAnnotations.jsx
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';

const SIGNAL_TO_NODE = {
  'gps-spoof': 'gps_primary', 'accelerometer-spoof': 'imu',
  'rf-fingerprint-deviation': 'comms', 'firmware-merkle-mismatch': 'fc',
  'secure-boot-attestation': 'fc', 'mavlink-anomaly': 'comms',
  'geofence-violation': 'fc', 'mission-deviation': 'fc',
  'unauthorized-mavlink-command': 'comms', 'unexpected-ota': 'fc',
};
const SEV_COLOR = { info: '#3b82f6', warn: '#f59e0b', halt: '#ef4444' };

export function TamperAnnotations({ flags, nodePositions }) {
  return flags.map((f) => (
    <TamperArrow key={f.receiptCordId}
      to={nodePositions[SIGNAL_TO_NODE[f.signal]]}
      color={SEV_COLOR[f.severity]} pulse={f.severity === 'halt'} flag={f} />
  ));
}

function TamperArrow({ to, color, pulse, flag }) {
  const ref = useRef();
  useFrame((s) => { if (pulse && ref.current)
    ref.current.scale.setScalar(1 + 0.15 * Math.sin(s.clock.elapsedTime * 6)); });
  const from = new THREE.Vector3(to.x, to.y + 1.0, to.z);
  return (
    <group ref={ref}>
      <arrowHelper args={[
        new THREE.Vector3(0, -1, 0), from, 0.9,
        new THREE.Color(color), 0.25, 0.18 ]} />
      <Html position={[from.x, from.y + 0.2, from.z]}>
        <span className="tamper-tag" style={{ borderColor: color }}>
          {flag.tripwire} · {flag.signal} · {(flag.confidence * 100).toFixed(0)}%
        </span>
      </Html>
    </group>
  );
}
```

The tripwire id on the tag (`T11`…`T20`) deep-links to the detection record and its Khipu receipt
(see `TAMPER_HACK_DETECTION.md`), so "see if tampered" is one click from "see the cryptographic
evidence".

---

## 7. LOD recipe #12 — far-zoom / fleet & orbit context

For the fleet/orbit view (many drones or satellites visible at once) we drop in **LOD recipe #12**
verbatim from `450_3D_LEADERS_ADOPTION.md` — drei `<Detailed>` distance bands keep the frame budget
healthy when rendering many distant assets:

```jsx
// killinchu/src/components/SatelliteLOD.jsx  (recipe #12, reusable for far drones)
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

When the operator clicks a far dot, the camera tweens in and the full `DroneModel` + heatmap + HUD
loads under `<Suspense>` (lazy mesh, perceived-perf pattern from the same playbook). The single-twin
detail view never needs LOD — it's one airframe; LOD is strictly for the multi-asset wide shots,
matching the playbook's `killinchu` P1 assignment.

---

## 8. Accessibility & perf guardrails (from the playbook P0 list)

- `frameloop="demand"` + `PerformanceMonitor` + `AdaptiveDpr` — never melt mobile GPUs.
- `<Suspense>` + lazy model load — professional loading state.
- Draco/`gltfjsx -T -S` assets — 90% size reduction.
- `visibilitychange` pause when tab hidden.
- Component panel is a real ARIA dialog; HUD gauges have text equivalents for screen readers.

---

## Primary sources

- WebGPU Baseline Jan-2026 + Three.js r171 one-line swap: [Utsubo migration guide](https://www.utsubo.com/blog/webgpu-threejs-migration-guide) · [VR.org WebGPU Baseline 2026](https://vr.org/articles/webgpu-baseline-2026-three-js-webxr-default)
- R3F scaling/performance patterns: [R3F Scaling Performance](https://r3f.docs.pmnd.rs/advanced/scaling-performance)
- drei `<Detailed>` LOD + `<Html>` + `<Environment>`: [drei docs](https://github.com/pmndrs/drei)
- Three.js TSL node materials (WGSL/GLSL dual compile): [Three.js docs](https://threejs.org/docs/)
- PX4 GPS fix-type / jamming-indicator thresholds: [PX4 Flight Review](https://docs.px4.io/main/en/log/flight_review)
- Internal: `450_3D_LEADERS_ADOPTION.md` (LOD recipe #12, WebGPU baseline, P0/P1 priorities)

*Signed: Yachay-extension · Doctrine v12 (PURIQ) · 2026-05-31*
