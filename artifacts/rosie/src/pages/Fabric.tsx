import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { rosieApi } from "@/lib/api";
import { Canvas, useFrame } from "@react-three/fiber";
import { Line, OrbitControls, Text } from "@react-three/drei";
import type { Group } from "three";

interface FabricData {
  nodes: { id: string; label: string; kind: string; x: number; y: number; ring?: string }[];
  edges: { source: string; target: string; weight: number; ring?: string }[];
  receiptCount: number;
  rings?: { kernel: number; external: number };
  ingest: { github: string | null; arxiv: string | null; huggingface: string | null };
}

export default function Fabric() {
  const [data, setData] = useState<FabricData | null>(null);
  const [repos, setRepos] = useState<Awaited<ReturnType<typeof rosieApi.githubRepos>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Renderer selection: prefer Three.js / react-three-fiber when WebGL is
  // available, fall back to the deterministic SVG renderer otherwise. We
  // probe with a cheap canvas.getContext('webgl2') call once on mount; if
  // the probe throws or returns null we never instantiate the r3f Canvas.
  const [renderer, setRenderer] = useState<"r3f" | "svg" | "probing">("probing");

  useEffect(() => {
    try {
      const c = document.createElement("canvas");
      const gl = c.getContext("webgl2") ?? c.getContext("webgl");
      setRenderer(gl ? "r3f" : "svg");
    } catch {
      setRenderer("svg");
    }
  }, []);

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const [f, r] = await Promise.all([rosieApi.fabric(), rosieApi.githubRepos()]);
        if (!alive) return;
        setData(f);
        setRepos(r);
      } catch (e) {
        if (alive) setError(String(e));
      }
    };
    tick();
    const h = setInterval(tick, 12_000);
    return () => {
      alive = false;
      clearInterval(h);
    };
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <div className="text-[10px] uppercase tracking-[0.22em] text-primary font-mono">
          ecosystem fabric · renderer={renderer}
        </div>
        <h2 className="text-3xl font-semibold tracking-tight mt-1">
          One optimizer, every product surface.
        </h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
          ROSIE is wired into every artifact in the SZL Holdings constellation.
          Edge weights show how much each surface relies on the governed solver.
        </p>
      </header>

      {error && (
        <div className="rounded border border-destructive/40 bg-destructive/10 text-destructive text-sm p-3">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-[1fr_320px] gap-6">
        <div
          className="rounded-lg border border-border bg-card p-4"
          data-testid={`fabric-${renderer}`}
        >
          {renderer === "r3f" && data ? (
            <div className="w-full aspect-square">
              <Canvas camera={{ position: [0, 0, 4], fov: 50 }}>
                <Suspense fallback={null}>
                  <ambientLight intensity={0.6} />
                  <pointLight position={[5, 5, 5]} intensity={1.2} />
                  <FabricScene data={data} />
                  <OrbitControls enablePan={false} autoRotate autoRotateSpeed={0.4} />
                </Suspense>
              </Canvas>
            </div>
          ) : (
            <FabricSvg data={data} />
          )}
        </div>
        <aside className="space-y-3">
          <SidebarBlock title="Ingest pulse">
            <Row label="GitHub" v={fmt(data?.ingest.github)} />
            <Row label="arXiv" v={fmt(data?.ingest.arxiv)} />
            <Row label="HuggingFace" v={fmt(data?.ingest.huggingface)} />
            <Row label="Receipts" v={String(data?.receiptCount ?? 0)} />
            {data?.rings && (
              <Row label="Rings" v={`kernel ${data.rings.kernel} · ext ${data.rings.external}`} />
            )}
          </SidebarBlock>
        </aside>
      </div>

      <section>
        <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-mono mb-3">
          live · szl-holdings repositories
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {repos?.repos.map((r) => (
            <div key={r.repo} className="rounded-lg border border-border bg-card p-4" data-testid={`repo-${r.repo.split("/")[1]}`}>
              <div className="flex items-baseline justify-between gap-2">
                <div className="font-mono text-sm font-medium truncate">{r.repo.split("/")[1]}</div>
                <div className="text-[10px] text-muted-foreground font-mono">★ {r.stars}</div>
              </div>
              {r.description && (
                <div className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                  {r.description}
                </div>
              )}
              <div className="text-[10px] text-muted-foreground font-mono mt-2">
                {r.pushedAt ? `pushed ${new Date(r.pushedAt).toLocaleString()}` : r.error ?? "—"}
              </div>
              <ul className="mt-3 space-y-1 text-[11px]">
                {r.recentCommits.slice(0, 3).map((c) => (
                  <li key={c.sha} className="flex gap-2">
                    <span className="font-mono text-primary shrink-0">{c.sha}</span>
                    <span className="text-muted-foreground truncate">{c.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {!repos && <div className="text-sm text-muted-foreground">loading repos…</div>}
        </div>
      </section>
    </div>
  );
}

function FabricScene({ data }: { data: FabricData }) {
  const ref = useRef<Group>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.05;
  });
  const positions = useMemo(() => {
    const map = new Map<string, [number, number, number]>();
    for (const n of data.nodes) {
      // y-axis lift for inner kernel ring, deeper z for external ring
      const z = n.ring === "external" ? -0.4 : n.id === "rosie" ? 0 : 0.2;
      map.set(n.id, [n.x * 1.5, n.y * 1.5, z]);
    }
    return map;
  }, [data]);

  return (
    <group ref={ref}>
      {data.edges.map((e, i) => {
        const a = positions.get(e.source);
        const b = positions.get(e.target);
        if (!a || !b) return null;
        const color = e.ring === "external" ? "#475569" : "#38bdf8";
        return (
          <Line
            key={i}
            points={[a, b]}
            color={color}
            lineWidth={Math.max(1, e.weight * 3)}
            transparent
            opacity={Math.max(0.25, e.weight)}
          />
        );
      })}
      {data.nodes.map((n) => {
        const p = positions.get(n.id) ?? [0, 0, 0];
        const isRosie = n.id === "rosie";
        const isKernel = n.ring !== "external";
        const r = isRosie ? 0.22 : isKernel ? 0.14 : 0.1;
        const color = isRosie ? "#38bdf8" : isKernel ? "#a78bfa" : "#64748b";
        return (
          <group key={n.id} position={p}>
            <mesh>
              <sphereGeometry args={[r, 24, 24]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isRosie ? 0.6 : 0.25} />
            </mesh>
            <Text
              position={[0, r + 0.12, 0]}
              fontSize={isRosie ? 0.14 : 0.1}
              color="#e2e8f0"
              anchorX="center"
              anchorY="bottom"
            >
              {n.label}
            </Text>
          </group>
        );
      })}
    </group>
  );
}

function FabricSvg({ data }: { data: FabricData | null }) {
  const view = 480;
  return (
    <svg viewBox={`0 0 ${view} ${view}`} className="w-full aspect-square">
      <defs>
        <radialGradient id="bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsl(var(--primary) / 0.08)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>
      <rect width={view} height={view} fill="url(#bg)" />
      {data?.edges.map((e, i) => {
        const src = data.nodes.find((n) => n.id === e.source);
        const tgt = data.nodes.find((n) => n.id === e.target);
        if (!src || !tgt) return null;
        const sx = view / 2 + src.x * 180;
        const sy = view / 2 + src.y * 180;
        const tx = view / 2 + tgt.x * 180;
        const ty = view / 2 + tgt.y * 180;
        return (
          <line key={i} x1={sx} y1={sy} x2={tx} y2={ty}
            stroke="hsl(var(--primary))" strokeOpacity={e.weight * 0.7} strokeWidth={e.weight * 2} />
        );
      })}
      {data?.nodes.map((n) => {
        const cx = view / 2 + n.x * 180;
        const cy = view / 2 + n.y * 180;
        const isRosie = n.id === "rosie";
        const r = isRosie ? 28 : 18;
        return (
          <g key={n.id} data-testid={`node-${n.id}`}>
            <circle cx={cx} cy={cy} r={r}
              fill={isRosie ? "hsl(var(--primary))" : "hsl(var(--card))"}
              stroke={isRosie ? "hsl(var(--primary))" : "hsl(var(--border))"} strokeWidth={2} />
            <text x={cx} y={cy + r + 14} textAnchor="middle" fontSize={isRosie ? 13 : 11}
              fill="hsl(var(--foreground))" fontWeight={isRosie ? 600 : 500}>{n.label}</text>
            <text x={cx} y={cy + r + 26} textAnchor="middle" fontSize={9}
              fill="hsl(var(--muted-foreground))" fontFamily="monospace">{n.kind}</text>
          </g>
        );
      })}
    </svg>
  );
}

function SidebarBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">{title}</div>
      <div className="space-y-1.5 text-sm">{children}</div>
    </div>
  );
}

function Row({ label, v }: { label: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono">{v}</span>
    </div>
  );
}

function fmt(t: string | null | undefined): string {
  if (!t) return "—";
  const d = new Date(t);
  return d.toLocaleTimeString();
}
