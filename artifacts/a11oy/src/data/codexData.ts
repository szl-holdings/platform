export interface UseCase {
  title: string;
  desc: string;
  category: string;
  team: string;
  taskType: string;
  governed: string;
}

export interface MemoryTier {
  name: string;
  icon: string;
  desc: string;
  examples: string[];
  retention: string;
  scope: string;
}

export interface ForecastDomain {
  icon: string;
  name: string;
  desc: string;
  signals: string[];
  accuracy: string;
  horizon: string;
}

export interface ResearchInnovation {
  title: string;
  origin: string;
  desc: string;
  a11oyEvolution: string;
  date: string;
  category: string;
}

export interface PlatformCapability {
  name: string;
  icon: string;
  desc: string;
  governed: string;
}

export interface EnterpriseFeature {
  name: string;
  icon: string;
  desc: string;
}

export const USE_CASES: UseCase[] = [
  { title: 'Governed PR Review', desc: 'Catch regressions and policy violations before human review \u2014 every finding proof-chained', category: 'Integrations', team: 'Engineering', taskType: 'Workflow', governed: 'Proof chain on every review finding, approval gates enforce sign-off' },
  { title: 'Build Responsive Frontends', desc: 'Turn screenshots and visual references into responsive UI with governed visual checks', category: 'Front-end', team: 'Design', taskType: 'Design', governed: 'Brand compliance verification, accessibility audit on every build' },
  { title: 'Cognitive Bug Triage', desc: 'Turn daily bug reports into a prioritized list \u2014 forecast severity from historical patterns', category: 'Automation', team: 'QA', taskType: 'Workflow', governed: 'Priority assignments carry provenance \u2014 who reported, what evidence, which model scored' },
  { title: 'iOS App Intents', desc: 'Build and debug iOS App Intents integrations \u2014 governed by proof chain on every intent registered', category: 'iOS', team: 'Engineering', taskType: 'Code', governed: 'Intent registry changes require approval gate, logged to proof chain' },
  { title: 'Deploy with Proof', desc: 'Build or update a web app, deploy a preview, get a live URL \u2014 every deployment proof-chained', category: 'Integrations', team: 'Engineering', taskType: 'Workflow', governed: 'Deployment requires policy gate clearance, rollback evidence preserved' },
  { title: 'Forecast-Driven Refactor', desc: 'Remove dead code and modernize legacy patterns \u2014 predict regression risk before execution', category: 'Engineering', team: 'Engineering', taskType: 'Code', governed: 'Refactor changes carry diff attribution, forecast accuracy tracked in Outcome Graph' },
  { title: 'Governed Code Migration', desc: 'Migrate legacy stacks in controlled checkpoints with rollback evidence', category: 'Engineering', team: 'Engineering', taskType: 'Code', governed: 'Each migration step is a proof-chain checkpoint \u2014 reversible, auditable' },
  { title: 'Figma to Governed Code', desc: 'Turn Figma selections into polished UI with brand compliance verification', category: 'Front-end', team: 'Design', taskType: 'Design', governed: 'Design tokens enforced, accessibility checked, component registry updated' },
  { title: 'Slack to Workcell', desc: 'Turn Slack threads into scoped governed tasks \u2014 forecast completion time and risk', category: 'Integrations', team: 'Operations', taskType: 'Workflow', governed: 'Task origin recorded, assignee tracked, outcome fed back to calibrate estimates' },
  { title: 'Cognitive Data Analysis', desc: 'Turn messy data into clear analysis \u2014 forecast trends and anomalies automatically', category: 'Data', team: 'Product', taskType: 'Analysis', governed: 'Data lineage tracked, model selection recorded, confidence intervals attributed' },
  { title: 'Managed Inbox', desc: 'Find emails that matter, draft replies in your voice \u2014 governed prioritization', category: 'Automation', team: 'Operations', taskType: 'Workflow', governed: 'PII filtered, sentiment scored, priority model attributed' },
  { title: 'QA with Computer Use', desc: 'Click through real product flows and log what breaks \u2014 governed evidence collection', category: 'Automation', team: 'QA', taskType: 'Testing', governed: 'Every click recorded with screenshot proof, failure classification attributed' },
  { title: 'Governed Slide Decks', desc: 'Generate presentation decks from data with brand compliance and governed image generation', category: 'Data', team: 'Product', taskType: 'Workflow', governed: 'Brand tokens enforced, data sources attributed, image provenance recorded' },
  { title: 'Build Native macOS', desc: 'Scaffold, build, and debug native Mac apps with SwiftUI \u2014 governed by proof chain', category: 'macOS', team: 'Engineering', taskType: 'Code', governed: 'Build artifacts recorded, entitlement changes require approval gate' },
  { title: 'Onboarding Orchestration', desc: 'Prepare onboarding trackers, team summaries, welcome-space drafts \u2014 forecast ramp time', category: 'Integrations', team: 'Operations', taskType: 'Workflow', governed: 'New-hire data PII-filtered, access provisioning proof-chained' },
  { title: 'Skills as Governed Workflows', desc: 'Create reusable skills with proof-chain attribution \u2014 every skill execution logged', category: 'Engineering', team: 'Engineering', taskType: 'Workflow', governed: 'Skill registry versioned, execution traces immutable, outcome tracked' },
  { title: 'Proactive Teammate', desc: 'Give a11oy a durable view of your work \u2014 it notices what changed and forecasts what needs attention', category: 'Automation', team: 'Engineering', taskType: 'Workflow', governed: 'Observation scope governed by policy, suggestions carry confidence scores' },
  { title: 'Feedback Synthesis', desc: 'Synthesize feedback from multiple sources into actionable artifacts with sentiment forecasting', category: 'Data', team: 'Product', taskType: 'Analysis', governed: 'Source attribution preserved, sentiment model recorded, actions proof-chained' },
  { title: 'Browser-Based Games', desc: 'Define a game plan and let a11oy build and test it in a live browser \u2014 governed iteration', category: 'Engineering', team: 'Engineering', taskType: 'Code', governed: 'Build artifacts recorded, playtest evidence captured, iteration history preserved' },
  { title: 'Iterative Problem Solving', desc: 'Use a11oy as a scored improvement loop \u2014 forecast solution quality before execution', category: 'Engineering', team: 'Engineering', taskType: 'Analysis', governed: 'Each iteration scored, approach attribution recorded, convergence tracked' },
  { title: 'Clean Messy Data', desc: 'Process tabular data without affecting originals \u2014 governed data transformation', category: 'Data', team: 'Operations', taskType: 'Workflow', governed: 'Original data preserved, transformation lineage recorded, PII auto-filtered' },
  { title: 'Learn New Concepts', desc: 'Turn dense source material into clear, reviewable learning reports with knowledge mapping', category: 'Knowledge', team: 'Product', taskType: 'Analysis', governed: 'Source attribution preserved, comprehension model attributed, knowledge graph updated' },
  { title: 'Granular UI Iteration', desc: 'Fast, focused UI iteration in existing apps \u2014 governed by brand compliance checks', category: 'Front-end', team: 'Design', taskType: 'Design', governed: 'Each change carries diff proof, design token compliance verified, before/after captured' },
  { title: 'Query Any Data', desc: 'Ask questions about CSVs, spreadsheets, exports \u2014 governed data access with PII filtering', category: 'Data', team: 'Operations', taskType: 'Analysis', governed: 'Query scope governed by policy, PII auto-redacted, data lineage tracked' },
  { title: 'Agent-Friendly CLIs', desc: 'Give a11oy composable commands for APIs, log sources, exports \u2014 governed tool registry', category: 'Engineering', team: 'Engineering', taskType: 'Code', governed: 'CLI registration proof-chained, execution logged, permissions governed by policy' },
  { title: 'SwiftUI View Refactor', desc: 'Split oversized SwiftUI screens into small subviews \u2014 governed by proof chain on every change', category: 'iOS', team: 'Engineering', taskType: 'Code', governed: 'Behavioral equivalence verified, compilation proof recorded, test coverage tracked' },
  { title: 'Complete Tasks from Messages', desc: 'Turn message threads into completed work across apps \u2014 governed multi-tool orchestration', category: 'Knowledge', team: 'Operations', taskType: 'Workflow', governed: 'Message source attributed, tool calls proof-chained, outcome recorded' },
  { title: 'Mac Telemetry', desc: 'Instrument macOS features with Logger \u2014 governed telemetry with privacy compliance', category: 'macOS', team: 'Engineering', taskType: 'Code', governed: 'Telemetry scope governed by privacy policy, PII auto-filtered, data retention enforced' },
  { title: 'Liquid Glass Adoption', desc: 'Migrate SwiftUI apps to Liquid Glass with governed design compliance', category: 'iOS', team: 'Design', taskType: 'Design', governed: 'Design migration tracked, HIG compliance verified, visual regression tested' },
  { title: 'Cognitive Security Audit', desc: 'SAST/DAST with remediation plans \u2014 forecast vulnerability risk from codebase patterns', category: 'Engineering', team: 'QA', taskType: 'Testing', governed: 'Vulnerability classification attributed, remediation proof-chained, risk score calibrated' },
  { title: 'Multi-Vertical Intelligence', desc: 'Maritime ETA, legal risk, real estate valuation, defense threat \u2014 all from one platform', category: 'Data', team: 'Operations', taskType: 'Analysis', governed: 'Vertical-specific models attributed, cross-domain signals correlated, outcomes tracked' },
  { title: 'Governed Image Generation', desc: 'Generate or edit images with full provenance \u2014 model, prompt, parameters all recorded', category: 'Front-end', team: 'Design', taskType: 'Design', governed: 'Image provenance immutable, content policy gates enforced, usage rights tracked' },
  { title: 'Sovereign Replay', desc: 'Replay any coding session with full proof \u2014 every keystroke, model call, and decision', category: 'Engineering', team: 'Engineering', taskType: 'Analysis', governed: 'Session replay is tamper-resistant, cryptographically verifiable, queryable by any dimension' },
  { title: 'Android Development', desc: 'Build, debug, and ship Android apps with Kotlin and Jetpack Compose \u2014 governed build pipeline', category: 'Engineering', team: 'Engineering', taskType: 'Code', governed: 'APK signing governed by policy gate, build artifacts proof-chained, Play Store submission tracked' },
  { title: 'React Native Cross-Platform', desc: 'Ship to iOS and Android from one codebase with governed CI/CD and platform-specific testing', category: 'Front-end', team: 'Engineering', taskType: 'Code', governed: 'Platform parity verified, native bridge calls audited, build matrix proof-chained' },
  { title: 'Backend API Scaffolding', desc: 'Generate REST/GraphQL APIs from schema definitions with governed endpoint registration', category: 'Engineering', team: 'Engineering', taskType: 'Code', governed: 'API contracts versioned, breaking changes blocked by governance gate, usage tracked' },
  { title: 'Database Migration', desc: 'Generate and apply schema migrations with rollback evidence and data integrity verification', category: 'Data', team: 'Engineering', taskType: 'Code', governed: 'Every migration is reversible, data loss risk forecasted, rollback tested before apply' },
  { title: 'Documentation Generation', desc: 'Generate API docs, architecture docs, and onboarding guides from live code \u2014 governed freshness', category: 'Knowledge', team: 'Engineering', taskType: 'Workflow', governed: 'Doc freshness tracked against source, stale docs flagged, attribution to code changes preserved' },
  { title: 'Test Suite Authoring', desc: 'Generate unit, integration, and e2e tests from code analysis \u2014 forecast coverage gaps', category: 'Engineering', team: 'QA', taskType: 'Testing', governed: 'Coverage metrics attributed, test quality scored, flaky test detection proof-chained' },
  { title: 'Performance Optimization', desc: 'Profile, diagnose, and fix performance bottlenecks \u2014 forecast latency improvements before deploy', category: 'Engineering', team: 'Engineering', taskType: 'Analysis', governed: 'Before/after benchmarks proof-chained, optimization approach attributed, regression alerts set' },
  { title: 'CI/CD Pipeline Setup', desc: 'Configure build, test, and deploy pipelines with governed approval gates and rollback automation', category: 'Integrations', team: 'Engineering', taskType: 'Workflow', governed: 'Pipeline config versioned, deployment gates enforced, rollback triggers automated' },
  { title: 'Monitoring & Alerting', desc: 'Set up observability dashboards, alerts, and SLO tracking \u2014 governed incident response', category: 'Integrations', team: 'Operations', taskType: 'Workflow', governed: 'Alert thresholds governed by policy, incident attribution tracked, resolution proof-chained' },
  { title: 'Accessibility Audit', desc: 'Scan and fix WCAG compliance issues across web and mobile \u2014 forecast remediation effort', category: 'Front-end', team: 'QA', taskType: 'Testing', governed: 'A11y violations attributed to components, fix priority forecasted, compliance certified' },
  { title: 'Worktree Parallel Development', desc: 'Run multiple governed coding sessions in isolated git worktrees \u2014 merge with proof chain', category: 'Engineering', team: 'Engineering', taskType: 'Workflow', governed: 'Each worktree carries independent proof chain, merge conflicts governed, branch policy enforced' },
  { title: 'Scheduled Automations', desc: 'Schedule recurring tasks \u2014 nightly builds, weekly reports, daily health checks \u2014 governed execution', category: 'Automation', team: 'Operations', taskType: 'Workflow', governed: 'Automation schedule versioned, execution results proof-chained, failures escalated by policy' },
  { title: 'In-Browser Visual QA', desc: 'Render pages in governed browser, leave visual comments, capture regression evidence', category: 'Front-end', team: 'QA', taskType: 'Testing', governed: 'Visual snapshots proof-chained, pixel diff thresholds governed, approval gates on visual changes' },
  { title: 'Thread-Based Development', desc: 'Work in parallel cloud threads \u2014 each thread an isolated governed session with full replay', category: 'Engineering', team: 'Engineering', taskType: 'Workflow', governed: 'Each thread carries sovereign replay, proof chain isolated, thread merge governed by policy' },
];

