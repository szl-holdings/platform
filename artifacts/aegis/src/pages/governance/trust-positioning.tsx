import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  FileText,
  Info,
  Lock,
  Shield,
  TrendingUp,
} from 'lucide-react';

const ENVIRONMENT_LABELS = [
  {
    env: 'Demo',
    color: '#f59e0b',
    bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    description:
      'Seeded data, scripted scenario, representative capabilities. Not connected to live systems unless explicitly stated.',
    when: 'Used for: sales demos, prospect walkthroughs, conference presentations',
  },
  {
    env: 'Pilot',
    color: '#3b82f6',
    bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    description:
      'Real customer environment, real data, limited blast radius. Some integrations may be in hook-ready state pending customer config.',
    when: 'Used for: enterprise pilots, proof-of-value engagements, early adopter deployments',
  },
  {
    env: 'Production',
    color: '#22c55e',
    bg: 'bg-green-500/10 text-green-400 border-green-500/30',
    description:
      'Full deployment. All integrations configured, SSO active, SCIM provisioned, SLAs in effect.',
    when: 'Used for: contracted production deployments with signed agreements and support SLAs',
  },
];

const CURRENT_CAPABILITIES = [
  'Approval-aware response orchestration (four execution modes)',
  'Tool registry with full audit trail per call',
  'High-risk action gating — approval required before execution',
  'Cross-tenant isolation — enforced at query level',
  'Schema validation on all tool outputs',
  'Retrieval confidence scoring on all RAG responses',
  'Operator analytics dashboard (real-time)',
  'Incident analytics — MTTD, MTTR, escalation rate',
  'Trust analytics — schema rate, retrieval miss rate, override rate',
  'Enterprise RBAC — 7 role types, tenant-scoped',
  'Audit log — every action, immutable, timestamped',
  'Retention policies enforced',
  'Executive report generation — 8 report types',
  'Integration hub — 9 connectors (Slack, email connected; others hook-ready)',
  'Policy templates — 5 built-in templates',
  'Mobile companion — incident alerts, approval queue, executive digest',
  'Canonical demo — 10-step end-to-end demonstrable',
];

const FUTURE_ROADMAP = [
  'Full SOC 2 Type II audit (in planning — timeline: 12-18 months)',
  'ISO 27001 certification (in planning — timeline: 18-24 months)',
  'Live external threat intel feed ingestion (hook points in Phase 3; full ingestion in future release)',
  'Full production SSO/SCIM with all major IdPs out-of-box (Phase 3 provides SAML/OIDC hook points)',
  'Automated playbook execution without human approval for pre-approved action classes (requires customer policy agreement)',
  'Multi-region deployment with data residency controls',
  'Real-time MITRE ATT&CK navigator integration with live detection mapping',
];

const TRUST_PROHIBITIONS = [
  'We do not claim certifications we have not achieved',
  "We do not use 'military-grade' without specifying the exact standard",
  'We do not demo capabilities that are not built and demonstrable',
  'We do not present future roadmap features as current capabilities',
  'We do not hide AI limitations or retrieval failures from operators',
  'We do not claim zero hallucination — we measure and publish our rates',
  'We do not allow cross-tenant data access — this is enforced, not just promised',
  'We do not generate reports without evidence citations and confidence labels',
];

const SECURITY_POSTURE_ITEMS = [
  {
    control: 'Data encryption in transit',
    status: 'implemented',
    evidence: 'TLS 1.3 enforced on all API endpoints',
  },
  {
    control: 'Data encryption at rest',
    status: 'implemented',
    evidence: 'AES-256 for database and evidence store',
  },
  {
    control: 'RBAC enforcement',
    status: 'implemented',
    evidence: 'Server-side, not client-side; all routes guarded',
  },
  {
    control: 'Tenant isolation',
    status: 'implemented',
    evidence: 'All DB queries are tenant-scoped; cross-tenant blocked at query level',
  },
  {
    control: 'Audit logging',
    status: 'implemented',
    evidence: 'Immutable audit trail for every action; retention enforced',
  },
  {
    control: 'Secrets management',
    status: 'implemented',
    evidence:
      'No secrets in source code; secrets managed via platform environment vault (not hardcoded)',
  },
  {
    control: 'Dependency audit',
    status: 'pilot',
    evidence: 'Dependency scanning available; automated SAST pipeline not yet configured in CI',
  },
  {
    control: 'Penetration testing',
    status: 'planned',
    evidence: 'Scheduled for pre-production — not yet completed',
  },
  {
    control: 'SOC 2 Type II',
    status: 'planned',
    evidence: 'In planning — no audit completed or claims made',
  },
  { control: 'ISO 27001', status: 'planned', evidence: 'In planning — no certification yet' },
];

