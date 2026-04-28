import { CheckCircle, History, Lock, RotateCcw, User } from 'lucide-react';
import { ACCENT, BG, BORDER, TEXT } from './constants';
import { ConfidenceMeter, EffectBadge } from './shared';
import type { PolicyVersion } from './types';

interface Props {
  versions: PolicyVersion[];
  auditLog: Array<{ at: number; event: string; actor: string }>;
  handleRollback: (v: PolicyVersion) => void;
  handleSignVersion: (id: string) => void;
  handleActivateVersion: (id: string) => void;
  handleDeactivateVersion: (id: string) => void;
}

export function HistoryTab({ versions, auditLog, handleRollback, handleSignVersion, handleActivateVersion, handleDeactivateVersion }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[12px] font-semibold mb-0.5" style={{ color: TEXT.primary }}>Version History</div>
          <div className="text-[10px] font-mono" style={{ color: TEXT.secondary }}>Every version with author, timestamp, signer attribution, and rollback</div>
        </div>
        <div className="text-[10px] font-mono" style={{ color: TEXT.tertiary }}>{versions.length} version{versions.length !== 1 ? 's' : ''}</div>
      </div>

      {versions.length === 0 ? (
        <div className="rounded border p-8 flex flex-col items-center gap-2" style={{ background: BG.surface, borderColor: BORDER.subtle }}>
          <History className="w-6 h-6" style={{ color: TEXT.muted }} />
          <div className="text-[11px] font-mono" style={{ color: TEXT.tertiary }}>No saved versions yet. Compile and save a version.</div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {[...versions].reverse().map((v, idx) => {
            const isLatest = idx === 0;
            return (
              <div key={v.id} className="rounded border p-3" style={{ background: BG.surface, borderColor: isLatest ? `${ACCENT}35` : BORDER.muted }}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold font-mono shrink-0" style={{ background: isLatest ? `${ACCENT}15` : 'rgba(255,255,255,0.04)', color: isLatest ? ACCENT : TEXT.tertiary, border: `1px solid ${isLatest ? `${ACCENT}40` : BORDER.muted}` }}>
                      v{v.versionNumber}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold" style={{ color: TEXT.primary }}>{v.message}</span>
                        {isLatest && <span className="text-[9px] font-mono px-1.5 py-0.5 rounded uppercase" style={{ color: ACCENT, background: `${ACCENT}12`, border: `1px solid ${ACCENT}30` }}>Latest</span>}
                        {v.isActive && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded uppercase flex items-center gap-1" style={{ color: '#22c55e', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.35)' }}>
                            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#22c55e' }} />Active
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[9px] font-mono mt-0.5" style={{ color: TEXT.tertiary }}>
                        <User className="w-2.5 h-2.5" />{v.author}<span>·</span>
                        <span>{new Date(v.savedAt).toLocaleString()}</span><span>·</span>
                        <span>{v.policy.rules.length} rule{v.policy.rules.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {!isLatest && (
                      <button onClick={() => handleRollback(v)} className="flex items-center gap-1.5 px-2 py-1 rounded text-[9px] font-semibold" style={{ color: '#8b7ac8', background: 'rgba(139,122,200,0.08)', border: '1px solid rgba(139,122,200,0.25)' }}>
                        <RotateCcw className="w-2.5 h-2.5" /> Rollback
                      </button>
                    )}
                    <button onClick={() => handleSignVersion(v.id)} disabled={v.signers.some((s) => s.name === 'Sarah Mitchell')} className="flex items-center gap-1.5 px-2 py-1 rounded text-[9px] font-semibold disabled:opacity-40" style={{ color: '#22c55e', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)' }}>
                      <Lock className="w-2.5 h-2.5" />
                      {v.signers.some((s) => s.name === 'Sarah Mitchell') ? 'Signed' : 'Sign'}
                    </button>
                    {v.isActive ? (
                      <button onClick={() => handleDeactivateVersion(v.id)} className="flex items-center gap-1.5 px-2 py-1 rounded text-[9px] font-semibold" title="Deactivate this policy version" style={{ color: '#f97316', background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.25)' }}>
                        <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#f97316' }} />Deactivate
                      </button>
                    ) : (
                      <button onClick={() => handleActivateVersion(v.id)} disabled={v.signers.length < 1} className="flex items-center gap-1.5 px-2 py-1 rounded text-[9px] font-semibold disabled:opacity-30" title={v.signers.length < 1 ? 'Policy must be signed before activation' : 'Activate this policy version'} style={{ color: '#22c55e', background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)' }}>
                        <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: v.signers.length < 1 ? '#6b7280' : '#22c55e' }} />Activate
                      </button>
                    )}
                  </div>
                </div>

                {v.signers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {v.signers.map((s, i) => (
                      <div key={i} className="flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', color: '#86efac' }}>
                        <Lock className="w-2 h-2" />{s.name} · {s.role} · {new Date(s.signedAt).toLocaleDateString()}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  {v.policy.rules.slice(0, 3).map((r) => (
                    <div key={r.id} className="flex items-center gap-2 text-[10px] font-mono" style={{ color: TEXT.secondary }}>
                      <EffectBadge effect={r.effect} />
                      <span className="truncate">{r.name}</span>
                    </div>
                  ))}
                  {v.policy.rules.length > 3 && <div className="text-[9px] font-mono" style={{ color: TEXT.tertiary }}>+{v.policy.rules.length - 3} more rule{v.policy.rules.length - 3 !== 1 ? 's' : ''}</div>}
                </div>

                <div className="mt-2.5 flex items-center gap-2">
                  <div className="text-[9px] font-mono" style={{ color: TEXT.tertiary }}>Confidence</div>
                  <div className="w-32"><ConfidenceMeter value={v.policy.overallConfidence} /></div>
                  <button onClick={() => navigator.clipboard?.writeText(JSON.stringify(v.policy, null, 2))} className="ml-auto flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded hover:bg-white/5" style={{ color: TEXT.muted, border: `1px solid ${BORDER.subtle}` }}>
                    Copy JSON
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded border p-3" style={{ background: BG.surface, borderColor: BORDER.subtle }}>
        <div className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider mb-2" style={{ color: TEXT.tertiary }}>
          <Lock className="w-3 h-3" /> Audit Log — All Events
        </div>
        <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
          {auditLog.map((entry, i) => (
            <div key={i} className="flex items-center gap-2 text-[9px] font-mono" style={{ color: TEXT.tertiary }}>
              <span style={{ color: TEXT.muted }}>{new Date(entry.at).toLocaleTimeString()}</span>
              <span>{entry.event}</span>
              <span style={{ color: ACCENT }}>· {entry.actor}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
