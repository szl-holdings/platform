import { Link } from 'wouter';
import { Card } from '../../components/ui/Card';
import { KpiCard } from '../../components/ui/KpiCard';
import { PageHeader } from '../../components/ui/PageHeader';

export { Card, KpiCard, PageHeader };

export const FRONTIER_TOKENS = {
  GOLD: '#c9b787',
  DIM: '#8a8a8a',
  MUTED: '#5e5e5e',
  BORDER: 'rgba(255,255,255,0.08)',
  SURFACE: 'rgba(255,255,255,0.025)',
  MONO: 'var(--font-mono, monospace)',
} as const;

const { GOLD, DIM, MUTED, BORDER, SURFACE, MONO } = FRONTIER_TOKENS;

interface FrontierPageHeaderProps {
  base: string;
  section?: string;
  title: string;
  description: string;
}

export function FrontierPageHeader({ base, section, title, description }: FrontierPageHeaderProps) {
  return (
    <PageHeader
      breadcrumbs={[
        { label: 'Frontier Intelligence', href: `${base}/frontier` },
        ...(section ? [{ label: section }] : []),
      ]}
      title={title}
      description={description}
    />
  );
}

interface FrontierCardProps extends React.HTMLAttributes<HTMLDivElement> {
  accent?: string;
  padding?: string | number;
  radius?: number;
}

export function FrontierCard({ children, accent, padding = '16px 20px', radius = 8, style, ...rest }: FrontierCardProps) {
  return (
    <Card accent={accent} padding={padding} radius={radius} style={style} {...rest}>
      {children}
    </Card>
  );
}

interface FrontierKpiTileProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}

export function FrontierKpiTile({ label, value, sub, color = '#f5f5f5' }: FrontierKpiTileProps) {
  return <KpiCard label={label} value={value} sub={sub} color={color} />;
}

interface FrontierCitationBannerProps {
  message?: string;
}

export function FrontierCitationBanner({ message }: FrontierCitationBannerProps) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 12px',
      background: 'rgba(201,183,135,0.06)',
      border: '1px solid rgba(201,183,135,0.2)',
      borderRadius: 6, marginBottom: 16,
      fontSize: 11, color: '#c5b080',
    }}>
      <span style={{ fontFamily: MONO, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, color: GOLD, flexShrink: 0 }}>
        Citation policy
      </span>
      {message ?? 'All external organisation names, product references, and research entities are cited sources. Full attribution in the Research Citation Panel below.'}
    </div>
  );
}

interface FrontierMonoBadgeProps {
  children: React.ReactNode;
  color?: string;
  style?: React.CSSProperties;
}

export function FrontierMonoBadge({ children, color = GOLD, style: extraStyle }: FrontierMonoBadgeProps) {
  return (
    <span style={{
      fontSize: 9, fontFamily: MONO, fontWeight: 700,
      letterSpacing: '0.1em', textTransform: 'uppercase',
      color, background: `${color}15`,
      border: `1px solid ${color}30`,
      padding: '2px 7px', borderRadius: 3,
      ...extraStyle,
    }}>
      {children}
    </span>
  );
}

interface FrontierSectionLabelProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function FrontierSectionLabel({ children, style: extra }: FrontierSectionLabelProps) {
  return (
    <div style={{
      fontSize: 9, fontFamily: MONO, color: MUTED,
      letterSpacing: '0.12em', textTransform: 'uppercase',
      marginBottom: 6, ...extra,
    }}>
      {children}
    </div>
  );
}

export interface FrontierCrossLink {
  label: string;
  path: string;
  desc: string;
}

interface FrontierCrossLinksProps {
  base: string;
  links: FrontierCrossLink[];
}

export function FrontierCrossLinks({ base, links }: FrontierCrossLinksProps) {
  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, background: SURFACE, padding: '18px 20px', marginBottom: 24 }}>
      <div style={{ fontSize: 10, fontFamily: MONO, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 14 }}>
        Cross-module links
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {links.map(link => (
          <Link
            key={link.path}
            href={`${base}${link.path}`}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 14px', borderRadius: 8,
              border: `1px solid ${BORDER}`, background: 'rgba(0,0,0,0.15)',
              textDecoration: 'none', transition: 'border-color 0.15s',
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: GOLD }}>{link.label}</div>
              <div style={{ fontSize: 11, color: DIM, marginTop: 2 }}>{link.desc}</div>
            </div>
            <span style={{ fontSize: 12, color: MUTED }}>→</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
