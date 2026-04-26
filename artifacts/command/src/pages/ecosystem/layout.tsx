import {
  Bot,
  FlaskConical,
  GitBranch,
  Network,
  Search,
} from 'lucide-react';
import { type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';

export const ECOSYSTEM_ACCENT = '#c9a227';

interface NavItem {
  href: string;
  label: string;
  sublabel: string;
  icon: React.ElementType;
}

const NAV: NavItem[] = [
  { href: '/ecosystem', label: 'Topology Map', sublabel: 'MCP node graph', icon: Network },
  { href: '/ecosystem/observatory', label: 'Agent Observatory', sublabel: 'Live session feed', icon: Bot },
  { href: '/ecosystem/inspector', label: 'Tool Inspector', sublabel: 'Governed try-it', icon: Search },
  { href: '/ecosystem/counterfactual', label: 'Counterfactual Studio', sublabel: 'Decision replay', icon: GitBranch },
];

function isActive(href: string, location: string): boolean {
  if (href === '/ecosystem') return location === '/ecosystem' || location === '/ecosystem/';
  return location.startsWith(href);
}

export function EcosystemLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex flex-col h-full" style={{ background: '#080c14' }}>
      {/* Header */}
      <div
        className="shrink-0 px-5 pt-4 pb-0"
        style={{ borderBottom: '1px solid rgba(201,162,39,0.12)' }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-7 h-7 rounded flex items-center justify-center"
            style={{
              background: `${ECOSYSTEM_ACCENT}14`,
              border: `1px solid ${ECOSYSTEM_ACCENT}28`,
            }}
          >
            <FlaskConical className="w-4 h-4" style={{ color: ECOSYSTEM_ACCENT }} />
          </div>
          <div>
            <h1
              className="text-[13px] font-bold tracking-wide"
              style={{ color: 'rgba(255,255,255,0.92)' }}
            >
              MCP Ecosystem Command Center
            </h1>
            <p className="text-[9px] font-mono mt-px" style={{ color: `${ECOSYSTEM_ACCENT}99` }}>
              Governed Agent Observatory · Tool Inspector · Counterfactual Studio
            </p>
          </div>
        </div>

        {/* Tab nav */}
        <div className="flex gap-0.5">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, location);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-medium transition-all relative"
                style={{
                  color: active ? ECOSYSTEM_ACCENT : 'rgba(255,255,255,0.55)',
                  borderBottom: active
                    ? `2px solid ${ECOSYSTEM_ACCENT}`
                    : '2px solid transparent',
                }}
              >
                <Icon
                  className="w-3 h-3 shrink-0"
                  style={{ color: active ? ECOSYSTEM_ACCENT : 'rgba(255,255,255,0.4)' }}
                />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
