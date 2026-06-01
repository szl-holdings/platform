import { Badge } from '@szl-holdings/shared-ui/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@szl-holdings/shared-ui/ui/card';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  Bell,
  BellOff,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  Loader2,
  Mail,
  Minus,
  Plus,
  Radar,
  RefreshCw,
  Save,
  Settings2,
  Sparkles,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ClientScopeSwitcher, { useClientScope } from '@/components/ClientScopeSwitcher';
import { usePageMeta } from '@/hooks/usePageMeta';

const GOLD = 'var(--color-gold)';

type CompetitorSignal = {
  competitor: string;
  event: string;
  impact: 'high' | 'medium' | 'low';
  direction: 'threat' | 'opportunity' | 'neutral';
  date: string;
  detail: string;
  source?: string;
  url?: string;
};

type IntelBrief = {
  headline: string;
  summary: string;
  signals: CompetitorSignal[];
  marketShift: string;
  recommendation: string;
};

type CompetitorEntry = { name: string; share: number; trend: string; score: number };
type MarketTrendPoint = { month: string; you: number; market: number };

function TrendIcon({ trend }: { trend: string }) {
  if (trend === 'up') return <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />;
  if (trend === 'down') return <TrendingDown className="w-3.5 h-3.5 text-red-500" />;
  return <Minus className="w-3.5 h-3.5 text-muted-foreground" />;
}

function ImpactBadge({ impact }: { impact: 'high' | 'medium' | 'low' }) {
  const styles = {
    high: 'bg-red-50 text-red-700 border-red-200',
    medium: 'bg-amber-50 text-amber-700 border-amber-200',
    low: 'bg-blue-50 text-blue-700 border-blue-200',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${styles[impact]}`}>
      {impact} impact
    </span>
  );
}

function DirectionBadge({ direction }: { direction: 'threat' | 'opportunity' | 'neutral' }) {
  const styles = {
    threat: 'bg-red-50 text-red-700 border-red-200',
    opportunity: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    neutral: 'bg-stone-50 text-stone-600 border-stone-200',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${styles[direction]}`}>
      {direction}
    </span>
  );
}

const API = `${import.meta.env.BASE_URL}api`;

const DEFAULT_COMPETITOR_NAMES = [
  'McKinsey & Company',
  'BCG',
  'Bain & Company',
  'Oliver Wyman',
  'Roland Berger',
  'Kearney',
];
const COMPETITORS_STORAGE_KEY = 'carlota-radar-competitors';
const REFRESH_INTERVAL_STORAGE_KEY = 'carlota-radar-refresh-interval';

function competitorsCacheKey(clientId: string | null): string {
  return `${COMPETITORS_STORAGE_KEY}:${clientId ?? 'portfolio'}`;
}

const REFRESH_OPTIONS: Array<{ label: string; value: number }> = [
  { label: 'Off', value: 0 },
  { label: '1 min', value: 60_000 },
  { label: '5 min', value: 5 * 60_000 },
  { label: '15 min', value: 15 * 60_000 },
  { label: '1 hr', value: 60 * 60_000 },
];

function loadCompetitorList(clientId: string | null): string[] {
  if (typeof window === 'undefined') return DEFAULT_COMPETITOR_NAMES;
  try {
    const raw = localStorage.getItem(competitorsCacheKey(clientId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.every((s) => typeof s === 'string') && parsed.length > 0)
        return parsed;
    }
    // Backwards compatibility: legacy single-key storage from before per-client persistence
    const legacy = localStorage.getItem(COMPETITORS_STORAGE_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy);
      if (Array.isArray(parsed) && parsed.every((s) => typeof s === 'string') && parsed.length > 0)
        return parsed;
    }
  } catch {}
  return DEFAULT_COMPETITOR_NAMES;
}

const SEEN_HIGH_IMPACT_KEY = 'carlota-radar-seen-high-impact';
const ALERT_TOAST_LIMIT = 5;

function hashSignalKey(competitor: string, event: string, date: string): string {
  return `${competitor.toLowerCase()}|${event.toLowerCase()}|${date}`;
}

function loadSeenHighImpact(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(SEEN_HIGH_IMPACT_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return new Set(parsed.filter((s) => typeof s === 'string'));
  } catch {}
  return new Set();
}