export default function TrustPositioningPage() {
  return (
    <div className="min-h-screen bg-[#07090d] text-white p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Shield size={22} className="text-amber-400" />
            <h1 className="text-xl font-bold text-white font-mono tracking-tight">
              Trust & Security Posture
            </h1>
          </div>
          <p className="text-xs text-[#8b9ab0] font-mono">
            Honest current-state assessment · No overstated capabilities · Demo / Pilot / Production
            labeled
          </p>
        </div>

        <div className="bg-amber-400/10 border border-amber-400/30 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <Info size={16} className="text-amber-400 mt-0.5 shrink-0" />
            <div className="space-y-2">
              <p className="text-sm font-semibold text-amber-300">Our Trust Commitment</p>
              <p className="text-xs text-amber-200/80 font-mono leading-relaxed">
                Aegis is in <strong>production-ready pilot</strong> stage. Everything on this page
                reflects honest current state. We separate current capabilities from roadmap
                clearly. We publish our AI trust metrics — schema validity rate, retrieval miss
                rate, unsupported claim rate — because hiding them would undermine the trust we're
                building.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-white font-mono uppercase tracking-widest">
            Environment Labels
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ENVIRONMENT_LABELS.map((e) => (
              <div key={e.env} className={`border rounded-xl p-4 space-y-2 ${e.bg}`}>
                <div className="text-base font-bold font-mono">{e.env}</div>
                <p className="text-xs leading-relaxed opacity-90">{e.description}</p>
                <p className="text-xs opacity-60 italic">{e.when}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-white font-mono uppercase tracking-widest flex items-center gap-2">
            <CheckCircle2 size={14} className="text-green-400" /> Current Capabilities (Built &
            Demonstrable)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {CURRENT_CAPABILITIES.map((c) => (
              <div
                key={c}
                className="flex items-start gap-2 p-2.5 bg-[#0d1117] border border-green-500/20 rounded-lg"
              >
                <CheckCircle2 size={12} className="text-green-400 mt-0.5 shrink-0" />
                <p className="text-xs text-white">{c}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-white font-mono uppercase tracking-widest flex items-center gap-2">
            <Clock size={14} className="text-amber-400" /> Roadmap (Not Yet Available)
          </h2>
          <div className="space-y-2">
            {FUTURE_ROADMAP.map((r) => (
              <div
                key={r}
                className="flex items-start gap-2 p-2.5 bg-[#0d1117] border border-amber-500/20 rounded-lg"
              >
                <Clock size={12} className="text-amber-400 mt-0.5 shrink-0" />
                <p className="text-xs text-[#8b9ab0]">{r}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-white font-mono uppercase tracking-widest flex items-center gap-2">
            <Lock size={14} className="text-red-400" /> What We Do Not Do
          </h2>
          <div className="space-y-2">
            {TRUST_PROHIBITIONS.map((p) => (
              <div
                key={p}
                className="flex items-start gap-2 p-2.5 bg-[#0d1117] border border-red-500/20 rounded-lg"
              >
                <AlertTriangle size={12} className="text-red-400 mt-0.5 shrink-0" />
                <p className="text-xs text-white">{p}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-white font-mono uppercase tracking-widest flex items-center gap-2">
            <Eye size={14} className="text-blue-400" /> Security Control Posture
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-[#1e2a3a]">
                  {['Control', 'Status', 'Evidence'].map((h) => (
                    <th
                      key={h}
                      className="text-left text-[#8b9ab0] pb-2 pr-4 font-normal uppercase tracking-widest"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0d1117]">
                {SECURITY_POSTURE_ITEMS.map((item) => (
                  <tr key={item.control} className="hover:bg-[#0d1117] transition-colors">
                    <td className="py-2.5 pr-4 text-white">{item.control}</td>
                    <td className="py-2.5 pr-4">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold ${
                          item.status === 'implemented'
                            ? 'bg-green-500/20 text-green-400'
                            : item.status === 'pilot'
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {item.status === 'implemented'
                          ? 'Implemented'
                          : item.status === 'pilot'
                            ? 'Pilot'
                            : 'Planned'}
                      </span>
                    </td>
                    <td className="py-2.5 text-[#8b9ab0]">{item.evidence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex gap-4">
          <a
            href="/gov/governance"
            className="flex items-center gap-1.5 text-xs text-amber-400 font-mono hover:text-amber-300 transition-colors"
          >
            <FileText size={12} /> Identity & Access Management <ExternalLink size={10} />
          </a>
          <a
            href="/gov/governance"
            className="flex items-center gap-1.5 text-xs text-amber-400 font-mono hover:text-amber-300 transition-colors"
          >
            <FileText size={12} /> Governance Summary <ExternalLink size={10} />
          </a>
          <a
            href="/gov/trust-analytics"
            className="flex items-center gap-1.5 text-xs text-amber-400 font-mono hover:text-amber-300 transition-colors"
          >
            <FileText size={12} /> Trust Analytics <ExternalLink size={10} />
          </a>
        </div>
      </div>
    </div>
  );
}
