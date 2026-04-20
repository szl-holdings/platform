import { AlertCircle, CheckCircle2, Circle, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FitBadge } from './components';
import type { Allocation, CertReadiness, ControlRole, OfficerRole } from './types';

export function EquityChart({ allocations }: { allocations: Allocation[] }) {
  const colors = ['bg-primary', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-sky-500'];
  const total = allocations.reduce((s, a) => s + parseFloat(a.equityPct), 0);
  return (
    <div className="space-y-3">
      <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
        {allocations.map((a, i) => (
          <div
            key={a.id}
            className={cn('h-full transition-all', colors[i % colors.length])}
            style={{ width: `${(parseFloat(a.equityPct) / total) * 100}%` }}
            title={`${a.personName}: ${a.equityPct}%`}
          />
        ))}
      </div>
      <div className="space-y-2">
        {allocations.map((a, i) => (
          <div key={a.id} className="flex items-center gap-2.5">
            <div className={cn('w-2.5 h-2.5 rounded-full shrink-0', colors[i % colors.length])} />
            <span className="text-sm font-medium text-foreground flex-1">{a.personName}</span>
            <span className="text-xs text-muted-foreground">{a.role.replace(/_/g, ' ')}</span>
            <span className="text-sm font-bold text-foreground tabular-nums">{a.equityPct}%</span>
            {a.isControlling && (
              <Shield className="w-3 h-3 text-primary" aria-label="Controlling" />
            )}
            {!a.citizenshipConfirmed && a.isControlling && (
              <AlertCircle
                className="w-3 h-3 text-amber-500"
                aria-label="Citizenship not confirmed"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ControlAuthorityMap({ controlRoles }: { controlRoles: ControlRole[] }) {
  const authorities: { key: keyof ControlRole; label: string }[] = [
    { key: 'hasDayToDayControl', label: 'Day-to-Day Control' },
    { key: 'hasLongTermDecisionAuthority', label: 'Long-Term Decision Authority' },
    { key: 'hasHiringFiringAuthority', label: 'Hiring / Firing Authority' },
    { key: 'hasStrategicVeto', label: 'Strategic Veto' },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border/50">
            <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Authority</th>
            {controlRoles.map((r) => (
              <th key={r.id} className="text-center py-2 px-3 text-muted-foreground font-medium">
                {r.personName}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {authorities.map((auth) => (
            <tr key={auth.key} className="hover:bg-muted/20 transition-colors">
              <td className="py-2 pr-4 text-foreground">{auth.label}</td>
              {controlRoles.map((r) => (
                <td key={r.id} className="py-2 px-3 text-center">
                  {r[auth.key] ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mx-auto" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-muted-foreground/30 mx-auto" />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function OfficerMatrix({ officerRoles }: { officerRoles: OfficerRole[] }) {
  const cols: { key: keyof OfficerRole; label: string }[] = [
    { key: 'isPrimaryOfficer', label: 'Primary Officer' },
    { key: 'isOnRegistration', label: 'On Registration' },
    { key: 'isOnBankAccount', label: 'On Bank Account' },
    { key: 'isOnOperatingAgreement', label: 'In Op. Agreement' },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border/50">
            <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Officer</th>
            <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Title</th>
            {cols.map((c) => (
              <th key={c.key} className="text-center py-2 px-2 text-muted-foreground font-medium">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {officerRoles.map((r) => (
            <tr key={r.id} className="hover:bg-muted/20 transition-colors">
              <td className="py-2 pr-4 text-foreground font-medium">{r.personName}</td>
              <td className="py-2 pr-4 text-muted-foreground">{r.title}</td>
              {cols.map((c) => (
                <td key={c.key} className="py-2 px-2 text-center">
                  {r[c.key] ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mx-auto" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-muted-foreground/30 mx-auto" />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CertFitComparison({ certReadiness }: { certReadiness: CertReadiness[] }) {
  return (
    <div className="space-y-4">
      {certReadiness.map((cert) => (
        <div key={cert.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-foreground">{cert.certificationName}</div>
              {cert.certificationBody && (
                <div className="text-xs text-muted-foreground mt-0.5">{cert.certificationBody}</div>
              )}
            </div>
            <FitBadge level={cert.fitLevel} />
          </div>
          {cert.keyRequirements && (
            <div>
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Key Requirements
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {cert.keyRequirements}
              </p>
            </div>
          )}
          {cert.gapSummary && (
            <div>
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Gap Summary
              </div>
              <p className="text-xs text-amber-400/80 leading-relaxed">{cert.gapSummary}</p>
            </div>
          )}
          {cert.requiredDocuments &&
            Array.isArray(cert.requiredDocuments) &&
            cert.requiredDocuments.length > 0 && (
              <div>
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Required Documents
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {cert.requiredDocuments.map((doc: string, i: number) => (
                    <span
                      key={i}
                      className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded border border-border"
                    >
                      {doc}
                    </span>
                  ))}
                </div>
              </div>
            )}
        </div>
      ))}
    </div>
  );
}
