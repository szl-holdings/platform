import { useState } from 'react';
import { useOrg } from '../context/OrgContext';
import { BRANDS_DATA_SOURCE, brandsData, type Brand } from '../data/brands';
import { Badge } from '../components/ui/Badge';
import { DrawerPanel } from '../components/ui/DrawerPanel';
import { motion } from 'framer-motion';
import { Activity, ShieldAlert, Palette, Mic2, Hexagon } from 'lucide-react';

function HealthRing({ score, color }: { score: number; color: string }) {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-12 h-12 flex items-center justify-center">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 48 48">
        <circle
          cx="24"
          cy="24"
          r={radius}
          stroke="var(--color-a11oy-surface)"
          strokeWidth="4"
          fill="none"
        />
        <circle
          cx="24"
          cy="24"
          r={radius}
          stroke={color}
          strokeWidth="4"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <span className="absolute text-xs font-mono font-medium">{score}</span>
    </div>
  );
}

function DriftBadge({ drift }: { drift: string }) {
  if (drift === 'none')
    return (
      <Badge variant="ok" size="sm">
        No Drift
      </Badge>
    );
  if (drift === 'token')
    return (
      <Badge variant="warn" size="sm" className="flex items-center gap-1">
        <Palette className="w-3 h-3" /> Token Drift
      </Badge>
    );
  if (drift === 'voice')
    return (
      <Badge variant="critical" size="sm" className="flex items-center gap-1">
        <Mic2 className="w-3 h-3" /> Voice Drift
      </Badge>
    );
  return null;
}

