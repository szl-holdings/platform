import { useState, useEffect, useCallback } from "react";
import { Webhook, Plus, Trash2, ChevronDown, AlertCircle, CheckCircle2, XCircle, Clock } from "lucide-react";
import { apiFetch, isAuthenticated } from "../../lib/admin-api";
import AuthGate from "@szl-holdings/shared-ui/AuthGate";
import { Skeleton } from "@szl-holdings/shared-ui/ui/skeleton";

interface WebhookData {
  id: number;
  url: string;
  events: string[];
  active: boolean;
  description: string | null;
  failureCount: number;
  lastDeliveredAt: string | null;
  createdAt: string;
}

interface DeliveryData {
  id: number;
  event: string;
  status: string;
  httpStatus: number | null;
  attempts: number;
  deliveredAt: string | null;
  createdAt: string;
}

const STATUS_ICONS: Record<string, typeof CheckCircle2> = {
  delivered: CheckCircle2,
  failed: XCircle,
  pending: Clock,
  retrying: Clock,
};

const STATUS_COLORS: Record<string, string> = {
  delivered: "text-success",
  failed: "text-error",
  pending: "text-warning",
  retrying: "text-warning",
};

export default function Webhooks() {
  const [webhooks, setWebhooks] = useState<WebhookData[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newEvents, setNewEvents] = useState<string[]>([]);
  const [newDesc, setNewDesc] = useState("");
  const [availableEvents, setAvailableEvents] = useState<Record<string, string[]>>({});
  const [expandedWebhook, setExpandedWebhook] = useState<number | null>(null);
  const [deliveries, setDeliveries] = useState<DeliveryData[]>([]);
  const [error, setError] = useState("");

  const loadWebhooks = useCallback(async () => {
    setLoading(true);
    try {
      const [webhookData, eventData] = await Promise.all([
        apiFetch<{ webhooks: WebhookData[] }>("/developer/webhooks"),
        apiFetch<{ byDomain: Record<string, string[]> }>("/developer/webhook-events"),
      ]);
      setWebhooks(webhookData.webhooks);
      setAvailableEvents(eventData.byDomain);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load webhooks");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAuthenticated()) loadWebhooks();
  }, [loadWebhooks]);

  const createWebhook = async () => {
    setError("");
    try {
      await apiFetch("/developer/webhooks", {
        method: "POST",
        body: JSON.stringify({ url: newUrl, events: newEvents, description: newDesc || undefined }),
      });
      setShowCreate(false);
      setNewUrl("");
      setNewEvents([]);
      setNewDesc("");
      loadWebhooks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create webhook");
    }
  };

  const deleteWebhook = async (id: number) => {
    try {
      await apiFetch(`/developer/webhooks/${id}`, { method: "DELETE" });
      loadWebhooks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete webhook");
    }
  };

  const toggleWebhook = async (id: number, active: boolean) => {
    try {
      await apiFetch(`/developer/webhooks/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: !active }),
      });
      loadWebhooks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update webhook");
    }
  };

  const loadDeliveries = async (webhookId: number) => {
    if (expandedWebhook === webhookId) {
      setExpandedWebhook(null);
      return;
    }
    try {
      const data = await apiFetch<{ deliveries: DeliveryData[] }>(`/developer/webhooks/${webhookId}/deliveries`);
      setDeliveries(data.deliveries);
      setExpandedWebhook(webhookId);
    } catch {
      setDeliveries([]);
      setExpandedWebhook(webhookId);
    }
  };

  const toggleEvent = (event: string) => {
    setNewEvents((prev) => prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]);
  };

  if (!isAuthenticated()) {
    return <AuthGate title="Webhook Management" description="Sign in to register and manage webhook endpoints." onAuth={loadWebhooks} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Webhooks</h1>
          <p className="text-text-secondary">Receive real-time event notifications when things happen across the platform.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-background rounded-lg text-sm font-medium hover:opacity-90"
        >
          <Plus className="w-4 h-4" />
          Add Webhook
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-error/10 border border-error/20 rounded-lg text-error text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {showCreate && (
        <div className="bg-surface rounded-xl border border-border p-6 space-y-4">
          <h3 className="font-semibold">Register Webhook</h3>
          <div>
            <label className="text-sm text-text-secondary block mb-1">Endpoint URL</label>
            <input
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://your-app.com/webhooks/szl"
              className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-sm focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="text-sm text-text-secondary block mb-1">Description</label>
            <input
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Security alerts for my monitoring system"
              className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-sm focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="text-sm text-text-secondary block mb-2">Events</label>
            <div className="space-y-3">
              {Object.entries(availableEvents).map(([domain, events]) => (
                <div key={domain}>
                  <p className="text-xs font-medium text-text-muted mb-1 uppercase">{domain}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {events.map((event) => (
                      <button
                        key={event}
                        onClick={() => toggleEvent(event)}
                        className={`px-2 py-1 rounded text-xs font-mono transition-colors ${
                          newEvents.includes(event)
                            ? "bg-accent/20 text-accent"
                            : "bg-surface-elevated text-text-muted hover:text-text-secondary"
                        }`}
                      >
                        {event}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={createWebhook}
              disabled={!newUrl || newEvents.length === 0}
              className="px-4 py-2 bg-accent text-background rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              Create Webhook
            </button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 bg-surface-elevated border border-border rounded-lg text-sm text-text-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {loading ? (
          <div className="space-y-3" aria-label="Loading webhooks">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-surface rounded-xl border border-border p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Skeleton className="w-4 h-4 rounded" />
                  <Skeleton className="h-4 w-64 rounded" />
                  <Skeleton className="h-4 w-12 rounded" />
                </div>
                <div className="flex gap-1 flex-wrap">
                  <Skeleton className="h-4 w-20 rounded-full" />
                  <Skeleton className="h-4 w-16 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : webhooks.length === 0 ? (
          <div className="text-center py-12 bg-surface rounded-xl border border-border">
            <Webhook className="w-12 h-12 text-text-muted mx-auto mb-3" />
            <p className="text-text-secondary">No webhooks configured</p>
            <p className="text-sm text-text-muted">Register a webhook to receive real-time event notifications</p>
          </div>
        ) : (
          webhooks.map((wh) => (
            <div key={wh.id} className="bg-surface rounded-xl border border-border overflow-hidden">
              <div className="p-4 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Webhook className="w-4 h-4 text-accent" />
                    <code className="text-sm font-mono truncate">{wh.url}</code>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${wh.active ? "bg-success/15 text-success" : "bg-text-muted/15 text-text-muted"}`}>
                      {wh.active ? "Active" : "Paused"}
                    </span>
                  </div>
                  {wh.description && <p className="text-xs text-text-muted mb-1">{wh.description}</p>}
                  <div className="flex flex-wrap gap-1">
                    {wh.events.slice(0, 3).map((e) => (
                      <span key={e} className="px-1.5 py-0.5 bg-surface-elevated rounded text-[10px] font-mono text-text-muted">{e}</span>
                    ))}
                    {wh.events.length > 3 && <span className="text-[10px] text-text-muted">+{wh.events.length - 3} more</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => loadDeliveries(wh.id)}
                    className="p-2 text-text-muted hover:text-text-primary transition-colors"
                    title="View deliveries"
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform ${expandedWebhook === wh.id ? "rotate-180" : ""}`} />
                  </button>
                  <button
                    onClick={() => toggleWebhook(wh.id, wh.active)}
                    className={`p-2 transition-colors ${wh.active ? "text-success hover:text-warning" : "text-text-muted hover:text-success"}`}
                    title={wh.active ? "Pause" : "Activate"}
                  >
                    {wh.active ? "⏸" : "▶"}
                  </button>
                  <button
                    onClick={() => deleteWebhook(wh.id)}
                    className="p-2 text-text-muted hover:text-error transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {expandedWebhook === wh.id && (
                <div className="border-t border-border p-4">
                  <h4 className="text-xs font-medium text-text-muted mb-2">Recent Deliveries</h4>
                  {deliveries.length === 0 ? (
                    <p className="text-xs text-text-muted">No deliveries yet</p>
                  ) : (
                    <div className="space-y-1">
                      {deliveries.slice(0, 10).map((d) => {
                        const StatusIcon = STATUS_ICONS[d.status] || Clock;
                        return (
                          <div key={d.id} className="flex items-center gap-3 py-1.5 text-xs">
                            <StatusIcon className={`w-3 h-3 ${STATUS_COLORS[d.status] || "text-text-muted"}`} />
                            <code className="text-text-secondary font-mono">{d.event}</code>
                            <span className="text-text-muted">{d.status}</span>
                            {d.httpStatus && <span className="text-text-muted">HTTP {d.httpStatus}</span>}
                            <span className="text-text-muted ml-auto">{new Date(d.createdAt).toLocaleString()}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="bg-surface rounded-xl border border-border p-6">
        <h3 className="font-semibold mb-3">Webhook Signature Verification</h3>
        <p className="text-sm text-text-secondary mb-4">Each webhook delivery includes an <code className="text-accent">X-Webhook-Signature</code> header — an HMAC-SHA256 hex digest of the request body using your webhook secret.</p>
        <pre><code>{`import crypto from "crypto";

function verifyWebhook(body: string, signature: string, secret: string): boolean {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}`}</code></pre>
      </div>
    </div>
  );
}
