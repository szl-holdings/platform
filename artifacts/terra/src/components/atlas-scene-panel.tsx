import { useState } from "react";
import { Building2, TrendingUp, ShieldAlert, Clock, Activity } from "lucide-react";

interface AtlasScenePanelProps {
  propertyId?: string;
  vesselId?: string;
  incidentId?: string;
  isDemo?: boolean;
}

type Tab = "location" | "financial" | "risk";

const DEMO_PROPERTY = {
  name: "22 Battery Park South",
  address: "22 Battery Park South, New York, NY 10004",
  type: "Class A Office",
  sqft: "284,500 SF",
  floors: 32,
  yearBuilt: 1998,
  ownership: "Fee Simple",
  occupancy: 94.2,
  noi: "$18.7M",
  capRate: 6.8,
  marketValue: "$274.8M",
  lastSale: "Mar 2021 · $248.2M",
  zone: "C5-3 (Central Commercial)",
  far: 1.8,
};

const DEMO_FINANCIALS = [
  { label: "Gross Revenue", value: "$23.4M", trend: "+4.2%", up: true },
  { label: "Operating Expenses", value: "$4.7M", trend: "-1.8%", up: false },
  { label: "NOI", value: "$18.7M", trend: "+5.1%", up: true },
  { label: "Cap Rate", value: "6.8%", trend: "+0.3%", up: true },
  { label: "Price / SF", value: "$966", trend: "+2.7%", up: true },
  { label: "DSCR", value: "1.48×", trend: "+0.12×", up: true },
];

const DEMO_RISKS = [
  { label: "Market Risk", score: 0.28, level: "LOW", detail: "Manhattan Class A office absorption +420K SF Q1 2026 — demand recovering", color: "#4ade80" },
  { label: "Regulatory / Zoning", score: 0.52, level: "MEDIUM", detail: "FAR variance application pending — C5-3 → C6-4 requires CB1 approval", color: "#fbbf24" },
  { label: "Tenant Concentration", score: 0.61, level: "HIGH", detail: "Largest tenant (FinServ LLC) = 38% of GLA — lease expires Q4 2027", color: "#f59e0b" },
  { label: "Climate / Flood", score: 0.44, level: "MEDIUM", detail: "FEMA Zone AE — FloodGuard mitigation installed 2022, flood insurance current", color: "#fbbf24" },
];

const ACCENT = "#10b981";

