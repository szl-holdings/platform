import { useEffect, useState } from 'react';
import {
  AlertTriangle, CheckCircle2, Download, FileText, Filter,
  Printer, RefreshCw, Search, Shield, ShieldAlert
} from 'lucide-react';
import { cn } from '@szl-holdings/shared-ui/utils';
import { useSentraStore, ensureSeeded, type ReportType, type ReportRecord } from '@/lib/sentra-store';

const REPORT_TYPES: Array<{ type: ReportType; label: string; description: string; icon: typeof FileText; color: string; tags: string[] }> = [
  {
    type: 'executive_summary',
    label: 'Executive Summary',
    description: 'Non-technical incident overview for board, executive team, and stakeholders. Includes business impact framing.',
    icon: Shield,
    color: '#c9b787',
    tags: ['Board', 'CISO', 'Executive'],
  },
  {
    type: 'technical_incident',
    label: 'Technical Incident Report',
    description: 'Full technical detail — MITRE techniques, IOCs, affected systems, timeline, and actions taken.',
    icon: ShieldAlert,
    color: '#60a5fa',
    tags: ['SOC', 'Analyst', 'IR Team'],
  },
  {
    type: 'insurance',
    label: 'Insurance Report',
    description: 'Structured incident narrative with estimated financial impact for cyber insurance carriers.',
    icon: FileText,
    color: '#4ade80',
    tags: ['Insurance', 'Legal', 'Finance'],
  },
  {
    type: 'law_enforcement_referral',
    label: 'Law Enforcement Referral',
    description: 'FBI IC3 referral package with evidence manifest, CIRCIA trigger assessment, and machine-readable fields.',
    icon: AlertTriangle,
    color: '#e05252',
    tags: ['FBI IC3', 'CISA', 'CIRCIA'],
  },
  {
    type: 'post_incident_review',
    label: 'Post-Incident Review',
    description: 'Root cause analysis, timeline of events, and lessons learned for internal process improvement.',
    icon: RefreshCw,
    color: '#a78bfa',
    tags: ['IR Team', 'Engineering', 'GRC'],
  },
  {
    type: 'remediation_plan',
    label: 'Remediation Plan',
    description: 'Structured remediation tasks with owners, due dates, and acceptance criteria.',
    icon: CheckCircle2,
    color: '#f59e0b',
    tags: ['Engineering', 'SOC', 'CISO'],
  },
];

