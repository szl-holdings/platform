import { useState, useEffect } from "react";
import { m } from "framer-motion";
import { Link } from "wouter";
import { Network, ArrowRight } from "lucide-react";
import { LiveIndicator, CinematicReveal, EcosystemPulseItem } from "@szl-holdings/shared-ui";

const ECOSYSTEM_APPS = [
  { name: "Lyte", description: "Business Observability", color: "hsl(192,72%,48%)" },
  { name: "Vessels", description: "Maritime Intelligence", color: "hsl(206,72%,52%)" },
  { name: "Aegis", description: "Defense & Intelligence", color: "hsl(222,60%,62%)" },
  { name: "Terra", description: "Real Estate Intelligence", color: "hsl(140,50%,48%)" },
  { name: "PRISM Counsel", description: "Legal Matter Command", color: "hsl(38,72%,58%)" },
  { name: "Carlota Jo", description: "Private Advisory", color: "hsl(280,50%,65%)" },
];

interface MeshStats {
  totalSignalsGenerated: number;
  totalCrossVentureRoutes: number;
  signalsMissedInIsolation: number;
}

export function EcosystemPulseSection() {
  const [pulseData, setPulseData] = useState<Array<{ name: string; status: "operational" | "degraded" | "down" | "unknown"; description: string; color: string; lastChecked: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [meshStats, setMeshStats] = useState<MeshStats | null>(null);

  useEffect(() => {
    const fallback = ECOSYSTEM_APPS.map(app => ({
      name: app.name,
      status: "operational" as const,
      description: app.description,
      color: app.color,
      lastChecked: "just now",
    }));
    Promise.all([
      fetch("/api/health/detailed").then(r => r.ok ? r.json() : null).catch(() => null),
      fetch("/api/intelligence-mesh/compound-value").then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([healthData, meshData]) => {
      if (!healthData) { setPulseData(fallback); }
      else {
        const overallStatus = healthData.status === "healthy" ? "operational" as const
          : healthData.status === "warning" ? "degraded" as const
          : healthData.status === "degraded" ? "degraded" as const
          : "unknown" as const;
        setPulseData(ECOSYSTEM_APPS.map(app => ({
          name: app.name,
          status: overallStatus,
          description: app.description,
          color: app.color,
          lastChecked: "just now",
        })));
      }
      if (meshData) {
        setMeshStats({
          totalSignalsGenerated: meshData.totalSignalsGenerated ?? 0,
          totalCrossVentureRoutes: meshData.totalCrossVentureRoutes ?? 0,
          signalsMissedInIsolation: meshData.signalsMissedInIsolation ?? 0,
        });
      }
    }).catch(() => setPulseData(fallback)).finally(() => setLoading(false));
  }, []);

  return (
    <section style={{ borderBottom: "1px solid var(--color-szl-border)", background: "hsla(0,0%,100%,0.01)" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(4rem,8vw,6rem) var(--space-content-x)" }}>
        <CinematicReveal>
          <div style={{ marginBottom: "2.5rem", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <p style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", fontFamily: "var(--font-mono)", marginBottom: "0.875rem" }}>
                Ecosystem
              </p>
              <h2 style={{ fontSize: "clamp(1.5rem,2.5vw,2rem)", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.15, color: "hsl(38,8%,94%)" }}>
                One platform. Six operational domains.
              </h2>
            </div>
            <LiveIndicator label="ECOSYSTEM PULSE" color="hsl(192,72%,48%)" />
          </div>
        </CinematicReveal>
        {loading ? (
          <div style={{ display: "grid", gap: "0.875rem", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))" }}>
            {ECOSYSTEM_APPS.map(app => (
              <div key={app.name} style={{ height: 90, borderRadius: "0.75rem", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.05)", animation: "pulse 2s ease-in-out infinite" }} />
            ))}
          </div>
        ) : (
          <div style={{ display: "grid", gap: "0.875rem", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))" }}>
            {pulseData.map((item, i) => (
              <CinematicReveal key={item.name} delay={i * 0.06}>
                <EcosystemPulseItem
                  name={item.name}
                  status={item.status}
                  description={item.description}
                  color={item.color}
                  lastChecked={item.lastChecked}
                />
              </CinematicReveal>
            ))}
          </div>
        )}

        <CinematicReveal delay={0.3}>
          <m.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{
              marginTop: "2rem",
              padding: "1.25rem 1.5rem",
              borderRadius: "0.875rem",
              background: "hsla(192,72%,48%,0.04)",
              border: "1px solid hsla(192,72%,48%,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "1.25rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{
                width: 40, height: 40, borderRadius: "0.625rem", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "hsla(192,72%,48%,0.12)",
                border: "1px solid hsla(192,72%,48%,0.3)",
              }}>
                <Network size={18} color="hsl(192,72%,48%)" />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.125rem" }}>
                  <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "hsl(38,8%,92%)" }}>
                    Compound Intelligence Mesh
                  </span>
                  <span style={{
                    display: "inline-flex", alignItems: "center",
                    padding: "0.1rem 0.4rem",
                    borderRadius: "99px",
                    fontSize: "0.625rem",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    color: "hsl(192,72%,48%)",
                    background: "hsla(192,72%,48%,0.12)",
                    border: "1px solid hsla(192,72%,48%,0.3)",
                  }}>
                    LIVE
                  </span>
                </div>
                <p style={{ fontSize: "0.8125rem", color: "var(--color-szl-text-secondary)", margin: 0 }}>
                  Cross-venture signals auto-enrich every relevant domain. Intelligence compounds across the ecosystem.
                </p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap" }}>
              {meshStats && (
                <div style={{ display: "flex", gap: "1.25rem" }}>
                  {[
                    { label: "Signals", value: meshStats.totalSignalsGenerated },
                    { label: "Routes", value: meshStats.totalCrossVentureRoutes },
                    { label: "Compound insights", value: meshStats.signalsMissedInIsolation },
                  ].map(s => (
                    <div key={s.label} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "1.125rem", fontWeight: 700, color: "hsl(192,72%,48%)" }}>{s.value}</div>
                      <div style={{ fontSize: "0.625rem", color: "var(--color-szl-text-faint)" }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              )}
              <Link
                href="/intelligence-mesh"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.375rem",
                  padding: "0.5rem 1rem",
                  background: "hsla(192,72%,48%,0.12)",
                  border: "1px solid hsla(192,72%,48%,0.3)",
                  borderRadius: "0.375rem",
                  color: "hsl(192,72%,48%)",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  textDecoration: "none",
                  transition: "background 0.2s ease",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "hsla(192,72%,48%,0.2)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "hsla(192,72%,48%,0.12)"; }}
              >
                View Mesh
                <ArrowRight size={13} />
              </Link>
            </div>
          </m.div>
        </CinematicReveal>
      </div>
    </section>
  );
}
