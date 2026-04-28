import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Layers,
  RefreshCw,
  Ticket,
  TrendingDown,
  TrendingUp,
  UserCheck,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { ACCENT, BORDER, CURRENT_ACTOR } from './constants';
import { RISK_REGISTER } from './data';
import { DomainTag, SeverityDot, useLive } from './helpers';
import { useActionStore } from './action-store';
import { ToastContainer, useToasts } from './toast';
import type { DomainId, LinearTeamOption, RiskLinearOverride } from './types';

type Risk = (typeof RISK_REGISTER)[number];

function LinearAdminPanel({
  teams,
  teamsErr,
  defaultTeamKey,
  defaultTeamLabel,
  adminOpen,
  setAdminOpen,
  autoCreateLabels,
  savingDefault,
  onSaveDefaultTeam,
  onToggleAutoCreate,
}: {
  teams: LinearTeamOption[];
  teamsErr: string | null;
  defaultTeamKey: string | null;
  defaultTeamLabel: string | null;
  adminOpen: boolean;
  setAdminOpen: (v: (p: boolean) => boolean) => void;
  autoCreateLabels: boolean;
  savingDefault: boolean;
  onSaveDefaultTeam: (key: string | null) => void;
  onToggleAutoCreate: (v: boolean) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', padding: '0.625rem 0.875rem', marginBottom: '0.5rem', background: 'hsla(0,0%,100%,0.02)', border: `1px solid ${BORDER}`, borderRadius: '0.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
        <Ticket style={{ width: 12, height: 12, color: ACCENT }} />
        <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }}>Linear routing</span>
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)' }}>
          New tickets land in:{' '}
          <strong style={{ color: 'rgba(255,255,255,0.85)' }}>
            {defaultTeamLabel ?? (teams[0] ? `${teams[0].key} · ${teams[0].name} (workspace default)` : teamsErr ? '—' : 'loading…')}
          </strong>
        </span>
        {teamsErr && <span style={{ fontSize: '10px', color: '#f97316' }}>· {teamsErr}</span>}
        <button onClick={() => setAdminOpen((o) => !o)}
          style={{ marginLeft: 'auto', fontSize: '10px', fontWeight: 600, padding: '3px 9px', borderRadius: '4px', background: adminOpen ? `${ACCENT}25` : 'hsla(0,0%,100%,0.04)', border: `1px solid ${adminOpen ? `${ACCENT}50` : BORDER}`, color: adminOpen ? ACCENT : 'rgba(255,255,255,0.55)', cursor: 'pointer' }}>
          {adminOpen ? 'Close admin' : 'Admin'}
        </button>
      </div>
      {adminOpen && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', borderTop: `1px solid ${BORDER}`, paddingTop: '0.5rem' }}>
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>Default team</span>
          <select value={defaultTeamKey ?? ''} onChange={(e) => onSaveDefaultTeam(e.target.value || null)} disabled={savingDefault || teams.length === 0}
            style={{ fontSize: '11px', background: 'hsla(0,0%,100%,0.06)', border: `1px solid ${BORDER}`, borderRadius: '4px', padding: '3px 6px', color: 'rgba(255,255,255,0.85)', outline: 'none', minWidth: '200px' }}>
            <option value="">— Workspace first team —</option>
            {teams.map((t) => <option key={t.id} value={t.key}>{t.key} · {t.name}</option>)}
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginLeft: 'auto', fontSize: '10px', color: 'rgba(255,255,255,0.7)', cursor: savingDefault ? 'wait' : 'pointer' }}>
            <input type="checkbox" checked={autoCreateLabels} disabled={savingDefault} onChange={(e) => onToggleAutoCreate(e.target.checked)} style={{ accentColor: ACCENT, cursor: savingDefault ? 'wait' : 'pointer' }} />
            Auto-create missing labels
          </label>
        </div>
      )}
    </div>
  );
}

