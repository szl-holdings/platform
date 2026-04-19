import { useState, useCallback } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, ArrowUpRight, Check, X } from "lucide-react";
import { FounderLayout } from "./FounderLayout";
import { registry } from "@szl-holdings/brand-registry";

interface SecondaryLink {
  label: string;
  href: string;
}

interface GraphNode {
  id: string;
  label: string;
  sublabel: string;
  color: string;
  x: number;
  y: number;
  r: number;
  kind: "core" | "product";
  link?: string;
  linkLabel?: string;
  description?: string;
  capabilities?: string[];
  secondaryLinks?: SecondaryLink[];
  status?: "live" | "development" | "alpha" | "beta" | "deferred";
}

const CAPABILITIES: Record<string, string[]> = {
  alloy: [
    "Workflow orchestration, connector management, and agent coordination across every vertical",
    "Confidence scoring, evidence capture, and signal-to-action routing",
    "Tamper-evident proof chain — every recommendation, approval, and override is recorded",
    "Shared auth, audit, and approval surface so each product inherits governance for free",
  ],
  lyte: [
    "Cross-system signal detection — converts raw operational data into actionable signals",
    "Ownership-gap detection across teams, systems, and contracts",
    "Routes signals to the right operator with the right context, with built-in approval surfaces",
    "Built on the PRISM framework — Pulse, Risk, Intelligence, Signals, Motion",
  ],
  vessels: [
    "Real-time AIS, satellite, and multi-source sensor fusion for global vessel tracking",
    "Dark-vessel detection, route deviation alerts, and predictive risk analytics",
    "Port-call intelligence, sanctions screening, and ownership-graph traversal",
    "Operator workspace with investigation timelines and audit-grade evidence trail",
  ],
  aegis: [
    "Three workspaces — Command, Defense, and Labs — under one operator surface",
    "Cross-module correlations stitch incidents across security, operations, and intel",
    "Severity tracking, investigation timelines, and approval-gated remediation",
    "Threat-vector heatmaps and indicator-of-compromise correlation across feeds",
  ],
  terra: [
    "Distress-property surfacing across NYC tax, lien, and ownership records",
    "Ownership-graph traversal — entities, beneficial owners, and related-party links",
    "Deal pipeline with stage tracking, broker activity, and document workflow",
    "Market intelligence layer — comp data, neighborhood signals, and absorption trends",
  ],
  "prism-counsel": [
    "Structured legal-matter command — every matter, document, and counsel decision in one place",
    "Counsel intelligence with traceable advice records and matter-stage automation",
    "Governance surfaces for outside counsel approval, conflicts, and budget control",
    "Audit-grade event log so every legal decision is reconstructable",
  ],
  "carlota-jo": [
    "Private advisory practice for principals who value discretion and precision",
    "Curated, tailored support — calm execution rather than packaged products",
    "Governed engagement records and confidential matter intake",
    "Direct principal access; no account managers between the work and the client",
  ],
  rosie: [
    "Threat detection and anomaly visibility across managed infrastructure",
    "Government contract intelligence, FedRAMP and CMMC tracking for defense-aware operators",
    "MSP-grade incident command — playbooks, evidence capture, and remediation routing",
    "Evidence-backed alerts so every notification carries audit trail and confidence",
  ],
};

const SECONDARY_LINKS: Record<string, SecondaryLink[]> = {
  alloy: [
    { label: "Trust & Governance", href: "/trust" },
    { label: "Proof Chain", href: "/trust/proof-chain" },
    { label: "Public Claims", href: "/trust/claims" },
  ],
};

const FALLBACK_LINKS: Record<string, string> = {
  "prism-counsel": "/prism-counsel/",
};

interface GraphEdge {
  from: string;
  to: string;
  dashed?: boolean;
}

const PRODUCT_POSITIONS: Record<string, { x: number; y: number; r: number }> = {
  lyte:         { x: 18, y: 22, r: 28 },
  vessels:      { x: 76, y: 18, r: 26 },
  aegis:        { x: 82, y: 50, r: 26 },
  terra:        { x: 72, y: 82, r: 26 },
  "prism-counsel": { x: 28, y: 82, r: 24 },
  "carlota-jo": { x: 14, y: 62, r: 22 },
  rosie:        { x: 14, y: 40, r: 22 },
};

function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return `hsl(0, 0%, ${Math.round(l * 100)}%)`;
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

const FALLBACK_COLOR = "#6366f1";
const alloyProduct = registry.products.find((p) => p.id === "alloy")!;
const peripheralProducts = registry.products.filter((p) => p.id !== "alloy" && PRODUCT_POSITIONS[p.id]);

