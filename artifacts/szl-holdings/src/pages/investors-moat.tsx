import { Link } from "wouter";
import {
  Shield,
  ArrowRight,
  Lock,
  Layers,
  Brain,
  Database,
  GitBranch,
  Globe,
  FileCheck2,
  Workflow,
  Network,
  Cpu,
} from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const moats = [
  {
    icon: Brain,
    number: "01",
    title: "Decision Memory",
    category: "Data",
    tagline: "The accumulation of every governed decision ever made in the platform.",
    body: "The Outcome Graph tracks the full lifecycle of every recommendation — signal that triggered it, agent that proposed it, human who decided on it, and outcome that resulted. As the platform accumulates decisions across domains and organizations, it builds structured memory of what recommendations get accepted, what actions produce good outcomes, and where confidence scores are miscalibrated. Month 1: static priors. Year 2: thousands of real decisions, real calibration data no competitor can replicate.",
    evidence: ["lib/outcome-graph/ — core library", "recordRecommendation(), recordDecision(), recordOutcome(), triggerLearningJob()", "getOutcomeStats() — acceptance rate, achievement rate, override frequency per agent/domain", "Outcome data feeds @szl-holdings/monte-carlo for simulation calibration"],
    replication: "You cannot synthetic-generate this data. It requires real operators making real decisions with real consequences.",
  },
  {
    icon: FileCheck2,
    number: "02",
    title: "Proof and Provenance",
    category: "Trust",
    tagline: "An immutable, cryptographically verifiable audit trail for every consequential action.",
    body: "The Proof Chain generates a complete, verifiable record of every significant platform action. AI recommendations carry model identity, source citations, retrieval provenance, confidence scores, and export safety status. The chain is immutable — entries cannot be modified or deleted. In regulated industries (finance, maritime, legal, defense), an unbroken audit chain has direct regulatory value. Each month of operations adds to an evidence library the enterprise cannot simply abandon.",
    evidence: ["lib/proof-chain/ — core library", "tagAIContent(), reviewProof(), assertExportSafe(), getProofChain()", "isExportSafe() — guard used before all client-facing document generation", "Source classification: llm_generated, human_authored, system_computed, external_ingested, hybrid"],
    replication: "A competitor can build a logging system. They cannot replicate the accumulated proof history of an organization that has been running on the platform for 18 months. A gap in the chain is a compliance problem.",
  },
  {
    icon: Lock,
    number: "03",
    title: "Covenant Policy",
    category: "Governance",
    tagline: "An enterprise-grade policy engine that enforces human-in-the-loop governance at the platform layer.",
    body: "The Covenant Policy engine defines and enforces what agents and users can do, under what conditions, with what approval requirements. Human-in-the-loop is not a UI pattern — it is a policy constraint enforced before any consequential action executes. Every enterprise customer configures their policy layer over time: approval thresholds, role-specific constraints, regulatory requirements. As AI regulations tighten (EU AI Act, SEC guidelines), having a provably compliant, human-gated AI system becomes a strategic differentiator.",
    evidence: ["lib/covenant-policy/ — core library", "checkPermission(), assertPermission(), createApprovalRequest(), reviewApproval()", "COVENANT_POLICY_TEMPLATES — pre-defined policy sets for common governance scenarios", "Decision outcomes: permit, deny, escalate — enforced in middleware, cannot be bypassed by UI or direct API"],
    replication: "A competitor can add an approval button to their UI. They cannot replicate a structural policy engine that governs agents at the library layer, wired into every domain pack. Building this takes 12–18 months of engineering.",
  },
  {
    icon: Workflow,
    number: "04",
    title: "Decision Simulation",
    category: "Intelligence",
    tagline: "Monte Carlo probabilistic simulation before action — baked into every consequential decision.",
    body: "The Monte Carlo engine runs thousands of probabilistic trials before a recommendation is presented. The operator sees not just 'what to do' but 'what could happen if we do it' — with confidence intervals, sensitivity analysis, and scenario comparison. Domain scenarios (AEGIS_CYBER_RISK, VESSELS_VOYAGE_COST, TERRA_DEAL_RETURN, PRISM_SETTLEMENT_RANGE) are calibrated over time using real outcome data. Once operators make decisions informed by simulation results, they become dependent on that intelligence.",
    evidence: ["lib/monte-carlo/ — core library", "runSimulation(), computeSensitivity(), calibrate(), DOMAIN_SCENARIO_LIBRARY", "Distribution support: Normal, LogNormal, Uniform, Triangular, PERT, Discrete, Custom empirical", "Results feed outcome-graph entries — historical outcomes calibrate future simulations (closed-loop)"],
    replication: "A competitor can implement a Monte Carlo engine. They cannot replicate the domain-specific calibration that comes from thousands of real governed decisions. The simulation is only as good as its calibration data.",
  },
  {
    icon: Network,
    number: "05",
    title: "Observability Correlation",
    category: "Network",
    tagline: "Cross-domain signal correlation that surfaces intelligence no single-domain tool can produce.",
    body: "The Event Fabric (PRISM Bus) normalizes events from all domain sources and enables cross-domain correlation — a sanctions hit in Vessels can surface a legal risk flag in PRISM Counsel, triggering a policy escalation in Lyte, appearing as an approval request in CORTEX. Each domain pack added contributes new signal sources. Correlation value grows nonlinearly with domain pack count. The more domain packs an organization runs, the more cross-domain intelligence they receive — unavailable anywhere else.",
    evidence: ["lib/prism-bus/ — core library", "publish(), subscribe(), publishAndWait() — event operations", "Event types: domain_signal, cross_domain_correlation, workflow_triggered, approval_requested, policy_decision", "Command Portal 8-domain SSE dashboard surfaces cross-domain signals in real-time"],
    replication: "A single-domain tool cannot offer cross-domain correlation by definition. A platform competitor would need to build equivalent domain packs and accumulate equivalent signal history simultaneously.",
  },
  {
    icon: Cpu,
    number: "06",
    title: "Agent Gateway",
    category: "Technical",
    tagline: "A governed, role-enforced, audit-logged gateway for AI agents operating across all domains.",
    body: "The MCP gateway provides a structured, standards-based interface for AI agents to access platform capabilities. 23 tools, 4 resources, and 5 prompt templates — every call role-enforced, tenant-scoped, and audit-logged. As AI agent usage grows in enterprise (LangChain, Claude, GPT-4 Agents), the platform becomes the governed execution environment. Enterprise IT teams face increasing pressure to govern AI agent activity. The SZL gateway is the only one in its category with full role enforcement, tenant isolation, and immutable audit logging.",
    evidence: ["lib/mcp-client/ — MCP client library", "23 tools, 4 resources, 5 prompt templates via /api/mcp", "Tool classes: public read, tenant read, analysis, workflow trigger, approval action, admin-only", "Agent identity: agents present session tokens, subject to same RBAC as human users"],
    replication: "Building an MCP server takes weeks. Building a governed, role-enforced, multi-domain gateway with 23 tools across 6 domain packs — with audit logging, tenant isolation, and approval gate integration — requires the full platform stack.",
  },
  {
    icon: Layers,
    number: "07",
    title: "Domain-Pack Extensibility",
    category: "Architectural",
    tagline: "An architectural model that adds governance to new domains without rebuilding the governance infrastructure.",
    body: "A domain pack is not a separate product — it is a governed extension of the shared platform. It inherits the full governance stack: Proof Chain, Covenant Policy, Outcome Graph, Monte Carlo, Workflow Engine, Event Fabric, RBAC, CORTEX mobile command, and the API server. Each domain pack added requires less governance engineering because the infrastructure is already built. The marginal cost of Domain Pack 7 is significantly lower than Domain Pack 1. Each new pack also adds signal sources and correlation opportunities for all existing packs.",
    evidence: ["Domain pack structure: signal source → domain agent → domain UI → shared primitive inheritance", "Current packs: Aegis, Vessels, Terra, PRISM Counsel, Carlota Jo, IMPERIUM (in dev)", "37 shared packages every domain pack inherits: @szl-holdings/shared-ui, db, auth, workflow-engine, ai-engine", "Domain pack artifacts: aegis/, vessels/, terra/, carlota-jo/"],
    replication: "A single-domain tool cannot offer this. A multi-domain competitor would need to build the same governance infrastructure and accumulate the same domain-specific signal depth. The architecture takes years to design and validate across six domains.",
  },
  {
    icon: Globe,
    number: "08",
    title: "Enterprise Trust Infrastructure",
    category: "GTM",
    tagline: "A buyer-facing trust layer that reduces procurement friction in regulated industries.",
    body: "Enterprise buyers in regulated industries require specific answers before procurement: Who approved this AI output? Can we audit every decision? Is our data isolated from other tenants? Does your AI have human approval gates? SZL Holdings has built these answers into the architecture — not into marketing materials. The Trust Center, Proof Chain, Covenant Policy, RBAC model, and multi-tenant isolation are all inspectable and verifiable by enterprise security teams. Each enterprise that completes diligence creates a reference architecture that accelerates the next customer's procurement.",
    evidence: ["TRUST_CENTER_INDEX.md — trust documentation index", "docs/trust/ — security posture, deployment model, privacy boundaries", "ACCESS-CONTROL-MATRIX.md — full RBAC documentation", "KNOWN-GAPS.md — transparent gap registry (itself a trust signal)", "Trust center pages: /trust-center, /trust/security, /trust/governance, /trust/ai"],
    replication: "Publishing a security page is easy. Building trust infrastructure that enterprise security teams can actually inspect — with real RBAC documentation, real gap registries, real audit trail implementation — requires the full platform stack and a track record of honesty about gaps.",
  },
];

