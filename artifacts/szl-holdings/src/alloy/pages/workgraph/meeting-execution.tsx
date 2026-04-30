import { useState } from 'react';
import { Video, ArrowRight, CheckCircle, Clock, Users, Play, Shield, Zap, AlertCircle } from 'lucide-react';
import { ALLOY_SKILLS, MOCK_NODES, formatRelativeWG } from '@/alloy/data/workgraph';

const ACCENT = '#4B8BDB';

const DEMO_MEETINGS = [
  {
    id: 'meet-001',
    title: 'Q2 Revenue Operations Review',
    date: new Date(Date.now() - 3 * 86400000).toISOString(),
    duration: '58 min',
    participants: ['Sarah Chen', 'Marcus Webb', 'James Park', 'Ana Torres'],
    summary: 'Reviewed Q2 pipeline coverage. 3 deals at risk identified. APAC follow-up assigned to Sarah Chen.',
    commitments: [
      { owner: 'Sarah Chen', action: 'APAC pipeline review', deadline: 'EOW', status: 'open' },
      { owner: 'James Park', action: 'Chase Acme Corp CFO approval', deadline: '24h', status: 'in_progress' },
      { owner: 'Marcus Webb', action: 'Board packet — legal review sign-off', deadline: '3 days', status: 'open' },
      { owner: 'Ana Torres', action: 'Review MSA renewal for Vertex Corp', deadline: '5 days', status: 'open' },
      { owner: 'Sarah Chen', action: 'Set up weekly cadence check-ins', deadline: 'Monday', status: 'done' },
    ],
    decisions: [
      { text: 'Executive sponsor required for all deals >$250K', resolved: true },
      { text: 'Revised H2 forecast — CFO approval before external comm', resolved: false },
    ],
    skillTriggered: 'Meeting to Execution',
    workcellCreated: true,
    proofReady: true,
    mirrorEvalScore: 91,
  },
  {
    id: 'meet-002',
    title: 'Maritime Risk Review — Q2 Regulatory Check-in',
    date: new Date(Date.now() - 5 * 86400000).toISOString(),
    duration: '43 min',
    participants: ['Sophie Laurent', 'Dev Patel', 'Marcus Webb'],
    summary: 'OFAC screening results reviewed. 2 vessels flagged. Port authority notifications drafted.',
    commitments: [
      { owner: 'Sophie Laurent', action: 'Submit port authority notifications for vessel MV-041', deadline: '48h', status: 'in_progress' },
      { owner: 'Sophie Laurent', action: 'Complete AIS gap event investigation', deadline: '72h', status: 'open' },
    ],
    decisions: [
      { text: 'Engage port authority for MV-041 — approved', resolved: true },
    ],
    skillTriggered: 'Meeting to Execution',
    workcellCreated: true,
    proofReady: true,
    mirrorEvalScore: 88,
  },
  {
    id: 'meet-003',
    title: 'Security Incident Post-Mortem — SEC-2026-047',
    date: new Date(Date.now() - 1 * 86400000).toISOString(),
    duration: '30 min',
    participants: ['Dev Patel', 'James Park', 'Ana Torres'],
    summary: 'Token rotation confirmed. Root cause: stale service account credentials. Remediation plan approved.',
    commitments: [
      { owner: 'Dev Patel', action: 'Complete access audit report', deadline: '24h', status: 'in_progress' },
      { owner: 'Ana Torres', action: 'Vendor breach notification letter', deadline: '48h', status: 'open' },
    ],
    decisions: [
      { text: 'Service account rotation — monthly cadence — approved', resolved: true },
      { text: 'Vendor notification required per contract — approved', resolved: true },
    ],
    skillTriggered: 'Security Incident Follow-Up',
    workcellCreated: true,
    proofReady: false,
    mirrorEvalScore: 95,
  },
  {
    id: 'meet-004',
    title: 'Board Packet Preparation — Pre-meeting',
    date: new Date(Date.now() - 2 * 86400000).toISOString(),
    duration: '25 min',
    participants: ['Marcus Webb', 'Sarah Chen', 'Kenji Watanabe'],
    summary: 'Reviewed draft board packet sections. Legal review in progress. CapEx sign-off blocked on environmental clearance.',
    commitments: [
      { owner: 'Marcus Webb', action: 'Confirm legal review completion', deadline: '2 days', status: 'open' },
      { owner: 'Kenji Watanabe', action: 'Environmental clearance status update', deadline: '24h', status: 'open' },
    ],
    decisions: [
      { text: 'CapEx LOI requires board sign-off before environmental clearance — pending', resolved: false },
    ],
    skillTriggered: 'Board Packet from Workspace',
    workcellCreated: false,
    proofReady: false,
    mirrorEvalScore: 84,
  },
];

