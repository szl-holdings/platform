import { useState } from "react";
import { m } from "framer-motion";
import { CheckCircle, Clock, AlertTriangle, XCircle, ChevronDown, ChevronRight, ExternalLink, BookOpen, FileDown } from "lucide-react";
import { Link } from "wouter";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useCapabilityManifest, PRODUCT_DISPLAY, type CapabilityStatus, type ProductSummary } from "@/hooks/useCapabilityManifest";

const STATUS_META: Record<CapabilityStatus, { label: string; color: string; bg: string; Icon: React.FC<{ size?: number; style?: React.CSSProperties }> }> = {
  live: { label: "Live", color: "#10b981", bg: "hsla(152,50%,42%,0.12)", Icon: CheckCircle },
  working_demo: { label: "Working Demo", color: "#3b82f6", bg: "hsla(210,55%,52%,0.12)", Icon: Clock },
  partial: { label: "Partial", color: "#f59e0b", bg: "hsla(38,85%,50%,0.12)", Icon: AlertTriangle },
  stub: { label: "Stub", color: "#6b7280", bg: "hsla(0,0%,50%,0.1)", Icon: Clock },
  broken: { label: "Broken", color: "#ef4444", bg: "hsla(0,62%,52%,0.12)", Icon: XCircle },
  undocumented: { label: "Undocumented", color: "#8b5cf6", bg: "hsla(246,55%,62%,0.1)", Icon: AlertTriangle },
};

function StatusBadge({ status }: { status: CapabilityStatus }) {
  const meta = STATUS_META[status] ?? STATUS_META.stub;
  const Icon = meta.Icon;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "0.3rem",
      padding: "0.2rem 0.55rem", borderRadius: "5px",
      background: meta.bg, color: meta.color,
      fontSize: "11px", fontWeight: 600, whiteSpace: "nowrap" as const,
    }}>
      <Icon size={10} style={{ color: meta.color }} />
      {meta.label}
    </span>
  );
}

function ReadinessBar({ score, color }: { score: number; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
      <div style={{ flex: 1, height: "5px", background: "hsla(0,0%,100%,0.07)", borderRadius: "3px", overflow: "hidden" }}>
        <div style={{
          width: `${score}%`, height: "100%", background: color,
          borderRadius: "3px", transition: "width 0.6s ease",
        }} />
      </div>
      <span style={{ fontSize: "12px", fontWeight: 700, color, minWidth: "3rem", textAlign: "right" as const }}>{score}%</span>
    </div>
  );
}

