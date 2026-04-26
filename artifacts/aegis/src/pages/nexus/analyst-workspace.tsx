import {
  Brain,
} from 'lucide-react';
import { useCallback, useState } from 'react';

const ACCENT = '#c9b787';
const RED = '#f5f5f5';
const GREEN = '#c9b787';
const BLUE = '#c9b787';
const PURPLE = '#8a8a8a';

const DS = {
  surface: 'rgba(255,255,255,0.025)',
  border: 'rgba(255,255,255,0.06)',
  text: {
    primary: 'rgba(255,255,255,0.88)',
    secondary: 'rgba(255,255,255,0.5)',
    muted: 'rgba(255,255,255,0.25)',
  },
};

interface HypothesisBoard {
  id: string;
  title: string;
  analyst: string;
  status: 'active' | 'validated' | 'refuted' | 'inconclusive';
  technique: 'ACH' | 'cone' | 'key-assumptions' | 'freeform';
  hypotheses: { text: string; confidence: number; evidence: string[] }[];
  notes: string[];
  createdAt: string;
}

const BOARDS: HypothesisBoard[] = [
  {
    id: 'HYP-001',
    title: 'Red Sea Attack Attribution — State Actor vs. Non-State',
    analyst: 'Sarah Chen',
    status: 'active',
    technique: 'ACH',
    hypotheses: [
      {
        text: 'Houthi forces acting independently with Iranian-supplied weapons',
        confidence: 65,
        evidence: [
          'AIS rerouting patterns',
          'Weapon system analysis',
          'IRGC communication intercepts',
        ],
      },
      {
        text: 'Iran directing attacks via Houthi proxy to control Red Sea corridor',
        confidence: 82,
        evidence: [
          'IRGC naval movements',
          'Satellite imagery of weapons transfers',
          'Pattern matches Iranian doctrine',
          'Financial flow analysis',
        ],
      },
      {
        text: 'Multiple non-state actors coordinating independently',
        confidence: 25,
        evidence: ['Varied attack methodologies', 'Inconsistent targeting patterns'],
      },
    ],
    notes: [
      'ACH matrix completed — H2 most consistent with all evidence',
      'Key assumption: satellite imagery authenticity verified via two independent sources',
      'Dissenting view from J. Martinez: timing correlation may be coincidental',
    ],
    createdAt: '2024-03-10T08:00:00Z',
  },
  {
    id: 'HYP-002',
    title: 'CBAM Maritime Expansion — Political Feasibility Assessment',
    analyst: 'David Park',
    status: 'active',
    technique: 'cone',
    hypotheses: [
      {
        text: 'CBAM maritime expansion passes by Q2 2025 (6 months early)',
        confidence: 72,
        evidence: [
          'Committee transcript analysis',
          'Commissioner statements',
          'Lobbyist activity mapping',
          'MEP voting pattern shifts',
        ],
      },
      {
        text: 'CBAM maritime expansion delayed to published 2026 timeline',
        confidence: 35,
        evidence: [
          'Industry opposition lobbying',
          'Shipping lobby spending increase',
          'Election cycle pressures',
        ],
      },
      {
        text: 'CBAM expanded but with maritime exemption carve-outs',
        confidence: 48,
        evidence: ['Precedent from ETS aviation exemptions', 'Greek/Nordic delegation positions'],
      },
    ],
    notes: [
      'Cone of plausibility narrows toward H1 based on latest committee vote',
      'Key assumption check: assumes no major EU political crisis disrupts legislative calendar',
    ],
    createdAt: '2024-03-05T10:00:00Z',
  },
  {
    id: 'HYP-003',
    title: 'APT-41 Maritime Logistics Campaign — Intent Assessment',
    analyst: 'Maria Rodriguez',
    status: 'validated',
    technique: 'key-assumptions',
    hypotheses: [
      {
        text: 'Strategic espionage: collecting intelligence on Western supply chain vulnerabilities',
        confidence: 88,
        evidence: [
          'Target selection pattern',
          'Data exfiltration analysis',
          'Historical APT-41 campaigns',
          'PLA strategic interest alignment',
        ],
      },
      {
        text: 'Pre-positioning for future disruptive operations',
        confidence: 72,
        evidence: [
          'Persistent access maintenance',
          'Backdoor capability exceeds espionage needs',
          'Coincidence with military exercises',
        ],
      },
    ],
    notes: [
      'Key assumptions validated: (1) Attribution confidence >90%, (2) Targeting is deliberate not opportunistic, (3) State direction confirmed via C2 infrastructure',
      'Both hypotheses may be simultaneously true — espionage + pre-positioning is consistent with APT-41 historical pattern',
    ],
    createdAt: '2024-03-08T14:00:00Z',
  },
];

