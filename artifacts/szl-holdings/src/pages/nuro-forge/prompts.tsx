import { m } from 'framer-motion';
import { GitBranch, Wand2 } from 'lucide-react';
import { useState } from 'react';

const PROMPTS = [
  {
    id: 'legal-risk-v4',
    name: 'Legal Risk Extraction',
    version: 'v4.2',
    domain: 'Legal',
    color: '#8b5cf6',
    winRate: 87.3,
    tests: 234,
    variants: 3,
    uses: 12847,
    status: 'production',
  },
  {
    id: 'maritime-brief-v3',
    name: 'Maritime Intelligence Brief',
    version: 'v3.1',
    domain: 'Maritime',
    color: '#06b6d4',
    winRate: 82.6,
    tests: 156,
    variants: 2,
    uses: 8234,
    status: 'production',
  },
  {
    id: 'threat-assess-v5',
    name: 'Threat Assessment Report',
    version: 'v5.0',
    domain: 'Cyber',
    color: '#3b82f6',
    winRate: 91.4,
    tests: 312,
    variants: 4,
    uses: 15672,
    status: 'production',
  },
  {
    id: 'deal-score-v2',
    name: 'Deal Scoring Analysis',
    version: 'v2.3',
    domain: 'Financial',
    color: '#10b981',
    winRate: 78.9,
    tests: 89,
    variants: 2,
    uses: 4321,
    status: 'production',
  },
  {
    id: 'property-val-v3',
    name: 'Property Valuation Model',
    version: 'v3.4',
    domain: 'Real Estate',
    color: '#d4a054',
    winRate: 84.1,
    tests: 167,
    variants: 3,
    uses: 6543,
    status: 'production',
  },
  {
    id: 'exec-brief-v6',
    name: 'Executive Summary',
    version: 'v6.1',
    domain: 'Advisory',
    color: '#c4a265',
    winRate: 89.7,
    tests: 245,
    variants: 5,
    uses: 18456,
    status: 'production',
  },
  {
    id: 'incident-resp-v2',
    name: 'Incident Response Plan',
    version: 'v2.0',
    domain: 'Cyber',
    color: '#ef4444',
    winRate: 76.4,
    tests: 45,
    variants: 2,
    uses: 1234,
    status: 'testing',
  },
  {
    id: 'compliance-v1',
    name: 'Compliance Gap Analysis',
    version: 'v1.8',
    domain: 'Legal',
    color: '#a855f7',
    winRate: 0,
    tests: 12,
    variants: 3,
    uses: 0,
    status: 'draft',
  },
];

const AB_TESTS = [
  {
    name: 'Legal Risk v4.2 vs v4.1',
    promptA: 'v4.2 (chain-of-thought)',
    promptB: 'v4.1 (direct)',
    aWins: 67,
    bWins: 33,
    total: 234,
    status: 'running',
    color: '#8b5cf6',
  },
  {
    name: 'Maritime Brief concise vs detailed',
    promptA: 'Concise (200 words)',
    promptB: 'Detailed (500 words)',
    aWins: 42,
    bWins: 58,
    total: 156,
    status: 'running',
    color: '#06b6d4',
  },
  {
    name: 'Threat Report structured vs narrative',
    promptA: 'Structured JSON',
    promptB: 'Narrative prose',
    aWins: 71,
    bWins: 29,
    total: 312,
    status: 'complete',
    color: '#3b82f6',
  },
];

