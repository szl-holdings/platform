import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Zap, BookOpen, Globe, Server, ChevronRight, X, Copy, Check,
  ExternalLink, Shield, Key, Cpu, Clock, ArrowRight, Package, Layers,
  Activity, Filter
} from 'lucide-react';
import { PLUGINS, AUTOMATIONS, CATEGORIES, CATEGORY_ICONS } from './catalog';
import type { Plugin, RoutingResult, ActiveTab } from './types';

const BASE_PATH = import.meta.env.BASE_URL || '/pluginmesh/';

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ');
}

function routeGoal(goal: string): RoutingResult {
  const goalLower = goal.toLowerCase();
  const keywordMap: Record<string, string[]> = {
    slack: ['slack'], github: ['github-copilot', 'github-actions'],
    notion: ['notion'], jira: ['jira'], linear: ['linear'],
    stripe: ['stripe'], search: ['perplexity-search', 'brave-search'],
    image: ['dalle', 'figma-mcp'], code: ['github-copilot', 'replit-agent'],
    deploy: ['replit-agent', 'github-actions'], test: ['vitest-runner'],
    database: ['drizzle-orm'], music: ['spotify'], weather: ['weather'],
    research: ['arxiv', 'semantic-scholar'], model: ['hugging-face'],
    incident: ['pagerduty', 'datadog'], monitor: ['datadog', 'pagerduty'],
    calendar: ['google-calendar'], schedule: ['google-calendar', 'zapier'],
    terraform: ['terraform'], figma: ['figma-mcp'],
    tailwind: ['tailwind-palette', 'shadcn-ui'], animation: ['framer-motion', 'lottie'],
    docker: ['docker-compose'], kubernetes: ['kubernetes'], openapi: ['openapi-spec'],
    report: ['alloy-orchestrator', 'notion'], workflow: ['alloy-orchestrator', 'zapier'],
    audit: ['alloy-orchestrator'], security: ['datadog', 'pagerduty'],
    fitness: ['strava'], paper: ['arxiv', 'semantic-scholar'],
    huggingface: ['hugging-face'], sec: ['sec-edgar'], canva: ['canva'],
  };

  let scores: Record<string, number> = {};
  for (const [keyword, slugs] of Object.entries(keywordMap)) {
    if (goalLower.includes(keyword)) {
      for (const slug of slugs) scores[slug] = (scores[slug] || 0) + 2;
    }
  }
  for (const plugin of PLUGINS) {
    for (const tag of plugin.tags) {
      if (goalLower.includes(tag)) scores[plugin.slug] = (scores[plugin.slug] || 0) + 1;
    }
  }

  const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a).map(([slug]) => slug);
  const primarySlug = sorted[0] || 'pluginmesh-broker';
  const supportSlugs = sorted.slice(1, 4);

  const primary = PLUGINS.find(p => p.slug === primarySlug) || null;
  const supporting = supportSlugs.map(s => PLUGINS.find(p => p.slug === s)).filter(Boolean) as Plugin[];
  const allCreds = [...(primary?.credentials || []), ...supporting.flatMap(p => p.credentials)];

  return {
    goal,
    primary: primary ? { name: primary.name, slug: primary.slug, reason: `Best match for your goal`, credentials: primary.credentials } : null,
    supporting: supporting.map(p => ({ name: p.name, slug: p.slug, role: p.description.split('.')[0] })),
    credentialsRequired: [...new Set(allCreds)],
    nextSteps: [
      allCreds.length > 0 ? `Set in Replit Secrets: ${[...new Set(allCreds)].join(', ')}` : 'No credentials required — activate immediately',
      primary?.mcpCompatible ? `Add "${primarySlug}" to .mcp.json to enable MCP tool access` : `Install ${primary?.name || primarySlug} via plugin settings`,
      'Run pluginmesh_app_manifest_template to get a ready-to-use .app.json',
    ],
  };
}

function generateMcpJson(plugin: Plugin) {
  if (!plugin.mcpCompatible) return null;
  return {
    mcpServers: {
      [plugin.slug]: {
        command: 'npx',
        args: ['-y', `@mcp/${plugin.slug}-server`],
        env: Object.fromEntries(plugin.credentials.map(c => [c, `\${${c}}`])),
      },
    },
  };
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-4)] transition-colors"
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[var(--surface-4)] text-[var(--text-secondary)] border border-[var(--border)]">
      {label}
    </span>
  );
}

