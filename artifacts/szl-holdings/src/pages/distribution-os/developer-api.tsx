import { AnimatePresence, m } from 'framer-motion';
import {
  Activity,
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Code2,
  Copy,
  Eye,
  EyeOff,
  FileCode,
  Globe,
  Key,
  Loader2,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  Webhook,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { DistributionOsLayout } from './admin-dashboard';

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') ?? '';

const API = import.meta.env.VITE_API_URL || '';

function getCsrfToken(): string {
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}
function jsonHeaders(): Record<string, string> {
  return { 'Content-Type': 'application/json', 'x-csrf-token': getCsrfToken() };
}

const BASE_URL = 'https://szlholdings.com';
const API_BASE = `${BASE_URL}/api/v1`;

interface ApiKey {
  id: string;
  name: string;
  key: string;
  maskedKey: string;
  created: string;
  lastUsed: string | null;
  requests: number;
  rateLimit: number;
  scopes: string[];
  active: boolean;
}

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
  deliveries: number;
  failures: number;
  lastTriggered: string | null;
}

interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: string;
  statusCode: number;
  timestamp: string;
  duration: number;
}

const RECENT_DELIVERIES: WebhookDelivery[] = [
  {
    id: '1',
    webhookId: '1',
    event: 'new_subscriber',
    statusCode: 200,
    timestamp: '2025-04-14T11:45:00Z',
    duration: 124,
  },
  {
    id: '2',
    webhookId: '2',
    event: 'publish_complete',
    statusCode: 200,
    timestamp: '2025-04-14T09:15:00Z',
    duration: 89,
  },
  {
    id: '3',
    webhookId: '1',
    event: 'engagement_milestone',
    statusCode: 500,
    timestamp: '2025-04-13T16:30:00Z',
    duration: 5002,
  },
  {
    id: '4',
    webhookId: '1',
    event: 'new_subscriber',
    statusCode: 200,
    timestamp: '2025-04-13T14:10:00Z',
    duration: 95,
  },
];

const WEBHOOK_EVENTS = [
  { id: 'new_post', label: 'new_post', desc: 'Published to any platform' },
  { id: 'new_subscriber', label: 'new_subscriber', desc: 'New email subscriber captured' },
  {
    id: 'engagement_milestone',
    label: 'engagement_milestone',
    desc: 'Content hits 100/500/1K+ views',
  },
  { id: 'publish_complete', label: 'publish_complete', desc: 'All platforms in atomize job done' },
  { id: 'lead_captured', label: 'lead_captured', desc: 'New lead form submission' },
  { id: 'api_rate_limit', label: 'api_rate_limit', desc: 'Rate limit threshold reached' },
];

const SCOPES = [
  { id: 'content:read', label: 'content:read', desc: 'Read articles, newsletters, posts' },
  { id: 'content:write', label: 'content:write', desc: 'Create and update content' },
  { id: 'content:publish', label: 'content:publish', desc: 'Trigger publishing to platforms' },
  { id: 'subscribers:read', label: 'subscribers:read', desc: 'Read subscriber list and segments' },
  { id: 'subscribers:write', label: 'subscribers:write', desc: 'Add/update/remove subscribers' },
  { id: 'analytics:read', label: 'analytics:read', desc: 'Read cross-platform analytics' },
  { id: 'webhooks:read', label: 'webhooks:read', desc: 'Read webhook config and logs' },
  { id: 'webhooks:write', label: 'webhooks:write', desc: 'Create and manage webhooks' },
];