export default function PromptStudioPage() {
  const [selectedPrompt, setSelectedPrompt] = useState<(typeof PROMPTS)[0] | null>(null);
  const [view, setView] = useState<'library' | 'testing'>('library');

  return (
    <div className="min-h-screen" style={{ background: '#070a10' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <m.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-6"
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: 'rgba(212,160,84,0.12)',
              border: '1px solid rgba(212,160,84,0.2)',
            }}
          >
            <Wand2 className="w-4 h-4" style={{ color: '#d4a054' }} />
          </div>
          <div>
            <h1
              className="text-xl font-bold tracking-tight"
              style={{ color: 'rgba(255,255,255,0.9)' }}
            >
              Prompt Engineering Studio
            </h1>
            <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {PROMPTS.length} prompts · {AB_TESTS.filter((t) => t.status === 'running').length} A/B
              tests running
            </p>
          </div>
        </m.div>

        <div className="flex gap-2 mb-4">
          {(['library', 'testing'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="px-3 py-1.5 rounded-lg text-[11px] font-medium capitalize"
              style={{
                background: view === v ? 'rgba(212,160,84,0.12)' : 'rgba(255,255,255,0.02)',
                color: view === v ? '#d4a054' : 'rgba(255,255,255,0.4)',
                border: `1px solid ${view === v ? 'rgba(212,160,84,0.2)' : 'rgba(255,255,255,0.04)'}`,
              }}
            >
              {v === 'library' ? 'Prompt Library' : 'A/B Testing'}
            </button>
          ))}
        </div>

        {view === 'library' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PROMPTS.map((prompt, i) => (
              <m.div
                key={prompt.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => setSelectedPrompt(selectedPrompt?.id === prompt.id ? null : prompt)}
                className="rounded-lg p-4 cursor-pointer group"
                style={{
                  background:
                    selectedPrompt?.id === prompt.id
                      ? `${prompt.color}06`
                      : 'rgba(255,255,255,0.015)',
                  border: `1px solid ${selectedPrompt?.id === prompt.id ? `${prompt.color}20` : 'rgba(255,255,255,0.04)'}`,
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="text-[12px] font-semibold"
                    style={{ color: 'rgba(255,255,255,0.75)' }}
                  >
                    {prompt.name}
                  </span>
                  <span
                    className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full capitalize"
                    style={{
                      background:
                        prompt.status === 'production'
                          ? 'rgba(16,185,129,0.1)'
                          : prompt.status === 'testing'
                            ? 'rgba(245,158,11,0.1)'
                            : 'rgba(255,255,255,0.04)',
                      color:
                        prompt.status === 'production'
                          ? '#10b981'
                          : prompt.status === 'testing'
                            ? '#f59e0b'
                            : 'rgba(255,255,255,0.3)',
                    }}
                  >
                    {prompt.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded"
                    style={{ background: `${prompt.color}10`, color: prompt.color }}
                  >
                    {prompt.domain}
                  </span>
                  <span className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>
                    {prompt.version}
                  </span>
                  <GitBranch
                    className="w-3 h-3 ml-auto"
                    style={{ color: 'rgba(255,255,255,0.15)' }}
                  />
                  <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                    {prompt.variants} variants
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  {prompt.winRate > 0 && (
                    <span
                      className="text-[10px] tabular-nums font-medium"
                      style={{ color: '#10b981' }}
                    >
                      {prompt.winRate}% win rate
                    </span>
                  )}
                  <span
                    className="text-[9px] tabular-nums"
                    style={{ color: 'rgba(255,255,255,0.2)' }}
                  >
                    {prompt.uses.toLocaleString()} uses
                  </span>
                </div>
              </m.div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {AB_TESTS.map((test, i) => (
              <m.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-lg p-5"
                style={{
                  background: 'rgba(255,255,255,0.015)',
                  border: `1px solid ${test.color}15`,
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3
                    className="text-[12px] font-semibold"
                    style={{ color: 'rgba(255,255,255,0.75)' }}
                  >
                    {test.name}
                  </h3>
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded-full capitalize"
                    style={{
                      background:
                        test.status === 'running' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
                      color: test.status === 'running' ? '#f59e0b' : '#10b981',
                    }}
                  >
                    {test.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div
                    className="rounded-md p-3"
                    style={{
                      background:
                        test.aWins > test.bWins ? `${test.color}08` : 'rgba(255,255,255,0.01)',
                      border: `1px solid ${test.aWins > test.bWins ? `${test.color}20` : 'rgba(255,255,255,0.03)'}`,
                    }}
                  >
                    <div
                      className="text-[10px] font-medium mb-1"
                      style={{ color: 'rgba(255,255,255,0.5)' }}
                    >
                      Variant A
                    </div>
                    <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.7)' }}>
                      {test.promptA}
                    </div>
                    <div
                      className="text-lg font-bold tabular-nums mt-2"
                      style={{
                        color: test.aWins > test.bWins ? test.color : 'rgba(255,255,255,0.3)',
                      }}
                    >
                      {test.aWins}%
                    </div>
                  </div>
                  <div
                    className="rounded-md p-3"
                    style={{
                      background:
                        test.bWins > test.aWins ? `${test.color}08` : 'rgba(255,255,255,0.01)',
                      border: `1px solid ${test.bWins > test.aWins ? `${test.color}20` : 'rgba(255,255,255,0.03)'}`,
                    }}
                  >
                    <div
                      className="text-[10px] font-medium mb-1"
                      style={{ color: 'rgba(255,255,255,0.5)' }}
                    >
                      Variant B
                    </div>
                    <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.7)' }}>
                      {test.promptB}
                    </div>
                    <div
                      className="text-lg font-bold tabular-nums mt-2"
                      style={{
                        color: test.bWins > test.aWins ? test.color : 'rgba(255,255,255,0.3)',
                      }}
                    >
                      {test.bWins}%
                    </div>
                  </div>
                </div>
                <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                  {test.total} evaluations completed
                </div>
              </m.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
