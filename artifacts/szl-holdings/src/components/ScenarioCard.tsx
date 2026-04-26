import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";

interface ShockDefinition {
  id: string;
  name: string;
  icon: string;
  defaultMagnitude: number;
  unit: string;
}

interface AppliedShock {
  shockId: string;
  magnitude: number;
}

interface EntityDelta {
  entityLabel: string;
  domain: string;
  domainIcon: string;
  domainColor: string;
  metricLabel: string;
  percentDelta: number;
  direction: "up" | "down" | "flat";
}

interface ScenarioResult {
  scenarioId: string;
  name: string;
  portfolioPnLLow: number;
  portfolioPnLMid: number;
  portfolioPnLHigh: number;
  topMovers: { label: string; delta: string; direction: "up" | "down" }[];
  entityDeltas: EntityDelta[];
  runAt: string;
}

const ACCENT = "#c9b787";
const BG = "hsla(0,0%,100%,0.025)";
const BORDER = "hsla(0,0%,100%,0.07)";
const BORDER_ACCENT = "hsla(38,70%,55%,0.25)";
const TEXT = "hsl(38,8%,92%)";
const TEXT_DIM = "hsl(214,7%,52%)";
const TEXT_MUTED = "hsl(214,7%,38%)";
const RED = "hsl(0,72%,62%)";
const GREEN = "hsl(142,55%,60%)";

const WORKED_EXAMPLE = {
  name: "Strait Closure + 50bps + EU Sanctions",
  horizonWeeks: 8,
  shocks: [
    { shockId: "strait-closure", magnitude: 6 },
    { shockId: "rate-hike", magnitude: 50 },
    { shockId: "eu-sanctions", magnitude: 3 },
    { shockId: "oil-spike", magnitude: 22 },
  ] as AppliedShock[],
};

