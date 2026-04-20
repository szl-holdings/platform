import { useEffect, useMemo, useState } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { ConstellationGraph } from "@szl-holdings/shared-ui/constellation-graph";
import { ArrowLeft } from "lucide-react";

const ACCENT = "#c8a84b";
const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "/pulse";
const DOMAINS = ["terra", "vessels", "aegis", "prism", "lyte"] as const;
const LABELS: Record<string, string> = {
  terra: "Terra",
  vessels: "Vessels",
  aegis: "Aegis",
  prism: "Prism Counsel",
  lyte: "Lyte",
};

function readDomainFromSearch(): string | null {
  if (typeof window === "undefined") return null;
  const d = new URLSearchParams(window.location.search).get("domain");
  return d && (DOMAINS as readonly string[]).includes(d) ? d : null;
}

export default function Constellation() {
  const [, params] = useRoute(`${BASE}/constellation/entities/:id`);
  const [location] = useLocation();
  const focusedEntityId = params?.id;

  const initialDomain = useMemo(() => readDomainFromSearch() ?? "terra", []);
  const [domain, setDomain] = useState<string>(initialDomain);

  // Honor `?domain=` updates if the user navigates between citation chips
  // without unmounting the page.
  useEffect(() => {
    const d = readDomainFromSearch();
    if (d && d !== domain) setDomain(d);
    // location is in deps so we re-read on route changes (wouter updates it)
  }, [location, domain]);

  // ConstellationGraph reads `?origin=<id>` from window.location once on mount
  // to auto-trace the focused node. Citation links already include
  // `?origin=<id>` in the href, so we don't need to inject it after render.
  // We do, however, force-remount the graph when the focused id changes via
  // the `key` prop below so subsequent in-page navigations re-run the trace.

  return (
    <div style={{ padding: "28px 28px 40px", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 600, color: "var(--pulse-text)", margin: 0 }}>
          Constellation
        </h1>
        <p style={{ fontSize: "0.85rem", color: "var(--pulse-text-muted)", marginTop: 4 }}>
          Cross-domain entity map. Switch between domains to see how vessels, properties, threats,
          and counsel cases interconnect across the SZL Holdings portfolio.
        </p>
      </div>

      {focusedEntityId && (
        <div
          data-testid="constellation-focused-entity"
          style={{
            marginBottom: 14,
            padding: "10px 14px",
            borderRadius: 7,
            background: `${ACCENT}10`,
            border: `1px solid ${ACCENT}35`,
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <Link href={`${BASE}/constellation`} style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            color: ACCENT, fontSize: "0.7rem", fontWeight: 600, textDecoration: "none",
          }}>
            <ArrowLeft size={11} /> All entities
          </Link>
          <span style={{ color: "rgba(255,255,255,0.2)" }}>·</span>
          <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.5)" }}>
            Tracing entity:
          </span>
          <code style={{
            fontSize: "0.7rem", color: ACCENT, fontFamily: "monospace",
            padding: "2px 7px", background: "rgba(0,0,0,0.25)", borderRadius: 4,
          }}>
            {focusedEntityId}
          </code>
        </div>
      )}

      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {DOMAINS.map((d) => {
          const active = d === domain;
          return (
            <button
              key={d}
              onClick={() => setDomain(d)}
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: "5px 11px",
                borderRadius: 4,
                border: `1px solid ${active ? ACCENT : "rgba(255,255,255,0.12)"}`,
                background: active ? `${ACCENT}20` : "transparent",
                color: active ? ACCENT : "var(--pulse-text-muted)",
                cursor: "pointer",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
              data-testid={`pulse-domain-${d}`}
            >
              {LABELS[d]}
            </button>
          );
        })}
      </div>

      <ConstellationGraph
        key={focusedEntityId ?? "all"}
        domain={domain}
        accentColor={ACCENT}
        height={540}
      />
    </div>
  );
}
