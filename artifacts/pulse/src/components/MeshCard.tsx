import { useEffect, useState } from "react";
import { ExternalLink, Network, AlertTriangle, TrendingDown, TrendingUp, Clock, Shield } from "lucide-react";
import { useMeshSnapshot } from "../lib/mesh-bridge";

interface MeshIndex {
  overall: number;
  grade: "A" | "B" | "C" | "D" | "F";
  topExposure: string | null;
  pendingApprovals: number;
  openExposures: number;
  computedAt: string;
  trend: number;
  source: "live" | "seed";
}

const SEED_OVERALL = 38;

function gradeFor(overall: number): MeshIndex["grade"] {
  if (overall >= 90) return "A";
  if (overall >= 75) return "B";
  if (overall >= 60) return "C";
  if (overall >= 40) return "D";
  return "F";
}

function useMeshIndex(): MeshIndex {
  // Start from the cross-tab mesh-bridge snapshot (seeded from localStorage,
  // updated by Sentra's exposure remediation flow). This keeps the live
  // remediation interactivity from main while we also try the live API.
  const bridge = useMeshSnapshot();
  const seed: MeshIndex = {
    overall: bridge.index,
    grade: bridge.grade,
    trend: bridge.trend,
    topExposure: bridge.topExposure,
    pendingApprovals: bridge.pendingApprovals,
    openExposures: bridge.openExposures,
    computedAt: bridge.computedAt,
    source: "seed",
  };
  const [data, setData] = useState<MeshIndex>(seed);
  const [isLive, setIsLive] = useState(false);

  // Keep in sync with the bridge snapshot when no live override is active.
  useEffect(() => {
    if (!isLive) setData(seed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bridge.index, bridge.grade, bridge.trend, bridge.openExposures, bridge.pendingApprovals, bridge.topExposure, bridge.computedAt, isLive]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/agent-mesh/index", { credentials: "include" });
        if (!res.ok) return;
        const live = await res.json() as Partial<MeshIndex> & { overall: number };
        if (cancelled || typeof live.overall !== "number") return;
        const overall = Math.round(live.overall);
        setData({
          overall,
          grade: live.grade ?? gradeFor(overall),
          topExposure: live.topExposure ?? "No critical mesh exposures detected",
          pendingApprovals: live.pendingApprovals ?? 0,
          openExposures: live.openExposures ?? 0,
          computedAt: live.computedAt ?? new Date().toISOString(),
          trend: overall - SEED_OVERALL,
          source: "live",
        });
        setIsLive(true);
      } catch {
        // keep bridge/seed
      }
    })();
    return () => { cancelled = true; };
  }, []);
  return data;
}

const GRADE_COLOR: Record<string, string> = {
  A: "#4eca8b",
  B: "#5090e8",
  C: "#c8a84b",
  D: "#e08c40",
  F: "#e05050",
};

export default function MeshCard() {
  const MESH_DATA = useMeshIndex();
  const gradeColor = GRADE_COLOR[MESH_DATA.grade] ?? "#e05050";
  const sentraHref = "/sentra/mesh/map";
  const TrendIcon = MESH_DATA.trend >= 0 ? TrendingUp : TrendingDown;

  return (
    <div style={{
      background: "var(--pulse-card)",
      border: "1px solid rgba(224,80,80,0.2)",
      borderLeft: "3px solid #e05050",
      borderRadius: 6,
      padding: "16px 18px",
      marginBottom: 8,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Network size={13} color="#e05050" />
          <span style={{
            fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em",
            textTransform: "uppercase", color: "var(--pulse-text-muted)",
          }}>
            Sentra · Agent Mesh Status
          </span>
          <span style={{
            fontSize: "0.6rem", padding: "1px 5px", borderRadius: 3,
            background: "rgba(224,80,80,0.12)", border: "1px solid rgba(224,80,80,0.25)",
            color: "#e05050", fontWeight: 700, fontFamily: "JetBrains Mono, monospace",
          }}>
            {MESH_DATA.source === "live" ? "LIVE" : "SEED"}
          </span>
        </div>
        <a
          href={sentraHref}
          style={{
            display: "flex", alignItems: "center", gap: 4,
            fontSize: "0.68rem", color: "var(--pulse-text-muted)",
            textDecoration: "none", opacity: 0.7,
          }}
        >
          <ExternalLink size={11} />
          Mesh Map
        </a>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr 1fr 1fr", gap: 16, alignItems: "start" }}>
        <div style={{ textAlign: "center", paddingRight: 16, borderRight: "1px solid var(--pulse-border)" }}>
          <div style={{ fontSize: "0.6rem", color: "var(--pulse-text-muted)", fontFamily: "JetBrains Mono, monospace", marginBottom: 4, textTransform: "uppercase" }}>
            Mesh Resilience Index
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800, color: gradeColor, lineHeight: 1, fontFamily: "inherit" }}>
            {MESH_DATA.grade}
          </div>
          <div style={{ fontSize: "1rem", fontWeight: 700, color: gradeColor, opacity: 0.7, fontFamily: "JetBrains Mono, monospace" }}>
            {MESH_DATA.overall}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 3, justifyContent: "center", marginTop: 4 }}>
            <TrendIcon size={10} color={gradeColor} />
            <span style={{ fontSize: "0.62rem", color: gradeColor, fontFamily: "JetBrains Mono, monospace" }}>
              {MESH_DATA.trend > 0 ? "+" : ""}{MESH_DATA.trend} vs yesterday
            </span>
          </div>
        </div>

        <div>
          <div style={{ fontSize: "0.6rem", color: "var(--pulse-text-muted)", fontFamily: "JetBrains Mono, monospace", marginBottom: 5, textTransform: "uppercase" }}>
            Top Exposure
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
            <AlertTriangle size={12} color="#e05050" style={{ flexShrink: 0, marginTop: 2 }} />
            <span style={{ fontSize: "0.8rem", color: "var(--pulse-text)", lineHeight: 1.4 }}>
              {MESH_DATA.topExposure ?? "No critical mesh exposures detected"}
            </span>
          </div>
        </div>

        <div>
          <div style={{ fontSize: "0.6rem", color: "var(--pulse-text-muted)", fontFamily: "JetBrains Mono, monospace", marginBottom: 5, textTransform: "uppercase" }}>
            Open Exposures
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#e05050", lineHeight: 1 }}>
            {MESH_DATA.openExposures}
          </div>
        </div>

        <div>
          <div style={{ fontSize: "0.6rem", color: "var(--pulse-text-muted)", fontFamily: "JetBrains Mono, monospace", marginBottom: 5, textTransform: "uppercase" }}>
            Pending Approvals
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#c8a84b", lineHeight: 1 }}>
            {MESH_DATA.pendingApprovals}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 4 }}>
            <Shield size={10} color="#c8a84b" />
            <span style={{ fontSize: "0.62rem", color: "#c8a84b", fontFamily: "JetBrains Mono, monospace" }}>
              Guardian queue
            </span>
          </div>
        </div>
      </div>

      <div style={{
        marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--pulse-border)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.65rem", color: "var(--pulse-text-muted)" }}>
          <Clock size={10} />
          Computed {new Date(MESH_DATA.computedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} UTC · Sentra Agent Mesh Engine
        </div>
        <a
          href={sentraHref}
          style={{
            fontSize: "0.68rem", color: "#e05050",
            textDecoration: "none", fontWeight: 600,
            display: "flex", alignItems: "center", gap: 4,
          }}
        >
          Review in Sentra →
        </a>
      </div>
    </div>
  );
}