const API_ENDPOINTS = [
  {
    method: 'GET',
    path: '/content',
    desc: 'List published content (articles, posts, newsletters)',
    params: '?type=article&limit=20&offset=0',
    response: `{ "data": [{ "id": 1, "title": "...", "slug": "...", "type": "article", "publishedAt": "..." }], "total": 48 }`,
  },
  {
    method: 'POST',
    path: '/content/publish',
    desc: 'Submit content for publishing via API',
    params: '',
    response: `{ "jobId": "pub_abc123", "status": "queued", "platforms": ["x", "linkedin", "medium"] }`,
  },
  {
    method: 'GET',
    path: '/subscribers',
    desc: 'List subscribers with segment filtering',
    params: '?segment=engaged&source=embed',
    response: `{ "data": [{ "id": 1, "email": "...", "source": "embed", "segment": "engaged" }], "total": 342 }`,
  },
  {
    method: 'POST',
    path: '/subscribers',
    desc: 'Add a new subscriber programmatically',
    params: '',
    response: `{ "id": 5, "email": "new@example.com", "magicLinkSent": true }`,
  },
  {
    method: 'GET',
    path: '/analytics/summary',
    desc: 'Cross-platform engagement summary',
    params: '?period=7d',
    response: `{ "totalViews": 4820, "totalEngagements": 312, "topContent": { "slug": "..." }, "platforms": {...} }`,
  },
  {
    method: 'POST',
    path: '/webhooks/test',
    desc: 'Send a test event to a webhook',
    params: '',
    response: `{ "delivered": true, "statusCode": 200, "duration": 134 }`,
  },
];

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem',
        padding: '0.3rem 0.5rem',
        background: copied ? 'hsla(120,30%,40%,0.08)' : 'none',
        border: `1px solid ${copied ? 'hsla(120,30%,40%,0.2)' : 'hsla(0,0%,100%,0.08)'}`,
        borderRadius: '5px',
        color: copied ? '#5a9c5a' : '#4a4540',
        cursor: 'pointer',
        fontSize: '0.6875rem',
      }}
    >
      {copied ? <Check size={11} /> : <Copy size={11} />} {copied ? 'Copied!' : label}
    </button>
  );
}

