import { m } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowRight, GitBranch, Layers, CheckSquare, FileText, AlertOctagon,
  Workflow, Shield, Zap, Lock, Download, RefreshCw, Database, Filter,
  BarChart3, Network, BookOpen, Puzzle, Activity, Eye, Send,
  Dna, Brain, Target, Crosshair, Globe, Cpu, TrendingUp, Radio,
  ShieldAlert, Bug, Fingerprint, ScanLine
} from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";
import { AlloyOperatingLoopDiagram } from "@/components/diagrams/AlloyOperatingLoopDiagram";

const EVOLUTION_CAPABILITIES = [
  {
    icon: Dna,
    title: "Genetic Algorithm Core",
    body: "Alloy evolves its own decision architectures using tournament, roulette, rank, and elitist selection strategies. Workflows aren't designed — they're bred across generations against real fitness functions measured on your operational data.",
    badge: "Self-improving",
  },
  {
    icon: TrendingUp,
    title: "Multi-Objective Fitness",
    body: "Every genome is scored against configurable fitness dimensions — accuracy, latency, cost efficiency, and domain expertise. Pareto-optimal solutions surface automatically. No manual tuning required.",
    badge: "Pareto-optimal",
  },
  {
    icon: Cpu,
    title: "Crossover & Mutation Operators",
    body: "Single-point, two-point, and uniform crossover strategies combined with Gaussian and adaptive mutation. Alloy doesn't guess — it systematically explores the solution space with provable convergence.",
    badge: "Systematic exploration",
  },
  {
    icon: Activity,
    title: "Population Persistence",
    body: "Every generation, every genome, every fitness score is persisted and queryable. Roll back to any generation. Compare evolution trajectories. Audit exactly how and why a decision architecture emerged.",
    badge: "Full lineage",
  },
];

const EXPERT_DOMAINS = [
  { name: "Defense & Intelligence", desc: "Kill chain mapping, APT attribution, threat correlation, SIGINT/HUMINT fusion" },
  { name: "Maritime Operations", desc: "AIS monitoring, route optimization, fleet logistics, port operations" },
  { name: "Legal & Compliance", desc: "Case analysis, regulatory interpretation, deadline management, filing" },
  { name: "Real Estate Intelligence", desc: "Property valuation, market analysis, portfolio optimization, due diligence" },
  { name: "Financial Operations", desc: "Risk assessment, capital allocation, transaction monitoring, audit" },
  { name: "Executive Advisory", desc: "Strategic planning, stakeholder communication, lifestyle operations" },
  { name: "Technology Operations", desc: "Infrastructure monitoring, incident response, capacity planning" },
  { name: "Cross-Domain Synthesis", desc: "Multi-venture signal correlation, portfolio-level pattern recognition" },
  { name: "Governance & Policy", desc: "Compliance verification, policy simulation, regulatory alignment" },
];

const ROUTING_STRATEGIES = [
  { name: "Affinity-Weighted", desc: "Routes signals to experts based on a learned domain affinity matrix — the expert with the strongest cross-domain affinity score handles the signal." },
  { name: "Cascade", desc: "Tries the primary expert first. If confidence falls below threshold, cascades to the next-best expert. Continues until confidence is met or all experts are exhausted." },
  { name: "Ensemble", desc: "Routes to multiple experts simultaneously. Responses are merged with confidence-weighted voting. Higher confidence from domain specialists carries more weight." },
  { name: "Least-Loaded", desc: "Routes to the expert with the lowest current queue depth. Prevents bottlenecks and ensures consistent response latency across high-volume periods." },
];

const THREAT_FRAMEWORK = [
  { phase: "Spoofing", desc: "Identity impersonation across API, session, and credential boundaries" },
  { phase: "Tampering", desc: "Unauthorized modification of data in transit, at rest, and in processing pipelines" },
  { phase: "Repudiation", desc: "Actions taken without attribution or audit trail — the anti-pattern Alloy's governance eliminates" },
  { phase: "Information Disclosure", desc: "Data exfiltration, side-channel leaks, and unauthorized access to classified signals" },
  { phase: "Denial of Service", desc: "Resource exhaustion, queue flooding, and cascading failure scenarios" },
  { phase: "Elevation of Privilege", desc: "Horizontal and vertical privilege escalation across multi-tenant boundaries" },
];

const KILL_CHAIN_PHASES = [
  "Reconnaissance", "Weaponization", "Delivery", "Exploitation",
  "Installation", "Command & Control", "Actions on Objectives",
];

const APT_PROFILES = [
  { name: "APT-29 (Cozy Bear)", attribution: "SVR — Russian Foreign Intelligence", tactics: "Supply-chain compromise, cloud infrastructure exploitation, long-term persistence" },
  { name: "APT-28 (Fancy Bear)", attribution: "GRU — Russian Military Intelligence", tactics: "Spear-phishing, zero-day exploitation, credential harvesting at scale" },
  { name: "FIN7", attribution: "Financial Crime Syndicate", tactics: "Point-of-sale malware, social engineering, supply chain infiltration" },
];