function RiskRow({
  risk,
  index,
  isLast,
  isSelected,
  onSelect,
  store,
  patch,
  show,
  teams,
  teamsErr,
  defaultTeamKey,
  defaultTeamLabel,
  autoCreateLabels,
  advancedOpen,
  setAdvancedOpen,
  labelDraft,
  setLabelDraft,
  editingOwner,
  setEditingOwner,
  ownerInput,
  setOwnerInput,
  onSaveOwner,
}: {
  risk: Risk;
  index: number;
  isLast: boolean;
  isSelected: boolean;
  onSelect: () => void;
  store: ReturnType<typeof useActionStore>['store'];
  patch: ReturnType<typeof useActionStore>['patch'];
  show: (text: string, type?: 'success' | 'info' | 'error', duration?: number) => void;
  teams: LinearTeamOption[];
  teamsErr: string | null;
  defaultTeamKey: string | null;
  defaultTeamLabel: string | null;
  autoCreateLabels: boolean;
  advancedOpen: string | null;
  setAdvancedOpen: (id: string | null) => void;
  labelDraft: Record<string, string>;
  setLabelDraft: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  editingOwner: string | null;
  setEditingOwner: (id: string | null) => void;
  ownerInput: string;
  setOwnerInput: (v: string) => void;
  onSaveOwner: (riskId: string) => void;
}) {
  const color = risk.level === 'critical' ? '#ef4444' : risk.level === 'high' ? '#f97316' : '#f59e0b';
  const riskAction = store.riskActions[risk.id];
  const effectiveOwner = store.riskOwners[risk.id] ?? risk.owner;
  const isEditingThisOwner = editingOwner === risk.id;

  function setOverride(next: RiskLinearOverride | null) {
    if (next === null || (!next.teamKey && (!next.labels || next.labels.length === 0))) {
      patch({ riskLinearOverrides: { [risk.id]: null } });
    } else {
      patch({ riskLinearOverrides: { [risk.id]: next } });
    }
  }

  function addLabel() {
    const draft = (labelDraft[risk.id] ?? '').trim();
    if (!draft) return;
    const override = store.riskLinearOverrides[risk.id] ?? {};
    const existing = override.labels ?? [];
    if (existing.includes(draft)) { setLabelDraft((d) => ({ ...d, [risk.id]: '' })); return; }
    setOverride({ ...override, labels: [...existing, draft].slice(0, 10) });
    setLabelDraft((d) => ({ ...d, [risk.id]: '' }));
  }

  function removeLabel(label: string) {
    const override = store.riskLinearOverrides[risk.id] ?? {};
    setOverride({ ...override, labels: (override.labels ?? []).filter((l) => l !== label) });
  }

  async function handleTicket() {
    const startedAt = new Date().toISOString();
    patch({ riskActions: { [risk.id]: { type: 'ticket', status: 'running', at: startedAt, actor: CURRENT_ACTOR } } });
    show('Creating Linear ticket…', 'info', 2000);
    const priorityMap: Record<string, number> = { critical: 1, high: 2, medium: 3, low: 4 };
    const description = [`**Risk:** ${risk.title}`, `**Domain:** ${risk.domain}`, `**Severity:** ${risk.level} (impact ${risk.impact}, probability ${Math.round(risk.probability * 100)}%)`, `**Mitigation:** ${risk.mitigation}`, ``, `Created from SZL Holdings Business State (risk id: ${risk.id}).`].join('\n');
    const override = store.riskLinearOverrides[risk.id] ?? {};
    const baseLabels = [`domain:${risk.domain}`, `severity:${risk.level}`, 'szl-business-state'];
    const extraLabels = (override.labels ?? []).filter((l) => l && !baseLabels.includes(l));
    const labels = [...baseLabels, ...extraLabels];
    const teamKey = override.teamKey && override.teamKey.trim().length > 0 ? override.teamKey.trim() : undefined;
    try {
      const response = await fetch('/api/linear/create-ticket', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: `[${risk.domain.toUpperCase()}] ${risk.title}`, description, priority: priorityMap[risk.level] ?? 3, assigneeName: risk.owner, labels, ...(teamKey ? { teamKey } : {}) }) });
      const json = await response.json().catch(() => null);
      if (!response.ok || !json?.identifier) {
        patch({ riskActions: { [risk.id]: null } });
        show(json?.error || `Linear ticket creation failed (HTTP ${response.status})`, 'error', 6000);
        return;
      }
      patch({ riskActions: { [risk.id]: { type: 'ticket', status: 'done', ticketId: json.identifier, ticketUrl: json.url, at: new Date().toISOString(), actor: CURRENT_ACTOR } } });
      show(`Linear ticket ${json.identifier} created — assigned to ${json.assignee?.name ?? risk.owner}.`, 'success');
      const created = Array.isArray(json.createdLabels) ? (json.createdLabels as string[]) : [];
      const skipped = Array.isArray(json.skippedLabels) ? (json.skippedLabels as string[]) : [];
      if (created.length > 0) show(`Auto-created missing label${created.length > 1 ? 's' : ''}: ${created.join(', ')}`, 'info', 5000);
      if (skipped.length > 0) show(`Heads up — these labels weren't applied: ${skipped.join(', ')}. ${autoCreateLabels ? 'Linear refused the auto-create.' : 'Auto-create is off in admin.'}`, 'error', 7000);
    } catch (err) {
      patch({ riskActions: { [risk.id]: null } });
      show(`Could not reach Linear: ${(err as Error).message}`, 'error', 6000);
    }
  }

  function handlePlaybook() {
    patch({ riskActions: { [risk.id]: { type: 'playbook', status: 'running', at: new Date().toISOString(), actor: CURRENT_ACTOR } } });
    show('Triggering credential rotation playbook…', 'info', 2000);
    setTimeout(() => {
      patch({ riskActions: { [risk.id]: { type: 'playbook', status: 'done', result: 'Credentials rotated. Pipeline reconnected at 14:38. Freshness restored.', at: new Date().toISOString(), actor: CURRENT_ACTOR } } });
      show('Playbook complete — Carlota CRM pipeline reconnected successfully.', 'success');
    }, 2500);
  }

  const override = store.riskLinearOverrides[risk.id] ?? {};
  const hasOverride = !!(override.teamKey || (override.labels && override.labels.length > 0));
  const isAdvancedOpen = advancedOpen === risk.id;
  const draft = labelDraft[risk.id] ?? '';

  return (
    <div style={{ borderBottom: !isLast ? `1px solid ${BORDER}` : 'none' }}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0.875rem', cursor: 'pointer', borderLeft: `3px solid ${color}60` }}
        onClick={onSelect}
      >
        <SeverityDot level={risk.level} />
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.8)', flex: 1 }}>{risk.title}</span>
        {risk.domain && <DomainTag domain={risk.domain as DomainId} />}
        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>P: {Math.round(risk.probability * 100)}%</span>
        {riskAction?.status === 'done' && (
          <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 6px', borderRadius: '3px', background: '#22c55e20', color: '#22c55e' }}>
            {riskAction.type === 'playbook' ? 'Resolved' : `Ticket ${riskAction.ticketId}`}
          </span>
        )}
        <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 7px', borderRadius: '3px', background: `${color}20`, color }}>{risk.level}</span>
        {isSelected ? <ChevronLeft style={{ width: 12, height: 12, color: 'rgba(255,255,255,0.3)', transform: 'rotate(90deg)' }} /> : <ChevronRight style={{ width: 12, height: 12, color: 'rgba(255,255,255,0.3)' }} />}
      </div>

      {isSelected && (
        <div style={{ padding: '0 0.875rem 0.875rem 2rem' }}>
          <div style={{ padding: '0.75rem', background: 'hsla(0,0%,100%,0.02)', border: `1px solid ${BORDER}`, borderRadius: '0.5rem' }}>
            <div style={{ display: 'flex', gap: '2rem', marginBottom: '0.625rem', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', marginBottom: '2px' }}>Owner</div>
                {isEditingThisOwner ? (
                  <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                    <input value={ownerInput} onChange={(e) => setOwnerInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') onSaveOwner(risk.id); if (e.key === 'Escape') { setEditingOwner(null); setOwnerInput(''); } }}
                      placeholder={effectiveOwner}
                      style={{ fontSize: '11px', background: 'hsla(0,0%,100%,0.06)', border: `1px solid ${BORDER}`, borderRadius: '4px', padding: '2px 6px', color: 'rgba(255,255,255,0.8)', outline: 'none', width: '120px' }} />
                    <button onClick={() => onSaveOwner(risk.id)} style={{ fontSize: '9px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: '#22c55e', border: 'none', color: '#fff', cursor: 'pointer' }}>Save</button>
                    <button onClick={() => { setEditingOwner(null); setOwnerInput(''); }} style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', background: 'transparent', border: `1px solid ${BORDER}`, color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}>Cancel</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)' }}>{effectiveOwner}</span>
                    <button onClick={(e) => { e.stopPropagation(); setEditingOwner(risk.id); setOwnerInput(effectiveOwner); }}
                      style={{ fontSize: '9px', padding: '1px 6px', borderRadius: '3px', background: 'hsla(0,0%,100%,0.04)', border: `1px solid ${BORDER}`, color: 'rgba(255,255,255,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <UserCheck style={{ width: 8, height: 8 }} /> Reassign
                    </button>
                  </div>
                )}
              </div>
              <div>
                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', marginBottom: '2px' }}>Impact</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)' }}>{risk.impact}</div>
              </div>
              <div>
                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', marginBottom: '2px' }}>Trend</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  {risk.trend === 'up' ? <TrendingUp style={{ width: 11, height: 11, color: '#ef4444' }} /> : risk.trend === 'down' ? <TrendingDown style={{ width: 11, height: 11, color: '#22c55e' }} /> : <div style={{ width: 11, height: 1, background: 'rgba(255,255,255,0.2)' }} />}
                  <span style={{ fontSize: '11px', color: risk.trend === 'up' ? '#ef4444' : risk.trend === 'down' ? '#22c55e' : 'rgba(255,255,255,0.4)' }}>{risk.trend}</span>
                </div>
              </div>
            </div>
            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', marginBottom: '3px' }}>Mitigation</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5, marginBottom: '0.75rem' }}>{risk.mitigation}</div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', borderTop: `1px solid ${BORDER}`, paddingTop: '0.625rem' }}>
              {risk.id === 'r1' && (
                riskAction?.type === 'playbook' && riskAction.status === 'running' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '10px', color: '#f59e0b' }}>
                    <RefreshCw style={{ width: 11, height: 11, animation: 'spin 1s linear infinite' }} />
                    Running credential rotation playbook…
                  </div>
                ) : riskAction?.type === 'playbook' && riskAction.status === 'done' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '10px', color: '#22c55e' }}>
                    <CheckCircle2 style={{ width: 11, height: 11 }} /> {riskAction.result}
                  </div>
                ) : riskAction?.type !== 'ticket' ? (
                  <button onClick={handlePlaybook} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', fontWeight: 700, padding: '5px 12px', borderRadius: '6px', background: '#c2a55a20', border: '1px solid #c2a55a40', color: '#c2a55a', cursor: 'pointer' }}>
                    <RefreshCw style={{ width: 10, height: 10 }} /> Rotate Credentials &amp; Reconnect
                  </button>
                ) : null
              )}

              {riskAction?.type === 'ticket' && riskAction.status === 'running' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '10px', color: '#f59e0b' }}>
                  <RefreshCw style={{ width: 11, height: 11, animation: 'spin 1s linear infinite' }} /> Creating Linear ticket…
                </div>
              ) : riskAction?.type === 'ticket' && riskAction.status === 'done' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '10px', color: '#22c55e' }}>
                  <CheckCircle2 style={{ width: 11, height: 11 }} />
                  {riskAction.ticketUrl ? (
                    <>Ticket <a href={riskAction.ticketUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#22c55e', fontWeight: 700 }}>{riskAction.ticketId}</a> created in Linear.</>
                  ) : (
                    <>Ticket <strong>{riskAction.ticketId}</strong> created — index migration queued.</>
                  )}
                </div>
              ) : (
                <button onClick={handleTicket} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', fontWeight: 700, padding: '5px 12px', borderRadius: '6px', background: '#f59e0b20', border: '1px solid #f59e0b40', color: '#f59e0b', cursor: 'pointer' }}>
                  <Ticket style={{ width: 10, height: 10 }} /> Create Linear Ticket
                </button>
              )}

              <a href="/command" style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', fontWeight: 600, padding: '5px 12px', borderRadius: '6px', background: `${ACCENT}15`, border: `1px solid ${ACCENT}30`, color: ACCENT, cursor: 'pointer', textDecoration: 'none' }}>
                <ExternalLink style={{ width: 10, height: 10 }} /> Escalate to Command
              </a>

              <button onClick={() => setAdvancedOpen(isAdvancedOpen ? null : risk.id)}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', fontWeight: 600, padding: '5px 12px', borderRadius: '6px', background: hasOverride ? `${ACCENT}20` : 'hsla(0,0%,100%,0.04)', border: `1px solid ${hasOverride ? `${ACCENT}50` : BORDER}`, color: hasOverride ? ACCENT : 'rgba(255,255,255,0.55)', cursor: 'pointer' }}>
                <Layers style={{ width: 10, height: 10 }} />
                {isAdvancedOpen ? 'Hide advanced' : hasOverride ? 'Advanced (overridden)' : 'Advanced'}
              </button>
            </div>

            {isAdvancedOpen && (
              <div style={{ marginTop: '0.625rem', padding: '0.625rem 0.75rem', background: 'hsla(0,0%,100%,0.02)', border: `1px solid ${BORDER}`, borderRadius: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }}>Linear overrides for this risk</span>
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>· remembered for next ticket from this row</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)', minWidth: 60 }}>Team</span>
                  <select value={override.teamKey ?? ''} onChange={(e) => setOverride({ ...override, teamKey: e.target.value || null })} disabled={teams.length === 0}
                    style={{ fontSize: '11px', background: 'hsla(0,0%,100%,0.06)', border: `1px solid ${BORDER}`, borderRadius: '4px', padding: '3px 6px', color: 'rgba(255,255,255,0.85)', outline: 'none', minWidth: '220px' }}>
                    <option value="">— Use workspace default ({defaultTeamLabel ?? (teams[0] ? `${teams[0].key}` : 'auto')}) —</option>
                    {teams.map((t) => <option key={t.id} value={t.key}>{t.key} · {t.name}</option>)}
                  </select>
                  {teamsErr && <span style={{ fontSize: '10px', color: '#f97316' }}>{teamsErr}</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)', minWidth: 60, paddingTop: 4 }}>Labels</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', flex: 1, minWidth: 220 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                      {(override.labels ?? []).map((label) => (
                        <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', padding: '2px 6px', borderRadius: '3px', background: `${ACCENT}20`, color: ACCENT, border: `1px solid ${ACCENT}40` }}>
                          {label}
                          <button onClick={() => removeLabel(label)} style={{ background: 'transparent', border: 'none', color: ACCENT, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                            <X style={{ width: 9, height: 9 }} />
                          </button>
                        </span>
                      ))}
                      {(!override.labels || override.labels.length === 0) && (
                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>None — domain & severity tags are still added automatically.</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                      <input value={draft} onChange={(e) => setLabelDraft((d) => ({ ...d, [risk.id]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLabel(); } }}
                        placeholder="e.g. sla:p1 or customer:acme"
                        style={{ fontSize: '11px', background: 'hsla(0,0%,100%,0.06)', border: `1px solid ${BORDER}`, borderRadius: '4px', padding: '3px 6px', color: 'rgba(255,255,255,0.85)', outline: 'none', flex: 1, minWidth: 160 }} />
                      <button onClick={addLabel} disabled={!draft.trim()}
                        style={{ fontSize: '10px', fontWeight: 700, padding: '3px 9px', borderRadius: '4px', background: draft.trim() ? `${ACCENT}25` : 'hsla(0,0%,100%,0.04)', border: `1px solid ${draft.trim() ? `${ACCENT}50` : BORDER}`, color: draft.trim() ? ACCENT : 'rgba(255,255,255,0.3)', cursor: draft.trim() ? 'pointer' : 'not-allowed' }}>
                        Add
                      </button>
                    </div>
                  </div>
                </div>
                {hasOverride && (
                  <div>
                    <button onClick={() => setOverride(null)} style={{ fontSize: '10px', padding: '3px 9px', borderRadius: '4px', background: 'transparent', border: `1px solid ${BORDER}`, color: 'rgba(255,255,255,0.55)', cursor: 'pointer' }}>
                      Clear overrides
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function RiskRegisterModule() {
  const live = useLive();
  const risks = (live?.riskRegister ?? RISK_REGISTER) as typeof RISK_REGISTER;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingOwner, setEditingOwner] = useState<string | null>(null);
  const [ownerInput, setOwnerInput] = useState('');
  const { store, patch } = useActionStore();
  const { toasts, show, dismiss } = useToasts();

  const [defaultTeamKey, setDefaultTeamKey] = useState<string | null>(null);
  const [autoCreateLabels, setAutoCreateLabels] = useState<boolean>(true);
  const [teams, setTeams] = useState<LinearTeamOption[]>([]);
  const [teamsErr, setTeamsErr] = useState<string | null>(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [savingDefault, setSavingDefault] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState<string | null>(null);
  const [labelDraft, setLabelDraft] = useState<Record<string, string>>({});

  const defaultTeamLabel = (() => {
    if (!defaultTeamKey) return null;
    const t = teams.find((t) => t.key.toLowerCase() === defaultTeamKey.toLowerCase());
    return t ? `${t.key} · ${t.name}` : defaultTeamKey;
  })();

  useEffect(() => {
    let cancelled = false;
    fetch('/api/linear/settings', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (cancelled || !json) return;
        const data = (json.data ?? json) as { defaultTeamKey?: string | null; autoCreateLabels?: boolean };
        setDefaultTeamKey(data?.defaultTeamKey ?? null);
        if (typeof data?.autoCreateLabels === 'boolean') setAutoCreateLabels(data.autoCreateLabels);
      })
      .catch(() => {});
    fetch('/api/linear/teams', { credentials: 'include' })
      .then(async (r) => {
        const json = await r.json().catch(() => null);
        if (cancelled) return;
        if (!r.ok) { setTeamsErr(json?.error || `Could not load Linear teams (HTTP ${r.status})`); return; }
        setTeams((json.data ?? json)?.teams ?? []);
      })
      .catch((err) => { if (!cancelled) setTeamsErr((err as Error).message); });
    return () => { cancelled = true; };
  }, []);

  async function saveLinearSettings(patchBody: { defaultTeamKey?: string | null; autoCreateLabels?: boolean }, successMsg: string) {
    setSavingDefault(true);
    try {
      const r = await fetch('/api/linear/settings', { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patchBody) });
      const json = await r.json().catch(() => null);
      if (!r.ok) {
        const msg = r.status === 401 || r.status === 403 ? 'You need an admin role to change Linear settings.' : json?.error || `Could not save Linear settings (HTTP ${r.status})`;
        show(msg, 'error', 6000);
        return;
      }
      const data = (json.data ?? json) as { defaultTeamKey?: string | null; autoCreateLabels?: boolean };
      if ('defaultTeamKey' in data) setDefaultTeamKey(data.defaultTeamKey ?? null);
      if (typeof data.autoCreateLabels === 'boolean') setAutoCreateLabels(data.autoCreateLabels);
      show(successMsg, 'success');
    } catch (err) {
      show(`Could not save Linear settings: ${(err as Error).message}`, 'error', 6000);
    } finally {
      setSavingDefault(false);
    }
  }

  function handleSaveOwner(riskId: string) {
    if (!ownerInput.trim()) return;
    patch({ riskOwners: { [riskId]: ownerInput.trim() } });
    show(`Owner updated to "${ownerInput.trim()}" — synced to Command Portal.`, 'success');
    setEditingOwner(null);
    setOwnerInput('');
  }

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <LinearAdminPanel
        teams={teams}
        teamsErr={teamsErr}
        defaultTeamKey={defaultTeamKey}
        defaultTeamLabel={defaultTeamLabel}
        adminOpen={adminOpen}
        setAdminOpen={setAdminOpen}
        autoCreateLabels={autoCreateLabels}
        savingDefault={savingDefault}
        onSaveDefaultTeam={(key) => saveLinearSettings({ defaultTeamKey: key }, key ? `Default Linear team set to ${key}.` : "Default Linear team cleared — falls back to the workspace's first team.")}
        onToggleAutoCreate={(next) => saveLinearSettings({ autoCreateLabels: next }, next ? 'Auto-create missing labels enabled — domain & severity tags now self-heal.' : 'Auto-create disabled — missing labels will be surfaced as warnings instead.')}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        {risks.map((risk, i) => (
          <RiskRow
            key={risk.id}
            risk={risk}
            index={i}
            isLast={i === risks.length - 1}
            isSelected={selectedId === risk.id}
            onSelect={() => setSelectedId(selectedId === risk.id ? null : risk.id)}
            store={store}
            patch={patch}
            show={show}
            teams={teams}
            teamsErr={teamsErr}
            defaultTeamKey={defaultTeamKey}
            defaultTeamLabel={defaultTeamLabel}
            autoCreateLabels={autoCreateLabels}
            advancedOpen={advancedOpen}
            setAdvancedOpen={setAdvancedOpen}
            labelDraft={labelDraft}
            setLabelDraft={setLabelDraft}
            editingOwner={editingOwner}
            setEditingOwner={setEditingOwner}
            ownerInput={ownerInput}
            setOwnerInput={setOwnerInput}
            onSaveOwner={handleSaveOwner}
          />
        ))}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
