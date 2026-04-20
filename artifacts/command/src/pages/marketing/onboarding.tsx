import { Button } from '@szl-holdings/shared-ui/ui/button';
import { Input } from '@szl-holdings/shared-ui/ui/input';
import { Label } from '@szl-holdings/shared-ui/ui/label';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  Anchor,
  ArrowRight,
  Bell,
  Briefcase,
  Building2,
  CheckCircle2,
  ChevronRight,
  Command as CmdIcon,
  Gavel,
  PlayCircle,
  Server,
  Shield,
  UserCircle,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { MarketingNav } from '../../components/marketing/MarketingNav';

const STORAGE_KEY = 'mkt_onboarding_v1';

interface OnboardingState {
  step: number;
  orgName: string;
  domain: string;
  selectedApps: string[];
  connectedSources: string[];
  tourWatched: boolean;
  checklist: Record<string, boolean>;
}

const DEFAULT_STATE: OnboardingState = {
  step: 1,
  orgName: '',
  domain: 'Technology & Software',
  selectedApps: [],
  connectedSources: [],
  tourWatched: false,
  checklist: {
    invite_team: false,
    configure_alerts: false,
    explore_dashboard: false,
    set_timezone: false,
  },
};

const PLATFORMS = [
  {
    id: 'aegis',
    name: 'Aegis',
    icon: Shield,
    desc: 'Defense & Intelligence Command',
    color: '#3b82f6',
  },
  {
    id: 'vessels',
    name: 'Vessels',
    icon: Anchor,
    desc: 'Maritime Fleet Management',
    color: '#0ea5e9',
  },
  {
    id: 'terra',
    name: 'Terra',
    icon: Building2,
    desc: 'Real Estate Intelligence',
    color: '#40856a',
  },
  { id: 'lyte', name: 'Lyte', icon: Activity, desc: 'AIOps & Autonomous Ops', color: '#d4a054' },
  {
    id: 'prism',
    name: 'PRISM Counsel',
    icon: Gavel,
    desc: 'Legal Matter Intelligence',
    color: '#f59e0b',
  },
  {
    id: 'szl',
    name: 'SZL Holdings',
    icon: Briefcase,
    desc: 'Executive Portfolio Command',
    color: '#b8bfcb',
  },
  {
    id: 'carlota-jo',
    name: 'Carlota Jo',
    icon: UserCircle,
    desc: 'Consulting Platform',
    color: '#e879f9',
  },
  {
    id: 'stephen',
    name: 'Stephen',
    icon: CmdIcon,
    desc: 'Personal Command Center',
    color: '#818cf8',
  },
  {
    id: 'command',
    name: 'Command Portal',
    icon: Server,
    desc: 'Ecosystem Orchestration',
    color: '#8b7ac8',
  },
];

const DATA_SOURCES = [
  'AWS Infrastructure',
  'Azure Active Directory',
  'Datadog / PagerDuty',
  'Jira / Linear',
  'Salesforce',
  'Custom REST API',
];

const CHECKLIST_ITEMS = [
  { key: 'invite_team', label: 'Invite team members' },
  { key: 'configure_alerts', label: 'Configure alert routing' },
  { key: 'explore_dashboard', label: 'Explore the Command dashboard' },
  { key: 'set_timezone', label: 'Set organization timezone' },
];

const TOTAL_STEPS = 5;

function loadState(): OnboardingState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_STATE;
}