const COMPETITIVE_MATRIX = [
  { feature: "Self-Evolving Decision Architecture", alloy: true, palantir: false, langchain: false, dify: false },
  { feature: "Genetic Algorithm Optimization", alloy: true, palantir: false, langchain: false, dify: false },
  { feature: "STRIDE Threat Modeling (Built-in)", alloy: true, palantir: false, langchain: false, dify: false },
  { feature: "Kill Chain Analysis", alloy: true, palantir: true, langchain: false, dify: false },
  { feature: "Multi-Expert Routing (MoE)", alloy: true, palantir: false, langchain: false, dify: false },
  { feature: "Human-in-the-Loop Gates", alloy: true, palantir: true, langchain: false, dify: true },
  { feature: "Immutable Audit Trail", alloy: true, palantir: true, langchain: false, dify: false },
  { feature: "Cross-Domain Signal Fusion", alloy: true, palantir: true, langchain: false, dify: false },
  { feature: "9-Phase Operating Loop", alloy: true, palantir: false, langchain: false, dify: false },
  { feature: "Real APT Adversary Profiles", alloy: true, palantir: true, langchain: false, dify: false },
];

const OPERATING_LOOP = [
  { phase: "Ingestion", step: "01", icon: Database, description: "Alloy receives structured signal feeds from all connected packs and integrations — PRISM Counsel, Terra, Vessels, Aegis, Carlota Jo, and external data sources. Every signal enters the pipeline with source attribution, timestamp, and context metadata intact." },
  { phase: "Normalization", step: "02", icon: Filter, description: "Raw signals are normalized into a consistent schema — typed, de-duplicated, and enriched with entity resolution. Signals from different packs using different schemas are reconciled into a single structured format before evaluation begins." },
  { phase: "Evaluation", step: "03", icon: BarChart3, description: "Each normalized signal is evaluated against configurable criteria — severity thresholds, SLA proximity, asset criticality, and cross-pack blast radius. Evaluation logic is auditable and explainable: every score has a traceable rationale." },
  { phase: "Recommendation", step: "04", icon: Layers, description: "Evaluated signals are scored, ranked, and assembled into prioritized action recommendations. Recommendation factors include severity, velocity, ownership gap, and portfolio-level impact." },
  { phase: "Routing", step: "05", icon: Network, description: "Ranked signals are routed to the right actor — with role-based assignment, escalation paths, and channel context already structured. Every routing decision is logged with the routing key, assignee, and authority basis." },
  { phase: "Workflow Execution", step: "06", icon: GitBranch, description: "Consequential actions pass through human approval gates before execution. Alloy tracks SLAs, escalates stalled approvals, and verifies that actions taken match actions authorized." },
  { phase: "Audit Preservation", step: "07", icon: FileText, description: "Every stage — ingestion, evaluation, routing, approval, execution — is logged in a structured audit record. Attributed to real actors and exportable for compliance." },
  { phase: "Explainability", step: "08", icon: BookOpen, description: "Every signal evaluation, routing decision, and action outcome is explainable — who scored it, what criteria applied, what alternative paths existed, and why the chosen path was taken." },
  { phase: "Extensibility", step: "09", icon: Puzzle, description: "New packs plug in via the connector mesh. New evaluation criteria can be configured without code changes. New workflow types register against existing approval infrastructure." },
];

const CAPABILITIES = [
  { icon: GitBranch, title: "Workflow Orchestration", body: "Structured workflows with role-based assignment, escalation paths, and SLA tracking. Every task has an owner, a deadline, and a record." },
  { icon: CheckSquare, title: "Human-in-the-Loop Gates", body: "Consequential actions require explicit human approval before execution. HITL gates are configurable by action type, risk level, and role." },
  { icon: AlertOctagon, title: "Escalation Logic", body: "When actions stall, Alloy escalates automatically — reassignment, supervisor notification, or hard stops for high-risk situations." },
  { icon: FileText, title: "Immutable Audit Trail", body: "Every action, decision, approval, and outcome is logged with full attribution — who acted, when, with what authority, and what changed." },
  { icon: Download, title: "Export & Write-Back Controls", body: "Structured exports, redaction controls, and write-back authorizations. Every data movement has an owner and a record." },
  { icon: Layers, title: "Signal Normalization", body: "Signals from Lyte and connected systems normalized into a structured action queue — standardized priority, context, and routing logic." },
  { icon: Workflow, title: "Connector Mesh", body: "Integrates with CRMs, communication tools, approval systems, and vertical-specific platforms. No rip and replace." },
  { icon: RefreshCw, title: "Cross-Pack Orchestration", body: "A single Alloy action can span multiple packs. An Aegis incident triggers a Terra diligence hold. A PRISM approval gates a Vessels clearance." },
  { icon: Zap, title: "Execution Verification", body: "Confirms actions taken, tracks exceptions where actions weren't taken, and escalates when execution diverges from approval." },
];

const AUDIT_FIELDS = [
  "Actor identity (role + name)", "Timestamp and duration", "Decision context and rationale",
  "Before/after state", "Authorization basis", "Escalation path taken",
  "Outcome classification", "Linked signal reference", "AI involvement flag", "Export and write-back log",
];

