export interface UseCase {
  title: string;
  prompt: string;
  proof: string;
}

export interface IndustrySolution {
  id: string;
  icon: string;
  name: string;
  tagline: string;
  desc: string;
  models: string[];
  useCases: UseCase[];
  loopExample: {
    signal: string;
    context: string;
    recommendation: string;
    simulation: string;
    policy: string;
    execution: string;
    proof: string;
    outcome: string;
    learning: string;
  };
  stats: { label: string; value: string }[];
}

export const INDUSTRY_SOLUTIONS: IndustrySolution[] = [
  {
    id: 'finance',
    icon: '💰',
    name: 'Finance & Capital Markets',
    tagline: 'Governed financial intelligence with auditable proof on every decision.',
    desc: 'Beyond basic budgeting and statement summaries — a11oy governs the entire financial decision lifecycle. Analyze statements, model risk, simulate portfolio scenarios, enforce compliance policies, and record every conclusion in an immutable proof chain. Regulators get full attribution. Auditors get complete lineage.',
    models: ['GPT-5.1', 'o3', 'DeepSeek-V4-Pro', 'Qwen3.6-35B'],
    useCases: [
      { title: 'Governed Financial Statement Analysis', prompt: 'Analyze Q2 10-K filing — extract revenue trends, margin shifts, cash flow anomalies. Compare against 4 prior quarters. Flag material changes exceeding 15% variance.', proof: 'Every extraction recorded with model, confidence, source page, and analyst attestation in the Proof Chain.' },
      { title: 'Risk-Scored Portfolio Rebalancing', prompt: 'Run Monte Carlo simulation on current portfolio allocation. Model 10,000 scenarios across rate hike, recession, and inflation shock conditions. Recommend rebalancing with risk-adjusted Sharpe optimization.', proof: 'Simulation parameters, model versions, and recommended trades recorded with full policy-gate approval chain.' },
      { title: 'Compliance-Gated Earnings Summarization', prompt: 'Summarize earnings call transcript. Extract forward-looking statements, risk factors, and guidance changes. Flag any statements requiring Reg FD review before distribution.', proof: 'Each extracted statement traced to transcript timestamp, model attribution, and compliance gate decision.' },
      { title: 'Multi-Fund Cash Flow Forecasting', prompt: 'Forecast 90-day cash flows across 12 fund vehicles. Incorporate capital calls, distribution schedules, NAV adjustments, and FX exposure. Surface liquidity gaps exceeding 5% threshold.', proof: 'Forecast model, input data sources, assumption parameters, and liquidity alerts logged with full provenance.' },
      { title: 'Subscription & Spend Intelligence', prompt: 'Ingest 6 months of corporate card transactions. Identify duplicate SaaS subscriptions, vendor overlap, and spending anomalies. Recommend consolidation saving at least 15% of current spend.', proof: 'Every vendor match, duplicate detection, and savings estimate recorded with data lineage and model confidence.' },
      { title: 'Regulatory Filing Automation', prompt: 'Generate SEC Form 10-Q draft from structured financial data. Ensure XBRL tagging compliance, cross-reference prior filings for consistency, and flag disclosure gaps.', proof: 'Filing draft, XBRL tags, cross-reference checks, and disclosure gap analysis recorded with full audit trail.' },
    ],
    loopExample: {
      signal: 'Revenue anomaly detected: Q2 SaaS bookings down 23% vs. forecast',
      context: 'Enriched with churn data, pipeline velocity, macro indicators, competitor earnings',
      recommendation: 'Three remediation paths scored: pricing adjustment, expansion push, cost restructure',
      simulation: 'Monte Carlo: 10K scenarios modeling each path over 4 quarters',
      policy: 'CFO approval required for any path exceeding $2M spend commitment',
      execution: 'Selected path deployed through governed workflow with checkpoint recovery',
      proof: 'Decision recorded: model=o3, confidence=0.87, approver=CFO, timestamp, full data lineage',
      outcome: 'Q3 bookings recovered to 94% of original forecast. Revenue gap closed by $4.1M',
      learning: 'Model recalibrated: pricing sensitivity weight increased 18% for future forecasts',
    },
    stats: [
      { label: 'Audit Trail Depth', value: '9 layers' },
      { label: 'Filing Accuracy', value: '99.7%' },
      { label: 'Risk Models', value: '14 active' },
      { label: 'Compliance Gates', value: '23 policies' },
    ],
  },
  {
    id: 'science',
    icon: '🧬',
    name: 'Science & Medicine',
    tagline: 'Governed research intelligence with reproducible, citable proof chains.',
    desc: 'Not just brainstorming research questions — a11oy governs the full scientific workflow. Literature synthesis with provenance, hypothesis generation with confidence scoring, clinical trial protocol design with regulatory gates, and drug candidate analysis with reproducible model attribution. Every conclusion is citable.',
    models: ['GPT-5.1', 'Claude 4 Opus', 'Gemma-4-31B', 'KIMI-K2.5'],
    useCases: [
      { title: 'Governed Literature Synthesis', prompt: 'Synthesize all published research on CRISPR-Cas13 therapeutic applications since 2022. Weight by journal impact factor and citation count. Identify consensus findings vs. contested claims with confidence intervals.', proof: 'Every cited paper, extraction method, weighting formula, and synthesis conclusion recorded with full model attribution.' },
      { title: 'Clinical Trial Protocol Design', prompt: 'Design Phase 2b trial protocol for novel GLP-1/GIP dual agonist. Include adaptive design parameters, interim analysis rules, safety stopping boundaries, and regulatory submission requirements for FDA and EMA.', proof: 'Protocol parameters, regulatory requirements, statistical design choices, and model recommendations logged with version control.' },
      { title: 'Gene Candidate Discovery Pipeline', prompt: 'Identify top 20 gene candidates for early-onset Alzheimer\'s. Cross-reference GWAS data, expression profiles, protein interaction networks, and druggability scores. Rank by therapeutic potential.', proof: 'Data sources, scoring methodology, cross-reference validation, and ranking algorithm recorded with reproducible parameters.' },
      { title: 'Drug Interaction Risk Modeling', prompt: 'Model polypharmacy interactions for a patient on 8 concurrent medications. Identify CYP450 pathway conflicts, QT prolongation risks, and contraindicated combinations. Generate clinical decision support alert hierarchy.', proof: 'Interaction database versions, risk scoring model, clinical evidence levels, and alert priority logic recorded with provenance.' },
      { title: 'Research Hypothesis Generation', prompt: 'Given recent findings on gut microbiome-brain axis signaling, generate 5 novel testable hypotheses with experimental design sketches. Score each by feasibility, novelty, and potential impact.', proof: 'Source literature, reasoning chain, scoring methodology, and experimental design parameters logged with model version.' },
      { title: 'Medical Imaging Analysis Pipeline', prompt: 'Analyze batch of 500 chest CT scans for pulmonary nodule detection. Apply multi-model ensemble with confidence thresholds. Flag cases exceeding Lung-RADS 3 for radiologist review.', proof: 'Model ensemble composition, per-scan confidence scores, flagging thresholds, and radiologist review queue recorded with timestamps.' },
    ],
    loopExample: {
      signal: 'New GWAS study identifies 3 novel loci associated with treatment-resistant depression',
      context: 'Cross-referenced with existing pharmacogenomic data, expression atlases, and 47 related publications',
      recommendation: 'Two gene targets prioritized for functional validation based on druggability and expression profile',
      simulation: 'Molecular dynamics simulation of protein-ligand binding for top 2 candidates',
      policy: 'IRB approval required before any patient data analysis. PI sign-off on target selection',
      execution: 'Automated literature monitoring activated. Wet lab collaboration request generated',
      proof: 'Target selection: models=[GPT-5.1, Gemma-4-31B], data_sources=12, confidence=0.82, PI=Dr. Chen',
      outcome: 'Lead candidate validated in cell-based assay. IC50 = 2.3nM. Manuscript submitted to Nature Medicine',
      learning: 'Druggability scoring weight adjusted: binding site accessibility increased 22% in future rankings',
    },
    stats: [
      { label: 'Literature Sources', value: '12M+' },
      { label: 'Reproducibility', value: '100%' },
      { label: 'Clinical Protocols', value: '47 active' },
      { label: 'Regulatory Gates', value: '18 policies' },
    ],
  },
  {
    id: 'engineering',
    icon: '⚙️',
    name: 'Engineering & Software',
    tagline: 'Governed development intelligence — beyond Codex, beyond copilots.',
    desc: 'Not just delegating tasks to a coding agent — a11oy governs the entire software engineering lifecycle. Code generation with security scanning, deployment with policy gates, infrastructure changes with blast-radius analysis, and incident response with full attribution. Every commit, every deploy, every rollback is proof-chained.',
    models: ['GPT-5.1', 'o4-mini', 'Qwen2.5-Coder', 'DeepSeek-V4-Pro'],
    useCases: [
      { title: 'Governed Code Generation & Review', prompt: 'Generate TypeScript service for order processing. Include input validation, error handling, rate limiting, and comprehensive test coverage. Run SAST scan before approval. Enforce team code style.', proof: 'Generated code, SAST results, test coverage metrics, style conformance, and reviewer approval recorded in Proof Chain.' },
      { title: 'Blast-Radius Deployment Analysis', prompt: 'Analyze proposed database migration affecting 3 microservices. Model blast radius: downstream API contracts, cache invalidation, message queue consumers. Generate rollback plan with checkpoint recovery.', proof: 'Affected services, API contract changes, migration plan, rollback script, and deployment approval chain recorded.' },
      { title: 'Cross-Language Code Translation', prompt: 'Translate Python ML inference pipeline to Rust for production deployment. Preserve numerical accuracy to 6 decimal places. Include benchmarking suite comparing Python baseline vs. Rust output.', proof: 'Source code, translation methodology, accuracy validation results, and performance benchmarks logged with model attribution.' },
      { title: 'Incident Response Orchestration', prompt: 'P1 incident: API latency spike affecting 12% of requests. Diagnose root cause from distributed traces, logs, and metrics. Generate remediation plan with rollback triggers and stakeholder notifications.', proof: 'Diagnostic data sources, root cause analysis, remediation steps, notification recipients, and resolution timeline recorded.' },
      { title: 'Infrastructure Cost Optimization', prompt: 'Analyze 90 days of cloud infrastructure usage across 340 resources. Identify right-sizing opportunities, reserved instance candidates, and unused resources. Model savings against performance impact.', proof: 'Usage data, optimization recommendations, savings projections, and performance impact analysis recorded with data lineage.' },
      { title: 'Security Vulnerability Remediation', prompt: 'Triage 47 CVEs from latest dependency scan. Prioritize by CVSS score, exploit availability, and blast radius. Generate fix PRs for critical/high issues with automated test validation.', proof: 'CVE analysis, prioritization methodology, fix PRs, test results, and remediation timeline recorded with full attribution.' },
    ],
    loopExample: {
      signal: 'Dependency scan: CVE-2026-4521 (CVSS 9.8) in authentication library used by 7 services',
      context: 'Enriched with exploit intelligence, affected service map, traffic patterns, and patch availability',
      recommendation: 'Emergency patch recommended for 3 internet-facing services. Scheduled patch for 4 internal services',
      simulation: 'Canary deployment simulation: patch applied to staging, load tested at 2x production traffic',
      policy: 'Security team approval required. Change window enforced. Rollback trigger: error rate > 0.1%',
      execution: 'Rolling deployment across 3 services with health checks. Automated rollback armed',
      proof: 'Patch applied: CVE=CVE-2026-4521, services=7, model=o4-mini, approver=CISO, deploy_time=47s',
      outcome: 'All 7 services patched. Zero downtime. Error rate unchanged. MTTR: 2h 14m',
      learning: 'Dependency monitoring frequency increased from weekly to daily for auth-critical libraries',
    },
    stats: [
      { label: 'Deploy Gates', value: '31 policies' },
      { label: 'Uptime SLA', value: '99.99%' },
      { label: 'MTTR Reduction', value: '73%' },
      { label: 'Code Coverage', value: '94%' },
    ],
  },
  {
    id: 'legal',
    icon: '⚖️',
    name: 'Legal & Compliance',
    tagline: 'Governed legal intelligence with chain-of-custody on every analysis.',
    desc: 'Beyond basic contract review — a11oy governs the full legal matter lifecycle. Obligation tracking with deadline enforcement, risk scoring with precedent analysis, document intelligence with citation verification, and regulatory monitoring with compliance attestation. Every legal conclusion carries a provenance envelope.',
    models: ['Claude 4 Opus', 'GPT-5.1', 'KIMI-K2.5', 'Gemma-4-31B'],
    useCases: [
      { title: 'Governed Contract Analysis', prompt: 'Review 340-page acquisition agreement. Extract all representations, warranties, indemnification clauses, and closing conditions. Flag non-standard terms against our playbook. Score risk by clause category.', proof: 'Every extracted clause, risk score, playbook comparison, and flagged deviation recorded with page reference and model confidence.' },
      { title: 'Regulatory Change Monitoring', prompt: 'Monitor SEC, FINRA, OCC, and CFPB for rule changes affecting our derivatives trading operations. Assess impact on existing compliance controls. Generate gap analysis with remediation timeline.', proof: 'Rule changes, impact assessment, gap analysis, and remediation recommendations logged with regulatory source and timestamp.' },
      { title: 'Litigation Risk Scoring', prompt: 'Analyze pending litigation portfolio of 23 active matters. Score settlement probability, damages exposure, and timeline risk. Cross-reference with similar cases from CourtListener database.', proof: 'Case analysis, risk scores, precedent citations, and probability models recorded with full methodology and data sources.' },
      { title: 'Obligation Management Pipeline', prompt: 'Extract all contractual obligations from 180 active vendor agreements. Track deadlines, notification requirements, renewal triggers, and termination conditions. Alert on obligations due within 90 days.', proof: 'Extracted obligations, deadline tracking, alert rules, and compliance status logged with contract reference and extraction confidence.' },
      { title: 'Privilege Review Automation', prompt: 'Review 50,000 documents for attorney-client privilege. Apply multi-model classification with confidence thresholds. Route borderline documents (0.4-0.7 confidence) to human review queue.', proof: 'Classification results, confidence distributions, human review assignments, and privilege log entries recorded with model ensemble composition.' },
      { title: 'IP Portfolio Intelligence', prompt: 'Analyze patent portfolio of 340 active patents. Identify expiring protections, potential infringement risks, licensing opportunities, and white space for new filings. Map competitive landscape.', proof: 'Portfolio analysis, expiration timeline, competitive mapping, and strategic recommendations logged with data sources and model attribution.' },
    ],
    loopExample: {
      signal: 'New CFPB rule proposal affecting consumer lending disclosure requirements detected',
      context: 'Cross-referenced with current compliance controls, existing disclosures, and 12 impacted products',
      recommendation: 'Three disclosure templates require modification. Two new controls needed. Estimated 6-week implementation',
      simulation: 'Impact modeled: cost of compliance vs. risk of non-compliance across product lines',
      policy: 'General Counsel approval required. Compliance Committee notification. Board briefing if cost exceeds $500K',
      execution: 'Disclosure updates drafted. Control modifications specified. Implementation timeline created',
      proof: 'Rule=CFPB-2026-0847, products=12, model=Claude-4-Opus, approver=GC, cost=$340K, timeline=6wk',
      outcome: 'All disclosures updated 3 weeks ahead of effective date. Zero regulatory findings in next exam',
      learning: 'Regulatory monitoring scope expanded to include proposed rules 6 months before comment period close',
    },
    stats: [
      { label: 'Active Matters', value: '23 tracked' },
      { label: 'Obligations', value: '2,400+' },
      { label: 'Compliance Rate', value: '99.8%' },
      { label: 'Privilege Accuracy', value: '97.3%' },
    ],
  },
  {
    id: 'maritime',
    icon: '🚢',
    name: 'Maritime & Logistics',
    tagline: 'Governed fleet intelligence with real-time position tracking and compliance proof.',
    desc: 'Not basic vessel tracking — a11oy governs the entire maritime operations lifecycle. AIS position intelligence with anomaly detection, voyage economics with fuel optimization, sanctions screening with compliance attestation, and port operations with schedule optimization. Every vessel decision is proof-chained.',
    models: ['GPT-4.1', 'DeepSeek-V4-Pro', 'Llama 3.3-70B', 'o4-mini'],
    useCases: [
      { title: 'Vessel Anomaly Detection', prompt: 'Monitor AIS feeds for 340 vessels. Detect dark periods (transponder off > 4 hours), deviation from planned routes exceeding 50nm, unusual speed changes, and port calls at sanctioned locations.', proof: 'AIS data ingestion timestamps, anomaly detection parameters, flagged events, and investigation outcomes recorded with full provenance.' },
      { title: 'Voyage Economics Optimization', prompt: 'Optimize voyage plan for VLCC carrying 2M barrels crude. Model fuel consumption curves, weather routing, canal transit timing, and demurrage exposure. Minimize total voyage cost within charter party constraints.', proof: 'Routing parameters, fuel models, weather data sources, cost optimization results, and charter party compliance recorded.' },
      { title: 'Sanctions Compliance Screening', prompt: 'Screen 47 counterparties against OFAC SDN, EU Consolidated List, UK Sanctions, and UN Security Council lists. Include beneficial ownership analysis and vessel flag state risk scoring.', proof: 'Screening results, list versions, match details, false positive resolution, and compliance officer attestation recorded.' },
      { title: 'Port Operations Intelligence', prompt: 'Forecast port congestion at top 20 destination ports using historical AIS data, weather forecasts, and seasonal patterns. Recommend optimal arrival windows to minimize anchorage waiting time.', proof: 'Forecast models, input data sources, congestion predictions, and arrival window recommendations logged with accuracy metrics.' },
      { title: 'Cargo Risk Assessment', prompt: 'Assess cargo risk for mixed dangerous goods shipment. Verify IMDG code compliance, segregation requirements, stowage constraints, and insurance coverage adequacy.', proof: 'IMDG compliance checks, segregation analysis, stowage verification, and insurance adequacy assessment recorded with regulation references.' },
      { title: 'Fleet Performance Benchmarking', prompt: 'Benchmark fleet of 45 vessels against industry KPIs: fuel efficiency (EEOI), utilization rate, maintenance cost per DWT, and port turnaround time. Identify bottom quartile performers for optimization.', proof: 'KPI calculations, benchmark data sources, performance rankings, and optimization recommendations logged with methodology.' },
    ],
    loopExample: {
      signal: 'AIS dark period detected: tanker ATLANTIC VOYAGER transponder off for 6.2 hours in Gulf of Aden',
      context: 'Cross-referenced with piracy risk zones, sanctions lists, weather conditions, and vessel history',
      recommendation: 'High-risk event: vessel operating in piracy corridor. Initiate enhanced monitoring and flag state notification',
      simulation: 'Three scenarios modeled: equipment failure (30%), deliberate concealment (45%), STS transfer (25%)',
      policy: 'Compliance officer review required within 2 hours. Sanctions team notification if STS suspected',
      execution: 'Enhanced monitoring activated. Flag state notified. Compliance review initiated. Insurance underwriter alerted',
      proof: 'Event=AIS_DARK, vessel=IMO-9234567, duration=6.2h, model=GPT-4.1, reviewer=Compliance, risk=HIGH',
      outcome: 'Equipment failure confirmed after vessel resumed broadcasting. No sanctions violation. Case closed',
      learning: 'AIS dark period threshold adjusted from 8h to 4h for Gulf of Aden zone based on incident frequency',
    },
    stats: [
      { label: 'Vessels Tracked', value: '340 live' },
      { label: 'Sanctions Screens', value: '12K/mo' },
      { label: 'Route Savings', value: '$2.1M/yr' },
      { label: 'Compliance Rate', value: '100%' },
    ],
  },
  {
    id: 'realestate',
    icon: '🏗️',
    name: 'Real Estate & Infrastructure',
    tagline: 'Governed portfolio intelligence with climate risk modeling and deal analytics.',
    desc: 'Beyond property listings and basic valuations — a11oy governs the full real estate investment lifecycle. Portfolio analytics with climate risk overlays, deal pipeline with underwriting automation, tenant intelligence with churn prediction, and construction monitoring with milestone tracking. Every valuation carries a provenance envelope.',
    models: ['GPT-5.1', 'DeepSeek-V4-Pro', 'Llama 3.3-70B', 'Qwen3.6-35B'],
    useCases: [
      { title: 'Climate-Adjusted Portfolio Valuation', prompt: 'Revalue 280-property portfolio with TCFD-aligned climate risk overlays. Model physical risks (flood, wildfire, heat) and transition risks (carbon pricing, regulation) at property level. Adjust NOI projections and cap rates.', proof: 'Climate data sources, risk models, property-level adjustments, and valuation methodology recorded with full attribution.' },
      { title: 'Deal Underwriting Automation', prompt: 'Underwrite Class A office acquisition: $180M ask. Model rent roll stability, tenant credit quality, CapEx requirements, and exit scenarios at Years 3, 5, and 7. Sensitivity analysis on vacancy and rate assumptions.', proof: 'Financial models, assumption parameters, sensitivity ranges, and underwriting conclusions logged with data sources and model confidence.' },
      { title: 'Tenant Churn Prediction', prompt: 'Predict lease renewal probability for 1,400 active tenants. Incorporate payment history, space utilization data, market rent comparisons, and tenant industry health indicators. Flag high-risk non-renewals.', proof: 'Prediction models, input features, confidence scores, and risk flags recorded with methodology and data provenance.' },
      { title: 'Construction Progress Monitoring', prompt: 'Track 12 active development projects against milestone schedules. Analyze drone imagery for progress verification, compare against budget burn rate, and flag schedule slippage exceeding 10%.', proof: 'Progress assessments, imagery analysis results, budget comparisons, and schedule variance calculations logged with timestamps.' },
      { title: 'Market Comparable Analysis', prompt: 'Generate comprehensive comp analysis for 50,000 SF industrial acquisition. Include recent sales within 3-mile radius, lease rate benchmarks, vacancy trends, and absorption forecasts. Score deal attractiveness.', proof: 'Comparable data sources, adjustment methodology, scoring criteria, and deal attractiveness rating recorded with full data lineage.' },
      { title: 'ESG Compliance Reporting', prompt: 'Generate GRESB-ready sustainability report for 280-property portfolio. Calculate Scope 1, 2, and 3 emissions, energy intensity benchmarks, and social impact metrics. Identify improvement opportunities.', proof: 'Emissions calculations, data collection methodology, benchmark comparisons, and improvement recommendations logged with attestation.' },
    ],
    loopExample: {
      signal: 'FEMA flood zone reclassification: 23 properties moved from Zone X to Zone AE (high-risk)',
      context: 'Enriched with insurance cost projections, tenant lease terms, property values, and portfolio concentration',
      recommendation: 'Immediate actions: update insurance coverage, notify affected tenants, reassess portfolio risk concentration',
      simulation: 'Impact modeled: insurance cost increase (+$3.2M/yr), NOI reduction (-8.4%), portfolio value impact (-$47M)',
      policy: 'CIO approval required for portfolio rebalancing. Board notification for impairments exceeding $25M',
      execution: 'Insurance policies updated. Tenant notifications sent. Three properties flagged for disposition analysis',
      proof: 'Reclassification=FEMA-2026, properties=23, model=DeepSeek-V4, approver=CIO, impact=-$47M',
      outcome: 'Insurance secured at $2.8M/yr (vs. $3.2M projected). Two properties sold at 94% of pre-reclassification value',
      learning: 'Climate risk monitoring expanded to include FEMA preliminary map changes 12 months before effective date',
    },
    stats: [
      { label: 'Properties', value: '280 tracked' },
      { label: 'AUM Coverage', value: '$4.2B' },
      { label: 'Climate Models', value: '6 active' },
      { label: 'Deal Pipeline', value: '$890M' },
    ],
  },
  {
    id: 'defense',
    icon: '🛡️',
    name: 'Defense & Security',
    tagline: 'Governed threat intelligence with zero-trust attribution on every assessment.',
    desc: 'Beyond basic threat detection — a11oy governs the full security operations lifecycle. Threat intelligence with STIX/TAXII integration, vulnerability management with risk-prioritized remediation, incident response with forensic chain-of-custody, and compliance posture with continuous monitoring. Every security decision is immutably recorded.',
    models: ['GPT-5.1', 'o3', 'Claude 4 Sonnet', 'Llama 3.3-70B'],
    useCases: [
      { title: 'Threat Intelligence Correlation', prompt: 'Correlate threat feeds from MISP, AlienVault OTX, and GreyNoise against internal asset inventory. Map TTPs to MITRE ATT&CK framework. Prioritize threats by asset criticality and exploit maturity.', proof: 'Feed sources, correlation methodology, TTP mappings, and priority scores recorded with timestamp and analyst attribution.' },
      { title: 'Vulnerability Risk Prioritization', prompt: 'Triage 1,200 vulnerabilities from weekly scan. Apply SSVC decision tree with exploitation status, automatable assessment, and mission impact. Generate remediation plan with SLA-driven timelines.', proof: 'SSVC scoring, exploitation intelligence, mission impact assessment, and remediation timelines logged with data sources.' },
      { title: 'Incident Forensic Analysis', prompt: 'Analyze security incident: lateral movement detected across 3 network segments. Reconstruct attack timeline from EDR telemetry, network flows, and authentication logs. Identify initial access vector and data exfiltration scope.', proof: 'Forensic artifacts, timeline reconstruction, IOC extraction, and containment actions recorded with chain-of-custody documentation.' },
      { title: 'Compliance Posture Assessment', prompt: 'Assess compliance posture against NIST CSF 2.0, SOC 2 Type II, and ISO 27001. Identify control gaps, evidence collection status, and remediation priorities. Generate board-ready risk dashboard.', proof: 'Control assessments, evidence inventory, gap analysis, and risk scores recorded with framework references and assessor attribution.' },
      { title: 'Attack Surface Monitoring', prompt: 'Continuously monitor external attack surface: 2,400 public-facing assets. Detect new exposures, certificate issues, DNS changes, and shadow IT. Score risk by asset criticality and exposure severity.', proof: 'Discovery scans, risk scores, change detection events, and remediation assignments logged with scan timestamps and methodology.' },
      { title: 'Red Team Exercise Orchestration', prompt: 'Design and execute purple team exercise simulating APT29 campaign. Define scope, TTPs, and success criteria. Coordinate blue team detection testing. Generate findings report with remediation roadmap.', proof: 'Exercise scope, TTP execution log, detection results, and remediation recommendations recorded with full attribution.' },
    ],
    loopExample: {
      signal: 'EDR alert: Cobalt Strike beacon detected on finance department workstation',
      context: 'Enriched with threat intel (APT group attribution), asset criticality (finance-critical), and network topology',
      recommendation: 'Immediate containment recommended. Isolate affected segment. Initiate forensic investigation. Activate IR playbook',
      simulation: 'Blast radius modeled: 3 network segments, 47 endpoints, 12 privileged accounts potentially compromised',
      policy: 'CISO authorization required for network isolation. Legal notification within 4 hours. Board briefing within 24 hours',
      execution: 'Network segment isolated. Forensic collection initiated. IR team activated. Legal counsel notified',
      proof: 'Incident=INC-2026-0847, vector=phishing, model=o3, responder=SOC-Lead, containment_time=14min',
      outcome: 'Contained to single workstation. No data exfiltration confirmed. Root cause: spear phishing with macro payload',
      learning: 'Email gateway rules updated. Macro execution policy tightened. Phishing simulation frequency increased to weekly',
    },
    stats: [
      { label: 'Threats Tracked', value: '24/7 live' },
      { label: 'MTTR', value: '14 min' },
      { label: 'Assets Monitored', value: '2,400+' },
      { label: 'Compliance', value: '3 frameworks' },
    ],
  },
];

