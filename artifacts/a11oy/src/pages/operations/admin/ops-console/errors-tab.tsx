import { AlertCircle, CheckCircle, GitBranch, TrendingUp } from 'lucide-react';
import { BG, BORDER, SectionHeader, StatusBadge, StatusIcon, TEXT } from './shared';
import type { SystemHealth } from './types';

interface Props {
  sh: SystemHealth | undefined;
}

export function ErrorsTab({ sh }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ padding: '1rem', borderRadius: '0.75rem', background: BG.card, border: `1px solid ${BORDER.subtle}` }}>
        <SectionHeader icon={AlertCircle} title="Recent Error Summary" subtitle="Aggregated errors from API server and services" />
        {sh && (sh.summary.degraded > 0 || sh.summary.down > 0) ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {sh.checks.filter((c) => c.status !== 'healthy').map((c) => (
              <div key={c.name} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '8px', borderRadius: '6px', background: c.status === 'down' ? 'rgba(196,90,74,0.06)' : 'rgba(212,160,84,0.04)', border: `1px solid ${c.status === 'down' ? 'rgba(196,90,74,0.2)' : 'rgba(212,160,84,0.2)'}` }}>
                <StatusIcon status={c.status} />
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: TEXT.primary }}>{c.category}: {c.name}</div>
                  <div style={{ fontSize: '11px', color: TEXT.secondary, marginTop: '2px' }}>{c.details}</div>
                </div>
                <StatusBadge status={c.status} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '1rem', borderRadius: '6px', background: 'rgba(107,143,113,0.06)', border: '1px solid rgba(107,143,113,0.2)' }}>
            <CheckCircle style={{ width: 14, height: 14, color: '#6b8f71' }} />
            <span style={{ fontSize: '12px', color: '#6b8f71' }}>No errors detected across monitored services.</span>
          </div>
        )}
      </div>

      <div style={{ padding: '1rem', borderRadius: '0.75rem', background: BG.card, border: `1px solid ${BORDER.subtle}` }}>
        <SectionHeader icon={TrendingUp} title="Release Diagnostics" subtitle="Deployment version and build context" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[
            { label: 'Environment', value: process.env.NODE_ENV ?? 'development' },
            { label: 'Platform', value: 'Replit (pnpm workspace)' },
            { label: 'Build Tool', value: 'Vite + esbuild' },
            { label: 'Schema Tool', value: 'Drizzle ORM' },
            { label: 'Auth Provider', value: 'Replit OIDC' },
            { label: 'Deployed', value: new Date().toLocaleDateString() },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: TEXT.secondary }}>{label}</span>
              <span style={{ color: TEXT.primary, fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '1rem', borderRadius: '0.75rem', background: BG.card, border: `1px solid ${BORDER.subtle}` }}>
        <SectionHeader icon={GitBranch} title="Tenant Overview" subtitle="Active tenants and provisioning status" />
        <div style={{ color: TEXT.muted, fontSize: '12px', padding: '0.5rem 0' }}>
          Tenant management is available at <span style={{ color: '#d4a054', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>/api/admin/tenants</span> (admin auth required). Azure AD tenant onboarding is handled via the Azure Tenant Dashboard in SZL Holdings.
        </div>
      </div>
    </div>
  );
}
