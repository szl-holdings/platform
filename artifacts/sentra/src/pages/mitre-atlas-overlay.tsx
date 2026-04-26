import { cn } from '@szl-holdings/shared-ui/utils';
import {
  Activity,
  AlertTriangle,
  Bot,
  Brain,
  BookOpen,
  CheckCircle2,
  Cpu,
  Eye,
  GitBranch,
  Layers,
  Network,
  Shield,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

type ATLASTactic = {
  id: string;
  name: string;
  techniques: number;
  subTechniques: number;
  covered: number;
  detections: number;
};

const ATLAS_TACTICS: ATLASTactic[] = [
  { id: 'AML.TA0000', name: 'ML Model Access', techniques: 8, subTechniques: 5, covered: 6, detections: 12 },
  { id: 'AML.TA0001', name: 'ML Attack Staging', techniques: 12, subTechniques: 8, covered: 9, detections: 7 },
  { id: 'AML.TA0002', name: 'Initial Access', techniques: 6, subTechniques: 4, covered: 5, detections: 23 },
  { id: 'AML.TA0003', name: 'ML Model Inference', techniques: 9, subTechniques: 6, covered: 7, detections: 15 },
  { id: 'AML.TA0004', name: 'Execution', techniques: 7, subTechniques: 5, covered: 6, detections: 8 },
  { id: 'AML.TA0005', name: 'Persistence', techniques: 5, subTechniques: 3, covered: 4, detections: 4 },
  { id: 'AML.TA0006', name: 'Defense Evasion', techniques: 11, subTechniques: 9, covered: 8, detections: 19 },
  { id: 'AML.TA0007', name: 'Discovery', techniques: 6, subTechniques: 4, covered: 5, detections: 6 },
  { id: 'AML.TA0008', name: 'Collection', techniques: 8, subTechniques: 5, covered: 6, detections: 11 },
  { id: 'AML.TA0009', name: 'Exfiltration', techniques: 5, subTechniques: 3, covered: 4, detections: 3 },
  { id: 'AML.TA0010', name: 'Impact', techniques: 7, subTechniques: 4, covered: 5, detections: 9 },
];

const TOTAL_TECHNIQUES = ATLAS_TACTICS.reduce((s, t) => s + t.techniques, 0);
const TOTAL_SUB = ATLAS_TACTICS.reduce((s, t) => s + t.subTechniques, 0);
const TOTAL_COVERED = ATLAS_TACTICS.reduce((s, t) => s + t.covered, 0);

type AgenticVector = {
  id: string;
  technique: string;
  atlasId: string;
  description: string;
  severity: 'critical' | 'high' | 'medium';
  detections: number;
  status: 'covered' | 'partial' | 'gap';
};

const AGENTIC_VECTORS: AgenticVector[] = [
  { id: 'av-1', technique: 'Agent Goal Hijacking', atlasId: 'AML.T0054', description: 'Manipulating an AI agent\'s objective function to perform unintended actions via prompt injection or context manipulation', severity: 'critical', detections: 8, status: 'covered' },
  { id: 'av-2', technique: 'Tool Misuse', atlasId: 'AML.T0055', description: 'Exploiting an AI agent\'s authorized tool access to perform malicious operations within its permission boundary', severity: 'critical', detections: 5, status: 'partial' },
  { id: 'av-3', technique: 'Publish Poisoned AI Agent Tool', atlasId: 'AML.T0056', description: 'Publishing a malicious tool/plugin to an AI agent marketplace that executes arbitrary code when invoked', severity: 'critical', detections: 3, status: 'gap' },
  { id: 'av-4', technique: 'Escape to Host', atlasId: 'AML.T0057', description: 'AI agent escaping its sandbox or container to access the host system and pivot to other resources', severity: 'critical', detections: 12, status: 'covered' },
  { id: 'av-5', technique: 'Agent Memory Poisoning', atlasId: 'AML.T0058', description: 'Injecting false information into an AI agent\'s long-term memory to influence future decisions', severity: 'high', detections: 2, status: 'partial' },
  { id: 'av-6', technique: 'Multi-Agent Collusion', atlasId: 'AML.T0059', description: 'Coordinating multiple compromised AI agents to achieve objectives no single agent could accomplish', severity: 'high', detections: 1, status: 'gap' },
  { id: 'av-7', technique: 'Model Extraction via Agent API', atlasId: 'AML.T0060', description: 'Using an AI agent\'s API to systematically extract the underlying model through crafted queries', severity: 'high', detections: 7, status: 'covered' },
  { id: 'av-8', technique: 'Adversarial Prompt Chain', atlasId: 'AML.T0061', description: 'Chaining multiple prompts across agent interactions to gradually escalate privileges or bypass guardrails', severity: 'high', detections: 4, status: 'partial' },
];

type CaseStudy = {
  id: string;
  title: string;
  source: string;
  techniques: string[];
  impact: string;
  date: string;
};

const CASE_STUDIES: CaseStudy[] = [
  { id: 'cs-1', title: 'Autonomous AI Agent Ransomware Chain', source: 'Unit 42 Research', techniques: ['AML.T0054', 'AML.T0055', 'AML.T0057'], impact: 'Full ransomware execution in 25 minutes via autonomous AI agents', date: '2025-03' },
  { id: 'cs-2', title: 'LLM Plugin Supply Chain Attack', source: 'MITRE ATLAS Case Study', techniques: ['AML.T0056', 'AML.T0060'], impact: 'Compromised ChatGPT plugin exfiltrated user data for 3 weeks', date: '2024-11' },
  { id: 'cs-3', title: 'Multi-Agent Cloud Infrastructure Compromise', source: 'Unit 42 Research', techniques: ['AML.T0059', 'AML.T0054'], impact: 'CrewAI-based attack framework compromised AWS infrastructure via coordinated agents', date: '2025-01' },
  { id: 'cs-4', title: 'Adversarial ML Evasion of EDR', source: 'ATLAS Community', techniques: ['AML.T0061', 'AML.T0055'], impact: 'AI-generated malware evaded 3 major EDR vendors using adversarial techniques', date: '2024-09' },
];

const STATUS_STYLE: Record<string, string> = {
  covered: 'text-[#c9b787] border-[#c9b787]/30 bg-[#c9b787]/10',
  partial: 'text-[#c9b787] border-[#c9b787]/30 bg-[#c9b787]/10',
  gap: 'text-[#f5f5f5] border-[#f5f5f5]/30 bg-[#f5f5f5]/10',
};

export default function MitreAtlasOverlay() {
  const [activeView, setActiveView] = useState<'matrix' | 'vectors' | 'studies'>('matrix');

  const coverageRate = Math.round((TOTAL_COVERED / TOTAL_TECHNIQUES) * 100);

  return (
    <div className="p-6 space-y-6 max-w-full">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-5 h-5 text-[#8a8a8a]" />
            <h1 className="text-lg font-semibold text-white">MITRE ATLAS Overlay</h1>
            <span className="text-[9px] px-2 py-0.5 rounded-full border border-[#8a8a8a]/30 bg-[#8a8a8a]/10 text-[#8a8a8a] font-mono uppercase">
              ATT&CK + ATLAS v5.1
            </span>
          </div>
          <p className="text-xs text-zinc-500">
            AI-specific attack technique tracking — {TOTAL_TECHNIQUES} techniques, {TOTAL_SUB} sub-techniques across agentic attack vectors
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'ATLAS Techniques', value: TOTAL_TECHNIQUES.toString(), sub: `${TOTAL_SUB} sub-techniques`, color: '#8a8a8a', icon: Target },
          { label: 'Coverage Rate', value: `${coverageRate}%`, sub: `${TOTAL_COVERED}/${TOTAL_TECHNIQUES} covered`, color: '#c9b787', icon: Shield },
          { label: 'Active Detections', value: ATLAS_TACTICS.reduce((s, t) => s + t.detections, 0).toString(), sub: 'across all tactics', color: '#f5f5f5', icon: Activity },
          { label: 'Coverage Gaps', value: AGENTIC_VECTORS.filter(v => v.status === 'gap').length.toString(), sub: 'agentic vectors uncovered', color: '#f5f5f5', icon: AlertTriangle },
        ].map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="rounded-xl border border-white/8 bg-white/3 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-zinc-500">{m.label}</span>
                <Icon className="w-3.5 h-3.5" style={{ color: m.color }} />
              </div>
              <div className="text-xl font-bold text-white font-mono">{m.value}</div>
              <div className="text-[10px] text-zinc-500 mt-0.5">{m.sub}</div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-1 mb-2">
        {(['matrix', 'vectors', 'studies'] as const).map((v) => (
          <button key={v} onClick={() => setActiveView(v)} className={cn(
            'text-[10px] px-3 py-1.5 rounded-lg border transition-colors capitalize',
            activeView === v ? 'bg-white/10 border-white/20 text-white' : 'border-white/5 text-zinc-500 hover:text-zinc-300',
          )}>
            {v === 'matrix' ? 'ATLAS Matrix' : v === 'vectors' ? 'Agentic Vectors' : 'Case Studies'}
          </button>
        ))}
      </div>

      {activeView === 'matrix' && (
        <div>
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-[#8a8a8a]" />
            ATLAS Tactic Coverage Heatmap
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
            {ATLAS_TACTICS.map((tactic) => {
              const coverage = tactic.techniques > 0 ? (tactic.covered / tactic.techniques) * 100 : 0;
              const intensity = coverage / 100;
              return (
                <div key={tactic.id} className={cn(
                  'rounded-xl border p-4 transition-all hover:border-white/20',
                  coverage === 100 ? 'border-[#c9b787]/30 bg-[#c9b787]/5' :
                  coverage >= 70 ? 'border-[#c9b787]/20 bg-white/3' :
                  'border-[#f5f5f5]/15 bg-white/3',
                )}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-[9px] text-zinc-500 font-mono block">{tactic.id}</span>
                      <span className="text-[11px] font-medium text-white">{tactic.name}</span>
                    </div>
                    <span className={cn(
                      'text-sm font-bold font-mono',
                      coverage >= 80 ? 'text-[#c9b787]' : coverage >= 60 ? 'text-[#c9b787]' : 'text-[#f5f5f5]',
                    )}>
                      {Math.round(coverage)}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 mb-2">
                    <div className="h-full rounded-full transition-all" style={{
                      width: `${coverage}%`,
                      background: coverage >= 80 ? '#c9b787' : coverage >= 60 ? '#c9b787' : '#f5f5f5',
                      opacity: 0.6 + intensity * 0.4,
                    }} />
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                    <span>{tactic.covered}/{tactic.techniques} techniques</span>
                    <span>{tactic.subTechniques} sub-techniques</span>
                    <span className="text-[#c9b787]">{tactic.detections} detections</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeView === 'vectors' && (
        <div>
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Bot className="w-3.5 h-3.5 text-[#f5f5f5]" />
            Agentic Attack Vector Tracking
          </h2>
          <div className="space-y-2">
            {AGENTIC_VECTORS.map((vector) => (
              <div key={vector.id} className={cn(
                'rounded-xl border p-4',
                vector.status === 'gap' ? 'border-[#f5f5f5]/20 bg-[#f5f5f5]/3' :
                vector.status === 'partial' ? 'border-[#c9b787]/20 bg-white/3' :
                'border-white/8 bg-white/3',
              )}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-medium text-white">{vector.technique}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#8a8a8a]/10 text-[#8a8a8a] border border-[#8a8a8a]/20 font-mono">{vector.atlasId}</span>
                      <span className={cn('text-[9px] px-1.5 py-0.5 rounded border', STATUS_STYLE[vector.status])}>
                        {vector.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-400 leading-relaxed">{vector.description}</p>
                  </div>
                  <span className={cn(
                    'text-[9px] px-1.5 py-0.5 rounded border shrink-0',
                    vector.severity === 'critical' ? 'text-[#f5f5f5] border-[#f5f5f5]/30 bg-[#f5f5f5]/10' : 'text-[#c9b787] border-[#c9b787]/30 bg-[#c9b787]/10',
                  )}>
                    {vector.severity}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                  <span>{vector.detections} active detections</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeView === 'studies' && (
        <div>
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-[#c9b787]" />
            Case Study Reference Panel
          </h2>
          <div className="space-y-2">
            {CASE_STUDIES.map((cs) => (
              <div key={cs.id} className="rounded-xl border border-white/8 bg-white/3 p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="text-[11px] font-medium text-white block mb-1">{cs.title}</span>
                    <span className="text-[9px] text-[#8a8a8a] font-mono">{cs.source} · {cs.date}</span>
                  </div>
                </div>
                <p className="text-[10px] text-zinc-400 mb-2">{cs.impact}</p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {cs.techniques.map((t) => (
                    <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-[#8a8a8a]/10 text-[#8a8a8a] border border-[#8a8a8a]/20 font-mono">{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