export function AtlasScenePanel({ propertyId, isDemo }: AtlasScenePanelProps) {
  const [tab, setTab] = useState<Tab>("location");
  const p = DEMO_PROPERTY;
  const displayId = propertyId ? `PROP-${propertyId.slice(-6).toUpperCase()}` : "22 BATT PARK";

  const tabs: { id: Tab; label: string; icon: typeof Building2 }[] = [
    { id: "location", label: "Property Intel", icon: Building2 },
    { id: "financial", label: "Financial", icon: TrendingUp },
    { id: "risk", label: "Risk", icon: ShieldAlert },
  ];

  return (
    <div
      style={{
        borderRadius: "0.75rem",
        background: "rgba(16,185,129,0.04)",
        border: "1px solid rgba(16,185,129,0.14)",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.25rem 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Building2 style={{ width: 14, height: 14, color: ACCENT }} />
          <span style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: ACCENT }}>
            ATLAS Property Scene
          </span>
          {isDemo && (
            <span style={{ fontSize: "0.6rem", fontFamily: "monospace", padding: "0.1rem 0.4rem", borderRadius: "2rem", background: "rgba(16,185,129,0.1)", color: ACCENT, border: "1px solid rgba(16,185,129,0.25)" }}>
              DEMO
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.6875rem", fontFamily: "monospace", color: "rgba(255,255,255,0.35)" }}>{displayId}</span>
          <span style={{ fontSize: "0.6rem", fontFamily: "monospace", padding: "0.15rem 0.5rem", borderRadius: "2rem", background: "rgba(16,185,129,0.1)", color: "#34d399", border: "1px solid rgba(16,185,129,0.25)" }}>
            {p.occupancy}% OCC
          </span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid rgba(255,255,255,0.07)", margin: "0.875rem 1.25rem 0", paddingBottom: 0 }}>
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                fontSize: "0.6875rem", fontFamily: "monospace", fontWeight: 500,
                padding: "0.4rem 0.875rem",
                background: "none", border: "none", cursor: "pointer",
                color: tab === t.id ? ACCENT : "rgba(255,255,255,0.3)",
                borderBottom: tab === t.id ? `2px solid ${ACCENT}` : "2px solid transparent",
                marginBottom: -1, transition: "color 0.12s",
                display: "flex", alignItems: "center", gap: "0.3rem",
              }}
            >
              <Icon style={{ width: 11, height: 11 }} />
              {t.label}
            </button>
          );
        })}
      </div>

      <div style={{ padding: "1rem 1.25rem 1.25rem" }}>
        {tab === "location" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem" }}>
              {[
                { label: "Property", value: p.name },
                { label: "Type", value: `${p.type} · ${p.floors}F` },
                { label: "Address", value: p.address },
                { label: "Built / SF", value: `${p.yearBuilt} · ${p.sqft}` },
                { label: "Ownership", value: p.ownership },
                { label: "Occupancy", value: `${p.occupancy}%` },
                { label: "Zoning", value: p.zone },
                { label: "FAR (current)", value: `${p.far} · variance pending` },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: "rgba(255,255,255,0.03)", borderRadius: "0.375rem", padding: "0.5rem 0.625rem" }}>
                  <p style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.3)", fontFamily: "monospace", letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 0.2rem" }}>{label}</p>
                  <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.85)", fontFamily: "monospace", margin: 0 }}>{value}</p>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.625rem", background: "rgba(16,185,129,0.05)", borderRadius: "0.375rem", border: "1px solid rgba(16,185,129,0.12)" }}>
              <Activity style={{ width: 12, height: 12, color: ACCENT, flexShrink: 0 }} />
              <span style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.55)", fontFamily: "monospace" }}>
                Market value <strong style={{ color: "rgba(255,255,255,0.8)" }}>{p.marketValue}</strong> · last sale {p.lastSale}
              </span>
            </div>
          </div>
        )}

        {tab === "financial" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem" }}>
              {DEMO_FINANCIALS.map((f) => (
                <div key={f.label} style={{ background: "rgba(255,255,255,0.03)", borderRadius: "0.5rem", padding: "0.625rem 0.75rem" }}>
                  <p style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.3)", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 0.2rem" }}>{f.label}</p>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem" }}>
                    <span style={{ fontSize: "1rem", fontFamily: "monospace", fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>{f.value}</span>
                    <span style={{ fontSize: "0.6875rem", fontFamily: "monospace", color: f.up ? "#4ade80" : "#f87171" }}>{f.trend}</span>
                  </div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.2)", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0.25rem 0 0" }}>
              TTM financials · CapExOptimizationAgent monitoring · proforma available
            </p>
          </div>
        )}

        {tab === "risk" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {DEMO_RISKS.map((r) => (
              <div key={r.label} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "0.5rem", padding: "0.75rem 0.875rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
                  <span style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>{r.label}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "0.6rem", fontFamily: "monospace", fontWeight: 600, padding: "0.15rem 0.5rem", borderRadius: "2rem", background: `${r.color}18`, color: r.color, border: `1px solid ${r.color}30` }}>
                      {r.level}
                    </span>
                    <span style={{ fontSize: "0.75rem", fontFamily: "monospace", fontWeight: 700, color: r.color }}>{Math.round(r.score * 100)}%</span>
                  </div>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.07)", marginBottom: "0.375rem" }}>
                  <div style={{ height: "100%", borderRadius: 2, background: r.color, width: `${r.score * 100}%`, opacity: 0.7 }} />
                </div>
                <p style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.4)", margin: 0 }}>{r.detail}</p>
              </div>
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.625rem", background: "rgba(245,158,11,0.06)", borderRadius: "0.375rem", border: "1px solid rgba(245,158,11,0.15)" }}>
              <ShieldAlert style={{ width: 12, height: 12, color: "#f59e0b", flexShrink: 0 }} />
              <span style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.55)", fontFamily: "monospace" }}>
                Composite risk <strong style={{ color: "#fbbf24" }}>0.46 / MEDIUM</strong> — tenant renewal negotiation flagged for Counsel review
              </span>
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: "0.625rem 1.25rem", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Clock style={{ width: 10, height: 10, color: "rgba(255,255,255,0.2)" }} />
        <span style={{ fontSize: "0.6rem", fontFamily: "monospace", color: "rgba(255,255,255,0.2)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          terra · atlas scene · market-signal integrated
        </span>
      </div>
    </div>
  );
}
