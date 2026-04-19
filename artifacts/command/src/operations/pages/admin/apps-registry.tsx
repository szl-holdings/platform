import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Boxes, AlertTriangle, Search, Save, Loader2, CheckCircle2 } from "lucide-react";
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

const STATUS_COLORS: Record<string, string> = {
  active: "text-[#6b8f71] bg-[#6b8f71]/10",
  coming_soon: "text-[#4a90b8] bg-[#4a90b8]/10",
  maintenance: "text-[#d4a054] bg-[#d4a054]/10",
  deprecated: "text-muted-foreground bg-muted",
};

export default function AppsRegistryAdmin() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savedSlug, setSavedSlug] = useState<string | null>(null);

  const { data, isLoading, error } = useStandardQuery<AppsResponse>({
    queryKey: ["admin-apps-registry"],
    queryFn: () => apiFetch<AppsResponse>("/admin/apps"),
  });

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
      qc.invalidateQueries({ queryKey: ["admin-apps-registry"] });
      qc.invalidateQueries({ queryKey: ["deployments"] });
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

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-display font-bold flex items-center gap-2">
          <Boxes className="w-5 h-5 text-primary" />
          App Ownership
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Set the owning team for each registered app. The Deployments panel and rollback
          notifications use this mapping to decide who to page.
        </p>
      </div>

      {error ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
          <AlertTriangle className="w-8 h-8 text-[#d4a054] mx-auto mb-2" />
          <p>Apps registry requires API connection</p>
        </div>
      ) : (
        <>
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
                    return (
                      <tr key={app.slug} className="hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <div className="font-medium">{app.name}</div>
                          <code className="text-[10px] text-muted-foreground font-mono">
                            {app.slug}
                          </code>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                              STATUS_COLORS[app.status] ?? "text-muted-foreground bg-muted"
                            }`}
                          >
                            {app.status.replace(/_/g, " ")}
                          </span>
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
                        </td>
                      </tr>
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
        </>
      )}
    </div>
  );
}