export interface CompetitiveVertical {
  id: string;
  name: string;
  fullName: string;
  emoji: string;
  domain: string;
  color: string;
  incumbent: string;
  incumbentCategory: string;
  incumbentStrength: string;
  incumbentGap: string;
  alloyAdvantage: string;
  proofPoint: string;
}

export const COMPETITIVE_VERTICALS: CompetitiveVertical[] = [
  {
    id: 'paragon',
    name: 'PARAGON',
    fullName: 'PARAGON — Defense & Intelligence',
    emoji: '⬡',
    domain: 'Defense & Security',
    color: '#6482dc',
    incumbent: 'Palantir',
    incumbentCategory: 'Data Integration Platform',
    incumbentStrength: 'Palantir excels at ingesting and unifying disparate government and enterprise data sources — fusing intelligence signals that were previously siloed across agencies and systems into a single operational picture.',
    incumbentGap: 'Data integration without governance is a half-solution. Palantir surfaces intelligence but cannot enforce who acts on it, under what authorization, or with what structural accountability. Every action taken from a Palantir dashboard happens outside the platform — untracked, ungoverned, unproven.',
    alloyAdvantage: 'PARAGON extends the intelligence picture into governed execution. Every threat assessment, containment action, and escalation decision passes through A11oy\'s Covenant Policy — enforced before execution, not reviewed after. The Proof Ledger records every incident from detection to closure with full actor attribution. Regulators and cyber insurers get a complete, tamper-evident record that Palantir cannot produce.',
    proofPoint: 'Governed incident response with cryptographic proof chain on every action — not just data fusion.',
  },
  {
    id: 'sextant',
    name: 'SEXTANT',
    fullName: 'SEXTANT — Maritime Intelligence',
    emoji: '⚓',
    domain: 'Maritime Operations',
    color: '#0e8cd2',
    incumbent: 'Windward',
    incumbentCategory: 'Maritime Analytics',
    incumbentStrength: 'Windward delivers sophisticated vessel behavior analytics — dark ship detection, ownership chain analysis, sanctions risk scoring, and maritime pattern-of-life modeling. It is the leading maritime analytics product for compliance and risk teams.',
    incumbentGap: 'Analytics without execution governance creates a critical gap: a Windward alert requires a human to leave the platform, make a decision, act on it somewhere else, and log it manually. The decision — who made it, on what basis, under whose authorization — lives nowhere. For P&I clubs, underwriters, and flag state regulators, that missing record is the exposure.',
    alloyAdvantage: 'SEXTANT closes the loop from alert to governed action. AIS anomalies flow directly into A11oy\'s decision loop — sanctions escalations pass through policy gates, rerouting decisions carry authorization records, and every operational exception is Proof Ledger-attributed. SEXTANT produces the compliance documentation that Windward cannot: a chain-of-custody record from signal to resolution.',
    proofPoint: 'Voyage decisions and sanctions responses with full authorization chain — audit-ready for P&I clubs and flag states.',
  },
  {
    id: 'domaine',
    name: 'DOMAINE',
    fullName: 'DOMAINE — Real Estate Intelligence',
    emoji: '▣',
    domain: 'Real Estate & Infrastructure',
    color: '#408564',
    incumbent: 'CoStar',
    incumbentCategory: 'Market Data Platform',
    incumbentStrength: 'CoStar is the definitive source for commercial real estate market data — the deepest comp database, the most comprehensive listing inventory, and the most trusted lease and sale transaction records in the industry.',
    incumbentGap: 'CoStar tells you what the market looks like. It cannot tell you what to do about it, under whose authority, or with what documented rationale. Deal decisions — underwriting assumptions, investment committee approvals, acquisition authorizations — happen entirely outside CoStar. The evidentiary record of how capital was committed exists nowhere.',
    alloyAdvantage: 'DOMAINE applies distress-first signal intelligence to NYC real estate, building a deal pipeline where every acquisition decision carries a complete proof envelope: the distress signal that surfaced it, the underwriting model that priced it, the investment committee approval that authorized it. LPs and regulators get a documented decision record that CoStar cannot produce by design.',
    proofPoint: 'Distress-first discovery with investment committee proof chains — from signal to close, fully attributed.',
  },
  {
    id: 'counsel',
    name: 'Counsel',
    fullName: 'Counsel — Legal Matter Command',
    emoji: '⚖',
    domain: 'Legal Operations',
    color: '#8c64d2',
    incumbent: 'Relativity',
    incumbentCategory: 'Document Review Platform',
    incumbentStrength: 'Relativity dominates e-discovery — high-volume document processing, privilege review automation, review workflow management, and litigation support for large-scale legal matters. It is the standard infrastructure for document-intensive litigation.',
    incumbentGap: 'Relativity is a document processing engine, not a matter governance platform. It has no model for obligation tracking, no deadline enforcement, no settlement authority gates, and no structured record of material legal decisions. Every commitment made by counsel during a matter happens outside Relativity — undocumented, ungoverned, and unattributable.',
    alloyAdvantage: 'Counsel governs the full matter lifecycle that Relativity leaves unaddressed. Every obligation is tracked with deadline monitoring. Every settlement authority is gated by Covenant Policy. Every document intelligence finding carries source attribution. The Proof Ledger creates the definitive record of every material legal decision — from engagement through closure — that audit committees and counterparties can inspect.',
    proofPoint: 'Matter lifecycle governance with obligation tracking and settlement authority proof — beyond document processing.',
  },
  {
    id: 'kora',
    name: 'KORA',
    fullName: 'KORA — Decision Intelligence',
    emoji: '◆',
    domain: 'Decision Intelligence',
    color: '#c99840',
    incumbent: 'Salesforce Einstein / Clari',
    incumbentCategory: 'CRM Intelligence',
    incumbentStrength: 'Salesforce Einstein and Clari deliver sophisticated CRM-native intelligence — pipeline scoring, forecast modeling, deal risk signals, and revenue intelligence derived from sales activity data. They are the established tools for revenue team performance.',
    incumbentGap: 'CRM intelligence is domain-constrained by definition. Einstein knows your pipeline. It cannot know how a maritime sanctions event affects your defense sector contract outlook, or how legal obligation drift creates pricing risk across portfolio verticals. Single-domain intelligence, no matter how sophisticated, cannot produce cross-vertical signal correlation — and cannot prove how any recommendation was reached.',
    alloyAdvantage: 'KORA routes decision workloads across 8+ frontier models with portfolio-wide signal correlation — surfacing how events in one vertical create exposure or opportunity in another. Every recommendation carries confidence intervals from Monte Carlo simulation. Every decision carries a Proof Ledger record that links the triggering signal to the model that recommended it, the operator who approved it, and the outcome it produced.',
    proofPoint: 'Cross-vertical signal correlation with multi-model routing and proof chain attribution on every decision.',
  },
  {
    id: 'pulse',
    name: 'Pulse',
    fullName: 'Pulse — Market Intelligence',
    emoji: '◈',
    domain: 'Market Intelligence',
    color: '#3caa9b',
    incumbent: 'Bloomberg Terminal',
    incumbentCategory: 'Financial Data Platform',
    incumbentStrength: 'Bloomberg Terminal is the authoritative source for financial market data — real-time prices, fixed income analytics, news, company fundamentals, and the broadest coverage of global securities. It is the information infrastructure of institutional finance.',
    incumbentGap: 'Bloomberg delivers data. It does not deliver synthesis. A Bloomberg terminal gives every subscriber the same firehose — the work of turning that data into an actionable executive decision, with source attribution and confidence scoring, still requires human analysts. And Bloomberg has no concept of how a rate move connects to your maritime fleet\'s demurrage exposure, or your real estate portfolio\'s refinancing risk.',
    alloyAdvantage: 'Pulse delivers governed executive intelligence — not raw data, but synthesized briefings where every insight is source-attributed, confidence-scored, and cross-referenced against operational context from all SZL verticals. A rate move surfaces as both a market event and a portfolio implication. Every executive briefing is evidence-based and traceable, producing intelligence that Bloomberg\'s firehose cannot.',
    proofPoint: 'Executive briefings with cross-vertical context and full source attribution — synthesis, not subscription.',
  },
  {
    id: 'carlota-jo',
    name: 'Carlota Jo',
    fullName: 'Carlota Jo — Private Advisory',
    emoji: '◎',
    domain: 'Private Advisory',
    color: '#c88c64',
    incumbent: 'McKinsey Lilli / Bain Advisory Tools',
    incumbentCategory: 'Traditional Advisory',
    incumbentStrength: 'McKinsey Lilli and leading advisory firm AI tools bring institutional knowledge synthesis and research acceleration to the consulting engagement model — allowing advisors to work faster and surface more comprehensive analysis during engagements.',
    incumbentGap: 'Traditional advisory intelligence tools optimize for the advisor, not for the client\'s evidentiary record. Engagement recommendations are delivered in presentations and documents that have no structured provenance — no record of what evidence supported each conclusion, what alternatives were considered, under whose authorization commitments were made, or how outcomes compared to what was promised. The engagement proof record does not exist.',
    alloyAdvantage: 'Carlota Jo governs the full advisory engagement lifecycle with structured proof. Every session is recorded. Every commitment is tracked through delivery. Every advisory recommendation carries its evidentiary basis. The Proof Ledger creates an engagement record that clients can inspect — connecting each delivered outcome to the commitment that generated it. Clients gain structured accountability that no traditional advisory model can offer.',
    proofPoint: 'Advisory engagement proof chains with commitment tracking and outcome attribution — structured accountability by design.',
  },
];