function ProductRow({ product }: { product: ProductSummary }) {
  const [open, setOpen] = useState(false);
  const display = PRODUCT_DISPLAY[product.product];
  if (!display) return null;
  const color = display.color;

  const liveCount = product.live + product.working_demo;
  const issueCount = product.broken + product.stub;

  return (
    <div style={{ borderBottom: "1px solid hsla(0,0%,100%,0.05)" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "grid",
          gridTemplateColumns: "1fr auto auto auto auto",
          gap: "1rem", alignItems: "center",
          padding: "0.9rem 1.25rem", background: "none",
          border: "none", cursor: "pointer", textAlign: "left" as const,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {open ? <ChevronDown size={13} style={{ color: "hsl(210,5%,45%)" }} /> : <ChevronRight size={13} style={{ color: "hsl(210,5%,45%)" }} />}
          <span style={{ fontSize: "13.5px", fontWeight: 700, color: "hsl(38,12%,88%)", letterSpacing: "-0.01em" }}>{display.label}</span>
          <span style={{
            fontSize: "10px", fontWeight: 600, padding: "0.1rem 0.45rem", borderRadius: "4px",
            background: "hsla(0,0%,100%,0.05)", color: "hsl(210,5%,48%)", letterSpacing: "0.04em",
          }}>{display.appStatus}</span>
        </div>
        <span style={{ fontSize: "12px", color: "hsl(210,5%,50%)", minWidth: "5rem" }}>
          {liveCount}/{product.total} proven
        </span>
        {issueCount > 0 && (
          <span style={{ fontSize: "11px", color: "#ef4444", fontWeight: 600 }}>
            {issueCount} issue{issueCount > 1 ? "s" : ""}
          </span>
        )}
        {issueCount === 0 && <span />}
        <div style={{ width: "120px" }}>
          <ReadinessBar score={product.readinessScore} color={color} />
        </div>
        <Link
          href={display.href}
          onClick={(e) => e.stopPropagation()}
          style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "11px", color: "hsl(210,5%,40%)", textDecoration: "none" }}
        >
          <ExternalLink size={11} />
        </Link>
      </button>

      {open && (
        <div style={{ padding: "0 1.25rem 1rem 3.5rem" }}>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: "0.35rem" }}>
            {product.capabilities.map((cap) => (
              <div key={cap.id} style={{
                display: "grid", gridTemplateColumns: "minmax(0,1fr) auto",
                gap: "1rem", alignItems: "start",
                padding: "0.55rem 0.875rem", borderRadius: "7px",
                background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.04)",
              }}>
                <div>
                  <p style={{ fontSize: "12.5px", color: "hsl(38,12%,80%)", marginBottom: "0.2rem", fontWeight: 500 }}>
                    {cap.capability_name}
                  </p>
                  <p style={{ fontSize: "11.5px", color: "hsl(210,5%,46%)", lineHeight: 1.5 }}>{cap.evidence}</p>
                  {cap.blocking_dependencies.length > 0 && (
                    <p style={{ fontSize: "11px", color: "#f59e0b", marginTop: "0.25rem" }}>
                      Blocked: {cap.blocking_dependencies.join(", ")}
                    </p>
                  )}
                </div>
                <StatusBadge status={cap.status as CapabilityStatus} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const SOLUTION_BRIEFS: Array<{ slug: string; product: string; label: string; href: string }> = [
  { slug: "lyte", product: "Lyte (Business Observability)", label: "Lyte — Decision Intelligence", href: "/briefs/lyte-solution-brief.pdf" },
  { slug: "aegis", product: "Aegis (Defense & Intelligence)", label: "Aegis — Unified Defense", href: "/briefs/aegis-solution-brief.pdf" },
  { slug: "vessels", product: "Vessels (Maritime Intelligence)", label: "Vessels — Maritime Intelligence", href: "/briefs/vessels-solution-brief.pdf" },
  { slug: "terra", product: "Terra (Real Estate Intelligence)", label: "Terra — Real Estate Intelligence", href: "/briefs/terra-solution-brief.pdf" },
  { slug: "carlota-jo", product: "Carlota Jo (Private Advisory)", label: "Carlota Jo — Private Advisory", href: "/briefs/carlota-jo-solution-brief.pdf" },
];

function SolutionBriefDownloads({ products }: { products: ProductSummary[] }) {
  const summaries = new Map(products.map(p => [p.product, p] as const));
  return (
    <section
      aria-labelledby="solution-brief-downloads"
      style={{
        marginTop: "2.5rem",
        padding: "1.5rem 1.75rem",
        borderRadius: "12px",
        border: "1px solid hsla(0,0%,100%,0.07)",
        background: "hsla(0,0%,100%,0.015)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.5rem" }}>
        <FileDown size={14} style={{ color: "hsl(38,55%,62%)" }} />
        <h2 id="solution-brief-downloads" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(38,55%,62%)", margin: 0 }}>
          Solution Briefs
        </h2>
      </div>
      <p style={{ fontSize: "13px", color: "hsl(210,5%,55%)", lineHeight: 1.6, marginBottom: "1.25rem", maxWidth: "60ch" }}>
        Each brief is generated directly from the capability manifest — capability counts, status mix, top proof points, and open risks. Regenerated on every manifest change so the figures always match this page.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: "0.75rem" }}>
        {SOLUTION_BRIEFS.map(brief => {
          const summary = summaries.get(brief.product);
          return (
            <a
              key={brief.slug}
              href={brief.href}
              download
              data-testid={`download-solution-brief-${brief.slug}`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.75rem",
                padding: "0.875rem 1rem",
                borderRadius: "9px",
                background: "hsla(0,0%,100%,0.025)",
                border: "1px solid hsla(0,0%,100%,0.06)",
                textDecoration: "none",
                transition: "background 0.18s, border-color 0.18s",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "hsl(38,12%,90%)", margin: 0, marginBottom: "0.2rem" }}>{brief.label}</p>
                <p style={{ fontSize: "11.5px", color: "hsl(210,5%,50%)", margin: 0 }}>
                  {summary
                    ? `${summary.total} capabilities · ${summary.readinessScore}% readiness · PDF`
                    : "PDF"}
                </p>
              </div>
              <FileDown size={14} style={{ color: "hsl(210,5%,46%)", flexShrink: 0 }} />
            </a>
          );
        })}
      </div>
    </section>
  );
}

const FOCUSED_PRODUCTS = [
  "Lyte (Business Observability)",
  "Aegis (Defense & Intelligence)",
  "Vessels (Maritime Intelligence)",
  "Terra (Real Estate Intelligence)",
  "Carlota Jo (Private Advisory)",
  "API Server",
  "SZL Holdings Corporate",
  "Sentra (Cyber Resilience)",
  "Command (Unified Command Portal)",
  "SZL Holdings Mobile",
  "Packages (Marketplace)",
  "Infrastructure / Security",
];

export default function ProductReadinessPage() {
  usePageMeta({
    title: "Product Readiness Matrix — SZL Holdings",
    description: "Live product readiness status for every SZL Holdings capability, driven by the platform capability manifest. No hand-edited claims.",
    canonical: "https://szlholdings.com/product-readiness",
  });

  const { products, totals, meta, flaggedClaims } = useCapabilityManifest();

  const focusedProducts = products
    .filter(p => FOCUSED_PRODUCTS.includes(p.product))
    .sort((a, b) => b.readinessScore - a.readinessScore);

  const platformScore = Math.round(
    ((totals.live * 1.0 + totals.working_demo * 0.75 + totals.partial * 0.4) / totals.total) * 100
  );

  return (
    <div style={{ minHeight: "100vh", background: "hsl(210,12%,5%)" }}>
      <SiteNav />
      <main id="main-content" role="main">

        <section style={{
          paddingTop: "clamp(7rem,12vw,10rem)",
          paddingBottom: "clamp(3rem,5vw,4rem)",
          borderBottom: "1px solid hsla(0,0%,100%,0.05)",
        }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
            <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
              <span style={{
                display: "inline-block", fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em",
                textTransform: "uppercase", color: "hsl(210,5%,48%)", marginBottom: "1.25rem",
              }}>
                Product Readiness
              </span>
              <h1 style={{
                fontSize: "clamp(1.875rem,3.5vw,2.75rem)", fontWeight: 700, letterSpacing: "-0.025em",
                color: "hsl(38,12%,94%)", marginBottom: "1rem", maxWidth: "36rem", lineHeight: 1.12,
              }}>
                Manifest-driven readiness matrix.
              </h1>
              <p style={{
                fontSize: "1rem", color: "hsl(210,5%,57%)", lineHeight: 1.68, maxWidth: "44ch", marginBottom: "1.5rem",
              }}>
                Every capability status here is derived directly from{" "}
                <code style={{ fontSize: "12px", color: "hsl(210,55%,65%)", background: "hsla(210,55%,52%,0.1)", padding: "0.1rem 0.4rem", borderRadius: "4px" }}>
                  artifacts/audit/platform-capability-manifest.json
                </code>
                . This page is never hand-edited. Last audited: {meta.generated}.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "1.5rem" }}>
                {[
                  { label: "Total capabilities", value: totals.total },
                  { label: "Live", value: totals.live, color: "#10b981" },
                  { label: "Working demo", value: totals.working_demo, color: "#3b82f6" },
                  { label: "Partial", value: totals.partial, color: "#f59e0b" },
                  { label: "Stub / Broken", value: totals.stub + totals.broken, color: "#ef4444" },
                ].map(stat => (
                  <div key={stat.label} style={{ display: "flex", flexDirection: "column" as const, gap: "0.2rem" }}>
                    <span style={{ fontSize: "1.5rem", fontWeight: 700, color: stat.color ?? "hsl(38,12%,92%)" }}>{stat.value}</span>
                    <span style={{ fontSize: "11px", color: "hsl(210,5%,46%)", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>{stat.label}</span>
                  </div>
                ))}
              </div>
            </m.div>
          </div>
        </section>

        <section style={{
          paddingTop: "clamp(3rem,5vw,4rem)", paddingBottom: "clamp(4rem,7vw,6rem)",
        }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
              <div>
                <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "hsl(210,5%,40%)", marginBottom: "0.5rem" }}>Platform Readiness Score</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
                  <span style={{ fontSize: "2.25rem", fontWeight: 700, color: "hsl(38,12%,92%)" }}>{platformScore}%</span>
                  <span style={{ fontSize: "13px", color: "hsl(210,5%,48%)" }}>weighted proven</span>
                </div>
              </div>
              {flaggedClaims.length > 0 && (
                <div style={{
                  padding: "0.625rem 1rem", borderRadius: "8px",
                  background: "hsla(38,85%,50%,0.08)", border: "1px solid hsla(38,85%,50%,0.18)",
                }}>
                  <p style={{ fontSize: "11px", fontWeight: 600, color: "#f59e0b" }}>{flaggedClaims.length} capabilities below demo threshold</p>
                  <p style={{ fontSize: "11px", color: "hsl(210,5%,46%)", marginTop: "0.2rem" }}>Stub, broken, or undocumented — not investor-presentable</p>
                </div>
              )}
            </div>

            <div style={{
              borderRadius: "12px", overflow: "hidden",
              border: "1px solid hsla(0,0%,100%,0.07)",
              background: "hsla(0,0%,100%,0.015)",
            }}>
              <div style={{
                display: "grid", gridTemplateColumns: "1fr auto auto auto auto",
                gap: "1rem", padding: "0.625rem 1.25rem",
                background: "hsla(0,0%,100%,0.03)",
                borderBottom: "1px solid hsla(0,0%,100%,0.06)",
              }}>
                {["Product", "Proven", "Issues", "Score", ""].map(h => (
                  <span key={h} style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "hsl(210,5%,38%)" }}>{h}</span>
                ))}
              </div>
              {focusedProducts.map((product, i) => (
                <m.div
                  key={product.product}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.035 }}
                >
                  <ProductRow product={product} />
                </m.div>
              ))}
            </div>

            <SolutionBriefDownloads products={products} />

            <div style={{ marginTop: "2.5rem", display: "flex", flexWrap: "wrap" as const, gap: "1rem", alignItems: "center" }}>
              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "1rem" }}>
                {(["live", "working_demo", "partial", "stub", "broken"] as CapabilityStatus[]).map(status => {
                  const meta = STATUS_META[status];
                  const Icon = meta.Icon;
                  return (
                    <span key={status} style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: "12px", color: meta.color }}>
                      <Icon size={11} style={{ color: meta.color }} />
                      {meta.label}
                    </span>
                  );
                })}
              </div>
              <span style={{ flex: 1 }} />
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontSize: "12px", color: "hsl(210,5%,40%)", textDecoration: "none" }}
              >
                <BookOpen size={12} />
                Source: platform-capability-manifest.json
              </a>
            </div>
          </div>
        </section>

      </main>
      <SiteFooter />
    </div>
  );
}
