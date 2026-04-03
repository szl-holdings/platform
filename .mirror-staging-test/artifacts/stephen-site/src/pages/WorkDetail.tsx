import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Link, useRoute } from "wouter";
import { ArrowLeft } from "lucide-react";

type CaseStudy = {
  title: string;
  year: string;
  role: string;
  description: string;
  problem: string;
  approach: string[];
  architecture: string[];
  outcome: string[];
  link?: string;
  tags: string[];
};

const projectData: Record<string, CaseStudy> = {
  terra: {
    title: "Terra — Real Estate Intelligence",
    year: "2024–present",
    role: "Founder & Architect",
    description: "Distress-first real estate intelligence platform for operators, brokers, and capital allocators working across New York City's five boroughs.",
    problem: "Real estate operators have access to more data than ever — MLS feeds, transaction records, permit filings, tax arrears — but no way to turn that data into a ranked, actionable list of distressed opportunities. The industry still runs on cold calls and gut feel. Comparable sales analysis tells you what the market did, not what it's about to do.",
    approach: [
      "Rejected the comparables model as the primary lens. Most platforms show you what sold at what price. That's backwards-looking. The real opportunity is identifying properties under pressure before they hit the market.",
      "Built a multi-factor distress scoring engine that weighs tax arrears, mortgage delinquency signals, permit violations, foreclosure filings, vacancy indicators, and ownership structure flags — producing a single ranked score per property.",
      "Designed the product for the operator workflow, not the researcher workflow. Every property in the database gets a distress tier: Critical, High, Moderate, Watch. The operator's job is to work the list from the top.",
      "Integrated borough-level market context so operators can understand whether a distress signal is idiosyncratic or part of a broader pattern — which changes the acquisition thesis substantially.",
    ],
    architecture: [
      "Ingestion pipeline pulls from NYC open data sources (ACRIS, HPD, DOF) on a scheduled basis, normalizing records across different borough-level schemas.",
      "Scoring engine runs as a separate service with configurable factor weights — allowing operators to tune the model toward their specific acquisition criteria (e.g., tax distress vs. structural violations).",
      "PostgreSQL with PostGIS for spatial queries — borough boundaries, neighborhood overlap, and radius search all run natively in the database layer.",
      "CRM layer built into the platform so deal pipeline lives adjacent to the intelligence — operators can move from distress signal to deal tracking without leaving the product.",
      "Row-level security ensures brokerage teams see only their deals; enterprise tenants get fully isolated schemas.",
    ],
    outcome: [
      "Terra now covers all five NYC boroughs with distress scoring across 800,000+ properties.",
      "Operators using the platform have moved from a reactive acquisition model — waiting for listings — to a proactive one, reaching owners before assets are marketed.",
      "The distress scoring model surfaces pre-foreclosure opportunities an average of 60–90 days ahead of public listing.",
      "The platform has replaced three separate tools for a growing number of teams: market research, deal sourcing, and pipeline CRM.",
    ],
    link: "/terra/",
    tags: ["Real Estate", "Distress Intelligence", "PostGIS", "NYC Data"],
  },
  alloy: {
    title: "Alloy — Execution Fabric",
    year: "2024–present",
    role: "Founder & Architect",
    description: "The workflow orchestration and signal routing engine that powers the SZL ecosystem — built as infrastructure, not a chatbot.",
    problem: "As the SZL portfolio grew, I kept rebuilding the same things: workflow approval chains, artifact generation pipelines, cross-system signal routing, confidence scoring, and audit trails. Each platform had its own version of these. The problem wasn't feature duplication — it was logic duplication. Every change to approval semantics had to be made in six places.",
    approach: [
      "Decided to extract the common substrate into a platform-level engine rather than a shared library. A shared library still requires each platform to orchestrate it. An execution fabric owns the orchestration itself.",
      "Modeled everything as signals and workflows, not tasks and queues. A signal is a structured event with a source, payload, confidence, and routing context. A workflow is a sequence of steps that transforms, approves, or escalates signals into outcomes.",
      "Built Alloy as the decision layer, not the data layer. It doesn't store the source data — it receives signals from platforms that do, orchestrates actions, and emits artifacts back to them.",
      "Designed for cross-platform composability from day one. A signal originating in Vessels can trigger a workflow in Lyte that produces an artifact consumed by Aegis. The routing is declarative, not hardcoded.",
    ],
    architecture: [
      "Signal normalization layer accepts heterogeneous payloads from any SZL platform and maps them to a canonical signal schema with typed fields, confidence scores, and source attribution.",
      "Workflow engine stores directed acyclic graphs of steps — each step has an executor (AI model, function, human approval gate) and a condition for progression.",
      "Agent scheduler handles async execution with retry, backoff, and dead-letter handling. Long-running workflows survive server restarts.",
      "Artifact generation layer produces structured outputs — reports, decisions, escalation packets — in formats consumable by downstream platforms.",
      "Observability is built into the engine: every signal and workflow execution is logged with full chain-of-custody, enabling post-hoc audit of any decision the system made.",
    ],
    outcome: [
      "Alloy is now the runtime for decision workflows across Vessels (voyage exception management), Lyte (infrastructure alert routing), and Aegis (threat escalation chains).",
      "Reduced logic duplication across the portfolio by approximately 70% — workflows that previously existed in three separate codebases now run centrally.",
      "The confidence scoring framework means every AI-assisted decision produced by the ecosystem carries a structured evidence chain, not just a percentage.",
      "New platform integrations that would have taken 4–6 weeks to build from scratch now take days by plugging into existing Alloy signal types and workflow templates.",
    ],
    link: "/alloy/",
    tags: ["Workflow Orchestration", "Signal Routing", "Platform Infrastructure", "AI Coordination"],
  },
  "lyte-command-center": {
    title: "Lyte Command Center",
    year: "2024",
    role: "Founder & Architect",
    description: "Unified AI operations dashboard for infrastructure observability, multi-model routing, and cross-portfolio command.",
    problem: "Running six platforms means six sets of infrastructure signals to monitor — server health, model latency, error rates, job queues, database performance, and cost metrics. I was context-switching between dashboards constantly, and I still couldn't see the cross-platform picture: when an Alloy job backed up, what was the downstream effect on Vessels response times? No existing tool answered that question.",
    approach: [
      "Started from the principle that observability and command should live in the same surface. You shouldn't have to switch from 'I see a problem' to 'I'm doing something about it' by opening a different tool.",
      "Designed Lyte around the concept of signals, not metrics. A metric tells you a number. A signal tells you something changed and why you should care. The dashboard surfaces signals ranked by urgency, not by recency.",
      "Built multi-model AI routing into the core, not as a wrapper around OpenAI. Lyte manages model selection based on task type, latency requirements, cost budget, and availability — with fallback chains when a provider degrades.",
      "Designed the command mode as a separate interface from the monitoring view — optimised for decision-making under time pressure, not for quarterly reviews.",
    ],
    architecture: [
      "Platform agents run as lightweight collectors on each SZL platform, emitting structured telemetry events to a central event bus via the API server.",
      "Signal aggregation layer normalises metrics across platforms into a common schema, computes derived signals (cross-platform latency correlations, cost anomalies), and scores urgency.",
      "Multi-model router maintains a live registry of AI provider health — response time, error rate, token throughput — and routes inference requests dynamically, with cost-aware scheduling.",
      "Command mode is a separate React surface that loads the top-N active signals and provides contextual action templates: escalate, acknowledge, remediate, defer.",
      "Full audit log for every command action — who did what, when, with what context — stored immutably for post-incident review.",
    ],
    outcome: [
      "Platform monitoring time reduced from 45+ minutes of daily context-switching across dashboards to a single 10-minute review in Lyte.",
      "Multi-model routing has reduced AI inference costs by approximately 30% through intelligent provider selection without sacrificing output quality.",
      "Cross-platform signal correlation caught two production issues before they became user-facing: a database connection pool leak in Vessels surfaced as a latency anomaly in Alloy jobs 40 minutes before errors appeared.",
      "Lyte is now the operational nerve centre for the full SZL portfolio — the first place I open in the morning and the last place I check at night.",
    ],
    link: "/lyte-command-center/",
    tags: ["AI Operations", "Observability", "Multi-Model Routing", "Command Interface"],
  },
  vessels: {
    title: "Vessels Maritime Intelligence",
    year: "2024–present",
    role: "Founder & Architect",
    description: "Enterprise maritime intelligence platform for fleet executives, commercial managers, and compliance functions — from AIS tracking to voyage economics to dark vessel detection.",
    problem: "Maritime fleet management operates with enormous information gaps. AIS data is noisy, delayed, and easy to manipulate. Voyage P&L calculations are done manually in spreadsheets. Sanctions exposure checks run on a weekly batch basis rather than continuously. A fleet operator typically knows where their vessels are, but not whether their ETA deviations are costing them money, whether a vessel is signalling anomalous behaviour, or whether a counterparty has changed sanctions status since the charter was signed.",
    approach: [
      "Focused the initial product on the three problems fleet operators lose sleep over: real-time position accuracy, voyage economics, and sanctions exposure. Everything else — predictive maintenance, port congestion, weather routing — is valuable but not urgent.",
      "Built the exception management model around a simple principle: a platform that shows you everything is a platform that shows you nothing. Vessels surfaces vessels in exception, not vessels in normal operation. The operator's job is to keep the exception queue empty.",
      "Designed voyage P&L as a first-class data model, not a reporting feature. Revenue, cost, delay exposure, charter performance, and TCE are live calculations, not end-of-voyage summaries.",
      "Dark vessel detection uses AIS signal gap analysis combined with historical track patterns and geographic context — a vessel that goes dark near a sanctioned port is flagged differently to one that goes dark in a known AIS dead zone.",
    ],
    architecture: [
      "AIS data pipeline ingests and normalises feeds from multiple providers, resolving vessel identity conflicts across MMSI, IMO, and name fields.",
      "Voyage model stores the full lifecycle of a voyage — fixture, departure, waypoints, ETA revisions, arrival, out-turn — with all financial data attached to the voyage object, not computed at report time.",
      "Sanctions screening runs continuously against the voyage counterparty graph: owner, operator, flag state, charterer, port of call. Any state change triggers an alert.",
      "Multi-tenant architecture with separate schema namespaces per operator — voyage P&L data never crosses tenant boundaries even in shared infrastructure.",
      "Role-based access: fleet executives see aggregate views, commercial managers see voyage economics, compliance functions see sanctions dashboards. The data model is unified; the surface is role-aware.",
    ],
    outcome: [
      "Vessels now tracks 200+ vessels across global shipping lanes with real-time exception monitoring.",
      "The voyage P&L model has eliminated the spreadsheet workflow for commercial managers at pilot clients — all voyage financial data now lives in the platform.",
      "Sanctions screening has moved from weekly batch to continuous — compliance teams have visibility into exposure changes within minutes rather than days.",
      "Dark vessel detection has flagged activity in high-risk geographic zones that manual monitoring would have missed, prompting charter due diligence reviews.",
    ],
    link: "/vessels/",
    tags: ["Maritime", "AIS Tracking", "Voyage Economics", "Sanctions Compliance"],
  },
  "szl-holdings": {
    title: "SZL Holdings",
    year: "2023–present",
    role: "Founder & CEO",
    description: "Strategic technology portfolio spanning enterprise software, maritime intelligence, AI infrastructure, real estate intelligence, and consulting — built to compound across a shared architectural foundation.",
    problem: "The dominant model for an ambitious technical founder is: find one problem, build one product, raise money, scale it. I thought this was the wrong model for my situation. The most interesting opportunities I saw were in domains where deep technical infrastructure could be reused across multiple vertical applications — and where the intelligence each platform generated would make the others better.",
    approach: [
      "Structured SZL as a holding company from the start, not a product company that later diversified. This changes the capital allocation model, the brand architecture, and how shared infrastructure investments are justified.",
      "Built the shared infrastructure layer first — authentication, observability, component library, AI routing, workflow engine — rather than rebuilding it for each product. Each new platform inherits what the portfolio has already built.",
      "Chose domains where I had genuine operational knowledge, not just technical skill. Maritime intelligence required understanding charter economics. Real estate intelligence required understanding NYC acquisition workflows. The domain knowledge is part of the defensibility.",
      "Positioned the portfolio for enterprise buyers, not SMBs. Enterprise relationships are harder to close but more durable, less price-sensitive, and more likely to generate the reference cases needed for the next sale.",
    ],
    architecture: [
      "Single API server handles cross-platform authentication, routing, and data isolation — each platform gets its own schema namespace within a shared PostgreSQL cluster.",
      "Shared UI component library means design decisions made once propagate across all six platforms — reducing frontend maintenance overhead substantially.",
      "Alloy is the cross-platform execution layer — workflows built once can be invoked by any platform in the portfolio.",
      "Lyte provides unified observability across the full portfolio — one dashboard, all platforms, cross-signal correlation.",
      "Each platform maintains brand and product independence while sharing the underlying infrastructure — separate deployments, separate domains, shared engineering foundations.",
    ],
    outcome: [
      "Six live platforms built across five domains in under two years, operated by a single founding engineer.",
      "Shared infrastructure means new platform development time has dropped by approximately 60% compared to the first platform — each new product inherits more of the stack.",
      "The portfolio is positioned for three distinct buyer categories: enterprise operators (Vessels, Terra, Aegis), AI platform buyers (Alloy, Lyte), and advisory clients (Carlota Jo).",
      "SZL Holdings is the model I believe is right for a founder who wants to build meaningful systems, not just features — compounding value across a coherent architectural thesis rather than chasing single-product scale.",
    ],
    link: "/szl-holdings/",
    tags: ["Portfolio Company", "Enterprise Strategy", "Shared Infrastructure", "Compounding Architecture"],
  },
  aegis: {
    title: "Aegis — Unified Defense & Intelligence Command",
    year: "2024–present",
    role: "Founder & Architect",
    description: "Unified command surface for defense, cybersecurity, and intelligence operations — three historically separate verticals converged into one operational layer.",
    problem: "Defense technology has a fragmentation problem. SOC teams use one platform. Threat intelligence teams use another. MSP operations teams use a third. None of these surfaces talk to each other, so the picture that matters — the correlated threat landscape across all three — doesn't exist anywhere. An analyst in the SOC sees an anomaly; an intelligence analyst sees a related pattern; an MSP operator sees unusual client activity. Three separate signals that are one coordinated event.",
    approach: [
      "Identified that the problem is fundamentally a command surface problem, not a data problem. All three functions generate data. The gap is the unified layer that correlates it and surfaces the combined picture to the right operator.",
      "Decided against building another SIEM. The market is crowded with data aggregators. The real gap is in the decision layer — not 'what happened' but 'what does it mean, what do we do, and who needs to know.'",
      "Built the product around the MITRE ATT&CK framework as the common language across SOC, intelligence, and MSP functions — ensuring that a technique observed in one context is recognisable in another.",
      "Designed for the analyst workflow first, the executive view second. Most platforms are built for the dashboard that executives present to boards. Aegis is built for the analyst who has 45 minutes to understand an incident.",
    ],
    architecture: [
      "Unified event ingestion layer normalises signals from endpoint agents, network sensors, threat intelligence feeds, and MSP monitoring into a common event schema.",
      "Correlation engine links events across sources using entity resolution — IP addresses, hostnames, user identities, file hashes — building a unified entity graph rather than separate alert queues.",
      "Intelligence layer maps correlated events to MITRE ATT&CK techniques, computes campaign confidence, and surfaces likely adversary profiles based on TTP patterns.",
      "MSP command module provides client fleet visibility for managed service providers — consolidated client health, alert routing, and escalation management.",
      "Immutable audit chain for every analyst action — decisions, escalations, remediations — stored with full context for post-incident review and regulatory compliance.",
    ],
    outcome: [
      "Aegis unified three previously separate operational surfaces into a single command layer — reducing analyst context-switching between tools during active incident response.",
      "The correlation engine has surfaced cross-client patterns in the MSP module that isolated client monitoring would have missed — identifying coordinated campaigns that appeared as isolated incidents in individual client dashboards.",
      "The MITRE ATT&CK mapping layer has reduced mean time to hypothesis — how long it takes an analyst to form a working theory about an incident — from hours to minutes.",
      "Aegis represents the architectural thesis in its most concentrated form: one command surface, three operational domains, unified intelligence layer, full audit chain.",
    ],
    link: "/firestorm/",
    tags: ["Cybersecurity", "Threat Intelligence", "SOC Operations", "MSP Command"],
  },
};