function EndpointRow({
  endpoint,
  apiKey,
}: {
  endpoint: (typeof API_ENDPOINTS)[number];
  apiKey: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const methodColor: Record<string, string> = {
    GET: '#5a9c5a',
    POST: '#d4a054',
    PATCH: '#4a90b8',
    DELETE: '#c45a4a',
  };
  const exampleCurl = `curl -X ${endpoint.method} \\
  "${BASE}${endpoint.path}${endpoint.params}" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json"`;

  return (
    <div
      style={{ border: '1px solid hsla(0,0%,100%,0.06)', borderRadius: '8px', overflow: 'hidden' }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.875rem 1rem',
          cursor: 'pointer',
        }}
        onClick={() => setExpanded((p) => !p)}
      >
        <span
          style={{
            fontSize: '0.6875rem',
            fontWeight: 800,
            padding: '0.2rem 0.5rem',
            borderRadius: '4px',
            background: `${methodColor[endpoint.method]}15`,
            color: methodColor[endpoint.method],
            minWidth: 44,
            textAlign: 'center',
            flexShrink: 0,
          }}
        >
          {endpoint.method}
        </span>
        <code style={{ fontSize: '0.8125rem', color: '#c8c2ba', fontFamily: 'monospace', flex: 1 }}>
          {endpoint.path}
        </code>
        <span style={{ fontSize: '0.75rem', color: '#4a4540', flex: 1 }}>{endpoint.desc}</span>
        {expanded ? (
          <ChevronUp size={14} style={{ color: '#4a4540', flexShrink: 0 }} />
        ) : (
          <ChevronDown size={14} style={{ color: '#4a4540', flexShrink: 0 }} />
        )}
      </div>
      <AnimatePresence>
        {expanded && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 1rem 1rem', borderTop: '1px solid hsla(0,0%,100%,0.04)' }}>
              <div
                style={{
                  paddingTop: '0.875rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.875rem',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '0.625rem',
                      fontWeight: 700,
                      color: '#4a4540',
                      textTransform: 'uppercase',
                      marginBottom: '0.375rem',
                    }}
                  >
                    cURL Example
                  </div>
                  <div
                    style={{
                      position: 'relative',
                      background: 'hsla(0,0%,100%,0.03)',
                      border: '1px solid hsla(0,0%,100%,0.06)',
                      borderRadius: '6px',
                    }}
                  >
                    <pre
                      style={{
                        padding: '0.75rem',
                        margin: 0,
                        fontSize: '0.6875rem',
                        color: '#c8c2ba',
                        overflowX: 'auto',
                        fontFamily: 'monospace',
                        lineHeight: 1.55,
                      }}
                    >
                      {exampleCurl}
                    </pre>
                    <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem' }}>
                      <CopyButton text={exampleCurl} />
                    </div>
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: '0.625rem',
                      fontWeight: 700,
                      color: '#4a4540',
                      textTransform: 'uppercase',
                      marginBottom: '0.375rem',
                    }}
                  >
                    Response Example
                  </div>
                  <pre
                    style={{
                      padding: '0.75rem',
                      background: 'hsla(0,0%,100%,0.02)',
                      border: '1px solid hsla(0,0%,100%,0.05)',
                      borderRadius: '6px',
                      margin: 0,
                      fontSize: '0.6875rem',
                      color: '#8b8579',
                      overflowX: 'auto',
                      fontFamily: 'monospace',
                      lineHeight: 1.55,
                    }}
                  >
                    {endpoint.response}
                  </pre>
                </div>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function DeveloperApiPage() {
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState<'keys' | 'docs' | 'webhooks' | 'logs'>('keys');
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewKey, setShowNewKey] = useState(false);
  const [showNewWebhook, setShowNewWebhook] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>(['content:read']);
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
  const [newWebhookForm, setNewWebhookForm] = useState({
    name: '',
    url: '',
    events: [] as string[],
  });
  const [creatingKey, setCreatingKey] = useState(false);
  const [newKeyCreated, setNewKeyCreated] = useState<string | null>(null);
  const [creatingWebhook, setCreatingWebhook] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [keysRes, webhooksRes] = await Promise.all([
          fetch(`${API}/api/distribution-os/api-keys`, { credentials: 'include' }),
          fetch(`${API}/api/distribution-os/webhook-subscriptions`, { credentials: 'include' }),
        ]);
        if (keysRes.ok) {
          const data = await keysRes.json();
          setApiKeys(
            data.map((k: any) => ({
              id: String(k.id),
              name: k.name,
              key: '',
              maskedKey: k.maskedKey,
              created: k.createdAt
                ? new Date(Number(k.createdAt)).toISOString().split('T')[0]
                : '—',
              lastUsed: null,
              requests: 0,
              rateLimit: 1000,
              scopes: k.scopes || [],
              active: k.active,
            })),
          );
        }
        if (webhooksRes.ok) {
          const data = await webhooksRes.json();
          setWebhooks(
            data.map((w: any) => ({
              id: String(w.id),
              name: w.name,
              url: w.url,
              events: w.events || [],
              secret: '••••••••••••••••',
              active: w.active ?? true,
              deliveries: w.deliveries || 0,
              failures: w.failures || 0,
              lastTriggered: null,
            })),
          );
        }
      } catch (e) {
        console.error('Failed to load API data', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function createKey() {
    if (!newKeyName) return;
    setCreatingKey(true);
    try {
      const res = await fetch(`${API}/api/distribution-os/api-keys`, {
        method: 'POST',
        credentials: 'include',
        headers: jsonHeaders(),
        body: JSON.stringify({ name: newKeyName, scopes: newKeyScopes }),
      });
      if (!res.ok) throw new Error('Failed to create key');
      const created = await res.json();
      setApiKeys((prev) => [
        ...prev,
        {
          id: String(created.id),
          name: created.name,
          key: created.key,
          maskedKey: created.maskedKey,
          created: new Date().toISOString().split('T')[0],
          lastUsed: null,
          requests: 0,
          rateLimit: 1000,
          scopes: created.scopes,
          active: true,
        },
      ]);
      setNewKeyCreated(created.key);
      setShowNewKey(false);
      setNewKeyName('');
    } catch (e) {
      console.error(e);
    } finally {
      setCreatingKey(false);
    }
  }

  async function deleteKey(id: string) {
    try {
      await fetch(`${API}/api/distribution-os/api-keys/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: jsonHeaders(),
      });
      setApiKeys((prev) => prev.filter((k) => k.id !== id));
    } catch (e) {
      console.error(e);
    }
  }

  async function createWebhook() {
    if (!newWebhookForm.url || !newWebhookForm.events.length) return;
    setCreatingWebhook(true);
    try {
      const res = await fetch(`${API}/api/distribution-os/webhook-subscriptions`, {
        method: 'POST',
        credentials: 'include',
        headers: jsonHeaders(),
        body: JSON.stringify(newWebhookForm),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed');
      }
      const created = await res.json();
      setWebhooks((prev) => [
        ...prev,
        {
          id: String(created.id),
          name: created.name,
          url: created.url,
          events: created.events,
          secret: created.secret,
          active: true,
          deliveries: 0,
          failures: 0,
          lastTriggered: null,
        },
      ]);
      setNewWebhookForm({ name: '', url: '', events: [] });
      setShowNewWebhook(false);
    } catch (e) {
      console.error(e);
    } finally {
      setCreatingWebhook(false);
    }
  }

  async function deleteWebhook(id: string) {
    try {
      await fetch(`${API}/api/distribution-os/webhook-subscriptions/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: jsonHeaders(),
      });
      setWebhooks((prev) => prev.filter((w) => w.id !== id));
    } catch (e) {
      console.error(e);
    }
  }

  function toggleScope(scope: string) {
    setNewKeyScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope],
    );
  }

  function toggleWebhookEvent(event: string) {
    setNewWebhookForm((prev) => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter((e) => e !== event)
        : [...prev.events, event],
    }));
  }

  const TABS = [
    { key: 'keys' as const, label: 'API Keys', icon: Key },
    { key: 'docs' as const, label: 'API Reference', icon: FileCode },
    { key: 'webhooks' as const, label: 'Webhooks', icon: Webhook as typeof Key },
    { key: 'logs' as const, label: 'Delivery Logs', icon: Activity },
  ];

  const activeKeyForDocs = apiKeys[0]?.maskedKey || 'szl_live_sk_your_key_here';

  return (
    <DistributionOsLayout currentPath={location}>
      <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: '2rem',
          }}
        >
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#e8e4de' }}>Developer API</h1>
            <p style={{ fontSize: '0.8125rem', color: '#6b6560', marginTop: '0.25rem' }}>
              Public REST API · Webhooks · Rate limits · Interactive documentation
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.6875rem' }}>
            <div
              style={{
                padding: '0.375rem 0.75rem',
                background: 'hsla(120,30%,40%,0.1)',
                border: '1px solid hsla(120,30%,40%,0.2)',
                borderRadius: '6px',
                color: '#5a9c5a',
                fontWeight: 600,
              }}
            >
              API v1 · Live
            </div>
            <div
              style={{
                padding: '0.375rem 0.75rem',
                background: 'hsla(0,0%,100%,0.04)',
                border: '1px solid hsla(0,0%,100%,0.08)',
                borderRadius: '6px',
                color: '#6b6560',
              }}
            >
              Base: {API_BASE}
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '0.25rem',
            marginBottom: '1.75rem',
            borderBottom: '1px solid hsla(0,0%,100%,0.06)',
            paddingBottom: '0',
          }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.625rem 1.25rem',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.key ? '2px solid #d4a054' : '2px solid transparent',
                color: activeTab === tab.key ? '#e8e4de' : '#6b6560',
                fontSize: '0.875rem',
                fontWeight: activeTab === tab.key ? 600 : 400,
                cursor: 'pointer',
                marginBottom: '-1px',
              }}
            >
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'keys' && (
          <div>
            {newKeyCreated && (
              <m.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  padding: '1rem 1.25rem',
                  background: 'hsla(120,30%,40%,0.08)',
                  border: '1px solid hsla(120,30%,40%,0.25)',
                  borderRadius: '10px',
                  marginBottom: '1.25rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.5rem',
                  }}
                >
                  <CheckCircle2 size={14} style={{ color: '#5a9c5a' }} />
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#5a9c5a' }}>
                    API key created — save it now
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <code
                    style={{
                      flex: 1,
                      fontSize: '0.8125rem',
                      color: '#e8e4de',
                      fontFamily: 'monospace',
                      wordBreak: 'break-all',
                    }}
                  >
                    {newKeyCreated}
                  </code>
                  <CopyButton text={newKeyCreated} label="Copy Key" />
                </div>
                <p style={{ fontSize: '0.6875rem', color: '#c45a4a', marginTop: '0.5rem' }}>
                  This key will not be shown again. Store it securely.
                </p>
              </m.div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
              <button
                onClick={() => setShowNewKey(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1.25rem',
                  background: 'linear-gradient(135deg, #d4a054, #c8953c)',
                  color: '#070a10',
                  border: 'none',
                  borderRadius: '7px',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                }}
              >
                <Plus size={14} /> Create API Key
              </button>
            </div>

            <AnimatePresence>
              {showNewKey && (
                <m.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: 'hidden', marginBottom: '1.25rem' }}
                >
                  <div
                    style={{
                      padding: '1.25rem',
                      background: 'hsla(0,0%,100%,0.03)',
                      border: '1px solid hsla(40,60%,50%,0.2)',
                      borderRadius: '10px',
                    }}
                  >
                    <h3
                      style={{
                        fontSize: '0.9375rem',
                        fontWeight: 700,
                        color: '#e8e4de',
                        marginBottom: '1rem',
                      }}
                    >
                      New API Key
                    </h3>
                    <div style={{ marginBottom: '0.875rem' }}>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          color: '#6b6560',
                          textTransform: 'uppercase',
                          marginBottom: '0.375rem',
                        }}
                      >
                        Key Name
                      </label>
                      <input
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        placeholder="e.g. Zapier Integration"
                        style={{
                          width: '100%',
                          padding: '0.5rem 0.75rem',
                          background: 'hsla(0,0%,100%,0.04)',
                          border: '1px solid hsla(0,0%,100%,0.1)',
                          borderRadius: '6px',
                          color: '#e8e4de',
                          fontSize: '0.875rem',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          color: '#6b6560',
                          textTransform: 'uppercase',
                          marginBottom: '0.5rem',
                        }}
                      >
                        Scopes
                      </label>
                      <div
                        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.375rem' }}
                      >
                        {SCOPES.map((scope) => (
                          <label
                            key={scope.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              padding: '0.5rem 0.625rem',
                              background: newKeyScopes.includes(scope.id)
                                ? 'hsla(40,60%,50%,0.08)'
                                : 'hsla(0,0%,100%,0.02)',
                              border: `1px solid ${newKeyScopes.includes(scope.id) ? 'hsla(40,60%,50%,0.2)' : 'hsla(0,0%,100%,0.06)'}`,
                              borderRadius: '6px',
                              cursor: 'pointer',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={newKeyScopes.includes(scope.id)}
                              onChange={() => toggleScope(scope.id)}
                              style={{ accentColor: '#d4a054' }}
                            />
                            <div>
                              <code
                                style={{
                                  fontSize: '0.6875rem',
                                  color: newKeyScopes.includes(scope.id) ? '#d4a054' : '#8b8579',
                                }}
                              >
                                {scope.label}
                              </code>
                              <div style={{ fontSize: '0.5625rem', color: '#4a4540' }}>
                                {scope.desc}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={createKey}
                        disabled={!newKeyName || creatingKey}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          padding: '0.5rem 1.25rem',
                          background: '#d4a054',
                          border: 'none',
                          borderRadius: '6px',
                          color: '#070a10',
                          fontWeight: 700,
                          fontSize: '0.8125rem',
                          cursor: 'pointer',
                          opacity: creatingKey ? 0.7 : 1,
                        }}
                      >
                        {creatingKey ? (
                          <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                        ) : (
                          <Key size={13} />
                        )}
                        Generate Key
                      </button>
                      <button
                        onClick={() => setShowNewKey(false)}
                        style={{
                          padding: '0.5rem 1rem',
                          background: 'none',
                          border: '1px solid hsla(0,0%,100%,0.08)',
                          borderRadius: '6px',
                          color: '#6b6560',
                          fontSize: '0.8125rem',
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </m.div>
              )}
            </AnimatePresence>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  style={{
                    padding: '1.25rem',
                    background: 'hsla(0,0%,100%,0.02)',
                    border: '1px solid hsla(0,0%,100%,0.06)',
                    borderRadius: '10px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      marginBottom: '0.75rem',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#e8e4de' }}>
                        {key.name}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          marginTop: '0.25rem',
                        }}
                      >
                        <code
                          style={{ fontSize: '0.75rem', color: '#6b6560', fontFamily: 'monospace' }}
                        >
                          {revealedKeys.has(key.id) ? key.key : key.maskedKey}
                        </code>
                        <button
                          onClick={() =>
                            setRevealedKeys((prev) => {
                              const s = new Set(prev);
                              s.has(key.id) ? s.delete(key.id) : s.add(key.id);
                              return s;
                            })
                          }
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#4a4540',
                            cursor: 'pointer',
                            padding: 0,
                          }}
                        >
                          {revealedKeys.has(key.id) ? <EyeOff size={12} /> : <Eye size={12} />}
                        </button>
                        <CopyButton text={revealedKeys.has(key.id) ? key.key : key.maskedKey} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: key.active ? '#5a9c5a' : '#4a4540',
                        }}
                      />
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          color: key.active ? '#5a9c5a' : '#4a4540',
                          fontWeight: 600,
                        }}
                      >
                        {key.active ? 'Active' : 'Disabled'}
                      </span>
                      <button
                        onClick={() => deleteKey(key.id)}
                        title="Revoke key"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#c45a4a',
                          cursor: 'pointer',
                          padding: '0.125rem',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: '1.5rem',
                      marginBottom: '0.75rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: '0.5625rem',
                          color: '#4a4540',
                          textTransform: 'uppercase',
                          fontWeight: 600,
                          marginBottom: '0.125rem',
                        }}
                      >
                        Requests
                      </div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#e8e4de' }}>
                        {key.requests.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: '0.5625rem',
                          color: '#4a4540',
                          textTransform: 'uppercase',
                          fontWeight: 600,
                          marginBottom: '0.125rem',
                        }}
                      >
                        Rate Limit
                      </div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#e8e4de' }}>
                        {key.rateLimit}/hr
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: '0.5625rem',
                          color: '#4a4540',
                          textTransform: 'uppercase',
                          fontWeight: 600,
                          marginBottom: '0.125rem',
                        }}
                      >
                        Last Used
                      </div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#e8e4de' }}>
                        {key.lastUsed ? new Date(key.lastUsed).toLocaleDateString() : 'Never'}
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: '0.5625rem',
                          color: '#4a4540',
                          textTransform: 'uppercase',
                          fontWeight: 600,
                          marginBottom: '0.125rem',
                        }}
                      >
                        Created
                      </div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#e8e4de' }}>
                        {key.created}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                    {key.scopes.map((scope) => (
                      <span
                        key={scope}
                        style={{
                          fontSize: '0.5625rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          background: 'hsla(0,0%,100%,0.05)',
                          color: '#6b6560',
                          fontFamily: 'monospace',
                        }}
                      >
                        {scope}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'docs' && (
          <div>
            <div
              style={{
                padding: '1rem 1.25rem',
                background: 'hsla(0,0%,100%,0.02)',
                border: '1px solid hsla(0,0%,100%,0.06)',
                borderRadius: '10px',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <div
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      color: '#4a4540',
                      textTransform: 'uppercase',
                      marginBottom: '0.375rem',
                    }}
                  >
                    Base URL
                  </div>
                  <code
                    style={{ fontSize: '0.8125rem', color: '#d4a054', fontFamily: 'monospace' }}
                  >
                    {API_BASE}
                  </code>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      color: '#4a4540',
                      textTransform: 'uppercase',
                      marginBottom: '0.375rem',
                    }}
                  >
                    Authentication
                  </div>
                  <code
                    style={{ fontSize: '0.8125rem', color: '#c8c2ba', fontFamily: 'monospace' }}
                  >
                    Authorization: Bearer &lt;key&gt;
                  </code>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      color: '#4a4540',
                      textTransform: 'uppercase',
                      marginBottom: '0.375rem',
                    }}
                  >
                    Rate Limit
                  </div>
                  <code
                    style={{ fontSize: '0.8125rem', color: '#c8c2ba', fontFamily: 'monospace' }}
                  >
                    X-RateLimit-Remaining: 950
                  </code>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {API_ENDPOINTS.map((ep) => (
                <EndpointRow key={ep.path + ep.method} endpoint={ep} apiKey={activeKeyForDocs} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'webhooks' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
              <button
                onClick={() => setShowNewWebhook(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1.25rem',
                  background: 'linear-gradient(135deg, #d4a054, #c8953c)',
                  color: '#070a10',
                  border: 'none',
                  borderRadius: '7px',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                }}
              >
                <Plus size={14} /> Add Webhook
              </button>
            </div>

            <AnimatePresence>
              {showNewWebhook && (
                <m.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: 'hidden', marginBottom: '1.25rem' }}
                >
                  <div
                    style={{
                      padding: '1.25rem',
                      background: 'hsla(0,0%,100%,0.03)',
                      border: '1px solid hsla(40,60%,50%,0.2)',
                      borderRadius: '10px',
                    }}
                  >
                    <h3
                      style={{
                        fontSize: '0.9375rem',
                        fontWeight: 700,
                        color: '#e8e4de',
                        marginBottom: '1rem',
                      }}
                    >
                      New Webhook
                    </h3>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '0.75rem',
                        marginBottom: '0.875rem',
                      }}
                    >
                      <div>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            color: '#6b6560',
                            textTransform: 'uppercase',
                            marginBottom: '0.375rem',
                          }}
                        >
                          Webhook Name
                        </label>
                        <input
                          value={newWebhookForm.name}
                          onChange={(e) =>
                            setNewWebhookForm((p) => ({ ...p, name: e.target.value }))
                          }
                          placeholder="e.g. Slack Notifications"
                          style={{
                            width: '100%',
                            padding: '0.5rem 0.75rem',
                            background: 'hsla(0,0%,100%,0.04)',
                            border: '1px solid hsla(0,0%,100%,0.1)',
                            borderRadius: '6px',
                            color: '#e8e4de',
                            fontSize: '0.875rem',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                      <div>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            color: '#6b6560',
                            textTransform: 'uppercase',
                            marginBottom: '0.375rem',
                          }}
                        >
                          Target URL
                        </label>
                        <input
                          value={newWebhookForm.url}
                          onChange={(e) =>
                            setNewWebhookForm((p) => ({ ...p, url: e.target.value }))
                          }
                          placeholder="https://hooks.example.com/..."
                          style={{
                            width: '100%',
                            padding: '0.5rem 0.75rem',
                            background: 'hsla(0,0%,100%,0.04)',
                            border: '1px solid hsla(0,0%,100%,0.1)',
                            borderRadius: '6px',
                            color: '#e8e4de',
                            fontSize: '0.875rem',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          color: '#6b6560',
                          textTransform: 'uppercase',
                          marginBottom: '0.5rem',
                        }}
                      >
                        Events to Subscribe
                      </label>
                      <div
                        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.375rem' }}
                      >
                        {WEBHOOK_EVENTS.map((evt) => (
                          <label
                            key={evt.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              padding: '0.5rem 0.625rem',
                              background: newWebhookForm.events.includes(evt.id)
                                ? 'hsla(40,60%,50%,0.08)'
                                : 'hsla(0,0%,100%,0.02)',
                              border: `1px solid ${newWebhookForm.events.includes(evt.id) ? 'hsla(40,60%,50%,0.2)' : 'hsla(0,0%,100%,0.06)'}`,
                              borderRadius: '6px',
                              cursor: 'pointer',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={newWebhookForm.events.includes(evt.id)}
                              onChange={() => toggleWebhookEvent(evt.id)}
                              style={{ accentColor: '#d4a054' }}
                            />
                            <div>
                              <code
                                style={{
                                  fontSize: '0.6875rem',
                                  color: newWebhookForm.events.includes(evt.id)
                                    ? '#d4a054'
                                    : '#6b6560',
                                }}
                              >
                                {evt.label}
                              </code>
                              <div style={{ fontSize: '0.5625rem', color: '#4a4540' }}>
                                {evt.desc}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={createWebhook}
                        disabled={
                          !newWebhookForm.url || !newWebhookForm.events.length || creatingWebhook
                        }
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          padding: '0.5rem 1.25rem',
                          background: '#d4a054',
                          border: 'none',
                          borderRadius: '6px',
                          color: '#070a10',
                          fontWeight: 700,
                          fontSize: '0.8125rem',
                          cursor: 'pointer',
                          opacity: creatingWebhook ? 0.7 : 1,
                        }}
                      >
                        {creatingWebhook ? (
                          <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                        ) : null}
                        Create Webhook
                      </button>
                      <button
                        onClick={() => setShowNewWebhook(false)}
                        style={{
                          padding: '0.5rem 1rem',
                          background: 'none',
                          border: '1px solid hsla(0,0%,100%,0.08)',
                          borderRadius: '6px',
                          color: '#6b6560',
                          fontSize: '0.8125rem',
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </m.div>
              )}
            </AnimatePresence>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {webhooks.map((wh) => (
                <div
                  key={wh.id}
                  style={{
                    padding: '1.25rem',
                    background: 'hsla(0,0%,100%,0.02)',
                    border: '1px solid hsla(0,0%,100%,0.06)',
                    borderRadius: '10px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      marginBottom: '0.75rem',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#e8e4de' }}>
                        {wh.name}
                      </div>
                      <code
                        style={{ fontSize: '0.6875rem', color: '#4a4540', fontFamily: 'monospace' }}
                      >
                        {wh.url}
                      </code>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <div
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: wh.active ? '#5a9c5a' : '#4a4540',
                        }}
                      />
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          color: wh.active ? '#5a9c5a' : '#4a4540',
                          fontWeight: 600,
                        }}
                      >
                        {wh.active ? 'Active' : 'Inactive'}
                      </span>
                      <button
                        onClick={() => deleteWebhook(wh.id)}
                        title="Delete webhook"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#c45a4a',
                          cursor: 'pointer',
                          padding: '0.125rem',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '0.75rem' }}>
                    <div>
                      <div
                        style={{
                          fontSize: '0.5625rem',
                          color: '#4a4540',
                          textTransform: 'uppercase',
                          fontWeight: 600,
                          marginBottom: '0.125rem',
                        }}
                      >
                        Deliveries
                      </div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#5a9c5a' }}>
                        {wh.deliveries}
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: '0.5625rem',
                          color: '#4a4540',
                          textTransform: 'uppercase',
                          fontWeight: 600,
                          marginBottom: '0.125rem',
                        }}
                      >
                        Failures
                      </div>
                      <div
                        style={{
                          fontSize: '0.875rem',
                          fontWeight: 700,
                          color: wh.failures > 0 ? '#c45a4a' : '#5a9c5a',
                        }}
                      >
                        {wh.failures}
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: '0.5625rem',
                          color: '#4a4540',
                          textTransform: 'uppercase',
                          fontWeight: 600,
                          marginBottom: '0.125rem',
                        }}
                      >
                        Last Triggered
                      </div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#e8e4de' }}>
                        {wh.lastTriggered
                          ? new Date(wh.lastTriggered).toLocaleDateString()
                          : 'Never'}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                    {wh.events.map((evt) => (
                      <span
                        key={evt}
                        style={{
                          fontSize: '0.5625rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          background: 'hsla(40,60%,50%,0.08)',
                          color: '#d4a054',
                          fontFamily: 'monospace',
                        }}
                      >
                        {evt}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {RECENT_DELIVERIES.map((delivery) => (
              <div
                key={delivery.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '0.875rem 1rem',
                  background: 'hsla(0,0%,100%,0.02)',
                  border: '1px solid hsla(0,0%,100%,0.05)',
                  borderRadius: '8px',
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '6px',
                    background:
                      delivery.statusCode < 300 ? 'hsla(120,30%,40%,0.12)' : 'hsla(0,60%,50%,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {delivery.statusCode < 300 ? (
                    <CheckCircle2 size={14} style={{ color: '#5a9c5a' }} />
                  ) : (
                    <AlertCircle size={14} style={{ color: '#c45a4a' }} />
                  )}
                </div>
                <code
                  style={{
                    fontSize: '0.6875rem',
                    color: '#d4a054',
                    fontFamily: 'monospace',
                    minWidth: 140,
                  }}
                >
                  {delivery.event}
                </code>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    color: delivery.statusCode < 300 ? '#5a9c5a' : '#c45a4a',
                    minWidth: 36,
                  }}
                >
                  {delivery.statusCode}
                </span>
                <span style={{ fontSize: '0.6875rem', color: '#4a4540', minWidth: 56 }}>
                  {delivery.duration}ms
                </span>
                <span style={{ fontSize: '0.6875rem', color: '#4a4540', flex: 1 }}>
                  {new Date(delivery.timestamp).toLocaleString()}
                </span>
                <span style={{ fontSize: '0.6875rem', color: '#4a4540' }}>
                  Hook #{delivery.webhookId}
                </span>
              </div>
            ))}
          </div>
        )}
        <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
      </m.div>
    </DistributionOsLayout>
  );
}
