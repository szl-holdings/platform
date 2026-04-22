import { useStandardMutation, useStandardQuery } from '@szl-holdings/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowLeft,
  Award,
  BarChart3,
  Briefcase,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Edit3,
  FileText,
  Flag,
  Info,
  Loader2,
  Percent,
  Plus,
  Shield,
  Star,
  Trash2,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { apiFetch } from './api';
import { CertFitComparison, ControlAuthorityMap, EquityChart, OfficerMatrix } from './charts';
import { BoolCheck, DisclaimerBanner, PriorityBadge, ScoreBar, StatusBadge } from './components';
import { InlineForm, useEntityMutation } from './InlineForm';
import { NextActionsPanel } from './NextActionsPanel';
import type { ScenarioDetail } from './types';

// ─── Scenario Detail View ─────────────────────────────────────────────────────

const DETAIL_TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'equity', label: 'Equity & Voting', icon: Percent },
  { id: 'control', label: 'Control Map', icon: Shield },
  { id: 'officers', label: 'Officers & Governance', icon: Briefcase },
  { id: 'certifications', label: 'Cert Fit', icon: Award },
  { id: 'signatures', label: 'Signature Authority', icon: Edit3 },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'actions', label: 'Next Actions', icon: ClipboardList },
  { id: 'log', label: 'Decision Log', icon: Flag },
] as const;

type DetailTab = (typeof DETAIL_TABS)[number]['id'];