function PluginCard({ plugin, onClick, selected }: { plugin: Plugin; onClick: () => void; selected: boolean }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      onClick={onClick}
      className={cn(
        'card-hover cursor-pointer rounded-xl border p-4 transition-all',
        selected
          ? 'border-[var(--brand-primary)] bg-[var(--surface-3)] glow-indigo'
          : 'border-[var(--border)] bg-[var(--surface-2)] hover:border-[rgba(99,102,241,0.3)]'
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">{plugin.name}</h3>
            {plugin.mcpCompatible && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[rgba(99,102,241,0.15)] text-[var(--brand-primary)] border border-[rgba(99,102,241,0.3)]">
                MCP
              </span>
            )}
          </div>
          <span className="text-[10px] text-[var(--text-muted)]">{plugin.category}</span>
        </div>
        {plugin.credentials.length === 0 ? (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[rgba(16,185,129,0.15)] text-[var(--brand-success)] border border-[rgba(16,185,129,0.3)] whitespace-nowrap">
            No auth
          </span>
        ) : (
          <Key size={12} className="text-[var(--text-muted)] mt-0.5 shrink-0" />
        )}
      </div>
      <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-2 mb-3">{plugin.description}</p>
      <div className="flex flex-wrap gap-1">
        {plugin.tags.slice(0, 3).map(tag => <Tag key={tag} label={tag} />)}
        {plugin.tags.length > 3 && <span className="text-[10px] text-[var(--text-muted)]">+{plugin.tags.length - 3}</span>}
      </div>
    </motion.div>
  );
}

function PluginDetail({ plugin, onClose }: { plugin: Plugin; onClose: () => void }) {
  const mcpJson = generateMcpJson(plugin);
  const mcpStr = mcpJson ? JSON.stringify(mcpJson, null, 2) : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      className="rounded-xl border border-[var(--brand-primary)] bg-[var(--surface-2)] p-5 glow-indigo"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[var(--text-primary)]">{plugin.name}</h2>
            {plugin.mcpCompatible && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[rgba(99,102,241,0.15)] text-[var(--brand-primary)] border border-[rgba(99,102,241,0.3)]">
                MCP Ready
              </span>
            )}
          </div>
          <span className="text-xs text-[var(--text-muted)]">{plugin.category} · {plugin.slug}</span>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-4)] transition-colors">
          <X size={14} />
        </button>
      </div>

      <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">{plugin.description}</p>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {plugin.tags.map(tag => <Tag key={tag} label={tag} />)}
      </div>

      {plugin.credentials.length > 0 ? (
        <div className="mb-4 p-3 rounded-lg bg-[var(--surface-3)] border border-[rgba(245,158,11,0.2)]">
          <div className="flex items-center gap-1.5 mb-2">
            <Key size={12} className="text-[var(--brand-warning)]" />
            <span className="text-xs font-semibold text-[var(--brand-warning)]">Required Credentials</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {plugin.credentials.map(cred => (
              <code key={cred} className="px-2 py-0.5 rounded text-[11px] bg-[var(--surface-4)] text-[var(--text-secondary)] font-mono">{cred}</code>
            ))}
          </div>
          <p className="text-[10px] text-[var(--text-muted)] mt-2">Set these in Replit Secrets before activating.</p>
        </div>
      ) : (
        <div className="mb-4 p-3 rounded-lg bg-[rgba(16,185,129,0.05)] border border-[rgba(16,185,129,0.2)]">
          <div className="flex items-center gap-1.5">
            <Shield size={12} className="text-[var(--brand-success)]" />
            <span className="text-xs text-[var(--brand-success)]">No credentials required — activate immediately</span>
          </div>
        </div>
      )}

      {mcpStr && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">.mcp.json entry</span>
            <CopyButton text={mcpStr} />
          </div>
          <pre className="text-[10px] font-mono text-[var(--text-secondary)] bg-[var(--surface-3)] rounded-lg p-3 overflow-x-auto border border-[var(--border)]">{mcpStr}</pre>
        </div>
      )}

      <a
        href={plugin.homepage}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs text-[var(--brand-primary)] hover:text-[var(--brand-secondary)] transition-colors"
      >
        <ExternalLink size={11} />
        Visit {plugin.name}
      </a>
    </motion.div>
  );
}