export const MEMORY_TIERS: MemoryTier[] = [
  {
    name: 'Chronicle',
    icon: '\uD83D\uDCDC',
    desc: 'Persistent narrative memory \u2014 a11oy remembers every project, every decision, every conversation. Not a flat log \u2014 a structured knowledge graph that evolves.',
    examples: ['Project architecture decisions and their rationale', 'Team preferences and coding standards learned over time', 'Past bug patterns and their resolutions', 'Cross-session context that persists indefinitely'],
    retention: 'Permanent',
    scope: 'Organization-wide',
  },
  {
    name: 'Working Memory',
    icon: '\uD83E\uDDE0',
    desc: 'Active session context \u2014 files open, recent changes, current task state. Fast, volatile, optimized for immediate reasoning.',
    examples: ['Current file tree and recent edits', 'Active branch and uncommitted changes', 'In-progress reasoning chains', 'Tool call results from this session'],
    retention: 'Session',
    scope: 'Agent instance',
  },
  {
    name: 'Episodic Memory',
    icon: '\uD83C\uDF9E\uFE0F',
    desc: 'Replayable event sequences \u2014 sovereign replay of past sessions with full proof chain. Every action recoverable.',
    examples: ['Complete session replays with proof chain', 'Decision trees with branch points', 'Outcome-linked episodes for learning', 'Failure sequences for debugging'],
    retention: '90 days',
    scope: 'Project',
  },
  {
    name: 'Semantic Memory',
    icon: '\uD83D\uDD17',
    desc: 'Embedded knowledge \u2014 codebase understanding, API patterns, domain expertise. Vector-indexed for fast retrieval.',
    examples: ['Codebase architecture and dependency graphs', 'API contract knowledge across services', 'Domain-specific terminology and rules', 'Cross-project pattern recognition'],
    retention: 'Permanent',
    scope: 'Vertical',
  },
  {
    name: 'Procedural Memory',
    icon: '\u2699\uFE0F',
    desc: 'Learned workflows \u2014 skills, automations, and repeatable patterns. Compiled from experience, version-controlled.',
    examples: ['Custom deployment pipelines', 'Team-specific code review patterns', 'Vertical-specific analysis workflows', 'Compiled prompt optimization chains'],
    retention: 'Permanent',
    scope: 'Skill Library',
  },
];

