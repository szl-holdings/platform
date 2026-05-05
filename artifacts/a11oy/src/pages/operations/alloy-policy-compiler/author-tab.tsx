import { AlertTriangle, Code2, FileCode, Save, Shield, Sparkles, Wand2 } from 'lucide-react';
import { ACCENT, BG, BORDER, EFFECT_CFG, TEXT } from './constants';
import { ConfidenceMeter, DiffLine, EffectBadge } from './shared';
import type { CompiledPolicy, CompiledRule } from './types';

interface Props {
  input: string;
  setInput: (v: string) => void;
  showSuggestions: boolean;
  setShowSuggestions: (v: (s: boolean) => boolean) => void;
  patternSuggestions: string[];
  saveMessage: string;
  setSaveMessage: (v: string) => void;
  compiled: CompiledPolicy | null;
  compiling: boolean;
  savingVersion: boolean;
  handleCompile: () => void;
  handleSaveVersion: () => void;
  handleResolveAllWithAI: () => void;
  handleResolveWithAI: (rule: CompiledRule) => void;
  handleRevertAI: (rule: CompiledRule) => void;
  LLM_THRESHOLD: number;
  prevPolicy: CompiledPolicy | null;
  diffLines: Array<{ type: 'added' | 'removed' | 'unchanged' | 'header'; text: string }>;
}

