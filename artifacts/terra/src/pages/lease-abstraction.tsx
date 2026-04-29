import { useStandardMutation, useStandardQuery } from '@szl-holdings/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  ChevronDown,
  Database,
  DollarSign,
  Download,
  FileText,
  RefreshCw,
  TrendingUp,
  Upload,
} from 'lucide-react';
import React, { useRef, useState } from 'react';
import { api } from '../lib/api';

const DS = {
  page: '#08090e',
  surface: 'rgba(255,255,255,0.025)',
  border: 'rgba(255,255,255,0.05)',
  accent: { gold: '#b8943c', blue: '#3a7ad4', green: '#40856a', red: '#c0503a' },
  text: {
    primary: 'rgba(255,255,255,0.85)',
    secondary: 'rgba(255,255,255,0.5)',
    tertiary: 'rgba(255,255,255,0.3)',
    muted: 'rgba(255,255,255,0.18)',
  },
};

interface ExtractedLease {
  id: string;
  documentName: string;
  tenant: string;
  premises: string;
  propertyAddress: string;
  leaseType: string;
  commencementDate: string;
  expirationDate: string;
  baseRent: number;
  rentPerSqft: number;
  sqft: number;
  escalations: string;
  options: string[];
  cam: number;
  tiAllowance: number;
  securityDeposit: number;
  terminationOption: string;
  exclusiveUse: string;
  coTenancy: string;
  extractedAt: string;
  confidence: number;
  flags: { field: string; issue: string; severity: 'warning' | 'info' | 'error' }[];
}

const DEMO_LEASES: ExtractedLease[] = [
  {
    id: 'lease-001',
    documentName: 'Meridian_Tech_Lease_Executed.pdf',
    tenant: 'Meridian Technologies Inc.',
    premises: 'Suite 1200, Floors 12–14',
    propertyAddress: '1200 Gateway Blvd, Dallas, TX 75201',
    leaseType: 'Full Service Gross',
    commencementDate: '2022-01-01',
    expirationDate: '2029-12-31',
    baseRent: 48750,
    rentPerSqft: 3.25,
    sqft: 15000,
    escalations: '3% per annum on Jan 1 each lease year',
    options: [
      '2 × 5-year renewal options at 95% of then-market rent',
      'Right of first offer on contiguous space (Suite 1300)',
    ],
    cam: 8500,
    tiAllowance: 1200000,
    securityDeposit: 97500,
    terminationOption:
      "Tenant termination right effective Jan 1, 2027 with 12-month notice + 6 months' rent fee",
    exclusiveUse: 'No exclusive use clause',
    coTenancy: 'Not applicable',
    extractedAt: new Date().toISOString(),
    confidence: 94,
    flags: [
      {
        field: 'TI Allowance',
        issue:
          'TI allowance disbursement schedule not specified — amend to require monthly draws with lien waivers',
        severity: 'warning',
      },
      {
        field: 'Termination Option',
        issue:
          'Early termination fee of only 6 months may undercut lender hold period — review with capital markets',
        severity: 'warning',
      },
    ],
  },
  {
    id: 'lease-002',
    documentName: 'BrightPath_Health_Lease_Amendment2.pdf',
    tenant: 'BrightPath Health Systems LLC',
    premises: 'Suite 400, Ground Floor',
    propertyAddress: '1200 Gateway Blvd, Dallas, TX 75201',
    leaseType: 'Modified Gross',
    commencementDate: '2019-07-01',
    expirationDate: '2026-06-30',
    baseRent: 23100,
    rentPerSqft: 2.2,
    sqft: 10500,
    escalations: '2% per annum, fixed',
    options: ['1 × 3-year renewal at 90% of then-market rent'],
    cam: 4200,
    tiAllowance: 0,
    securityDeposit: 46200,
    terminationOption: 'None',
    exclusiveUse: 'Exclusive use for medical/healthcare services within the building',
    coTenancy: 'Not applicable',
    extractedAt: new Date(Date.now() - 86400000).toISOString(),
    confidence: 87,
    flags: [
      {
        field: 'Base Rent',
        issue:
          'Rent is 30% below current market ($2.85/sqft) — renewal negotiation opportunity if tenant exercises option',
        severity: 'warning',
      },
      {
        field: 'Escalation',
        issue: '2% annual escalation below projected CPI — effective rent will erode in real terms',
        severity: 'info',
      },
      {
        field: 'TI Allowance',
        issue: 'No TI funded for renewal — tenant may require capital to exercise option',
        severity: 'info',
      },
    ],
  },
  {
    id: 'lease-003',
    documentName: 'DataVault_Systems_NNN_Lease.pdf',
    tenant: 'DataVault Systems Corp.',
    premises: 'Suite 600, Floors 6–7',
    propertyAddress: '1200 Gateway Blvd, Dallas, TX 75201',
    leaseType: 'Triple Net (NNN)',
    commencementDate: '2023-09-01',
    expirationDate: '2030-08-31',
    baseRent: 27440,
    rentPerSqft: 2.8,
    sqft: 9800,
    escalations: '2.5% per annum on September 1 each year',
    options: ['1 × 5-year renewal at fair market rent (FMR arbitration if no agreement)'],
    cam: 0,
    tiAllowance: 392000,
    securityDeposit: 54880,
    terminationOption: 'None',
    exclusiveUse: 'None',
    coTenancy: 'None',
    extractedAt: new Date(Date.now() - 172800000).toISOString(),
    confidence: 96,
    flags: [],
  },
];