export function WorkDetail() {
  const [match, params] = useRoute("/work/:slug");
  const slug = params?.slug || "";
  const project = projectData[slug];

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Project not found</p>
          <Link href="/work" className="text-primary hover:underline">Back to work</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 lg:px-12 pt-28 pb-24">
        <div className="mb-10">
          <Link href="/work" className="inline-flex items-center gap-2 text-[12px] text-muted-foreground hover:text-primary transition-colors mb-8">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to work
          </Link>
          <p className="text-[10px] font-mono text-white/25 mb-1">{project.year} · {project.role}</p>
          <h1 className="text-3xl font-bold text-foreground mb-4">{project.title}</h1>
          <p className="text-muted-foreground text-[15px] leading-relaxed mb-4">{project.description}</p>
          <div className="flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <span key={tag} className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-white/5 text-white/40 border border-white/8">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-10">
          <div className="border-t border-white/5 pt-8">
            <h2 className="text-[11px] font-semibold text-primary/50 uppercase tracking-[0.15em] mb-4">The Problem</h2>
            <p className="text-muted-foreground text-[14.5px] leading-[1.75]">{project.problem}</p>
          </div>

          <div className="border-t border-white/5 pt-8">
            <h2 className="text-[11px] font-semibold text-primary/50 uppercase tracking-[0.15em] mb-5">The Approach</h2>
            <ul className="space-y-4">
              {project.approach.map((point, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-1 h-1 rounded-full bg-primary/40 mt-2.5 shrink-0" />
                  <span className="text-muted-foreground text-[14px] leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-white/5 pt-8">
            <h2 className="text-[11px] font-semibold text-primary/50 uppercase tracking-[0.15em] mb-5">Architecture Decisions</h2>
            <ul className="space-y-4">
              {project.architecture.map((point, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="font-mono text-[10px] text-white/20 mt-0.5 shrink-0 w-4">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-muted-foreground text-[14px] leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-white/5 pt-8">
            <h2 className="text-[11px] font-semibold text-primary/50 uppercase tracking-[0.15em] mb-5">Outcome</h2>
            <ul className="space-y-4">
              {project.outcome.map((point, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/50 mt-2 shrink-0" />
                  <span className="text-muted-foreground text-[14px] leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {project.link && (
          <div className="border-t border-white/5 pt-8 mt-10">
            <a
              href={project.link}
              className="inline-flex items-center gap-2 text-[13px] font-medium text-primary hover:text-primary/80 transition-colors"
            >
              View live product →
            </a>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default WorkDetail;
