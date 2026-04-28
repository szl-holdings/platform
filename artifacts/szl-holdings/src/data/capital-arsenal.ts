export interface DocumentSection {
  title: string;
  content: string;
}

export interface CapitalDocument {
  id: string;
  title: string;
  lane?: string;
  channel: 'investor' | 'bank' | 'angel' | 'ny_state' | 'federal';
  type:
    | 'one_pager'
    | 'memo'
    | 'deck'
    | 'plan'
    | 'model'
    | 'guide'
    | 'checklist'
    | 'brief'
    | 'narrative';
  description: string;
  sections: DocumentSection[];
  status: 'draft' | 'ready' | 'final';
  printable?: boolean;
}

export const CAPITAL_DOCUMENTS: CapitalDocument[] = [
  // ─── SZL HOLDINGS MASTER MATERIALS ────────────────────────────────────────

  {
    id: 'szl-one-pager',
    title: 'SZL Holdings — Company One-Pager',
    lane: 'SZL Holdings',
    channel: 'investor',
    type: 'one_pager',
    description: 'One-page company summary for initial investor conversations.',
    status: 'ready',
    printable: true,
    sections: [
      {
        title: 'Who We Are',
        content: `SZL Holdings is a technology holding company building command-layer intelligence platforms across five high-consequence verticals: business operations, maritime logistics, cybersecurity, real estate, and premium advisory. Each platform is purpose-built, operationally deployed, and commercially distinct — all running on Counsel, a shared intelligence and automation backbone.

Founded and operated by Stephen Lutar, SZL is a single-founder, capital-efficient company with six live platforms, a unified technical architecture, and a clear path to institutional revenue across government, enterprise, and mid-market segments.`,
      },
      {
        title: 'The Platform Portfolio',
        content: `• Counsel — Shared AI and automation engine powering all SZL platforms. Workflow orchestration, signal intelligence, document automation, and connector mesh. Internal infrastructure that creates competitive moat across every product line.

• KORA — Business observability SaaS. Surfaces approval bottlenecks, ownership gaps, and workflow friction before they compound into operational failure. Serves operations teams, COOs, and process owners who have outgrown spreadsheets but can't justify enterprise BI stacks. Target market: $12B+ business observability / operational intelligence.

• SEXTANT — Maritime command intelligence platform. Fleet tracking, port intelligence, cargo visibility, and risk monitoring for shipping operators, port authorities, maritime insurers, and commodity traders. First purpose-built maritime command surface outside legacy AIS tools. Target market: $8B+ maritime intelligence and fleet management.

• PARAGON — Unified defense and intelligence command platform for security operations. SOC automation, XDR correlation, managed operations, and AI threat intelligence. Purpose-built for MSPs, enterprise security teams, and government agencies. Target market: $35B+ SIEM/SOAR/XDR and managed security.

• DOMAINE — NYC/NYS real estate intelligence platform. Distressed property signals, ownership intelligence, deal pipeline management, and broker command tools. Converts fragmented public data into structured broker and investor workflow. Target market: NYC distressed real estate ($3B+ proptech TAM in metro).

• Carlota Jo Consulting — Premium private advisory serving high-net-worth clients, family offices, and executives. Immediate cash flow, high-margin retainer model, low capital intensity.`,
      },
      {
        title: 'Business Model',
        content: `Three distinct revenue tracks:

1. Services (Immediate) — Carlota Jo generates cash flow from day one via premium retainer engagements. No product risk, high margin.

2. SaaS (Growth) — KORA, SEXTANT, DOMAINE, and PARAGON all operate subscription or per-seat models. Recurring revenue with high expansion potential.

3. Government / Enterprise (Strategic) — PARAGON and SEXTANT target federal and enterprise contracts with high ACV and long retention cycles.`,
      },
      {
        title: 'Traction',
        content: `• Six platforms live and operational
• Unified architecture via Counsel backbone — each platform benefits from shared capability
• Carlota Jo: active client relationships with premium advisory revenue
• DOMAINE: platform deployed in NYC market with distress data pipeline operational
• PARAGON: SOC platform built to FedRAMP-alignment standards
• SEXTANT: maritime intelligence platform live with AIS data integration
• KORA: observability platform live with core workflow monitoring capability
• Capital readiness infrastructure built and operational (this document set)`,
      },
      {
        title: 'Team',
        content: `Stephen Lutar — Founder & CEO. Builder, operator, and systems architect. Designed and operates the full SZL ecosystem across six platforms. Background in workflow design, command systems, and multi-domain intelligence. Single founder with no dilutive co-founder equity — full ownership concentration enables fast, decisive execution.`,
      },
      {
        title: 'The Ask',
        content: `SZL is pursuing a combination of non-dilutive capital (SBA/bank lending, government grants, NY state programs) and strategic angel investment to accelerate go-to-market across the three revenue tracks.

Primary near-term ask: $500K–$1.5M (non-dilutive preferred) to fund:
• Engineering velocity on KORA and SEXTANT revenue features
• Sales and GTM infrastructure for enterprise outreach
• Federal market access preparation (SAM registration, 8(a) eligibility, SBIR applications)
• Operating runway through first institutional revenue close`,
      },
      {
        title: 'Contact',
        content: `Stephen Lutar, Founder & CEO
SZL Holdings
hello@szlholdings.com
szlholdings.com

Note: All financial figures are projections and assumptions. This document is for discussion purposes only and does not constitute an offer to sell securities.`,
      },
    ],
  },

  {
    id: 'szl-investor-memo',
    title: 'SZL Holdings — Investor Memo',
    lane: 'SZL Holdings',
    channel: 'investor',
    type: 'memo',
    description:
      '3–5 page investor memo covering market opportunity, product portfolio, business model, competitive moat, financials, team, and use of proceeds.',
    status: 'ready',
    printable: true,
    sections: [
      {
        title: 'Executive Summary',
        content: `SZL Holdings is a technology holding company building command-layer intelligence platforms across five high-consequence verticals. The company is built on the thesis that most enterprise software solves problems at the feature level — SZL solves them at the system level, creating durable operational infrastructure rather than replaceable point solutions.

Six platforms. One architecture. Three revenue tracks. One founder with full ownership and zero co-founder dilution.

We are raising a combination of non-dilutive capital (SBA, bank, government grants, NY state programs) and strategic angel investment to fund the first institutional revenue close across KORA, SEXTANT, and Carlota Jo while positioning PARAGON for government contract access.`,
      },
      {
        title: 'Market Opportunity',
        content: `The SZL portfolio addresses five distinct markets, each with compelling structural dynamics:

OPERATIONAL DECISION INTELLIGENCE (KORA)
TAM: $12B+ | SAM: $2.1B | SOM (3yr): $45M
The market for governed operational decision intelligence — making organizational decisions legible, traceable, and policy-gated in real time — is nascent but rapidly forming. Existing tools (Datadog, ServiceNow, PagerDuty) address IT and infrastructure observability. KORA addresses decision layer intelligence: approval latency, ownership gaps, handoff failures, and workflow friction that compound into organizational breakdown. No incumbent owns this category at the SMB-to-mid-market layer.

MARITIME INTELLIGENCE (SEXTANT)
TAM: $8B+ | SAM: $1.4B | SOM (3yr): $30M
Maritime logistics is systematically underserved by modern software. Legacy tools (Fleet Management Systems, AIS platforms) provide position data without intelligence. SEXTANT provides command-layer intelligence: risk signals, cargo visibility, port congestion analysis, and vessel performance correlation. MARAD, DoD, and DHS alignment creates a government market overlay with sole-source opportunity.

SECURITY OPERATIONS (PARAGON)
TAM: $35B+ | SAM: $6B | SOM (3yr): $80M
Enterprise security is consolidating from point products to command platforms. The SIEM/SOAR/XDR convergence creates a vendor consolidation opportunity. PARAGON serves MSPs and enterprise security teams with a unified SOC surface that replaces 3–4 fragmented vendor relationships. Government alignment (CISA, DoD, DHS) creates a parallel federal track.

REAL ESTATE INTELLIGENCE (DOMAINE)
TAM: $4.5B (NYC/NYS proptech) | SAM: $800M | SOM (3yr): $18M
NYC is the deepest, most data-rich distressed real estate market in the world. DOMAINE converts fragmented public data (foreclosure filings, tax lien data, ownership records, court judgments) into structured broker and investor workflow. First-mover in NYC distress intelligence as a SaaS product.

PREMIUM ADVISORY (Carlota Jo)
TAM: $12B (US HNW advisory) | SAM: $400M | SOM (3yr): $8M
High-margin, immediate cash flow, zero product risk. Carlota Jo serves as the company's commercial flywheel — generating operating revenue while the SaaS platforms scale.`,
      },
      {
        title: 'Product Portfolio & Architecture',
        content: `The Counsel backbone is the core competitive moat. It is not a product sold to external customers — it is the shared intelligence and automation infrastructure that powers all six SZL platforms. This architecture means:

1. Each new platform costs less to build (shared infrastructure)
2. Each platform's data enriches all others (network intelligence)
3. Operational intelligence compounds over time (institutional learning)
4. No competitor can replicate the interconnected system without rebuilding the entire architecture

This is a structurally different approach from single-product companies. The value of the portfolio is multiplicative, not additive.

Counsel capabilities powering the portfolio:
• Workflow orchestration and automation engine
• Signal intelligence and anomaly detection
• Document generation and template system
• Connector mesh (API integrations)
• AI-native query and analysis layer
• Audit logging and compliance infrastructure`,
      },
      {
        title: 'Business Model & Revenue',
        content: `TRACK 1: SERVICES (Carlota Jo)
Model: Premium retainer / project-based advisory
Target client: HNW individuals, family offices, executives, boards
Revenue potential: $250K–$750K ARR at 4–6 active client relationships
Margin: 80%+ (low overhead, high expertise premium)
Payback: Immediate

TRACK 2: SaaS (KORA, SEXTANT, DOMAINE)
Model: Per-seat or per-unit subscription with enterprise tiers
KORA: $150–$400/seat/mo, targeting 10–100 seat deployments
SEXTANT: $5,000–$25,000/vessel/year for fleet operators
DOMAINE: $299–$799/mo broker, $1,500–$5,000/mo investor/fund tier
Revenue potential (Yr2): $1.2M ARR combined at conservative adoption

TRACK 3: GOVERNMENT / ENTERPRISE (PARAGON + SEXTANT Federal)
Model: Annual contract, per-seat enterprise, MSSP reseller
ACV target: $50K–$500K per enterprise/government relationship
SEXTANT DoD/MARAD: program-based contracts via SBIR/STTR path
PARAGON federal: sole-source via 8(a) or WOSB set-aside post-certification
Revenue potential (Yr3): $2M+ from government vertical`,
      },
      {
        title: 'Competitive Positioning',
        content: `SZL competes differently at each product layer:

KORA vs. Datadog/ServiceNow/PagerDuty: These tools serve IT and infrastructure teams. KORA serves operations and business process teams. Different buyer, different problem, different category.

SEXTANT vs. Windward/MarineTraffic/VesselFinder: Legacy AIS tools provide position data. SEXTANT provides intelligence — risk signals, port correlation, cargo visibility, and command workflow. Not a map product; a command product.

PARAGON vs. CrowdStrike/Splunk/Palo Alto: Large incumbents serve Fortune 500 at $1M+ ACV. PARAGON serves MSPs and mid-enterprise at $50K–$250K ACV with a unified surface designed for defensive operations, not endpoint protection.

DOMAINE vs. CoStar/Reonomy/ATTOM: Data providers without workflow. DOMAINE converts data into broker and investor action — distress signals into deal pipeline, ownership records into outreach sequences.`,
      },
      {
        title: 'Use of Proceeds',
        content: `12-Month Deployment ($500K round):
• Engineering (40% / $200K): KORA revenue feature completion, SEXTANT enterprise tier, PARAGON compliance controls
• Sales & GTM (25% / $125K): Outbound infrastructure, CRM, first enterprise sales motion
• Operations (20% / $100K): Legal structure, IP protection, federal market access preparation
• Reserve / Working Capital (15% / $75K): Cash buffer through first institutional revenue

24-Month Milestone Unlock ($1.5M round):
• Months 1–6: KORA first paying customers ($15K ARR), Carlota Jo to $120K ARR, SAM.gov registration complete
• Months 7–12: SEXTANT first fleet operator ($30K ARR), PARAGON first MSP customer ($40K ARR), 8(a) application submitted
• Months 13–18: $250K ARR combined SaaS, first government contract awarded
• Months 19–24: $600K+ ARR, Series A trigger metrics hit`,
      },
      {
        title: 'Team & Execution',
        content: `Stephen Lutar — Founder & CEO
The SZL portfolio is the product of a systems-thinking operator who built six platforms, a shared infrastructure backbone, a capital readiness OS, and a procurement strategy simultaneously. This is not a team of advisors — it is a single operator who runs everything.

Advantages of single-founder structure:
• Zero co-founder equity dilution — all economics accrue to investors and Stephen
• No founder misalignment, vesting disputes, or split decision-making
• Fast, decisive execution without committee approval
• Full context across all six platforms simultaneously

Scaling plan: First hires will be sales (months 3–6), then engineering (months 6–12), then government BD (months 12–18). Organizational design mirrors military command structure: clear lanes, clear authority, clear accountability.`,
      },
      {
        title: 'Risk & Mitigation',
        content: `Single-founder concentration risk: Mitigated by comprehensive documentation, system architecture that minimizes key-person dependency, and capital efficiency that extends runway while hiring.

Market adoption timing: Mitigated by three parallel revenue tracks — if SaaS adoption is slow, services revenue covers operations. If government timeline extends, commercial SaaS covers.

Competitive entry: Mitigated by Counsel architecture — competitors cannot replicate the interconnected platform without years of infrastructure investment.

Regulatory/certification risk: Mitigated by early MWBE, 8(a), and SAM.gov preparation. Not dependent on any single certification for core revenue.

Note: All financial projections are estimates based on market analysis and assumptions. They do not constitute guarantees of performance.`,
      },
    ],
  },

  {
    id: 'szl-pitch-deck',
    title: 'SZL Holdings — Pitch Deck Content (12-Slide Structure)',
    lane: 'SZL Holdings',
    channel: 'investor',
    type: 'deck',
    description: 'Slide-by-slide content for investor presentation deck.',
    status: 'ready',
    printable: true,
    sections: [
      {
        title: 'Slide 1: Cover',
        content: `SZL Holdings
Command-Layer Intelligence for High-Consequence Operations

Stephen Lutar, Founder & CEO
hello@szlholdings.com | szlholdings.com
[Q2 2026]`,
      },
      {
        title: 'Slide 2: The Problem',
        content: `Organizations run on systems that can't see themselves.

• Approvals disappear into inboxes and never come back
• Operational breakdowns compound invisibly until they're catastrophic
• Maritime operators have position data but no intelligence
• Security teams manage 5–8 tools and still miss threats
• Real estate professionals have data but no workflow

The common thread: high-consequence domains where visibility failures are expensive. Nobody is building command-layer infrastructure for operations — just more point tools for IT.`,
      },
      {
        title: 'Slide 3: The Solution',
        content: `SZL Holdings builds command-layer intelligence platforms — not features, not dashboards, not reports. Systems.

• KORA: Business operations made legible in real time
• SEXTANT: Maritime command — from AIS position to operational intelligence
• PARAGON: SOC command — unified defense operations for MSPs and enterprise
• DOMAINE: NYC/NYS real estate intelligence — from distress signals to deal pipeline
• Carlota Jo: Premium advisory generating immediate revenue

All powered by Counsel: a shared AI and automation backbone that makes every platform smarter as the portfolio grows.`,
      },
      {
        title: 'Slide 4: Market Size',
        content: `Five markets. Five distinct access points.

Business Observability: $12B TAM → $2.1B SAM → $45M SOM (Yr3)
Maritime Intelligence: $8B TAM → $1.4B SAM → $30M SOM (Yr3)
Cybersecurity Operations: $35B TAM → $6B SAM → $80M SOM (Yr3)
NYC Real Estate Intelligence: $4.5B TAM → $800M SAM → $18M SOM (Yr3)
HNW Advisory: $12B TAM → $400M SAM → $8M SOM (Yr3)

Combined addressable opportunity: $72B+
First-mover position in three categories with no direct incumbent.`,
      },
      {
        title: 'Slide 5: The Counsel Architecture',
        content: `Why this is hard to replicate:

Counsel is not a product — it's the operating system for all six platforms. Every platform benefits from:
• Shared workflow orchestration
• Shared AI intelligence and signal processing
• Shared document engine and template system
• Shared connector mesh (API integrations)
• Shared audit and compliance infrastructure

A competitor building one platform starts from zero. We started from the architecture and built six platforms on top. The moat compounds over time — not because of patents, but because of operational infrastructure.`,
      },
      {
        title: 'Slide 6: Product Status',
        content: `Built and operational:
✓ Counsel backbone (orchestration, AI, connectors)
✓ KORA platform (business observability, core monitoring)
✓ SEXTANT platform (AIS integration, fleet intelligence)
✓ PARAGON platform (SOC, XDR, managed operations layer)
✓ DOMAINE platform (distress data, broker workflow)
✓ Carlota Jo (active advisory practice)
✓ Capital Readiness OS (bank/angel/government document infrastructure)

Next 90 days:
→ KORA: revenue tier and first paid customers
→ SEXTANT: enterprise fleet operator pilot
→ PARAGON: first MSP partner signed
→ SAM.gov registration and MWBE application initiated`,
      },
      {
        title: 'Slide 7: Business Model',
        content: `Three revenue tracks = three risk mitigation strategies

Track 1: Services (Cash Flow Now)
Carlota Jo advisory — $250K–$750K ARR potential at 4–6 client relationships. High margin, no product risk, pays operations while SaaS scales.

Track 2: SaaS (Recurring Revenue)
KORA, SEXTANT, DOMAINE — subscription and per-unit pricing. $1.2M ARR target in 24 months. Enterprise tiers available on all three.

Track 3: Government / Enterprise (Strategic Revenue)
PARAGON + SEXTANT federal — contract-based, annual, $50K–$500K ACV. Supported by MWBE, 8(a), WOSB, SBIR/STTR strategy.`,
      },
      {
        title: 'Slide 8: Traction',
        content: `Platform milestones completed:
• Six platforms built and live
• Carlota Jo: active advisory relationships with premium clients
• DOMAINE: distress data pipeline operational, NYC market coverage live
• SEXTANT: AIS data integrated, maritime intelligence layer operational
• PARAGON: SOC platform built, compliance controls aligned with FedRAMP Low requirements
• KORA: workflow monitoring live, observability layer operational

Infrastructure milestones:
• Capital Readiness OS built and operational
• Federal market access preparation initiated
• NY state program eligibility assessment complete`,
      },
      {
        title: 'Slide 9: Go-To-Market',
        content: `Phase 1 (Months 1–6): Commercial activation
• Carlota Jo: outbound to 3 target HNW client segments
• KORA: 5 pilot deployments via direct outbound to ops-heavy SMBs
• DOMAINE: broker launch with NYC commercial broker outreach

Phase 2 (Months 7–12): Enterprise and government entry
• SEXTANT: first fleet operator pilot (maritime logistics or shipping)
• PARAGON: first MSP reseller relationship
• Government: SAM.gov live, MWBE application submitted, SBIR Phase I proposals

Phase 3 (Months 13–24): Scale and raise
• KORA: enterprise tier launch with $50K+ ACV targets
• PARAGON: first government contract awarded
• Series A trigger: $600K+ ARR, government contract in hand, expansion metrics positive`,
      },
      {
        title: 'Slide 10: Team',
        content: `Stephen Lutar — Founder & CEO

• Designed and built six platforms from architecture to deployment
• Background: systems design, workflow automation, command infrastructure
• Operating style: military command structure applied to technology — clear lanes, clear authority, clear accountability
• Full context across all six domains simultaneously
• Zero co-founder dilution — all economics accrue to investors and the company

Advisors and collaborators: Being formalized as the company raises. First advisory board seats targeted at government BD (SBIR/STTR) and enterprise SaaS GTM.`,
      },
      {
        title: 'Slide 11: Financials',
        content: `All figures are projections based on market analysis and operating assumptions. Not guarantees.

Year 1 (2026) — Investment Activation:
• Revenue target: $180K (Carlota Jo $120K, SaaS pilots $60K)
• Burn rate: $35K/month at current structure
• Runway: 14+ months on $500K raise

Year 2 (2027) — SaaS Scale:
• Revenue target: $650K (Carlota Jo $180K, SaaS $470K)
• Gross margin: 70%+ blended
• Headcount: 4–5 (founder + 3–4 hires)

Year 3 (2028) — Series A Ready:
• Revenue target: $1.8M+ (SaaS dominant, government wedge open)
• Series A raise: $4M–$8M based on ARR and government contract pipeline`,
      },
      {
        title: 'Slide 12: The Ask',
        content: `Raise: $500K–$1.5M (primary ask non-dilutive; angel equity as secondary channel)

Non-dilutive sources being pursued in parallel:
• SBA 7(a) or CDFI loan: $200K–$500K
• NY MWBE certification → state contract set-asides
• SBIR Phase I (NSF for KORA, DoD for SEXTANT/Aegis): $275K each
• NY Excelsior Jobs Program: tax credits on qualifying jobs

Angel equity structure:
• Pre-money valuation: to be determined at close
• Round size: $500K–$1M
• Structure: SAFE or convertible note preferred
• Use: engineering velocity + GTM activation (see slide 10)

Contact: Stephen Lutar | hello@szlholdings.com | szlholdings.com`,
      },
    ],
  },

  {
    id: 'szl-cap-table',
    title: 'Cap Table — Placeholder Structure',
    lane: 'SZL Holdings',
    channel: 'investor',
    type: 'checklist',
    description:
      'Pre-money cap table placeholder showing founder ownership and option pool structure.',
    status: 'draft',
    sections: [
      {
        title: 'Pre-Money Cap Table (Placeholder)',
        content: `This is a placeholder structure only. Actual share counts and option pool percentages will be determined at close with qualified legal counsel. All figures require attorney review before external use.

COMMON STOCK
Holder: Stephen Lutar (Founder)
Class: Common — Series A
Shares: [TO BE DETERMINED]
Ownership %: 100% pre-financing (subject to option pool creation)
Vesting: N/A (founder, fully vested)

OPTION POOL (Proposed)
Purpose: Employee and advisor equity incentive
Class: Common (Options)
Reserved: [10%–15% pre-money to be determined]
Vesting: Standard 4-year, 1-year cliff for employees

POST-FINANCING (Pro Forma, illustrative only)
Founder: [70%–85%] depending on option pool and investor round
Investors: [10%–20%] depending on round size and valuation
Option Pool: [10%–15%]

NEXT STEPS
1. Engage corporate attorney to establish formal cap table management
2. Determine entity structure (C-Corp formation recommended for angel investment)
3. Establish Delaware incorporation (if not already)
4. Implement cap table management software (Carta or similar)`,
      },
      {
        title: 'Data Room Checklist',
        content: `Documents needed for investor due diligence — organize and prepare prior to investor conversations:

LEGAL DOCUMENTS
☐ Articles of Incorporation / Organization (state-filed)
☐ Operating Agreement or Bylaws (current version)
☐ Shareholder / Member Agreement (if applicable)
☐ IP Assignment Agreements (all founders, contractors)
☐ Employment / Contractor Agreements
☐ Material contracts (customer, vendor, partnership)
☐ Any outstanding litigation or legal disputes (disclosure)

FINANCIAL DOCUMENTS
☐ Historical financial statements (P&L, balance sheet, cash flow) — 2+ years
☐ Bank statements — 6–12 months
☐ Tax returns — 2+ years (business and personal for 20%+ owners)
☐ Accounts receivable / payable aging
☐ Current debt schedule (all outstanding obligations)

PRODUCT DOCUMENTS
☐ Product architecture overview (non-technical summary)
☐ Technical architecture diagram
☐ Security and compliance summary
☐ Product roadmap (12–18 month)
☐ Demo access or recorded walkthrough

TEAM DOCUMENTS
☐ Founder bio and LinkedIn profile
☐ Advisor bios and advisory agreements
☐ Org chart (current and projected)
☐ Key hire plan

MARKET DOCUMENTS
☐ Market sizing analysis (TAM/SAM/SOM)
☐ Competitive analysis
☐ Go-to-market plan
☐ Customer references or letters of intent`,
      },
    ],
  },

  // ─── LYTE ONE-PAGER & MARKET DOCS ─────────────────────────────────────────

  {
    id: 'lyte-one-pager',
    title: 'KORA — Investor Product One-Pager',
    lane: 'KORA',
    channel: 'investor',
    type: 'one_pager',
    description:
      'Product one-pager for investors: what KORA does, who it serves, why now, competitive landscape.',
    status: 'ready',
    printable: true,
    sections: [
      {
        title: 'What KORA Does',
        content: `KORA is a business observability platform that makes organizational operations legible in real time. It surfaces approval bottlenecks, ownership gaps, process latency, and workflow friction — before they compound into operational failure.

Think of it as Datadog for business operations, not IT infrastructure. Where Datadog tells you when a server goes down, KORA tells you when an approval has been waiting 14 days, who owns the decision, and what's blocked downstream because of it.`,
      },
      {
        title: 'The Problem',
        content: `Most organizations run on invisible systems. Decisions disappear into email inboxes. Approvals stall in chains of people who don't know they're responsible. Handoffs fail silently. Process owners have no visibility into their own processes.

The result: compounding operational failures that started as a 2-day delay 3 months ago. By the time leadership sees the problem, it's a $500K project overrun.

Current tools don't solve this:
• Spreadsheets: reactive, not real-time
• Project management tools (Asana, Monday): task-focused, not process-focused
• Enterprise BPM (ServiceNow, SAP): six-figure implementations that SMBs can't afford
• BI dashboards: historical, not operational

KORA addresses the observability gap between "we have process documentation" and "we can see our processes operating in real time."`,
      },
      {
        title: 'Who Buys KORA',
        content: `Primary buyer: Operations directors, COOs, and process owners at 50–500 person organizations who have outgrown spreadsheets but can't justify enterprise BPM stacks.

Verticals with highest urgency:
• Professional services firms (consulting, law, architecture) with complex approval chains
• Healthcare operations teams managing credentialing, procurement, and compliance
• Real estate and property management (high-volume operational complexity)
• Financial services mid-market (compliance approval workflows)
• Government contractors (audit-ready process documentation)

Secondary buyer: Department heads and project leads who are accountable for process outcomes but have no visibility into process health.`,
      },
      {
        title: 'Why Now',
        content: `Three forces converging:

1. Remote and hybrid work broke the visibility layer. When teams were co-located, managers could see process failures developing. Remote work made operations invisible. Organizations are now paying the cost of 4 years of compounding invisible process debt.

2. AI tools are creating new process complexity. AI-assisted workflows require new approval gates, new accountability structures, and new audit requirements. Organizations are adding AI tools without adding visibility into how those tools are operating inside their processes.

3. The enterprise BPM market is consolidating upmarket, leaving mid-market exposed. ServiceNow and SAP are fighting for $500K+ contracts. Nobody is building for $18K/year.`,
      },
      {
        title: 'Market Sizing (TAM / SAM / SOM)',
        content: `TAM: $12B+ — Business observability and operational intelligence broadly defined. Includes workflow analytics, process mining, BPM, and operational BI for non-IT buyers.

SAM: $2.1B — US and UK SMB and mid-market organizations (50–2,000 employees) with operational complexity that warrants dedicated process observability tooling. Excludes enterprise-only BPM and IT observability.

SOM (Year 3): $45M — Achievable through direct outbound to ops-heavy verticals and product-led growth. Represents ~0.4% of the serviceable market at $18K average ARR.`,
      },
      {
        title: 'Competitive Positioning',
        content: `KORA is NOT competing with Datadog, ServiceNow, or PagerDuty. These tools serve IT teams. KORA serves business operations teams — a different buyer, different problem, different category.

Actual alternatives KORA replaces:
• Spreadsheet-based process tracking (most common)
• General project management tools used for process tracking (Asana, Monday, Notion)
• Expensive BPM consultants who build custom reporting

KORA's differentiation:
• Designed for operations buyers, not IT buyers
• Real-time process visibility, not project task tracking
• No implementation required — connects to existing tools via Counsel
• Priced for mid-market ($150–$400/seat/mo), not enterprise`,
      },
      {
        title: 'Revenue Model',
        content: `Per-seat SaaS with three tiers:

Essential ($150/seat/mo): Core process monitoring, up to 5 workflows, 30-day history
Professional ($250/seat/mo): Unlimited workflows, governed bottleneck detection, 90-day history, integrations
Enterprise ($400/seat/mo, custom): Full platform, custom SLA, dedicated support, audit compliance reporting

Typical deployment: 10–50 seats. $18K–$240K ACV per customer.
Expansion revenue: KORA is naturally sticky — once process visibility is established, teams expand scope, add workflows, and add seats as the platform proves value.`,
      },
      {
        title: 'Pilot Customer Strategy',
        content: `Phase 1 (Months 1–3): 5 pilot deployments via direct outbound
• Target: COOs and operations directors at 50–200 person professional services firms
• Offer: 90-day pilot at 50% of list price with success metrics defined upfront
• Goal: 3 convert to paid customers at Professional tier

Phase 2 (Months 4–6): Expand verticals and seed product-led growth
• Add healthcare operations and financial services as target verticals
• Launch self-serve sign-up for Essential tier
• Enable referral program — ops leaders talk to each other

Phase 3 (Months 7–12): Enterprise motion
• Target 3–5 enterprise accounts in government contracting / compliance-heavy verticals
• Partner with ops consulting firms who can resell KORA as part of their engagements`,
      },
    ],
  },

  // ─── VESSELS ONE-PAGER & MARKET DOCS ─────────────────────────────────────

  {
    id: 'vessels-one-pager',
    title: 'SEXTANT — Investor Product One-Pager',
    lane: 'SEXTANT',
    channel: 'investor',
    type: 'one_pager',
    description:
      'Product one-pager for investors: maritime logistics visibility, who buys it, competitive gap.',
    status: 'ready',
    printable: true,
    sections: [
      {
        title: 'What SEXTANT Does',
        content: `SEXTANT is a maritime command intelligence platform that converts raw AIS position data and fragmented maritime data sources into operational intelligence for fleet operators, shipping companies, port authorities, maritime insurers, and commodity traders.

Where legacy AIS tools answer "where is the vessel?", SEXTANT answers "what is the operational risk, what are the cargo implications, and what does the port situation mean for my schedule?"`,
      },
      {
        title: 'The Problem',
        content: `Maritime logistics operates on fragmented, backward-looking data. A shipping company managing a 20-vessel fleet may have:
• AIS position feeds from three different providers
• Port congestion data from manual email updates
• Weather risk data from separate subscriptions
• Cargo status from paper manifests and email chains
• Charter party documents in email inboxes

The result: real-time operational decisions made on 12–48 hour old data, leading to avoidable demurrage charges, missed port windows, and suboptimal routing decisions. Estimated cost of poor maritime intelligence to global shipping: $40B+ annually.

Nobody has built a command layer that integrates all these signals into a unified operational view — until SEXTANT.`,
      },
      {
        title: 'Who Buys SEXTANT',
        content: `Primary buyers:
• Ship operators and fleet managers (20–500 vessel fleets)
• Commodity traders with exposure to shipping delays and demurrage
• Maritime insurance underwriters assessing real-time vessel risk
• Port authorities managing berth allocation and port congestion

Secondary buyers:
• Government agencies (MARAD, US Coast Guard, DHS) monitoring maritime domain awareness
• Maritime logistics consultants managing operations for smaller operators

Key decision criteria: Real-time visibility, risk signal quality, integration with existing systems, and compliance with reporting requirements.`,
      },
      {
        title: 'Why Now',
        content: `Three factors making maritime intelligence urgent:

1. Supply chain disruption has revealed the fragility of maritime logistics. The past four years have made maritime visibility a board-level issue, not just an operational preference. Organizations are now investing in resilience infrastructure.

2. US government maritime awareness funding is increasing. MARAD, DoD, and DHS are actively funding maritime domain awareness technology. SBIR/STTR opportunities in maritime intelligence are growing.

3. IMO 2020/2023 regulatory requirements have increased reporting complexity. Vessel operators face new fuel consumption, emissions, and safety reporting requirements that require better data infrastructure.`,
      },
      {
        title: 'Market Sizing',
        content: `TAM: $8B+ — Global maritime intelligence and fleet management software, including AIS analytics, port intelligence, maritime risk management, and government maritime domain awareness.

SAM: $1.4B — US and European fleet operators, maritime insurers, and commodity traders with vessels calling at major ports. Includes government maritime agencies with technology procurement authority.

SOM (Year 3): $30M — Achievable through per-vessel SaaS pricing and strategic government partnerships. Represents ~2% of the serviceable market.`,
      },
      {
        title: 'Revenue Model',
        content: `Per-vessel pricing with fleet enterprise contracts:

Standard ($5,000/vessel/year): Core vessel tracking, risk signals, port intelligence, basic reporting
Enterprise ($15,000/vessel/year): Full platform, API access, custom alerts, dedicated support, compliance reporting
Data-as-a-Service: Maritime intelligence data licensing to insurers, traders, and government agencies — not per-vessel but per-data-access subscription

Typical enterprise deployment: 20–100 vessel fleet → $100K–$1.5M ACV
Government contracts: Program-based, $500K–$5M via SBIR/STTR or sole-source`,
      },
      {
        title: 'Strategic Partnership Targets',
        content: `Commercial partnerships:
• Maersk, MSC, CMA CGM (Tier 1 shipping lines) — for data licensing and fleet intelligence
• Hapag-Lloyd, ONE, Evergreen — secondary Tier 1 targets
• Lloyd's of London, Allianz Global Corporate & Specialty — maritime insurance intelligence
• Cargill, Trafigura, Vitol — commodity trading maritime exposure management

Government partnerships:
• MARAD (Maritime Administration): Technology partnership for US-flagged vessel monitoring
• US Coast Guard: Port security intelligence overlay
• DHS Science & Technology Directorate: Maritime domain awareness R&D
• US Navy ONI: Commercial vessel intelligence (via cleared contractor path)

Port authority partners:
• Port Authority of New York and New Jersey: Metro-area maritime intelligence
• Port of Los Angeles / Long Beach: West Coast congestion intelligence`,
      },
      {
        title: 'MARAD / DoD / DHS Relevance Brief',
        content: `SEXTANT aligns with three federal priorities:

MARAD (Maritime Administration):
• US-flagged vessel tracking and support
• Maritime workforce intelligence
• Maritime infrastructure security
• Alignment: SEXTANT provides US-flag operator tools + MARAD data integration

DoD / Military Sealift Command:
• Commercial vessel availability for defense logistics
• Port security and harbor defense
• Supply chain resilience
• Alignment: SEXTANT provides commercial vessel intelligence relevant to defense logistics planning

DHS / CISA:
• Port security and critical maritime infrastructure
• Maritime domain awareness
• Supply chain security
• Alignment: SEXTANT provides real-time vessel risk scoring and cargo visibility for port security contexts

SBIR/STTR Target Agencies:
• DoD SBIR: Maritime domain awareness, autonomous logistics
• DHS SBIR: Port security, maritime critical infrastructure
• DOT/MARAD: Maritime efficiency and emissions monitoring`,
      },
    ],
  },

  // ─── AEGIS ONE-PAGER & MARKET DOCS ────────────────────────────────────────

  {
    id: 'aegis-one-pager',
    title: 'PARAGON — Investor Product One-Pager',
    lane: 'PARAGON',
    channel: 'investor',
    type: 'one_pager',
    description:
      'Product one-pager for investors: defensive cyber ops, SOC automation, compliance.',
    status: 'ready',
    printable: true,
    sections: [
      {
        title: 'What PARAGON Does',
        content: `PARAGON is a unified defense and intelligence command platform for security operations centers. It consolidates SIEM, SOAR, XDR, and managed threat intelligence into a single command surface — replacing the fragmented 5–8 tool SOC that MSPs and enterprise security teams currently manage.

PARAGON is designed for the security operator — the analyst sitting in a SOC managing 200 alerts, running incident investigations, and writing compliance reports simultaneously. Not the CISO's boardroom dashboard. The operator's command surface.`,
      },
      {
        title: 'The Problem',
        content: `The modern SOC is drowning in tools. A mid-size MSP managing 50 client environments may be running:
• A SIEM (Splunk, QRadar, or Sentinel) — $100K+/year
• A SOAR (Palo Alto XSOAR, Splunk SOAR) — $80K+/year
• An EDR/XDR (CrowdStrike, SentinelOne) — $40K+/year
• A threat intel platform — $20K+/year
• Compliance reporting tools — $15K+/year

Total: $250K+/year in tools that don't talk to each other, generating alert noise that junior analysts can't triage effectively.

The result: alert fatigue, missed threats, slow incident response, and compliance reports assembled from 5 different dashboards. And this is the MSP's problem for every client they manage.`,
      },
      {
        title: 'Who Buys PARAGON',
        content: `Primary buyer: MSPs (Managed Service Providers) who sell security services to 10–500 client environments. MSPs are the highest-leverage distribution channel — one MSP sale brings 20–100 environments.

Secondary buyer: Enterprise security teams (50–500 employees) who have outgrown their current SIEM but can't afford Splunk at enterprise pricing.

Government buyer: Federal agencies and contractors who need a SOC platform that aligns with CISA's security operations guidance and DoD security controls.

Key decision criteria: Alert fidelity, automation coverage, compliance reporting capability, multi-tenant support (for MSPs), and total cost of ownership vs. the fragmented stack.`,
      },
      {
        title: 'Market Sizing',
        content: `TAM: $35B+ — Combined SIEM, SOAR, XDR, managed security, and threat intelligence markets globally.

SAM: $6B — US and UK MSPs, mid-enterprise security teams, and government agencies that are actively replacing or consolidating security tooling at $50K–$500K ACV.

SOM (Year 3): $80M — Achievable through MSP partner channel and direct enterprise outreach. Represents ~1.3% of the serviceable market.`,
      },
      {
        title: 'Revenue Model',
        content: `Per-seat SOC platform with MSSP partner model:

Professional ($150/seat/mo): Core SIEM, basic SOAR automation, threat intel feeds, compliance dashboard
Enterprise ($300/seat/mo): Full platform, multi-tenant MSP management, custom playbooks, AI threat correlation
MSSP Partner Model: Volume licensing for MSPs managing multiple client environments — per-managed-environment pricing at 30–40% discount from retail, with white-label option
Compliance-as-a-Service: Add-on tier for CMMC, FedRAMP, SOC 2, HIPAA compliance reporting — $50/seat/mo additional

Typical enterprise ACV: $50K–$250K
Typical MSSP ACV: $100K–$500K (covers 20–100 client environments)`,
      },
      {
        title: 'Federal Market Relevance',
        content: `PARAGON is designed from the ground up for federal market alignment:

DoD / CMMC alignment:
• PARAGON controls map to CMMC Level 2 requirements
• SIEM and audit logging capabilities align with NIST 800-171
• Multi-factor authentication and privileged access management built in

CISA guidance alignment:
• Architecture follows CISA's Endpoint Detection and Response (EDR) guidance
• Zero Trust principles embedded in identity and access layer
• Incident response playbooks aligned with CISA IRPs

FedRAMP path:
• PARAGON cloud infrastructure designed for FedRAMP Low/Moderate designation
• Current readiness: Low impact baseline achievable in 12–18 months
• Moderate impact: 18–24 months with additional investment

Government contract paths:
• SBA 8(a) sole-source contract eligibility (if owner qualifies)
• WOSB set-aside eligibility (if ownership structure qualifies)
• SBIR Phase I: DHS (critical infrastructure protection), DoD (cyber defense)
• GSA Schedule 70 (IT Services) — target vehicle for government sales`,
      },
      {
        title: 'Competitive Positioning',
        content: `PARAGON vs. CrowdStrike: CrowdStrike is endpoint protection, not SOC command. $1M+ ACV for enterprise. PARAGON is defensive operations at $50K–$250K ACV, positioned as the command layer above the endpoint tool.

PARAGON vs. Splunk: Splunk is a data platform that requires specialized engineers to configure and maintain. PARAGON is a purpose-built SOC command surface that analysts can use on day one.

PARAGON vs. Palo Alto Networks: Palo Alto competes at the network perimeter. PARAGON competes at the operations center — after the perimeter has been breached or is under threat.

PARAGON vs. Microsoft Sentinel: Sentinel is a capable SIEM but requires significant Azure ecosystem investment. PARAGON is cloud-agnostic and designed for MSPs who manage multi-cloud, multi-vendor client environments.

The PARAGON position: Unified SOC command for the operator, not the vendor. Designed around the analyst's workflow, not the vendor's product roadmap.`,
      },
    ],
  },

  // ─── TERRA ONE-PAGER ──────────────────────────────────────────────────────

  {
    id: 'terra-one-pager',
    title: 'DOMAINE — Investor Product One-Pager',
    lane: 'DOMAINE',
    channel: 'investor',
    type: 'one_pager',
    description:
      'Product one-pager for investors: distress intelligence, broker command, conversion engine.',
    status: 'ready',
    printable: true,
    sections: [
      {
        title: 'What DOMAINE Does',
        content: `DOMAINE is a NYC/NYS real estate intelligence platform that converts fragmented public data into structured deal workflow. It surfaces distressed property signals, maps ownership, tracks legal proceedings, and converts raw data into actionable broker and investor pipeline.

DOMAINE answers: "Which properties are in distress right now, who owns them, what is the legal situation, and how do I get in front of them first?"`,
      },
      {
        title: 'The Problem',
        content: `NYC real estate professionals have more data than ever and fewer tools to act on it. Public records (ACRIS, DOF, SSCEF, eCourts, HPD) contain thousands of distress signals. The problem: they're fragmented across 7+ separate systems, updated on inconsistent schedules, and readable only by specialists.

Brokers and investors currently:
• Manually check ACRIS for recent distress filings
• Pay $8K+/month for CoStar access that includes far more than they need
• Hire researchers to compile distress reports manually
• Miss opportunities because they can't monitor continuously

DOMAINE automates the signal collection, normalizes the data, and delivers it as workflow — not a database to query, but a pipeline to act on.`,
      },
      {
        title: 'Market Sizing',
        content: `TAM: $4.5B — NYC/NYS proptech market, including CRE data services, broker tools, investor intelligence platforms, and real estate workflow automation.

SAM: $800M — NYC commercial real estate brokers, distressed property investors, real estate attorneys, and lenders with active NYC portfolios who would pay for a specialized distress intelligence platform.

SOM (Year 3): $18M — Achievable through direct broker outreach and investor community distribution. ~500 broker accounts at $3K/year + 100 investor accounts at $60K/year.

NYC market context: NYC has the deepest distressed real estate market in the US. 2023–2025 saw record commercial foreclosure filings, hundreds of tax lien sales, and significant office distress. The market is active and the data is rich.`,
      },
      {
        title: 'Revenue Model',
        content: `Broker subscription: $299–$799/month per broker account
• Access to distress signal feed, ownership search, deal pipeline tools
• Standard tier: NYC metro coverage, 30-day signal history
• Pro tier: All 5 boroughs + surrounding counties, unlimited history, deal tracking

Investor / fund tier: $1,500–$5,000/month per fund account
• Full distress database access, bulk export, API access
• Custom alert configurations, portfolio tracking
• Dedicated onboarding and quarterly market briefings

Data licensing: Normalized NYC distress data licensed to lenders, attorneys, and data aggregators on an annual license basis — $25K–$100K/year per licensee`,
      },
      {
        title: 'NYC/NYS Market Brief',
        content: `Why NYC is the optimal beachhead:

Foreclosure volume: NYC commercial and residential foreclosure filings hit multi-year highs in 2023–2025, driven by COVID-era loan modifications expiring, office distress, and rising interest rates. The distress cycle is active and expected to continue through 2027.

Tax lien sales: NYC conducts periodic tax lien sales that create time-sensitive distress opportunities for brokers and investors. DOMAINE monitors and alerts on lien sale eligibility.

Court proceedings: NYC courts process thousands of foreclosure proceedings through SSCEF. DOMAINE normalizes this data into searchable, monitorable signals.

Ownership complexity: NYC has the most complex property ownership structure in the US — LLCs, trusts, partnerships, and offshore entities. DOMAINE's ownership mapping layer navigates this complexity.

Regulatory density: NYC's regulatory environment (HPD violations, DOB orders, SCA compliance) creates additional distress signals that DOMAINE monitors.`,
      },
    ],
  },

  // ─── CARLOTA JO SERVICE OVERVIEW ─────────────────────────────────────────

  {
    id: 'carlota-jo-lender-overview',
    title: 'Carlota Jo Consulting — Service Overview for Lenders',
    lane: 'Carlota Jo',
    channel: 'bank',
    type: 'brief',
    description: 'Service overview for lenders: what services, who pays, revenue model, retention.',
    status: 'ready',
    sections: [
      {
        title: 'Business Overview',
        content: `Carlota Jo Consulting is a premium private advisory practice serving high-net-worth individuals, family offices, executives, and board members who require sophisticated, confidential operational and strategic guidance.

The practice operates on a retained advisory model — clients pay monthly retainers for ongoing access to senior advisory services, supplemented by project-based engagements for defined-scope assignments.

Carlota Jo is a wholly-owned operating brand of SZL Holdings, Inc.`,
      },
      {
        title: 'Services Offered',
        content: `Executive Operations Advisory: Retainer-based advisory for founders, executives, and board members managing organizational complexity. Includes operational systems design, decision support, and strategic planning facilitation.

Family Office Intelligence: Confidential advisory for family offices and UHNW individuals managing multi-entity structures, investment portfolios, and generational planning. Intelligence-grade organization and discretion.

Private Client Workflow Systems: Design and implementation of custom operational systems for high-net-worth clients managing complex personal or business affairs. Includes document organization, advisory team coordination, and operational continuity planning.

Strategic Project Engagements: Defined-scope advisory projects for clients requiring specific analysis, system design, or strategic planning deliverables. Priced per-project at $10K–$75K depending on scope.`,
      },
      {
        title: 'Revenue Model',
        content: `Monthly retainer: $12,500–$35,000/month per client relationship
• Tier 1 (Executive Advisory): $12,500/month — Regular advisory sessions, on-call access, strategic planning
• Tier 2 (Family Office Intelligence): $22,500/month — Full-service intelligence advisory, multi-entity support
• Tier 3 (Full-Spectrum Advisory): $35,000+/month — Comprehensive advisory, custom deliverables, priority access

Project-based engagements: $10,000–$75,000 per project, scoped individually

Client capacity: Practice currently operates at 4–6 active retainer relationships for sustainable quality. Expansion to 8–10 relationships with junior advisor hire.

Revenue projection (projections, not guarantees):
• 4 clients at Tier 1 average: $600K ARR
• 6 clients at blended Tier 1/2: $1.1M ARR
• 2–3 project engagements/year: +$60K–$150K

Margin: 80%+ (practice is expertise-intensive, low overhead)`,
      },
      {
        title: 'Client Acquisition',
        content: `Carlota Jo's client acquisition model is referral-based and relationship-driven. Primary channels:

1. Existing professional relationships: Stephen Lutar's professional network across finance, law, and technology provides direct access to target clients.

2. Family office and executive communities: Targeted outreach through private family office associations, executive forums, and professional networks.

3. Legal and financial professional referrals: Attorneys, CPAs, and wealth managers who encounter clients needing operational advisory.

4. SZL Holdings platform network: Clients of other SZL platforms (Carlota Jo target clients often intersect with SEXTANT, DOMAINE, and PARAGON enterprise clients).

Note: Carlota Jo does not engage in public marketing or social media advertising. All acquisition is through confidential, relationship-based channels.`,
      },
      {
        title: 'Retention Model',
        content: `Carlota Jo's retention is driven by three factors:

1. Relationship depth: Advisory relationships are personal and confidential. Switching to a new advisor requires rebuilding institutional knowledge that takes months to develop.

2. Operational integration: Clients who use Carlota Jo to design their operational systems are creating dependency on the systems, not just the advisor.

3. Continuous value: Retainer relationships are structured around ongoing deliverables — weekly/monthly advisory sessions, quarterly strategic reviews, and real-time on-call access — creating continuous touchpoints.

Historical retention: Advisory relationships in this market segment typically renew at 85%+ and last 3–7 years when managed well.`,
      },
    ],
  },

  // ─── BANK / SBA LENDER PACKAGE ────────────────────────────────────────────

  {
    id: 'bank-business-plan',
    title: 'SZL Holdings — Bank-Ready Business Plan',
    lane: 'SZL Holdings',
    channel: 'bank',
    type: 'plan',
    description: 'Complete bank-ready business plan with all required sections.',
    status: 'ready',
    printable: true,
    sections: [
      {
        title: 'Executive Summary',
        content: `SZL Holdings, Inc. is a technology holding company headquartered in New York, New York. The company designs, builds, and operates a portfolio of six command-layer intelligence platforms: Counsel (automation backbone), KORA (business observability), SEXTANT (maritime intelligence), PARAGON (cybersecurity operations), DOMAINE (real estate intelligence), and Carlota Jo Consulting (premium advisory).

Loan Request: $[AMOUNT — TO BE DETERMINED BASED ON LENDER PROGRAM] for working capital and operating expense support during the company's commercial scaling phase.

Use of Proceeds: Engineering personnel, sales and marketing activation, operational infrastructure, and working capital to support the first institutional revenue close.

Repayment Source: Operating revenue from Carlota Jo (immediate), combined with SaaS subscription revenue from KORA, SEXTANT, and DOMAINE scaling to cover full debt service within [12–24 months].

Owner: Stephen Lutar, 100% ownership. [Personal financial information to be provided as part of application package.]

Note: All projections in this business plan are estimates based on market analysis and operating assumptions. They do not constitute guarantees of performance. Financial projections should be reviewed by a CPA prior to submission.`,
      },
      {
        title: 'Company Description',
        content: `Legal Name: SZL Holdings, Inc. [or LLC — to be confirmed with attorney]
State of Incorporation/Formation: [New York / Delaware — to be confirmed]
Federal Tax ID (EIN): [TO BE PROVIDED]
Business Address: New York, NY [Full address to be provided]
Business Phone: [TO BE PROVIDED]
Date Established: [TO BE PROVIDED]
Legal Structure: [Corporation / LLC]
Primary NAICS Codes: 541511, 511210, 518210
Industry: Technology / Software Publishing / Professional Services

SZL Holdings operates as a technology holding company with six distinct business lines, each targeting a specific vertical with a purpose-built software or service product. The parent company provides shared infrastructure, capital allocation, and strategic direction across all six brands.

The company was founded on the principle that most enterprise software solves problems at the feature level rather than the system level. SZL builds systems — interconnected operational infrastructure that compounds in value as each platform matures and feeds intelligence to the others.`,
      },
      {
        title: 'Market Analysis',
        content: `SZL operates across five distinct markets:

1. BUSINESS OBSERVABILITY (KORA)
Market size: $12B+ globally, $2.1B US SAM
Current state: No dominant platform at mid-market ($18K–$240K ACV)
Growth driver: Remote work has created invisible process debt; organizations are investing in operational visibility
Competitive gap: Existing tools are either IT-focused (Datadog) or enterprise-priced (ServiceNow)

2. MARITIME INTELLIGENCE (SEXTANT)
Market size: $8B+ globally, $1.4B US/European SAM
Current state: Legacy AIS tools provide position data without intelligence
Growth driver: Supply chain disruption, IMO regulatory requirements, government maritime funding
Competitive gap: No command-layer platform exists between raw AIS data and enterprise fleet management suites

3. CYBERSECURITY OPERATIONS (PARAGON)
Market size: $35B+ globally, $6B US MSP/mid-enterprise SAM
Current state: SOC teams managing 5–8 fragmented tools
Growth driver: Security consolidation, CMMC/FedRAMP requirements, MSP market growth
Competitive gap: Unified SOC command surface below the Fortune 500 price point

4. REAL ESTATE INTELLIGENCE (DOMAINE)
Market size: $4.5B NYC/NYS proptech, $800M SAM
Current state: Brokers and investors manually tracking fragmented public records
Growth driver: NYC distress cycle active, regulatory complexity increasing
Competitive gap: No distress-focused workflow platform for NYC market

5. PREMIUM ADVISORY (Carlota Jo)
Market size: $12B+ US HNW advisory market
Current state: Fragmented providers without operational sophistication
Growth driver: UHNW complexity increasing, privacy and discretion increasingly valued
Competitive gap: No advisory practice combining operational systems design with traditional advisory`,
      },
      {
        title: 'Organization & Management',
        content: `OWNERSHIP
Stephen Lutar — 100% owner, sole founder. Personal net worth statement and personal tax returns will be provided as required by lender.

MANAGEMENT
Stephen Lutar — Founder & CEO. Responsible for product development, engineering direction, business development, and strategic operations. Prior experience in systems design, workflow automation, and multi-domain technology development.

GOVERNANCE
SZL Holdings operates with a flat, founder-led organizational structure. All material decisions are made by the owner. The company maintains standard corporate governance documentation including articles of organization, operating agreement, and financial records.

PLANNED HIRES (funded by loan proceeds):
• Month 3–6: Sales / Business Development (1 hire, $80K–$120K salary + commission)
• Month 6–12: Senior Software Engineer (1 hire, $120K–$160K salary)
• Month 12–18: Government BD / Proposal Writer (1 hire, $90K–$130K salary)`,
      },
      {
        title: 'Products & Services',
        content: `Counsel (Internal Infrastructure — Not Sold Externally)
Description: Shared AI and automation backbone powering all SZL platforms
Function: Workflow orchestration, signal intelligence, document automation, connector mesh
Business value: Creates structural moat — competitors cannot replicate the interconnected architecture

KORA (SaaS Product)
Description: Business observability platform
Target customers: Operations directors, COOs, process owners at 50–500 person organizations
Revenue model: Per-seat subscription, $150–$400/seat/month
Estimated Year 1 revenue: $60K (pilot customers)
Estimated Year 2 revenue: $350K (15–20 accounts)

SEXTANT (SaaS Product)
Description: Maritime command intelligence platform
Target customers: Fleet operators, maritime insurers, government agencies
Revenue model: Per-vessel annual subscription, $5,000–$15,000/vessel/year
Estimated Year 1 revenue: $30K (pilot program)
Estimated Year 2 revenue: $300K (3–5 fleet clients)

PARAGON (SaaS + Services Product)
Description: Unified security operations command platform
Target customers: MSPs, enterprise security teams, government contractors
Revenue model: Per-seat subscription + MSSP licensing, $150–$400/seat/month
Estimated Year 1 revenue: $40K (first MSP)
Estimated Year 2 revenue: $250K (3–5 MSP relationships)

DOMAINE (SaaS Product)
Description: NYC real estate intelligence platform
Target customers: Commercial brokers, distressed property investors, real estate attorneys
Revenue model: Subscription, $299–$5,000/month based on tier
Estimated Year 1 revenue: $50K (broker launch)
Estimated Year 2 revenue: $200K (30–40 accounts)

CARLOTA JO CONSULTING (Professional Services)
Description: Premium private advisory practice
Target customers: HNW individuals, family offices, executives
Revenue model: Monthly retainer, $12,500–$35,000/month per client
Estimated Year 1 revenue: $120K (1 full-year relationship)
Estimated Year 2 revenue: $360K (3 sustained relationships)`,
      },
      {
        title: 'Marketing & Sales Strategy',
        content: `BRAND AND POSITIONING
SZL Holdings positions itself as a command infrastructure company — not a feature vendor. Each platform is marketed independently with its own brand, but all benefit from the parent company's unified architecture narrative.

DISTRIBUTION CHANNELS BY PRODUCT:

KORA: Direct outbound to operations leaders at 50–500 person professional services, healthcare, and financial services firms. Target buyers: COOs, operations directors, business process owners. Supported by content marketing (operational efficiency case studies) and product-led growth (self-serve Essential tier).

SEXTANT: Direct outbound to fleet operators and maritime logistics companies. Partnership channel: maritime insurance brokers and port consulting firms who recommend operational tools to clients. Government channel: MARAD, Coast Guard, and DHS SBIR solicitations.

PARAGON: MSP partner channel (primary) — recruit 3–5 MSP partners in Year 1 who resell PARAGON to their managed client environments. Direct enterprise channel: CISOs and security directors at 200–1,000 person organizations. Government channel: CMMC consultants and defense contractors.

DOMAINE: Direct outbound to NYC commercial brokers and distressed property investors. Distribution through NYC real estate associations (REBNY, commercial broker networks) and real estate attorney referrals.

Carlota Jo: Referral-only. Private network. No public marketing.

YEAR 1 MARKETING BUDGET: $25K–$35K (primarily outbound tooling, content, and event attendance)`,
      },
      {
        title: 'Financial Projections (Projections — Not Guarantees)',
        content: `All projections are estimates based on market analysis, industry benchmarks, and operating assumptions. They should be reviewed by a CPA prior to submission.

YEAR 1 (2026) REVENUE PROJECTION
Carlota Jo: $120,000
KORA (pilot): $60,000
SEXTANT (pilot): $30,000
DOMAINE (launch): $50,000
PARAGON (first MSP): $40,000
Total Revenue: $300,000

YEAR 1 OPERATING EXPENSES (projected)
Salaries and personnel: $180,000 (founder draw + 1 sales hire at $120K)
Engineering and infrastructure: $60,000 (cloud hosting, tools, contractor support)
Sales and marketing: $35,000
Legal and professional: $30,000
General and administrative: $20,000
Total Operating Expenses: $325,000

YEAR 1 EBITDA: ($25,000) — slight deficit covered by loan/reserve
Cash requirements: Loan proceeds provide 12+ months runway

YEAR 2 (2027) REVENUE PROJECTION
Carlota Jo: $360,000
KORA: $350,000
SEXTANT: $300,000
DOMAINE: $200,000
PARAGON: $250,000
Total Revenue: $1,460,000

YEAR 2 OPERATING EXPENSES (projected)
Salaries (4 staff): $560,000
Engineering/Infrastructure: $100,000
Sales and marketing: $80,000
Legal and professional: $40,000
G&A: $30,000
Total Operating Expenses: $810,000

YEAR 2 EBITDA: $650,000 (44% margin)
Debt service capability: Full loan service coverage from Year 2 revenue`,
      },
      {
        title: 'Funding Request',
        content: `LOAN REQUEST
Amount: $[TO BE DETERMINED BASED ON PROGRAM — see Use of Funds section]
Term: 5–7 years preferred
Rate: SBA 7(a) prime-based rate preferred
Collateral: Personal guarantee from owner (Stephen Lutar), business assets

USE OF FUNDS (see detailed Use of Funds Memo for full breakdown)
Engineering and development: 35%
Sales and GTM activation: 25%
Operations and infrastructure: 20%
Working capital reserve: 20%

REPAYMENT PLAN
Primary repayment source: Operating revenue from Carlota Jo (immediate) + SaaS subscription revenue (scaling over 12–24 months)
Secondary repayment source: Personal assets of Stephen Lutar (personal guarantee)
Debt service coverage: Projected DSCR of 1.3x by Month 18, 2.5x+ by Month 24`,
      },
    ],
  },

  {
    id: 'use-of-funds-memo',
    title: 'Use of Funds Memo — 12 & 24 Month',
    lane: 'SZL Holdings',
    channel: 'bank',
    type: 'memo',
    description: 'Detailed use-of-funds memo showing 12-month and 24-month deployment horizons.',
    status: 'ready',
    printable: true,
    sections: [
      {
        title: '12-Month Deployment (Month 1–12)',
        content: `Total Funds (assuming $500K raise): $500,000

ENGINEERING & PRODUCT DEVELOPMENT (35% / $175,000)
Month 1–3: KORA revenue tier completion and first paying customer onboarding infrastructure
Month 1–3: SEXTANT enterprise tier feature set (API, custom alerts, compliance reporting)
Month 4–6: PARAGON MSSP multi-tenant management layer
Month 4–9: DOMAINE broker workflow features (deal tracking, outreach automation)
Month 7–12: Platform stability, security hardening, and compliance controls across all products
Contractor support: $40,000 (supplemental engineering resources for specific deliverables)

SALES & GO-TO-MARKET (25% / $125,000)
Month 1–3: Sales hire #1 onboarding and ramp ($30K for Q1 including ramp time)
Month 1–12: CRM and outbound tooling (HubSpot, Apollo, Outreach): $12,000
Month 1–12: Content and thought leadership: $15,000
Month 3–6: KORA pilot outreach campaign: $10,000
Month 6–12: SEXTANT fleet operator outreach: $10,000
Month 3–12: PARAGON MSP partner recruitment: $8,000
Event participation and trade shows: $20,000
Government market access preparation (SAM registration, 8(a) prep): $20,000

LEGAL & PROFESSIONAL (12% / $60,000)
Corporate counsel (entity structure, IP protection): $20,000
SBA application and compliance: $5,000
MWBE application assistance: $5,000
Employment agreements and contractor agreements: $10,000
Accounting/bookkeeping setup and Year 1 tax preparation: $20,000

INFRASTRUCTURE & OPERATIONS (13% / $65,000)
Cloud infrastructure (AWS, GCP) for all six platforms: $36,000 ($3K/month)
Development and productivity tools: $12,000
Security and compliance tooling: $10,000
Office and administrative: $7,000

WORKING CAPITAL RESERVE (15% / $75,000)
Three months of operating expenses held in reserve to provide buffer against revenue timing risk`,
      },
      {
        title: '24-Month Deployment (Month 13–24)',
        content: `Projected Additional Capital (from revenue or second raise): $[TO BE DETERMINED]

Month 13–18 priorities:
• Hire #2 — Senior Software Engineer: Focus on PARAGON government compliance and SEXTANT data pipeline
• First government contract pursuit: SBIR Phase I proposals submitted (PARAGON/DHS, SEXTANT/DoD)
• Enterprise sales motion activation: Dedicated enterprise outreach for KORA and PARAGON
• MWBE certification completion: NY state procurement access

Month 19–24 priorities:
• Series A preparation: Financial audit, data room assembly, investor materials finalized
• Government contract award: First SBIR Phase I or 8(a) sole-source contract expected
• Platform scaling: Engineering investment to support enterprise customer load
• Hiring: Government BD hire, additional engineering

24-Month Revenue Target: $1,460,000 ARR
24-Month Expense Target: $810,000
24-Month EBITDA Target: $650,000
Debt service from Month 18+: Full loan service coverage from operating revenue`,
      },
      {
        title: 'Risk Disclosure',
        content: `This use of funds memo is based on projections and assumptions. Actual deployment may vary based on:
• Revenue timing — if any revenue stream is slower than projected, funds will be reallocated to extend runway
• Hiring timing — hires may be accelerated or deferred based on revenue performance
• Government program timelines — SBIR, 8(a), and MWBE programs have unpredictable timelines that may affect government revenue

All financial projections require independent CPA review before submission to lenders.`,
      },
    ],
  },

  {
    id: 'operating-model-12m',
    title: '12-Month Operating Model',
    lane: 'SZL Holdings',
    channel: 'bank',
    type: 'model',
    description: 'Month-by-month revenue, expense, and cash flow model.',
    status: 'draft',
    sections: [
      {
        title: 'Revenue Assumptions',
        content: `All figures are projections and assumptions. Not guarantees.

CARLOTA JO
Start: $0/month (building relationships in Month 1–2)
Month 3: $12,500/month (1 client at Tier 1)
Month 6: $25,000/month (2 clients)
Month 9+: $37,500/month (3 clients)
12-Month total: ~$100,000

KORA
Month 1–3: $0 (pilot phase)
Month 4: $5,000/month (1 paying pilot at $5K MRR)
Month 6: $12,000/month (3 accounts at avg $4K MRR)
Month 9+: $22,000/month (7 accounts)
12-Month total: ~$60,000

SEXTANT
Month 1–6: $0 (partnership development)
Month 7: $12,000 one-time pilot
Month 9+: $5,000/month recurring
12-Month total: ~$30,000

DOMAINE
Month 1–2: $0 (beta)
Month 3: $3,000/month (10 broker accounts at $299)
Month 6: $8,000/month (20 accounts + investor tier)
Month 9+: $14,000/month (35+ accounts)
12-Month total: ~$50,000

PARAGON
Month 1–5: $0 (MSP recruitment)
Month 6: $15,000 first MSP contract
Month 9+: $8,000/month recurring
12-Month total: ~$40,000

TOTAL 12-MONTH REVENUE PROJECTION: $280,000–$320,000`,
      },
      {
        title: 'Expense Model',
        content: `Month 1–3 Burn Rate: $22,000/month
• Founder draw: $8,000/month
• Cloud infrastructure: $3,000/month
• Tools and services: $2,000/month
• Legal/professional (amortized): $4,000/month
• Marketing and outbound: $3,000/month
• Miscellaneous: $2,000/month

Month 4–6 Burn Rate: $32,000/month (after first sales hire)
• Salaries (founder + 1): $18,000/month
• Cloud infrastructure: $3,500/month
• Tools: $2,500/month
• Marketing: $4,000/month
• Professional services: $2,500/month
• G&A: $1,500/month

Month 7–12 Burn Rate: $37,000/month (operating scale)
• Salaries (founder + 1–2): $22,000/month
• Cloud infrastructure: $4,000/month
• Tools and infrastructure: $3,000/month
• Marketing and sales: $4,000/month
• Professional and legal: $2,500/month
• G&A: $1,500/month

TOTAL 12-MONTH EXPENSES (projected): $360,000–$400,000
NET CASH POSITION (with $500K loan): Positive through Month 12 with ~$100K–$150K reserve`,
      },
      {
        title: 'Debt Service Coverage',
        content: `Loan terms assumed for analysis: $500,000 at 6.5% over 7 years
Monthly payment: ~$7,400/month ($88,800/year)

DSCR ANALYSIS (projections)
Month 1–6: Revenue insufficient to cover debt service independently. Covered by loan proceeds (working capital reserve).
Month 7–9: Revenue ~$25,000/month, expenses ~$35,000/month. Partial coverage. Still utilizing reserve.
Month 10–12: Revenue ~$40,000–$55,000/month, expenses ~$37,000/month. Cash flow positive. Debt service covered from operations.

Year 1 ending DSCR: ~0.85x (below 1.0x — expected for early-stage; reserve coverage planned)
Year 2 projected DSCR: ~3.0x based on $1.46M revenue projection and $810K expense projection

This analysis assumes conservative revenue projections. Carlota Jo achieving 3 clients by Month 9 is the primary revenue hedge. If Carlota Jo is delayed, DSCR recovers in Month 14–18 from SaaS revenue.`,
      },
    ],
  },

  {
    id: 'operating-model-24m',
    title: '24-Month Operating Model & Cash Flow Schedule',
    lane: 'SZL Holdings',
    channel: 'bank',
    type: 'model',
    description:
      'Month-by-month 24-month revenue, expense, headcount, and cash flow projection with quarterly roll-ups.',
    status: 'ready',
    printable: true,
    sections: [
      {
        title: 'Revenue Forecast — Month 1–24 (Monthly Detail)',
        content: `All figures are projections and assumptions. Not guarantees. Requires CPA review before lender submission.

MONTH 1: $0 (all lines in startup/pilot mode)
MONTH 2: $0
MONTH 3: $12,500 (CJ: $9,500; DOMAINE: $3,000; KORA: $0; SEXTANT: $0; PARAGON: $0)
MONTH 4: $17,500 (CJ: $9,500; DOMAINE: $3,000; KORA: $5,000; SEXTANT: $0; PARAGON: $0)
MONTH 5: $20,000 (CJ: $9,500; DOMAINE: $3,500; KORA: $7,000; SEXTANT: $0; PARAGON: $0)
MONTH 6: $33,000 (CJ: $19,000 — 2 clients; DOMAINE: $4,000; KORA: $7,000; SEXTANT: $3,000 pilot; PARAGON: $0)
MONTH 7: $40,000 (CJ: $19,000; DOMAINE: $5,000; KORA: $8,000; SEXTANT: $5,000; PARAGON: $3,000)
MONTH 8: $45,000 (CJ: $19,000; DOMAINE: $5,000; KORA: $10,000; SEXTANT: $5,000; PARAGON: $6,000)
MONTH 9: $60,500 (CJ: $28,500 — 3 clients; DOMAINE: $6,000; KORA: $12,000; SEXTANT: $6,000; PARAGON: $8,000)
MONTH 10: $68,000 (CJ: $28,500; DOMAINE: $7,000; KORA: $14,000; SEXTANT: $8,000; PARAGON: $10,500)
MONTH 11: $75,000 (CJ: $28,500; DOMAINE: $8,000; KORA: $16,000; SEXTANT: $10,000; PARAGON: $12,500)
MONTH 12: $85,000 (CJ: $28,500; DOMAINE: $9,000; KORA: $18,000; SEXTANT: $12,000; PARAGON: $17,500)

MONTH 13: $92,000 (CJ: $28,500; DOMAINE: $10,000; KORA: $22,000; SEXTANT: $14,000; PARAGON: $17,500)
MONTH 14: $98,000 (CJ: $28,500; DOMAINE: $11,000; KORA: $24,000; SEXTANT: $16,000; PARAGON: $18,500)
MONTH 15: $108,000 (CJ: $28,500; DOMAINE: $12,000; KORA: $28,000; SEXTANT: $18,000; PARAGON: $21,500)
MONTH 16: $115,000 (CJ: $28,500; DOMAINE: $12,500; KORA: $30,000; SEXTANT: $20,000; PARAGON: $24,000)
MONTH 17: $120,000 (CJ: $28,500; DOMAINE: $13,000; KORA: $32,000; SEXTANT: $22,000; PARAGON: $24,500)
MONTH 18: $128,000 (CJ: $28,500; DOMAINE: $13,500; KORA: $34,000; SEXTANT: $24,000; PARAGON: $28,000)
MONTH 19: $133,000 (CJ: $28,500; DOMAINE: $14,000; KORA: $36,000; SEXTANT: $26,000; PARAGON: $28,500)
MONTH 20: $138,000 (CJ: $28,500; DOMAINE: $14,500; KORA: $38,000; SEXTANT: $28,000; PARAGON: $29,000)
MONTH 21: $142,000 (CJ: $28,500; DOMAINE: $15,000; KORA: $40,000; SEXTANT: $28,500; PARAGON: $30,000)
MONTH 22: $148,000 (CJ: $28,500; DOMAINE: $15,500; KORA: $42,000; SEXTANT: $30,000; PARAGON: $32,000)
MONTH 23: $152,000 (CJ: $28,500; DOMAINE: $15,500; KORA: $44,000; SEXTANT: $32,000; PARAGON: $32,000)
MONTH 24: $158,000 (CJ: $28,500; DOMAINE: $16,000; KORA: $46,000; SEXTANT: $34,000; PARAGON: $33,500)

24-MONTH CUMULATIVE REVENUE: $1,988,500`,
      },
      {
        title: 'Quarterly Revenue Roll-Up',
        content: `Q1 (Month 1–3): $12,500
Q2 (Month 4–6): $70,500
Q3 (Month 7–9): $145,500
Q4 (Month 10–12): $228,000
YEAR 1 TOTAL: $456,500

Q5 (Month 13–15): $298,000
Q6 (Month 16–18): $363,000
Q7 (Month 19–21): $413,000
Q8 (Month 22–24): $458,000
YEAR 2 TOTAL: $1,532,000

24-MONTH TOTAL: $1,988,500

YEAR 2 RUN-RATE (Month 24 annualized): $1,896,000 ARR

REVENUE MIX AT MONTH 24:
• Carlota Jo: $28,500/mo (18.0% of MRR)
• KORA: $46,000/mo (29.1%)
• SEXTANT: $34,000/mo (21.5%)
• DOMAINE: $16,000/mo (10.1%)
• PARAGON: $33,500/mo (21.2%)`,
      },
      {
        title: 'Expense Forecast — Month 1–24 (Monthly Detail)',
        content: `MONTH 1–3 (Pre-Hire): $22,000/month
• Founder draw: $8,000
• Cloud infrastructure: $3,000
• Tools and SaaS: $2,000
• Legal/professional (amortized): $4,000
• Marketing: $3,000
• G&A: $2,000

MONTH 4–6 (After Sales Hire #1): $32,000/month
• Salaries (founder + sales): $18,000
• Cloud: $3,500
• Tools: $2,500
• Marketing: $4,000
• Professional: $2,500
• G&A: $1,500

MONTH 7–9 (Scaling): $37,000/month
• Salaries (founder + 1–2 staff): $22,000
• Cloud: $4,000
• Tools: $3,000
• Marketing: $4,000
• Professional: $2,500
• G&A: $1,500

MONTH 10–12 (Full Operations): $42,000/month
• Salaries (founder + 2 staff): $26,000
• Cloud: $5,000
• Tools: $3,000
• Marketing: $4,000
• Professional: $2,500
• G&A: $1,500

MONTH 13–18 (Growth Phase): $55,000/month
• Salaries (founder + 3 staff): $36,000
• Cloud: $6,000
• Tools: $3,500
• Marketing: $5,000
• Professional: $3,000
• G&A: $1,500

MONTH 19–24 (Scale Phase): $68,000/month
• Salaries (founder + 4–5 staff): $45,000
• Cloud: $7,500
• Tools: $4,000
• Marketing: $6,000
• Professional: $3,500
• G&A: $2,000

24-MONTH CUMULATIVE EXPENSES: $1,137,000
(M1–3: $66K + M4–6: $96K + M7–9: $111K + M10–12: $126K = Year 1 $399K; M13–18: $330K + M19–24: $408K = Year 2 $738K)`,
      },
      {
        title: 'Headcount Plan',
        content: `MONTH 1–3: 1 (Founder only)
Founder handles all product, engineering, BD, and operations.

MONTH 4–6: 2 (+ Sales/BD hire)
Sales/Business Development Associate: $80K–$100K base + commission
Focus: KORA and Carlota Jo commercial activation

MONTH 7–9: 2–3 (+ part-time contractor or intern)
Engineering contractor: $40K–$60K annual equivalent (part-time)
Focus: SEXTANT enterprise features, DOMAINE broker tools

MONTH 10–12: 3 (+ Senior Engineer OR full-time contractor)
Full-time Senior Software Engineer: $120K–$150K
Focus: PARAGON compliance, platform stability, scaling infrastructure

MONTH 13–18: 4 (+ Government BD hire)
Government BD / Proposal Writer: $90K–$120K
Focus: SBIR applications, SAM.gov management, 8(a) preparation, contract pursuit

MONTH 19–24: 5 (+ Junior Engineer or Customer Success)
Junior Engineer OR Customer Success Manager: $70K–$90K
Focus: Customer onboarding, platform support, feature velocity`,
      },
      {
        title: 'Cash Flow Schedule (Monthly Net Position)',
        content: `All figures are projections. Net = Revenue - Expenses. Cumulative includes loan proceeds ($500K at Month 0).

MONTH 0: +$500,000 (loan proceeds received)
MONTH 1: -$22,000 → Cumulative: $478,000
MONTH 2: -$22,000 → Cumulative: $456,000
MONTH 3: -$9,500 (Rev $12,500 - Exp $22,000) → Cumulative: $446,500
MONTH 4: -$14,500 → Cumulative: $432,000
MONTH 5: -$12,000 → Cumulative: $420,000
MONTH 6: +$1,000 (Rev $33,000 - Exp $32,000) → Cumulative: $421,000
MONTH 7: +$3,000 → Cumulative: $424,000
MONTH 8: +$8,000 → Cumulative: $432,000
MONTH 9: +$23,500 → Cumulative: $455,500
MONTH 10: +$26,000 → Cumulative: $481,500
MONTH 11: +$33,000 → Cumulative: $514,500
MONTH 12: +$43,000 → Cumulative: $557,500

YEAR 1 NET CASH POSITION: $557,500 (positive, above starting capital)

MONTH 13: +$37,000 → Cumulative: $594,500
MONTH 14: +$43,000 → Cumulative: $637,500
MONTH 15: +$53,000 → Cumulative: $690,500
MONTH 16: +$60,000 → Cumulative: $750,500
MONTH 17: +$65,000 → Cumulative: $815,500
MONTH 18: +$73,000 → Cumulative: $888,500
MONTH 19: +$65,000 → Cumulative: $953,500
MONTH 20: +$70,000 → Cumulative: $1,023,500
MONTH 21: +$74,000 → Cumulative: $1,097,500
MONTH 22: +$80,000 → Cumulative: $1,177,500
MONTH 23: +$84,000 → Cumulative: $1,261,500
MONTH 24: +$90,000 → Cumulative: $1,351,500

YEAR 2 NET CASH POSITION: $1,351,500
NET CASH GENERATED (24 months, after expenses, before debt service): $851,500
(Revenue $1,988,500 − Expenses $1,137,000 = $851,500)

DEBT SERVICE ANALYSIS:
Assumed loan: $500,000 at 6.5% over 7 years → $7,400/month
Annual debt service: $88,800
24-month debt service total: $177,600
Net after debt service (Month 24): $1,173,900

DSCR (Trailing 12-Month Method — NOI / Annual Debt Service):
DSCR at Month 12 (Year 1 trailing): 0.65x (below 1.0x — early-stage, reserve-funded; expected)
DSCR at Month 18 (M7–18 trailing): 5.3x (strong — SaaS revenue fully ramped)
DSCR at Month 24 (Year 2 trailing): 8.9x (excellent — all lines contributing)

Note: Year 1 DSCR is below 1.0x due to startup ramp, consistent with the 12-month operating model. The $500K loan reserve is sized to cover this period. Business achieves cash-flow breakeven at Month 6 and sustains positive monthly cash flow from Month 7 onward.`,
      },
      {
        title: 'Key Assumptions & Sensitivity',
        content: `BASE CASE ASSUMPTIONS:
• Carlota Jo ramp: 1 client by Month 3, 2 by Month 6, 3 by Month 9 (steady state)
• KORA ramp: First paying customer Month 4, growing $3K–$5K MRR per month
• SEXTANT ramp: First pilot Month 6, growing $2K–$3K MRR per month
• DOMAINE ramp: Broker launch Month 3, growing $2K/month
• PARAGON ramp: First MSP Month 9, growing $2K–$4K MRR per month
• No government contract revenue assumed in base case (upside only)

DOWNSIDE CASE (30% revenue reduction across all SaaS lines):
Year 1 revenue: $340K (vs. $457K base)
Year 2 revenue: $1,072K (vs. $1,532K base)
Cash positive by: Month 8 (vs. Month 6 base)
Year 2 trailing DSCR at Month 24: 3.8x (still strong; Year 2 NOI $334K / debt service $88.8K)
Impact: Extends time to full debt coverage but does not breach reserve

UPSIDE CASE (SBIR Phase I + faster SaaS ramp):
Year 1 revenue: $620K (SBIR $275K + faster commercial)
Year 2 revenue: $2,100K (Phase II + enterprise contracts)
DSCR at Month 18: 3.5x+

All projections require CPA review before submission. Actual results will vary.`,
      },
    ],
  },

  {
    id: 'founder-background',
    title: 'Founder Background Summary — Stephen Lutar',
    lane: 'SZL Holdings',
    channel: 'bank',
    type: 'brief',
    description: 'Founder bio, experience, and qualifications for lender package.',
    status: 'ready',
    sections: [
      {
        title: 'Professional Background',
        content: `Stephen Lutar is the founder and sole owner of SZL Holdings, Inc. He is a systems architect, builder, and operator with a background spanning workflow design, command systems, multi-domain intelligence, and technology platform development.

Stephen conceived, designed, and built all six SZL platforms from architecture through deployment — including the shared Counsel backbone that powers the entire portfolio. This is not a management background; it is an operational and technical background demonstrated through shipped product.

Key areas of expertise:
• Systems architecture and platform design
• Workflow automation and process intelligence
• Command and control system design (applied to business, maritime, and security domains)
• Multi-stakeholder coordination and intelligence analysis
• Capital readiness, compliance infrastructure, and government procurement`,
      },
      {
        title: 'Qualifications Relevant to This Loan',
        content: `Business management: Full ownership and management of SZL Holdings across six active business lines. Demonstrated ability to manage capital allocation, product development, and business operations simultaneously.

Financial management: Manages all financial operations of SZL Holdings including revenue recognition, expense management, and capital planning. Personal financial records available for review.

Industry expertise: Deep domain expertise in all five verticals served by SZL platforms, developed through platform design, market research, and operational deployment.

Technology credentials: Designed and shipped production-grade software across six distinct domains. Technical depth reduces key-person risk from a product standpoint — the systems are built and documented.

Character and reputation: [Personal and professional references to be provided upon request. No adverse legal history, no bankruptcies, no criminal record.]`,
      },
      {
        title: 'Personal Financial Summary',
        content: `[This section will be completed with actual personal financial data as required by the lender application:
• Personal tax returns — most recent 2 years
• Personal financial statement (assets, liabilities, net worth)
• Personal credit authorization
• Government-issued photo ID
• Personal background/reference contacts]

Note: Stephen Lutar is the 100% owner and will provide a personal guarantee on any business loan. Personal financial documentation will be provided in full as part of the application package.`,
      },
    ],
  },

  {
    id: 'risk-mitigation-sheet',
    title: 'Risk / Mitigation Sheet',
    lane: 'SZL Holdings',
    channel: 'bank',
    type: 'brief',
    description: 'Key business risks with corresponding mitigation strategies.',
    status: 'ready',
    sections: [
      {
        title: 'Risk Matrix',
        content: `RISK 1: Single-Founder Key-Person Risk
Description: Stephen Lutar is the sole founder and operator. Loss of ability to operate could impact business continuity.
Probability: Low | Impact: High
Mitigation:
• Full system documentation and operational runbooks maintained
• Cloud-based infrastructure with no physical key-person dependency
• Life and disability insurance to be obtained prior to loan close
• Advisory relationships being formalized to provide continuity support
• Carlota Jo client relationships are codified in contracts that survive principal changes

RISK 2: Revenue Timing Risk
Description: Revenue projections may take longer to materialize than forecast.
Probability: Medium | Impact: Medium
Mitigation:
• Three independent revenue tracks — if one delays, others can accelerate
• Carlota Jo provides immediate cash flow with minimal product dependency
• Operating reserve (15% of loan proceeds) provides 3+ months buffer
• Expense structure is lean — founder draw can be reduced in lean periods
• SaaS revenue, once initiated, is highly predictable and recurring

RISK 3: Market Competition
Description: A well-funded competitor enters one or more of SZL's target markets.
Probability: Medium | Impact: Medium
Mitigation:
• Counsel architecture creates a structural moat — competitors cannot replicate the interconnected system
• Each platform has first-mover advantage in its specific category
• Government market positioning is not accessible to most competitors without certifications
• Customer relationships are deep and system-integrated (high switching cost)

RISK 4: Technical Risk
Description: Platform stability, security incidents, or technical failures.
Probability: Low | Impact: High
Mitigation:
• All platforms built with enterprise-grade security practices from ground up
• PARAGON platform provides internal security monitoring
• Cloud infrastructure with automatic failover and backup
• Security audits planned quarterly; penetration testing annually
• No single-vendor dependency in technical stack

RISK 5: Regulatory / Certification Risk
Description: Government certifications (MWBE, 8(a)) may be delayed or denied.
Probability: Low-Medium | Impact: Low (government revenue is secondary to core SaaS)
Mitigation:
• Government revenue is not required for loan repayment — loan is repayable from commercial SaaS revenue
• Multiple certification tracks being pursued simultaneously (MWBE, 8(a), WOSB)
• SAM.gov registration (prerequisite) is straightforward and low-risk
• SBIR revenue is additive, not required for base case`,
      },
    ],
  },

  {
    id: 'entity-banking-checklist',
    title: 'Entity & Banking Documentation Checklist',
    lane: 'SZL Holdings',
    channel: 'bank',
    type: 'checklist',
    description: 'Checklist of required legal and banking documents for lender package.',
    status: 'ready',
    sections: [
      {
        title: 'Entity Documents',
        content: `FORMATION DOCUMENTS
☐ Articles of Organization or Incorporation (state-certified)
☐ Certificate of Formation (if LLC)
☐ Operating Agreement (most current version, signed)
☐ Bylaws (if corporation, most current version)
☐ Shareholder/Member Agreement (if applicable)

IDENTITY DOCUMENTS
☐ EIN Verification Letter from IRS (CP-575 or 147C)
☐ Business License(s) — all active licenses
☐ DBA / Fictitious Business Name filings (Counsel, KORA, SEXTANT, PARAGON, DOMAINE, Carlota Jo)
☐ State registration certificate (Certificate of Good Standing — most recent)
☐ Any regulatory licenses specific to business operations

OWNERSHIP DOCUMENTATION
☐ Ownership verification for all owners 20%+
☐ Stephen Lutar: 100% ownership — verified via operating agreement
☐ Photo ID (government-issued) for all owners 20%+

BANKING DOCUMENTS
☐ Business bank statements — most recent 6 months (all accounts)
☐ Business credit card statements (if applicable)
☐ Merchant processing statements (if applicable)
☐ Existing loan statements and payoff letters (all outstanding debt)

FINANCIAL RECORDS
☐ Business tax returns — most recent 2 years (Form 1065, 1120, or Schedule C)
☐ Personal tax returns — most recent 2 years (all owners 20%+)
☐ Year-to-date financial statements (P&L, balance sheet)
☐ Accounts receivable aging (if applicable)
☐ Accounts payable aging (if applicable)
☐ Existing contracts with customers / letters of intent

INSURANCE
☐ Current business insurance policy certificate (general liability)
☐ Professional liability / E&O insurance (if applicable)
☐ Key-man life insurance (to be obtained prior to close)`,
      },
    ],
  },

  // ─── NY STATE PROGRAMS ────────────────────────────────────────────────────

  {
    id: 'ny-mwbe-guide',
    title: 'NY MWBE Certification Readiness Guide',
    lane: 'SZL Holdings',
    channel: 'ny_state',
    type: 'guide',
    description:
      'Complete MWBE certification readiness guide based on Empire State Development requirements.',
    status: 'ready',
    printable: true,
    sections: [
      {
        title: 'Overview',
        content: `The New York State Minority and Women-Owned Business Enterprise (MWBE) certification, administered by Empire State Development (ESD), provides certified businesses with access to New York State government contract set-asides and programs designed to increase MWBE participation in state procurement.

Certifying body: New York State Empire State Development
Application portal: ny.newnycontracts.com (Statewide Financial System integration)
Renewal: Every 2 years
Attorney review: Strongly recommended before submission
CPA review: Required for financial documentation

CERTIFICATION BENEFITS:
• Access to NY state contract set-asides for MWBE-certified vendors
• Preferred vendor status on many state agency procurements
• NYC SBS MWBE certification eligibility (separate process, but NY ESD certification helps)
• Marketing and visibility in ESD's certified vendor directory
• Access to MWBE technical assistance programs`,
      },
      {
        title: 'Eligibility Requirements',
        content: `51%+ OWNERSHIP by qualifying individuals:
The business must be at least 51% owned by one or more individuals who are members of a minority group or women. Qualifying groups include: Black Americans, Hispanic Americans, Asian-Pacific Americans, Asian-Indian Americans, and Women.

Ownership must be unconditional and direct — not conditioned on future events or held through intermediary entities.

MANAGEMENT AND CONTROL:
The qualifying owner(s) must exercise day-to-day management and control of the business. This means the qualifying owner makes or supervises the making of all major business decisions: long-term planning, financial, operational, personnel.

Control must be real — not nominal. ESD will look for evidence that the qualifying owner is actually running the business, not just listed as an owner.

US CITIZENSHIP OR PERMANENT RESIDENT:
All qualifying owners must be US citizens or permanent resident aliens.

NEW YORK BUSINESS PRESENCE:
The business must be physically located in New York State OR perform substantial business activity in New York State. Office in New York, employees working in New York, or substantial contracts performed in New York all qualify.

PERSONAL NET WORTH LIMITS:
For MWBE certification: Personal net worth of qualifying owner(s) must not exceed $3.5 million (excluding primary residence and business value). Personal financial disclosure is required.

SBA SIZE STANDARDS:
The business must qualify as a small business under applicable SBA size standards for its primary NAICS code. For software publishers (NAICS 511210): $47.5M average annual revenue limit.`,
      },
      {
        title: 'Required Documentation Checklist',
        content: `OWNERSHIP AND CONTROL DOCUMENTS
☐ Signed, certified personal statement from qualifying owner
☐ Operating Agreement or Bylaws showing 51%+ ownership stake
☐ Shareholder Agreement or Membership Interest Certificate
☐ EIN Verification Letter (IRS CP-575 or 147C)
☐ Articles of Organization or Incorporation (state-certified)

IDENTITY AND ELIGIBILITY DOCUMENTS
☐ Birth certificate OR US Passport OR Naturalization Certificate (proof of citizenship)
☐ Government-issued photo ID (driver's license or passport)
☐ Written narrative demonstrating qualifying minority or women status
☐ Social Security Number verification

NEW YORK BUSINESS PRESENCE DOCUMENTS
☐ Lease agreement for NY office space OR utility bill showing NY address
☐ NY business license or registration
☐ Proof of NY clients, contracts, or operations (invoices, contracts, correspondence)
☐ NY state and/or city tax filings

FINANCIAL DOCUMENTS
☐ Business federal tax returns — most recent 2 years
☐ Business state tax returns (NY) — most recent 2 years
☐ Business bank statements — most recent 6 months
☐ Personal tax returns for qualifying owner — most recent 2 years
☐ Personal financial statement (assets and liabilities)
☐ Balance sheet and P&L (current year to date)

MANAGEMENT AND CONTROL DOCUMENTATION
☐ Signed statement from qualifying owner describing their management role
☐ Organizational chart showing reporting structure
☐ Evidence of qualifying owner's involvement in major decisions (board minutes, executed contracts, signed documents)
☐ Business license(s) in qualifying owner's name (if applicable)

ADDITIONAL DOCUMENTS (may be required)
☐ Customer list (top 10 clients)
☐ Copies of significant contracts (may be redacted)
☐ Loan documents (if business has outstanding debt)`,
      },
      {
        title: 'Application Process & Timeline',
        content: `PHASE 1: Pre-Application Preparation (4–8 weeks)
• Gather all required documents
• Attorney review of operating agreement and ownership structure
• CPA review of financial statements
• Personal financial statement preparation
• Written narrative development (management and control, minority/women status)

PHASE 2: Application Submission
• Create account at ny.newnycontracts.com
• Upload all documents
• Complete online application forms
• Pay application fee (varies by certification level)
• Submit

PHASE 3: ESD Review (4–6 months typical)
• ESD reviews for completeness
• Possible requests for additional information (RFIs) — respond within 10 days
• Possible site visit (for some applicants)
• Final determination

PHASE 4: Certification Issued
• Certification valid for 2 years
• Annual update filings required
• Renewal application submitted 90 days before expiration

TOTAL TIMELINE: 6–10 months from decision to apply to certification received
ATTORNEY COST: $3,000–$7,000 typical for application assistance
KEY RISK: Ownership and control documentation is the most common failure point — attorney review is essential`,
      },
      {
        title: 'SZL Eligibility Notes',
        content: `CRITICAL NOTE: All eligibility analysis is for informational purposes only. No determination of MWBE eligibility can be made without a formal review by qualified legal counsel. The following is a framework for analysis, not a legal opinion.

OWNERSHIP: SZL Holdings is 100% owned by Stephen Lutar. MWBE certification requires 51%+ ownership by a qualifying minority or woman individual. Whether Stephen Lutar qualifies requires attorney review based on his specific demographic background and applicable definitions.

MANAGEMENT AND CONTROL: Stephen Lutar exercises full management and control of SZL Holdings — this requirement is clearly met as the sole founder and operator.

NY BUSINESS PRESENCE: SZL Holdings is a NY-based company with primary business operations in New York. This requirement is met.

RECOMMENDED NEXT STEPS:
1. Retain attorney with MWBE application experience (ESD recommends using certified consultants)
2. Provide attorney with all ownership documents, demographic information, and operating agreement
3. Attorney advises on eligibility and optimal application strategy
4. Gather financial documentation with CPA assistance
5. Proceed to application if eligibility is confirmed`,
      },
    ],
  },

  {
    id: 'ny-excelsior-guide',
    title: 'NY Excelsior Jobs Program — Eligibility Analysis',
    lane: 'SZL Holdings',
    channel: 'ny_state',
    type: 'guide',
    description:
      'Excelsior Jobs Program eligibility and tax credit structure for SZL as a technology company.',
    status: 'ready',
    sections: [
      {
        title: 'Program Overview',
        content: `The Excelsior Jobs Program, administered by Empire State Development, provides refundable tax credits to eligible businesses in strategic industries that commit to creating new jobs and/or making significant capital investments in New York State.

PROGRAM CREDITS:
• Jobs Tax Credit: Up to 6.85% of wages paid for each new job created
• Investment Tax Credit: Up to 2% of qualifying capital investment
• Research and Development Tax Credit: Up to 50% of the federal R&D tax credit for qualifying R&D activities in NYS
• Real Property Tax Credit: Available for qualified firms in specific zones

Credits are refundable (paid as cash even if business has no tax liability) and awarded for 5–10 years based on commitment.

ADMINISTERING AGENCY: Empire State Development (ESD)
APPLICATION: Through ESD's Business Incentives program`,
      },
      {
        title: 'SZL Eligibility Analysis',
        content: `STRATEGIC INDUSTRY ALIGNMENT:
Excelsior Jobs Program targets "strategic industries" — SZL qualifies under multiple:

✓ Scientific Research and Development (R&D for KORA, SEXTANT, PARAGON)
✓ Software Development (all six platforms)
✓ Financial Services Technology (DOMAINE, KORA)
✓ Cybersecurity (PARAGON)

JOB CREATION REQUIREMENT:
• Tech companies: Must create at least 5 net new full-time jobs in NYS
• SZL's hiring plan (4+ hires in Year 1–2) likely meets this threshold

WAGE REQUIREMENTS:
• Jobs must pay at or above the regional average private sector wage
• NYC and Long Island: $60,000+ annual wage requirement for tech jobs
• SZL's planned engineering and sales hires at $80K–$160K easily qualify

R&D CREDIT OPPORTUNITY:
SZL's Counsel backbone development, KORA AI algorithms, SEXTANT maritime intelligence layer, and PARAGON threat detection represent qualifying R&D activities. R&D credit could be 50% of the federal R&D credit on qualifying expenses.

ESTIMATED CREDIT VALUE (projections only):
Based on 4 new hires at average $100K salary in Year 2:
Jobs Tax Credit: 4 × $100K × 6.85% = $27,400/year
R&D Credit (if qualifying): 50% × [federal R&D credit on qualifying R&D expenses]

RECOMMENDED ACTION:
1. Consult with NY tax advisor specializing in Excelsior/ESD programs
2. Document all R&D activities for federal and state R&D credit qualification
3. Apply through ESD's Business Incentives portal with hiring plan and wage commitment`,
      },
    ],
  },

  {
    id: 'nystar-guide',
    title: 'NYSTAR / Innovation Hot Spot Program',
    lane: 'SZL Holdings',
    channel: 'ny_state',
    type: 'guide',
    description: 'NYSTAR incubator and accelerator program eligibility analysis.',
    status: 'draft',
    sections: [
      {
        title: 'Program Overview',
        content: `NYSTAR (New York State Foundation for Science, Technology and Innovation) supports technology companies through incubator programs, innovation hot spots, and university-affiliated research partnerships. The program provides:

• Access to incubator space at reduced or no cost
• Business development resources and mentorship
• Access to university research partnerships
• Funding for early-stage technology companies through NYSTAR-affiliated programs
• Connections to the Startup NY and Innovation Hot Spots ecosystem

KEY PROGRAMS:
Innovation Hot Spots: 10 designated business incubators affiliated with NY universities. Companies in Innovation Hot Spots receive benefits including tax exemptions under the START-UP NY program.

NYSTAR Small Business Research Assistance (SBRA): Assistance navigating federal SBIR/STTR applications from NY state.`,
      },
      {
        title: 'SZL Alignment Analysis',
        content: `INNOVATION HOT SPOT ELIGIBILITY:
SZL qualifies as a technology company developing innovative software platforms. Relevant hot spots include:

• NYC ACRE (Association for a Better New York community center model — check current status)
• SUNY-affiliated incubators: Polytechnic Institute (NYC Tech), Stony Brook, Albany
• Columbia University Innovation Enterprise Zone
• NYU Tandon technology partnerships

SZL's Counsel platform and AI-native architecture align with NYSTAR's focus on:
• Software and data science innovation
• Cybersecurity technology (PARAGON)
• Maritime technology (SEXTANT — aligns with NY maritime industry)

SBRA SBIR ASSISTANCE:
NYSTAR's SBRA program can provide direct assistance navigating federal SBIR applications. This is highly relevant for SZL's SBIR strategy (NSF for KORA, DoD for SEXTANT/Aegis, DHS for PARAGON).

RECOMMENDED ACTION:
1. Contact NYSTAR (nystar.suny.edu) to identify the closest aligned Innovation Hot Spot
2. Apply for SBRA assistance to support SBIR Phase I applications
3. Explore START-UP NY benefits if co-located with a qualifying university affiliate`,
      },
    ],
  },

  {
    id: 'nyc-sbs-guide',
    title: 'NYC Small Business Services — M/WBE Certification',
    lane: 'SZL Holdings',
    channel: 'ny_state',
    type: 'guide',
    description: 'NYC SBS M/WBE certification guide and procurement alignment.',
    status: 'ready',
    sections: [
      {
        title: 'NYC vs. NY State MWBE',
        content: `New York City has its own separate M/WBE certification program administered by NYC Small Business Services (SBS), distinct from the NY State ESD MWBE certification. A business seeking NYC government contracts must obtain NYC SBS certification separately.

KEY DIFFERENCES:
• NYC SBS: For New York City contracts and NYC agency procurements
• NY ESD: For New York State contracts and NY state agency procurements
• Many businesses obtain both certifications to access both NYC and NY state procurement

NYC CERTIFICATION TYPES:
• MBE (Minority Business Enterprise): 51%+ owned by qualifying minority individuals
• WBE (Women Business Enterprise): 51%+ owned by qualifying women
• Emerging Business Enterprise (EBE): Small businesses not meeting MBE/WBE criteria but meeting size requirements`,
      },
      {
        title: 'NYC Procurement Alignment',
        content: `NYC agencies relevant to SZL's platforms:

DOITT / DoITT (Department of Information Technology & Telecommunications):
NYC's technology procurement agency. Software, cybersecurity, data analytics, and IT services contracts. PARAGON (cybersecurity) and KORA (operational intelligence) align with DOITT's needs.

NYC Department of Finance:
Tax lien data and property intelligence. DOMAINE's distressed property intelligence is directly relevant to DOF's property data management ecosystem.

NYC Office of Management and Budget:
Operations and efficiency tools. KORA's operational observability aligns with OMB's focus on government efficiency.

NYC Economic Development Corporation:
Technology and innovation partnership. SZL's platform portfolio and capital readiness infrastructure align with NYCEDC's portfolio approach to economic development.

RECOMMENDED ACTION:
1. Register on NYC's PASSPort vendor portal (vendor.cityofnewyork.us)
2. Review NYC SBS certification eligibility (nyc.gov/sbs)
3. Monitor NYC agency RFPs through PASSPort for PARAGON and KORA opportunities`,
      },
    ],
  },

  {
    id: 'esd-lending-guide',
    title: 'NY Forward / ESD Small Business Programs',
    lane: 'SZL Holdings',
    channel: 'ny_state',
    type: 'guide',
    description: 'Empire State Development lending programs and small business resources.',
    status: 'ready',
    sections: [
      {
        title: 'ESD Lending Programs',
        content: `Empire State Development offers several small business financing programs:

NY FORWARD LOAN FUND:
• For small businesses in regions recovering from economic hardship
• Loans: $10,000–$250,000
• Rate: Below market rate
• Use: Working capital, payroll, rent, utilities
• Eligibility: NY-based small businesses with demonstrated need

ESD SMALL BUSINESS REVOLVING LOAN FUND:
• State-funded revolving loan fund for small businesses
• Loans: $50,000–$500,000
• Use: Working capital and growth capital
• Eligibility: NY-based small businesses with demonstrated economic impact

NYC SMALL BUSINESS SERVICES (SBS) LOANS:
• NYC SBS partners with CDFIs to provide small business loans
• Loans: $10,000–$250,000
• Favorable rates for certified M/WBE businesses

CDFI PARTNERS (Community Development Financial Institutions):
• Accion NYC: Small business loans for underserved entrepreneurs
• Entrepreneurs of Color Fund: For businesses owned by people of color
• Renaissance Economic Development Corporation: Queens/NYC focus
• Community Reinvestment Fund: US CDFI with NY presence

RECOMMENDED STRATEGY:
Pursue ESD and CDFI lending as a complement to SBA lending — CDFI loans often have more flexible underwriting criteria and are specifically designed for early-stage businesses.`,
      },
    ],
  },

  // ─── FEDERAL PROGRAMS ─────────────────────────────────────────────────────

  {
    id: 'sba-8a-guide',
    title: 'SBA 8(a) Business Development Program — Eligibility & Checklist',
    lane: 'SZL Holdings',
    channel: 'federal',
    type: 'guide',
    description: 'SBA 8(a) eligibility analysis and complete application checklist.',
    status: 'ready',
    printable: true,
    sections: [
      {
        title: 'Program Overview',
        content: `The SBA 8(a) Business Development Program is a 9-year federal business development program for small disadvantaged businesses. It provides access to sole-source and set-aside federal contracts, mentorship, and business development resources.

PROGRAM BENEFITS:
• Sole-source contracts up to $4.5M (goods/services) and $7.5M (manufacturing) — no competitive bid required
• Set-aside competition restricted to 8(a) firms
• Mentor-Protégé Program access for joint ventures
• Federal procurement preference in all federal agencies
• Business development training and technical assistance

ADMINISTERING AGENCY: US Small Business Administration (certify.sba.gov)

PROGRAM DURATION: 9 years (4-year developmental stage + 5-year transitional stage)

NOTE: Eligibility for 8(a) depends on personal demographic and financial characteristics of the business owner. All eligibility analysis is informational only. A formal determination requires SBA review. Consult qualified legal counsel before investing in the application.`,
      },
      {
        title: 'Eligibility Requirements',
        content: `SOCIAL DISADVANTAGE:
The owner must be a member of a socially disadvantaged group. Designated groups: Black Americans, Hispanic Americans, Native Americans, Asian-Pacific Americans, Subcontinent Asian Americans, and other individuals who can demonstrate social disadvantage on a case-by-case basis.

ECONOMIC DISADVANTAGE:
• Personal net worth: Must be less than $850,000 (excluding equity in primary residence and 401K, and excluding the value of the business)
• Personal income: Three-year average adjusted gross income must be less than $400,000 for new applicants
• Personal assets: Total value of personal assets (excluding primary residence, IRA/401K, and business) must be less than $6.5M

OWNERSHIP AND CONTROL:
• At least 51% unconditional ownership by qualifying individual(s)
• Owner must manage day-to-day operations
• Owner must hold the highest management position in the company

SMALL BUSINESS SIZE:
• Business must meet SBA small business size standards for its primary NAICS code
• For software publishers (NAICS 511210): $47.5M annual revenue limit

OPERATING HISTORY:
• Business must be in business for at least 2 years (with limited exceptions for very-established firms)

GOOD CHARACTER:
• Owner must demonstrate "good character" — no serious criminal history, no debarment, no prior 8(a) participation`,
      },
      {
        title: 'Application Checklist',
        content: `PERSONAL DOCUMENTATION (for qualifying owner)
☐ Social Security Number
☐ Government-issued photo ID (passport or driver's license)
☐ Birth certificate or naturalization certificate (proof of US citizenship)
☐ Documentation of socially disadvantaged group membership (varies by group)
☐ Resume / professional history (5+ years)
☐ Personal financial statement (SBA Form 413)
☐ Personal tax returns — most recent 3 years (Form 1040, all schedules)
☐ Bank statements — personal — most recent 6 months
☐ IRA/401K statements (for exclusion calculation)
☐ Home appraisal or purchase price (for primary residence exclusion)
☐ Personal credit authorization (SBA Form 912)

BUSINESS DOCUMENTATION
☐ Articles of Organization or Incorporation (state-certified)
☐ Operating Agreement or Bylaws (showing 51%+ qualifying ownership)
☐ EIN Verification Letter (IRS CP-575)
☐ Business federal tax returns — most recent 3 years
☐ Business bank statements — most recent 6 months
☐ YTD financial statements (P&L, balance sheet)
☐ Copy of all business licenses
☐ SBA Form 1010 (8(a) application form)
☐ Business narrative (describing operations, industry, history, and business development goals)
☐ List of contracts and revenues by year for past 3 years

NAICS CODE DOCUMENTATION
☐ Primary NAICS code selection and justification
☐ Employee count and payroll documentation (for size determination)

NOTE: SBA 8(a) applications are complex and failure rates are high without experienced counsel. Attorney and CPA review strongly recommended.`,
      },
      {
        title: 'SZL Eligibility Notes',
        content: `IMPORTANT DISCLAIMER: The following analysis is for planning purposes only. It is not a legal opinion. SBA 8(a) eligibility determination is made by the SBA, not by the applicant. Consult qualified legal counsel (8(a) experienced attorney) before investing in the application process.

SOCIAL DISADVANTAGE: Whether Stephen Lutar qualifies as a member of a socially disadvantaged group requires formal review with a qualified attorney based on his specific background, demographic characteristics, and the applicable SBA definitions. This is the threshold eligibility question and must be answered first.

ECONOMIC DISADVANTAGE: All personal financial information must be reviewed against the specific SBA thresholds. Key analysis: personal net worth, income, and assets against the limits stated above.

BUSINESS AGE: If SZL Holdings was established less than 2 years before application, the exception documentation will be required. Planning note: apply after 2-year business anniversary for simpler application.

NEXT STEPS:
1. Consult with an 8(a)-specialized attorney (many offer free initial consultations)
2. Gather 3 years of personal tax returns for initial analysis
3. Prepare personal financial statement (SBA Form 413)
4. Have attorney assess social disadvantage eligibility before investing in full application`,
      },
    ],
  },

  {
    id: 'wosb-guide',
    title: 'WOSB / EDWOSB Certification — Eligibility & Path',
    lane: 'SZL Holdings',
    channel: 'federal',
    type: 'guide',
    description: 'Women-Owned Small Business eligibility and certification paths.',
    status: 'draft',
    sections: [
      {
        title: 'Program Overview',
        content: `The Women-Owned Small Business (WOSB) Federal Contract Program provides contracting preferences for women-owned small businesses on certain federal contracts. The Economically Disadvantaged Women-Owned Small Business (EDWOSB) designation provides additional preference for businesses meeting economic disadvantage criteria.

CERTIFICATION TYPES:
• WOSB: 51%+ owned by women who are US citizens, with women controlling management and operations
• EDWOSB: WOSB + economic disadvantage criteria (similar to 8(a) income/asset limits)

SET-ASIDE ACCESS:
• WOSB set-asides available in industries where women are underrepresented
• EDWOSB set-asides available in all WOSB-eligible industries
• Sole-source contracts up to $4M (WOSB) and $4M (EDWOSB)

CERTIFICATION PATHS:
1. SBA certification (certify.sba.gov) — now the standard path
2. Third-party certifier (WBENC, El Paso Hispanic Chamber, US Women's Chamber of Commerce)
3. Note: Self-certification no longer accepted

ELIGIBILITY NOTE: SZL Holdings is 100% owned by Stephen Lutar. WOSB certification requires 51%+ ownership by qualifying women. This certification path is not applicable unless ownership structure changes.

PLANNING NOTE: If SZL Holdings ownership structure changes in the future (e.g., a woman co-founder or investor acquires 51%+), WOSB certification should be re-evaluated at that time.`,
      },
    ],
  },

  {
    id: 'sbir-sttr-guide',
    title: 'SBIR / STTR Grant Readiness Guide',
    lane: 'SZL Holdings',
    channel: 'federal',
    type: 'guide',
    description:
      'SBIR/STTR agency alignment by product lane with specific solicitation categories.',
    status: 'ready',
    printable: true,
    sections: [
      {
        title: 'Program Overview',
        content: `The Small Business Innovation Research (SBIR) and Small Business Technology Transfer (STTR) programs are the largest federal grant programs for small technology companies. Combined, they provide $3B+ per year to small businesses developing innovative technology solutions for federal agencies.

SBIR PHASES:
Phase I: $275K–$305K | 6–12 months | Feasibility and proof of concept
Phase II: $1M–$2M | 24 months | Full R&D and prototype development
Phase III: No set-aside funding | Commercialization (federal contracts, private investment)

STTR: Similar to SBIR but requires partnership with a research institution (university or federal lab). Generally higher Phase II awards.

ELIGIBILITY:
• For-profit US company, majority US-owned
• Primary employer: under 500 employees
• US-based operations
• PI (Principal Investigator) must be employed by the company at time of award

ANNUAL SOLICITATION CYCLE:
Most agencies release solicitations 2–4 times per year. NSF releases continuously. Key dates vary by agency — must monitor agency websites.

NYSTAR SBRA ASSISTANCE: NY State provides free SBIR application assistance through NYSTAR's SBRA program. Highly recommended for first-time applicants.`,
      },
      {
        title: 'KORA — NSF SBIR Alignment',
        content: `TARGET AGENCY: National Science Foundation (NSF)
SBIR PROGRAM OFFICE: NSF SBIR/STTR America's Seed Fund

RELEVANT TOPIC AREAS:
• Phase I Topic: "Future of Work at the Human-Technology Frontier" — governed workflow intelligence, human-centered process monitoring
• Phase I Topic: "Intelligent Systems" — ML-powered business process optimization and anomaly detection
• Phase I Topic: "Enterprise Software and Information Systems" — Business observability platforms for SMB market

WHY NSF:
NSF funds fundamental technology innovation. KORA's governed operational intelligence layer — the algorithm that identifies approval bottlenecks from organizational signal data — qualifies as "fundamental R&D" in applied AI/ML for organizational systems.

PHASE I PITCH (NSF format):
Technical Innovation: Counsel-based ML model that learns organizational approval patterns and predicts bottleneck risk before failures occur. Current state of the art cannot do this without large proprietary training datasets. KORA's approach uses federated learning across anonymized organizational signal data.

Commercial Potential: 500K+ US companies in the target market (50–500 employees, ops-intensive). $12B+ TAM with no dominant solution at the SMB-mid-market layer.

SBIR R&D ACTIVITIES THAT QUALIFY:
• Developing the federated ML model for approval latency prediction
• Building the organizational signal normalization layer in Counsel
• Validating the model against diverse organizational types
• Developing privacy-preserving anonymization for cross-organizational learning

PHASE I BUDGET STRUCTURE (sample):
• Personnel (PI + research associate): $180,000
• Subcontractor (university ML research partner if STTR): $50,000
• Equipment and computing: $20,000
• Travel and dissemination: $5,000
• Indirect costs (negotiated rate): $50,000
Total: ~$275,000`,
      },
      {
        title: 'SEXTANT — DoD and DHS/MARAD SBIR Alignment',
        content: `TARGET AGENCIES:
• DoD SBIR (Naval/Maritime topics)
• DHS Science & Technology Directorate
• DOT/MARAD (via SBIR coordination)

DOD RELEVANT TOPICS:
• Navy SBIR: "Maritime Domain Awareness Technologies" — Commercial vessel tracking and intelligence for defense logistics planning
• Navy SBIR: "Autonomous Logistics Systems" — governed maritime logistics coordination
• DARPA: "Maritime Intelligence Systems" — Advanced commercial vessel behavior analysis

DHS RELEVANT TOPICS:
• DHS S&T: "Port Security Intelligence" — Real-time vessel risk scoring for port access control
• DHS S&T: "Supply Chain Security Technologies" — Maritime cargo visibility and provenance tracking
• CISA: "Critical Infrastructure Protection" — Maritime infrastructure security monitoring

DOT/MARAD RELEVANT TOPICS:
• MARAD: "Maritime Digital Twin Technologies" — SEXTANT' data integration layer creates foundation for maritime digital twin
• MARAD: "US-Flag Vessel Support Tools" — SEXTANT platform can add US-flag tracking features for MARAD-specific deployment

WHY NOW FOR GOVERNMENT:
The global shipping disruptions of 2020–2024 made maritime domain awareness a national security priority. MARAD, DoD, and DHS have increased technology spending on commercial maritime intelligence. SBIR Phase I awards in this space are being made regularly.

PHASE I PITCH (DoD format):
Technical Innovation: SEXTANT' multi-source maritime intelligence fusion engine — combining AIS, satellite imagery, port call data, and vessel specification data into a unified risk-scored intelligence feed. DoD need: identifying commercially-available vessels for defense logistics without full military-grade tracking cost.

Commercial Potential: $8B+ global maritime intelligence market. Immediate commercial customers in fleet management, maritime insurance, and port operations.`,
      },
      {
        title: 'PARAGON — DoD and DHS SBIR Alignment',
        content: `TARGET AGENCIES:
• DoD SBIR (CYBERCOM, DIA, NSA-adjacent programs)
• DHS Science & Technology Directorate (Cybersecurity Division)
• CISA (limited direct SBIR, but influence on DHS priorities)

DOD RELEVANT TOPICS:
• CYBERCOM SBIR: "Automated Cyber Defense Operations" — PARAGON SOC automation capabilities align with DoD's need for scalable defensive cyber operations
• DIA/NSA-adjacent: "Threat Intelligence Fusion" — PARAGON multi-source threat intelligence correlation
• DARPA: "AI-Powered Cyber Defense" — PARAGON ML threat detection and automated playbook execution

DHS RELEVANT TOPICS:
• DHS S&T Cybersecurity: "Critical Infrastructure Security Operations" — PARAGON SOC platform for securing critical infrastructure operators (energy, water, transportation)
• DHS S&T: "Federal Civilian Cyber Defense Tools" — PARAGON FedRAMP-aligned SOC for civilian agency deployment
• CISA-adjacent: "Zero Trust Architecture Tools" — PARAGON identity and access management layer

CISA ALIGNMENT:
While CISA does not directly run SBIR programs, PARAGON aligns with CISA's Joint Cyber Defense Collaborative (JCDC) priorities:
• Ransomware prevention and response
• Election security infrastructure
• Critical infrastructure cyber resilience

PHASE I PITCH (DHS format):
Technical Innovation: governed SOC command platform that reduces analyst-to-alert ratio by 10x through automated triage and context enrichment. Current federal SOC platforms require 5–8 analysts for 200-alert environments. PARAGON reduces to 1–2 analysts with equivalent coverage.

Commercial Potential: $35B+ global SIEM/SOAR/XDR market. Immediate commercial customers in MSP market (20,000+ US MSPs managing security for small businesses).`,
      },
      {
        title: 'SAM.gov Registration Checklist',
        content: `SAM.gov registration is the prerequisite for ALL federal contracting and federal grant applications. It must be completed before applying for SBIR grants, 8(a) certification, or any federal contract.

PRE-REGISTRATION REQUIREMENTS
☐ Obtain EIN (Employer Identification Number) from IRS — must match legal business name exactly
☐ Obtain UEI (Unique Entity Identifier) — assigned during SAM registration process
☐ Establish entity legal name and address (must match IRS records)
☐ Prepare banking information for ACH payment setup (for contract payments)
☐ DUNS Number (legacy — now replaced by UEI, but have old DUNS ready if applicable)

SAM REGISTRATION PROCESS
☐ Create login.gov account (government identity verification system)
☐ Navigate to sam.gov and begin entity registration
☐ Enter legal business information (name, address, EIN, entity type)
☐ Complete core data: address, CAGE code (assigned), NAICS codes
☐ Complete assertions: size standards, socioeconomic certifications
☐ Review and submit representations and certifications
☐ Allow 7–14 business days for processing and CAGE code assignment
☐ Annual renewal required before expiration date

NAICS CODE SELECTION FOR SZL HOLDINGS
Primary NAICS (select most applicable based on primary revenue):
• 541511 — Custom Computer Programming Services (Counsel, all platforms)
• 511210 — Software Publishers (KORA, SEXTANT, PARAGON, DOMAINE)
• 518210 — Data Processing, Hosting, and Related Services

Secondary NAICS (add all applicable):
• 541512 — Computer Systems Design Services (PARAGON, Counsel)
• 541519 — Other Computer Related Services (SEXTANT, DOMAINE)
• 541990 — All Other Professional Services (Carlota Jo)
• 561499 — All Other Business Support Services (Carlota Jo)

SOCIOECONOMIC CERTIFICATIONS (complete as applicable):
☐ Small Business certification (based on employee count and revenue)
☐ Woman-Owned Small Business (if applicable — requires 51%+ women ownership)
☐ Service-Disabled Veteran-Owned (if applicable)
☐ HUBZone (if business located in qualified HUBZone area)

ANNUAL RENEWAL
SAM registration expires annually. Lapses disqualify from all federal bidding and grant applications. Set calendar reminder 60 days before expiration.`,
      },
      {
        title: 'FedRAMP Readiness Assessment',
        content: `Federal Risk and Authorization Management Program (FedRAMP) is the federal government's authorization process for cloud services used by federal agencies. FedRAMP authorization is required for cloud products sold to federal agencies.

RELEVANCE TO SZL:
• PARAGON (cloud SOC platform) — FedRAMP required for direct federal agency sales
• SEXTANT (cloud maritime intelligence) — FedRAMP required for MARAD/Coast Guard direct contracts
• KORA (cloud observability) — FedRAMP required for federal civilian agency contracts
• DOMAINE — Less relevant (limited federal market)

IMPACT LEVELS:
• Low: Systems where the loss of confidentiality, integrity, or availability would have limited adverse effect on agency operations
• Moderate: Most federal civilian applications (90% of FedRAMP authorizations)
• High: Systems with national security implications, law enforcement, emergency services

CURRENT SZL READINESS ASSESSMENT:

AEGIS:
Current FedRAMP status: Not authorized
Target level: Moderate (MSP/enterprise SOC platform)
Gap areas: FedRAMP-specific continuous monitoring, authorized vulnerability scanning tools, specific FIPS 140-2 cryptography requirements
Timeline to Low: 12–18 months with dedicated compliance investment (~$150K–$250K)
Timeline to Moderate: 18–30 months (~$400K–$750K total investment)

VESSELS:
Target level: Low (maritime data services, no PII or national security data)
Timeline to Low: 12–18 months (~$100K–$200K)

LYTE:
Target level: Low initially, Moderate for federal HR/ops data
Timeline to Low: 12–18 months (~$100K–$200K)

RECOMMENDED STRATEGY:
Phase 1: Pursue Agency-Sponsored Provisional Authority (P-ATO) pathway
• Find a federal agency partner (via SBIR relationship) willing to sponsor FedRAMP authorization
• Agency sponsorship significantly reduces cost and time
• PARAGON SBIR Phase I → Phase II → P-ATO pathway is the most viable federal route

Phase 2: FedRAMP Ready designation
• Achieve "FedRAMP Ready" status without full authorization
• Demonstrates commitment to federal market without full cost
• Acceptable for many SBIR Phase II demonstrations

Cost reduction strategies:
• Use FedRAMP-approved infrastructure providers (AWS GovCloud, Azure Government)
• Partner with an established MSSP who has FedRAMP authority (resell through their authorization)
• Target DoD Impact Level 2 first (similar requirements, different authorization body)`,
      },
    ],
  },

  // ─── ANGEL / EQUITY PACKAGE ───────────────────────────────────────────────

  {
    id: 'angel-narrative-memo',
    title: 'Angel Investor Narrative Memo — The Why Now Story',
    lane: 'SZL Holdings',
    channel: 'angel',
    type: 'narrative',
    description:
      "Investor narrative memo: the 'why now' story, platform company thesis, commercial wedge strategy.",
    status: 'ready',
    printable: true,
    sections: [
      {
        title: 'The Why Now',
        content: `We are at an unusual moment in the history of software. For three decades, software was built for function. You had a problem (track inventory, send email, manage projects) and you bought a tool that solved it. The tool proliferated. More tools were added. Now the average mid-size organization runs 150+ SaaS applications.

The problem isn't too few tools. It's too many. And they don't talk to each other. And they require humans to translate between them. And those humans are the bottleneck in every process that matters.

What's happening now is a fundamental shift: the best software companies aren't building tools. They're building systems — interconnected operational infrastructure that eliminates the human translation layer and makes entire organizations legible in real time.

This is the SZL thesis. Not because it's intellectually interesting (though it is), but because the market is at a specific inflection point:

1. AI has made system-level software commercially viable at scales previously unavailable. The infrastructure that previously required 50 engineers to build can now be built by a disciplined team with AI assistance.

2. Remote work has revealed how invisible most organizational operations are. The operational visibility that came naturally from physical co-location is gone. Organizations are now paying the cost of 4 years of invisible process debt — and they're looking for tools to get visibility back.

3. Government and enterprise are actively funding domain-specific intelligence platforms. SBIR, DoD contracts, DHS grants — the government is funding maritime intelligence, cybersecurity automation, and operational AI. The timing of SZL's platform development matches the timing of federal funding availability.

4. The vertical SaaS market is experiencing a second wave. After the first wave of vertical SaaS (construction, healthcare, retail), a second wave is forming around intelligence-layered verticals — platforms that don't just manage data but derive and act on intelligence from it. SEXTANT, PARAGON, and DOMAINE are second-wave plays.

We built the platform engine first (Counsel). Now we're deploying it across five verticals simultaneously, with each deployment funding the next.`,
      },
      {
        title: 'The Commercial Wedge Strategy',
        content: `SZL is not a single-product company pretending to be a platform. It is genuinely a platform company that happens to have five products.

The wedge architecture works like this:

Counsel = THE ENGINE
Counsel is the shared intelligence and automation backbone. It handles workflow orchestration, AI processing, signal collection, document generation, and API connectivity. It is not sold externally. It is the infrastructure that makes every platform faster to build and more valuable to customers.

Why this matters for investors: A single-product company with $1M in ARR has one moat. SZL with $1M in ARR across six platforms has six moats — and each moat feeds the engine that strengthens all others. This is structurally different from a portfolio of unrelated businesses.

KORA = THE HORIZONTAL WEDGE
KORA's horizontal position — applicable to any organization with operational complexity — establishes SZL in the mid-market SaaS tier. Success with KORA proves the engine works across diverse customers and validates the observability thesis in the market where it's easiest to test.

SEXTANT = THE VERTICAL WEDGE
SEXTANT' maritime focus creates a deep technical moat in a specific domain. Deep verticals are hard to replicate. Once a fleet operator has integrated SEXTANT into their operations, switching is expensive (data history, operational workflow integration, personnel training). SEXTANT also opens the government channel — MARAD, DoD, DHS are all maritime domain awareness buyers.

PARAGON = THE GOVERNMENT WEDGE
PARAGON is the platform designed to open federal government revenue. Government cybersecurity contracts are large (>$1M ACV), long (5+ years), and sticky (switching costs measured in years). PARAGON, positioned with 8(a) or WOSB set-aside access, creates a government revenue stream that is structurally different from commercial SaaS. This is the highest-multiple acquisition or partnership target in the portfolio.

DOMAINE = THE GEOGRAPHIC WEDGE
DOMAINE establishes SZL in the NYC real estate market — the deepest, most data-rich property market in the US. Geographic focus creates data density that makes the platform increasingly valuable as coverage deepens. NYC success validates the model for expansion to other high-distress, high-data markets.`,
      },
      {
        title: 'Traction & Roadmap Narrative',
        content: `WHAT'S BUILT:
The SZL portfolio was built in reverse order from most companies: we built the infrastructure first, then the products. The Counsel backbone — workflow orchestration, AI intelligence, signal processing, document automation — was designed and built before the first product was deployed. This is why six production platforms can exist with one founding team.

What's live and operational:
• Counsel: Full workflow orchestration, automation engine, connector mesh, document system
• KORA: Business observability layer, process monitoring, workflow analytics
• SEXTANT: AIS data integration, maritime intelligence layer, fleet tracking
• PARAGON: SOC command platform, XDR correlation, managed operations layer
• DOMAINE: Distress data pipeline, ownership intelligence, broker workflow tools
• Carlota Jo: Active advisory practice with client relationships

Capital infrastructure (what you're looking at right now): Bank-ready business plan, investor materials, NY state program applications, federal program eligibility analysis, SAM.gov registration — all built and operational.

WHAT'S NEXT (90-Day Milestones):
□ KORA: First paying customer ($5K MRR), pilot program for 5 accounts
□ SEXTANT: First fleet operator pilot agreement signed
□ PARAGON: First MSP partner letter of intent signed
□ SAM.gov: Registration completed
□ MWBE: Application submitted (if eligible)
□ SBIR: Phase I proposal submitted to NSF (KORA) or DHS (PARAGON)

WHAT'S NEXT (12-Month Milestones):
□ $300K+ ARR across all platforms
□ First government contract awarded (SBIR Phase I or 8(a) sole-source)
□ MWBE certification received (if eligible)
□ Series A trigger metrics in view ($600K+ ARR, government contract in hand)`,
      },
      {
        title: 'Milestone-Based Raise Plan',
        content: `SZL is pursuing capital in tranches aligned with value milestones — not raising to survive, but raising to unlock.

PRE-SEED TRANCHE (Current)
Target: $500K–$1M
Structure: SAFE or convertible note (preferred) OR SBA/bank loan (preferred for non-dilutive)
Milestones funded:
• First paying customers across 3+ platforms ($50K MRR)
• SAM.gov registration and first federal program applications
• Sales hire #1 onboarded and ramping
• Operating model validated (unit economics visible)

Trigger for next round: $25K+ MRR validated on KORA or SEXTANT

SEED TRANCHE (12–18 Months)
Target: $2M–$4M
Structure: Priced equity round (SAFE conversion + new investment)
Milestones funded:
• Enterprise sales motion (2+ AEs hired)
• Government BD hire (SBIR, 8(a), procurement)
• Platform scaling infrastructure
• First government contract in hand or imminent
Trigger for next round: $600K+ ARR, government contract award, clear path to $3M ARR

SERIES A (24–36 Months)
Target: $8M–$15M
Use: Geographic expansion (SEXTANT: international markets), PARAGON federal scale, KORA enterprise tier
Trigger: $3M+ ARR, $1M+ government revenue, 2+ validated enterprise verticals`,
      },
      {
        title: 'Use of Proceeds — Investor Round',
        content: `$500K ANGEL ROUND DEPLOYMENT (illustrative)

Engineering (40% / $200,000):
• KORA revenue feature completion: $60,000
• SEXTANT enterprise tier: $50,000
• PARAGON MSSP multi-tenant layer: $45,000
• DOMAINE broker workflow: $30,000
• Shared infrastructure and security: $15,000

Sales & GTM (30% / $150,000):
• Sales hire #1 (6-month ramp): $70,000
• Outbound tooling and CRM: $15,000
• Content and thought leadership: $20,000
• Events and customer acquisition: $25,000
• Federal market access prep: $20,000

Operations (20% / $100,000):
• Legal (entity structure, IP, employment): $40,000
• Accounting and bookkeeping: $20,000
• Cloud infrastructure: $30,000
• Administrative: $10,000

Reserve (10% / $50,000):
• Operating buffer — 90 days expenses if revenue delayed

EXPECTED MILESTONES FROM THIS DEPLOYMENT:
Month 3: First Carlota Jo retainer client ($12.5K MRR)
Month 6: 3 KORA paying customers ($12K MRR), 1 SEXTANT pilot ($5K MRR)
Month 9: $50K MRR total, SAM.gov registered, SBIR Phase I submitted
Month 12: $75K MRR total, government program in hand or awarded
Series A: Initiated at $600K ARR with government contract in view

ROI CASE FOR ANGEL INVESTORS:
At Series A ($8M raise at $24M pre-money): $500K angel at $4M pre-money → 12.5% ownership → 12.5% × $24M = $3M value → 6x return
At acquisition ($50M at 5x ARR on $10M ARR): Same position → $6.25M → 12.5x return

Note: All return projections are illustrative only. Actual returns cannot be guaranteed.`,
      },
    ],
  },
];

export function getDocumentsByChannel(channel: CapitalDocument['channel']): CapitalDocument[] {
  return CAPITAL_DOCUMENTS.filter((d) => d.channel === channel);
}

export function getDocumentById(id: string): CapitalDocument | undefined {
  return CAPITAL_DOCUMENTS.find((d) => d.id === id);
}

export function getDocumentsByLane(lane: string): CapitalDocument[] {
  return CAPITAL_DOCUMENTS.filter((d) => d.lane === lane);
}

export const CHANNEL_LABELS: Record<CapitalDocument['channel'], string> = {
  investor: 'Investor Materials',
  bank: 'Bank / SBA Package',
  angel: 'Angel / Equity Package',
  ny_state: 'NY State Programs',
  federal: 'Federal Programs',
};

export const CHANNEL_COLORS: Record<CapitalDocument['channel'], string> = {
  investor: '#3b82f6',
  bank: '#10b981',
  angel: '#f59e0b',
  ny_state: '#6366f1',
  federal: '#ef4444',
};
