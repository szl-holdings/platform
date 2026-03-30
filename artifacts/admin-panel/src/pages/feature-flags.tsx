import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Flag, ToggleLeft, ToggleRight } from "lucide-react";

export default function FeatureFlagsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-feature-flags"], queryFn: api.getFeatureFlags });

  const toggleMut = useMutation({
    mutationFn: ({ key, enabled }: { key: string; enabled: boolean }) => api.toggleFlag(key, enabled),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-feature-flags"] }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Feature Flags</h1>
        <p className="text-sm text-muted-foreground mt-1">Control feature rollout and access</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden">
          {data?.flags.map((flag) => (
            <div key={flag.key} className="flex items-center gap-4 px-5 py-4">
              <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center">
                <Flag className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium font-mono">{flag.key}</span>
                  {flag.environment && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{flag.environment}</span>
                  )}
                </div>
                {flag.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{flag.description}</p>
                )}
              </div>
              <button
                onClick={() => toggleMut.mutate({ key: flag.key, enabled: !flag.enabled })}
                disabled={toggleMut.isPending}
                className="transition-colors disabled:opacity-50"
              >
                {flag.enabled ? (
                  <ToggleRight className="w-6 h-6 text-emerald-400" />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-muted-foreground" />
                )}
              </button>
            </div>
          ))}
          {data?.flags.length === 0 && (
            <div className="px-5 py-12 text-center text-muted-foreground text-sm">No feature flags configured</div>
          )}
        </div>
      )}
    </div>
  );
}
