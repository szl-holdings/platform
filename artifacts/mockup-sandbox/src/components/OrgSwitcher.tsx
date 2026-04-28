import { Building2, Check, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export interface MockOrg {
  id: string;
  name: string;
  tier: string;
  color: string;
  swarms: number;
  memory: number;
  skills: number;
  tools: number;
  orchestrations: number;
}

export const MOCK_ORGS: MockOrg[] = [
  {
    id: 'szl',
    name: 'SZL Holdings',
    tier: 'Enterprise',
    color: '#22d3ee',
    swarms: 7,
    memory: 3241,
    skills: 84,
    tools: 312,
    orchestrations: 48,
  },
  {
    id: 'carlota',
    name: 'Carlota Jo',
    tier: 'Professional',
    color: '#f472b6',
    swarms: 2,
    memory: 718,
    skills: 31,
    tools: 94,
    orchestrations: 12,
  },
  {
    id: 'demo',
    name: 'Demo Tenant',
    tier: 'Trial',
    color: '#a3e635',
    swarms: 1,
    memory: 204,
    skills: 18,
    tools: 47,
    orchestrations: 3,
  },
  {
    id: 'praxis-internal',
    name: 'NEXUS Internal',
    tier: 'Internal',
    color: '#818cf8',
    swarms: 12,
    memory: 9804,
    skills: 147,
    tools: 521,
    orchestrations: 213,
  },
];

export default function OrgSwitcher({
  org,
  onChange,
  expanded,
}: {
  org: MockOrg;
  onChange: (o: MockOrg) => void;
  expanded: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-all hover:bg-[#1a2535]/60 ${
          open ? 'border-praxis-cyan/30 bg-[#1a2535]/80' : 'border-praxis'
        }`}
        title={expanded ? undefined : org.name}
      >
        <div
          className="w-5 h-5 rounded flex items-center justify-center shrink-0 text-[9px] font-mono font-bold"
          style={{ backgroundColor: `${org.color}20`, color: org.color }}
        >
          {org.name.slice(0, 2).toUpperCase()}
        </div>
        {expanded && (
          <>
            <div className="min-w-0">
              <div className="text-[11px] font-medium truncate max-w-[88px]" style={{ color: org.color }}>
                {org.name}
              </div>
              <div className="text-[9px] text-muted-foreground/40 font-mono">{org.tier}</div>
            </div>
            <ChevronDown
              className={`w-3 h-3 text-muted-foreground/40 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
            />
          </>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-50 w-52 bg-praxis-surface border border-praxis rounded-xl shadow-2xl overflow-hidden">
            <div className="px-3 py-2 border-b border-praxis">
              <div className="flex items-center gap-1.5 text-[9px] font-mono text-muted-foreground/50 uppercase tracking-widest">
                <Building2 className="w-3 h-3" />
                Switch Workspace
              </div>
            </div>
            <div className="p-1.5 space-y-0.5">
              {MOCK_ORGS.map((o) => (
                <button
                  key={o.id}
                  onClick={() => {
                    onChange(o);
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left hover:bg-[#1a2535]/60 transition-colors"
                >
                  <div
                    className="w-7 h-7 rounded flex items-center justify-center shrink-0 text-[9px] font-mono font-bold"
                    style={{ backgroundColor: `${o.color}20`, color: o.color }}
                  >
                    {o.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate" style={{ color: o.color }}>
                      {o.name}
                    </div>
                    <div className="text-[9px] text-muted-foreground/40 font-mono">{o.tier}</div>
                  </div>
                  {org.id === o.id && <Check className="w-3 h-3 text-praxis-cyan shrink-0" />}
                </button>
              ))}
            </div>
            <div className="px-3 py-2 border-t border-praxis">
              <p className="text-[9px] text-muted-foreground/30 font-mono leading-snug">
                DEMO MODE · No real tenant boundary
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