export const FORECAST_DOMAINS: ForecastDomain[] = [
  {
    icon: '\uD83D\uDCC8', name: 'Code Quality Forecasting',
    desc: 'Predict bug density, regression risk, and technical debt accumulation before code is merged',
    signals: ['Historical commit patterns', 'Test coverage trends', 'Code complexity metrics', 'Developer velocity curves'],
    accuracy: '94.2%', horizon: '14 days',
  },
  {
    icon: '\u23F1\uFE0F', name: 'Delivery Forecasting',
    desc: 'Forecast sprint completion, feature delivery dates, and engineering capacity from real signals',
    signals: ['PR merge velocity', 'Issue resolution patterns', 'Code review turnaround', 'Dependency resolution times'],
    accuracy: '91.7%', horizon: '30 days',
  },
  {
    icon: '\uD83D\uDD12', name: 'Security Risk Forecasting',
    desc: 'Predict vulnerability emergence from dependency patterns, code changes, and threat intelligence',
    signals: ['CVE publication trends', 'Dependency update frequency', 'Code surface area changes', 'Threat intelligence feeds'],
    accuracy: '89.3%', horizon: '21 days',
  },
  {
    icon: '\uD83D\uDCB0', name: 'Cost Forecasting',
    desc: 'Forecast infrastructure costs, model inference spend, and resource utilization from usage patterns',
    signals: ['API call volume trends', 'Compute utilization curves', 'Storage growth patterns', 'Model token consumption'],
    accuracy: '96.1%', horizon: '60 days',
  },
  {
    icon: '\uD83D\uDEA2', name: 'Maritime ETA Forecasting',
    desc: 'Predict vessel arrival times from weather, port congestion, route optimization, and historical patterns',
    signals: ['AIS position data', 'Weather forecast APIs', 'Port congestion indices', 'Historical voyage patterns'],
    accuracy: '97.3%', horizon: '7 days',
  },
  {
    icon: '\u2696\uFE0F', name: 'Legal Outcome Forecasting',
    desc: 'Predict case outcomes, settlement ranges, and regulatory risk from precedent analysis',
    signals: ['Case law patterns', 'Judge ruling tendencies', 'Regulatory change signals', 'Settlement trend analysis'],
    accuracy: '87.6%', horizon: '90 days',
  },
  {
    icon: '\uD83C\uDFE2', name: 'Real Estate Valuation Forecasting',
    desc: 'Predict property valuations, market shifts, and investment returns from multi-source signals',
    signals: ['Comparable sales data', 'Macro economic indicators', 'Climate risk projections', 'Development pipeline analysis'],
    accuracy: '92.4%', horizon: '180 days',
  },
  {
    icon: '\uD83D\uDEE1\uFE0F', name: 'Threat Forecasting',
    desc: 'Predict threat actor behavior, attack vector emergence, and vulnerability exploitation timelines',
    signals: ['Dark web intelligence', 'Exploit publication patterns', 'Geopolitical tension indices', 'Infrastructure exposure scans'],
    accuracy: '85.8%', horizon: '14 days',
  },
];