function saveState(state: OnboardingState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export function MarketingOnboarding() {
  const [, setLocation] = useLocation();
  const [state, setState] = useState<OnboardingState>(loadState);

  const update = (patch: Partial<OnboardingState>) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      saveState(next);
      return next;
    });
  };

  const { step, orgName, domain, selectedApps, connectedSources, tourWatched, checklist } = state;

  const toggleApp = (id: string) => {
    update({
      selectedApps: selectedApps.includes(id)
        ? selectedApps.filter((a) => a !== id)
        : [...selectedApps, id],
    });
  };

  const toggleSource = (src: string) => {
    update({
      connectedSources: connectedSources.includes(src)
        ? connectedSources.filter((s) => s !== src)
        : [...connectedSources, src],
    });
  };

  const toggleChecklist = (key: string) => {
    update({ checklist: { ...checklist, [key]: !checklist[key] } });
  };

  const checklistCompleted = Object.values(checklist).filter(Boolean).length;
  const checklistTotal = CHECKLIST_ITEMS.length;

  const goNext = () => update({ step: Math.min(TOTAL_STEPS, step + 1) });
  const goBack = () => update({ step: Math.max(1, step - 1) });

  const STEP_TITLES = ['Setup', 'Platforms', 'Integrations', 'Tour', 'Launch'];

  return (
    <div className="min-h-[100dvh] bg-black text-white font-sans flex flex-col">
      <MarketingNav />

      {/* Progress Bar */}
      <div className="fixed top-16 left-0 right-0 h-0.5 bg-white/10 z-40">
        <motion.div
          className="h-full bg-blue-500"
          initial={{ width: `${((step - 1) / TOTAL_STEPS) * 100}%` }}
          animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Step Labels */}
      <div className="fixed top-16 left-0 right-0 z-30 flex justify-center gap-0 bg-black/80 backdrop-blur-sm border-b border-white/[0.04]">
        <div className="flex max-w-xl w-full px-6 py-2">
          {STEP_TITLES.map((label, i) => (
            <div key={i} className="flex-1 flex items-center">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`text-[10px] font-medium transition-colors ${i + 1 === step ? 'text-blue-400' : i + 1 < step ? 'text-emerald-400' : 'text-white/25'}`}
                >
                  {i + 1 < step ? <CheckCircle2 className="w-3 h-3" /> : label}
                </div>
              </div>
              {i < STEP_TITLES.length - 1 && (
                <div
                  className={`h-px flex-1 transition-colors ${i + 1 < step ? 'bg-emerald-500/40' : 'bg-white/10'}`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center p-6 pt-36 pb-24">
        <div className="w-full max-w-3xl">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-md mx-auto"
              >
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold tracking-tight mb-2">
                    Configure Your Organization
                  </h1>
                  <p className="text-white/50 text-sm">This takes less than a minute.</p>
                </div>
                <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-7 space-y-5">
                  <div className="space-y-1.5">
                    <Label className="text-white/70 text-xs">Organization Name</Label>
                    <Input
                      value={orgName}
                      onChange={(e) => update({ orgName: e.target.value })}
                      className="bg-white/5 border-white/10 text-white h-11"
                      placeholder="Acme Defense Corp"
                      data-testid="input-org-name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-white/70 text-xs">Primary Domain</Label>
                    <select
                      value={domain}
                      onChange={(e) => update({ domain: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-md h-11 px-3 text-white text-sm"
                      data-testid="select-domain"
                    >
                      <option>Technology & Software</option>
                      <option>Maritime & Logistics</option>
                      <option>Real Estate</option>
                      <option>Defense & Intelligence</option>
                      <option>Legal & Compliance</option>
                      <option>Financial Services</option>
                      <option>Energy & Utilities</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-white/70 text-xs">Team Size</Label>
                    <select
                      className="w-full bg-white/5 border border-white/10 rounded-md h-11 px-3 text-white text-sm"
                      data-testid="select-team-size"
                    >
                      <option>1–10 people</option>
                      <option>11–50 people</option>
                      <option>51–200 people</option>
                      <option>200+ people</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold tracking-tight mb-2">Activate Platforms</h2>
                  <p className="text-white/50 text-sm">
                    Choose the intelligence modules to enable for your deployment.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {PLATFORMS.map((app) => {
                    const isSelected = selectedApps.includes(app.id);
                    return (
                      <button
                        key={app.id}
                        onClick={() => toggleApp(app.id)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 text-left ${
                          isSelected
                            ? 'border-opacity-60 bg-opacity-10'
                            : 'bg-white/[0.02] border-white/[0.07] hover:bg-white/[0.04]'
                        }`}
                        style={
                          isSelected
                            ? { borderColor: app.color + '70', backgroundColor: app.color + '12' }
                            : {}
                        }
                        data-testid={`app-toggle-${app.id}`}
                      >
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                          style={
                            isSelected
                              ? { backgroundColor: app.color + '25' }
                              : { backgroundColor: 'rgba(255,255,255,0.06)' }
                          }
                        >
                          <app.icon
                            className="w-4 h-4"
                            style={
                              isSelected ? { color: app.color } : { color: 'rgba(255,255,255,0.5)' }
                            }
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm mb-0.5">{app.name}</div>
                          <div className="text-xs text-white/40 leading-snug">{app.desc}</div>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-full border shrink-0 flex items-center justify-center mt-0.5 ${isSelected ? 'border-0' : 'border-white/25'}`}
                          style={isSelected ? { backgroundColor: app.color } : {}}
                        >
                          {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
                {selectedApps.length > 0 && (
                  <p className="text-center text-xs text-white/35 mt-4">
                    {selectedApps.length} platform{selectedApps.length !== 1 ? 's' : ''} selected
                  </p>
                )}
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-xl mx-auto"
              >
                <div className="text-center mb-8">
                  <Server className="w-12 h-12 text-blue-400 mx-auto mb-4 opacity-80" />
                  <h2 className="text-3xl font-bold tracking-tight mb-2">Connect Data Sources</h2>
                  <p className="text-white/50 text-sm">
                    Integrate your existing infrastructure. You can also do this later from
                    Settings.
                  </p>
                </div>
                <div className="space-y-3">
                  {DATA_SOURCES.map((src, i) => {
                    const isConnected = connectedSources.includes(src);
                    return (
                      <div
                        key={i}
                        className="p-4 rounded-xl border border-white/[0.07] bg-white/[0.02] flex items-center justify-between"
                      >
                        <div>
                          <div className="font-medium text-sm text-white/85">{src}</div>
                          {isConnected && (
                            <div className="text-xs text-emerald-400 mt-0.5">Connected</div>
                          )}
                        </div>
                        <Button
                          variant={isConnected ? 'outline' : 'outline'}
                          size="sm"
                          onClick={() => toggleSource(src)}
                          className={`h-8 text-xs border shrink-0 ${isConnected ? 'border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10' : 'border-white/20 text-white/70 hover:bg-white/5'}`}
                          data-testid={`source-connect-${src.toLowerCase().replace(/\W+/g, '-')}`}
                        >
                          {isConnected ? 'Disconnect' : 'Connect'}
                        </Button>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-white/30 text-center mt-5">
                  You can add custom integrations from the Integrations hub at any time.
                </p>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-2xl mx-auto"
              >
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold tracking-tight mb-2">Platform Tour</h2>
                  <p className="text-white/50 text-sm">
                    A 3-minute overview of navigating the Command interface.
                  </p>
                </div>
                <div
                  className="aspect-video bg-zinc-900 rounded-2xl border border-white/10 flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer mb-6"
                  onClick={() => update({ tourWatched: true })}
                  data-testid="tour-video"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 to-transparent" />
                  {tourWatched ? (
                    <div className="text-center relative z-10">
                      <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                      <div className="font-medium text-white/90">Tour complete</div>
                    </div>
                  ) : (
                    <>
                      <PlayCircle className="w-16 h-16 text-white/80 group-hover:scale-110 group-hover:text-white transition-all z-10 mb-3" />
                      <div className="text-sm text-white/60 z-10">
                        Click to watch the guided tour
                      </div>
                    </>
                  )}
                  <div className="absolute bottom-5 left-5 text-left z-10">
                    <div className="text-sm font-semibold">Navigating the Command Interface</div>
                    <div className="text-xs text-white/40">3:12 · Interactive Walkthrough</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      icon: Bell,
                      label: 'Alert Configuration',
                      desc: 'Set thresholds and routing rules',
                    },
                    {
                      icon: Users,
                      label: 'Team Management',
                      desc: 'Roles, permissions, and invites',
                    },
                    {
                      icon: ArrowRight,
                      label: 'Keyboard Shortcuts',
                      desc: 'Navigate at command speed',
                    },
                  ].map(({ icon: Icon, label, desc }, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.01] text-center"
                    >
                      <Icon className="w-5 h-5 text-white/35 mx-auto mb-2" />
                      <div className="text-xs font-medium text-white/75 mb-1">{label}</div>
                      <div className="text-xs text-white/35 leading-snug">{desc}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-lg mx-auto"
              >
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h2 className="text-3xl font-bold tracking-tight mb-2">
                    {orgName ? `${orgName} is Ready` : 'Command Ready'}
                  </h2>
                  <p className="text-white/50 text-sm">
                    Your intelligence ecosystem is live.
                    {selectedApps.length > 0 &&
                      ` ${selectedApps.length} platform${selectedApps.length !== 1 ? 's' : ''} activated.`}
                  </p>
                </div>

                <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-sm text-white/80 flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      Getting Started Checklist
                    </h3>
                    <span className="text-xs text-white/40">
                      {checklistCompleted}/{checklistTotal} complete
                    </span>
                  </div>

                  {/* Progress */}
                  <div className="h-1.5 bg-white/10 rounded-full mb-5 overflow-hidden">
                    <motion.div
                      className="h-full bg-emerald-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(checklistCompleted / checklistTotal) * 100}%` }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>

                  <ul className="space-y-3">
                    {(
                      [
                        {
                          key: 'configure_org',
                          label: 'Configure organization',
                          done: true,
                          toggle: false,
                        },
                        {
                          key: 'activate_platforms',
                          label: `Activate platforms (${selectedApps.length} selected)`,
                          done: selectedApps.length > 0,
                          toggle: false,
                        },
                        ...CHECKLIST_ITEMS.map((item) => ({
                          key: item.key,
                          label: item.label,
                          done: checklist[item.key] ?? false,
                          toggle: true,
                        })),
                      ] as Array<{ key: string; label: string; done: boolean; toggle: boolean }>
                    ).map(({ key, label, done, toggle }) => (
                      <li
                        key={key}
                        className={`flex items-center gap-3 text-sm ${toggle ? 'cursor-pointer group' : ''}`}
                        onClick={toggle ? () => toggleChecklist(key) : undefined}
                        data-testid={`checklist-item-${key}`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${done ? 'bg-emerald-500 border-emerald-500' : 'border-white/30 group-hover:border-white/50'}`}
                        >
                          {done && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </div>
                        <span className={done ? 'text-white/40 line-through' : 'text-white/75'}>
                          {label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  onClick={() => setLocation('/')}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                  data-testid="button-access-command"
                >
                  Access Command Center
                </Button>
                <p className="text-center text-xs text-white/30 mt-3">
                  You can always return to this setup guide from Settings.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer Nav */}
      <footer className="border-t border-white/[0.06] px-6 py-4 bg-black flex justify-between items-center z-10">
        <Button
          variant="ghost"
          onClick={goBack}
          className={`text-white/50 hover:text-white text-sm ${step === 1 ? 'invisible' : ''}`}
          data-testid="button-back"
        >
          Back
        </Button>
        {step < TOTAL_STEPS ? (
          <Button
            onClick={goNext}
            className="bg-white text-black hover:bg-white/90 font-medium px-7 h-10"
            data-testid="button-continue"
          >
            Continue <ChevronRight className="ml-1.5 w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={() => setLocation('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-7 h-10"
            data-testid="button-finish"
          >
            Enter Command Center
          </Button>
        )}
      </footer>
    </div>
  );
}
