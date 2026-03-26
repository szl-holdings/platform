import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type FeatureFlag } from "@/lib/api";
import { Flag, Clock, Search } from "lucide-react";
import { useState } from "react";

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <div className="h-7 w-36 bg-muted rounded animate-pulse" />
        <div className="h-4 w-56 bg-muted/60 rounded animate-pulse mt-2" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 h-20 animate-pulse" />
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
        <Flag className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-medium mb-1">No feature flags</h3>
      <p className="text-xs text-muted-foreground text-center max-w-sm">Feature flags will appear here when configured.</p>
    </div>
  );
}

function AnimatedToggle({ enabled, onToggle, isLoading }: { enabled: boolean; onToggle: () => void; isLoading: boolean }) {
  return (
    <button
      onClick={onToggle}
      disabled={isLoading}
      className={`relative w-12 h-6 rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 ${
        enabled
          ? "bg-emerald-500 shadow-lg shadow-emerald-500/30"
          : "bg-muted shadow-inner"
      }`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)] ${
          enabled ? "left-[26px] scale-110" : "left-0.5 scale-100"
        }`}
      />
    </button>
  );
}

export default function FeatureFlagsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-feature-flags"],
    queryFn: api.getFeatureFlags,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ key, enabled }: { key: string; enabled: boolean }) => api.toggleFlag(key, enabled),
    onMutate: async ({ key, enabled }) => {
      await queryClient.cancelQueries({ queryKey: ["admin-feature-flags"] });
      const prev = queryClient.getQueryData<{ flags: FeatureFlag[] }>(["admin-feature-flags"]);
      queryClient.setQueryData<{ flags: FeatureFlag[] } | undefined>(["admin-feature-flags"], (old) => ({
        ...old,
        flags: old?.flags?.map((f) => f.key === key ? { ...f, enabled } : f) ?? [],
      }));
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) queryClient.setQueryData(["admin-feature-flags"], context.prev);
    },
    onSettled: () => {
      setTogglingKey(null);
      queryClient.invalidateQueries({ queryKey: ["admin-feature-flags"] });
    },
  });

  if (isLoading) return <LoadingSkeleton />;

  const flags = data?.flags ?? [];
  const filteredFlags = flags.filter((f) =>
    !search || f.key.toLowerCase().includes(search.toLowerCase()) || f.description.toLowerCase().includes(search.toLowerCase())
  );

  const enabledCount = flags.filter(f => f.enabled).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Feature Flags</h1>
          <p className="text-sm text-muted-foreground mt-1">Toggle features across the platform</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400">{enabledCount} enabled</span>
          <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-muted text-muted-foreground">{flags.length - enabledCount} disabled</span>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search flags..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-muted/40 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
      </div>

      {filteredFlags.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {filteredFlags.map((flag) => (
            <div
              key={flag.key}
              className={`rounded-xl border bg-card p-5 transition-all duration-300 ${
                flag.enabled
                  ? "border-emerald-500/20 hover:border-emerald-500/40 shadow-sm"
                  : "border-border hover:border-primary/20"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors duration-300 ${
                    flag.enabled ? "bg-emerald-500/10" : "bg-muted"
                  }`}>
                    <Flag className={`w-4 h-4 transition-colors duration-300 ${flag.enabled ? "text-emerald-400" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-medium font-mono">{flag.key}</code>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium transition-all duration-300 ${
                        flag.enabled
                          ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                          : "text-muted-foreground border-border bg-muted/40"
                      }`}>
                        {flag.enabled ? "ON" : "OFF"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{flag.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {new Date(flag.updatedAt).toLocaleDateString()}
                  </div>
                  <AnimatedToggle
                    enabled={flag.enabled}
                    isLoading={togglingKey === flag.key}
                    onToggle={() => {
                      setTogglingKey(flag.key);
                      toggleMutation.mutate({ key: flag.key, enabled: !flag.enabled });
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