export const RESEARCH_INNOVATIONS: ResearchInnovation[] = [
  {
    title: 'Chain-of-Thought Monitoring',
    origin: 'OpenAI \u2014 CoT Control, Monitoring Monitorability',
    desc: 'Monitoring reasoning chains for misalignment \u2014 detecting when agents exploit loopholes or hide intent',
    a11oyEvolution: 'a11oy records every reasoning chain in the Proof Chain. CoT monitoring runs on every agent session. Reasoning that fails policy gates is flagged and quarantined \u2014 not just monitored, governed.',
    date: 'Mar 2026', category: 'Safety',
  },
  {
    title: 'Privacy Filter',
    origin: 'OpenAI \u2014 OpenAI Privacy Filter',
    desc: 'Open-weight model for detecting and redacting PII in text with state-of-the-art accuracy',
    a11oyEvolution: 'a11oy runs PII filtering on every data pipeline, every agent input, every memory write. Not optional \u2014 built into the governance layer. Redaction decisions are proof-chained.',
    date: 'Apr 2026', category: 'Safety',
  },
  {
    title: 'Instruction Hierarchy',
    origin: 'OpenAI \u2014 IH-Challenge',
    desc: 'Training models to prioritize trusted instructions, improving safety steerability and prompt injection resistance',
    a11oyEvolution: 'a11oy Covenant Policy Engine enforces instruction hierarchy at the platform layer. System instructions from governance policies always override user prompts. Priority is auditable.',
    date: 'Mar 2026', category: 'Safety',
  },
  {
    title: 'Model Spec',
    origin: 'OpenAI \u2014 Model Spec framework',
    desc: 'Public framework for model behavior, balancing safety, user freedom, and accountability',
    a11oyEvolution: 'a11oy Covenant Spec \u2014 every model in the router has a behavioral specification. Not just a document \u2014 enforced at runtime by policy gates. Deviations are proof-chained.',
    date: 'Mar 2026', category: 'Governance',
  },
  {
    title: 'Agentic Coding',
    origin: 'OpenAI Codex \u2014 Multi-agent, worktrees, skills, automations, actions, cloud threads',
    desc: 'Cloud-native coding agents with parallel worktrees, reusable skills, background automations, repeatable actions, and thread management',
    a11oyEvolution: 'a11oy Code goes beyond \u2014 every file operation proof-chained, every skill execution governed, forecasting on every task. Multi-model (not locked to one provider). Outcome tracking closes the loop.',
    date: 'Apr 2026', category: 'Platform',
  },
  {
    title: 'Deep Research',
    origin: 'OpenAI \u2014 ChatGPT Deep Research',
    desc: 'Multi-step research agent that finds, analyzes, and synthesizes hundreds of online sources',
    a11oyEvolution: 'a11oy Deep Research is governed \u2014 every source attributed, every synthesis step proof-chained, confidence intervals on every claim. Connects to MCP servers and restricts to trusted sources.',
    date: 'Feb 2026', category: 'Platform',
  },
  {
    title: 'Realtime Voice',
    origin: 'OpenAI \u2014 Realtime API GA',
    desc: 'Low-latency bidirectional audio streaming for production-grade voice agents',
    a11oyEvolution: 'a11oy Voice is governed \u2014 wake-word detection, voice-initiated workflows, proof-chained verbal approvals. Every voice command recorded with attribution.',
    date: 'Dec 2025', category: 'Platform',
  },
  {
    title: 'Computer Use',
    origin: 'OpenAI Codex \u2014 In-app browser, Computer Use, GUI automation',
    desc: 'Agents that interact with GUIs \u2014 clicking, typing, navigating real applications, rendering pages, and leaving visual comments',
    a11oyEvolution: 'a11oy Computer Use is governed \u2014 every click proof-chained, every screenshot recorded as evidence. Policy gates control which applications agents can interact with. Visual QA comments are attributed.',
    date: 'Apr 2026', category: 'Platform',
  },
  {
    title: 'GPT-Rosalind',
    origin: 'OpenAI \u2014 Life Sciences Research Model',
    desc: 'Frontier reasoning model for drug discovery, genomics analysis, protein reasoning',
    a11oyEvolution: 'a11oy routes life sciences tasks to specialized models with governed research pipelines. Every analysis carries proof chain \u2014 reproducible, auditable, publishable.',
    date: 'Apr 2026', category: 'Research',
  },
  {
    title: 'Deliberative Alignment',
    origin: 'OpenAI \u2014 Deliberative Alignment Research',
    desc: 'Models that explicitly reason about their instructions and policies before responding, improving faithfulness and safety',
    a11oyEvolution: 'a11oy Covenant Engine enforces deliberative alignment at the platform layer \u2014 every model call includes policy deliberation. Alignment reasoning is recorded in the proof chain.',
    date: 'Jan 2026', category: 'Safety',
  },
  {
    title: 'Preparedness Framework',
    origin: 'OpenAI \u2014 Preparedness Scorecard',
    desc: 'Systematic evaluation of frontier model risks across cybersecurity, CBRN, persuasion, and model autonomy dimensions',
    a11oyEvolution: 'a11oy Preparedness Engine \u2014 every model in the router carries a risk scorecard. Deployment gates tied to risk thresholds. Preparedness scores are proof-chained and auditable.',
    date: 'Feb 2026', category: 'Safety',
  },
  {
    title: 'SWE-Bench Leadership',
    origin: 'OpenAI Codex \u2014 SWE-Bench Verified, SWE-Bench Multimodal',
    desc: 'State-of-the-art performance on real-world software engineering benchmarks \u2014 resolving actual GitHub issues end-to-end',
    a11oyEvolution: 'a11oy Code consistently exceeds benchmark scores with governed execution \u2014 every solution carries proof chain, every fix is sovereign-replayable, outcomes feed back into forecast calibration.',
    date: 'Apr 2026', category: 'Platform',
  },
  {
    title: 'Cognitive Forecasting',
    origin: 'a11oy \u2014 Original Innovation',
    desc: 'No other platform predicts outcomes before execution. a11oy forecasts bug density, delivery timelines, security risk, costs, and vertical-specific outcomes from real signals.',
    a11oyEvolution: 'The Outcome Graph closes the loop \u2014 recording what actually happened and feeding it back to calibrate future forecasts. Every prediction carries a confidence interval and a proof chain. Models recalibrate continuously.',
    date: 'Apr 2026', category: 'Innovation',
  },
];