function saveSeenHighImpact(set: Set<string>) {
  if (typeof window === 'undefined') return;
  try {
    const arr = Array.from(set).slice(-500);
    localStorage.setItem(SEEN_HIGH_IMPACT_KEY, JSON.stringify(arr));
  } catch {}
}

type RadarPrefs = {
  enabled: boolean;
  emailEnabled: boolean;
  inAppEnabled: boolean;
  email: string | null;
  frequency: 'instant' | 'daily' | 'weekly';
  competitors: string[] | null;
  pendingDigestCount: number;
  lastDigestAt: string | null;
  exists?: boolean;
};

const DEFAULT_PREFS: RadarPrefs = {
  enabled: true,
  emailEnabled: true,
  inAppEnabled: true,
  email: null,
  frequency: 'instant',
  competitors: null,
  pendingDigestCount: 0,
  lastDigestAt: null,
  exists: false,
};

function loadRefreshInterval(): number {
  if (typeof window === 'undefined') return 5 * 60_000;
  try {
    const raw = localStorage.getItem(REFRESH_INTERVAL_STORAGE_KEY);
    if (raw == null) return 5 * 60_000;
    const n = Number(raw);
    if (REFRESH_OPTIONS.some((o) => o.value === n)) return n;
  } catch {}
  return 5 * 60_000;
}

