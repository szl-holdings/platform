import AuthGate from '@szl-holdings/shared-ui/AuthGate';
import { AlertCircle, Check, Copy, Key, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch, isAuthenticated } from '../../lib/admin-api';

interface ApiKeyData {
  id: number;
  name: string;
  keyPrefix: string;
  scopes: string[];
  permissions: string;
  rateLimit: number;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

const SCOPES = [
  'security',
  'analytics',
  'maritime',
  'finance',
  'ai',
  'platform',
  'infrastructure',
  'observability',
];
const PERMISSIONS = ['read', 'write', 'admin'];

export default function ApiKeys() {
  const [keys, setKeys] = useState<ApiKeyData[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>([]);
  const [newKeyPermission, setNewKeyPermission] = useState('read');
  const [newKeyRateLimit, setNewKeyRateLimit] = useState(1000);
  const [newKeyExpiry, setNewKeyExpiry] = useState(90);
  const [createdKey, setCreatedKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const loadKeys = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ keys: ApiKeyData[] }>('/developer/api-keys');
      setKeys(data.keys);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load API keys');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAuthenticated()) loadKeys();
  }, [loadKeys]);

  const createKey = async () => {
    setError('');
    try {
      const data = await apiFetch<ApiKeyData & { key: string }>('/developer/api-keys', {
        method: 'POST',
        body: JSON.stringify({
          name: newKeyName,
          scopes: newKeyScopes,
          permissions: newKeyPermission,
          rateLimit: newKeyRateLimit,
          expiresInDays: newKeyExpiry,
        }),
      });
      setCreatedKey(data.key);
      setShowCreate(false);
      setNewKeyName('');
      setNewKeyScopes([]);
      loadKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create key');
    }
  };

  const revokeKey = async (id: number) => {
    try {
      await apiFetch(`/developer/api-keys/${id}`, { method: 'DELETE' });
      loadKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke key');
    }
  };

  const copyKey = () => {
    navigator.clipboard.writeText(createdKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isAuthenticated()) {
    return (
      <AuthGate
        title="API Key Management"
        description="Sign in to create and manage your API keys."
        onAuth={loadKeys}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">API Keys</h1>
          <p className="text-text-secondary">
            Generate and manage scoped API keys for authenticating with the SZL API.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-background rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Create Key
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-error/10 border border-error/20 rounded-lg text-error text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {createdKey && (
        <div className="p-4 bg-success/10 border border-success/20 rounded-xl">
          <p className="text-sm font-medium text-success mb-2">
            API key created! Copy it now — it won't be shown again.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-surface rounded-lg text-sm font-mono text-text-primary border border-border">
              {createdKey}
            </code>
            <button
              onClick={copyKey}
              className="p-2 bg-surface rounded-lg border border-border hover:border-border-bright transition-colors"
            >
              {copied ? (
                <Check className="w-4 h-4 text-success" />
              ) : (
                <Copy className="w-4 h-4 text-text-secondary" />
              )}
            </button>
          </div>
          <button
            onClick={() => setCreatedKey('')}
            className="text-xs text-text-muted mt-2 hover:text-text-secondary"
          >
            Dismiss
          </button>
        </div>
      )}

      {showCreate && (
        <div className="bg-surface rounded-xl border border-border p-6 space-y-4">
          <h3 className="font-semibold">Create New API Key</h3>
          <div>
            <label className="text-sm text-text-secondary block mb-1">Key Name</label>
            <input
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="My Application"
              className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-sm focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="text-sm text-text-secondary block mb-2">Scopes</label>
            <div className="flex flex-wrap gap-2">
              {SCOPES.map((scope) => (
                <button
                  key={scope}
                  onClick={() =>
                    setNewKeyScopes((prev) =>
                      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope],
                    )
                  }
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${newKeyScopes.includes(scope) ? 'bg-accent/20 text-accent' : 'bg-surface-elevated text-text-muted hover:text-text-secondary'}`}
                >
                  {scope}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-text-secondary block mb-1">Permission</label>
              <select
                value={newKeyPermission}
                onChange={(e) => setNewKeyPermission(e.target.value)}
                className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-sm focus:border-accent focus:outline-none"
              >
                {PERMISSIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-text-secondary block mb-1">Rate Limit (req/hr)</label>
              <input
                type="number"
                value={newKeyRateLimit}
                onChange={(e) => setNewKeyRateLimit(Number(e.target.value))}
                className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-sm focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm text-text-secondary block mb-1">Expires (days)</label>
              <input
                type="number"
                value={newKeyExpiry}
                onChange={(e) => setNewKeyExpiry(Number(e.target.value))}
                className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-sm focus:border-accent focus:outline-none"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={createKey}
              disabled={!newKeyName}
              className="px-4 py-2 bg-accent text-background rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              Create Key
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 bg-surface-elevated border border-border rounded-lg text-sm text-text-secondary hover:text-text-primary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-text-muted">Loading API keys...</div>
        ) : keys.length === 0 ? (
          <div className="text-center py-12 bg-surface rounded-xl border border-border">
            <Key className="w-12 h-12 text-text-muted mx-auto mb-3" />
            <p className="text-text-secondary">No API keys yet</p>
            <p className="text-sm text-text-muted">
              Create your first API key to start using the API
            </p>
          </div>
        ) : (
          keys.map((key) => (
            <div
              key={key.id}
              className="bg-surface rounded-xl border border-border p-4 flex items-center justify-between"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Key className="w-4 h-4 text-accent" />
                  <span className="font-medium text-sm">{key.name}</span>
                  <code className="text-xs text-text-muted font-mono">{key.keyPrefix}</code>
                </div>
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <span className="px-1.5 py-0.5 bg-surface-elevated rounded">
                    {key.permissions}
                  </span>
                  {key.scopes.map((s) => (
                    <span key={s} className="px-1.5 py-0.5 bg-surface-elevated rounded">
                      {s}
                    </span>
                  ))}
                  <span>• {key.rateLimit} req/hr</span>
                  {key.lastUsedAt && (
                    <span>• Last used {new Date(key.lastUsedAt).toLocaleDateString()}</span>
                  )}
                  {key.expiresAt && (
                    <span>• Expires {new Date(key.expiresAt).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => revokeKey(key.id)}
                className="p-2 text-text-muted hover:text-error transition-colors"
                title="Revoke"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
