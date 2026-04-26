import { Button } from '@szl-holdings/shared-ui/ui/button';
import { motion } from 'framer-motion';
import {
  Activity,
  Anchor,
  ArrowRight,
  BrainCircuit,
  Briefcase,
  Building2,
  CheckCircle2,
  Command as CmdIcon,
  Database,
  Gavel,
  Globe,
  Lock,
  Shield,
  ShieldCheck,
  Users,
  Zap,
} from 'lucide-react';
import { Link, useParams } from 'wouter';
import { MarketingFooter } from '../../../components/marketing/MarketingFooter';
import { MarketingNav } from '../../../components/marketing/MarketingNav';

const appData = {
  terra: {
    name: 'DOMAINE',
    tagline: 'Real Estate Intelligence',
    color: 'text-[#40856a]',
    accentHex: '#40856a',
    bgGradient: 'from-[#40856a]/20',
    icon: Building2,
    description:
      'Evidence-backed property analytics, market forecasting, and deal pipeline management for institutional real estate investors.',
    longDescription:
      'DOMAINE aggregates geospatial signals, public record data, and proprietary market feeds to give institutional investors a comprehensive picture of any asset—before they commit capital. From underwriting to asset management, the entire real estate lifecycle lives in a single command interface.',
    features: [
      {
        title: 'Market Forecasting',
        desc: 'Predictive models for property value trajectories, cap rate compression, and rental yield forecasts at granular ZIP-code level. Updated daily from 500+ data sources.',
      },
      {
        title: 'Deal Pipeline',
        desc: 'Unified underwriting workspace with AI-generated OMs, DCF models, and risk-adjusted return scenarios. Collaborate with partners in real time with versioned documents.',
      },
      {
        title: 'Risk Assessment',
        desc: 'Automated macro and micro risk evaluation covering climate exposure, market liquidity, tenant concentration, and regulatory risk. Exportable for LP reporting.',
      },
    ],
    integrations: ['CoStar', 'LoopNet', 'Yardi', 'MRI Software', 'ARGUS Enterprise', 'Salesforce'],
    useCases: [
      {
        title: 'Portfolio Rebalancing',
        desc: 'Identify underperforming assets and surface reallocation opportunities across markets in real time.',
      },
      {
        title: 'Acquisition Due Diligence',
        desc: 'Generate Governed property reports with comps, zoning history, and market trend summaries in under 30 seconds.',
      },
      {
        title: 'Asset Management Dashboards',
        desc: 'Monitor NOI, occupancy, and DSCR across your entire portfolio on one screen with variance alerting.',
      },
    ],
    stats: [
      { v: '12B+', l: 'Data points indexed' },
      { v: '3.2s', l: 'Avg. report generation' },
      { v: '94%', l: 'Forecast accuracy (12mo)' },
    ],
  },
  vessels: {
    name: 'SEXTANT',
    tagline: 'Fleet Command',
    color: 'text-[#0ea5e9]',
    accentHex: '#0ea5e9',
    bgGradient: 'from-[#0ea5e9]/20',
    icon: Anchor,
    description:
      'Real-time AIS tracking, predictive maintenance, and route optimization for modern maritime operations.',
    longDescription:
      'SEXTANT unifies global AIS feeds, IoT sensor streams, and weather routing algorithms into a single operational picture for fleet operators. Whether you run 3 vessels or 300, SEXTANT scales to your operational tempo.',
    features: [
      {
        title: 'Real-time AIS Tracking',
        desc: 'Global AIS integration with sub-second update latency. Track position, speed, heading, and ETA across your entire fleet on a live nautical chart with historical playback.',
      },
      {
        title: 'Route Optimization',
        desc: 'AI-driven routing engine that factors in weather, fuel prices, port congestion, and canal availability to compute the lowest-cost, safest transit routes.',
      },
      {
        title: 'Predictive Maintenance',
        desc: 'IoT sensor fusion across engines, propellers, and hull systems feeds ML models that predict component failure up to 14 days in advance, reducing unplanned downtime by 60%.',
      },
    ],
    integrations: [
      'MarineTraffic',
      'exactEarth',
      'Kpler',
      'Datalastic',
      "Lloyd's List Intelligence",
      'SAP',
    ],
    useCases: [
      {
        title: 'Cargo ETA Optimization',
        desc: 'Cut average transit delays by dynamically re-routing vessels based on real-time port congestion data.',
      },
      {
        title: 'Crew Safety Monitoring',
        desc: 'Integrate weather alerts and sea state data to automatically enforce safe operating thresholds.',
      },
      {
        title: 'Bunker Management',
        desc: 'Automate fuel procurement decisions using predictive consumption models and live price feeds.',
      },
    ],
    stats: [
      { v: '180K+', l: 'Vessels tracked globally' },
      { v: '<1s', l: 'AIS update latency' },
      { v: '60%', l: 'Downtime reduction' },
    ],
  },
  lyte: {
    name: 'KORA',
    tagline: 'AIOps Command',
    color: 'text-[#d4a054]',
    accentHex: '#d4a054',
    bgGradient: 'from-[#d4a054]/20',
    icon: Activity,
    description:
      'Autonomous incident detection, ML-driven root cause analysis, and SRE automation for complex distributed systems.',
    longDescription:
      "KORA eliminates the MTTD/MTTR grind by continuously learning your system's normal operating envelope and triggering enriched alerts the instant something deviates—with root cause and suggested remediation already attached.",
    features: [
      {
        title: 'Autonomous Detection',
        desc: 'Multivariate anomaly detection across metrics, logs, and traces identifies degradation 8x faster than threshold-based alerting, with a 90% reduction in alert noise.',
      },
      {
        title: 'Root Cause Analysis',
        desc: 'Topology-aware event correlation traces causality chains across services in under 10 seconds. Never hunt through dashboards during an incident again.',
      },
      {
        title: 'Automated Remediation',
        desc: 'Pre-approved playbooks execute containment, scaling, and rollback actions automatically when confidence thresholds are met, resolving 40% of incidents with zero human intervention.',
      },
    ],
    integrations: ['Datadog', 'PagerDuty', 'AWS CloudWatch', 'Prometheus', 'Grafana', 'Kubernetes'],
    useCases: [
      {
        title: 'SRE Toil Reduction',
        desc: 'Automate repetitive on-call tasks so SREs can focus on engineering work that improves reliability.',
      },
      {
        title: 'Deployment Safety',
        desc: 'Automatically canary new deployments and roll back on detected regression—no runbooks needed.',
      },
      {
        title: 'Capacity Planning',
        desc: 'Use ML forecasts to right-size infrastructure 30 days in advance before issues emerge.',
      },
    ],
    stats: [
      { v: '8x', l: 'Faster detection' },
      { v: '90%', l: 'Alert noise reduction' },
      { v: '40%', l: 'Auto-resolved incidents' },
    ],
  },
  aegis: {
    name: 'PARAGON',
    tagline: 'Defense & Intelligence',
    color: 'text-[#3b82f6]',
    accentHex: '#3b82f6',
    bgGradient: 'from-[#3b82f6]/20',
    icon: Shield,
    description:
      'Unified threat intelligence, SOC command, and incident response orchestration for national security and enterprise defense.',
    longDescription:
      'PARAGON ingests threat intelligence from 900+ OSINT, dark web, and ISACs feeds and correlates them with your internal telemetry to give SOC analysts a real-time, ranked picture of active threats—with enriched context and one-click response workflows.',
    features: [
      {
        title: 'Threat Intelligence Fusion',
        desc: 'Real-time fusion of 900+ threat intelligence feeds, STIX/TAXII compatible. Automatically correlates indicators to your internal assets and surfaces highest-priority threats.',
      },
      {
        title: 'SOC Command Center',
        desc: 'Unified analyst workspace with queue management, case collaboration, and integrated SIEM/SOAR. Replaces 5-7 point solutions with a single purpose-built interface.',
      },
      {
        title: 'Response Orchestration',
        desc: 'Playbook-driven response automation executes containment, evidence collection, and stakeholder notification with full audit trails compliant with NIST CSF and ISO 27001.',
      },
    ],
    integrations: [
      'Splunk',
      'CrowdStrike',
      'Palo Alto APEX',
      'Microsoft Sentinel',
      'MISP',
      'VirusTotal',
    ],
    useCases: [
      {
        title: 'Threat Hunting',
        desc: 'Query across years of telemetry in seconds using threat-hunting notebooks powered by adversary TTPs.',
      },
      {
        title: 'Vulnerability Prioritization',
        desc: 'Automatically correlate CVEs to your asset inventory and threat actor exploitation likelihood.',
      },
      {
        title: 'Compliance Reporting',
        desc: 'Generate NIST, SOC 2, and ISO 27001 compliance artifacts directly from response records.',
      },
    ],
    stats: [
      { v: '900+', l: 'Intel feeds integrated' },
      { v: '2 min', l: 'Mean time to detect' },
      { v: '99.98%', l: 'Platform uptime' },
    ],
  },
  prism: {
    name: 'Counsel',
    tagline: 'Legal Intelligence',
    color: 'text-[#f59e0b]',
    accentHex: '#f59e0b',
    bgGradient: 'from-[#f59e0b]/20',
    icon: Gavel,
    description:
      'Matter lifecycle management, contract analysis, and risk assessment powered by legal-specific large language models.',
    longDescription:
      'Counsel is built for legal and compliance teams that need to move at the speed of the business. From NDA review to M&A due diligence, PRISM reduces legal cycle times by 70% while improving risk identification accuracy.',
    features: [
      {
        title: 'Contract Analysis',
        desc: 'Instant extraction of obligations, key dates, liability caps, and risk clauses using legal-domain LLMs fine-tuned on 50M+ commercial agreements. Flags non-standard clauses automatically.',
      },
      {
        title: 'Matter Lifecycle',
        desc: 'End-to-end matter management: intake, budget tracking, outside counsel management, and closure reports. Integrations with leading billing platforms reduce matter admin time by 60%.',
      },
      {
        title: 'Precedent Search',
        desc: "Semantic search across your entire matters database surfaces relevant precedent in seconds. Stop recreating work that already exists in your organization's institutional memory.",
      },
    ],
    integrations: ['Clio', 'NetSuite', 'DocuSign', 'iManage', 'Relativity', 'LexisNexis'],
    useCases: [
      {
        title: 'M&A Due Diligence',
        desc: 'Review 10,000+ documents in hours rather than weeks with Governed contract abstraction and risk flagging.',
      },
      {
        title: 'Regulatory Compliance',
        desc: 'Continuously monitor contracts against evolving regulatory requirements and get alerted to compliance gaps.',
      },
      {
        title: 'Outside Counsel Management',
        desc: 'Track billing, scope, and performance of external law firms against agreed budgets in real time.',
      },
    ],
    stats: [
      { v: '70%', l: 'Cycle time reduction' },
      { v: '50M+', l: 'Agreements analyzed' },
      { v: '99.5%', l: 'Clause accuracy' },
    ],
  },
  'szl-holdings': {
    name: 'SZL Holdings',
    tagline: 'Executive Command',
    color: 'text-[#b8bfcb]',
    accentHex: '#b8bfcb',
    bgGradient: 'from-[#b8bfcb]/20',
    icon: Briefcase,
    description:
      'Portfolio intelligence, KPI command, and strategic briefings for the C-suite and board of directors.',
    longDescription:
      'SZL Holdings aggregates signals from every operating company in the portfolio and surfaces what matters most to executive leadership—without noise. From board packets to daily KPI dashboards, the executive command layer runs on SZL.',
    features: [
      {
        title: 'Portfolio Intelligence',
        desc: 'Aggregated financials, KPIs, and operational metrics across every operating company. Drill from portfolio summary to line-level transaction in two clicks.',
      },
      {
        title: 'KPI Command',
        desc: 'Real-time leading indicators and variance analysis with automated alerts when metrics deviate from plan. OKR tracking integrated with strategic planning documents.',
      },
      {
        title: 'Strategic Briefings',
        desc: 'AI-generated executive briefings and board-ready reports synthesized from live data. Reduce deck preparation time from days to minutes.',
      },
    ],
    integrations: [
      'QuickBooks Enterprise',
      'Netsuite',
      'Workday',
      'Salesforce',
      'Tableau',
      'Power BI',
    ],
    useCases: [
      {
        title: 'Board Preparation',
        desc: 'Generate board packets from live portfolio data in one click, with variance explanations pre-written.',
      },
      {
        title: 'Capital Allocation',
        desc: 'Surface investment opportunities and risk signals across the portfolio with cross-company benchmarking.',
      },
      {
        title: 'Subsidiary Performance',
        desc: 'Monitor subsidiary KPIs with automated variance alerts and drill-down root cause analysis.',
      },
    ],
    stats: [
      { v: '9', l: 'Integrated platforms' },
      { v: '< 60s', l: 'Board packet generation' },
      { v: 'Real-time', l: 'Consolidated financials' },
    ],
  },
  'carlota-jo': {
    name: 'Carlota Jo',
    tagline: 'Consulting Platform',
    color: 'text-pink-400',
    accentHex: '#e879f9',
    bgGradient: 'from-pink-500/20',
    icon: BrainCircuit,
    description:
      'Client engagement, strategy sessions, and portfolio advisory powered by intelligent collaboration tools.',
    longDescription:
      'Carlota Jo is the operating platform for advisory and consulting practices that demand a premium client experience. From first engagement to ongoing retainer, every client touchpoint is orchestrated through a secure, branded intelligence layer.',
    features: [
      {
        title: 'Secure Client Portals',
        desc: 'White-labeled, MFA-protected portals give each client a curated view of their project status, deliverables, and strategic recommendations with full audit logging.',
      },
      {
        title: 'Strategy Session Tools',
        desc: 'Collaborative whiteboarding, real-time document co-authoring, and AI-facilitated brainstorming sessions with auto-generated session summaries.',
      },
      {
        title: 'Portfolio Advisory',
        desc: "Data-driven performance tracking, scenario modeling, and recommendation engines tailored to each client's strategic objectives and risk tolerance.",
      },
    ],
    integrations: ['Salesforce', 'HubSpot', 'Notion', 'Zoom', 'DocuSign', 'Stripe'],
    useCases: [
      {
        title: 'Retainer Management',
        desc: 'Track hours, deliverables, and outcomes for retainer clients with automated reporting and renewal workflows.',
      },
      {
        title: 'Proposal Generation',
        desc: 'Generate data-backed proposals from templates and client intelligence in under 15 minutes.',
      },
      {
        title: 'Executive Briefings',
        desc: 'Deliver real-time strategic briefings to client executives backed by quantitative analysis.',
      },
    ],
    stats: [
      { v: '200+', l: 'Active client engagements' },
      { v: '15min', l: 'Proposal generation' },
      { v: '4.9★', l: 'Client satisfaction' },
    ],
  },
  stephen: {
    name: 'Stephen',
    tagline: 'Personal Command',
    color: 'text-indigo-400',
    accentHex: '#818cf8',
    bgGradient: 'from-indigo-500/20',
    icon: Users,
    description:
      'Executive personal intelligence, schedule command, and life analytics for high-performance individuals.',
    longDescription:
      'Stephen is the private command interface for the individual executive. Your calendar, health data, private documents, and personal intelligence streams converge in a zero-knowledge, end-to-end encrypted environment that answers only to you.',
    features: [
      {
        title: 'Schedule Command',
        desc: 'AI-optimized calendar management with meeting prep briefs auto-generated for each event, smart scheduling suggestions, and focus time protection.',
      },
      {
        title: 'Life Analytics',
        desc: 'Quantified self metrics unified across wearables, health apps, and activity logs. Correlate sleep, fitness, and cognitive performance with work outcomes over time.',
      },
      {
        title: 'Private Intelligence Vault',
        desc: 'Zero-knowledge encrypted repository for sensitive personal documents, private communications, and personal data with biometric access control.',
      },
    ],
    integrations: [
      'Apple Health',
      'Garmin Connect',
      'Google Calendar',
      'Outlook',
      'Notion',
      '1Password',
    ],
    useCases: [
      {
        title: 'Executive Readiness',
        desc: 'Arrive at every meeting fully briefed with AI-generated context on attendees, agenda, and relevant background material.',
      },
      {
        title: 'Personal Performance',
        desc: 'Track and optimize the inputs to cognitive and physical performance with longitudinal trend analysis.',
      },
      {
        title: 'Document Vault',
        desc: 'Store, search, and surface sensitive personal documents with enterprise-grade encryption and granular access controls.',
      },
    ],
    stats: [
      { v: 'E2E', l: 'Encrypted by default' },
      { v: '0', l: 'Data shared with third parties' },
      { v: 'Zero-knowledge', l: 'Architecture' },
    ],
  },
  command: {
    name: 'Command Portal',
    tagline: 'Ecosystem Orchestration',
    color: 'text-purple-400',
    accentHex: '#8b7ac8',
    bgGradient: 'from-purple-500/20',
    icon: CmdIcon,
    description:
      'Cross-platform intelligence, unified command, and real-time pulse monitoring across the entire SZL ecosystem.',
    longDescription:
      'The Command Portal is where all nine SZL platforms converge. Cross-domain intelligence signals are correlated, prioritized, and surfaced here, giving leadership a real-time operational picture of the entire enterprise—accessible from a single, unified interface.',
    features: [
      {
        title: 'Unified Cross-Domain Command',
        desc: 'Single pane of glass across all 9 platforms. Surface correlated signals, drill into any domain, and execute actions without switching context.',
      },
      {
        title: 'Real-time Ecosystem Pulse',
        desc: "Live health, activity streams, and key metrics from every platform flow into the Command Portal's situational awareness layer, updated in sub-second intervals.",
      },
      {
        title: 'Cross-Platform Intelligence',
        desc: 'Proprietary knowledge graph connects entities across domains—a vessel, a real estate asset, a legal matter—revealing second-order risks and opportunities no siloed tool can see.',
      },
    ],
    integrations: [
      'All SZL Platforms',
      'REST API',
      'Webhooks',
      'GraphQL',
      'SAML/SSO',
      'Custom Integrations',
    ],
    useCases: [
      {
        title: 'Executive Situational Awareness',
        desc: 'Leadership sees the consolidated operational picture in real time without needing to check multiple systems.',
      },
      {
        title: 'Cross-Domain Risk Management',
        desc: 'Correlate signals from maritime, legal, and financial platforms to identify compounding risks before they cascade.',
      },
      {
        title: 'Automation Hub',
        desc: "Build cross-platform automation workflows using the Command Portal's orchestration engine and pre-built connectors.",
      },
    ],
    stats: [
      { v: '9', l: 'Platforms unified' },
      { v: '<100ms', l: 'Cross-platform query latency' },
      { v: '∞', l: 'Integration potential' },
    ],
  },
};

