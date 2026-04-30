import { useState } from 'react';
import { FileCheck, Shield, Download, Eye, CheckCircle, Clock, FileText, Zap } from 'lucide-react';
import { PROOF_PACKETS, DATA_CLASS_CONFIG, formatRelativeWG } from '@/alloy/data/workgraph';

const ACCENT = '#4B8BDB';

const STATUS_CFG: Record<string, { color: string; label: string }> = {
  verified: { color: '#10b981', label: 'Verified' },
  pending_review: { color: '#f59e0b', label: 'Pending Review' },
  draft: { color: '#6b7280', label: 'Draft' },
};

const MOCK_EVIDENCE_ITEMS = [
  { type: 'meeting_summary', desc: 'Video meeting summary — timestamped', hash: 'sha256:8a4f2c1e…' },
  { type: 'email', desc: 'Email thread — full message chain', hash: 'sha256:2b9d7a3f…' },
  { type: 'spreadsheet', desc: 'Spreadsheet snapshot — at decision time', hash: 'sha256:5c1e8b9d…' },
  { type: 'task', desc: 'Task assignment record — with assignee', hash: 'sha256:1f4e2a7c…' },
  { type: 'approval', desc: 'Approval record — with authorizer', hash: 'sha256:7d3b5c9e…' },
  { type: 'chat', desc: 'Chat thread — time-indexed', hash: 'sha256:9e2a4f1b…' },
  { type: 'document', desc: 'Document revision — with author', hash: 'sha256:3c7d1e8a…' },
  { type: 'outcome', desc: 'Outcome record — verified post-execution', hash: 'sha256:6b2e9f3a…' },
];

