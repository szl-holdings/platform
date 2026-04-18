import { m } from "framer-motion";
import { Link } from "wouter";
import { Map, ArrowRight, CheckCircle2, Circle, Clock } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const NOW = [
  {
    area: "Lyte proof",
    color: "hsl(145,62%,46%)",
    items: [
      { label: "PRISM Counsel live product across full workflow", done: true },
      { label: "Signal detection, twin enrichment, approval gates, audit trail", done: true },
      { label: "Export safety and Proof Chain on every document output", done: true },
      { label: "Full investor surface — architecture, trust, moat, roadmap, data room", done: true },
      { label: "Trust Center — security, governance, AI policy, approvals, exports, operations", done: true },
      { label: "Legal baseline — privacy, terms, cookies, acceptable use, security disclosure", done: true },
    ],
  },
  {
    area: "Alloy maturity",
    color: "var(--color-alloy-light)",
    items: [
      { label: "Alloy execution fabric operational across all verticals", done: true },
      { label: "Connector mesh — task, notification, API, document connectors live", done: true },
      { label: "Human-in-the-loop approval chain enforced at action-type level", done: true },
      { label: "Governance audit trail — immutable, queryable, exportable", done: true },
    ],
  },
  {
    area: "Trust & deployment posture",
    color: "hsl(258,55%,68%)",
    items: [
      { label: "Architecture page — full 6-layer pipeline documentation", done: true },
      { label: "Security overview — data handling, access control, SDLC, disclosure", done: true },
      { label: "API reference — 8 endpoint groups, auth model, error structure", done: true },
      { label: "SOC 2 Type II audit preparation", done: false, note: "Expected Q3 2026" },
    ],
  },
];

const NEXT = [
  {
    area: "Operational proof",
    color: "hsl(38,52%,58%)",
    items: [
      { label: "First paid pilot contract signed", done: false },
      { label: "Design-partner proof objects published — real data, real outcomes", done: false },
      { label: "3–5 design-partner agreements targeting paid pilot", done: false },
      { label: "Vessels entering design-partner engagement", done: false },
    ],
  },
  {
    area: "Docs & architecture surface",
    color: "var(--color-lyte-light)",
    items: [
      { label: "OpenAPI spec — machine-readable endpoint definitions", done: false },
      { label: "Integration documentation — connector setup guides", done: false },
      { label: "Deployment model documentation — environment, tenant onboarding", done: false },
    ],
  },
  {
    area: "Platform maturity",
    color: "hsl(145,62%,46%)",
    items: [
      { label: "Governance API documentation", done: false },
      { label: "SCIM 2.0 provisioning testing with enterprise identity providers", done: false },
      { label: "Azure AD multi-tenant SSO validation with design partners", done: false },
      { label: "Audit timeline and governed inference stability for enterprise load", done: false },
    ],
  },
];

const LATER = [
  {
    area: "Expansion",
    color: "hsl(210,80%,60%)",
    items: [
      { label: "Aegis and Terra entering commercial-stage design-partner engagement" },
      { label: "Cross-vertical analytics via shared Lyte command layer" },
      { label: "Enterprise GTM — Microsoft 365 integration as distribution lever" },
      { label: "First operating proof from Vessels maritime domain" },
    ],
  },
  {
    area: "Platform scale",
    color: "hsl(258,55%,68%)",
    items: [
      { label: "Carlota Jo entering commercial revenue phase" },
      { label: "Shared platform proving unit economics across multiple verticals" },
      { label: "ISO 27001 certification process" },
      { label: "Self-serve onboarding for mid-market enterprise teams" },
    ],
  },
  {
    area: "Trust & compliance maturity",
    color: "hsl(145,62%,46%)",
    items: [
      { label: "SOC 2 Type II certification complete" },
      { label: "ISO 27001 ISMS development" },
      { label: "Formal bug bounty program" },
      { label: "Regulatory compliance documentation per vertical (maritime, defense, real estate)" },
    ],
  },
];

function ItemRow({ label, done, note }: { label: string; done?: boolean; note?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem", padding: "0.375rem 0" }}>
      {done === true ? (
        <CheckCircle2 size={15} color="hsl(145,62%,46%)" style={{ flexShrink: 0, marginTop: "1px" }} />
      ) : done === false ? (
        <Clock size={15} color="hsl(40,90%,54%)" style={{ flexShrink: 0, marginTop: "1px" }} />
      ) : (
        <Circle size={15} color="hsl(214,7%,40%)" style={{ flexShrink: 0, marginTop: "1px" }} />
      )}
      <span style={{ fontSize: "0.9rem", lineHeight: 1.55, color: done === true ? "hsl(214,7%,65%)" : done === false ? "hsl(38,8%,82%)" : "hsl(214,7%,50%)" }}>
        {label}
        {note && <span style={{ fontSize: "0.8125rem", color: "hsl(214,7%,44%)", marginLeft: "0.5rem" }}>— {note}</span>}
      </span>
    </div>
  );
}

