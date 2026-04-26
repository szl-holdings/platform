import { Activity, ArrowRight, Database, GitMerge, Users } from 'lucide-react';
import { Link } from 'wouter';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

const SURFACES = [
  {
    href: `${BASE}/strategy/cross-platform`,
    label: 'Signal Correlation',
    description:
      'Surfaces where signals from two or more products correlate via entity overlap or time-window rules. Each card carries a signed proof envelope.',
    icon: GitMerge,
    color: '#8b7ac8',
    stat: '8 active correlations',
  },
  {
    href: `${BASE}/strategy/cross-platform/evidence`,
    label: 'Shared Evidence Registry',
    description:
      'Unified search across all evidence nodes — policy decisions, compliance events, distress signals, threat actors, and more — with product filters.',
    icon: Database,
    color: '#0ea5e9',
    stat: '15 evidence nodes',
  },
  {
    href: `${BASE}/strategy/cross-platform/run-health`,
    label: 'Run Health Dashboard',
    description:
      'Pass/fail rates, regression deltas, policy-breach counts, and autonomy-mode mix — per product, with a 7-day sparkline trend.',
    icon: Activity,
    color: '#22c55e',
    stat: '6 products monitored',
  },
  {
    href: `${BASE}/strategy/cross-platform/pilots`,
    label: 'Pilot / Partner Intelligence',
    description:
      'Pipeline view of pilots, design partners, and account health across all products. MRR progress, weekly active users, and open issues at a glance.',
    icon: Users,
    color: '#d4a054',
    stat: '6 accounts tracked',
  },
];

export function CrossPlatformHubPage() {
  return (
    <div
      className="flex flex-col h-full"
      style={{ background: '#080c14', color: 'rgba(255,255,255,0.85)' }}
    >
      <div className="px-6 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2 mb-1">
          <GitMerge className="w-5 h-5" style={{ color: '#8b7ac8' }} />
          <h1 className="text-base font-bold tracking-tight">Cross-Platform Intelligence</h1>
        </div>
        <p className="text-xs leading-relaxed max-w-2xl" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Patterns no individual product can see. Correlate signals across KORA, SEXTANT, PARAGON,
          DOMAINE, PRISM, and Carlota into one portfolio intelligence layer with a shared evidence
          registry, run health dashboard, and pilot pipeline view.
        </p>
      </div>

      <div className="flex-1 overflow-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
          {SURFACES.map((s) => {
            const Icon = s.icon;
            return (
              <Link
                key={s.href}
                href={s.href}
                className="rounded-xl p-5 flex flex-col gap-3 transition-all hover:scale-[1.01]"
                style={{
                  background: `${s.color}06`,
                  border: `1px solid ${s.color}20`,
                  textDecoration: 'none',
                }}
              >
                <div className="flex items-start justify-between">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ background: `${s.color}12`, border: `1px solid ${s.color}25` }}
                  >
                    <Icon
                      className="w-4.5 h-4.5"
                      style={{ color: s.color, width: 18, height: 18 }}
                    />
                  </div>
                  <ArrowRight className="w-4 h-4 mt-1" style={{ color: `${s.color}50` }} />
                </div>
                <div>
                  <div
                    className="text-sm font-semibold mb-1"
                    style={{ color: 'rgba(255,255,255,0.9)' }}
                  >
                    {s.label}
                  </div>
                  <p
                    className="text-[11px] leading-relaxed"
                    style={{ color: 'rgba(255,255,255,0.45)' }}
                  >
                    {s.description}
                  </p>
                </div>
                <div className="text-[10px] font-mono mt-auto" style={{ color: s.color }}>
                  {s.stat}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