function ProofPacketCard({ pp }: { pp: typeof PROOF_PACKETS[0] }) {
  const [expanded, setExpanded] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const dc = DATA_CLASS_CONFIG[pp.dataClass];
  const sc = STATUS_CFG[pp.status] ?? STATUS_CFG.draft;
  const evidenceItems = MOCK_EVIDENCE_ITEMS.slice(0, pp.evidenceCount);
  const StatusIcon = pp.status === 'verified' ? CheckCircle : Clock;

  function handleDownload() {
    setDownloading(true);
    setTimeout(() => setDownloading(false), 1500);
  }

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: `${dc.color}20`, background: 'rgba(12,18,30,0.95)' }}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: `${dc.color}12`, border: `1px solid ${dc.color}20` }}>
            <FileCheck className="w-4 h-4" style={{ color: dc.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-white mb-1">{pp.title}</div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="text-[8px] px-1.5 py-0.5 rounded font-bold"
                style={{ color: dc.color, background: dc.bg }}>
                {dc.label}
              </span>
              <div className="flex items-center gap-1" style={{ color: sc.color }}>
                <StatusIcon className="w-2.5 h-2.5" />
                <span className="text-[9px] font-medium">{sc.label}</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-2.5 text-[9px]">
              <div>
                <div style={{ color: 'rgba(255,255,255,0.3)' }}>Project</div>
                <div className="text-white font-medium">{pp.project.split(' ').slice(0, 2).join(' ')}</div>
              </div>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.3)' }}>Skill</div>
                <div className="text-white font-medium">{pp.skill.split(' ').slice(0, 2).join(' ')}</div>
              </div>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.3)' }}>Evidence</div>
                <div className="text-white font-medium">{pp.evidenceCount} items</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {formatRelativeWG(pp.createdAt)}
              </span>
              <div className="flex gap-1 ml-auto">
                <button onClick={() => setExpanded(x => !x)}
                  className="flex items-center gap-1 text-[9px] px-2 py-1 rounded border transition-all"
                  style={{ color: ACCENT, borderColor: 'rgba(75,139,219,0.2)', background: 'rgba(75,139,219,0.06)' }}>
                  <Eye className="w-2.5 h-2.5" /> {expanded ? 'Hide' : 'View'}
                </button>
                <button onClick={handleDownload}
                  className="flex items-center gap-1 text-[9px] px-2 py-1 rounded border transition-all"
                  style={{
                    color: downloading ? '#10b981' : 'rgba(255,255,255,0.5)',
                    borderColor: 'rgba(255,255,255,0.1)',
                    background: 'transparent',
                  }}>
                  {downloading ? <CheckCircle className="w-2.5 h-2.5" /> : <Download className="w-2.5 h-2.5" />}
                  {downloading ? 'Ready' : 'Export'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t px-4 pb-4 pt-3 space-y-3" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <div>
            <div className="text-[8px] uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Evidence Chain — {evidenceItems.length} items
            </div>
            <div className="space-y-1.5">
              {evidenceItems.map((item, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded"
                  style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div className="w-4 h-4 rounded shrink-0 flex items-center justify-center text-[8px] font-bold"
                    style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-white">{item.desc}</div>
                    <div className="text-[8px] font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>{item.hash}</div>
                  </div>
                  <CheckCircle className="w-2.5 h-2.5 shrink-0" style={{ color: '#10b981' }} />
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-start gap-2 p-2.5 rounded-xl"
            style={{ background: 'rgba(75,139,219,0.05)', border: '1px solid rgba(75,139,219,0.1)' }}>
            <Shield className="w-3 h-3 shrink-0 mt-0.5" style={{ color: 'rgba(75,139,219,0.6)' }} />
            <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
              All evidence items are SHA-256 hashed at capture time. Proof Packet is tamper-evident. Restricted sources are referenced by ID only — content is not included per DLP policy.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProofPackets() {
  const [filter, setFilter] = useState('all');

  const filtered = PROOF_PACKETS.filter(pp =>
    filter === 'all' || pp.status === filter || pp.dataClass === filter
  );

  const statusFilters = ['all', 'verified', 'pending_review', 'draft'];

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileCheck className="w-3.5 h-3.5" style={{ color: ACCENT }} />
            <span className="text-[10px] font-bold uppercase tracking-widest font-mono" style={{ color: ACCENT }}>
              Alloy WorkGraph · Proof Packets
            </span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Proof Packets</h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Tamper-evident evidence chains for every workspace action. SHA-256 hashed, DLP-scoped, exportable.
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border"
          style={{ color: '#f59e0b', borderColor: 'rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.08)' }}>
          <Zap className="w-2.5 h-2.5" /> Demo Mode
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Packets', value: PROOF_PACKETS.length, color: ACCENT },
          { label: 'Verified', value: PROOF_PACKETS.filter(p => p.status === 'verified').length, color: '#10b981' },
          { label: 'Pending Review', value: PROOF_PACKETS.filter(p => p.status === 'pending_review').length, color: '#f59e0b' },
          { label: 'Evidence Items', value: PROOF_PACKETS.reduce((a, p) => a + p.evidenceCount, 0), color: '#8b5cf6' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border p-3" style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(12,18,30,0.95)' }}>
            <div className="text-[9px] uppercase tracking-widest font-mono mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{s.label}</div>
            <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 flex-wrap">
        {statusFilters.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-2.5 py-1 rounded text-[9px] font-medium border transition-all capitalize"
            style={{
              background: filter === f ? 'rgba(75,139,219,0.1)' : 'transparent',
              borderColor: filter === f ? 'rgba(75,139,219,0.3)' : 'rgba(255,255,255,0.06)',
              color: filter === f ? ACCENT : 'rgba(255,255,255,0.35)',
            }}>
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(pp => (
          <ProofPacketCard key={pp.id} pp={pp} />
        ))}
      </div>

      <div className="p-3 rounded-xl border" style={{ borderColor: 'rgba(75,139,219,0.15)', background: 'rgba(75,139,219,0.04)' }}>
        <div className="flex items-start gap-2">
          <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: 'rgba(75,139,219,0.6)' }} />
          <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
            <strong className="text-white">Proof Packet governance:</strong> Every Proof Packet is created by a governed skill, linked to a Workcell, and contains a SHA-256 hashed evidence chain. Restricted-class sources are referenced by ID only. Packets are exportable for compliance, capital review, and audit purposes.
          </div>
        </div>
      </div>
    </div>
  );
}