interface FieldDef {
  key: keyof ExtractedLease;
  label: string;
  format?: (v: string | number) => string;
}

interface FieldGroup {
  label: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  fields: FieldDef[];
}

const FIELD_GROUPS: FieldGroup[] = [
  {
    label: 'Lease Basics',
    icon: FileText,
    fields: [
      { key: 'leaseType', label: 'Lease Type' },
      { key: 'commencementDate', label: 'Commencement' },
      { key: 'expirationDate', label: 'Expiration' },
      { key: 'sqft', label: 'Leased SF', format: (v) => `${Number(v).toLocaleString()} SF` },
    ],
  },
  {
    label: 'Financials',
    icon: DollarSign,
    fields: [
      { key: 'baseRent', label: 'Base Rent/Mo', format: (v) => `$${Number(v).toLocaleString()}` },
      { key: 'rentPerSqft', label: 'Rent/SF/Mo', format: (v) => `$${Number(v).toFixed(2)}` },
      {
        key: 'cam',
        label: 'CAM/Mo',
        format: (v) => (Number(v) > 0 ? `$${Number(v).toLocaleString()}` : '—'),
      },
      {
        key: 'tiAllowance',
        label: 'TI Allowance',
        format: (v) => (Number(v) > 0 ? `$${(Number(v) / 1000).toFixed(0)}K` : '—'),
      },
      {
        key: 'securityDeposit',
        label: 'Security Deposit',
        format: (v) => `$${Number(v).toLocaleString()}`,
      },
    ],
  },
  {
    label: 'Escalations & Options',
    icon: TrendingUp,
    fields: [
      { key: 'escalations', label: 'Escalation Clause' },
      { key: 'terminationOption', label: 'Termination Option' },
      { key: 'exclusiveUse', label: 'Exclusive Use' },
    ],
  },
];

function ConfidenceBadge({ score }: { score: number }) {
  const color = score >= 90 ? DS.accent.green : score >= 75 ? DS.accent.gold : DS.accent.red;
  return (
    <div className="flex items-center gap-1.5">
      <div className="relative w-8 h-8">
        <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
          <circle
            cx="16"
            cy="16"
            r="12"
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="3"
          />
          <circle
            cx="16"
            cy="16"
            r="12"
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeDasharray={`${(score / 100) * 75.4} 75.4`}
            strokeLinecap="round"
          />
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center text-[8px] font-bold font-mono"
          style={{ color }}
        >
          {score}
        </span>
      </div>
      <span className="text-[9px] font-medium" style={{ color: DS.text.muted }}>
        AI Confidence
      </span>
    </div>
  );
}