function ReportCard({ report, onDownload }: { report: ReportRecord; onDownload: (report: ReportRecord) => void }) {
  const [expanded, setExpanded] = useState(false);
  const typeConfig = REPORT_TYPES.find(t => t.type === report.type);
  const Icon = typeConfig?.icon ?? FileText;

  function downloadJSON() {
    onDownload(report);
    const blob = new Blob([JSON.stringify(report.content, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.id}_${report.type}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function printReport() {
    const w = window.open('', '_blank');
    if (!w) return;
    const c = report.content;
    w.document.write(`
      <html><head><title>${report.title}</title>
      <style>body{font-family:monospace;padding:2rem;max-width:800px;margin:0 auto;color:#111;}
      h1{font-size:1.5rem;border-bottom:2px solid #333;padding-bottom:0.5rem;}
      h2{font-size:1rem;color:#333;margin-top:1.5rem;}
      .meta{color:#555;font-size:0.85rem;margin-bottom:1rem;}
      ul{margin:0;padding-left:1.5rem;} li{margin-bottom:0.25rem;}
      .ev{font-size:0.8rem;font-family:monospace;background:#f5f5f5;padding:0.25rem 0.5rem;border-radius:3px;}</style>
      </head><body>
      <h1>${report.title}</h1>
      <div class="meta">Report ID: ${report.id} | Incident: ${c.incident_id} | Generated: ${new Date(report.generated_at).toLocaleString()} | By: ${report.generated_by}</div>
      <h2>Severity</h2><p>${c.severity?.toUpperCase()}</p>
      <h2>Detection Date</h2><p>${c.detection_date}</p>
      ${c.executive_summary ? `<h2>Executive Summary</h2><p>${c.executive_summary}</p>` : ''}
      <h2>Affected Assets</h2><ul>${c.affected_assets.map(a => `<li>${a}</li>`).join('')}</ul>
      <h2>Actions Taken</h2><ul>${c.actions_taken.map(a => `<li>${a}</li>`).join('')}</ul>
      <h2>Evidence Manifest</h2><ul>${c.evidence_manifest.map(e => `<li class="ev">${e.type}: ${e.id} | SHA-256: ${e.sha256}</li>`).join('')}</ul>
      ${c.root_cause ? `<h2>Root Cause</h2><p>${c.root_cause}</p>` : ''}
      ${c.lessons_learned ? `<h2>Lessons Learned</h2><ul>${c.lessons_learned.map(l => `<li>${l}</li>`).join('')}</ul>` : ''}
      ${c.remediation_tasks ? `<h2>Remediation Tasks</h2><ul>${c.remediation_tasks.map(t => `<li>${t.task} — Owner: ${t.owner} — Due: ${t.due}</li>`).join('')}</ul>` : ''}
      <h2>Policy Decisions</h2><ul>${c.policy_decisions.map(p => `<li>${p}</li>`).join('')}</ul>
      </body></html>`);
    w.document.close();
    w.print();
  }

  return (
    <div className={cn('rounded-lg border transition-all', expanded && 'border-[#c9b787]/15')}
      style={{ background: 'rgba(255,255,255,0.025)', borderColor: expanded ? undefined : 'rgba(255,255,255,0.08)' }}>
      <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setExpanded(x => !x)}>
        <Icon className="w-4 h-4 flex-shrink-0" style={{ color: typeConfig?.color ?? '#c9b787' }} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-slate-200">{report.title}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] font-mono text-slate-500">{report.id}</span>
            <span className="text-[10px] text-slate-600">·</span>
            <span className="text-[10px] font-mono text-slate-500">Incident: {report.incident_id}</span>
            <span className="text-[10px] text-slate-600">·</span>
            <span className="text-[10px] font-mono text-slate-600">{new Date(report.generated_at).toLocaleString()}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={e => { e.stopPropagation(); downloadJSON(); }}
            className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-mono border transition-all hover:border-[#c9b787]/40"
            style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#c9b787' }}>
            <Download className="w-2.5 h-2.5" /> JSON
          </button>
          <button onClick={e => { e.stopPropagation(); printReport(); }}
            className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-mono border transition-all hover:border-[#60a5fa]/40"
            style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#60a5fa' }}>
            <Printer className="w-2.5 h-2.5" /> Print
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-700/50 p-4 space-y-3">
          {report.content.executive_summary && (
            <div>
              <div className="text-[10px] font-mono uppercase text-slate-500 mb-1">Executive Summary</div>
              <div className="text-[11px] text-slate-300 leading-relaxed">{report.content.executive_summary}</div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
            <div>
              <div className="text-[10px] font-mono uppercase text-slate-500 mb-2">Report Metadata</div>
              <div className="space-y-1">
                {[
                  ['Type', report.type.replace(/_/g, ' ').toUpperCase()],
                  ['Generated By', report.generated_by],
                  ['Severity', report.content.severity?.toUpperCase() ?? '—'],
                  ['Detection Date', new Date(report.content.detection_date).toLocaleDateString()],
                  ['Evidence Items', String(report.content.evidence_manifest.length)],
                  ['Actions Taken', String(report.content.actions_taken.length)],
                ].map(([l, v]) => (
                  <div key={l} className="flex gap-2">
                    <span className="text-slate-500 w-28 flex-shrink-0">{l}</span>
                    <span className="text-slate-300 font-mono">{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase text-slate-500 mb-2">Evidence Hashes</div>
              <div className="space-y-1">
                {report.evidence_hashes.slice(0, 5).map(h => (
                  <div key={h} className="text-[10px] font-mono text-[#c9b787] break-all">{h.substring(0, 24)}…</div>
                ))}
                {report.evidence_hashes.length === 0 && <div className="text-slate-600">No evidence hashes</div>}
              </div>
              {report.content.circia_trigger !== undefined && (
                <div className={cn('mt-2 px-2 py-1 rounded text-[9px] font-mono border', report.content.circia_trigger ? 'text-red-400 border-red-500/20 bg-red-500/05' : 'text-green-400 border-green-500/20 bg-green-500/05')}>
                  CIRCIA TRIGGER: {report.content.circia_trigger ? 'YES' : 'NO'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReportsGenerator() {
  useEffect(() => { ensureSeeded(); }, []);
  const store = useSentraStore();

  const [selectedIncident, setSelectedIncident] = useState('');
  const [selectedType, setSelectedType] = useState<ReportType | ''>('');
  const [generating, setGenerating] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ReportType | 'all'>('all');

  const incidents = store.incidents.filter(i => ['investigating', 'contained', 'recovery', 'closed', 'reporting'].includes(i.status));
  const reports = [...store.reports].reverse();
  const filtered = reports.filter(r => {
    if (typeFilter !== 'all' && r.type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return r.title.toLowerCase().includes(q) || r.incident_id.toLowerCase().includes(q) || r.id.toLowerCase().includes(q);
    }
    return true;
  });

  async function handleGenerate() {
    if (!selectedIncident || !selectedType) return;
    setGenerating(true);
    await new Promise(r => setTimeout(r, 600));
    store.generateReport(selectedIncident, selectedType, 'Analyst (Console)');
    setGenerating(false);
    setSelectedType('');
  }

  function handleDownload(report: ReportRecord) {
    const idx = store.reports.findIndex(r => r.id === report.id);
    if (idx !== -1) store.reports[idx].downloaded = true;
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <FileText className="w-4 h-4 text-[#c9b787]" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Sentra — Reports Generator</span>
        </div>
        <h1 className="text-2xl font-display font-bold text-slate-100">Reports Generator</h1>
        <p className="text-sm text-slate-500 mt-1">Generate 6 report types from incident data — JSON download or print-ready. All reports include evidence manifest and policy decision log.</p>
      </div>

      {/* Generator */}
      <div className="rounded-lg border p-5 space-y-4" style={{ background: 'rgba(201,183,135,0.04)', borderColor: 'rgba(201,183,135,0.15)' }}>
        <div className="text-[11px] font-mono uppercase tracking-widest text-[#c9b787]">Generate New Report</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-[10px] font-mono text-slate-500 mb-1">Select Incident</div>
            <select value={selectedIncident} onChange={e => setSelectedIncident(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 outline-none focus:border-[#c9b787]/40">
              <option value="">Select incident…</option>
              {incidents.map(i => (
                <option key={i.id} value={i.id}>{i.id} — {i.title.substring(0, 60)}{i.title.length > 60 ? '…' : ''} [{i.severity}]</option>
              ))}
            </select>
          </div>
          <div>
            <div className="text-[10px] font-mono text-slate-500 mb-1">Report Type</div>
            <select value={selectedType} onChange={e => setSelectedType(e.target.value as ReportType)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 outline-none focus:border-[#c9b787]/40">
              <option value="">Select report type…</option>
              {REPORT_TYPES.map(t => <option key={t.type} value={t.type}>{t.label}</option>)}
            </select>
          </div>
        </div>

        {/* Report type cards */}
        {selectedType && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {REPORT_TYPES.filter(t => t.type === selectedType).map(t => {
              const Icon = t.icon;
              return (
                <div key={t.type} className="p-3 rounded-md border" style={{ borderColor: `${t.color}20`, background: `${t.color}05` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4" style={{ color: t.color }} />
                    <span className="text-[11px] font-medium text-slate-300">{t.label}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mb-2">{t.description}</div>
                  <div className="flex gap-1 flex-wrap">
                    {t.tags.map(tag => (
                      <span key={tag} className="px-2 py-0.5 rounded text-[9px] font-mono bg-slate-800 text-slate-400 border border-slate-700">{tag}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <button onClick={handleGenerate} disabled={!selectedIncident || !selectedType || generating}
          className="flex items-center gap-2 px-4 py-2 rounded text-[10px] font-mono font-bold border transition-all disabled:opacity-40"
          style={{ borderColor: '#c9b787', color: '#c9b787', background: 'rgba(201,183,135,0.08)' }}>
          {generating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
          {generating ? 'Generating…' : 'Generate Report'}
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Reports', value: store.reports.length },
          { label: 'Downloaded', value: store.reports.filter(r => r.downloaded).length, color: '#4ade80' },
          { label: 'Law Enforcement', value: store.reports.filter(r => r.type === 'law_enforcement_referral').length, color: '#e05252' },
          { label: 'Report Types', value: REPORT_TYPES.length },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-lg border p-4" style={{ background: 'rgba(255,255,255,0.025)', borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="text-[10px] font-mono uppercase text-slate-500 mb-1">{label}</div>
            <div className="text-2xl font-display font-bold" style={{ color: color ?? '#f5f5f5' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Filter + list */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reports…"
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-300 placeholder:text-slate-600 outline-none focus:border-[#c9b787]/40" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as ReportType | 'all')}
          className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-2 text-xs text-slate-400 outline-none">
          <option value="all">All Types</option>
          {REPORT_TYPES.map(t => <option key={t.type} value={t.type}>{t.label}</option>)}
        </select>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="rounded-lg border p-8 text-center" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <FileText className="w-8 h-8 text-slate-700 mx-auto mb-3" />
            <div className="text-sm text-slate-600">No reports generated yet</div>
            <div className="text-[11px] text-slate-700 mt-1">Select an incident and report type above</div>
          </div>
        ) : (
          filtered.map(r => <ReportCard key={r.id} report={r} onDownload={handleDownload} />)
        )}
      </div>
    </div>
  );
}