function CommitmentRow({ c }: { c: typeof DEMO_MEETINGS[0]['commitments'][0] }) {
  const colors: Record<string, string> = {
    open: '#f59e0b',
    in_progress: '#4B8BDB',
    done: '#10b981',
    blocked: '#ef4444',
  };
  const color = colors[c.status] ?? '#6b7280';
  const Icon = c.status === 'done' ? CheckCircle : Clock;
  return (
    <div className="flex items-center gap-2 py-1.5 border-b last:border-0"
      style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
      <Icon className="w-3 h-3 shrink-0" style={{ color }} />
      <div className="flex-1 min-w-0">
        <span className="text-[10px] text-white">{c.action}</span>
        <span className="text-[9px] ml-2" style={{ color: 'rgba(255,255,255,0.3)' }}>— {c.owner}</span>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>by {c.deadline}</span>
        <span className="text-[8px] px-1 py-0.5 rounded capitalize" style={{ color, background: `${color}12` }}>
          {c.status.replace('_', ' ')}
        </span>
      </div>
    </div>
  );
}

function MeetingCard({ meeting }: { meeting: typeof DEMO_MEETINGS[0] }) {
  const [expanded, setExpanded] = useState(false);
  const [running, setRunning] = useState(false);
  const [ran, setRan] = useState(false);
  const scoreColor = meeting.mirrorEvalScore >= 90 ? '#10b981' : meeting.mirrorEvalScore >= 80 ? '#f59e0b' : '#ef4444';

  const doneCount = meeting.commitments.filter(c => c.status === 'done').length;
  const resolvedDecisions = meeting.decisions.filter(d => d.resolved).length;

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'rgba(75,139,219,0.15)', background: 'rgba(12,18,30,0.95)' }}>
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.2)' }}>
            <Video className="w-4 h-4" style={{ color: '#06b6d4' }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-white mb-0.5">{meeting.title}</div>
            <div className="flex items-center gap-3 text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
              <span>{formatRelativeWG(meeting.date)}</span>
              <span>·</span>
              <span>{meeting.duration}</span>
              <span>·</span>
              <Users className="w-2.5 h-2.5" />
              <span>{meeting.participants.length} attendees</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[9px] font-mono" style={{ color: scoreColor }}>
              MirrorEval {meeting.mirrorEvalScore}%
            </div>
          </div>
        </div>

        <div className="text-[10px] mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
          {meeting.summary}
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="text-center p-2 rounded" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="text-sm font-bold text-white">{meeting.commitments.length}</div>
            <div className="text-[8px]" style={{ color: 'rgba(255,255,255,0.3)' }}>Commitments</div>
          </div>
          <div className="text-center p-2 rounded" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="text-sm font-bold" style={{ color: '#10b981' }}>{doneCount}</div>
            <div className="text-[8px]" style={{ color: 'rgba(255,255,255,0.3)' }}>Complete</div>
          </div>
          <div className="text-center p-2 rounded" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="text-sm font-bold" style={{ color: resolvedDecisions === meeting.decisions.length ? '#10b981' : '#f59e0b' }}>
              {resolvedDecisions}/{meeting.decisions.length}
            </div>
            <div className="text-[8px]" style={{ color: 'rgba(255,255,255,0.3)' }}>Decisions</div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {meeting.workcellCreated && (
            <span className="text-[9px] px-2 py-0.5 rounded" style={{ color: '#4B8BDB', background: 'rgba(75,139,219,0.08)' }}>
              Workcell created
            </span>
          )}
          {meeting.proofReady && (
            <span className="text-[9px] px-2 py-0.5 rounded" style={{ color: '#10b981', background: 'rgba(16,185,129,0.08)' }}>
              Proof ready
            </span>
          )}
          <span className="text-[9px] px-2 py-0.5 rounded" style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.08)' }}>
            Skill: {meeting.skillTriggered}
          </span>
          <div className="ml-auto flex gap-2">
            <button onClick={() => setExpanded(x => !x)}
              className="text-[9px] px-2.5 py-1 rounded border transition-all"
              style={{ color: ACCENT, borderColor: 'rgba(75,139,219,0.2)', background: 'rgba(75,139,219,0.06)' }}>
              {expanded ? 'Collapse' : 'Details'}
            </button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t px-4 pb-4 pt-3 space-y-4" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <div>
            <div className="text-[8px] uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Commitments
            </div>
            {meeting.commitments.map((c, i) => (
              <CommitmentRow key={i} c={c} />
            ))}
          </div>
          <div>
            <div className="text-[8px] uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Decisions
            </div>
            {meeting.decisions.map((d, i) => (
              <div key={i} className="flex items-start gap-2 mb-1.5">
                {d.resolved
                  ? <CheckCircle className="w-3 h-3 shrink-0 mt-0.5" style={{ color: '#10b981' }} />
                  : <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" style={{ color: '#f59e0b' }} />
                }
                <span className="text-[10px]" style={{ color: d.resolved ? 'rgba(255,255,255,0.6)' : '#f59e0b' }}>
                  {d.text}
                </span>
              </div>
            ))}
          </div>
          <div>
            <div className="text-[8px] uppercase tracking-wider mb-1.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Attendees
            </div>
            <div className="flex flex-wrap gap-1">
              {meeting.participants.map(p => (
                <span key={p} className="text-[9px] px-2 py-0.5 rounded border"
                  style={{ color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.08)' }}>
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MeetingExecution() {
  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Video className="w-3.5 h-3.5" style={{ color: ACCENT }} />
            <span className="text-[10px] font-bold uppercase tracking-widest font-mono" style={{ color: ACCENT }}>
              Alloy WorkGraph · Meeting to Execution
            </span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Meeting to Execution</h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Meeting summaries converted to commitments, decisions, and Workcells — with Proof Packets and MirrorEval scoring.
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border"
          style={{ color: '#f59e0b', borderColor: 'rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.08)' }}>
          <Zap className="w-2.5 h-2.5" /> Demo Mode
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Meetings Processed', value: DEMO_MEETINGS.length, color: ACCENT },
          { label: 'Commitments', value: DEMO_MEETINGS.reduce((a, m) => a + m.commitments.length, 0), color: '#f59e0b' },
          { label: 'Workcells Created', value: DEMO_MEETINGS.filter(m => m.workcellCreated).length, color: '#8b5cf6' },
          { label: 'Proof Ready', value: DEMO_MEETINGS.filter(m => m.proofReady).length, color: '#10b981' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border p-3" style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(12,18,30,0.95)' }}>
            <div className="text-[9px] uppercase tracking-widest font-mono mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{s.label}</div>
            <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {DEMO_MEETINGS.map(meeting => (
          <MeetingCard key={meeting.id} meeting={meeting} />
        ))}
      </div>

      <div className="p-3 rounded-xl border" style={{ borderColor: 'rgba(75,139,219,0.15)', background: 'rgba(75,139,219,0.04)' }}>
        <div className="flex items-start gap-2">
          <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: 'rgba(75,139,219,0.6)' }} />
          <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
            <strong className="text-white">Meeting to Execution governance:</strong> Meeting summaries are processed by the Meeting to Execution skill. Commitments and decisions require human review before external communication. MirrorEval scores indicate output quality. All outputs are logged to the Proof Chain.
          </div>
        </div>
      </div>
    </div>
  );
}