export function AuthorTab({ input, setInput, showSuggestions, setShowSuggestions, patternSuggestions, saveMessage, setSaveMessage, compiled, compiling, savingVersion, handleCompile, handleSaveVersion, handleResolveAllWithAI, handleResolveWithAI, handleRevertAI, LLM_THRESHOLD, prevPolicy, diffLines }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="flex flex-col gap-3">
        <div className="rounded border p-3" style={{ background: BG.surface, borderColor: BORDER.muted }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold" style={{ color: TEXT.secondary }}>
              <FileCode className="w-3.5 h-3.5" />
              NATURAL LANGUAGE INPUT
            </div>
            <button onClick={() => setShowSuggestions((s) => !s)} className="flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded hover:bg-white/5" style={{ color: TEXT.tertiary, border: `1px solid ${BORDER.muted}` }}>
              <Sparkles className="w-2.5 h-2.5" /> Patterns
            </button>
          </div>

          {showSuggestions && (
            <div className="rounded p-2.5 mb-2 flex flex-col gap-1.5" style={{ background: `${ACCENT}07`, border: `1px solid ${ACCENT}20` }}>
              <div className="text-[9px] font-mono uppercase tracking-wider mb-1" style={{ color: ACCENT }}>Pattern Library</div>
              {patternSuggestions.map((p, i) => (
                <button key={i} onClick={() => { setInput(input + (input.endsWith('\n') ? '' : '\n') + p + '.'); setShowSuggestions(() => false); }} className="text-left text-[10px] px-2 py-1.5 rounded hover:bg-white/5 transition-colors" style={{ color: TEXT.secondary, border: `1px solid ${BORDER.subtle}` }}>
                  {p}
                </button>
              ))}
            </div>
          )}

          <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={12} placeholder="Write your governance rules in plain English. Each sentence becomes a rule. Example: No payout over $250,000 without two approvers and a finance sign-off." className="w-full rounded px-3 py-2.5 text-[12px] font-mono resize-none outline-none leading-relaxed" style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${BORDER.muted}`, color: TEXT.primary, caretColor: ACCENT }} />

          <div className="flex items-center justify-between mt-2">
            <div className="text-[9px] font-mono" style={{ color: TEXT.tertiary }}>
              {input.split(/[.\n]+/).filter((s) => s.trim().length > 5).length} rule sentence{input.split(/[.\n]+/).filter((s) => s.trim().length > 5).length !== 1 ? 's' : ''} · auto-compiles after pause
            </div>
            <div className="flex items-center gap-2">
              <input value={saveMessage} onChange={(e) => setSaveMessage(e.target.value)} placeholder="Version message…" className="text-[10px] px-2 py-1 rounded outline-none w-40" style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${BORDER.muted}`, color: TEXT.primary }} />
              <button onClick={handleSaveVersion} disabled={!compiled || savingVersion} className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-semibold transition-opacity disabled:opacity-40" style={{ color: '#22c55e', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)' }}>
                <Save className="w-3 h-3" />
                {savingVersion ? 'Saving…' : 'Save Version'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {!compiled ? (
          <div className="rounded border p-6 flex flex-col items-center justify-center gap-3 min-h-48" style={{ background: BG.surface, borderColor: BORDER.subtle }}>
            <Code2 className="w-8 h-8" style={{ color: TEXT.muted }} />
            <div className="text-[11px] font-mono text-center" style={{ color: TEXT.tertiary }}>Start typing to auto-compile<br />or click Compile</div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="rounded border p-3" style={{ background: BG.surface, borderColor: BORDER.muted }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold" style={{ color: TEXT.secondary }}>
                  <Shield className="w-3.5 h-3.5" />
                  COMPILED POLICY
                </div>
                <div className="flex items-center gap-2">
                  {compiled.rules.some((r) => r.confidence < LLM_THRESHOLD && !r.llmAssisted) && (
                    <button onClick={handleResolveAllWithAI} className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-semibold" style={{ color: '#a78bfa', background: 'rgba(139,122,200,0.1)', border: '1px solid rgba(139,122,200,0.3)' }}>
                      <Wand2 className="w-2.5 h-2.5" /> Resolve {compiled.rules.filter((r) => r.confidence < LLM_THRESHOLD && !r.llmAssisted).length} ambiguous with AI
                    </button>
                  )}
                  <div className="text-[9px] font-mono" style={{ color: TEXT.tertiary }}>Confidence</div>
                  <div className="w-24"><ConfidenceMeter value={compiled.overallConfidence} /></div>
                </div>
              </div>

              <div className="text-[13px] font-semibold mb-1" style={{ color: TEXT.primary }}>{compiled.name}</div>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ color: '#8b7ac8', background: 'rgba(139,122,200,0.1)', border: '1px solid rgba(139,122,200,0.25)' }}>scope: {compiled.scope}</span>
                {compiled.domain && <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ color: '#38bdf8', background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)' }}>domain: {compiled.domain}</span>}
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ color: TEXT.tertiary, background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER.subtle}` }}>{compiled.rules.length} rule{compiled.rules.length !== 1 ? 's' : ''}</span>
              </div>

              <div className="flex flex-col gap-2">
                {compiled.rules.map((rule) => (
                  <div key={rule.id} className="rounded border p-2.5" style={{ background: rule.confidence < LLM_THRESHOLD ? `${EFFECT_CFG[rule.effect].bg}` : 'rgba(255,255,255,0.02)', borderColor: rule.llmAssisted ? ACCENT : rule.confidence < LLM_THRESHOLD ? EFFECT_CFG[rule.effect].border : BORDER.muted }}>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <EffectBadge effect={rule.effect} />
                        <span className="text-[11px] font-medium" style={{ color: TEXT.primary }}>{rule.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {rule.llmAssisted ? (
                          <button onClick={() => handleRevertAI(rule)} className="flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ color: ACCENT, background: `${ACCENT}10`, border: `1px solid ${ACCENT}30` }}>
                            <Wand2 className="w-2.5 h-2.5" /> Revert AI
                          </button>
                        ) : rule.confidence < LLM_THRESHOLD ? (
                          <button onClick={() => handleResolveWithAI(rule)} disabled={rule.llmStatus === 'loading'} className="flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded disabled:opacity-50" style={{ color: '#a78bfa', background: 'rgba(139,122,200,0.1)', border: '1px solid rgba(139,122,200,0.3)' }}>
                            <Wand2 className={`w-2.5 h-2.5 ${rule.llmStatus === 'loading' ? 'animate-pulse' : ''}`} />
                            {rule.llmStatus === 'loading' ? 'Resolving…' : 'Resolve with AI'}
                          </button>
                        ) : null}
                        <div className="w-20"><ConfidenceMeter value={rule.confidence} /></div>
                      </div>
                    </div>

                    {rule.conditions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-1.5">
                        {rule.conditions.map((c, ci) => (
                          <span key={ci} className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ color: TEXT.secondary, background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER.subtle}` }}>{c.label}</span>
                        ))}
                        {rule.requiredApproverRole && <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ color: '#38bdf8', background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.2)' }}>approver: {rule.requiredApproverRole}</span>}
                        {rule.escalateTo && <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ color: '#ec4899', background: 'rgba(236,72,153,0.06)', border: '1px solid rgba(236,72,153,0.2)' }}>→ {rule.escalateTo}</span>}
                      </div>
                    )}

                    {rule.llmNote && (
                      <div className="text-[9px] font-mono mt-1 px-2 py-1 rounded" style={{ background: `${ACCENT}08`, color: ACCENT, border: `1px solid ${ACCENT}20` }}>
                        <Wand2 className="inline w-2.5 h-2.5 mr-1" />{rule.llmNote}
                      </div>
                    )}

                    {rule.warnings.map((w, wi) => (
                      <div key={wi} className="flex items-start gap-1 mt-1" style={{ color: '#d4a054' }}>
                        <AlertTriangle className="w-2.5 h-2.5 mt-0.5 shrink-0" />
                        <span className="text-[9px] font-mono">{w}</span>
                      </div>
                    ))}

                    <div className="text-[9px] font-mono mt-1" style={{ color: TEXT.muted }}>{rule.reason}</div>
                  </div>
                ))}
              </div>

              {compiled.warnings.length > 0 && (
                <div className="mt-3 flex flex-col gap-1">
                  {compiled.warnings.map((w, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[9px] font-mono" style={{ color: '#d4a054' }}>
                      <AlertTriangle className="w-2.5 h-2.5" />{w}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {prevPolicy && diffLines.length > 0 && (
              <div className="rounded border p-3" style={{ background: BG.surface, borderColor: BORDER.muted }}>
                <div className="text-[10px] font-mono font-semibold mb-2" style={{ color: TEXT.secondary }}>Policy Diff (vs. previous compile)</div>
                <div className="flex flex-col gap-0.5 overflow-y-auto max-h-48">
                  {diffLines.map((line, i) => <DiffLine key={i} type={line.type} text={line.text} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