function CatalogTab() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('All');
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);

  const filtered = useMemo(() => {
    let p = PLUGINS;
    if (category !== 'All') p = p.filter(pl => pl.category === category);
    if (search) {
      const q = search.toLowerCase();
      p = p.filter(pl => pl.name.toLowerCase().includes(q) || pl.description.toLowerCase().includes(q) || pl.tags.some(t => t.includes(q)));
    }
    return p;
  }, [search, category]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search plugins, tags, or capabilities..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-primary)] transition-colors"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {['All', ...CATEGORIES].map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={cn(
                'px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                category === cat
                  ? 'bg-[var(--brand-primary)] text-white'
                  : 'bg-[var(--surface-2)] text-[var(--text-secondary)] border border-[var(--border)] hover:border-[var(--brand-primary)] hover:text-[var(--text-primary)]'
              )}
            >
              {cat !== 'All' ? `${CATEGORY_ICONS[cat]} ` : ''}{cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <Filter size={12} className="text-[var(--text-muted)]" />
        <span className="text-xs text-[var(--text-muted)]">{filtered.length} plugins</span>
      </div>

      <div className={cn('grid gap-3', selectedPlugin ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3')}>
        <AnimatePresence mode="popLayout">
          {filtered.map(plugin => (
            <PluginCard
              key={plugin.slug}
              plugin={plugin}
              onClick={() => setSelectedPlugin(selectedPlugin?.slug === plugin.slug ? null : plugin)}
              selected={selectedPlugin?.slug === plugin.slug}
            />
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedPlugin && (
          <div className="mt-4">
            <PluginDetail plugin={selectedPlugin} onClose={() => setSelectedPlugin(null)} />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RouterTab() {
  const [goal, setGoal] = useState('');
  const [result, setResult] = useState<RoutingResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRoute = () => {
    if (!goal.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setResult(routeGoal(goal));
      setLoading(false);
    }, 400);
  };

  const exampleGoals = [
    'Send a Slack notification when a GitHub PR is merged',
    'Run automated tests and report results to Linear',
    'Generate a weekly executive report and post to Notion',
    'Monitor Datadog alerts and page on-call via PagerDuty',
    'Search recent ML papers on Arxiv about code generation',
  ];

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <div className="p-4 rounded-xl bg-[rgba(99,102,241,0.05)] border border-[rgba(99,102,241,0.15)] mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={13} className="text-[var(--brand-primary)]" />
            <span className="text-xs font-semibold text-[var(--brand-primary)]">Plugin Router</span>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            Describe your goal and get a decisive recommendation — primary plugin, supporting plugins, required credentials, and setup steps.
          </p>
        </div>

        <textarea
          value={goal}
          onChange={e => setGoal(e.target.value)}
          placeholder="Describe what you want to accomplish..."
          rows={3}
          className="w-full px-4 py-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-primary)] resize-none transition-colors mb-3"
        />

        <div className="flex flex-wrap gap-2 mb-3">
          {exampleGoals.map(eg => (
            <button
              key={eg}
              onClick={() => setGoal(eg)}
              className="px-2.5 py-1.5 rounded-lg text-[11px] text-[var(--text-secondary)] bg-[var(--surface-2)] border border-[var(--border)] hover:border-[var(--brand-primary)] hover:text-[var(--text-primary)] transition-colors text-left"
            >
              {eg}
            </button>
          ))}
        </div>

        <button
          onClick={handleRoute}
          disabled={!goal.trim() || loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--brand-primary)] text-white text-sm font-semibold hover:bg-[var(--brand-secondary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? <Activity size={14} className="animate-spin" /> : <Zap size={14} />}
          Route to Best Plugin
        </button>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            {result.primary && (
              <div className="p-4 rounded-xl border border-[var(--brand-primary)] bg-[var(--surface-2)] glow-indigo">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--brand-primary)] text-white">PRIMARY</span>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">{result.primary.name}</h3>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mb-3">{result.primary.reason}</p>
                {result.primary.credentials.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {result.primary.credentials.map(c => (
                      <code key={c} className="px-2 py-0.5 rounded text-[11px] bg-[var(--surface-4)] text-[var(--brand-warning)] font-mono">{c}</code>
                    ))}
                  </div>
                )}
              </div>
            )}

            {result.supporting.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-[var(--text-muted)] mb-2">SUPPORTING PLUGINS</h4>
                <div className="space-y-2">
                  {result.supporting.map(s => (
                    <div key={s.slug} className="flex items-start gap-3 p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                      <ArrowRight size={12} className="text-[var(--brand-secondary)] mt-0.5 shrink-0" />
                      <div>
                        <span className="text-xs font-semibold text-[var(--text-primary)]">{s.name}</span>
                        <p className="text-[11px] text-[var(--text-muted)]">{s.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.credentialsRequired.length > 0 && (
              <div className="p-4 rounded-xl border border-[rgba(245,158,11,0.2)] bg-[rgba(245,158,11,0.05)]">
                <div className="flex items-center gap-2 mb-2">
                  <Key size={12} className="text-[var(--brand-warning)]" />
                  <span className="text-xs font-semibold text-[var(--brand-warning)]">Credentials Required</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {result.credentialsRequired.map(c => (
                    <code key={c} className="px-2 py-0.5 rounded text-[11px] bg-[var(--surface-4)] text-[var(--text-secondary)] font-mono">{c}</code>
                  ))}
                </div>
              </div>
            )}

            <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]">
              <h4 className="text-xs font-semibold text-[var(--text-muted)] mb-3">NEXT STEPS</h4>
              <div className="space-y-2">
                {result.nextSteps.map((step, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[var(--surface-4)] text-[10px] font-bold text-[var(--brand-primary)] flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    <p className="text-xs text-[var(--text-secondary)]">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AutomationsTab() {
  const [selected, setSelected] = useState<string | null>(null);
  const cadenceColors: Record<string, string> = {
    daily: 'text-[var(--brand-success)] bg-[rgba(16,185,129,0.1)] border-[rgba(16,185,129,0.3)]',
    weekly: 'text-[var(--brand-primary)] bg-[rgba(99,102,241,0.1)] border-[rgba(99,102,241,0.3)]',
    monthly: 'text-[var(--brand-accent)] bg-[rgba(6,182,212,0.1)] border-[rgba(6,182,212,0.3)]',
    'on-demand': 'text-[var(--text-secondary)] bg-[var(--surface-4)] border-[var(--border)]',
    'event-triggered': 'text-[var(--brand-warning)] bg-[rgba(245,158,11,0.1)] border-[rgba(245,158,11,0.3)]',
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {AUTOMATIONS.map(auto => {
          const isSelected = selected === auto.id;
          return (
            <motion.div key={auto.id} layout className="rounded-xl border bg-[var(--surface-2)] overflow-hidden border-[var(--border)]">
              <button
                onClick={() => setSelected(isSelected ? null : auto.id)}
                className="w-full text-left p-4 hover:bg-[var(--surface-3)] transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">{auto.title}</h3>
                  <span className={cn('px-2 py-0.5 rounded text-[10px] font-semibold border', cadenceColors[auto.cadence] || cadenceColors['on-demand'])}>
                    {auto.cadence}
                  </span>
                </div>
                {auto.schedule && (
                  <div className="flex items-center gap-1.5 mb-2">
                    <Clock size={11} className="text-[var(--text-muted)]" />
                    <span className="text-[11px] text-[var(--text-muted)]">{auto.schedule}</span>
                  </div>
                )}
                <p className="text-xs text-[var(--text-secondary)] line-clamp-2">{auto.prompt}</p>
              </button>
              <AnimatePresence>
                {isSelected && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="px-4 pb-4 border-t border-[var(--border)] pt-3">
                      <div className="mb-3">
                        <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase">Alloy Command</span>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="flex-1 text-[11px] font-mono text-[var(--brand-primary)] bg-[var(--surface-4)] px-2 py-1.5 rounded border border-[var(--border)] break-all">{auto.alloyCommandPrompt}</code>
                          <CopyButton text={auto.alloyCommandPrompt} />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {auto.plugins.map(slug => {
                          const plugin = PLUGINS.find(p => p.slug === slug);
                          return <Tag key={slug} label={plugin?.name || slug} />;
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function EcosystemTab() {
  const apps = [
    { name: 'SZL Holdings Dashboard', path: '/', category: 'Core', desc: 'Main executive dashboard and tenant management portal' },
    { name: 'Unified Command', path: '/command/', category: 'Core', desc: 'Single-pane-of-glass ecosystem command portal' },
    { name: 'Lyte — Decision Intelligence', path: '/lyte/', category: 'Intelligence', desc: 'AI-powered decision intelligence and analytics hub' },
    { name: 'Pulse — Executive Briefing', path: '/pulse/', category: 'Intelligence', desc: 'Automated executive briefing and signal aggregation' },
    { name: 'Vessels — Maritime Intelligence', path: '/vessels/', category: 'Domain', desc: 'Real-time maritime fleet tracking and weather risk' },
    { name: 'Sentra — Cyber Resilience', path: '/sentra/', category: 'Domain', desc: 'Security operations and threat detection' },
    { name: 'Terra — Real Estate Intelligence', path: '/terra/', category: 'Domain', desc: 'Real estate market intelligence and investment analytics' },
    { name: 'Counsel — Legal Matter Command', path: '/counsel/', category: 'Domain', desc: 'Legal matter management and document intelligence' },
    { name: 'A11oy — Brand Orchestration', path: '/a11oy/', category: 'Platform', desc: 'Brand asset management and design system orchestration' },
    { name: 'API Server', path: '/api/', category: 'Infrastructure', desc: 'Shared Express API with MCP, Alloy, and domain routes' },
    { name: 'Mobile Command', path: '/szl-holdings-mobile/', category: 'Mobile', desc: 'React Native mobile command center' },
  ];

  const categoryColors: Record<string, string> = {
    Core: 'var(--brand-primary)', Intelligence: 'var(--brand-accent)', Domain: 'var(--brand-secondary)',
    Platform: 'var(--brand-success)', Infrastructure: 'var(--brand-warning)', Mobile: '#ec4899',
  };

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {apps.map(app => (
          <div key={app.path} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] card-hover">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-xs font-semibold text-[var(--text-primary)] truncate">{app.name}</h3>
                <code className="text-[10px] text-[var(--text-muted)] font-mono">{app.path}</code>
              </div>
              <span className="ml-2 shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold border" style={{ color: categoryColors[app.category], backgroundColor: `${categoryColors[app.category]}18`, borderColor: `${categoryColors[app.category]}40` }}>
                {app.category}
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">{app.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Alloy Commands</h3>
        <div className="space-y-2">
          {[
            { cmd: 'alloy run weekly-status-report', desc: 'Weekly executive brief across all domains' },
            { cmd: 'alloy run incident-triage --incident_id <id>', desc: 'Execute SZL incident triage protocol' },
            { cmd: 'alloy skill invoke secrets-audit', desc: 'Audit all registered secrets for expiry' },
            { cmd: 'alloy decision list --status approval_required', desc: 'List pending decisions awaiting approval' },
            { cmd: 'alloy research --query <topic> --domains maritime,security', desc: 'Multi-domain intelligence query' },
          ].map(({ cmd, desc }) => (
            <div key={cmd} className="flex items-center gap-3 p-2.5 rounded-lg bg-[var(--surface-3)]">
              <code className="text-[11px] font-mono text-[var(--brand-primary)] flex-1">{cmd}</code>
              <span className="text-[10px] text-[var(--text-muted)] shrink-0 hidden sm:block">{desc}</span>
              <CopyButton text={cmd} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function McpTab() {
  const mcpServers = [
    { name: 'PluginMesh Broker', slug: 'pluginmesh', type: 'stdio', command: 'node scripts/mcp-server.mjs', tools: 12, noAuth: true, desc: 'Plugin catalog broker — zero-dependency' },
    { name: 'Alloy MCP Server', slug: 'alloy', type: 'http', url: '/api/mcp', tools: 23, noAuth: false, creds: ['ALLOY_INTERNAL_TOKEN'], desc: 'SZL Holdings governed orchestration' },
    { name: 'GitHub MCP Server', slug: 'github', type: 'stdio', command: 'npx -y @modelcontextprotocol/server-github', tools: 15, noAuth: false, creds: ['GITHUB_PERSONAL_ACCESS_TOKEN'], desc: 'GitHub repos, issues, PRs, and Actions' },
    { name: 'Filesystem MCP', slug: 'filesystem', type: 'stdio', command: 'npx -y @modelcontextprotocol/server-filesystem /home/runner/workspace', tools: 8, noAuth: true, desc: 'Read/write workspace files' },
    { name: 'Postgres MCP', slug: 'postgres', type: 'stdio', command: 'npx -y @modelcontextprotocol/server-postgres', tools: 6, noAuth: false, creds: ['DATABASE_URL'], desc: 'Query and inspect PostgreSQL databases' },
    { name: 'Brave Search MCP', slug: 'brave-search', type: 'stdio', command: 'npx -y @modelcontextprotocol/server-brave-search', tools: 2, noAuth: false, creds: ['BRAVE_API_KEY'], desc: 'Privacy-preserving web search' },
  ];

  const mcpJsonTemplate = JSON.stringify({
    mcpServers: {
      pluginmesh: { command: 'node', args: ['scripts/mcp-server.mjs'], env: {} },
      alloy: { url: 'https://${REPLIT_DEV_DOMAIN}/api/mcp', headers: { Authorization: 'Bearer ${ALLOY_INTERNAL_TOKEN}' } },
      github: { command: 'npx', args: ['-y', '@modelcontextprotocol/server-github'], env: { GITHUB_PERSONAL_ACCESS_TOKEN: '${GITHUB_PERSONAL_ACCESS_TOKEN}' } },
    },
  }, null, 2);

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {mcpServers.map(server => (
          <div key={server.slug} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] card-hover">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">{server.name}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[var(--surface-4)] text-[var(--text-muted)] border border-[var(--border)]">{server.type.toUpperCase()}</span>
                  <span className="text-[10px] text-[var(--text-muted)]">{server.tools} tools</span>
                </div>
              </div>
              {server.noAuth ? (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[rgba(16,185,129,0.15)] text-[var(--brand-success)] border border-[rgba(16,185,129,0.3)]">No auth</span>
              ) : (
                <Key size={12} className="text-[var(--text-muted)] mt-0.5" />
              )}
            </div>
            <p className="text-xs text-[var(--text-secondary)] mb-2">{server.desc}</p>
            <code className="text-[10px] font-mono text-[var(--text-muted)] block truncate">{server.command || server.url}</code>
            {server.creds && (
              <div className="flex flex-wrap gap-1 mt-2">
                {server.creds.map(c => <Tag key={c} label={c} />)}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">.mcp.json Template</h3>
          <CopyButton text={mcpJsonTemplate} />
        </div>
        <pre className="text-[10px] font-mono text-[var(--text-secondary)] overflow-x-auto">{mcpJsonTemplate}</pre>
      </div>

      <div className="mt-4 p-4 rounded-xl border border-[rgba(99,102,241,0.2)] bg-[rgba(99,102,241,0.05)]">
        <div className="flex items-center gap-2 mb-3">
          <Shield size={13} className="text-[var(--brand-primary)]" />
          <span className="text-xs font-semibold text-[var(--brand-primary)]">Security Note</span>
        </div>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          MCP servers run with your workspace permissions. Only activate servers you trust. Never hardcode credentials — use Replit Secrets for all tokens. All Alloy tool invocations are audit-logged by design.
        </p>
      </div>
    </div>
  );
}

const TABS = [
  { id: 'catalog' as const, label: 'Catalog', icon: Package },
  { id: 'router' as const, label: 'Router', icon: Zap },
  { id: 'automations' as const, label: 'Automations', icon: Clock },
  { id: 'ecosystem' as const, label: 'Ecosystem', icon: Globe },
  { id: 'mcp' as const, label: 'MCP Servers', icon: Server },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('catalog');

  return (
    <div className="min-h-screen bg-[var(--surface-0)] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[rgba(10,10,15,0.92)] backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] flex items-center justify-center">
                <Layers size={16} className="text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold gradient-text">PluginMesh</h1>
                <p className="text-[10px] text-[var(--text-muted)]">Codex Plugin Broker</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.2)]">
                <Cpu size={11} className="text-[var(--brand-success)]" />
                <span className="text-[10px] font-semibold text-[var(--brand-success)]">MCP Ready</span>
              </div>
              <span className="hidden sm:block text-xs text-[var(--text-muted)]">{PLUGINS.length} plugins · 7 categories</span>
            </div>
          </div>
        </div>
      </header>

      {/* Nav tabs */}
      <div className="border-b border-[var(--border)] bg-[var(--surface-1)]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all',
                    activeTab === tab.id
                      ? 'bg-[var(--brand-primary)] text-white'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-3)]'
                  )}
                >
                  <Icon size={13} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === 'catalog' && <CatalogTab />}
            {activeTab === 'router' && <RouterTab />}
            {activeTab === 'automations' && <AutomationsTab />}
            {activeTab === 'ecosystem' && <EcosystemTab />}
            {activeTab === 'mcp' && <McpTab />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] bg-[var(--surface-1)] py-3 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield size={11} className="text-[var(--text-muted)]" />
            <span className="text-[10px] text-[var(--text-muted)]">Never bypasses plugin auth · Generates setup templates only</span>
          </div>
          <span className="text-[10px] text-[var(--text-muted)] hidden sm:block">MCP Protocol 2024-11-05 · SZL Holdings</span>
        </div>
      </footer>
    </div>
  );
}