const NODES: GraphNode[] = [
  {
    id: "alloy",
    label: alloyProduct.name,
    sublabel: "Execution Fabric",
    color: hexToHsl(alloyProduct.color ?? FALLBACK_COLOR),
    x: 50,
    y: 50,
    r: 38,
    kind: "core",
    link: alloyProduct.link ?? "/alloy",
    linkLabel: "Open Alloy",
    description: alloyProduct.description,
    capabilities: CAPABILITIES.alloy,
    secondaryLinks: SECONDARY_LINKS.alloy,
    status: alloyProduct.status,
  },
  ...peripheralProducts.map((p) => {
    const link = p.link ?? FALLBACK_LINKS[p.id];
    return {
      id: p.id,
      label: p.name,
      sublabel: p.tagline,
      color: hexToHsl(p.color ?? FALLBACK_COLOR),
      ...PRODUCT_POSITIONS[p.id],
      kind: "product" as const,
      link,
      linkLabel: link ? `View ${p.name}` : undefined,
      description: p.oneLiner,
      capabilities: CAPABILITIES[p.id],
      secondaryLinks: SECONDARY_LINKS[p.id],
      status: p.status,
    };
  }),
];

const EDGES: GraphEdge[] = peripheralProducts.map((p) => ({ from: p.id, to: "alloy" }));

const PILLAR_ROWS = [
  {
    role: "OBSERVE",
    label: "Surface signal",
    products: registry.products.filter((p) => p.doctrineRole === "OBSERVE").map((p) => p.id),
    color: "hsl(38, 52%, 58%)",
  },
  {
    role: "EXECUTE",
    label: "Orchestrate action",
    products: registry.products.filter((p) => p.doctrineRole === "EXECUTE").map((p) => p.id),
    color: "hsl(228, 65%, 54%)",
  },
  {
    role: "DEFEND",
    label: "Protect assets",
    products: registry.products.filter((p) => p.doctrineRole === "DEFEND").map((p) => p.id),
    color: "hsl(0, 70%, 50%)",
  },
  {
    role: "COUNSEL",
    label: "Govern legal risk",
    products: ["prism-counsel"],
    color: "hsl(270, 50%, 55%)",
  },
  {
    role: "ADVISE",
    label: "Deliver judgment",
    products: ["carlota-jo"],
    color: "hsl(36, 48%, 52%)",
  },
  {
    role: "GOVERN",
    label: "Audit everything",
    products: ["alloy"],
    color: "hsl(215, 60%, 48%)",
  },
];

function getNodeCenter(node: GraphNode, svgW: number, svgH: number) {
  return {
    cx: (node.x / 100) * svgW,
    cy: (node.y / 100) * svgH,
  };
}

