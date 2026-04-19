import { Fragment, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Boxes,
  AlertTriangle,
  Search,
  Save,
  Loader2,
  CheckCircle2,
  Plus,
  Trash2,
  X,
  History,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { apiFetch } from "@szl-holdings/shared-ui/api-fetch";
import { useStandardMutation, useStandardQuery } from "@szl-holdings/api-client-react";

interface AppRow {
  slug: string;
  name: string;
  status: string;
  ownerTeam: string | null;
  updatedAt: string;
}

interface AppsResponse {
  apps: AppRow[];
}

interface ActivityEntry {
  id: number;
  action: string;
  slug: string | null;
  description: string | null;
  createdAt: string;
  actor: string;
}

interface ActivityResponse {
  entries: ActivityEntry[];
}

const ACTION_COLORS: Record<string, string> = {
  create: "text-[#6b8f71] bg-[#6b8f71]/10 border-[#6b8f71]/30",
  update: "text-[#4a90b8] bg-[#4a90b8]/10 border-[#4a90b8]/30",
  delete: "text-[#c45a4a] bg-[#c45a4a]/10 border-[#c45a4a]/30",
};

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "coming_soon", label: "Coming soon" },
  { value: "maintenance", label: "Maintenance" },
  { value: "deprecated", label: "Deprecated" },
] as const;

const STATUS_COLORS: Record<string, string> = {
  active: "text-[#6b8f71] bg-[#6b8f71]/10",
  coming_soon: "text-[#4a90b8] bg-[#4a90b8]/10",
  maintenance: "text-[#d4a054] bg-[#d4a054]/10",
  deprecated: "text-muted-foreground bg-muted",
};

interface NewAppDraft {
  slug: string;
  name: string;
  status: string;
  ownerTeam: string;
}

const EMPTY_NEW_APP: NewAppDraft = {
  slug: "",
  name: "",
  status: "coming_soon",
  ownerTeam: "",
};