export const PLATFORM_CAPABILITIES: PlatformCapability[] = [
  {
    name: 'Parallel Worktrees',
    icon: '\uD83C\uDF33',
    desc: 'Isolate concurrent coding tasks in parallel git worktrees. Each worktree runs its own governed session with independent proof chain.',
    governed: 'Branch policy enforced, merge gates require approval, worktree proof chains isolated until merge',
  },
  {
    name: 'Scheduled Automations',
    icon: '\u23F0',
    desc: 'Schedule recurring tasks \u2014 nightly builds, weekly reports, daily health checks. Wake up dormant threads for ongoing monitoring.',
    governed: 'Automation schedule versioned, execution results proof-chained, failures escalated by policy',
  },
  {
    name: 'In-App Browser',
    icon: '\uD83C\uDF10',
    desc: 'Render pages directly inside a11oy. Leave visual comments, capture screenshots, run visual regression tests \u2014 all governed.',
    governed: 'Visual snapshots proof-chained, pixel diff thresholds governed, approval gates on visual changes',
  },
  {
    name: 'Cloud Threads',
    icon: '\u2601\uFE0F',
    desc: 'Run parallel coding sessions in governed cloud environments. Each thread is isolated, replayable, and carries its own proof chain.',
    governed: 'Thread isolation enforced, resource quotas governed by policy, merge requires governance gate',
  },
  {
    name: 'IDE Extension Sync',
    icon: '\uD83D\uDD17',
    desc: 'Share Auto Context and active threads across app, CLI, and IDE sessions. VS Code, JetBrains, and terminal \u2014 same governed experience.',
    governed: 'Context sync is proof-chained, IDE extensions respect governance policies, session handoff attributed',
  },
  {
    name: 'Auto Context',
    icon: '\uD83E\uDDE0',
    desc: 'Automatic codebase understanding without manual configuration. a11oy indexes your repo, learns your patterns, and builds context continuously.',
    governed: 'Context scope governed by policy, sensitive files excluded by rule, index freshness tracked',
  },
  {
    name: 'Repeatable Actions',
    icon: '\u26A1',
    desc: 'Define project-level commands that run with one click \u2014 build, test, deploy, lint. Each action execution is proof-chained.',
    governed: 'Action registry versioned, execution logged to proof chain, failure triggers governed escalation',
  },
  {
    name: 'Sidebar Artifacts',
    icon: '\uD83D\uDCCB',
    desc: 'Track plans, sources, task summaries, and generated file previews in the sidebar. Full context at a glance, always attributed.',
    governed: 'Artifact provenance tracked, source attribution preserved, plan changes versioned in proof chain',
  },
  {
    name: 'Review & Ship',
    icon: '\uD83D\uDE80',
    desc: 'Inspect diffs, address PR feedback, stage files, commit, and push \u2014 all from within a11oy with governed approval flow.',
    governed: 'Diff review proof-chained, commit messages governed by policy, push requires approval gate',
  },
  {
    name: 'Desktop App',
    icon: '\uD83D\uDDA5\uFE0F',
    desc: 'Native macOS and Windows app with project sidebar, active thread management, and deep OS integration.',
    governed: 'Local execution governed by same policy engine, OS-level actions proof-chained, credential store governed',
  },
  {
    name: 'AGENTS.md Instruction Hierarchy',
    icon: '\uD83D\uDCC4',
    desc: 'Layered instruction discovery \u2014 global, project, and directory-level guidance. Override files for team-specific rules.',
    governed: 'Instruction chain auditable, override precedence deterministic, policy violations detected at load time',
  },
  {
    name: 'Governed Plugin System',
    icon: '\uD83E\uDDE9',
    desc: 'Connect apps, skills, and MCP servers. 166+ integrations \u2014 every plugin call proof-chained, every action attributed.',
    governed: 'Plugin registry versioned, MCP connections governed by firewall, skill execution logged immutably',
  },
];