const techColor = (t: string) =>
  t === 'ACH' ? RED : t === 'cone' ? ACCENT : t === 'key-assumptions' ? BLUE : PURPLE;
const statColor = (s: string) =>
  s === 'validated' ? GREEN : s === 'refuted' ? RED : s === 'active' ? ACCENT : DS.text.muted;

export default function AnalystWorkspacePage() {
  const [boards, setBoards] = useState(() =>
    BOARDS.map((b) => ({
      ...b,
      hypotheses: b.hypotheses.map((h) => ({ ...h })),
      notes: [...b.notes],
    })),
  );
  const [selectedId, setSelectedId] = useState(BOARDS[0].id);
  const [newNote, setNewNote] = useState('');

  const selected = boards.find((b) => b.id === selectedId) ?? boards[0];

  const handleAddNote = useCallback(() => {
    if (!newNote.trim()) return;
    setBoards((prev) =>
      prev.map((b) => (b.id === selectedId ? { ...b, notes: [...b.notes, newNote.trim()] } : b)),
    );
    setNewNote('');
  }, [selectedId, newNote]);

  const handleUpdateConfidence = useCallback((boardId: string, hypIdx: number, delta: number) => {
    setBoards((prev) =>
      prev.map((b) => {
        if (b.id !== boardId) return b;
        return {
          ...b,
          hypotheses: b.hypotheses.map((h, i) =>
            i === hypIdx
              ? { ...h, confidence: Math.max(0, Math.min(100, h.confidence + delta)) }
              : h,
          ),
        };
      }),
    );
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white tracking-tight">
          Intelligence Collaboration & Analyst Workspace
        </h1>
        <p className="text-[11px] mt-1" style={{ color: DS.text.muted }}>
          Shared hypothesis boards with structured analytic techniques (ACH, cone of plausibility,
          key assumptions check)
        </p>
      </div>

      <div className="flex gap-3">
        {boards.map((b) => (
          <button
            key={b.id}
            onClick={() => setSelectedId(b.id)}
            aria-label={`Select board ${b.title}`}
            className="flex-1 text-left rounded-xl p-4 transition"
            style={{
              background: selectedId === b.id ? 'rgba(255,255,255,0.04)' : DS.surface,
              border: `1px solid ${selectedId === b.id ? 'rgba(255,255,255,0.12)' : DS.border}`,
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-[8px] uppercase font-bold rounded px-1.5 py-0.5"
                style={{ background: `${techColor(b.technique)}15`, color: techColor(b.technique) }}
              >
                {b.technique}
              </span>
              <span
                className="text-[8px] uppercase font-bold rounded px-1.5 py-0.5"
                style={{ background: `${statColor(b.status)}15`, color: statColor(b.status) }}
              >
                {b.status}
              </span>
            </div>
            <p className="text-sm font-medium text-white line-clamp-1">{b.title}</p>
            <p className="text-[9px] mt-1" style={{ color: DS.text.muted }}>
              {b.analyst} · {b.hypotheses.length} hypotheses
            </p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8 space-y-4">
          <div
            className="rounded-xl p-5"
            style={{ background: DS.surface, border: `1px solid ${DS.border}` }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Brain className="h-4 w-4" style={{ color: techColor(selected.technique) }} />
              <h3
                className="text-[10px] uppercase tracking-wider font-semibold"
                style={{ color: DS.text.muted }}
              >
                Hypothesis Matrix — {selected.technique.toUpperCase()}
              </h3>
              <span className="text-[9px] ml-auto" style={{ color: DS.text.muted }}>
                Analyst: {selected.analyst}
              </span>
            </div>

            <div className="space-y-3">
              {selected.hypotheses.map((h, i) => (
                <div
                  key={i}
                  className="rounded-lg p-4"
                  style={{
                    background: 'rgba(255,255,255,0.015)',
                    border: `1px solid ${DS.border}`,
                  }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] font-semibold text-white flex-1">
                      H{i + 1}: {h.text}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleUpdateConfidence(selected.id, i, -5)}
                        aria-label={`Decrease H${i + 1} confidence`}
                        className="text-[10px] rounded px-1.5 py-0.5 hover:bg-white/[0.05] transition"
                        style={{ color: DS.text.muted }}
                      >
                        −
                      </button>
                      <span
                        className="text-[11px] font-mono font-semibold w-10 text-center"
                        style={{
                          color: h.confidence > 70 ? GREEN : h.confidence > 40 ? ACCENT : RED,
                        }}
                      >
                        {h.confidence}%
                      </span>
                      <button
                        onClick={() => handleUpdateConfidence(selected.id, i, 5)}
                        aria-label={`Increase H${i + 1} confidence`}
                        className="text-[10px] rounded px-1.5 py-0.5 hover:bg-white/[0.05] transition"
                        style={{ color: DS.text.muted }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div
                    className="h-1.5 rounded-full mb-2"
                    style={{ background: 'rgba(255,255,255,0.05)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${h.confidence}%`,
                        background: h.confidence > 70 ? GREEN : h.confidence > 40 ? ACCENT : RED,
                      }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {h.evidence.map((e) => (
                      <span
                        key={e}
                        className="text-[8px] px-1.5 py-0.5 rounded"
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: `1px solid ${DS.border}`,
                          color: DS.text.muted,
                        }}
                      >
                        {e}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-4 space-y-4">
          <div
            className="rounded-xl p-5"
            style={{ background: DS.surface, border: `1px solid ${DS.border}` }}
          >
            <h3
              className="text-[10px] uppercase tracking-wider font-semibold mb-3"
              style={{ color: DS.text.muted }}
            >
              Analyst Notes ({selected.notes.length})
            </h3>
            <div className="space-y-2 mb-3 max-h-64 overflow-y-auto">
              {selected.notes.map((n, i) => (
                <div
                  key={i}
                  className="rounded-lg p-2.5"
                  style={{
                    background: 'rgba(255,255,255,0.015)',
                    border: `1px solid ${DS.border}`,
                  }}
                >
                  <p className="text-[10px] leading-relaxed" style={{ color: DS.text.secondary }}>
                    {n}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                aria-label="Add analyst note"
                placeholder="Add a note..."
                className="flex-1 rounded-lg p-2 text-[10px] text-white"
                style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${DS.border}` }}
              />
              <button
                onClick={handleAddNote}
                aria-label="Submit note"
                className="rounded-lg px-3 py-2 text-[9px] font-semibold hover:brightness-125 transition"
                style={{ background: `${ACCENT}20`, color: ACCENT }}
              >
                Add
              </button>
            </div>
          </div>

          <div
            className="rounded-xl p-5"
            style={{ background: DS.surface, border: `1px solid ${DS.border}` }}
          >
            <h3
              className="text-[10px] uppercase tracking-wider font-semibold mb-3"
              style={{ color: DS.text.muted }}
            >
              Board Info
            </h3>
            {[
              { label: 'Created', value: new Date(selected.createdAt).toLocaleDateString() },
              { label: 'Analyst', value: selected.analyst },
              { label: 'Technique', value: selected.technique.toUpperCase() },
              { label: 'Status', value: selected.status },
              { label: 'Hypotheses', value: selected.hypotheses.length.toString() },
              {
                label: 'Evidence Items',
                value: selected.hypotheses.reduce((s, h) => s + h.evidence.length, 0).toString(),
              },
            ].map((s) => (
              <div
                key={s.label}
                className="flex items-center justify-between py-1.5"
                style={{ borderBottom: `1px solid ${DS.border}` }}
              >
                <span className="text-[10px]" style={{ color: DS.text.muted }}>
                  {s.label}
                </span>
                <span className="text-[10px] font-semibold text-white">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
