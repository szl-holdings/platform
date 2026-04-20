import { Check, ChevronDown, ChevronRight, Copy, Play } from 'lucide-react';
import { useState } from 'react';

interface Endpoint {
  method: string;
  path: string;
  summary: string;
  tag: string;
  auth: boolean;
  params?: { name: string; in: string; type: string; required?: boolean }[];
  body?: string;
}

const ENDPOINTS: Endpoint[] = [
  {
    method: 'GET',
    path: '/api/health',
    summary: 'Basic API health check',
    tag: 'Platform',
    auth: false,
  },
  {
    method: 'GET',
    path: '/api/ecosystem/health',
    summary: 'Full ecosystem health with per-app status',
    tag: 'Platform',
    auth: false,
  },
  {
    method: 'POST',
    path: '/api/auth/login',
    summary: 'Authenticate and receive session token',
    tag: 'Platform',
    auth: false,
    body: '{\n  "username": "string",\n  "password": "string"\n}',
  },

  {
    method: 'GET',
    path: '/api/aegis/health',
    summary: 'Aegis platform health — all modules',
    tag: 'Security',
    auth: false,
  },
  {
    method: 'GET',
    path: '/api/aegis/threat-data',
    summary: 'Threat intelligence data and analysis',
    tag: 'Security',
    auth: true,
  },
  {
    method: 'GET',
    path: '/api/aegis/compliance',
    summary: 'Compliance framework assessment',
    tag: 'Security',
    auth: true,
  },
  {
    method: 'GET',
    path: '/api/aegis/alerts',
    summary: 'SOC active alerts and incidents',
    tag: 'Security',
    auth: true,
  },
  {
    method: 'GET',
    path: '/api/msp/tickets',
    summary: 'MSP ticket queue and SLA status',
    tag: 'Security',
    auth: true,
  },
  {
    method: 'GET',
    path: '/api/intelligence/model-registry',
    summary: 'Intelligence engine model registry',
    tag: 'Security',
    auth: true,
  },

  {
    method: 'GET',
    path: '/api/lyte/health',
    summary: 'Lyte analytics health',
    tag: 'Analytics',
    auth: false,
  },
  {
    method: 'GET',
    path: '/api/beacon/metrics',
    summary: 'Decision analytics metrics',
    tag: 'Analytics',
    auth: true,
  },
  {
    method: 'GET',
    path: '/api/beacon/projects',
    summary: 'Tracked project metrics',
    tag: 'Analytics',
    auth: true,
  },
  {
    method: 'GET',
    path: '/api/lyte/health',
    summary: 'Lyte observability health',
    tag: 'Analytics',
    auth: false,
  },
  {
    method: 'GET',
    path: '/api/lyte/services',
    summary: 'Monitored services status',
    tag: 'Analytics',
    auth: true,
  },
  {
    method: 'GET',
    path: '/api/lyte/alerts',
    summary: 'Active observability alerts',
    tag: 'Analytics',
    auth: true,
  },

  {
    method: 'GET',
    path: '/api/vessels/health',
    summary: 'Vessels maritime platform health',
    tag: 'Maritime',
    auth: false,
  },
  {
    method: 'GET',
    path: '/api/vessels/fleet',
    summary: 'Fleet overview and positions',
    tag: 'Maritime',
    auth: true,
  },
  {
    method: 'GET',
    path: '/api/vessels/voyages',
    summary: 'Active voyage tracking',
    tag: 'Maritime',
    auth: true,
  },

  {
    method: 'GET',
    path: '/api/alloy/health',
    summary: 'Alloy orchestration layer health',
    tag: 'AI',
    auth: false,
  },
  {
    method: 'GET',
    path: '/api/alloy/signals',
    summary: 'Active signal queue from Alloy engine',
    tag: 'AI',
    auth: true,
  },

  {
    method: 'GET',
    path: '/api/zeus/health',
    summary: 'Zeus infrastructure health',
    tag: 'Infrastructure',
    auth: false,
  },
  {
    method: 'GET',
    path: '/api/zeus/topology',
    summary: 'Service topology map',
    tag: 'Infrastructure',
    auth: true,
  },
  {
    method: 'GET',
    path: '/api/alloy/agents',
    summary: 'Alloy agent registry and status',
    tag: 'Infrastructure',
    auth: false,
  },
  {
    method: 'GET',
    path: '/api/alloy/workflow-templates',
    summary: 'Alloy workflow pattern templates',
    tag: 'Infrastructure',
    auth: true,
  },

  {
    method: 'GET',
    path: '/api/developer/api-keys',
    summary: 'List your API keys',
    tag: 'Developer',
    auth: true,
  },
  {
    method: 'POST',
    path: '/api/developer/api-keys',
    summary: 'Create a new API key',
    tag: 'Developer',
    auth: true,
    body: '{\n  "name": "My App",\n  "scopes": ["security", "analytics"],\n  "permissions": "read"\n}',
  },
  {
    method: 'DELETE',
    path: '/api/developer/api-keys/:id',
    summary: 'Revoke an API key',
    tag: 'Developer',
    auth: true,
    params: [{ name: 'id', in: 'path', type: 'integer', required: true }],
  },
  {
    method: 'GET',
    path: '/api/developer/webhooks',
    summary: 'List registered webhooks',
    tag: 'Developer',
    auth: true,
  },
  {
    method: 'POST',
    path: '/api/developer/webhooks',
    summary: 'Register a webhook endpoint',
    tag: 'Developer',
    auth: true,
    body: '{\n  "url": "https://example.com/webhook",\n  "events": ["aegis.threat.detected"],\n  "description": "Security alerts"\n}',
  },
  {
    method: 'GET',
    path: '/api/developer/webhook-events',
    summary: 'List available webhook event types',
    tag: 'Developer',
    auth: false,
  },
  {
    method: 'GET',
    path: '/api/developer/scopes',
    summary: 'List API scopes and permissions',
    tag: 'Developer',
    auth: false,
  },
];