const TRUST_BADGES = [
  { icon: ShieldCheck, label: 'SOC 2 Type II' },
  { icon: Lock, label: 'GDPR Compliant' },
  { icon: Database, label: 'E2E Encrypted' },
  { icon: Globe, label: '99.97% Uptime' },
];

export function MarketingAppPage() {
  const { id } = useParams();
  const app = appData[id as keyof typeof appData];

  if (!app) {
    return (
      <div className="min-h-[100dvh] bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Platform Not Found</h1>
          <Link href="/marketing">
            <Button variant="outline" className="border-white/20 text-white">
              Return to Ecosystem
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const Icon = app.icon;
  const accent = app.accentHex;

  return (
    <div className="min-h-[100dvh] bg-black text-white font-sans">
      <MarketingNav />

      {/* Hero */}
      <section className="relative pt-40 pb-28 overflow-hidden border-b border-white/[0.04]">
        <div
          className={`absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] ${app.bgGradient} via-black to-black -z-10`}
        />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="flex-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div
                  className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-white/5 border border-white/10 mb-8 backdrop-blur-sm ${app.color}`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {app.tagline}
                </div>

                <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 leading-[1.05]">
                  {app.name}
                </h1>

                <p className="text-lg text-white/55 max-w-xl mb-3 font-light leading-relaxed">
                  {app.description}
                </p>
                <p className="text-sm text-white/35 max-w-xl mb-10 leading-relaxed">
                  {app.longDescription}
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/marketing/signup">
                    <Button
                      size="lg"
                      className="h-12 px-7 bg-white text-black hover:bg-white/90 font-medium w-full sm:w-auto"
                    >
                      Start Free Trial <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                  <Link href="/marketing/pricing">
                    <Button
                      size="lg"
                      variant="outline"
                      className="h-12 px-7 border-white/20 text-white hover:bg-white/5 w-full sm:w-auto"
                    >
                      View Pricing
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </div>

            {/* Visual panel */}
            <div className="flex-1 w-full">
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.15 }}
                className="aspect-[4/3] rounded-2xl bg-white/[0.02] border border-white/[0.06] relative overflow-hidden flex items-center justify-center"
              >
                <div
                  className="absolute inset-0 opacity-10"
                  style={{
                    background: `radial-gradient(ellipse at top right, ${accent}50, transparent 70%)`,
                  }}
                />
                <Icon className="w-24 h-24 opacity-10" style={{ color: accent }} />
                {/* Mock UI elements */}
                <div className="absolute top-6 left-6 right-6 h-7 bg-white/[0.04] rounded border border-white/[0.06]" />
                <div className="absolute top-16 left-6 w-[30%] h-28 bg-white/[0.03] rounded border border-white/[0.05]" />
                <div className="absolute top-16 left-[calc(30%+1.75rem)] right-6 h-28 bg-white/[0.03] rounded border border-white/[0.05]" />
                <div className="absolute bottom-6 left-6 right-6 h-16 bg-white/[0.03] rounded border border-white/[0.05]" />
                {/* Stats floating */}
                <div className="absolute top-20 left-9 space-y-1.5">
                  {app.stats.slice(0, 2).map((s, i) => (
                    <div key={i} className="text-left">
                      <div className="text-lg font-bold" style={{ color: accent }}>
                        {s.v}
                      </div>
                      <div className="text-[10px] text-white/30">{s.l}</div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Stat pills */}
              <div className="flex gap-3 mt-4 flex-wrap">
                {app.stats.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]"
                  >
                    <Zap className="w-3 h-3 text-white/25" />
                    <span className="text-xs font-bold" style={{ color: accent }}>
                      {s.v}
                    </span>
                    <span className="text-xs text-white/35">{s.l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-24 border-b border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-14">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              Core Capabilities
            </h2>
            <p className="text-white/50 text-lg font-light">
              Purpose-built for the {app.tagline.toLowerCase()} domain.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {app.features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-7 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.03] transition-colors"
              >
                <CheckCircle2 className="w-6 h-6 mb-5" style={{ color: accent }} />
                <h3 className="text-lg font-semibold mb-2 tracking-tight">{f.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-24 bg-zinc-950 border-b border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              How Teams Use {app.name}
            </h2>
            <p className="text-white/50 font-light">
              Real-world applications across the {app.tagline.toLowerCase()} lifecycle.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {app.useCases.map((uc, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="p-6 rounded-xl border border-white/[0.06] bg-white/[0.015] hover:bg-white/[0.03] transition-colors"
              >
                <div
                  className="text-xs font-bold uppercase tracking-widest mb-3"
                  style={{ color: accent }}
                >
                  Use Case {i + 1}
                </div>
                <h4 className="font-semibold text-white/90 mb-2 text-sm">{uc.title}</h4>
                <p className="text-xs text-white/45 leading-relaxed">{uc.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="py-24 border-b border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-10">
            <h2 className="text-2xl font-bold tracking-tight mb-2">Integrations</h2>
            <p className="text-white/45 text-sm">Connects with the tools your team already uses.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {app.integrations.map((integration, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="px-4 py-2 rounded-lg border border-white/[0.08] bg-white/[0.02] text-sm text-white/65 font-medium hover:border-white/20 hover:text-white/80 transition-colors"
              >
                {integration}
              </motion.div>
            ))}
            <div className="px-4 py-2 rounded-lg border border-white/[0.04] bg-white/[0.01] text-sm text-white/30">
              + Custom REST & webhook integrations
            </div>
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="py-16 bg-zinc-950 border-b border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-wrap gap-5 items-center justify-center md:justify-start">
            {TRUST_BADGES.map(({ icon: BadgeIcon, label }, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.07] bg-white/[0.02] text-sm text-white/50"
              >
                <BadgeIcon className="w-4 h-4 text-white/30" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 relative overflow-hidden text-center">
        <div
          className="absolute inset-0 opacity-10 -z-10"
          style={{ background: `radial-gradient(ellipse at center, ${accent}60, transparent 70%)` }}
        />
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Ready to deploy {app.name}?
          </h2>
          <p className="text-xl text-white/50 mb-10 font-light">
            Start your 14-day free trial. No credit card required.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/marketing/signup">
              <Button
                size="lg"
                className="h-12 px-8 bg-white text-black hover:bg-white/90 font-medium"
              >
                Start Free Trial
              </Button>
            </Link>
            <Link href="/marketing/pricing">
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-8 border-white/20 text-white hover:bg-white/5"
              >
                Compare Plans
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