export function ScenarioDetailView({
  scenarioId,
  onBack,
}: {
  scenarioId: number;
  onBack: () => void;
}) {
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [showAddForm, setShowAddForm] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data, isLoading, error } = useStandardQuery<ScenarioDetail>({
    queryKey: ['ownership-scenario-detail', scenarioId],
    queryFn: () => apiFetch(`/ownership/scenarios/${scenarioId}`),
  });

  const activateMutation = useStandardMutation({
    mutationFn: () =>
      apiFetch(`/ownership/scenarios/${scenarioId}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: true }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ownership-scenario-detail', scenarioId] }),
  });

  const allocationCrud = useEntityMutation(scenarioId, 'allocations');
  const controlRoleCrud = useEntityMutation(scenarioId, 'control-roles');
  const officerCrud = useEntityMutation(scenarioId, 'officer-roles');
  const managerCrud = useEntityMutation(scenarioId, 'manager-roles');
  const signatureCrud = useEntityMutation(scenarioId, 'signature-authority');
  const certReadinessCrud = useEntityMutation(scenarioId, 'certification-readiness');
  const _legalFlagCrud = useEntityMutation(scenarioId, 'legal-flags');
  const govDocCrud = useEntityMutation(scenarioId, 'governance-documents');
  const decisionLogCrud = useEntityMutation(scenarioId, 'decision-log');

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
      </div>
    );

  if (error || !data)
    return (
      <div className="flex items-center gap-3 bg-red-500/8 border border-red-500/20 rounded-xl p-4">
        <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
        <p className="text-sm text-red-400">Failed to load scenario details.</p>
      </div>
    );

  const {
    scenario,
    allocations,
    controlRoles,
    officerRoles,
    managerRoles,
    signatureAuth,
    certReadiness,
    legalFlags,
    govDocs,
    decisionLog,
  } = data;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Scenarios
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40" />
        <span className="text-sm text-foreground font-medium truncate">{scenario.name}</span>
        {scenario.isPreferred && (
          <Star className="w-3.5 h-3.5 text-amber-500" aria-label="Preferred structure" />
        )}
        {scenario.isActive && (
          <span className="text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold">
            ACTIVE
          </span>
        )}
      </div>

      <DisclaimerBanner />

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold text-foreground">{scenario.name}</h2>
          {scenario.description && (
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
              {scenario.description}
            </p>
          )}
        </div>
        {!scenario.isActive && (
          <button
            onClick={() => activateMutation.mutate()}
            disabled={activateMutation.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-colors shrink-0"
          >
            {activateMutation.isPending ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Check className="w-3 h-3" />
            )}
            Set as Active
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <ScoreBar
          label="Fundraising Fit"
          score={scenario.fundraisingFitScore}
          color="bg-violet-500"
        />
        <ScoreBar label="Banking Fit" score={scenario.bankFitScore} color="bg-sky-500" />
        <ScoreBar
          label="Investor Clarity"
          score={scenario.investorClarityScore}
          color="bg-emerald-500"
        />
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {DETAIL_TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0',
                activeTab === tab.id
                  ? 'bg-primary text-white'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted',
              )}
            >
              <Icon className="w-3 h-3" /> {tab.label}
            </button>
          );
        })}
      </div>

      <div>
        {activeTab === 'overview' && (
          <div className="space-y-5">
            {scenario.certificationFitSummary && (
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" /> Certification Fit Summary
                </h3>
                <p className="text-sm text-foreground leading-relaxed">
                  {scenario.certificationFitSummary}
                </p>
              </div>
            )}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> Ownership Summary
                </h3>
                {allocations.length > 0 ? (
                  <EquityChart allocations={allocations} />
                ) : (
                  <p className="text-sm text-muted-foreground">No allocations defined.</p>
                )}
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> Open Flags
                </h3>
                {legalFlags.filter((f) => f.status === 'open').length === 0 ? (
                  <p className="text-sm text-muted-foreground">No open flags.</p>
                ) : (
                  <div className="space-y-2">
                    {legalFlags
                      .filter((f) => f.status === 'open')
                      .slice(0, 5)
                      .map((flag) => (
                        <div key={flag.id} className="flex items-center gap-2">
                          <PriorityBadge priority={flag.priority} />
                          <span className="text-xs text-foreground truncate">{flag.title}</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
            {scenario.notes && (
              <div className="flex items-start gap-2.5 bg-muted/30 rounded-xl p-4 border border-border">
                <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">{scenario.notes}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'equity' && (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5" /> Equity Allocation
              </h3>
              {allocations.length > 0 ? (
                <EquityChart allocations={allocations} />
              ) : (
                <p className="text-sm text-muted-foreground">No allocations defined.</p>
              )}
            </div>
            <div className="bg-card border border-border rounded-xl divide-y divide-border/50">
              <div className="px-4 py-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Detailed Allocations
                </span>
                <button
                  onClick={() => setShowAddForm(showAddForm === 'allocation' ? null : 'allocation')}
                  className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  <Plus className="w-3 h-3" /> Add Allocation
                </button>
              </div>
              {showAddForm === 'allocation' && (
                <div className="px-4 py-3">
                  <InlineForm
                    fields={[
                      {
                        key: 'personName',
                        label: 'Person Name',
                        type: 'text',
                        placeholder: 'e.g. Angela (Mom)',
                      },
                      { key: 'equityPct', label: 'Equity %', type: 'number' },
                      { key: 'votingRightsPct', label: 'Voting Rights %', type: 'number' },
                      {
                        key: 'membershipClass',
                        label: 'Membership Class',
                        type: 'text',
                        placeholder: 'e.g. Class A',
                      },
                      { key: 'isControlling', label: 'Controlling Owner', type: 'checkbox' },
                      { key: 'isMajorityOwner', label: 'Majority Owner (51%+)', type: 'checkbox' },
                      {
                        key: 'citizenshipConfirmed',
                        label: 'U.S. Citizenship Confirmed',
                        type: 'checkbox',
                      },
                      { key: 'notes', label: 'Notes', type: 'text', placeholder: 'Optional notes' },
                    ]}
                    onSubmit={(vals) => {
                      allocationCrud.addMutation.mutate(vals as Record<string, unknown>);
                      setShowAddForm(null);
                    }}
                    onCancel={() => setShowAddForm(null)}
                  />
                </div>
              )}
              {allocations.map((a) => (
                <div key={a.id} className="px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{a.personName}</span>
                      {a.isControlling && (
                        <Shield className="w-3 h-3 text-primary" aria-label="Controlling owner" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-foreground tabular-nums">
                        {a.equityPct}%
                      </span>
                      <button
                        onClick={() => allocationCrud.deleteMutation.mutate(a.id)}
                        className="text-muted-foreground/40 hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                    <BoolCheck value={a.isControlling} label="Controlling owner" />
                    <BoolCheck value={a.isMajorityOwner} label="Majority owner (51%+)" />
                    <BoolCheck value={a.citizenshipConfirmed} label="U.S. citizenship confirmed" />
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Voting:</span>
                      <span className="text-xs font-medium text-foreground">
                        {a.votingRightsPct ?? a.equityPct}%
                      </span>
                    </div>
                  </div>
                  {a.notes && (
                    <p className="text-xs text-muted-foreground/70 leading-relaxed">{a.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'control' && (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> Control Authority Map
                </h3>
                <button
                  onClick={() => setShowAddForm(showAddForm === 'control' ? null : 'control')}
                  className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  <Plus className="w-3 h-3" /> Add Control Role
                </button>
              </div>
              {showAddForm === 'control' && (
                <div className="mb-4">
                  <InlineForm
                    fields={[
                      {
                        key: 'personName',
                        label: 'Person Name',
                        type: 'text',
                        placeholder: 'e.g. Angela (Mom)',
                      },
                      {
                        key: 'roleType',
                        label: 'Role Type',
                        type: 'select',
                        options: [
                          'managing_member',
                          'ceo',
                          'president',
                          'board_chair',
                          'majority_owner',
                          'authorized_signer',
                        ],
                      },
                      {
                        key: 'controlDescription',
                        label: 'Control Description',
                        type: 'text',
                        placeholder: 'Day-to-day operational decisions',
                      },
                      { key: 'hasHiringAuthority', label: 'Hiring Authority', type: 'checkbox' },
                      { key: 'hasFiringAuthority', label: 'Firing Authority', type: 'checkbox' },
                      {
                        key: 'hasContractAuthority',
                        label: 'Contract Authority',
                        type: 'checkbox',
                      },
                      { key: 'hasBankingAuthority', label: 'Banking Authority', type: 'checkbox' },
                    ]}
                    onSubmit={(vals) => {
                      controlRoleCrud.addMutation.mutate(vals as Record<string, unknown>);
                      setShowAddForm(null);
                    }}
                    onCancel={() => setShowAddForm(null)}
                  />
                </div>
              )}
              {controlRoles.length > 0 ? (
                <ControlAuthorityMap controlRoles={controlRoles} />
              ) : (
                <p className="text-sm text-muted-foreground">No control roles defined.</p>
              )}
            </div>
            {controlRoles.map((r) => (
              <div key={r.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {r.personName} — {(r.roleType || '').replace(/_/g, ' ')}
                  </div>
                  <button
                    onClick={() => controlRoleCrud.deleteMutation.mutate(r.id)}
                    className="text-muted-foreground/40 hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                {r.controlDescription && (
                  <p className="text-sm text-foreground leading-relaxed">{r.controlDescription}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'officers' && (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5" /> Officer Roles
                </h3>
                <button
                  onClick={() => setShowAddForm(showAddForm === 'officer' ? null : 'officer')}
                  className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  <Plus className="w-3 h-3" /> Add Officer
                </button>
              </div>
              {showAddForm === 'officer' && (
                <div className="mb-4">
                  <InlineForm
                    fields={[
                      {
                        key: 'personName',
                        label: 'Person Name',
                        type: 'text',
                        placeholder: 'e.g. Angela (Mom)',
                      },
                      {
                        key: 'title',
                        label: 'Title',
                        type: 'select',
                        options: [
                          'CEO',
                          'President',
                          'Secretary',
                          'Treasurer',
                          'CFO',
                          'COO',
                          'CTO',
                          'VP',
                        ],
                      },
                      {
                        key: 'responsibilities',
                        label: 'Responsibilities',
                        type: 'text',
                        placeholder: 'Key responsibilities',
                      },
                      {
                        key: 'appointedBy',
                        label: 'Appointed By',
                        type: 'text',
                        placeholder: 'e.g. Board resolution',
                      },
                      { key: 'isDocumented', label: 'Documented', type: 'checkbox' },
                    ]}
                    onSubmit={(vals) => {
                      officerCrud.addMutation.mutate(vals as Record<string, unknown>);
                      setShowAddForm(null);
                    }}
                    onCancel={() => setShowAddForm(null)}
                  />
                </div>
              )}
              {officerRoles.length > 0 ? (
                <OfficerMatrix officerRoles={officerRoles} />
              ) : (
                <p className="text-sm text-muted-foreground">No officer roles defined.</p>
              )}
              {officerRoles.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between py-1.5 border-t border-border/40 mt-2 first:mt-0"
                >
                  <span className="text-xs text-muted-foreground">
                    {r.personName} — {r.title}
                  </span>
                  <button
                    onClick={() => officerCrud.deleteMutation.mutate(r.id)}
                    className="text-muted-foreground/40 hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" /> Management Roles
                </h3>
                <button
                  onClick={() => setShowAddForm(showAddForm === 'manager' ? null : 'manager')}
                  className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  <Plus className="w-3 h-3" /> Add Manager
                </button>
              </div>
              {showAddForm === 'manager' && (
                <div className="mb-4">
                  <InlineForm
                    fields={[
                      {
                        key: 'personName',
                        label: 'Person Name',
                        type: 'text',
                        placeholder: 'e.g. Stephen',
                      },
                      {
                        key: 'managementArea',
                        label: 'Management Area',
                        type: 'select',
                        options: [
                          'operations',
                          'finance',
                          'technology',
                          'strategy',
                          'hr',
                          'marketing',
                          'compliance',
                          'legal',
                        ],
                      },
                      {
                        key: 'responsibility',
                        label: 'Responsibility',
                        type: 'text',
                        placeholder: 'Specific responsibility description',
                      },
                      { key: 'isDocumented', label: 'Documented', type: 'checkbox' },
                    ]}
                    onSubmit={(vals) => {
                      managerCrud.addMutation.mutate(vals as Record<string, unknown>);
                      setShowAddForm(null);
                    }}
                    onCancel={() => setShowAddForm(null)}
                  />
                </div>
              )}
              {managerRoles.length > 0 ? (
                <div className="space-y-2">
                  {managerRoles.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-start gap-3 py-2 border-b border-border/40 last:border-0"
                    >
                      <div className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded border border-border capitalize shrink-0">
                        {r.managementArea}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-foreground">{r.personName}</span>
                        {r.responsibility && (
                          <p className="text-xs text-muted-foreground mt-0.5">{r.responsibility}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0 mt-0.5">
                        {r.isDocumented ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <AlertCircle
                            className="w-3.5 h-3.5 text-amber-500/60"
                            aria-label="Not yet documented"
                          />
                        )}
                        <button
                          onClick={() => managerCrud.deleteMutation.mutate(r.id)}
                          className="text-muted-foreground/40 hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No management roles defined.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'certifications' && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 bg-muted/30 border border-border rounded-xl p-3.5">
              <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Fit levels are structural readiness assessments only. They do not represent
                eligibility determinations or certification approvals. All applications require
                attorney review.
              </p>
            </div>
            <div className="flex items-center justify-end">
              <button
                onClick={() => setShowAddForm(showAddForm === 'cert' ? null : 'cert')}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
              >
                <Plus className="w-3 h-3" /> Add Cert Readiness
              </button>
            </div>
            {showAddForm === 'cert' && (
              <InlineForm
                fields={[
                  {
                    key: 'certType',
                    label: 'Certification Type',
                    type: 'select',
                    options: ['WOSB', 'EDWOSB', 'MWBE', 'SBA_8a', 'HUBZone', 'SDVOSB'],
                  },
                  {
                    key: 'fitLevel',
                    label: 'Fit Level',
                    type: 'select',
                    options: ['strong_fit', 'moderate_fit', 'weak_fit', 'not_applicable'],
                  },
                  {
                    key: 'notes',
                    label: 'Notes',
                    type: 'text',
                    placeholder: 'Readiness assessment notes',
                  },
                  {
                    key: 'gapDescription',
                    label: 'Gap Description',
                    type: 'text',
                    placeholder: 'Known gaps or issues',
                  },
                ]}
                onSubmit={(vals) => {
                  certReadinessCrud.addMutation.mutate(vals as Record<string, unknown>);
                  setShowAddForm(null);
                }}
                onCancel={() => setShowAddForm(null)}
              />
            )}
            {certReadiness.length > 0 ? (
              <CertFitComparison certReadiness={certReadiness} />
            ) : (
              <p className="text-sm text-muted-foreground">No certification readiness records.</p>
            )}
          </div>
        )}

        {activeTab === 'signatures' && (
          <div className="bg-card border border-border rounded-xl divide-y divide-border/50">
            <div className="px-4 py-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5" /> Signature Authority Tracker
              </span>
              <button
                onClick={() => setShowAddForm(showAddForm === 'signature' ? null : 'signature')}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
              >
                <Plus className="w-3 h-3" /> Add Signer
              </button>
            </div>
            {showAddForm === 'signature' && (
              <div className="px-4 py-3">
                <InlineForm
                  fields={[
                    {
                      key: 'personName',
                      label: 'Person Name',
                      type: 'text',
                      placeholder: 'e.g. Angela (Mom)',
                    },
                    {
                      key: 'authorityType',
                      label: 'Authority Type',
                      type: 'select',
                      options: [
                        'bank_signatory',
                        'contract_signer',
                        'tax_signer',
                        'registered_agent',
                        'corporate_officer',
                      ],
                    },
                    {
                      key: 'institution',
                      label: 'Institution',
                      type: 'text',
                      placeholder: 'e.g. Chase Bank',
                    },
                    {
                      key: 'documentationStatus',
                      label: 'Documentation Status',
                      type: 'select',
                      options: ['documented', 'pending', 'missing'],
                    },
                    { key: 'notes', label: 'Notes', type: 'text', placeholder: 'Optional notes' },
                  ]}
                  onSubmit={(vals) => {
                    signatureCrud.addMutation.mutate(vals as Record<string, unknown>);
                    setShowAddForm(null);
                  }}
                  onCancel={() => setShowAddForm(null)}
                />
              </div>
            )}
            {signatureAuth.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No signature authority records.
              </div>
            ) : (
              signatureAuth.map((s) => (
                <div key={s.id} className="flex items-start gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground">{s.personName}</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground capitalize">
                        {s.authorityType.replace(/_/g, ' ')}
                      </span>
                      {s.institution && (
                        <span className="text-xs text-muted-foreground">@ {s.institution}</span>
                      )}
                    </div>
                    {s.notes && (
                      <p className="text-xs text-muted-foreground/70 mt-0.5">{s.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={s.documentationStatus} />
                    <button
                      onClick={() => signatureCrud.deleteMutation.mutate(s.id)}
                      className="text-muted-foreground/40 hover:text-red-500 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="bg-card border border-border rounded-xl divide-y divide-border/50">
            <div className="px-4 py-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Governance Documents
              </span>
              <button
                onClick={() => setShowAddForm(showAddForm === 'document' ? null : 'document')}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
              >
                <Plus className="w-3 h-3" /> Add Document
              </button>
            </div>
            {showAddForm === 'document' && (
              <div className="px-4 py-3">
                <InlineForm
                  fields={[
                    {
                      key: 'title',
                      label: 'Document Title',
                      type: 'text',
                      placeholder: 'e.g. Operating Agreement',
                    },
                    {
                      key: 'documentType',
                      label: 'Document Type',
                      type: 'select',
                      options: [
                        'operating_agreement',
                        'articles_of_organization',
                        'bylaws',
                        'board_resolution',
                        'ownership_certificate',
                        'banking_resolution',
                        'tax_filing',
                        'compliance_record',
                      ],
                    },
                    {
                      key: 'status',
                      label: 'Status',
                      type: 'select',
                      options: ['current', 'draft', 'expired', 'missing', 'needs_update'],
                    },
                    { key: 'notes', label: 'Notes', type: 'text', placeholder: 'Optional notes' },
                  ]}
                  onSubmit={(vals) => {
                    govDocCrud.addMutation.mutate(vals as Record<string, unknown>);
                    setShowAddForm(null);
                  }}
                  onCancel={() => setShowAddForm(null)}
                />
              </div>
            )}
            {govDocs.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No governance documents defined.
              </div>
            ) : (
              govDocs.map((d) => (
                <div key={d.id} className="flex items-start gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground">{d.title}</span>
                      <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">
                        {d.documentType.replace(/_/g, ' ')}
                      </span>
                    </div>
                    {d.notes && (
                      <p className="text-xs text-muted-foreground/70 mt-0.5">{d.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={d.status} />
                    <button
                      onClick={() => govDocCrud.deleteMutation.mutate(d.id)}
                      className="text-muted-foreground/40 hover:text-red-500 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'actions' && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <ClipboardList className="w-4 h-4 text-primary" /> Next Actions Queue
            </h3>
            <NextActionsPanel scenarioId={scenarioId} />
          </div>
        )}

        {activeTab === 'log' && (
          <div className="bg-card border border-border rounded-xl divide-y divide-border/50">
            <div className="px-4 py-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Flag className="w-3.5 h-3.5" /> Decision Log
              </span>
              <button
                onClick={() => setShowAddForm(showAddForm === 'decision' ? null : 'decision')}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
              >
                <Plus className="w-3 h-3" /> Log Decision
              </button>
            </div>
            {showAddForm === 'decision' && (
              <div className="px-4 py-3">
                <InlineForm
                  fields={[
                    {
                      key: 'summary',
                      label: 'Decision Summary',
                      type: 'text',
                      placeholder: 'What was decided?',
                    },
                    {
                      key: 'decisionType',
                      label: 'Decision Type',
                      type: 'select',
                      options: [
                        'ownership_change',
                        'governance_update',
                        'certification_action',
                        'banking_change',
                        'legal_review',
                        'fundraising_decision',
                      ],
                    },
                    {
                      key: 'madeBy',
                      label: 'Made By',
                      type: 'text',
                      placeholder: 'e.g. Angela + Stephen',
                    },
                    {
                      key: 'rationale',
                      label: 'Rationale',
                      type: 'text',
                      placeholder: 'Why this decision was made',
                    },
                  ]}
                  onSubmit={(vals) => {
                    decisionLogCrud.addMutation.mutate(vals as Record<string, unknown>);
                    setShowAddForm(null);
                  }}
                  onCancel={() => setShowAddForm(null)}
                  submitLabel="Log"
                />
              </div>
            )}
            {decisionLog.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No decision log entries.
              </div>
            ) : (
              decisionLog.map((entry) => (
                <div key={entry.id} className="px-4 py-3 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded capitalize">
                        {entry.decisionType.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(entry.occurredAt).toLocaleDateString()}
                      </span>
                      {entry.madeBy && (
                        <span className="text-xs text-muted-foreground">by {entry.madeBy}</span>
                      )}
                    </div>
                    <button
                      onClick={() => decisionLogCrud.deleteMutation.mutate(entry.id)}
                      className="text-muted-foreground/40 hover:text-red-500 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-sm text-foreground">{entry.summary}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