export function AtlasSection() {
  const { currentOrg } = useOrg();
  const brands = brandsData[currentOrg] || [];
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [activeTab, setActiveTab] = useState<'tokens' | 'voice' | 'a11y'>('tokens');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 h-full overflow-y-auto"
    >
      <div className="mb-8">
        <h1 className="text-2xl font-display font-medium text-[var(--color-a11oy-text)] flex items-center gap-3">
          Atlas
          <span
            className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border"
            style={{
              color: '#d7a53f',
              borderColor: 'rgba(215,165,63,0.45)',
              backgroundColor: 'rgba(215,165,63,0.08)',
            }}
            title="Staged demo dataset — scores, audits, and activity are illustrative, not measured."
          >
            {BRANDS_DATA_SOURCE} · staged dataset
          </span>
        </h1>
        <p className="text-[var(--color-a11oy-text-sub)] mt-1">
          Brand health and orchestration overview for {currentOrg.toUpperCase()} — staged DEMO
          dataset; no measured brand telemetry is wired yet.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {brands.map((brand) => (
          <button
            key={brand.id}
            onClick={() => setSelectedBrand(brand)}
            className="text-left bg-[var(--color-a11oy-card)] border border-[var(--color-a11oy-border)] rounded-lg p-5 hover:border-[var(--color-a11oy-blue)] transition-colors flex flex-col h-full group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${brand.color}20`, color: brand.color }}
                >
                  <Hexagon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-medium text-[var(--color-a11oy-text)] group-hover:text-[var(--color-a11oy-blue)] transition-colors">
                    {brand.name}
                  </h3>
                  <p className="text-[10px] text-[var(--color-a11oy-text-ghost)] uppercase tracking-wider">
                    {brand.owner}
                  </p>
                </div>
              </div>
              <HealthRing score={brand.healthScore} color={brand.color} />
            </div>

            <p className="text-xs text-[var(--color-a11oy-text-sub)] mb-6 flex-1">
              {brand.tagline}
            </p>

            <div className="flex items-center justify-between mt-auto pt-4 border-t border-[var(--color-a11oy-border)]">
              <div className="text-xs text-[var(--color-a11oy-text-ghost)] font-mono">
                {brand.surfaces} surfaces
              </div>
              <DriftBadge drift={brand.drift} />
            </div>
          </button>
        ))}
      </div>

      <DrawerPanel
        isOpen={!!selectedBrand}
        onClose={() => setSelectedBrand(null)}
        title={selectedBrand?.name || ''}
        subtitle={selectedBrand?.tagline}
        width="w-[500px]"
      >
        {selectedBrand && (
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="bg-[var(--color-a11oy-surface)] p-4 rounded-md flex-1 flex flex-col items-center justify-center">
                <div className="text-[10px] uppercase text-[var(--color-a11oy-text-ghost)] tracking-widest mb-1">
                  Overall Health
                </div>
                <div
                  className="text-2xl font-mono font-medium"
                  style={{ color: selectedBrand.color }}
                >
                  {selectedBrand.healthScore}
                </div>
              </div>
              <div className="bg-[var(--color-a11oy-surface)] p-4 rounded-md flex-1 flex flex-col items-center justify-center">
                <div className="text-[10px] uppercase text-[var(--color-a11oy-text-ghost)] tracking-widest mb-1">
                  Last Audit
                </div>
                <div className="text-sm font-mono text-[var(--color-a11oy-text)]">
                  {selectedBrand.lastAudit}
                </div>
              </div>
            </div>

            <div className="border-b border-[var(--color-a11oy-border)]">
              <div className="flex gap-6">
                {(['tokens', 'voice', 'a11y'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-2 text-sm font-medium transition-colors relative ${activeTab === tab ? 'text-[var(--color-a11oy-blue)]' : 'text-[var(--color-a11oy-text-sub)] hover:text-[var(--color-a11oy-text)]'}`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)} Conformance
                    {activeTab === tab && (
                      <motion.div
                        layoutId="activetab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-a11oy-blue)]"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="min-h-[150px]">
              {activeTab === 'tokens' && (
                <div className="space-y-4">
                  <div className="flex items-end justify-between">
                    <div className="text-3xl font-mono font-medium text-[var(--color-a11oy-text)]">
                      {selectedBrand.detail.tokenConformance}%
                    </div>
                    <div className="text-xs text-[var(--color-a11oy-text-ghost)]">
                      Tokens aligned
                    </div>
                  </div>
                  <div className="h-2 w-full bg-[var(--color-a11oy-surface)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--color-a11oy-blue)]"
                      style={{ width: `${selectedBrand.detail.tokenConformance}%` }}
                    />
                  </div>
                  {selectedBrand.drift === 'token' && (
                    <div className="p-3 bg-[var(--color-a11oy-warn)]/10 border border-[var(--color-a11oy-warn)]/20 rounded text-sm text-[var(--color-a11oy-text-sub)]">
                      <span className="text-[var(--color-a11oy-warn)] font-medium">Warning:</span>{' '}
                      Hardcoded hex values detected bypassing token registry in{' '}
                      {Math.floor((100 - selectedBrand.detail.tokenConformance) / 2)} surfaces.
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'voice' && (
                <div className="space-y-4">
                  <div className="flex items-end justify-between">
                    <div className="text-3xl font-mono font-medium text-[var(--color-a11oy-text)]">
                      {selectedBrand.detail.voiceConformance}%
                    </div>
                    <div className="text-xs text-[var(--color-a11oy-text-ghost)]">
                      Voice compliance
                    </div>
                  </div>
                  <div className="h-2 w-full bg-[var(--color-a11oy-surface)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--color-a11oy-blue)]"
                      style={{ width: `${selectedBrand.detail.voiceConformance}%` }}
                    />
                  </div>
                  {selectedBrand.drift === 'voice' && (
                    <div className="p-3 bg-[var(--color-a11oy-critical)]/10 border border-[var(--color-a11oy-critical)]/20 rounded text-sm text-[var(--color-a11oy-text-sub)]">
                      <span className="text-[var(--color-a11oy-critical)] font-medium">
                        Critical:
                      </span>{' '}
                      Banned terminology (deprecated strings) detected in live copy.
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'a11y' && (
                <div className="space-y-4">
                  <div className="flex items-end justify-between">
                    <div className="text-3xl font-mono font-medium text-[var(--color-a11oy-text)]">
                      {selectedBrand.detail.a11yScore}%
                    </div>
                    <div className="text-xs text-[var(--color-a11oy-text-ghost)]">A11y index</div>
                  </div>
                  <div className="h-2 w-full bg-[var(--color-a11oy-surface)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--color-a11oy-blue)]"
                      style={{ width: `${selectedBrand.detail.a11yScore}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-[var(--color-a11oy-border)]">
              <h4 className="text-xs uppercase tracking-widest text-[var(--color-a11oy-text-ghost)] mb-4 flex items-center gap-2">
                <Activity className="w-3 h-3" /> Recent Activity
              </h4>
              <div className="space-y-3">
                {selectedBrand.detail.recentActivity.map((act, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-a11oy-border)] mt-1.5 shrink-0" />
                    <div>
                      <div className="text-[var(--color-a11oy-text)]">{act.action}</div>
                      <div className="text-xs text-[var(--color-a11oy-text-ghost)] mt-0.5">
                        {act.actor} • {act.surface} • {act.date}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </DrawerPanel>
    </motion.div>
  );
}