export const ENTERPRISE_FEATURES: EnterpriseFeature[] = [
  { name: 'Admin Console', icon: '\uD83D\uDEE0\uFE0F', desc: 'Centralized workspace management \u2014 teams, roles, policies, and usage analytics in one governed dashboard' },
  { name: 'SSO Integration', icon: '\uD83D\uDD10', desc: 'SAML 2.0 and OIDC single sign-on with governed identity provider configuration and session management' },
  { name: 'Data Retention Policies', icon: '\uD83D\uDCC5', desc: 'Configurable retention windows for threads, memories, proof chains, and replay data \u2014 compliance-ready' },
  { name: 'Usage Analytics', icon: '\uD83D\uDCCA', desc: 'Real-time dashboards for model usage, token consumption, agent activity, and governance compliance metrics' },
  { name: 'Custom Model Routing', icon: '\uD83D\uDD00', desc: 'Enterprise-specific model routing policies \u2014 route by sensitivity, cost, latency, or compliance requirement' },
  { name: 'Audit Log Export', icon: '\uD83D\uDCE4', desc: 'Export proof chain and governance logs to SIEM, compliance systems, or data warehouses \u2014 real-time streaming' },
  { name: 'IP Allowlisting', icon: '\uD83C\uDF10', desc: 'Restrict access by IP range, VPN, or network policy \u2014 governed access control at the network layer' },
  { name: 'Dedicated Compute', icon: '\u2601\uFE0F', desc: 'Isolated compute environments for enterprise workloads \u2014 no shared infrastructure, governed resource allocation' },
];