function RoadmapLane({ area, color, items, phase }: { area: string; color: string; items: { label: string; done?: boolean; note?: string }[]; phase: string }) {
  return (
    <div className="szl-card" style={{ borderRadius: "0.875rem", padding: "var(--space-card-pad)", borderLeft: `3px solid ${color}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1rem" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color }}>{area}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.125rem" }}>
        {items.map((item) => (
          <ItemRow key={item.label} label={item.label} done={item.done} note={item.note} />
        ))}
      </div>
    </div>
  );
}

export default function PublicRoadmapPage() {
  usePageMeta({
    title: "Roadmap — SZL Holdings",
    description: "SZL Holdings public roadmap — Now, Next, Later. Lyte proof, Alloy maturity, trust posture, docs, and staged expansion.",
    canonical: "https://szlholdings.com/roadmap",
  });

  return (
    <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)", color: "hsl(38,8%,95%)" }}>
      <SiteNav />
      <main id="main-content" role="main">

        <section className="szl-grid-texture" style={{ paddingTop: "var(--space-hero-pt)", paddingBottom: "clamp(4rem,8vw,6rem)", borderBottom: "1px solid var(--color-szl-border)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.3rem 0.875rem", borderRadius: "99px", border: "1px solid var(--color-szl-border-hover)", background: "hsla(0,0%,100%,0.04)", marginBottom: "1.75rem" }}>
                <Map size={13} color="var(--color-szl-text-muted)" />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-szl-text-secondary)" }}>Roadmap</span>
              </div>
              <h1 style={{ fontSize: "clamp(2.25rem,5vw,3.75rem)", fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.06, maxWidth: "22ch", marginBottom: "1.5rem" }}>
                Now, Next, Later.
              </h1>
              <p style={{ fontSize: "clamp(1rem,1.8vw,1.125rem)", lineHeight: 1.72, color: "hsl(214,7%,64%)", maxWidth: "54ch", marginBottom: "2rem" }}>
                A public view of where SZL Holdings is, where it's going, and what comes after.
                No fake completion dates. Honest about what's done and what's not.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.875rem", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                  <CheckCircle2 size={14} color="hsl(145,62%,46%)" />
                  <span style={{ fontSize: "0.8125rem", color: "hsl(214,7%,55%)" }}>Done</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                  <Clock size={14} color="hsl(40,90%,54%)" />
                  <span style={{ fontSize: "0.8125rem", color: "hsl(214,7%,55%)" }}>In progress</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                  <Circle size={14} color="hsl(214,7%,40%)" />
                  <span style={{ fontSize: "0.8125rem", color: "hsl(214,7%,55%)" }}>Planned</span>
                </div>
              </div>
            </m.div>
          </div>
        </section>

        {[
          { label: "Now", subtitle: "Current focus", color: "hsl(145,62%,46%)", lanes: NOW },
          { label: "Next", subtitle: "Active preparation", color: "hsl(38,52%,58%)", lanes: NEXT },
          { label: "Later", subtitle: "Staged expansion", color: "hsl(210,80%,60%)", lanes: LATER },
        ].map((phase, pi) => (
          <section key={phase.label} style={{ borderBottom: pi < 2 ? "1px solid var(--color-szl-border)" : "none", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", marginBottom: "2.5rem" }}>
                  <span style={{ fontSize: "clamp(1.75rem,3.5vw,2.5rem)", fontWeight: 700, letterSpacing: "-0.03em", color: phase.color }}>{phase.label}</span>
                  <span style={{ fontSize: "1rem", color: "hsl(214,7%,48%)", marginTop: "4px" }}>— {phase.subtitle}</span>
                </div>
              </m.div>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {phase.lanes.map((lane, li) => (
                  <m.div key={lane.area} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.38, delay: li * 0.07 }}>
                    <RoadmapLane area={lane.area} color={lane.color} items={lane.items} phase={phase.label} />
                  </m.div>
                ))}
              </div>
            </div>
          </section>
        ))}

        <section style={{ padding: "var(--space-section-sm) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
              <Link href="/investor" className="szl-btn-primary">
                Investor overview <ArrowRight size={14} />
              </Link>
              <Link href="/architecture" className="szl-btn-secondary">Architecture →</Link>
              <Link href="/trust" className="szl-btn-secondary">Trust Center →</Link>
              <Link href="/contact" className="szl-btn-ghost">Get in touch</Link>
            </div>
          </div>
        </section>

      </main>
      <SiteFooter />
    </div>
  );
}