export default function AppsRegistryAdmin() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savedSlug, setSavedSlug] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newApp, setNewApp] = useState<NewAppDraft>(EMPTY_NEW_APP);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedHistorySlug, setExpandedHistorySlug] = useState<string | null>(null);

  const { data, isLoading, error } = useStandardQuery<AppsResponse>({
    queryKey: ["admin-apps-registry"],
    queryFn: () => apiFetch<AppsResponse>("/admin/apps"),
  });

  const {
    data: activityData,
    isLoading: activityLoading,
    error: activityError,
  } = useStandardQuery<ActivityResponse>({
    queryKey: ["admin-apps-registry-activity"],
    queryFn: () => apiFetch<ActivityResponse>("/admin/apps/activity?limit=100"),
    enabled: !error,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-apps-registry"] });
    qc.invalidateQueries({ queryKey: ["admin-apps-registry-activity"] });
    qc.invalidateQueries({ queryKey: ["deployments"] });
  };

  const saveMutation = useStandardMutation({
    mutationFn: ({ slug, ownerTeam }: { slug: string; ownerTeam: string | null }) =>
      apiFetch<AppRow>(`/admin/apps/${slug}/owner-team`, {
        method: "PUT",
        body: JSON.stringify({ ownerTeam }),
      }),
    onSuccess: (updated) => {
      setDrafts((d) => {
        const next = { ...d };
        delete next[updated.slug];
        return next;
      });
      setSavedSlug(updated.slug);
      window.setTimeout(() => setSavedSlug((s) => (s === updated.slug ? null : s)), 1800);
      invalidate();
    },
  });

  const statusMutation = useStandardMutation({
    mutationFn: ({ slug, status }: { slug: string; status: string }) =>
      apiFetch<AppRow>(`/admin/apps/${slug}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => invalidate(),
  });

  const createMutation = useStandardMutation({
    mutationFn: (payload: NewAppDraft) =>
      apiFetch<AppRow>("/admin/apps", {
        method: "POST",
        body: JSON.stringify({
          slug: payload.slug.trim(),
          name: payload.name.trim(),
          status: payload.status,
          ownerTeam: payload.ownerTeam.trim() || null,
        }),
      }),
    onSuccess: () => {
      setNewApp(EMPTY_NEW_APP);
      setShowNewForm(false);
      invalidate();
    },
  });

  const deleteMutation = useStandardMutation({
    mutationFn: (slug: string) =>
      apiFetch<{ ok: boolean }>(`/admin/apps/${slug}`, { method: "DELETE" }),
    onSuccess: () => {
      setConfirmDelete(null);
      invalidate();
    },
  });

  const apps = data?.apps ?? [];
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return apps;
    return apps.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.slug.toLowerCase().includes(q) ||
        (a.ownerTeam ?? "").toLowerCase().includes(q),
    );
  }, [apps, search]);

  const knownTeams = useMemo(() => {
    const set = new Set<string>();
    for (const a of apps) if (a.ownerTeam) set.add(a.ownerTeam);
    return Array.from(set).sort();
  }, [apps]);

  const activityEntries = activityData?.entries ?? [];
  const activityBySlug = useMemo(() => {
    const map = new Map<string, ActivityEntry[]>();
    for (const entry of activityEntries) {
      if (!entry.slug) continue;
      const list = map.get(entry.slug) ?? [];
      list.push(entry);
      map.set(entry.slug, list);
    }
    return map;
  }, [activityEntries]);

  const slugLooksValid = /^[a-z0-9][a-z0-9-]*$/.test(newApp.slug.trim());
  const canCreate =
    newApp.slug.trim().length >= 2 &&
    slugLooksValid &&
    newApp.name.trim().length > 0 &&
    !createMutation.isPending;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-display font-bold flex items-center gap-2">
            <Boxes className="w-5 h-5 text-primary" />
            App Registry
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Add or sunset apps and set the owning team. The Deployments panel and rollback
            notifications use this mapping to decide who to page.
          </p>
        </div>
        {!error && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory((s) => !s)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded-md border border-border text-muted-foreground hover:text-primary hover:border-primary/40"
            >
              {showHistory ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
              <History className="w-3.5 h-3.5" />
              History
            </button>
            <button
              onClick={() => {
                setShowNewForm((s) => !s);
                setNewApp(EMPTY_NEW_APP);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded-md bg-primary/15 border border-primary/30 text-primary hover:bg-primary/25"
            >
              {showNewForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              {showNewForm ? "Cancel" : "New App"}
            </button>
          </div>
        )}
      </div>

      {error ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
          <AlertTriangle className="w-8 h-8 text-[#d4a054] mx-auto mb-2" />
          <p>Apps registry requires API connection</p>
        </div>
      ) : (
        <>
          {showNewForm && (
            <div className="rounded-xl border border-primary/30 bg-card p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Slug
                  </label>
                  <input
                    value={newApp.slug}
                    onChange={(e) =>
                      setNewApp((p) => ({ ...p, slug: e.target.value.toLowerCase() }))
                    }
                    placeholder="my-new-app"
                    className="mt-1 w-full px-2.5 py-1.5 text-xs font-mono bg-muted rounded border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  {newApp.slug && !slugLooksValid && (
                    <p className="mt-1 text-[10px] text-[#c45a4a]">
                      Use lowercase letters, numbers, dashes
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Name
                  </label>
                  <input
                    value={newApp.name}
                    onChange={(e) => setNewApp((p) => ({ ...p, name: e.target.value }))}
                    placeholder="My New App"
                    className="mt-1 w-full px-2.5 py-1.5 text-xs bg-muted rounded border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Status
                  </label>
                  <select
                    value={newApp.status}
                    onChange={(e) => setNewApp((p) => ({ ...p, status: e.target.value }))}
                    className="mt-1 w-full px-2.5 py-1.5 text-xs bg-muted rounded border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Owning team (optional)
                  </label>
                  <input
                    list="known-teams"
                    value={newApp.ownerTeam}
                    onChange={(e) =>
                      setNewApp((p) => ({ ...p, ownerTeam: e.target.value }))
                    }
                    placeholder="Platform"
                    className="mt-1 w-full px-2.5 py-1.5 text-xs bg-muted rounded border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                {createMutation.error ? (
                  <span className="text-[11px] text-[#c45a4a]">
                    {(createMutation.error as Error).message}
                  </span>
                ) : (
                  <span className="text-[11px] text-muted-foreground">
                    The new app appears in the deployments panel immediately.
                  </span>
                )}
                <button
                  disabled={!canCreate}
                  onClick={() => createMutation.mutate(newApp)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider rounded-md bg-primary/15 border border-primary/30 text-primary disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Plus className="w-3 h-3" />
                  )}
                  Add app
                </button>
              </div>
            </div>
          )}

          {showHistory && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5" />
                  Recent registry changes
                </div>
                <span className="text-[10px] text-muted-foreground">
                  Last {activityEntries.length} entries
                </span>
              </div>
              {activityError ? (
                <div className="text-xs text-[#c45a4a]">
                  Failed to load history: {(activityError as Error).message}
                </div>
              ) : activityLoading ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Loading…
                </div>
              ) : activityEntries.length === 0 ? (
                <div className="text-xs text-muted-foreground py-2">
                  No registry changes recorded yet. New entries appear here as
                  admins add, remove, or update apps.
                </div>
              ) : (
                <ul className="space-y-1.5 max-h-72 overflow-auto">
                  {activityEntries.map((entry) => (
                    <li key={entry.id} className="flex items-start gap-2 text-xs">
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded font-mono text-[10px] uppercase tracking-wider border ${
                          ACTION_COLORS[entry.action] ??
                          "text-muted-foreground bg-muted border-border"
                        }`}
                      >
                        {entry.action}
                      </span>
                      {entry.slug && (
                        <code className="text-[10px] text-muted-foreground font-mono pt-0.5">
                          {entry.slug}
                        </code>
                      )}
                      <span className="flex-1">
                        <span className="text-foreground">
                          {entry.description ?? "(no description)"}
                        </span>
                        <span className="text-muted-foreground"> — {entry.actor}</span>
                      </span>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {formatTimestamp(entry.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by app, slug, or team…"
              className="w-full pl-9 pr-4 py-2 text-sm bg-muted rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground uppercase tracking-wider">
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 font-medium">App</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-left px-4 py-3 font-medium">Owning Team</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((app) => {
                    const draft = drafts[app.slug];
                    const current = app.ownerTeam ?? "";
                    const value = draft ?? current;
                    const dirty = draft !== undefined && draft !== current;
                    const saving =
                      saveMutation.isPending &&
                      saveMutation.variables?.slug === app.slug;
                    const statusChanging =
                      statusMutation.isPending &&
                      statusMutation.variables?.slug === app.slug;
                    const deleting =
                      deleteMutation.isPending && deleteMutation.variables === app.slug;
                    return (
                      <Fragment key={app.slug}>
                      <tr className="hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <div className="font-medium">{app.name}</div>
                          <code className="text-[10px] text-muted-foreground font-mono">
                            {app.slug}
                          </code>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                STATUS_COLORS[app.status] ?? "text-muted-foreground bg-muted"
                              }`}
                            >
                              {app.status.replace(/_/g, " ")}
                            </span>
                            <select
                              disabled={statusChanging}
                              value={app.status}
                              onChange={(e) =>
                                statusMutation.mutate({
                                  slug: app.slug,
                                  status: e.target.value,
                                })
                              }
                              className="text-[10px] bg-transparent text-muted-foreground border border-border rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                              {STATUS_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            list="known-teams"
                            value={value}
                            onChange={(e) =>
                              setDrafts((d) => ({ ...d, [app.slug]: e.target.value }))
                            }
                            placeholder="(unassigned — falls back to Platform)"
                            className="w-full max-w-xs px-2.5 py-1.5 text-xs bg-muted rounded border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            {savedSlug === app.slug ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-[#6b8f71]">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Saved
                              </span>
                            ) : (
                              <button
                                onClick={() =>
                                  saveMutation.mutate({
                                    slug: app.slug,
                                    ownerTeam: value.trim() ? value.trim() : null,
                                  })
                                }
                                disabled={!dirty || saving}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-mono uppercase tracking-wider rounded-md bg-primary/15 border border-primary/30 text-primary disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                {saving ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Save className="w-3 h-3" />
                                )}
                                Save
                              </button>
                            )}
                            {confirmDelete === app.slug ? (
                              <>
                                <button
                                  onClick={() => deleteMutation.mutate(app.slug)}
                                  disabled={deleting}
                                  className="inline-flex items-center gap-1 px-2 py-1.5 text-[11px] font-mono uppercase tracking-wider rounded-md bg-[#c45a4a]/15 border border-[#c45a4a]/40 text-[#c45a4a] disabled:opacity-40"
                                >
                                  {deleting ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-3 h-3" />
                                  )}
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setConfirmDelete(null)}
                                  className="inline-flex items-center px-2 py-1.5 text-[11px] font-mono uppercase tracking-wider rounded-md border border-border text-muted-foreground hover:bg-muted"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => setConfirmDelete(app.slug)}
                                title="Remove from registry"
                                className="inline-flex items-center px-2 py-1.5 text-[11px] font-mono uppercase tracking-wider rounded-md border border-border text-muted-foreground hover:text-[#c45a4a] hover:border-[#c45a4a]/40"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              onClick={() =>
                                setExpandedHistorySlug((s) =>
                                  s === app.slug ? null : app.slug,
                                )
                              }
                              title="Show change history"
                              className={`inline-flex items-center gap-1 px-2 py-1.5 text-[11px] font-mono uppercase tracking-wider rounded-md border ${
                                expandedHistorySlug === app.slug
                                  ? "border-primary/40 text-primary bg-primary/10"
                                  : "border-border text-muted-foreground hover:text-primary hover:border-primary/40"
                              }`}
                            >
                              <History className="w-3 h-3" />
                              {(activityBySlug.get(app.slug)?.length ?? 0) > 0
                                ? activityBySlug.get(app.slug)!.length
                                : ""}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedHistorySlug === app.slug && (
                        <tr key={`${app.slug}-history`} className="bg-muted/20">
                          <td colSpan={4} className="px-4 py-3">
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                              <History className="w-3 h-3" />
                              Change history for{" "}
                              <code className="font-mono">{app.slug}</code>
                            </div>
                            {activityLoading ? (
                              <div className="text-xs text-muted-foreground py-2">
                                Loading history…
                              </div>
                            ) : (activityBySlug.get(app.slug)?.length ?? 0) === 0 ? (
                              <div className="text-xs text-muted-foreground py-2">
                                No recorded changes yet for this app.
                              </div>
                            ) : (
                              <ul className="space-y-1.5">
                                {activityBySlug.get(app.slug)!.map((entry) => (
                                  <li
                                    key={entry.id}
                                    className="flex items-start gap-2 text-xs"
                                  >
                                    <span
                                      className={`inline-flex items-center px-1.5 py-0.5 rounded font-mono text-[10px] uppercase tracking-wider border ${
                                        ACTION_COLORS[entry.action] ??
                                        "text-muted-foreground bg-muted border-border"
                                      }`}
                                    >
                                      {entry.action}
                                    </span>
                                    <span className="flex-1">
                                      <span className="text-foreground">
                                        {entry.description ?? "(no description)"}
                                      </span>
                                      <span className="text-muted-foreground">
                                        {" "}— {entry.actor}
                                      </span>
                                    </span>
                                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                      {formatTimestamp(entry.createdAt)}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </td>
                        </tr>
                      )}
                      </Fragment>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-8 text-center text-sm text-muted-foreground"
                      >
                        No apps match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
            <datalist id="known-teams">
              {knownTeams.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </div>

          {saveMutation.error ? (
            <div className="text-xs text-[#c45a4a]">
              Failed to save: {(saveMutation.error as Error).message}
            </div>
          ) : null}
          {deleteMutation.error ? (
            <div className="text-xs text-[#c45a4a]">
              Failed to delete: {(deleteMutation.error as Error).message}
            </div>
          ) : null}
          {statusMutation.error ? (
            <div className="text-xs text-[#c45a4a]">
              Failed to update status: {(statusMutation.error as Error).message}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
