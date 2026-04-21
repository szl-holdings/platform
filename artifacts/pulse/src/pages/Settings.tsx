import { trackEvent } from '@szl-holdings/observability/react';
import {
  ArrowRight,
  Bell,
  Check,
  Clock,
  CreditCard,
  Globe,
  Loader,
  Mail,
  Pause,
  Play,
  Shield,
  X,
  Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type Toggle = { key: string; label: string; description: string; value: boolean };

type EmailSubscription = {
  id: number;
  email: string;
  domains: string[];
  status: 'active' | 'paused' | 'cancelled';
  unsubscribeUrl: string;
  lastSentAt: string | null;
  createdAt: string;
};

const SUBSCRIPTION_DOMAINS: Array<{ key: string; label: string }> = [
  { key: 'executive', label: 'Executive Synthesis' },
  { key: 'maritime', label: 'Maritime' },
  { key: 'security', label: 'Security & Threats' },
  { key: 'real_estate', label: 'Real Estate' },
  { key: 'legal', label: 'Legal & Compliance' },
  { key: 'financial', label: 'Financial & Portfolio' },
  { key: 'platform', label: 'Platform Health' },
];

const NS = 'pulse';

async function loadPulseSettings(): Promise<Record<string, unknown>> {
  const res = await fetch(`/api/settings/resolve?namespace=${NS}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) return {};
  const body = (await res.json()) as
    | { data?: { settings: Array<{ key: string; value: unknown }> } }
    | { settings: Array<{ key: string; value: unknown }> };
  const rows: Array<{ key: string; value: unknown }> =
    (body as { data?: { settings: Array<{ key: string; value: unknown }> } }).data?.settings ??
    (body as { settings: Array<{ key: string; value: unknown }> }).settings ??
    [];
  const out: Record<string, unknown> = {};
  for (const r of rows) {
    out[r.key] = r.value;
  }
  return out;
}

async function savePulseSetting(key: string, value: unknown, valueType: string): Promise<void> {
  const res = await fetch('/api/settings/user', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ namespace: NS, key, value, valueType }),
  });
  if (!res.ok) {
    let detail = '';
    try {
      const body = (await res.json()) as { error?: string };
      detail = body?.error ?? '';
    } catch {
      // ignore parse error
    }
    throw new Error(`Failed to save ${key}${detail ? `: ${detail}` : ` (HTTP ${res.status})`}`);
  }
  const body = (await res.json()) as { success?: boolean; error?: string };
  if (body && body.success === false) {
    throw new Error(body.error ?? `Setting ${key} was not saved`);
  }
}

const DEFAULT_TOGGLES: Toggle[] = [
  {
    key: 'daily_brief',
    label: 'Daily Brief Auto-Generation',
    description: 'Automatically generate the Morning Brief at 5:30 AM UTC every day',
    value: true,
  },
  {
    key: 'push_notify',
    label: 'Push Notification on Daily Drop',
    description: 'Receive a push notification when the daily brief is published (mobile)',
    value: true,
  },
  {
    key: 'dissent_alerts',
    label: 'Dissent Resolution Alerts',
    description: 'Get notified when your dissents are acknowledged or resolved',
    value: true,
  },
  {
    key: 'confidence_warnings',
    label: 'Low Confidence Warnings',
    description: 'Alert when any domain drops below 60% confidence',
    value: true,
  },
  {
    key: 'custom_brief_complete',
    label: 'Custom Brief Complete Alerts',
    description: 'Notify when a custom brief request has been synthesized',
    value: true,
  },
  {
    key: 'offline_cache',
    label: 'Offline Cache (Mobile)',
    description: 'Cache the latest brief for offline reading on mobile',
    value: true,
  },
];

export default function Settings() {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toggles, setToggles] = useState<Toggle[]>(DEFAULT_TOGGLES);
  const [briefTime, setBriefTime] = useState('05:30');
  const [notifCadence, setNotifCadence] = useState('daily');
  const [defaultDomain, setDefaultDomain] = useState('all');
  const [briefingTone, setBriefingTone] = useState('executive');
  const [timeZone, setTimeZone] = useState('UTC');
  const [classification, setClassification] = useState('SZL-EXEC-RESTRICTED');
  const [defaultView, setDefaultView] = useState('today');

  // Email subscription state
  const [subscriptions, setSubscriptions] = useState<EmailSubscription[]>([]);
  const [subEmail, setSubEmail] = useState('');
  const [subDomains, setSubDomains] = useState<string[]>([]);
  const [subBusy, setSubBusy] = useState(false);
  const [subMessage, setSubMessage] = useState<string | null>(null);
  const [subError, setSubError] = useState<string | null>(null);

  const initialised = useRef(false);

  const refreshSubscriptions = async () => {
    try {
      const res = await fetch('/api/pulse/subscriptions', { credentials: 'include' });
      if (!res.ok) return;
      const body = (await res.json()) as { subscriptions?: EmailSubscription[] };
      setSubscriptions(body.subscriptions ?? []);
    } catch {
      // ignore
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubBusy(true);
    setSubError(null);
    setSubMessage(null);
    try {
      const res = await fetch('/api/pulse/subscriptions', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: subEmail.trim(), domains: subDomains }),
      });
      const body = (await res.json()) as { success?: boolean; message?: string; error?: string };
      if (!res.ok || body.success === false) {
        setSubError(body.error ?? `Failed (HTTP ${res.status})`);
      } else {
        setSubMessage(body.message ?? 'Subscribed.');
        trackEvent('pulse_email_subscribed', { domain_count: subDomains.length });
        setSubEmail('');
        setSubDomains([]);
        await refreshSubscriptions();
      }
    } catch (err) {
      setSubError(err instanceof Error ? err.message : 'Subscription failed.');
    } finally {
      setSubBusy(false);
    }
  };

  const updateSubscriptionStatus = async (id: number, status: 'active' | 'paused') => {
    setSubBusy(true);
    setSubError(null);
    setSubMessage(null);
    try {
      const res = await fetch(`/api/pulse/subscriptions/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setSubError(body.error ?? `Failed (HTTP ${res.status})`);
      } else {
        setSubMessage(status === 'paused' ? 'Subscription paused.' : 'Subscription resumed.');
        trackEvent('pulse_email_subscription_status_changed', { status });
        await refreshSubscriptions();
      }
    } finally {
      setSubBusy(false);
    }
  };

  const cancelSubscription = async (id: number) => {
    setSubBusy(true);
    setSubError(null);
    setSubMessage(null);
    try {
      const res = await fetch(`/api/pulse/subscriptions/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setSubError(body.error ?? `Failed (HTTP ${res.status})`);
      } else {
        setSubMessage('Subscription cancelled.');
        trackEvent('pulse_email_subscription_cancelled', {});
        await refreshSubscriptions();
      }
    } finally {
      setSubBusy(false);
    }
  };

  useEffect(() => {
    if (initialised.current) return;
    initialised.current = true;

    loadPulseSettings()
      .then((prefs) => {
        if (typeof prefs.brief_time === 'string') setBriefTime(prefs.brief_time);
        if (typeof prefs.notif_cadence === 'string') setNotifCadence(prefs.notif_cadence);
        if (typeof prefs.default_domain === 'string') setDefaultDomain(prefs.default_domain);
        if (typeof prefs.briefing_tone === 'string') setBriefingTone(prefs.briefing_tone);
        if (typeof prefs.time_zone === 'string') setTimeZone(prefs.time_zone);
        if (typeof prefs.classification === 'string') setClassification(prefs.classification);
        if (typeof prefs.default_view === 'string') setDefaultView(prefs.default_view);
        setToggles((prev) =>
          prev.map((t) => {
            const stored = prefs[`notif_${t.key}`];
            return typeof stored === 'boolean' ? { ...t, value: stored } : t;
          }),
        );
      })
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : 'Failed to load settings');
      });
    void refreshSubscriptions();
  }, []);

  const handleToggle = (key: string) => {
    setToggles((prev) => prev.map((t) => (t.key === key ? { ...t, value: !t.value } : t)));
  };

  const handleSave = async () => {
    setSaving(true);
    setLoadError(null);
    try {
      const saves = [
        savePulseSetting('brief_time', briefTime, 'string'),
        savePulseSetting('notif_cadence', notifCadence, 'string'),
        savePulseSetting('default_domain', defaultDomain, 'string'),
        savePulseSetting('briefing_tone', briefingTone, 'string'),
        savePulseSetting('time_zone', timeZone, 'string'),
        savePulseSetting('classification', classification, 'string'),
        savePulseSetting('default_view', defaultView, 'string'),
        ...toggles.map((t) => savePulseSetting(`notif_${t.key}`, t.value, 'boolean')),
      ];
      const results = await Promise.allSettled(saves);
      const failures = results
        .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
        .map((r) => (r.reason instanceof Error ? r.reason.message : 'Unknown error'));
      if (failures.length > 0) {
        setLoadError(`Some settings failed to save: ${failures.join('; ')}`);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : 'Failed to save settings. Please try again.',
      );
    } finally {
      setSaving(false);
    }
  };

  const tzOptions = Intl.supportedValuesOf
    ? Intl.supportedValuesOf('timeZone')
    : [
        'UTC',
        'America/New_York',
        'America/Chicago',
        'America/Denver',
        'America/Los_Angeles',
        'Europe/London',
        'Europe/Paris',
        'Asia/Dubai',
        'Asia/Singapore',
        'Asia/Tokyo',
      ];

  return (
    <div style={{ padding: '28px 28px 40px', maxWidth: 700 }}>
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontSize: '1.4rem',
            fontWeight: 600,
            color: 'var(--pulse-text)',
            marginBottom: 6,
          }}
        >
          Settings
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--pulse-text-muted)' }}>
          Configure Pulse briefing preferences, notification settings, and classification defaults.
        </p>
        {loadError && (
          <div
            style={{
              marginTop: 8,
              padding: '8px 12px',
              borderRadius: 6,
              background: 'rgba(224,80,80,0.1)',
              border: '1px solid rgba(224,80,80,0.3)',
              fontSize: '0.78rem',
              color: '#e05050',
            }}
          >
            {loadError}
          </div>
        )}
      </div>

      {/* Brief generation */}
      <div className="section-card" style={{ padding: '18px 20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Clock size={15} color="var(--pulse-text-muted)" />
          <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--pulse-text)' }}>
            Brief Generation
          </h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.68rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--pulse-text-muted)',
                marginBottom: 6,
              }}
            >
              Daily Brief Time (UTC)
            </label>
            <input
              type="time"
              value={briefTime}
              onChange={(e) => setBriefTime(e.target.value)}
              style={{
                padding: '9px 12px',
                borderRadius: 6,
                background: 'var(--pulse-bg)',
                border: '1px solid var(--pulse-border)',
                color: 'var(--pulse-text)',
                fontSize: '0.88rem',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
          </div>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.68rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--pulse-text-muted)',
                marginBottom: 6,
              }}
            >
              Notification Cadence
            </label>
            <select
              value={notifCadence}
              onChange={(e) => setNotifCadence(e.target.value)}
              style={{
                padding: '9px 12px',
                borderRadius: 6,
                background: 'var(--pulse-bg)',
                border: '1px solid var(--pulse-border)',
                color: 'var(--pulse-text)',
                fontSize: '0.85rem',
                cursor: 'pointer',
                width: '100%',
              }}
            >
              <option value="daily">Once daily (5:30 AM UTC)</option>
              <option value="twice_daily">Twice daily (5:30 AM + 12:00 PM)</option>
              <option value="weekly">Weekly digest (Monday AM)</option>
              <option value="on_demand">On-demand only</option>
            </select>
          </div>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.68rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--pulse-text-muted)',
                marginBottom: 6,
              }}
            >
              Default View
            </label>
            <select
              value={defaultView}
              onChange={(e) => setDefaultView(e.target.value)}
              style={{
                padding: '9px 12px',
                borderRadius: 6,
                background: 'var(--pulse-bg)',
                border: '1px solid var(--pulse-border)',
                color: 'var(--pulse-text)',
                fontSize: '0.85rem',
                cursor: 'pointer',
                width: '100%',
              }}
            >
              <option value="today">Today's Brief</option>
              <option value="library">Briefing Library</option>
              <option value="confidence">Confidence Dashboard</option>
            </select>
          </div>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.68rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--pulse-text-muted)',
                marginBottom: 6,
              }}
            >
              Default Domain Focus
            </label>
            <select
              value={defaultDomain}
              onChange={(e) => setDefaultDomain(e.target.value)}
              style={{
                padding: '9px 12px',
                borderRadius: 6,
                background: 'var(--pulse-bg)',
                border: '1px solid var(--pulse-border)',
                color: 'var(--pulse-text)',
                fontSize: '0.85rem',
                cursor: 'pointer',
                width: '100%',
              }}
            >
              <option value="all">All Domains</option>
              <option value="maritime">Maritime</option>
              <option value="security">Security</option>
              <option value="real_estate">Real Estate</option>
              <option value="legal">Legal</option>
              <option value="financial">Financial</option>
              <option value="platform">Platform</option>
            </select>
          </div>
        </div>
      </div>

      {/* Briefing tone & locale */}
      <div className="section-card" style={{ padding: '18px 20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Globe size={15} color="var(--pulse-text-muted)" />
          <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--pulse-text)' }}>
            Briefing Style & Locale
          </h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.68rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--pulse-text-muted)',
                marginBottom: 6,
              }}
            >
              Briefing Tone
            </label>
            <select
              value={briefingTone}
              onChange={(e) => setBriefingTone(e.target.value)}
              style={{
                padding: '9px 12px',
                borderRadius: 6,
                background: 'var(--pulse-bg)',
                border: '1px solid var(--pulse-border)',
                color: 'var(--pulse-text)',
                fontSize: '0.85rem',
                cursor: 'pointer',
                width: '100%',
              }}
            >
              <option value="executive">Executive — concise, action-oriented</option>
              <option value="tactical">Tactical — operational detail, numbered steps</option>
              <option value="detailed">Detailed — full narrative with citations</option>
              <option value="diplomatic">Diplomatic — hedged, multi-perspective</option>
            </select>
          </div>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.68rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--pulse-text-muted)',
                marginBottom: 6,
              }}
            >
              Time Zone
            </label>
            <select
              value={timeZone}
              onChange={(e) => setTimeZone(e.target.value)}
              style={{
                padding: '9px 12px',
                borderRadius: 6,
                background: 'var(--pulse-bg)',
                border: '1px solid var(--pulse-border)',
                color: 'var(--pulse-text)',
                fontSize: '0.85rem',
                cursor: 'pointer',
                width: '100%',
              }}
            >
              {tzOptions.map((tz) => (
                <option key={tz} value={tz}>
                  {tz.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Classification */}
      <div className="section-card" style={{ padding: '18px 20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Shield size={15} color="var(--pulse-text-muted)" />
          <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--pulse-text)' }}>
            Classification & Access
          </h3>
        </div>
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.68rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--pulse-text-muted)',
              marginBottom: 6,
            }}
          >
            Default Classification Label
          </label>
          <select
            value={classification}
            onChange={(e) => setClassification(e.target.value)}
            style={{
              padding: '9px 12px',
              borderRadius: 6,
              background: 'var(--pulse-bg)',
              border: '1px solid var(--pulse-border)',
              color: 'var(--pulse-gold)',
              fontSize: '0.85rem',
              cursor: 'pointer',
              width: '100%',
            }}
          >
            <option value="SZL-EXEC-RESTRICTED">SZL-EXEC-RESTRICTED</option>
            <option value="SZL-BOARD-CONFIDENTIAL">SZL-BOARD-CONFIDENTIAL</option>
            <option value="SZL-INTERNAL">SZL-INTERNAL</option>
            <option value="SZL-UNRESTRICTED">SZL-UNRESTRICTED</option>
          </select>
        </div>
      </div>

      {/* Notifications & features */}
      <div className="section-card" style={{ padding: '18px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Bell size={15} color="var(--pulse-text-muted)" />
          <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--pulse-text)' }}>
            Notifications & Features
          </h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {toggles.map((toggle) => (
            <div
              key={toggle.key}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 16,
                padding: '10px 14px',
                borderRadius: 6,
                background: 'rgba(0,0,0,0.15)',
                border: '1px solid var(--pulse-border)',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    color: 'var(--pulse-text)',
                    marginBottom: 2,
                  }}
                >
                  {toggle.label}
                </div>
                <div
                  style={{ fontSize: '0.76rem', color: 'var(--pulse-text-muted)', lineHeight: 1.4 }}
                >
                  {toggle.description}
                </div>
              </div>
              <button
                onClick={() => handleToggle(toggle.key)}
                style={{
                  width: 40,
                  height: 22,
                  borderRadius: 11,
                  border: 'none',
                  cursor: 'pointer',
                  flexShrink: 0,
                  background: toggle.value ? 'rgba(200,168,75,0.3)' : 'rgba(255,255,255,0.06)',
                  position: 'relative',
                  transition: 'background 0.2s',
                }}
              >
                <div
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: toggle.value ? '#c8a84b' : '#546078',
                    position: 'absolute',
                    top: 3,
                    left: toggle.value ? 21 : 3,
                    transition: 'left 0.2s, background 0.2s',
                  }}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Email Briefing Subscription */}
      <div className="section-card" style={{ padding: '18px 20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <Mail size={15} color="var(--pulse-text-muted)" />
          <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--pulse-text)' }}>
            Daily Briefing Email
          </h3>
        </div>
        <p
          style={{
            fontSize: '0.78rem',
            color: 'var(--pulse-text-muted)',
            marginBottom: 14,
            lineHeight: 1.5,
          }}
        >
          Receive the formatted Pulse briefing in your inbox every morning at 5:30 AM UTC. Choose
          specific domains or leave empty to receive all sections.
        </p>

        {(subMessage || subError) && (
          <div
            style={{
              marginBottom: 12,
              padding: '8px 12px',
              borderRadius: 6,
              fontSize: '0.78rem',
              background: subError ? 'rgba(224,80,80,0.1)' : 'rgba(78,202,139,0.1)',
              border: `1px solid ${subError ? 'rgba(224,80,80,0.3)' : 'rgba(78,202,139,0.3)'}`,
              color: subError ? '#e05050' : '#4eca8b',
            }}
          >
            {subError ?? subMessage}
          </div>
        )}

        {subscriptions.filter((s) => s.status !== 'cancelled').length > 0 && (
          <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {subscriptions
              .filter((s) => s.status !== 'cancelled')
              .map((sub) => (
                <div
                  key={sub.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 6,
                    background: 'rgba(0,0,0,0.18)',
                    border: '1px solid var(--pulse-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <Mail
                        size={13}
                        color={
                          sub.status === 'active' ? 'var(--pulse-gold)' : 'var(--pulse-text-muted)'
                        }
                      />
                      <span
                        style={{
                          fontSize: '0.85rem',
                          fontWeight: 500,
                          color: 'var(--pulse-text)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {sub.email}
                      </span>
                      <span
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          padding: '2px 6px',
                          borderRadius: 4,
                          background:
                            sub.status === 'active'
                              ? 'rgba(78,202,139,0.12)'
                              : 'rgba(255,255,255,0.06)',
                          color: sub.status === 'active' ? '#4eca8b' : 'var(--pulse-text-muted)',
                        }}
                      >
                        {sub.status}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {sub.status === 'active' ? (
                        <button
                          onClick={() => updateSubscriptionStatus(sub.id, 'paused')}
                          disabled={subBusy}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '5px 10px',
                            borderRadius: 4,
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid var(--pulse-border)',
                            color: 'var(--pulse-text-muted)',
                            fontSize: '0.72rem',
                            cursor: subBusy ? 'not-allowed' : 'pointer',
                          }}
                        >
                          <Pause size={11} /> Pause
                        </button>
                      ) : (
                        <button
                          onClick={() => updateSubscriptionStatus(sub.id, 'active')}
                          disabled={subBusy}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '5px 10px',
                            borderRadius: 4,
                            background: 'rgba(78,202,139,0.1)',
                            border: '1px solid rgba(78,202,139,0.3)',
                            color: '#4eca8b',
                            fontSize: '0.72rem',
                            cursor: subBusy ? 'not-allowed' : 'pointer',
                          }}
                        >
                          <Play size={11} /> Resume
                        </button>
                      )}
                      <button
                        onClick={() => cancelSubscription(sub.id)}
                        disabled={subBusy}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '5px 10px',
                          borderRadius: 4,
                          background: 'rgba(224,80,80,0.08)',
                          border: '1px solid rgba(224,80,80,0.25)',
                          color: '#e05050',
                          fontSize: '0.72rem',
                          cursor: subBusy ? 'not-allowed' : 'pointer',
                        }}
                      >
                        <X size={11} /> Cancel
                      </button>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--pulse-text-muted)' }}>
                    {sub.domains.length === 0
                      ? 'All domains'
                      : `Domains: ${sub.domains.map((d) => SUBSCRIPTION_DOMAINS.find((x) => x.key === d)?.label ?? d).join(', ')}`}
                    {sub.lastSentAt && (
                      <span> · Last sent {new Date(sub.lastSentAt).toLocaleString()}</span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}

        <form
          onSubmit={handleSubscribe}
          style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
        >
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.68rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--pulse-text-muted)',
                marginBottom: 6,
              }}
            >
              Delivery email
            </label>
            <input
              type="email"
              value={subEmail}
              onChange={(e) => setSubEmail(e.target.value)}
              required
              placeholder="you@company.com"
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 6,
                background: 'var(--pulse-bg)',
                border: '1px solid var(--pulse-border)',
                color: 'var(--pulse-text)',
                fontSize: '0.88rem',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
          </div>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.68rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--pulse-text-muted)',
                marginBottom: 6,
              }}
            >
              Domains (optional — leave empty for all)
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {SUBSCRIPTION_DOMAINS.map((d) => {
                const selected = subDomains.includes(d.key);
                return (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() =>
                      setSubDomains((prev) =>
                        prev.includes(d.key) ? prev.filter((x) => x !== d.key) : [...prev, d.key],
                      )
                    }
                    style={{
                      padding: '5px 10px',
                      borderRadius: 14,
                      fontSize: '0.74rem',
                      cursor: 'pointer',
                      background: selected ? 'rgba(200,168,75,0.18)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${selected ? 'rgba(200,168,75,0.45)' : 'var(--pulse-border)'}`,
                      color: selected ? 'var(--pulse-gold)' : 'var(--pulse-text-muted)',
                    }}
                  >
                    {selected && (
                      <Check size={10} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                    )}
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>
          <button
            type="submit"
            disabled={subBusy || !subEmail.trim()}
            style={{
              alignSelf: 'flex-start',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 6,
              background: 'rgba(200,168,75,0.12)',
              border: '1px solid rgba(200,168,75,0.35)',
              color: 'var(--pulse-gold)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: subBusy || !subEmail.trim() ? 'not-allowed' : 'pointer',
              opacity: subBusy || !subEmail.trim() ? 0.6 : 1,
            }}
          >
            {subBusy ? (
              <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <Mail size={13} />
            )}
            Subscribe to Daily Briefing
          </button>
        </form>
      </div>

      {/* Alloy agents info */}
      <div className="section-card" style={{ padding: '18px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Zap size={15} color="var(--pulse-text-muted)" />
          <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--pulse-text)' }}>
            Alloy Agents
          </h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[
            { agent: 'FORGE', role: 'Orchestration & synthesis', domain: 'Executive' },
            { agent: 'Helmsman', role: 'Maritime intelligence', domain: 'Fleet' },
            { agent: 'Sentinel', role: 'Security & threats', domain: 'PARAGON' },
            { agent: 'DOMAINE', role: 'Real estate analytics', domain: 'Property' },
            { agent: 'Lexis', role: 'Legal & compliance', domain: 'Counsel' },
            { agent: 'Atlas', role: 'Financial & portfolio', domain: 'Holdings' },
            { agent: 'KORA', role: 'Platform health', domain: 'Operations' },
          ].map((a) => (
            <div
              key={a.agent}
              style={{
                padding: '8px 12px',
                borderRadius: 6,
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid var(--pulse-border)',
              }}
            >
              <div
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: 'var(--pulse-text)',
                  marginBottom: 2,
                }}
              >
                {a.agent}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--pulse-text-muted)' }}>{a.role}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Subscription & Billing */}
      <div className="section-card" style={{ padding: '18px 20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <CreditCard size={15} color="var(--pulse-text-muted)" />
          <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--pulse-text)' }}>
            Subscription & Billing
          </h3>
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--pulse-text-muted)', marginBottom: 14 }}>
          Pulse is included in your SZL Holdings Executive plan. Upgrade for additional briefing
          capacity, custom domains, and dedicated support.
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={async () => {
              trackEvent('upgrade_clicked', {
                product: 'pulse',
                source: 'settings',
                plan: 'pulse-executive-annual',
              });
              const origin = window.location.origin;
              const res = await fetch(`${import.meta.env.BASE_URL}api/billing/checkout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                  priceId:
                    import.meta.env.VITE_STRIPE_PRICE_PULSE_EXECUTIVE ?? 'price_pulse_executive',
                  mode: 'subscription',
                  successUrl: `${origin}/pulse/settings?checkout=success`,
                  cancelUrl: `${origin}/pulse/settings`,
                }),
              });
              const data = await res.json();
              const url = data?.data?.url ?? data?.url;
              if (url) window.location.href = url;
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 6,
              background: 'rgba(200,168,75,0.12)',
              border: '1px solid rgba(200,168,75,0.35)',
              color: 'var(--pulse-gold)',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Zap size={13} /> Upgrade Plan <ArrowRight size={11} />
          </button>
          <button
            onClick={async () => {
              trackEvent('billing_portal_opened', { product: 'pulse', source: 'settings' });
              const origin = window.location.origin;
              const res = await fetch(`${import.meta.env.BASE_URL}api/billing/portal-session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ returnUrl: `${origin}/pulse/settings` }),
              });
              const data = await res.json();
              const url = data?.data?.url ?? data?.url;
              if (url) window.location.href = url;
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 6,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--pulse-text-muted)',
              fontSize: '0.78rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <CreditCard size={13} /> Manage Billing
          </button>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          padding: '10px 20px',
          borderRadius: 6,
          background: saved ? 'rgba(78,202,139,0.1)' : 'rgba(200,168,75,0.12)',
          border: `1px solid ${saved ? 'rgba(78,202,139,0.35)' : 'rgba(200,168,75,0.35)'}`,
          color: saved ? '#4eca8b' : 'var(--pulse-gold)',
          fontSize: '0.85rem',
          fontWeight: 600,
          cursor: saving ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
          opacity: saving ? 0.7 : 1,
        }}
      >
        {saving ? (
          <Loader size={15} style={{ animation: 'spin 1s linear infinite' }} />
        ) : saved ? (
          <Check size={15} />
        ) : (
          <Zap size={15} />
        )}
        {saving ? 'Saving…' : saved ? 'Saved' : 'Save Settings'}
      </button>
    </div>
  );
}