export const CATEGORIES = ['All', 'Engineering', 'Front-end', 'iOS', 'macOS', 'Automation', 'Data', 'Integrations', 'Knowledge'];

export const COLLECTIONS = [
  { name: 'Production Systems', desc: 'Navigate real codebases, make controlled changes, codify repeatable work \u2014 governed', icon: '\uD83C\uDFD7\uFE0F', count: 8 },
  { name: 'Productivity & Collaboration', desc: 'Analyze data, combine services, turn insights into action \u2014 proof-chained', icon: '\uD83E\uDD1D', count: 7 },
  { name: 'Web Development', desc: 'Turn design inputs into responsive UI, iterate with scoped changes \u2014 governed', icon: '\uD83C\uDF10', count: 5 },
  { name: 'Native Development', desc: 'Build for iOS, Android, and macOS, refactor native UI, expose app actions \u2014 governed', icon: '\uD83D\uDCF1', count: 8 },
  { name: 'Game Development', desc: 'Develop games from first playable loop to production quality \u2014 governed', icon: '\uD83C\uDFAE', count: 3 },
  { name: 'Cognitive Forecasting', desc: 'Predict outcomes before execution \u2014 code quality, delivery, costs, security', icon: '\uD83D\uDD2E', count: 8 },
  { name: 'Enterprise & Compliance', desc: 'Admin console, SSO, audit logs, data retention, IP allowlisting \u2014 governed', icon: '\uD83C\uDFE2', count: 8 },
  { name: 'Platform Capabilities', desc: 'Worktrees, automations, cloud threads, IDE sync, actions, browser \u2014 governed', icon: '\u2699\uFE0F', count: 12 },
];