const EXPANSION_LANES = [
  { name: "Lyte", desc: "Cross-pack executive command surfaces signals into Alloy for governed portfolio-level action routing." },
  { name: "PRISM Counsel", desc: "Legal workflow approvals, settlement decisions, and compliance filings run through Alloy approval gates." },
  { name: "Terra", desc: "Acquisition decisions, diligence approvals, and LP-ready exports governed through Alloy action chains." },
  { name: "Vessels", desc: "Rerouting decisions, port notifications, and regulatory filings routed with human approval and full audit record." },
  { name: "Aegis", desc: "Security incident response, remediation actions, and compliance evidence governed through analyst-gated workflows." },
  { name: "Carlota Jo", desc: "Intake authorizations, service milestone confirmations, and delivery approvals structured through Alloy." },
];

const sectionPad = "var(--space-section-md)";
const contentMax = { maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" } as const;
const cardPad = "var(--space-card-pad)";
const monoLabel: React.CSSProperties = { fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-alloy-light)", marginBottom: "1rem" };
const sectionH2: React.CSSProperties = { fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "34ch", marginBottom: "1.25rem" };
const sectionP: React.CSSProperties = { fontSize: "0.9375rem", lineHeight: 1.70, color: "hsl(214,7%,58%)", maxWidth: "52ch", marginBottom: "2.5rem" };
const iconBox: React.CSSProperties = { width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-alloy-muted)", border: "1px solid var(--color-alloy-border)", borderRadius: "0.4375rem", marginBottom: "1rem" };
const badgeStyle: React.CSSProperties = { display: "inline-block", fontFamily: "var(--font-mono)", fontSize: "0.5625rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-alloy-light)", background: "var(--color-alloy-muted)", border: "1px solid var(--color-alloy-border)", borderRadius: "4px", padding: "2px 8px" };

function SectionShell({ children, border = true }: { children: React.ReactNode; border?: boolean }) {
  return (
    <section style={{ borderBottom: border ? "1px solid var(--color-szl-border)" : undefined, padding: `${sectionPad} 0` }}>
      <div style={contentMax}>{children}</div>
    </section>
  );
}

export default function AlloyPage() {
  usePageMeta({
    title: "Alloy — Self-Evolving AI Platform | SZL Holdings",
    description: "Alloy is a self-evolving AI platform with genetic decision architecture, mixture-of-experts routing, defense-grade threat modeling, and governed execution — built for enterprises operating across defense, maritime, legal, real estate, and technology.",
    canonical: "https://szlholdings.com/platform/alloy",
  });

  return (
    <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)", color: "hsl(38,8%,95%)" }}>
      <SiteNav />
      <main id="main-content" role="main">

        {/* ===== HERO ===== */}
        <section
          className="szl-grid-texture szl-depth-glow-alloy"
          style={{
            paddingTop: "var(--space-hero-pt)",
            paddingBottom: "clamp(5rem,9vw,7rem)",
            borderBottom: "1px solid var(--color-szl-border)",
          }}
        >
          <div style={contentMax}>
            <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <span className="szl-badge-alloy" style={{ borderRadius: "9999px", marginBottom: "1.75rem", display: "inline-block" }}>
                Alloy · Self-Evolving AI Platform
              </span>
            </m.div>

            <div style={{ display: "grid", gap: "clamp(2.5rem,5vw,4rem)", alignItems: "start" }} className="lg:grid-cols-[1.2fr_0.8fr]">
              <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.05 }}>
                <h1
                  style={{
                    fontSize: "clamp(2.5rem,5.5vw,4.25rem)",
                    fontWeight: 600,
                    letterSpacing: "-0.03em",
                    lineHeight: 1.05,
                    marginBottom: "1.5rem",
                    maxWidth: "22ch",
                  }}
                >
                  Intelligence that evolves itself.
                </h1>
                <p
                  style={{
                    fontSize: "clamp(1rem,1.8vw,1.125rem)",
                    lineHeight: 1.72,
                    color: "hsl(214,7%,64%)",
                    maxWidth: "50ch",
                    marginBottom: "0.875rem",
                  }}
                >
                  Alloy is a self-evolving AI platform that breeds its own decision architectures through genetic algorithms, routes signals through domain-specialized experts, and models threats against real-world adversary profiles — all with defense-grade governance and full audit preservation.
                </p>
                <p
                  style={{
                    fontSize: "clamp(0.9375rem,1.6vw,1rem)",
                    lineHeight: 1.72,
                    color: "hsl(214,7%,52%)",
                    maxWidth: "50ch",
                    marginBottom: "2.25rem",
                  }}
                >
                  Not another wrapper around an LLM. A platform that gets measurably better every generation — with provable convergence, explainable decisions, and zero autonomous execution without human approval.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                  <Link href="/demo" className="szl-btn-primary">
                    See Alloy in action <ArrowRight size={15} />
                  </Link>
                  <Link href="/trust/architecture" className="szl-btn-secondary">
                    Architecture overview
                  </Link>
                </div>
              </m.div>

              <m.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.15 }}
                className="szl-alloy-card"
                style={{ borderRadius: "0.875rem", padding: "clamp(1.25rem,3vw,1.75rem)" }}
              >
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "1rem" }}>
                  Platform Architecture
                </p>
                {[
                  { label: "Genetic Evolution Engine", detail: "4 selection strategies, crossover + mutation" },
                  { label: "Expert Router (MoE)", detail: "9 domain experts, 4 routing strategies" },
                  { label: "STRIDE Threat Engine", detail: "Kill chain mapping, 3 APT profiles" },
                  { label: "9-Phase Operating Loop", detail: "Ingest → Audit, zero bypass" },
                  { label: "COVENANT Policy Engine", detail: "Simulation-first, no autonomous execution" },
                  { label: "A2A Agent Protocol", detail: "Structured delegation with receipts" },
                  { label: "Connector Mesh", detail: "CRM, legal, maritime, defense integrations" },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.875rem", marginBottom: i < 6 ? "0.5rem" : 0 }}>
                    <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "var(--color-alloy-muted)", border: "1px solid var(--color-alloy-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", fontWeight: 700, color: "var(--color-alloy-light)" }}>{i + 1}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-alloy-light)", letterSpacing: "-0.01em" }}>{item.label}</span>
                      <span style={{ fontSize: "0.75rem", color: "var(--color-szl-text-muted)", marginLeft: "0.5rem" }}>{item.detail}</span>
                    </div>
                  </div>
                ))}
              </m.div>
            </div>
          </div>
        </section>

        {/* ===== GENETIC EVOLUTION ENGINE ===== */}
        <SectionShell>
          <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
            <p style={monoLabel}>
              <Dna size={12} style={{ display: "inline", marginRight: "6px", verticalAlign: "-1px" }} />
              Genetic Evolution Engine
            </p>
            <h2 style={sectionH2}>
              Alloy doesn't just run workflows. It evolves them.
            </h2>
            <p style={sectionP}>
              Most AI platforms are static — you configure a prompt chain and it runs the same way forever. Alloy uses real genetic algorithms to evolve its decision architectures across generations. Every population breeds, mutates, crosses over, and converges toward Pareto-optimal solutions measured against your actual operational fitness functions.
            </p>
          </m.div>
          <div style={{ display: "grid", gap: "1rem" }} className="lg:grid-cols-2">
            {EVOLUTION_CAPABILITIES.map((cap, i) => {
              const Icon = cap.icon;
              return (
                <m.div
                  key={cap.title}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.38, delay: i * 0.06 }}
                  className="szl-card"
                  style={{ borderRadius: "0.75rem", padding: cardPad }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.875rem" }}>
                    <div style={{ ...iconBox, marginBottom: 0 }}>
                      <Icon size={16} color="var(--color-alloy-light)" />
                    </div>
                    <h3 style={{ fontSize: "1rem", fontWeight: 700, letterSpacing: "-0.012em", color: "hsl(38,8%,88%)" }}>{cap.title}</h3>
                  </div>
                  <p style={{ fontSize: "0.875rem", lineHeight: 1.68, color: "hsl(214,7%,60%)", marginBottom: "0.875rem" }}>{cap.body}</p>
                  <span style={badgeStyle}>{cap.badge}</span>
                </m.div>
              );
            })}
          </div>

          <m.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="szl-alloy-card"
            style={{ borderRadius: "0.875rem", padding: "clamp(1.25rem,3vw,1.75rem)", marginTop: "1.5rem" }}
          >
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "1rem" }}>
              Evolution Lifecycle
            </p>
            <div style={{ display: "grid", gap: "0.5rem" }} className="md:grid-cols-2">
              {[
                "Initialize random population with configurable genome length",
                "Evaluate each genome against multi-dimensional fitness function",
                "Select parents via tournament, roulette, rank, or elitist strategy",
                "Apply crossover (single-point, two-point, uniform) to breed offspring",
                "Mutate offspring genes with Gaussian noise and adaptive rates",
                "Persist population state, fitness history, and lineage to database",
                "Promote elite genomes and cull low-fitness individuals",
                "Repeat until convergence threshold or generation limit reached",
              ].map((step, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.625rem", fontWeight: 700, color: "var(--color-alloy-light)", minWidth: "14px", paddingTop: "2px" }}>{String(i + 1).padStart(2, "0")}</span>
                  <span style={{ fontSize: "0.8125rem", lineHeight: 1.55, color: "hsl(214,7%,68%)" }}>{step}</span>
                </div>
              ))}
            </div>
          </m.div>
        </SectionShell>

        {/* ===== EXPERT ROUTING (MoE) ===== */}
        <SectionShell>
          <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
            <p style={monoLabel}>
              <Brain size={12} style={{ display: "inline", marginRight: "6px", verticalAlign: "-1px" }} />
              Mixture-of-Experts Router
            </p>
            <h2 style={sectionH2}>
              Every signal routed to the expert that knows the domain best.
            </h2>
            <p style={sectionP}>
              Inspired by Mixture-of-Experts architectures in large language models, Alloy's Expert Router maintains 9 specialized domain experts with a learned affinity matrix. Signals are routed using configurable strategies — affinity-weighted, cascade, ensemble, or least-loaded — with confidence scoring and structured routing logs.
            </p>
          </m.div>

          <div style={{ display: "grid", gap: "1rem", marginBottom: "2rem" }} className="lg:grid-cols-2">
            {ROUTING_STRATEGIES.map((strat, i) => (
              <m.div
                key={strat.name}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.36, delay: i * 0.06 }}
                className="szl-card"
                style={{ borderRadius: "0.75rem", padding: cardPad }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.625rem" }}>
                  <Radio size={14} color="var(--color-alloy-light)" />
                  <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, letterSpacing: "-0.012em", color: "hsl(38,8%,88%)" }}>{strat.name}</h3>
                </div>
                <p style={{ fontSize: "0.875rem", lineHeight: 1.68, color: "hsl(214,7%,60%)" }}>{strat.desc}</p>
              </m.div>
            ))}
          </div>

          <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
            <p style={{ ...monoLabel, marginBottom: "0.75rem" }}>Domain Experts</p>
          </m.div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {EXPERT_DOMAINS.map((expert, i) => (
              <m.div
                key={expert.name}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.32, delay: i * 0.04 }}
                style={{ display: "flex", alignItems: "flex-start", gap: "1.25rem", padding: "0.75rem 1rem", borderRadius: "8px", background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.06)" }}
              >
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 700, color: "var(--color-alloy-light)", minWidth: "180px", paddingTop: "1px" }}>{expert.name}</span>
                <p style={{ fontSize: "0.8125rem", lineHeight: 1.55, color: "hsl(214,7%,60%)" }}>{expert.desc}</p>
              </m.div>
            ))}
          </div>
        </SectionShell>

        {/* ===== THREAT ENGINE (STRIDE + KILL CHAIN) ===== */}
        <SectionShell>
          <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
            <p style={monoLabel}>
              <ShieldAlert size={12} style={{ display: "inline", marginRight: "6px", verticalAlign: "-1px" }} />
              Defense-Grade Threat Engine
            </p>
            <h2 style={sectionH2}>
              STRIDE threat modeling meets Lockheed Martin Kill Chain analysis.
            </h2>
            <p style={sectionP}>
              Alloy doesn't wait for attacks. It models them — using the STRIDE framework for systematic threat identification and Lockheed Martin's Cyber Kill Chain for adversary progression mapping. Real APT profiles (Cozy Bear, Fancy Bear, FIN7) provide ground-truth adversary behavior patterns for threat simulation.
            </p>
          </m.div>

          <div style={{ display: "grid", gap: "1rem", marginBottom: "2rem" }} className="lg:grid-cols-3 md:grid-cols-2">
            {THREAT_FRAMEWORK.map((threat, i) => (
              <m.div
                key={threat.phase}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.36, delay: i * 0.05 }}
                className="szl-card"
                style={{ borderRadius: "0.75rem", padding: cardPad }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.625rem" }}>
                  <ScanLine size={14} color="var(--color-alloy-light)" />
                  <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, letterSpacing: "-0.012em", color: "hsl(38,8%,88%)" }}>{threat.phase}</h3>
                </div>
                <p style={{ fontSize: "0.8125rem", lineHeight: 1.65, color: "hsl(214,7%,60%)" }}>{threat.desc}</p>
              </m.div>
            ))}
          </div>

          <div style={{ display: "grid", gap: "1.5rem" }} className="lg:grid-cols-2">
            <m.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="szl-alloy-card"
              style={{ borderRadius: "0.875rem", padding: "clamp(1.25rem,3vw,1.5rem)" }}
            >
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "0.75rem" }}>
                Cyber Kill Chain Phases
              </p>
              {KILL_CHAIN_PHASES.map((phase, i) => (
                <div key={phase} style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: i < KILL_CHAIN_PHASES.length - 1 ? "0.375rem" : 0 }}>
                  <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: i < 4 ? "hsla(45,80%,55%,0.15)" : "hsla(0,70%,55%,0.15)", border: `1px solid ${i < 4 ? "hsla(45,80%,55%,0.3)" : "hsla(0,70%,55%,0.3)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", fontWeight: 700, color: i < 4 ? "hsl(45,80%,65%)" : "hsl(0,70%,65%)" }}>{i + 1}</span>
                  </div>
                  <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "hsl(214,7%,72%)" }}>{phase}</span>
                </div>
              ))}
            </m.div>

            <m.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="szl-alloy-card"
              style={{ borderRadius: "0.875rem", padding: "clamp(1.25rem,3vw,1.5rem)" }}
            >
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "0.75rem" }}>
                Real Adversary Profiles
              </p>
              {APT_PROFILES.map((apt, i) => (
                <div key={apt.name} style={{ padding: "0.625rem 0", borderBottom: i < APT_PROFILES.length - 1 ? "1px solid hsla(0,0%,100%,0.06)" : undefined }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                    <Fingerprint size={12} color="var(--color-alloy-light)" />
                    <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "hsl(38,8%,88%)" }}>{apt.name}</span>
                  </div>
                  <p style={{ fontSize: "0.75rem", color: "hsl(214,7%,55%)", marginBottom: "0.125rem" }}>{apt.attribution}</p>
                  <p style={{ fontSize: "0.75rem", color: "hsl(214,7%,48%)" }}>{apt.tactics}</p>
                </div>
              ))}
            </m.div>
          </div>
        </SectionShell>

        {/* ===== COMPETITIVE POSITIONING ===== */}
        <SectionShell>
          <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
            <p style={monoLabel}>
              <Target size={12} style={{ display: "inline", marginRight: "6px", verticalAlign: "-1px" }} />
              Competitive Position
            </p>
            <h2 style={sectionH2}>
              Not another AI wrapper. A category of one.
            </h2>
            <p style={sectionP}>
              Palantir AIP starts at $1M+ ARR and offers no self-evolution. LangChain is a developer toolkit with no governance. Dify is a no-code builder with no threat modeling. Alloy combines genetic evolution, expert routing, and defense-grade threat modeling in a single governed platform — and it's running in production today.
            </p>
          </m.div>

          <m.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem", minWidth: "600px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid hsla(0,0%,100%,0.1)" }}>
                  <th style={{ textAlign: "left", padding: "0.75rem 0.875rem", fontFamily: "var(--font-mono)", fontSize: "0.625rem", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-szl-text-muted)" }}>Capability</th>
                  <th style={{ textAlign: "center", padding: "0.75rem 0.625rem", fontFamily: "var(--font-mono)", fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-alloy-light)" }}>Alloy</th>
                  <th style={{ textAlign: "center", padding: "0.75rem 0.625rem", fontFamily: "var(--font-mono)", fontSize: "0.625rem", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-szl-text-muted)" }}>Palantir AIP</th>
                  <th style={{ textAlign: "center", padding: "0.75rem 0.625rem", fontFamily: "var(--font-mono)", fontSize: "0.625rem", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-szl-text-muted)" }}>LangChain</th>
                  <th style={{ textAlign: "center", padding: "0.75rem 0.625rem", fontFamily: "var(--font-mono)", fontSize: "0.625rem", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-szl-text-muted)" }}>Dify</th>
                </tr>
              </thead>
              <tbody>
                {COMPETITIVE_MATRIX.map((row, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid hsla(0,0%,100%,0.04)" }}>
                    <td style={{ padding: "0.5rem 0.875rem", color: "hsl(214,7%,72%)" }}>{row.feature}</td>
                    {[row.alloy, row.palantir, row.langchain, row.dify].map((v, j) => (
                      <td key={j} style={{ textAlign: "center", padding: "0.5rem 0.625rem" }}>
                        {v ? (
                          <span style={{ color: "hsl(142,60%,55%)", fontWeight: 700 }}>&#10003;</span>
                        ) : (
                          <span style={{ color: "hsl(0,0%,35%)" }}>&#8212;</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </m.div>
        </SectionShell>

        {/* ===== OPERATING LOOP ===== */}
        <SectionShell>
          <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
            <p style={monoLabel}>The Operating Loop</p>
            <h2 style={sectionH2}>
              Every signal follows the same governed path — from ingestion to audit record.
            </h2>
            <p style={sectionP}>
              No stage is skipped. No signal bypasses evaluation or routing. Human approval gates are structural — not configurable away. The loop is the same for a legal approval, a security remediation, and a maritime rerouting decision.
            </p>
          </m.div>
          <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}>
            <AlloyOperatingLoopDiagram />
          </m.div>
        </SectionShell>

        {/* ===== DETAILED PHASES ===== */}
        <SectionShell>
          <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
            <p style={monoLabel}>Each Phase</p>
            <h2 style={{ ...sectionH2, maxWidth: "30ch", marginBottom: "3rem" }}>
              Nine phases. Every consequential action covered.
            </h2>
          </m.div>
          <div style={{ display: "grid", gap: "1rem" }} className="lg:grid-cols-3 md:grid-cols-2">
            {OPERATING_LOOP.map((phase, i) => {
              const Icon = phase.icon;
              return (
                <m.div
                  key={phase.phase}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.38, delay: i * 0.05 }}
                  className="szl-card"
                  style={{ borderRadius: "0.75rem", padding: cardPad }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.875rem" }}>
                    <div style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-alloy-muted)", border: "1px solid var(--color-alloy-border)", borderRadius: "6px", flexShrink: 0 }}>
                      <Icon size={14} color="var(--color-alloy-light)" />
                    </div>
                    <div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.5625rem", fontWeight: 600, color: "var(--color-alloy-light)", letterSpacing: "0.08em", textTransform: "uppercase" }}>{phase.step}</div>
                      <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, letterSpacing: "-0.012em", color: "hsl(38,8%,88%)" }}>{phase.phase}</h3>
                    </div>
                  </div>
                  <p style={{ fontSize: "0.875rem", lineHeight: 1.68, color: "hsl(214,7%,60%)" }}>{phase.description}</p>
                </m.div>
              );
            })}
          </div>
        </SectionShell>

        {/* ===== EXPANSION LANES ===== */}
        <SectionShell>
          <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
            <p style={monoLabel}>Alloy Across the Portfolio</p>
            <h2 style={{ ...sectionH2, maxWidth: "30ch" }}>
              One execution fabric. Every pack inherits it.
            </h2>
            <p style={sectionP}>
              Alloy is not built once per pack. It is the shared execution infrastructure that every pack — and every new lane — inherits. When a new vertical joins the platform, it gets Alloy's full approval, audit, routing, and governance stack from day one.
            </p>
          </m.div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {EXPANSION_LANES.map((lane, i) => (
              <m.div
                key={lane.name}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.36, delay: i * 0.06 }}
                style={{ display: "flex", alignItems: "flex-start", gap: "1.25rem", padding: "1rem 1.25rem", borderRadius: "8px", background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.06)" }}
              >
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 700, color: "var(--color-alloy-light)", minWidth: "110px", paddingTop: "1px" }}>{lane.name}</span>
                <p style={{ fontSize: "0.875rem", lineHeight: 1.6, color: "hsl(214,7%,60%)" }}>{lane.desc}</p>
              </m.div>
            ))}
          </div>
        </SectionShell>

        {/* ===== CORE CAPABILITIES ===== */}
        <SectionShell>
          <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
            <p style={monoLabel}>Capabilities</p>
            <h2 style={{ ...sectionH2, maxWidth: "30ch", marginBottom: "3rem" }}>
              Every layer of the execution stack, built for accountability and control.
            </h2>
          </m.div>
          <div className="szl-grid-3">
            {CAPABILITIES.map((cap, i) => {
              const Icon = cap.icon;
              return (
                <m.div
                  key={cap.title}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.38, delay: i * 0.06 }}
                  className="szl-card"
                  style={{ borderRadius: "0.75rem", padding: cardPad }}
                >
                  <div style={iconBox}>
                    <Icon size={16} color="var(--color-alloy-light)" />
                  </div>
                  <h3 style={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.012em", marginBottom: "0.625rem" }}>{cap.title}</h3>
                  <p style={{ fontSize: "0.875rem", lineHeight: 1.68, color: "hsl(214,7%,60%)" }}>{cap.body}</p>
                </m.div>
              );
            })}
          </div>
        </SectionShell>

        {/* ===== AUDIT TRAIL ===== */}
        <SectionShell>
          <div style={{ display: "grid", gap: "clamp(3rem,6vw,5rem)", alignItems: "center" }} className="lg:grid-cols-2">
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <p style={monoLabel}>Audit-grade execution</p>
              <h2 style={{ ...sectionH2, marginBottom: "1.25rem" }}>
                Not just logging. Full attribution for every decision, action, and export.
              </h2>
              <p style={{ fontSize: "0.9375rem", lineHeight: 1.70, color: "hsl(214,7%,62%)", maxWidth: "46ch", marginBottom: "1.5rem" }}>
                Alloy's audit trail is designed for capital, compliance, and customer diligence — not just internal debugging. Every field is structured, exportable, and tied to an actor, a timestamp, and an authorization basis.
              </p>
              <Link href="/trust/governance" className="szl-btn-ghost" style={{ paddingLeft: 0 }}>
                See governance architecture <ArrowRight size={14} />
              </Link>
            </m.div>
            <m.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.10 }}
              className="szl-alloy-card"
              style={{ borderRadius: "0.875rem", padding: "clamp(1.5rem,3vw,2rem)" }}
            >
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "1.25rem" }}>
                Every audit record captures
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem" }}>
                {AUDIT_FIELDS.map((field) => (
                  <div key={field} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                    <Shield size={12} color="var(--color-alloy-light)" style={{ marginTop: "3px", flexShrink: 0, opacity: 0.7 }} />
                    <span style={{ fontSize: "0.8125rem", lineHeight: 1.55, color: "hsl(214,7%,68%)" }}>{field}</span>
                  </div>
                ))}
              </div>
            </m.div>
          </div>
        </SectionShell>

        {/* ===== GOVERNED EXECUTION ===== */}
        <SectionShell>
          <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
            <p style={monoLabel}>Governed Execution Layer</p>
            <h2 style={{ ...sectionH2, maxWidth: "32ch" }}>
              From intent to verified execution — with accountability at every step.
            </h2>
            <p style={sectionP}>
              Alloy's product layer turns goals into governed DAGs, replays every decision, simulates policy outcomes before going live, and delegates to specialized agents with structured receipts.
            </p>
          </m.div>
          <div style={{ display: "grid", gap: "1rem" }} className="lg:grid-cols-2 xl:grid-cols-3">
            {[
              { icon: GitBranch, tag: "Action Graph Compiler", title: "Goal \u2192 Executable DAG", body: "Define an objective. Alloy compiles it into an executable plan with branch logic, fallback paths, and approval gates \u2014 rendered as an interactive DAG before any execution begins.", badge: "Simulation-first" },
              { icon: Activity, tag: "Execution Replay", title: "Step-by-step Replay Timeline", body: "Every completed run shows a full replay: what tools were called, what was seen, what was approved or blocked, evidence collected, and timestamps \u2014 down to the millisecond.", badge: "Structured audit trail" },
              { icon: Shield, tag: "COVENANT Policy Engine", title: "Policy Simulation Console", body: "Test 'what would happen if' scenarios against COVENANT policies before running live. See projected approve, block, escalate, and defer outcomes for any proposed action.", badge: "No live execution" },
              { icon: Send, tag: "A2A Protocol", title: "Agent Handoff & Delegation", body: "Alloy delegates subtasks to specialized agents \u2014 internal or remote \u2014 using the A2A protocol. Every delegation is tracked with a structured receipt including status and completion verification.", badge: "Tracked receipts" },
              { icon: FileText, tag: "Trust Layer", title: "Run-grade Trust Receipts", body: "Every completed run produces a structured receipt: inputs, outputs, policy decisions, evidence chain, confidence levels, approval records, and duration \u2014 designed for compliance export.", badge: "Audit-grade receipts" },
              { icon: Eye, tag: "Governance", title: "Clearly Marked Boundaries", body: "Alloy is explicit about what is simulation versus live execution. Policy gates are structural, not configurable away. Human approval is enforced \u2014 not optional \u2014 for consequential actions.", badge: "No autonomous execution" },
            ].map((cap, i) => {
              const Icon = cap.icon;
              return (
                <m.div
                  key={cap.title}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.38, delay: i * 0.06 }}
                  className="szl-card"
                  style={{ borderRadius: "0.75rem", padding: cardPad }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.875rem" }}>
                    <div style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-alloy-muted)", border: "1px solid var(--color-alloy-border)", borderRadius: "6px", flexShrink: 0 }}>
                      <Icon size={14} color="var(--color-alloy-light)" />
                    </div>
                    <div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.5625rem", fontWeight: 600, color: "var(--color-alloy-light)", letterSpacing: "0.08em", textTransform: "uppercase" }}>{cap.tag}</div>
                      <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, letterSpacing: "-0.012em", color: "hsl(38,8%,88%)", marginTop: "1px" }}>{cap.title}</h3>
                    </div>
                  </div>
                  <p style={{ fontSize: "0.875rem", lineHeight: 1.68, color: "hsl(214,7%,60%)", marginBottom: "0.875rem" }}>{cap.body}</p>
                  <span style={badgeStyle}>{cap.badge}</span>
                </m.div>
              );
            })}
          </div>
        </SectionShell>

        {/* ===== EXPORT / WRITE-BACK ===== */}
        <SectionShell>
          <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
            <p style={monoLabel}>Controlled Outputs</p>
            <h2 style={{ ...sectionH2, maxWidth: "30ch", marginBottom: "1.5rem" }}>
              Every export and write-back is governed, not assumed.
            </h2>
            <p style={sectionP}>
              Alloy treats data movement as a consequential action. Exports to Word, PDF, or external systems require authorization. Write-backs to connected platforms are tracked. Redaction rules apply at the record level.
            </p>
          </m.div>
          <div style={{ display: "grid", gap: "1rem" }} className="lg:grid-cols-3">
            {[
              { icon: Download, title: "Structured Export", body: "Demand letters, audit packets, compliance reports, and data exports governed by format, content, and authorization controls." },
              { icon: Lock, title: "Redaction Controls", body: "Privilege-aware, PII-aware, and role-aware redaction applied at the record level before any export leaves the system." },
              { icon: RefreshCw, title: "Write-Back Governance", body: "Data written back to CRMs, case management systems, or connected platforms is tracked with actor attribution and authorization basis." },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <m.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.38, delay: i * 0.07 }}
                  className="szl-card"
                  style={{ borderRadius: "0.75rem", padding: cardPad }}
                >
                  <div style={iconBox}>
                    <Icon size={16} color="var(--color-alloy-light)" />
                  </div>
                  <h3 style={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.012em", marginBottom: "0.625rem" }}>{item.title}</h3>
                  <p style={{ fontSize: "0.875rem", lineHeight: 1.68, color: "hsl(214,7%,60%)" }}>{item.body}</p>
                </m.div>
              );
            })}
          </div>
        </SectionShell>

        {/* ===== CTA ===== */}
        <section style={{ padding: `${sectionPad} 0` }}>
          <div style={contentMax}>
            <m.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
              className="szl-card szl-grid-cta"
              style={{ borderRadius: "1rem", padding: "clamp(2.5rem,5vw,4rem)", gap: "2.5rem", alignItems: "center" }}
            >
              <div>
                <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.2, marginBottom: "0.875rem" }}>
                  Ready to deploy intelligence that evolves itself?
                </h2>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.70, color: "hsl(214,7%,62%)", maxWidth: "48ch" }}>
                  Talk to us about applying Alloy to one critical workflow — with genetic evolution, expert routing, defense-grade threat modeling, and full governance from day one.
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", flexShrink: 0 }}>
                <Link href="/contact" className="szl-btn-primary">
                  Start a conversation <ArrowRight size={14} />
                </Link>
                <Link href="/platform" className="szl-btn-secondary" style={{ textAlign: "center" }}>
                  Full platform overview
                </Link>
              </div>
            </m.div>
          </div>
        </section>

      </main>
      <SiteFooter />
    </div>
  );
}