const TAG_COLORS: Record<string, string> = {
  Security: 'bg-tag-security/15 text-tag-security',
  Analytics: 'bg-tag-analytics/15 text-tag-analytics',
  Maritime: 'bg-tag-maritime/15 text-tag-maritime',
  AI: 'bg-tag-ai/15 text-tag-ai',
  Infrastructure: 'bg-tag-infrastructure/15 text-tag-infrastructure',
  Platform: 'bg-tag-platform/15 text-tag-platform',
  Developer: 'bg-tag-developer/15 text-tag-developer',
};

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-method-get/15 text-method-get',
  POST: 'bg-method-post/15 text-method-post',
  PUT: 'bg-method-put/15 text-method-put',
  PATCH: 'bg-method-patch/15 text-method-patch',
  DELETE: 'bg-method-delete/15 text-method-delete',
};

export default function ApiExplorer() {
  const [expandedTags, setExpandedTags] = useState<Set<string>>(new Set(['Platform']));
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint | null>(null);
  const [tryItResponse, setTryItResponse] = useState<string>('');
  const [tryItLoading, setTryItLoading] = useState(false);
  const [filterTag, setFilterTag] = useState<string>('all');
  const [copied, setCopied] = useState(false);

  const tags = Array.from(new Set(ENDPOINTS.map((e) => e.tag)));
  const filtered = filterTag === 'all' ? ENDPOINTS : ENDPOINTS.filter((e) => e.tag === filterTag);
  const grouped = filtered.reduce<Record<string, Endpoint[]>>((acc, ep) => {
    if (!acc[ep.tag]) acc[ep.tag] = [];
    acc[ep.tag].push(ep);
    return acc;
  }, {});

  const toggleTag = (tag: string) => {
    setExpandedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const tryEndpoint = async (ep: Endpoint) => {
    setTryItLoading(true);
    setTryItResponse('');
    try {
      const token = localStorage.getItem('szl_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token && ep.auth) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(ep.path, {
        method: ep.method,
        headers,
        ...(ep.body && ep.method !== 'GET' ? { body: ep.body } : {}),
      });
      const data = await res.json();
      setTryItResponse(JSON.stringify(data, null, 2));
    } catch (err) {
      setTryItResponse(`Error: ${err instanceof Error ? err.message : 'Request failed'}`);
    }
    setTryItLoading(false);
  };

  const copyCurl = (ep: Endpoint) => {
    const token = localStorage.getItem('szl_token');
    let cmd = `curl -X ${ep.method} "${window.location.origin}${ep.path}"`;
    if (token && ep.auth) cmd += ` \\\n  -H "Authorization: Bearer ${token}"`;
    cmd += ` \\\n  -H "Content-Type: application/json"`;
    if (ep.body && ep.method !== 'GET') cmd += ` \\\n  -d '${ep.body.replace(/\n/g, '')}'`;
    navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">API Explorer</h1>
        <p className="text-text-secondary">
          Interactive documentation for all SZL Holdings API endpoints.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterTag('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterTag === 'all' ? 'bg-accent/20 text-accent' : 'bg-surface text-text-secondary hover:text-text-primary'}`}
        >
          All ({ENDPOINTS.length})
        </button>
        {tags.map((tag) => (
          <button
            key={tag}
            onClick={() => {
              setFilterTag(tag);
              setExpandedTags(new Set([tag]));
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterTag === tag ? TAG_COLORS[tag] : 'bg-surface text-text-secondary hover:text-text-primary'}`}
          >
            {tag} ({ENDPOINTS.filter((e) => e.tag === tag).length})
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-1/2 space-y-2">
          {Object.entries(grouped).map(([tag, endpoints]) => (
            <div key={tag} className="bg-surface rounded-xl border border-border overflow-hidden">
              <button
                onClick={() => toggleTag(tag)}
                className="w-full flex items-center justify-between p-3 hover:bg-surface-elevated transition-colors"
              >
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${TAG_COLORS[tag]}`}>
                  {tag}
                </span>
                {expandedTags.has(tag) ? (
                  <ChevronDown className="w-4 h-4 text-text-muted" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-text-muted" />
                )}
              </button>
              {expandedTags.has(tag) && (
                <div className="border-t border-border">
                  {endpoints.map((ep, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedEndpoint(ep)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-elevated transition-colors ${
                        selectedEndpoint === ep ? 'bg-surface-elevated' : ''
                      }`}
                    >
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${METHOD_COLORS[ep.method]} min-w-[52px] text-center`}
                      >
                        {ep.method}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-mono text-text-primary truncate">{ep.path}</p>
                        <p className="text-[11px] text-text-muted truncate">{ep.summary}</p>
                      </div>
                      {ep.auth && <span className="text-[10px] text-accent">🔒</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="lg:w-1/2">
          {selectedEndpoint ? (
            <div className="bg-surface rounded-xl border border-border p-5 space-y-4 sticky top-4">
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-bold px-2 py-1 rounded ${METHOD_COLORS[selectedEndpoint.method]}`}
                >
                  {selectedEndpoint.method}
                </span>
                <code className="text-sm font-mono text-text-primary">{selectedEndpoint.path}</code>
              </div>
              <p className="text-sm text-text-secondary">{selectedEndpoint.summary}</p>

              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded ${TAG_COLORS[selectedEndpoint.tag]}`}>
                  {selectedEndpoint.tag}
                </span>
                {selectedEndpoint.auth && (
                  <span className="text-xs px-2 py-0.5 rounded bg-accent/10 text-accent">
                    Requires Auth
                  </span>
                )}
              </div>

              {selectedEndpoint.body && (
                <div>
                  <p className="text-xs text-text-muted mb-1">Request Body</p>
                  <pre className="text-xs">
                    <code>{selectedEndpoint.body}</code>
                  </pre>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => tryEndpoint(selectedEndpoint)}
                  disabled={tryItLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-accent text-background rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  <Play className="w-3 h-3" />
                  {tryItLoading ? 'Sending...' : 'Try it'}
                </button>
                <button
                  onClick={() => copyCurl(selectedEndpoint)}
                  className="flex items-center gap-2 px-4 py-2 bg-surface-elevated border border-border rounded-lg text-sm text-text-secondary hover:text-text-primary transition-colors"
                >
                  {copied ? (
                    <Check className="w-3 h-3 text-success" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  {copied ? 'Copied!' : 'cURL'}
                </button>
              </div>

              {tryItResponse && (
                <div>
                  <p className="text-xs text-text-muted mb-1">Response</p>
                  <pre className="text-xs max-h-96 overflow-auto">
                    <code>{tryItResponse}</code>
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-surface rounded-xl border border-border p-8 text-center">
              <Code2Icon className="w-12 h-12 text-text-muted mx-auto mb-3" />
              <p className="text-text-secondary">
                Select an endpoint to view details and try it live
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Code2Icon(props: { className?: string }) {
  return (
    <svg
      className={props.className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
    </svg>
  );
}
