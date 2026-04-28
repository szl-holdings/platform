import { CheckCircle, Clock, FlaskConical, Lock, Plus, Play, Trash2, XCircle } from 'lucide-react';
import { useState } from 'react';
import { ACCENT, BG, BORDER, TEXT } from './constants';
import type { TestCase } from './types';

interface Props {
  testCases: TestCase[];
  testRunning: boolean;
  showAddTest: boolean;
  setShowAddTest: (v: boolean) => void;
  compiled: unknown;
  passedTests: number;
  failedTests: number;
  totalRan: number;
  auditLog: Array<{ at: number; event: string; actor: string }>;
  runTests: () => void;
  addTestCase: (name: string, action: string, amount: string, expected: TestCase['expectedOutcome']) => void;
  removeTestCase: (id: string) => void;
}

export function TestsTab({ testCases, testRunning, showAddTest, setShowAddTest, compiled, passedTests, failedTests, totalRan, auditLog, runTests, addTestCase, removeTestCase }: Props) {
  const [newTestName, setNewTestName] = useState('');
  const [newTestAction, setNewTestAction] = useState('');
  const [newTestAmount, setNewTestAmount] = useState('');
  const [newTestExpected, setNewTestExpected] = useState<TestCase['expectedOutcome']>('allowed');

  const handleAdd = () => {
    addTestCase(newTestName, newTestAction, newTestAmount, newTestExpected);
    setNewTestName(''); setNewTestAction(''); setNewTestAmount(''); setNewTestExpected('allowed');
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[12px] font-semibold mb-0.5" style={{ color: TEXT.primary }}>Test Harness</div>
          <div className="text-[10px] font-mono" style={{ color: TEXT.secondary }}>
            Define expected outcomes for specific actions and validate your compiled policy.
            {totalRan > 0 && <span style={{ color: failedTests > 0 ? '#ef4444' : '#22c55e', marginLeft: '8px' }}>{passedTests}/{totalRan} passed</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowAddTest(true)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[10px] font-semibold" style={{ color: TEXT.secondary, border: `1px solid ${BORDER.muted}` }}>
            <Plus className="w-3 h-3" /> Add Test
          </button>
          <button onClick={runTests} disabled={!compiled || testRunning || testCases.length === 0} className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-semibold disabled:opacity-40" style={{ color: ACCENT, background: `${ACCENT}12`, border: `1px solid ${ACCENT}35` }}>
            <Play className={`w-3 h-3 ${testRunning ? 'animate-pulse' : ''}`} />
            {testRunning ? 'Running…' : 'Run All'}
          </button>
        </div>
      </div>

      {showAddTest && (
        <div className="rounded border p-3 flex flex-col gap-2" style={{ background: `${ACCENT}05`, borderColor: `${ACCENT}25` }}>
          <div className="text-[10px] font-mono font-semibold" style={{ color: ACCENT }}>New Test Case</div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Test Name *', value: newTestName, onChange: setNewTestName, placeholder: 'e.g. Large payout needs approval', type: 'text' },
              { label: 'Action Type', value: newTestAction, onChange: setNewTestAction, placeholder: 'payout, transfer, export…', type: 'text' },
              { label: 'Estimated Cost (USD)', value: newTestAmount, onChange: setNewTestAmount, placeholder: '0', type: 'number' },
            ].map(({ label, value, onChange, placeholder, type }) => (
              <div key={label}>
                <label className="text-[9px] uppercase tracking-wider font-mono mb-1 block" style={{ color: TEXT.tertiary }}>{label}</label>
                <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full text-[11px] px-2 py-1.5 rounded outline-none" style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${BORDER.muted}`, color: TEXT.primary }} />
              </div>
            ))}
            <div>
              <label className="text-[9px] uppercase tracking-wider font-mono mb-1 block" style={{ color: TEXT.tertiary }}>Expected Outcome</label>
              <select value={newTestExpected} onChange={(e) => setNewTestExpected(e.target.value as TestCase['expectedOutcome'])} className="w-full text-[11px] px-2 py-1.5 rounded outline-none" style={{ background: '#0c1420', border: `1px solid ${BORDER.muted}`, color: TEXT.primary }}>
                <option value="allowed">Allowed</option>
                <option value="approval_required">Approval Required</option>
                <option value="blocked">Blocked</option>
                <option value="escalated">Escalated</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleAdd} disabled={!newTestName.trim()} className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-semibold disabled:opacity-40" style={{ color: '#22c55e', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)' }}>
              <Plus className="w-3 h-3" /> Add
            </button>
            <button onClick={() => setShowAddTest(false)} className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-semibold" style={{ color: TEXT.tertiary, border: `1px solid ${BORDER.muted}` }}>Cancel</button>
          </div>
        </div>
      )}

      {testCases.length === 0 ? (
        <div className="rounded border p-8 flex flex-col items-center gap-2" style={{ background: BG.surface, borderColor: BORDER.subtle }}>
          <FlaskConical className="w-6 h-6" style={{ color: TEXT.muted }} />
          <div className="text-[11px] font-mono" style={{ color: TEXT.tertiary }}>No test cases yet. Add one above.</div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {testCases.map((tc) => {
            const passed = tc.ran ? tc.passed : undefined;
            const statusColor = passed === undefined ? TEXT.tertiary : passed ? '#22c55e' : '#ef4444';
            const statusBorder = passed === undefined ? BORDER.muted : passed ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)';
            return (
              <div key={tc.id} className="rounded border p-3 flex items-start gap-3" style={{ background: BG.surface, borderColor: statusBorder, backgroundColor: passed !== undefined ? (passed ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)') : undefined }}>
                <div className="shrink-0 mt-0.5">
                  {tc.ran ? (tc.passed ? <CheckCircle className="w-4 h-4" style={{ color: '#22c55e' }} /> : <XCircle className="w-4 h-4" style={{ color: '#ef4444' }} />) : <Clock className="w-4 h-4" style={{ color: TEXT.muted }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-medium" style={{ color: TEXT.primary }}>{tc.name}</span>
                    <span className="text-[9px] font-mono" style={{ color: statusColor }}>expected: <span className="uppercase">{tc.expectedOutcome.replace('_', ' ')}</span></span>
                    {tc.ran && tc.actualOutcome && <span className="text-[9px] font-mono" style={{ color: statusColor }}>got: <span className="uppercase">{tc.actualOutcome.replace('_', ' ')}</span></span>}
                  </div>
                  <div className="flex items-center gap-3 text-[9px] font-mono flex-wrap" style={{ color: TEXT.tertiary }}>
                    <span>action: {String(tc.context.action ?? 'any')}</span>
                    {tc.context.estimatedCostUsd !== undefined && <span>cost: ${Number(tc.context.estimatedCostUsd).toLocaleString()}</span>}
                  </div>
                  {tc.ran && tc.reasoning && <div className="text-[9px] mt-1 font-mono" style={{ color: TEXT.tertiary }}>{tc.reasoning}</div>}
                </div>
                <button onClick={() => removeTestCase(tc.id)} className="shrink-0 p-1 rounded hover:bg-white/5" style={{ color: TEXT.muted }}>
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded border p-3" style={{ background: BG.surface, borderColor: BORDER.subtle }}>
        <div className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider mb-2" style={{ color: TEXT.tertiary }}>
          <Lock className="w-3 h-3" /> Audit Log — Test Events
        </div>
        <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
          {auditLog.filter((e) => e.event.toLowerCase().includes('test') || e.event.toLowerCase().includes('harness')).map((entry, i) => (
            <div key={i} className="flex items-center gap-2 text-[9px] font-mono" style={{ color: TEXT.tertiary }}>
              <span style={{ color: TEXT.muted }}>{new Date(entry.at).toLocaleTimeString()}</span>
              <span>{entry.event}</span>
              <span style={{ color: ACCENT }}>· {entry.actor}</span>
            </div>
          ))}
          {auditLog.filter((e) => e.event.toLowerCase().includes('test') || e.event.toLowerCase().includes('harness')).length === 0 && (
            <div className="text-[9px] font-mono" style={{ color: TEXT.muted }}>No test events yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