const moatInteractions = [
  "Decision Memory calibrates Monte Carlo simulations — more decisions mean better calibration",
  "Proof Chain enables Enterprise Trust — switching cost is the accumulated audit history",
  "Covenant Policy powers the Agent Gateway — agents governed by the same policy layer as humans",
  "Event Fabric powers Observability Correlation — more domain packs mean more correlation value",
  "Domain Extensibility enables all other moats to compound simultaneously with each new pack",
];

export default function InvestorsMoatPage() {
  usePageMeta({
    title: "Moat & Defensibility — Investor Relations — SZL Holdings",
    description: "Eight structural moats of the SZL Holdings governed decision operating system — architectural and network properties that compound in value over time.",
    canonical: "https://szlholdings.com/investors/moat",
  });

  return (
    <div className="min-h-screen bg-[#070a10] text-white">
      <SiteNav />
      <main>
        {/* Hero */}
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8 lg:py-28">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d4a054]/20 bg-[#d4a054]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#d4a054]">
              <Shield className="h-3.5 w-3.5" />
              Moat & Defensibility
            </div>
            <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-tight text-white md:text-6xl">
              Eight structural moats. All compound with use.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/72">
              SZL Holdings is not defensible because of a feature advantage. It is defensible because of
              structural properties that grow stronger with every decision made on the platform. A new
              entrant would need to replicate all eight simultaneously — without the accumulated context
              that makes each one valuable.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/investors/overview" className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/[0.08]">
                Back to overview
              </Link>
              <Link href="/demo" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90">
                See the live product <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Moat cards */}
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">Eight structural moats</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Each moat is grounded in a specific technical capability.</h2>
            <div className="mt-10 space-y-6">
              {moats.map((m) => (
                <div key={m.number} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 lg:p-8">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-black/30">
                      <m.icon className="h-5 w-5 text-[#d4a054]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-xs font-bold tracking-[0.2em] text-white/30">{m.number}</span>
                        <h3 className="text-lg font-semibold text-white">{m.title}</h3>
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium uppercase text-white/40">{m.category}</span>
                      </div>
                      <p className="mt-1 text-sm font-medium text-[#d4a054]/80">{m.tagline}</p>
                      <p className="mt-3 text-sm leading-7 text-white/60">{m.body}</p>

                      <div className="mt-5 grid gap-2 sm:grid-cols-2">
                        {m.evidence.map((e) => (
                          <div key={e} className="flex items-start gap-2 rounded-lg border border-white/[0.05] bg-black/20 px-3 py-2">
                            <Database className="mt-0.5 h-3 w-3 shrink-0 text-white/30" />
                            <span className="font-mono text-[10px] leading-4 text-white/40">{e}</span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 rounded-lg border border-[#d4a054]/10 bg-[#d4a054]/[0.04] px-4 py-3">
                        <p className="text-xs leading-5 text-white/50"><span className="font-semibold text-[#d4a054]/70">Replication cost: </span>{m.replication}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Moat interaction */}
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">Moat interaction</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">The moats compound each other.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/60">
              The eight moats operate independently and reinforce each other. A platform that compounds
              on five dimensions simultaneously across eight structural advantages is not a feature roadmap
              — it is an architectural position.
            </p>
            <div className="mt-8 space-y-3">
              {moatInteractions.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <GitBranch className="mt-0.5 h-4 w-4 shrink-0 text-[#d4a054]" />
                  <p className="text-sm leading-6 text-white/65">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Decision Fabric extension */}
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">April 2026 extension</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Decision Fabric — cross-primitive query layer.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/60">
              The Decision Fabric exposes every governance primitive as a unified, queryable API under a single
              correlation ID. Workflow 360 joins signal, recommendation, policy, simulation, execution, proof,
              and outcome. Entity Investigation shows everything that ever touched an entity across all primitives.
              Recommendation Trace follows an AI output from generation to outcome, including prediction error.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {[
                { title: "End-to-end traceability as API", body: "Customers who build compliance workflows on these surfaces inherit five primitives' worth of data wiring. Replicating it requires rebuilding the correlation contract from scratch." },
                { title: "Decision memory with replay", body: "decision_records carry frozen policy_version and simulation_snapshot links. Years after a decision, an auditor can reconstruct the exact policy text and simulation parameters. No competitor freezes both at decision time." },
                { title: "Deterministic learning loop", body: "runLearningCycle() is a pure function of the decision_records corpus. Same inputs always produce the same calibration report. Customers can audit the learning loop the same way they audit a policy — it is a contract, not a black box." },
              ].map((item) => (
                <div key={item.title} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                  <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-xs leading-5 text-white/55">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Nav */}
        <section>
          <div className="mx-auto max-w-6xl px-6 py-14 lg:px-8">
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: "Overview", href: "/investors/overview", icon: Shield },
                { label: "Roadmap", href: "/investors/roadmap", icon: Layers },
                { label: "Trust Center", href: "/trust-center", icon: Lock },
              ].map((item) => (
                <Link key={item.label} href={item.href}>
                  <div className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 transition hover:bg-white/[0.04]">
                    <item.icon className="h-4 w-4 text-[#d4a054]" />
                    <span className="text-sm font-medium text-white/80">{item.label}</span>
                    <ArrowRight className="ml-auto h-3.5 w-3.5 text-white/25" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
