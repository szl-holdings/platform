import { useStandardQuery } from '@szl-holdings/api-client-react';
import { Badge } from '@szl-holdings/shared-ui/ui/badge';
import { cn } from '@szl-holdings/shared-ui/utils';
import {
  AlertTriangle,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Globe,
  RefreshCw,
  Ship,
  User,
  Users,
} from 'lucide-react';
import { useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

interface Certification {
  name: string;
  code: string;
  issuedBy: string;
  issueDate: string;
  expiryDate: string;
  status: 'valid' | 'expiring_soon' | 'expired';
}

interface CrewMember {
  id: string;
  name: string;
  rank: string;
  rankCode: string;
  nationality: string;
  flagEmoji: string;
  vessel: string;
  imo: string;
  joinDate: string;
  reliefDate: string;
  daysOnBoard: number;
  maxRotationDays: number;
  certifications: Certification[];
  medicalExpiry: string;
  mlcCompliant: boolean;
  flagState: string;
  stcwEndorsement: boolean;
  seafarerIdNo: string;
  contractType: 'employment' | 'agency';
}

interface CrewRotation {
  vessel: string;
  imo: string;
  reliefs: Array<{
    name: string;
    rank: string;
    nationality: string;
    eta: string;
    status: 'confirmed' | 'pending' | 'urgent';
    agency: string;
  }>;
}

interface CrewApiResponse {
  roster: CrewMember[];
  rotations: CrewRotation[];
  summary: {
    total: number;
    expiredCerts: number;
    expiringCerts: number;
    mlcIssues: number;
    rotationAlerts: number;
  };
}

const certStyle: Record<string, string> = {
  valid: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  expiring_soon: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  expired: 'text-red-400 bg-red-500/10 border-red-500/20',
};

const certLabel: Record<string, string> = {
  valid: 'Valid',
  expiring_soon: 'Expiring Soon',
  expired: 'Expired',
};

const rotationStyle: Record<string, string> = {
  confirmed: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  pending: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  urgent: 'text-red-400 bg-red-500/10 border-red-500/20',
};

function CrewCard({ cm }: { cm: CrewMember }) {
  const [expanded, setExpanded] = useState(false);
  const expiredCerts = cm.certifications.filter((c) => c.status === 'expired').length;
  const expiringSoon = cm.certifications.filter((c) => c.status === 'expiring_soon').length;
  const rotationPct = (cm.daysOnBoard / cm.maxRotationDays) * 100;
  const medExpiry = new Date(cm.medicalExpiry);
  const daysToMedExpiry = Math.round((medExpiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const medAlert = daysToMedExpiry < 60;

  return (
    <div
      className={cn(
        'bg-[#0a1628]/80 border rounded-xl overflow-hidden transition-all',
        expiredCerts > 0 || !cm.mlcCompliant
          ? 'border-red-500/20'
          : expiringSoon > 0 || medAlert
            ? 'border-amber-500/20'
            : 'border-sky-500/10',
      )}
    >
      <button className="w-full text-left px-4 py-3" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-sky-500/10 flex items-center justify-center shrink-0">
            <User className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-sky-100">{cm.name}</span>
              <span className="text-[10px] text-sky-400/60">{cm.flagEmoji}</span>
              <Badge variant="outline" className="text-[9px] text-sky-400/50 border-sky-500/10">
                {cm.rank}
              </Badge>
              <Badge variant="outline" className="text-[9px] text-sky-400/30 border-sky-500/8">
                {cm.nationality}
              </Badge>
              {!cm.mlcCompliant && (
                <Badge
                  variant="outline"
                  className="text-[9px] text-red-400 bg-red-500/10 border-red-500/20"
                >
                  MLC Non-Compliant
                </Badge>
              )}
              {expiredCerts > 0 && (
                <Badge
                  variant="outline"
                  className="text-[9px] text-red-400 bg-red-500/10 border-red-500/20"
                >
                  {expiredCerts} cert expired
                </Badge>
              )}
              {expiringSoon > 0 && (
                <Badge
                  variant="outline"
                  className="text-[9px] text-amber-400 bg-amber-500/10 border-amber-500/20"
                >
                  {expiringSoon} expiring soon
                </Badge>
              )}
              <Badge variant="outline" className="text-[9px] text-sky-400/30 border-sky-500/8">
                {cm.contractType}
              </Badge>
            </div>
            <p className="text-[10px] text-sky-400/50 mt-0.5">
              {cm.vessel} · IMO {cm.imo} · {cm.flagState}
            </p>
            <div className="mt-1.5">
              <div className="flex justify-between mb-0.5">
                <span className="text-[9px] text-sky-400/30">
                  Rotation: {cm.daysOnBoard}/{cm.maxRotationDays} days
                </span>
                <span
                  className={cn(
                    'text-[9px] font-mono',
                    rotationPct > 85 ? 'text-orange-400' : 'text-sky-400/40',
                  )}
                >
                  {Math.round(rotationPct)}%
                </span>
              </div>
              <div className="h-1.5 bg-sky-500/10 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    rotationPct > 85
                      ? 'bg-orange-400'
                      : rotationPct > 60
                        ? 'bg-amber-400'
                        : 'bg-emerald-400',
                  )}
                  style={{ width: `${rotationPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-sky-500/10 pt-3 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {(
              [
                { label: 'Join Date', value: cm.joinDate, alert: false },
                { label: 'Relief Date', value: cm.reliefDate, alert: false },
                { label: 'Medical Expiry', value: cm.medicalExpiry, alert: medAlert },
                { label: 'Seafarer ID', value: cm.seafarerIdNo, alert: false },
              ] as { label: string; value: string; alert: boolean }[]
            ).map((f) => (
              <div key={f.label} className="bg-sky-500/5 rounded-lg p-2.5 border border-sky-500/10">
                <p className="text-[9px] text-sky-400/40 uppercase tracking-wider">{f.label}</p>
                <p
                  className={cn(
                    'text-xs font-mono mt-0.5',
                    f.alert ? 'text-amber-400' : 'text-sky-200',
                  )}
                >
                  {f.value}
                </p>
              </div>
            ))}
          </div>

          <div>
            <p className="text-[9px] text-sky-400/40 uppercase tracking-wider mb-2">
              STCW Certifications
            </p>
            <div className="space-y-1.5">
              {cm.certifications.map((cert) => (
                <div
                  key={cert.name}
                  className="flex items-center gap-3 p-2 rounded-lg bg-sky-500/3 border border-sky-500/8"
                >
                  <Badge
                    variant="outline"
                    className={cn('text-[9px] shrink-0', certStyle[cert.status])}
                  >
                    {certLabel[cert.status]}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] text-sky-200">{cert.name}</span>
                    <span className="text-[9px] text-sky-400/30 ml-2">{cert.issuedBy}</span>
                  </div>
                  <span className="text-[9px] font-mono text-sky-400/40 shrink-0">
                    Exp: {cert.expiryDate}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4 text-[10px] flex-wrap">
            <div className="flex items-center gap-1.5">
              {cm.mlcCompliant ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-3 h-3 text-red-400" />
              )}
              <span className={cm.mlcCompliant ? 'text-emerald-400' : 'text-red-400'}>
                MLC 2006
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {cm.stcwEndorsement ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-3 h-3 text-red-400" />
              )}
              <span className={cm.stcwEndorsement ? 'text-emerald-400' : 'text-red-400'}>
                STCW Endorsed
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Globe className="w-3 h-3 text-sky-400/30" />
              <span className="text-sky-400/50">Flag: {cm.flagState}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <FileText className="w-3 h-3 text-sky-400/30" />
              <span className="text-sky-400/50">
                {cm.contractType === 'agency' ? 'Agency hire' : 'Direct employment'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CrewTrackerPage() {
  const [tab, setTab] = useState<'crew' | 'rotations'>('crew');
  const [vesselFilter, setVesselFilter] = useState('all');

  const { data, isLoading, isError, refetch } = useStandardQuery<CrewApiResponse>({
    queryKey: ['vessels-crew'],
    queryFn: () =>
      fetch(`${API_BASE}/vessels/modules/crew`, { credentials: 'include' })
        .then((r) => r.json())
        .then((d) => d.data ?? d),
    staleTime: 60_000,
  });

  const roster = data?.roster ?? [];
  const rotations = data?.rotations ?? [];
  const summary = data?.summary;
  const vessels = [...new Set(roster.map((c) => c.vessel))];
  const filtered =
    vesselFilter === 'all' ? roster : roster.filter((c) => c.vessel === vesselFilter);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-sky-50 flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-400" />
            Crew & Certification Tracker
          </h1>
          <p className="text-xs text-sky-400/50 mt-0.5">
            Rotation scheduling, STCW certification expiry alerts, medical compliance, and
            flag-state manning requirements
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="text-sky-400/40 hover:text-sky-300 transition-colors mt-1"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center h-32 text-sky-400/40 text-sm">
          <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Loading crew roster…
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center justify-center h-32 gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <p className="text-sm text-sky-400/50">Failed to load crew data</p>
          <button
            onClick={() => refetch()}
            className="text-xs text-sky-400 border border-sky-500/20 px-3 py-1.5 rounded-lg"
          >
            Retry
          </button>
        </div>
      )}

      {!isLoading && !isError && summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Total Crew', value: summary.total, color: 'text-sky-300', icon: Users },
            {
              label: 'Expired Certs',
              value: summary.expiredCerts,
              color: 'text-red-400',
              icon: AlertTriangle,
            },
            {
              label: 'Expiring Soon',
              value: summary.expiringCerts,
              color: 'text-amber-400',
              icon: Clock,
            },
            {
              label: 'MLC Issues',
              value: summary.mlcIssues,
              color: summary.mlcIssues > 0 ? 'text-red-400' : 'text-emerald-400',
              icon: Award,
            },
            {
              label: 'Rotation Alerts',
              value: summary.rotationAlerts,
              color: summary.rotationAlerts > 0 ? 'text-orange-400' : 'text-emerald-400',
              icon: Calendar,
            },
          ].map((s) => (
            <div key={s.label} className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <s.icon className={cn('w-3.5 h-3.5', s.color)} />
                <p className="text-[10px] text-sky-400/40 uppercase tracking-wider">{s.label}</p>
              </div>
              <p className={cn('text-xl font-bold font-display', s.color)}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {!isLoading && !isError && (
        <>
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {(['crew', 'rotations'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    'text-xs px-3 py-1.5 rounded-lg capitalize transition-colors',
                    tab === t
                      ? 'bg-sky-500/10 text-sky-300 border border-sky-500/20'
                      : 'text-sky-400/50 hover:text-sky-300',
                  )}
                >
                  {t === 'crew' ? 'Crew Roster' : 'Rotation Schedule'}
                </button>
              ))}
            </div>
            {tab === 'crew' && vessels.length > 0 && (
              <div className="flex gap-1 ml-auto flex-wrap">
                {['all', ...vessels].map((v) => (
                  <button
                    key={v}
                    onClick={() => setVesselFilter(v)}
                    className={cn(
                      'text-[10px] px-2.5 py-1.5 rounded-lg border transition-all',
                      vesselFilter === v
                        ? 'bg-sky-500/10 border-sky-500/30 text-sky-300'
                        : 'border-sky-500/10 text-sky-400/40 hover:text-sky-300',
                    )}
                  >
                    {v === 'all' ? 'All SEXTANT' : v}
                  </button>
                ))}
              </div>
            )}
          </div>

          {tab === 'crew' && (
            <div className="space-y-2">
              {filtered.map((c) => (
                <CrewCard key={c.id} cm={c} />
              ))}
            </div>
          )}

          {tab === 'rotations' && (
            <div className="space-y-4">
              {rotations.map((r) => (
                <div
                  key={r.vessel}
                  className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-sky-500/10 flex items-center gap-2">
                    <Ship className="w-3.5 h-3.5 text-sky-400" />
                    <span className="text-sm font-semibold text-sky-200">{r.vessel}</span>
                    <span className="text-[10px] text-sky-400/30 font-mono">IMO {r.imo}</span>
                  </div>
                  <div className="divide-y divide-sky-500/5">
                    {r.reliefs.map((relief) => (
                      <div key={relief.name} className="px-4 py-3 flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-sky-500/10 flex items-center justify-center shrink-0">
                          <User className="w-3.5 h-3.5 text-sky-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-sky-200">{relief.name}</p>
                          <p className="text-[10px] text-sky-400/50">
                            {relief.rank} · {relief.nationality} · via {relief.agency}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3 text-sky-400/30" />
                          <span className="text-xs text-sky-300">{relief.eta}</span>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn('text-[9px]', rotationStyle[relief.status])}
                        >
                          {relief.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