function UploadZone({
  onUpload,
  processing,
}: {
  onUpload: (files: FileList) => void;
  processing?: boolean;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length > 0) onUpload(e.dataTransfer.files);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) onUpload(e.target.files);
  }

  return (
    <div
      onClick={() => !processing && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className="rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all"
      style={{
        borderColor: dragging ? DS.accent.gold : 'rgba(255,255,255,0.1)',
        background: dragging ? 'rgba(184,148,60,0.04)' : 'transparent',
        opacity: processing ? 0.7 : 1,
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.txt"
        multiple
        className="hidden"
        onChange={handleChange}
      />
      <Upload className="w-8 h-8 mx-auto mb-3" style={{ color: DS.accent.gold }} />
      <p className="text-sm font-semibold" style={{ color: DS.text.primary }}>
        {processing ? 'Extracting lease terms…' : 'Drop lease documents here'}
      </p>
      <p className="text-xs mt-1" style={{ color: DS.text.muted }}>
        PDF, DOCX, or TXT · TERRA AI Engine extracts key terms
      </p>
      <div className="flex items-center justify-center gap-2 mt-4">
        <span
          className="text-[10px] px-2 py-0.5 rounded"
          style={{
            background: 'rgba(58,122,212,0.08)',
            color: DS.accent.blue,
            border: `1px solid rgba(58,122,212,0.2)`,
          }}
        >
          Live Extraction
        </span>
        <span className="text-[10px]" style={{ color: DS.text.muted }}>
          · Text parsing · persisted to DB
        </span>
      </div>
    </div>
  );
}

function LeaseCard({
  lease,
  selected,
  onClick,
}: {
  lease: ExtractedLease;
  selected: boolean;
  onClick: () => void;
}) {
  const daysToExpiry = Math.ceil(
    (new Date(lease.expirationDate).getTime() - Date.now()) / 86400000,
  );
  const yearsLeft = (daysToExpiry / 365).toFixed(1);
  const urgency = daysToExpiry < 365 ? 'high' : daysToExpiry < 730 ? 'medium' : 'low';
  const urgencyColor =
    urgency === 'high' ? DS.accent.red : urgency === 'medium' ? DS.accent.gold : DS.accent.green;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="rounded-xl border p-4 cursor-pointer transition-all"
      style={{
        borderColor: selected ? DS.accent.gold : DS.border,
        background: selected ? 'rgba(184,148,60,0.04)' : DS.surface,
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold truncate" style={{ color: DS.text.primary }}>
            {lease.tenant}
          </p>
          <p className="text-[10px] mt-0.5 truncate" style={{ color: DS.text.tertiary }}>
            {lease.documentName}
          </p>
        </div>
        <ConfidenceBadge score={lease.confidence} />
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3">
        <div>
          <p className="text-[8px] uppercase tracking-wider" style={{ color: DS.text.muted }}>
            Base Rent
          </p>
          <p className="text-[11px] font-bold font-mono" style={{ color: DS.accent.gold }}>
            ${lease.baseRent.toLocaleString()}/mo
          </p>
        </div>
        <div>
          <p className="text-[8px] uppercase tracking-wider" style={{ color: DS.text.muted }}>
            Size
          </p>
          <p className="text-[11px] font-bold font-mono" style={{ color: DS.text.primary }}>
            {lease.sqft.toLocaleString()} SF
          </p>
        </div>
        <div>
          <p className="text-[8px] uppercase tracking-wider" style={{ color: DS.text.muted }}>
            Expires
          </p>
          <p className="text-[11px] font-bold font-mono" style={{ color: urgencyColor }}>
            {yearsLeft}yr
          </p>
        </div>
      </div>

      {lease.flags.length > 0 && (
        <div
          className="flex items-center gap-1.5 mt-3 pt-2"
          style={{ borderTop: `1px solid ${DS.border}` }}
        >
          <AlertTriangle className="w-3 h-3 shrink-0" style={{ color: DS.accent.gold }} />
          <span className="text-[9px]" style={{ color: DS.text.muted }}>
            {lease.flags.length} review item{lease.flags.length > 1 ? 's' : ''}
          </span>
        </div>
      )}
    </motion.div>
  );
}

function LeaseDetail({ lease }: { lease: ExtractedLease }) {
  const [expanded, setExpanded] = useState<string>('Lease Basics');

  return (
    <div className="space-y-3">
      <div
        className="rounded-xl border p-4"
        style={{ borderColor: DS.border, background: DS.surface }}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="text-sm font-bold" style={{ color: DS.text.primary }}>
              {lease.tenant}
            </h3>
            <p className="text-xs mt-0.5" style={{ color: DS.text.tertiary }}>
              {lease.premises} · {lease.propertyAddress}
            </p>
          </div>
          <button
            className="flex items-center gap-1.5 text-[10px] px-2.5 py-1.5 rounded-lg font-semibold"
            style={{
              background: 'rgba(58,122,212,0.1)',
              border: '1px solid rgba(58,122,212,0.2)',
              color: DS.accent.blue,
            }}
          >
            <Download className="w-3 h-3" />
            Export
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Annual Rent', value: `$${(lease.baseRent * 12).toLocaleString()}` },
            { label: 'Rent/SF/Yr', value: `$${(lease.rentPerSqft * 12).toFixed(2)}` },
            {
              label: 'WALE',
              value: `${((new Date(lease.expirationDate).getTime() - Date.now()) / (365.25 * 86400000)).toFixed(1)}yr`,
            },
            { label: 'AI Conf.', value: `${lease.confidence}%` },
          ].map((m) => (
            <div
              key={m.label}
              className="rounded-lg p-2.5"
              style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${DS.border}` }}
            >
              <p className="text-[8px] uppercase tracking-wider" style={{ color: DS.text.muted }}>
                {m.label}
              </p>
              <p className="text-sm font-bold font-mono mt-0.5" style={{ color: DS.accent.gold }}>
                {m.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {lease.flags.length > 0 && (
        <div
          className="rounded-xl border overflow-hidden"
          style={{ borderColor: 'rgba(184,148,60,0.2)', background: 'rgba(184,148,60,0.04)' }}
        >
          <div
            className="flex items-center gap-2 px-4 py-2.5 border-b"
            style={{ borderColor: 'rgba(184,148,60,0.1)' }}
          >
            <AlertTriangle className="w-3.5 h-3.5" style={{ color: DS.accent.gold }} />
            <span
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: DS.accent.gold }}
            >
              Review Items
            </span>
          </div>
          <div className="divide-y" style={{ borderColor: 'rgba(184,148,60,0.1)' }}>
            {lease.flags.map((f, i) => (
              <div key={i} className="px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                    style={{
                      color:
                        f.severity === 'error'
                          ? DS.accent.red
                          : f.severity === 'warning'
                            ? DS.accent.gold
                            : DS.accent.blue,
                      background: `${f.severity === 'error' ? DS.accent.red : f.severity === 'warning' ? DS.accent.gold : DS.accent.blue}12`,
                    }}
                  >
                    {f.field}
                  </span>
                </div>
                <p className="text-[10px] leading-relaxed" style={{ color: DS.text.secondary }}>
                  {f.issue}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {FIELD_GROUPS.map((group) => (
        <div
          key={group.label}
          className="rounded-xl border overflow-hidden"
          style={{ borderColor: DS.border, background: DS.surface }}
        >
          <button
            onClick={() => setExpanded(expanded === group.label ? '' : group.label)}
            className="w-full flex items-center gap-2 px-4 py-3 hover:bg-white/[0.02] transition-colors"
          >
            <group.icon className="w-3.5 h-3.5" style={{ color: DS.accent.gold }} />
            <span
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: `${DS.accent.gold}99` }}
            >
              {group.label}
            </span>
            <ChevronDown
              className="w-3.5 h-3.5 ml-auto transition-transform"
              style={{
                color: DS.text.muted,
                transform: expanded === group.label ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            />
          </button>
          <AnimatePresence>
            {expanded === group.label && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-2.5">
                  {group.fields.map((f) => (
                    <div
                      key={f.key}
                      className="flex items-start gap-3 py-1.5"
                      style={{ borderTop: `1px solid ${DS.border}` }}
                    >
                      <span
                        className="text-[9px] uppercase tracking-wider shrink-0 w-28"
                        style={{ color: DS.text.muted }}
                      >
                        {f.label}
                      </span>
                      <span className="text-[10px] flex-1" style={{ color: DS.text.secondary }}>
                        {f.format
                          ? f.format(lease[f.key] as string | number)
                          : String(lease[f.key] ?? '—')}
                      </span>
                    </div>
                  ))}
                  {group.label === 'Escalations & Options' &&
                    lease.options.map((opt, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 py-1.5"
                        style={{ borderTop: `1px solid ${DS.border}` }}
                      >
                        <span
                          className="text-[9px] uppercase tracking-wider shrink-0 w-28"
                          style={{ color: DS.text.muted }}
                        >
                          Option {i + 1}
                        </span>
                        <span className="text-[10px] flex-1" style={{ color: DS.text.secondary }}>
                          {opt}
                        </span>
                      </div>
                    ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

export default function LeaseAbstractionPage() {
  const queryClient = useQueryClient();

  const {
    data: apiData,
    isLoading,
    isError,
  } = useStandardQuery({
    queryKey: ['terra-leases'],
    queryFn: () => api.leases.list(),
    staleTime: 30_000,
  });

  const seedMutation = useStandardMutation({
    mutationFn: async () => {
      for (const lease of DEMO_LEASES) {
        await api.leases.create({
          documentName: lease.documentName,
          tenant: lease.tenant,
          premises: lease.premises,
          propertyAddress: lease.propertyAddress,
          leaseType: lease.leaseType,
          commencementDate: lease.commencementDate,
          expirationDate: lease.expirationDate,
          baseRent: lease.baseRent,
          rentPerSqft: lease.rentPerSqft,
          sqft: lease.sqft,
          escalations: lease.escalations,
          options: lease.options,
          cam: lease.cam,
          tiAllowance: lease.tiAllowance,
          securityDeposit: lease.securityDeposit,
          terminationOption: lease.terminationOption,
          exclusiveUse: lease.exclusiveUse,
          coTenancy: lease.coTenancy,
          confidence: lease.confidence,
          flags: lease.flags,
          isDemo: true,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['terra-leases'] });
    },
  });

  const isLive = !isLoading && !isError && apiData && apiData.dataMode === 'live';
  const apiLeases: ExtractedLease[] = isLive ? (apiData.leases as unknown as ExtractedLease[]) : [];

  const uploadMutation = useStandardMutation({
    mutationFn: (file: File) => api.leases.upload(file),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['terra-leases'] });
      setSelectedId(data.lease.id);
    },
  });

  const [localLeases, _setLocalLeases] = useState<ExtractedLease[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const processing = uploadMutation.isPending;

  const leases = isLive
    ? apiLeases
    : [...localLeases, ...DEMO_LEASES.filter((d) => !localLeases.some((l) => l.id === d.id))];
  const effectiveId = selectedId ?? leases[0]?.id ?? null;
  const selected = leases.find((l) => l.id === effectiveId) ?? null;

  function handleFileUpload(files: FileList) {
    setUploadError(null);
    const file = files[0];
    if (!file) return;
    uploadMutation.mutate(file, {
      onError: (err) => {
        setUploadError(err instanceof Error ? err.message : 'Upload failed');
      },
    });
  }

  const totalAnnualRent = leases.reduce((s, l) => s + l.baseRent * 12, 0);
  const totalSqft = leases.reduce((s, l) => s + l.sqft, 0);
  const flaggedCount = leases.filter((l) => l.flags.length > 0).length;

  return (
    <div className="space-y-4 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-0.5">
            <h1 className="text-base font-bold text-white tracking-tight font-display">
              Lease Abstraction Engine
            </h1>
            <span
              className="text-[9px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider font-bold"
              style={{
                color: DS.accent.gold,
                background: `${DS.accent.gold}10`,
                border: `1px solid ${DS.accent.gold}20`,
              }}
            >
              AI-Powered
            </span>
            {isLive ? (
              <span
                className="flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded"
                style={{
                  color: DS.accent.green,
                  background: `${DS.accent.green}10`,
                  border: `1px solid ${DS.accent.green}20`,
                }}
              >
                <Database className="w-2.5 h-2.5" /> Live DB ({leases.length})
              </span>
            ) : (
              !isLoading &&
              !isError && (
                <button
                  onClick={() => seedMutation.mutate()}
                  disabled={seedMutation.isPending}
                  className="flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded cursor-pointer"
                  style={{
                    color: DS.text.muted,
                    background: DS.surface,
                    border: `1px solid ${DS.border}`,
                  }}
                >
                  {seedMutation.isPending ? 'Seeding…' : 'Seed to DB'}
                </button>
              )
            )}
          </div>
          <p className="text-[10px] font-mono" style={{ color: DS.text.muted }}>
            Upload lease documents — AI extracts key terms, flags issues, feeds property detail
            pages
          </p>
        </div>
        <div className="flex items-center gap-2">
          {processing && (
            <div
              className="flex items-center gap-1.5 text-[10px]"
              style={{ color: DS.accent.gold }}
            >
              <RefreshCw className="w-3 h-3 animate-spin" />
              Extracting terms...
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Leases Abstracted', value: leases.length.toString(), color: DS.accent.gold },
          {
            label: 'Total Sq Footage',
            value: `${(totalSqft / 1000).toFixed(0)}K SF`,
            color: DS.accent.blue,
          },
          {
            label: 'Annual Rent',
            value: `$${(totalAnnualRent / 1000000).toFixed(1)}M`,
            color: DS.accent.green,
          },
          {
            label: 'Review Items',
            value: flaggedCount.toString(),
            color: flaggedCount > 0 ? DS.accent.gold : DS.text.muted,
          },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-xl border p-3"
            style={{ borderColor: DS.border, background: DS.surface }}
          >
            <p className="text-[8px] uppercase tracking-wider" style={{ color: DS.text.muted }}>
              {m.label}
            </p>
            <p className="text-xl font-bold font-mono mt-1" style={{ color: m.color }}>
              {m.value}
            </p>
          </div>
        ))}
      </div>

      <UploadZone onUpload={handleFileUpload} processing={processing} />
      {uploadError && (
        <div
          className="rounded-lg border p-3 flex items-center gap-2"
          style={{ borderColor: `${DS.accent.red}40`, background: `${DS.accent.red}08` }}
        >
          <AlertTriangle className="w-3 h-3 shrink-0" style={{ color: DS.accent.red }} />
          <p className="text-[10px]" style={{ color: DS.accent.red }}>
            {uploadError}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="space-y-3">
          <div
            className="text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: DS.text.muted }}
          >
            Abstracted Leases
          </div>
          {leases.map((l) => (
            <LeaseCard
              key={l.id}
              lease={l}
              selected={selectedId === l.id}
              onClick={() => setSelectedId(l.id)}
            />
          ))}
        </div>
        <div className="lg:col-span-2">
          {selected ? (
            <LeaseDetail lease={selected} />
          ) : (
            <div
              className="rounded-xl border p-12 text-center"
              style={{ borderColor: DS.border, background: DS.surface }}
            >
              <FileText className="w-8 h-8 mx-auto mb-3" style={{ color: DS.text.muted }} />
              <p style={{ color: DS.text.tertiary }}>Select a lease to view extracted terms</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