export function ScenarioCard() {
  const [result, setResult] = useState<ScenarioResult | null>(null);
  const [ran, setRan] = useState(false);

  const { data: library } = useQuery<ShockDefinition[]>({
    queryKey: ["scenarios-library-szl"],
    queryFn: async () => {
      const r = await apiRequest<{ shocks: ShockDefinition[] }>("GET", "/api/scenarios/library");
      return r.shocks;
    },
    staleTime: Infinity,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest<ScenarioResult>("POST", "/api/scenarios/run", WORKED_EXAMPLE);
      return r;
    },
    onSuccess: (data) => {
      setResult(data);
      setRan(true);
    },
  });

  const shockDefs = WORKED_EXAMPLE.shocks
    .map((s) => library?.find((d) => d.id === s.shockId))
    .filter(Boolean) as ShockDefinition[];

  const pnlColor = (v: number) => (v >= 0 ? GREEN : RED);
  const pnlSign = (v: number) => (v >= 0 ? "+" : "");

  return (
    <div
      style={{
        background: BG,
        border: `1px solid ${BORDER}`,
        borderRadius: "16px",
        padding: "1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <span style={{ fontSize: "1rem" }}>⚡</span>
            <span style={{ fontSize: "0.9375rem", fontWeight: 600, color: TEXT }}>
              Causal Scenario Engine
            </span>
            <span
              style={{
                fontSize: "9px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                color: ACCENT,
                textTransform: "uppercase",
                background: `${ACCENT}15`,
                border: `1px solid ${ACCENT}30`,
                borderRadius: "4px",
                padding: "2px 6px",
              }}
            >
              NEW
            </span>
          </div>
          <p style={{ fontSize: "0.8125rem", color: TEXT_DIM, margin: 0 }}>
            Cross-portfolio shock propagation — stack macro events and see second-order effects.
          </p>
        </div>
        <a
          href="/lyte/scenarios"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.375rem",
            padding: "0.375rem 0.75rem",
            background: `${ACCENT}12`,
            border: `1px solid ${BORDER_ACCENT}`,
            borderRadius: "6px",
            color: ACCENT,
            fontSize: "0.75rem",
            fontWeight: 500,
            textDecoration: "none",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          Open composer →
        </a>
      </div>

      {/* Worked example scenario */}
      <div
        style={{
          background: `${ACCENT}08`,
          border: `1px solid ${BORDER_ACCENT}`,
          borderRadius: "10px",
          padding: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
          <div>
            <p style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: TEXT_MUTED, margin: 0 }}>
              Worked Example
            </p>
            <p style={{ fontSize: "0.875rem", fontWeight: 600, color: TEXT, margin: "0.25rem 0 0" }}>
              {WORKED_EXAMPLE.name}
            </p>
            <p style={{ fontSize: "0.75rem", color: TEXT_DIM, margin: "0.125rem 0 0" }}>
              {WORKED_EXAMPLE.horizonWeeks}-week horizon
            </p>
          </div>

          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.375rem",
              padding: "0.5rem 1rem",
              background: ACCENT,
              border: "none",
              borderRadius: "6px",
              color: "#0a0a0a",
              fontSize: "0.75rem",
              fontWeight: 700,
              cursor: mutation.isPending ? "not-allowed" : "pointer",
              opacity: mutation.isPending ? 0.6 : 1,
              transition: "opacity 0.15s",
              flexShrink: 0,
            }}
          >
            {mutation.isPending ? "Propagating…" : ran ? "Re-run" : "▶ Run scenario"}
          </button>
        </div>

        {/* Stacked shocks display */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {WORKED_EXAMPLE.shocks.map((s) => {
            const def = library?.find((d) => d.id === s.shockId);
            return (
              <div
                key={s.shockId}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  padding: "0.25rem 0.625rem",
                  background: "hsla(0,0%,100%,0.06)",
                  border: "1px solid hsla(0,0%,100%,0.1)",
                  borderRadius: "20px",
                  fontSize: "0.75rem",
                  color: TEXT_DIM,
                }}
              >
                <span>{def?.icon ?? "⚡"}</span>
                <span style={{ fontWeight: 500, color: TEXT }}>{def?.name ?? s.shockId}</span>
                <span style={{ color: ACCENT, fontFamily: "monospace" }}>
                  {s.magnitude % 1 === 0 ? s.magnitude : s.magnitude.toFixed(1)}{" "}
                  {def?.unit ?? ""}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Results */}
      {result && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* P&L band */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "0.5rem",
            }}
          >
            {[
              { label: "Bear case", value: result.portfolioPnLLow, color: RED },
              { label: "Base case", value: result.portfolioPnLMid, color: ACCENT },
              { label: "Bull case", value: result.portfolioPnLHigh, color: GREEN },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                style={{
                  background: "hsla(0,0%,100%,0.03)",
                  border: "1px solid hsla(0,0%,100%,0.07)",
                  borderRadius: "8px",
                  padding: "0.75rem",
                  textAlign: "center",
                }}
              >
                <p style={{ fontSize: "0.6875rem", color: TEXT_MUTED, margin: "0 0 0.25rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {label}
                </p>
                <p style={{ fontSize: "1.125rem", fontWeight: 700, color, margin: 0 }}>
                  {pnlSign(value)}${value.toFixed(1)}M
                </p>
              </div>
            ))}
          </div>

          {/* Top movers */}
          {result.topMovers.length > 0 && (
            <div>
              <p
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  color: TEXT_MUTED,
                  margin: "0 0 0.5rem",
                }}
              >
                Top movers
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.375rem" }}>
                {result.topMovers.map((m) => (
                  <div
                    key={m.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.5rem 0.75rem",
                      background: "hsla(0,0%,100%,0.03)",
                      border: "1px solid hsla(0,0%,100%,0.06)",
                      borderRadius: "6px",
                      gap: "0.5rem",
                    }}
                  >
                    <span style={{ fontSize: "0.75rem", color: TEXT_DIM, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {m.label}
                    </span>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        fontFamily: "monospace",
                        color: m.direction === "up" ? GREEN : RED,
                        flexShrink: 0,
                      }}
                    >
                      {m.delta}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ fontSize: "0.6875rem", color: TEXT_MUTED, margin: 0 }}>
              ID: {result.scenarioId} · {new Date(result.runAt).toLocaleTimeString()}
            </p>
            <a
              href="/lyte/scenarios"
              style={{ fontSize: "0.75rem", color: ACCENT, textDecoration: "none", fontWeight: 500 }}
            >
              Build your own →
            </a>
          </div>
        </div>
      )}

      {mutation.isError && (
        <p style={{ fontSize: "0.75rem", color: RED, margin: 0 }}>
          Error: {(mutation.error as Error).message}
        </p>
      )}
    </div>
  );
}