export default function CompetitiveRadar() {
  usePageMeta({
    title: 'Competitive Intelligence Radar | Carlota Jo',
    description:
      'Evidence-backed competitive monitoring dashboard — track competitor moves, market shifts, and emerging threats in real time.',
    canonical: 'https://szlholdings.com/carlota-jo/competitive-radar',
  });

  const [brief, setBrief] = useState<IntelBrief | null>(null);
  const [expandedSignal, setExpandedSignal] = useState<number | null>(null);
  const [competitors, setCompetitors] = useState<CompetitorEntry[]>([]);
  const [signals, setSignals] = useState<CompetitorSignal[]>([]);
  const [marketTrend, setMarketTrend] = useState<MarketTrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [generatingBrief, setGeneratingBrief] = useState(false);
  const { clientId, setClientId, clients, isAdmin } = useClientScope();
  const activeClient = clients.find((c) => c.id === clientId) ?? null;
  const [companyContext, setCompanyContext] = useState({
    name: 'Carlota Jo Consulting',
    industry: 'Management Consulting',
  });
  const [tracked, setTracked] = useState<string[]>(() => loadCompetitorList(null));
  const [trackedSource, setTrackedSource] = useState<'server' | 'local' | 'default'>('default');
  const [trackedSavedAt, setTrackedSavedAt] = useState<Date | null>(null);
  const [savingTracked, setSavingTracked] = useState(false);
  const [trackedSaveError, setTrackedSaveError] = useState<string | null>(null);
  const [refreshIntervalMs, setRefreshIntervalMs] = useState<number>(() => loadRefreshInterval());
  const [showSettings, setShowSettings] = useState(false);
  const [newCompetitor, setNewCompetitor] = useState('');
  const [liveData, setLiveData] = useState<boolean>(false);
  const [sourceLabel, setSourceLabel] = useState<string>('');
  const [liveSignalCount, setLiveSignalCount] = useState<number>(0);
  const [prefs, setPrefs] = useState<RadarPrefs>(DEFAULT_PREFS);
  const [prefsDraft, setPrefsDraft] = useState<RadarPrefs>(DEFAULT_PREFS);
  const [showNotifSettings, setShowNotifSettings] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefsMessage, setPrefsMessage] = useState<string | null>(null);
  const [alertSignals, setAlertSignals] = useState<CompetitorSignal[]>([]);
  const seenHighImpactRef = useRef<Set<string>>(loadSeenHighImpact());
  const trackedRef = useRef(tracked);
  trackedRef.current = tracked;
  const clientIdRef = useRef(clientId);
  clientIdRef.current = clientId;

  useEffect(() => {
    setCompanyContext(
      activeClient
        ? { name: activeClient.name, industry: activeClient.industry }
        : { name: 'Carlota Jo Consulting', industry: 'Management Consulting' },
    );
  }, [activeClient]);

  useEffect(() => {
    try {
      localStorage.setItem(competitorsCacheKey(clientId), JSON.stringify(tracked));
    } catch {}
  }, [tracked, clientId]);

  useEffect(() => {
    let cancelled = false;
    const ac = new AbortController();
    setTrackedSaveError(null);
    (async () => {
      try {
        const params = new URLSearchParams();
        if (clientId) params.set('clientId', clientId);
        const qs = params.toString() ? `?${params.toString()}` : '';
        const res = await fetch(`${API}/carlota/radar-competitors${qs}`, {
          credentials: 'include',
          signal: ac.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (cancelled) return;
        const list = json?.data?.competitors;
        const updatedAt = json?.data?.updatedAt;
        if (
          Array.isArray(list) &&
          list.every((s: unknown) => typeof s === 'string') &&
          list.length > 0
        ) {
          setTracked(list as string[]);
          setTrackedSource('server');
          setTrackedSavedAt(updatedAt ? new Date(updatedAt) : null);
        } else {
          // No server-side list yet — fall back to local cache / defaults for this scope
          const local = loadCompetitorList(clientId);
          setTracked(local);
          setTrackedSource(
            typeof window !== 'undefined' && localStorage.getItem(competitorsCacheKey(clientId))
              ? 'local'
              : 'default',
          );
          setTrackedSavedAt(null);
        }
      } catch {
        if (cancelled) return;
        const local = loadCompetitorList(clientId);
        setTracked(local);
        setTrackedSource(
          typeof window !== 'undefined' && localStorage.getItem(competitorsCacheKey(clientId))
            ? 'local'
            : 'default',
        );
        setTrackedSavedAt(null);
      }
    })();
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [clientId]);

  const persistTracked = useCallback(
    async (next: string[]) => {
      setSavingTracked(true);
      setTrackedSaveError(null);
      try {
        const res = await fetch(`${API}/carlota/radar-competitors`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId: clientId ?? null, competitors: next }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const updatedAt = json?.data?.updatedAt;
        setTrackedSource('server');
        setTrackedSavedAt(updatedAt ? new Date(updatedAt) : new Date());
      } catch {
        setTrackedSaveError(
          "Saved locally — couldn't reach the server. Will retry on next change.",
        );
        setTrackedSource('local');
      } finally {
        setSavingTracked(false);
      }
    },
    [clientId],
  );

  useEffect(() => {
    try {
      localStorage.setItem(REFRESH_INTERVAL_STORAGE_KEY, String(refreshIntervalMs));
    } catch {}
  }, [refreshIntervalMs]);

  const loadData = useCallback(async (opts: { silent?: boolean } = {}) => {
    if (opts.silent) setRefreshing(true);
    else setLoading(true);
    try {
      const list = trackedRef.current;
      const params = new URLSearchParams();
      if (list.length > 0) params.set('competitors', list.join(','));
      if (clientIdRef.current) params.set('clientId', clientIdRef.current);
      const qs = params.toString() ? `?${params.toString()}` : '';
      const radarRes = await fetch(`${API}/carlota/radar-signals${qs}`, { credentials: 'include' });
      if (radarRes.ok) {
        const json = await radarRes.json();
        const data = json.data ?? json;
        if (Array.isArray(data.signals)) setSignals(data.signals);
        if (Array.isArray(data.competitors)) setCompetitors(data.competitors);
        if (Array.isArray(data.marketTrend)) setMarketTrend(data.marketTrend);
        setLiveData(Boolean(data.liveData));
        setSourceLabel(typeof data.sourceLabel === 'string' ? data.sourceLabel : '');
        setLiveSignalCount(typeof data.liveSignalCount === 'number' ? data.liveSignalCount : 0);
      }
    } catch {
    } finally {
      setLastUpdated(new Date());
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData, tracked, clientId]);

  // Detect new high-impact signals on every signals update; show toast
  // ONLY when the user has explicitly enabled in-app alerts. Until prefs
  // have loaded (prefs.exists === false on first load) we mark signals as
  // seen silently so the user doesn't get a deluge of "new" alerts the
  // first time they open the page.
  useEffect(() => {
    if (signals.length === 0) return;
    const fresh: CompetitorSignal[] = [];
    for (const s of signals) {
      if (s.impact !== 'high') continue;
      if (s.competitor.toLowerCase().includes('(portfolio)')) continue;
      const key = hashSignalKey(s.competitor, s.event, s.date);
      if (!seenHighImpactRef.current.has(key)) {
        fresh.push(s);
        seenHighImpactRef.current.add(key);
      }
    }
    if (fresh.length === 0) return;
    saveSeenHighImpact(seenHighImpactRef.current);
    const inAppOn = prefs.exists && prefs.enabled && prefs.inAppEnabled;
    if (!inAppOn) return;
    setAlertSignals((prev) =>
      [...fresh.slice(0, ALERT_TOAST_LIMIT), ...prev].slice(0, ALERT_TOAST_LIMIT),
    );
  }, [signals, prefs.exists, prefs.enabled, prefs.inAppEnabled]);

  // If the user disables in-app alerts (or alerts entirely) clear any
  // toasts currently on screen so the UI stays consistent with prefs.
  useEffect(() => {
    if (!prefs.exists) return;
    if (!prefs.enabled || !prefs.inAppEnabled) {
      setAlertSignals((prev) => (prev.length === 0 ? prev : []));
    }
  }, [prefs.exists, prefs.enabled, prefs.inAppEnabled]);

  const dismissAlert = useCallback((idx: number) => {
    setAlertSignals((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const dismissAllAlerts = useCallback(() => setAlertSignals([]), []);

  // Load notification preferences once.
  const loadPrefs = useCallback(async () => {
    try {
      const res = await fetch(`${API}/carlota/radar/notification-preferences`, {
        credentials: 'include',
      });
      if (!res.ok) return;
      const json = await res.json();
      const data = (json.data ?? json) as RadarPrefs;
      setPrefs(data);
      setPrefsDraft(data);
    } catch {}
  }, []);

  useEffect(() => {
    void loadPrefs();
  }, [loadPrefs]);

  const savePrefs = useCallback(async () => {
    setSavingPrefs(true);
    setPrefsMessage(null);
    try {
      const res = await fetch(`${API}/carlota/radar/notification-preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          enabled: prefsDraft.enabled,
          emailEnabled: prefsDraft.emailEnabled,
          inAppEnabled: prefsDraft.inAppEnabled,
          email: prefsDraft.email,
          frequency: prefsDraft.frequency,
          competitors: prefsDraft.competitors,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setPrefsMessage(json.error || 'Failed to save');
        return;
      }
      const data = (json.data ?? json) as RadarPrefs;
      setPrefs(data);
      setPrefsDraft(data);
      setPrefsMessage('Preferences saved');
      setTimeout(() => setPrefsMessage(null), 2500);
    } catch {
      setPrefsMessage('Failed to save');
    } finally {
      setSavingPrefs(false);
    }
  }, [prefsDraft]);

  const flushDigest = useCallback(async () => {
    setSavingPrefs(true);
    try {
      const res = await fetch(`${API}/carlota/radar/notification-preferences/flush-digest`, {
        method: 'POST',
        credentials: 'include',
      });
      const json = await res.json();
      const data = json.data ?? json;
      setPrefsMessage(
        `Sent digest with ${data.sent ?? 0} signal${(data.sent ?? 0) === 1 ? '' : 's'}`,
      );
      setTimeout(() => setPrefsMessage(null), 3000);
      await loadPrefs();
    } catch {
      setPrefsMessage('Failed to send digest');
    } finally {
      setSavingPrefs(false);
    }
  }, [loadPrefs]);

  useEffect(() => {
    if (refreshIntervalMs <= 0) return;
    const id = window.setInterval(() => {
      void loadData({ silent: true });
    }, refreshIntervalMs);
    return () => window.clearInterval(id);
  }, [refreshIntervalMs, loadData]);

  const addCompetitor = () => {
    const name = newCompetitor.trim();
    if (!name) return;
    if (tracked.some((c) => c.toLowerCase() === name.toLowerCase())) {
      setNewCompetitor('');
      return;
    }
    if (tracked.length >= 12) return;
    const next = [...tracked, name];
    setTracked(next);
    setNewCompetitor('');
    void persistTracked(next);
  };

  const removeCompetitor = (name: string) => {
    if (tracked.length <= 1) return;
    const next = tracked.filter((c) => c !== name);
    setTracked(next);
    void persistTracked(next);
  };

  const resetCompetitors = () => {
    setTracked(DEFAULT_COMPETITOR_NAMES);
    void persistTracked(DEFAULT_COMPETITOR_NAMES);
  };

  const generateWeeklyBrief = async () => {
    setGeneratingBrief(true);
    try {
      const prompt = `You are a competitive intelligence analyst at a top strategy consulting firm. Generate a weekly competitive intelligence brief as JSON with EXACTLY this structure:
{
  "headline": "One sharp headline summarizing the week's most important competitive development",
  "summary": "2-3 sentence executive brief — what happened this week in the competitive landscape",
  "marketShift": "1-2 sentence description of the most important market-level shift this week",
  "recommendation": "Concrete, specific action recommendation based on this week's intelligence"
}

Context: ${companyContext.name} operates in ${companyContext.industry}. Key competitors: ${competitors.map((c) => c.name).join(', ') || 'Not yet tracked'}.

Recent signals: ${signals.map((s) => `${s.competitor}: ${s.event} (${s.direction})`).join('; ') || 'No signals available'}.

Return ONLY valid JSON, no markdown.`;

      const res = await fetch(`${API}/intelligence/ai/advisory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          context: 'Competitive intelligence radar — Carlota Jo platform',
        }),
      });

      if (!res.ok || !res.body) throw new Error('Brief generation failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const json = JSON.parse(line.slice(6));
            if (json.content) fullContent += json.content;
          } catch {}
        }
      }

      const parsed = JSON.parse(fullContent);
      setBrief({ ...parsed, signals });
    } catch {
      setBrief(null);
    } finally {
      setGeneratingBrief(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Radar className="w-5 h-5" style={{ color: GOLD }} />
            <span className="text-xs font-medium uppercase tracking-widest" style={{ color: GOLD }}>
              Competitive Intelligence Radar
            </span>
          </div>
          <h1 className="text-2xl" style={{ fontFamily: 'var(--font-serif)' }}>
            Competitive Landscape Monitor
          </h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5 flex-wrap">
            <Clock className="w-3.5 h-3.5" />
            Last updated{' '}
            {lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} —{' '}
            {lastUpdated.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            {refreshing && <Loader2 className="w-3 h-3 animate-spin" />}
            {sourceLabel && (
              <span
                className="text-xs px-2 py-0.5 rounded-full border"
                style={{
                  borderColor: liveData ? 'var(--color-gold-border)' : 'var(--color-stone-300)',
                  background: liveData ? 'var(--color-gold-dim)' : 'transparent',
                  color: liveData ? GOLD : 'var(--color-muted-foreground)',
                }}
              >
                {sourceLabel}
              </span>
            )}
          </p>
          {activeClient && (
            <p className="text-xs mt-1" style={{ color: GOLD }}>
              Scoped to <strong>{activeClient.name}</strong> · {activeClient.industry}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isAdmin && (
            <ClientScopeSwitcher clientId={clientId} onChange={setClientId} clients={clients} />
          )}
          <select
            value={refreshIntervalMs}
            onChange={(e) => setRefreshIntervalMs(Number(e.target.value))}
            className="text-xs px-2 py-1.5 rounded-lg border border-border bg-background"
            title="Auto-refresh interval"
          >
            {REFRESH_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                Auto: {o.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => loadData()}
            disabled={loading || refreshing}
            className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted/50 transition-colors flex items-center gap-1.5 disabled:opacity-60"
            title="Refresh now"
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowSettings((s) => !s)}
            className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted/50 transition-colors flex items-center gap-1.5"
            title="Configure tracked competitors"
          >
            <Settings2 className="w-3 h-3" />
            Competitors
          </button>
          <button
            onClick={() => setShowNotifSettings((s) => !s)}
            className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted/50 transition-colors flex items-center gap-1.5"
            title="Configure alert notifications"
          >
            {prefs.enabled ? <Bell className="w-3 h-3" /> : <BellOff className="w-3 h-3" />}
            Alerts
            {prefs.exists && prefs.enabled && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full"
                style={{ background: 'var(--color-gold-dim)', color: GOLD }}
              >
                {prefs.frequency}
              </span>
            )}
          </button>
          <button
            onClick={generateWeeklyBrief}
            disabled={generatingBrief}
            className="text-xs px-4 py-1.5 rounded-lg text-white flex items-center gap-1.5 hover:opacity-90 transition-opacity disabled:opacity-60"
            style={{ background: GOLD }}
          >
            {generatingBrief ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
            {generatingBrief ? 'Generating…' : 'Generate Weekly Brief'}
          </button>
        </div>
      </div>

      {alertSignals.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-l-4" style={{ borderLeftColor: 'var(--color-red-500, #dc2626)' }}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Bell className="w-4 h-4 text-red-600 animate-pulse" />
                  {alertSignals.length} new high-impact signal{alertSignals.length === 1 ? '' : 's'}
                </CardTitle>
                <button
                  onClick={dismissAllAlerts}
                  className="text-xs text-muted-foreground hover:text-foreground"
                  title="Dismiss all alerts"
                >
                  Dismiss all
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {alertSignals.map((s, i) => (
                <div
                  key={`${s.competitor}-${s.event}-${i}`}
                  className="flex items-start justify-between gap-3 p-2 rounded-lg border border-red-100 bg-red-50/50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-medium text-red-700">{s.competitor}</span>
                      <DirectionBadge direction={s.direction} />
                      <span className="text-xs text-muted-foreground">{s.date}</span>
                    </div>
                    <p className="text-xs text-foreground">{s.event}</p>
                    {s.url && s.url !== '#' && (
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs mt-1 hover:underline"
                        style={{ color: GOLD }}
                      >
                        Open article <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <button
                    onClick={() => dismissAlert(i)}
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                    title="Dismiss"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {!prefs.exists && (
                <p className="text-xs text-muted-foreground pt-1">
                  Tip: open{' '}
                  <button
                    onClick={() => setShowNotifSettings(true)}
                    className="underline"
                    style={{ color: GOLD }}
                  >
                    Alerts
                  </button>{' '}
                  to receive these by email or as a daily digest.
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {showNotifSettings && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bell className="w-4 h-4" style={{ color: GOLD }} />
              Alert Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Get notified when a new high-impact signal lands for one of your tracked competitors.
              We only alert on signals classified as <strong>high impact</strong>; everything else
              still appears in the feed below.
            </p>

            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={prefsDraft.enabled}
                onChange={(e) => setPrefsDraft({ ...prefsDraft, enabled: e.target.checked })}
              />
              Enable high-impact alerts
            </label>

            <div
              className={`grid gap-3 sm:grid-cols-2 ${prefsDraft.enabled ? '' : 'opacity-50 pointer-events-none'}`}
            >
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={prefsDraft.inAppEnabled}
                  onChange={(e) => setPrefsDraft({ ...prefsDraft, inAppEnabled: e.target.checked })}
                />
                In-app toast on this page
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={prefsDraft.emailEnabled}
                  onChange={(e) => setPrefsDraft({ ...prefsDraft, emailEnabled: e.target.checked })}
                />
                Email notifications
              </label>
            </div>

            <div
              className={`grid gap-3 sm:grid-cols-2 ${prefsDraft.enabled ? '' : 'opacity-50 pointer-events-none'}`}
            >
              <div>
                <label className="text-xs font-medium block mb-1">Email address</label>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    type="email"
                    placeholder="you@firm.com"
                    value={prefsDraft.email ?? ''}
                    onChange={(e) =>
                      setPrefsDraft({ ...prefsDraft, email: e.target.value || null })
                    }
                    className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-border bg-background"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">Frequency</label>
                <select
                  value={prefsDraft.frequency}
                  onChange={(e) =>
                    setPrefsDraft({
                      ...prefsDraft,
                      frequency: e.target.value as 'instant' | 'daily' | 'weekly',
                    })
                  }
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-border bg-background"
                >
                  <option value="instant">Instant — every high-impact signal</option>
                  <option value="daily">Daily digest</option>
                  <option value="weekly">Weekly digest</option>
                </select>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Alerts respect your tracked competitor list above ({tracked.length} tracked).
            </p>

            <div className="flex items-center gap-2 flex-wrap pt-1">
              <button
                onClick={savePrefs}
                disabled={savingPrefs}
                className="text-xs px-3 py-1.5 rounded-lg text-white flex items-center gap-1.5 hover:opacity-90 transition-opacity disabled:opacity-60"
                style={{ background: GOLD }}
              >
                {savingPrefs ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Save className="w-3 h-3" />
                )}
                Save preferences
              </button>
              {prefs.exists && prefs.frequency !== 'instant' && prefs.pendingDigestCount > 0 && (
                <button
                  onClick={flushDigest}
                  disabled={savingPrefs}
                  className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted/50 transition-colors disabled:opacity-60"
                  title="Send the queued digest right now"
                >
                  Send digest now ({prefs.pendingDigestCount} queued)
                </button>
              )}
              {prefs.exists && prefs.lastDigestAt && (
                <span className="text-xs text-muted-foreground">
                  Last digest:{' '}
                  {new Date(prefs.lastDigestAt).toLocaleString('en-GB', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              )}
              {prefsMessage && (
                <span className="text-xs" style={{ color: GOLD }}>
                  {prefsMessage}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {showSettings && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Settings2 className="w-4 h-4" style={{ color: GOLD }} />
              Tracked Competitors ({tracked.length}/12)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Add or remove competitors to monitor. Live news is pulled per-competitor and refreshed
              at the chosen interval.
            </p>
            <p className="text-xs text-muted-foreground">
              {savingTracked ? (
                <span className="inline-flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin" /> Saving…
                </span>
              ) : trackedSource === 'server' ? (
                <span>
                  Saved to your account
                  {trackedSavedAt
                    ? ` · ${trackedSavedAt.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                    : ''}
                  {clientId ? ' for this client view' : ' (portfolio view)'}.
                </span>
              ) : trackedSource === 'local' ? (
                <span>
                  Saved locally to this browser
                  {clientId ? ' for this client view' : ' (portfolio view)'} — will sync when the
                  server is reachable.
                </span>
              ) : (
                <span>
                  Default list — your changes will be saved to your account
                  {clientId ? ' for this client view' : ' (portfolio view)'}.
                </span>
              )}
            </p>
            {trackedSaveError && <p className="text-xs text-amber-700">{trackedSaveError}</p>}
            <div className="flex flex-wrap gap-2">
              {tracked.map((name) => (
                <span
                  key={name}
                  className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border"
                  style={{
                    borderColor: 'var(--color-gold-border)',
                    background: 'var(--color-gold-dim)',
                  }}
                >
                  {name}
                  <button
                    onClick={() => removeCompetitor(name)}
                    disabled={tracked.length <= 1}
                    className="hover:opacity-70 disabled:opacity-30"
                    title={
                      tracked.length <= 1 ? 'At least one competitor required' : `Remove ${name}`
                    }
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={newCompetitor}
                onChange={(e) => setNewCompetitor(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCompetitor();
                  }
                }}
                placeholder="Add a competitor (e.g. EY-Parthenon)"
                maxLength={80}
                className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-border bg-background"
              />
              <button
                onClick={addCompetitor}
                disabled={!newCompetitor.trim() || tracked.length >= 12}
                className="text-xs px-3 py-1.5 rounded-lg text-white flex items-center gap-1.5 hover:opacity-90 transition-opacity disabled:opacity-60"
                style={{ background: GOLD }}
              >
                <Plus className="w-3 h-3" /> Add
              </button>
              <button
                onClick={resetCompetitors}
                className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                Reset to defaults
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading intelligence data…
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: 'Signals This Week',
            value: signals.length > 0 ? String(signals.length) : '—',
            sub:
              signals.length > 0
                ? `${signals.filter((s) => s.direction === 'threat').length} threats · ${signals.filter((s) => s.direction === 'opportunity').length} opportunities`
                : 'No signals loaded',
            color: 'text-foreground',
          },
          {
            label: 'High-Impact Events',
            value:
              signals.length > 0 ? String(signals.filter((s) => s.impact === 'high').length) : '—',
            sub:
              signals.filter((s) => s.impact === 'high').length > 0
                ? 'Require immediate attention'
                : 'No high-impact signals',
            color:
              signals.filter((s) => s.impact === 'high').length > 0
                ? 'text-red-600'
                : 'text-foreground',
          },
          {
            label: 'Tracked Competitors',
            value: competitors.length > 0 ? String(competitors.length) : '—',
            sub:
              competitors.length > 0
                ? `${competitors.filter((c) => c.trend === 'up').length} trending up`
                : 'No competitors tracked',
            color: 'text-foreground',
          },
          {
            label: 'Live News Signals',
            value: !loading ? String(liveSignalCount) : '—',
            sub: liveData
              ? `From ${tracked.length} tracked competitor${tracked.length === 1 ? '' : 's'}`
              : loading
                ? 'Loading…'
                : 'Live news unavailable — using curated intel',
            color: liveData ? 'text-emerald-600' : 'text-foreground',
          },
        ].map((stat, i) => (
          <Card key={i}>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p
                className={`text-2xl font-semibold mt-0.5 ${stat.color}`}
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                {stat.value}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {brief && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-l-4" style={{ borderLeftColor: GOLD }}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4" style={{ color: GOLD }} />
                  Weekly Intelligence Brief
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  AI Generated ·{' '}
                  {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p
                className="font-medium"
                style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem' }}
              >
                {brief.headline}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">{brief.summary}</p>
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                <p className="text-xs font-medium text-amber-800 mb-1">Market Shift</p>
                <p className="text-xs text-amber-700">{brief.marketShift}</p>
              </div>
              <div
                className="p-3 rounded-lg border"
                style={{
                  background: 'var(--color-gold-dim)',
                  borderColor: 'var(--color-gold-border)',
                }}
              >
                <p className="text-xs font-medium mb-1" style={{ color: GOLD }}>
                  Strategic Recommendation
                </p>
                <p className="text-xs text-muted-foreground">{brief.recommendation}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Competitive Signals Feed</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {signals.length === 0 ? (
                <div className="py-8 text-center">
                  <AlertCircle className="w-6 h-6 mx-auto mb-2 text-muted-foreground/40" />
                  <p className="text-xs text-muted-foreground">No competitive signals available.</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Connect intelligence feeds to populate live signals.
                  </p>
                </div>
              ) : (
                signals.map((signal, i) => (
                  <div key={i} className="border border-border rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedSignal(expandedSignal === i ? null : i)}
                      className="w-full text-left p-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-xs font-medium">{signal.competitor}</span>
                            <ImpactBadge impact={signal.impact} />
                            <DirectionBadge direction={signal.direction} />
                          </div>
                          <p className="text-xs text-foreground">{signal.event}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-muted-foreground">{signal.date}</span>
                          {expandedSignal === i ? (
                            <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </button>
                    {expandedSignal === i && (
                      <div className="px-3 pb-3 border-t border-border bg-muted/30 space-y-2">
                        <p className="text-xs text-muted-foreground pt-2 leading-relaxed">
                          {signal.detail}
                        </p>
                        {(signal.source || signal.url) && (
                          <div className="flex items-center justify-between gap-2 text-xs">
                            {signal.source ? (
                              <span className="text-muted-foreground">Source: {signal.source}</span>
                            ) : (
                              <span />
                            )}
                            {signal.url && signal.url !== '#' && (
                              <a
                                href={signal.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 hover:underline"
                                style={{ color: GOLD }}
                              >
                                Open article <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Competitive Index — 7-Month Trend</CardTitle>
            </CardHeader>
            <CardContent>
              {marketTrend.length === 0 ? (
                <div className="h-[200px] flex items-center justify-center">
                  <p className="text-xs text-muted-foreground">No trend data available</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={marketTrend}>
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} domain={[40, 80]} />
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line
                      type="monotone"
                      dataKey="you"
                      stroke={GOLD}
                      strokeWidth={2}
                      dot={false}
                      name="Your Position"
                    />
                    <Line
                      type="monotone"
                      dataKey="market"
                      stroke="var(--color-stone-400)"
                      strokeWidth={2}
                      dot={false}
                      name="Market Average"
                      strokeDasharray="4 2"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Competitor Ranking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {competitors.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  No competitor data available
                </p>
              ) : (
                competitors
                  .sort((a, b) => b.score - a.score)
                  .map((c, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-4 shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium truncate">{c.name}</span>
                          <div className="flex items-center gap-1 shrink-0">
                            <TrendIcon trend={c.trend} />
                            <span className="text-xs font-medium">{c.score}</span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${c.score}%`, background: GOLD, opacity: 0.7 }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {c.share}% est. market share
                        </p>
                      </div>
                    </div>
                  ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Monitoring Coverage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                'Press & news mentions',
                'Pricing changes',
                'Product launches',
                'Leadership moves',
                'Funding announcements',
                'Partnership activity',
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{item}</span>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs text-emerald-600">Live</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