export const CANONICAL_STEPS = [
  { num: '01', name: 'Signal', icon: '📡', desc: 'Detect. Ingest live data from any source — AIS feeds, market data, threat intel, regulatory filings, code commits, clinical trials. Every signal is timestamped and attributed.' },
  { num: '02', name: 'Context', icon: '🔍', desc: 'Enrich. Cross-reference against knowledge bases, historical patterns, domain intelligence, and organizational memory. Context is never hallucinated — it is sourced and cited.' },
  { num: '03', name: 'Recommendation', icon: '💡', desc: 'Reason. Multiple models compete to generate ranked options. Each recommendation carries a confidence score, supporting evidence, and model attribution.' },
  { num: '04', name: 'Simulation', icon: '🎲', desc: 'Model. Monte Carlo, scenario analysis, blast-radius estimation. Every simulation records its parameters, assumptions, and probability distributions.' },
  { num: '05', name: 'Policy', icon: '🔒', desc: 'Gate. Covenant policies enforce who can approve, when, under what conditions. No action bypasses the policy engine. No exception goes unrecorded.' },
  { num: '06', name: 'Execution', icon: '⚡', desc: 'Act. Durable, governed workflows with checkpoint recovery. Agent coordination, tool orchestration, and human-in-the-loop handoffs — all governed.' },
  { num: '07', name: 'Proof', icon: '🔗', desc: 'Record. Immutable, append-only proof chain. Every action, every model call, every approval, every outcome — cryptographically verifiable and queryable.' },
  { num: '08', name: 'Outcome', icon: '📊', desc: 'Measure. The Outcome Graph closes the loop — recording the real-world consequence and comparing it against the recommendation\'s predicted confidence.' },
  { num: '09', name: 'Learning', icon: '🧠', desc: 'Evolve. Model weights recalibrated. Policy thresholds adjusted. The entire system gets smarter with every cycle — and the evidence of learning is itself proof-chained.' },
];