export default function FounderArchitecture() {
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const svgW = 800;
  const svgH = 560;

  const handleNodeClick = useCallback(
    (node: GraphNode) => {
      setSelected(selected?.id === node.id ? null : node);
    },
    [selected]
  );

  return (
    <FounderLayout>
      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "clamp(4rem, 8vw, 7rem) clamp(1.5rem, 5vw, 3rem) clamp(3rem, 6vw, 5rem)",
        }}
      >
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ marginBottom: "3rem" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.625rem",
              marginBottom: "1.5rem",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "hsl(38, 52%, 58%)",
                display: "inline-block",
              }}
            />
            <span
              style={{
                fontSize: "0.8125rem",
                color: "hsl(214, 6%, 57%)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                fontWeight: 500,
              }}
            >
              Architecture
            </span>
          </div>

          <h1
            style={{
              fontFamily: "'Space Grotesk', system-ui, sans-serif",
              fontWeight: 700,
              fontSize: "clamp(2rem, 5vw, 3.75rem)",
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              color: "hsl(38, 8%, 95%)",
              marginBottom: "1.25rem",
              maxWidth: "22ch",
            }}
          >
            One spine. Eight products. One compounding advantage.
          </h1>
          <p
            style={{
              fontSize: "1.0625rem",
              lineHeight: 1.65,
              color: "hsl(214, 6%, 57%)",
              maxWidth: "60ch",
            }}
          >
            Alloy is the shared execution fabric beneath every SZL vertical. Every product routes consequential actions through the same governance layer, the same approval surface, and the same proof chain.{" "}
            <strong style={{ color: "hsl(38, 8%, 95%)", fontWeight: 500 }}>
              Click any node to explore its role in the system.
            </strong>
          </p>
        </m.div>

        <m.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{
            border: "1px solid hsla(0,0%,100%,0.055)",
            borderRadius: "16px",
            background: "hsla(214, 14%, 6%, 0.6)",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <svg
            viewBox={`0 0 ${svgW} ${svgH}`}
            style={{ width: "100%", height: "auto", display: "block" }}
          >
            <defs>
              <radialGradient id="glow-alloy" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="hsl(228, 65%, 54%)" stopOpacity="0.2" />
                <stop offset="100%" stopColor="hsl(228, 65%, 54%)" stopOpacity="0" />
              </radialGradient>
              {NODES.map((n) => (
                <radialGradient key={`g-${n.id}`} id={`glow-${n.id}`} cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={n.color} stopOpacity="0.15" />
                  <stop offset="100%" stopColor={n.color} stopOpacity="0" />
                </radialGradient>
              ))}
            </defs>

            {EDGES.map((edge) => {
              const fromNode = NODES.find((n) => n.id === edge.from)!;
              const toNode = NODES.find((n) => n.id === edge.to)!;
              const from = getNodeCenter(fromNode, svgW, svgH);
              const to = getNodeCenter(toNode, svgW, svgH);
              const isActive =
                hovered === fromNode.id ||
                hovered === toNode.id ||
                selected?.id === fromNode.id ||
                selected?.id === toNode.id;
              return (
                <line
                  key={`${edge.from}-${edge.to}`}
                  x1={from.cx}
                  y1={from.cy}
                  x2={to.cx}
                  y2={to.cy}
                  stroke={isActive ? toNode.color : "hsla(0,0%,100%,0.08)"}
                  strokeWidth={isActive ? 1.5 : 0.75}
                  strokeDasharray={edge.dashed ? "6 4" : undefined}
                  style={{ transition: "stroke 0.2s, stroke-width 0.2s" }}
                />
              );
            })}

            {NODES.map((node) => {
              const { cx, cy } = getNodeCenter(node, svgW, svgH);
              const isSelected = selected?.id === node.id;
              const isHovered = hovered === node.id;
              const isActive = isSelected || isHovered;
              const glowR = node.r * 3;

              return (
                <g
                  key={node.id}
                  onClick={() => handleNodeClick(node)}
                  onMouseEnter={() => setHovered(node.id)}
                  onMouseLeave={() => setHovered(null)}
                  style={{ cursor: "pointer" }}
                >
                  {isActive && (
                    <ellipse
                      cx={cx}
                      cy={cy}
                      rx={glowR}
                      ry={glowR * 0.75}
                      fill={`url(#glow-${node.id})`}
                    />
                  )}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={node.r + (isActive ? 4 : 0)}
                    fill="hsl(214, 14%, 6%)"
                    stroke={node.color}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                    strokeOpacity={isActive ? 1 : 0.5}
                    style={{ transition: "all 0.2s" }}
                  />
                  {node.kind === "core" && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={node.r * 0.55}
                      fill={node.color}
                      fillOpacity={0.12}
                    />
                  )}
                  <text
                    x={cx}
                    y={cy - 3}
                    textAnchor="middle"
                    fill={isActive ? "hsl(38, 8%, 95%)" : node.color}
                    fontSize={node.kind === "core" ? 13 : 11}
                    fontWeight="600"
                    fontFamily="'Space Grotesk', system-ui, sans-serif"
                    style={{ transition: "fill 0.2s", pointerEvents: "none" }}
                  >
                    {node.label}
                  </text>
                  <text
                    x={cx}
                    y={cy + 11}
                    textAnchor="middle"
                    fill="hsl(214, 6%, 55%)"
                    fontSize={node.kind === "core" ? 9 : 8}
                    fontFamily="'Inter', system-ui, sans-serif"
                    style={{ pointerEvents: "none" }}
                  >
                    {node.sublabel}
                  </text>
                </g>
              );
            })}
          </svg>

          <AnimatePresence>
            {selected && (
              <m.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
                style={{
                  position: "absolute",
                  bottom: "1.5rem",
                  left: "1.5rem",
                  right: "1.5rem",
                  background: "hsla(214, 18%, 3%, 0.96)",
                  border: `1px solid ${selected.color}40`,
                  borderRadius: "10px",
                  padding: "1.25rem 1.5rem",
                  display: "flex",
                  gap: "1rem",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  backdropFilter: "blur(12px)",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.625rem",
                      marginBottom: "0.5rem",
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: selected.color,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontFamily: "'Space Grotesk', system-ui, sans-serif",
                        fontWeight: 600,
                        fontSize: "1rem",
                        color: "hsl(38, 8%, 95%)",
                      }}
                    >
                      {selected.label}
                    </span>
                    <span
                      style={{ fontSize: "0.8125rem", color: "hsl(214, 6%, 57%)" }}
                    >
                      — {selected.sublabel}
                    </span>
                    {selected.status === "development" && (
                      <span
                        style={{
                          fontSize: "0.65rem",
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          padding: "0.15rem 0.5rem",
                          borderRadius: "100px",
                          border: "1px solid hsla(38,52%,58%,0.3)",
                          background: "hsla(38,52%,58%,0.08)",
                          color: "hsl(38, 52%, 65%)",
                        }}
                      >
                        In development
                      </span>
                    )}
                  </div>
                  <p
                    style={{
                      fontSize: "0.9rem",
                      color: "hsl(214, 7%, 70%)",
                      lineHeight: 1.55,
                      margin: "0 0 0.875rem",
                    }}
                  >
                    {selected.description}
                  </p>
                  {selected.capabilities && selected.capabilities.length > 0 && (
                    <ul
                      style={{
                        listStyle: "none",
                        padding: 0,
                        margin: "0 0 1rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.45rem",
                      }}
                    >
                      {selected.capabilities.map((cap) => (
                        <li
                          key={cap}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "0.55rem",
                            fontSize: "0.8375rem",
                            color: "hsl(214, 7%, 68%)",
                            lineHeight: 1.5,
                          }}
                        >
                          <Check
                            size={13}
                            style={{
                              color: selected.color,
                              flexShrink: 0,
                              marginTop: "0.2rem",
                            }}
                          />
                          <span>{cap}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      flexWrap: "wrap",
                    }}
                  >
                    {selected.link && (
                      <a
                        href={selected.link}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          padding: "0.4rem 0.8rem",
                          fontSize: "0.8125rem",
                          fontWeight: 500,
                          color: "hsl(214, 14%, 6%)",
                          background: selected.color,
                          borderRadius: "6px",
                          textDecoration: "none",
                          fontFamily: "'Space Grotesk', system-ui, sans-serif",
                        }}
                        data-testid={`view-${selected.id}`}
                      >
                        {selected.linkLabel ?? `View ${selected.label}`}
                        <ArrowUpRight size={13} />
                      </a>
                    )}
                    {selected.secondaryLinks?.map((sl) => (
                      <Link key={sl.href} href={sl.href}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem",
                            padding: "0.4rem 0.7rem",
                            fontSize: "0.75rem",
                            color: "hsl(214, 7%, 75%)",
                            background: "hsla(0,0%,100%,0.04)",
                            border: "1px solid hsla(0,0%,100%,0.07)",
                            borderRadius: "6px",
                            textDecoration: "none",
                            cursor: "pointer",
                            fontFamily: "'Space Grotesk', system-ui, sans-serif",
                            letterSpacing: "0.02em",
                          }}
                        >
                          {sl.label}
                          <ArrowRight size={11} />
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "hsl(214, 6%, 57%)",
                    padding: "0.25rem",
                    flexShrink: 0,
                  }}
                >
                  <X size={16} />
                </button>
              </m.div>
            )}
          </AnimatePresence>
        </m.div>

        <div style={{ marginTop: "4rem" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 440px), 1fr))",
              gap: "1.5rem",
            }}
          >
            {PILLAR_ROWS.map((pillar, i) => {
              const products = NODES.filter((n) =>
                pillar.products.includes(n.id)
              );
              return (
                <m.div
                  key={pillar.role}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-30px" }}
                  transition={{ duration: 0.4, delay: i * 0.07 }}
                  style={{
                    padding: "1.5rem",
                    borderRadius: "10px",
                    border: "1px solid hsla(0,0%,100%,0.055)",
                    background: "hsla(214, 14%, 6%, 0.6)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      marginBottom: "1rem",
                    }}
                  >
                    <span
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: pillar.color,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: pillar.color,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {pillar.role}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    {products.map((p) => (
                      <span
                        key={p.id}
                        style={{
                          padding: "0.25rem 0.75rem",
                          borderRadius: "100px",
                          border: `1px solid ${p.color}40`,
                          background: `${p.color}0d`,
                          fontSize: "0.8125rem",
                          color: "hsl(38, 8%, 95%)",
                        }}
                      >
                        {p.label}
                      </span>
                    ))}
                  </div>
                </m.div>
              );
            })}
          </div>
        </div>

        <div style={{ marginTop: "3.5rem" }}>
          <Link href="/founder/essays/one-spine-six-verticals">
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.375rem",
                fontSize: "0.9375rem",
                color: "hsl(38, 52%, 58%)",
                cursor: "pointer",
                textDecoration: "none",
              }}
            >
              Read: One Spine, Six Verticals — the architectural memo
              <ArrowRight size={15} />
            </span>
          </Link>
        </div>
      </section>
    </FounderLayout>
  );
}