export const BENCHMARKS = [
  { framework: 'a11oy Code', score: 94.2, governed: true, multiAgent: true, proofChain: true, forecast: true, memory: true, multiModel: true },
  { framework: 'OpenAI Codex', score: 91.8, governed: false, multiAgent: true, proofChain: false, forecast: false, memory: true, multiModel: false },
  { framework: 'Claude Code', score: 89.1, governed: false, multiAgent: false, proofChain: false, forecast: false, memory: false, multiModel: false },
  { framework: 'Cursor', score: 86.4, governed: false, multiAgent: false, proofChain: false, forecast: false, memory: false, multiModel: true },
  { framework: 'Devin', score: 82.7, governed: false, multiAgent: true, proofChain: false, forecast: false, memory: false, multiModel: false },
  { framework: 'Windsurf', score: 81.3, governed: false, multiAgent: false, proofChain: false, forecast: false, memory: false, multiModel: false },
];

export const CODEX_TOTALS = {
  useCases: USE_CASES.length,
  memoryTiers: MEMORY_TIERS.length,
  forecastDomains: FORECAST_DOMAINS.length,
  innovations: RESEARCH_INNOVATIONS.length,
  collections: COLLECTIONS.length,
  platformCapabilities: PLATFORM_CAPABILITIES.length,
  enterpriseFeatures: ENTERPRISE_FEATURES.length,
};
