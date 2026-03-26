import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Flag, Clock } from "lucide-react";

export default function FeatureFlagsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-feature-flags"],
    queryFn: api.getFeatureFlags,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ key, enabled }: { key: string; enabled: boolean }) => api.toggleFlag(key, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-feature-flags"] });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Feature Flags</h1>
        <p className="text-sm text-muted-foreground mt-1">Toggle features across the platform</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {data?.flags.map((flag) => (
            <div key={flag.key} className="rounded-lg border border-border bg-card p-5 hover:border-primary/20 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Flag className={`w-4 h-4 ${flag.enabled ? "text-emerald-400" : "text-muted-foreground"}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-medium font-mono">{flag.key}</code>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
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
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {new Date(flag.updatedAt).toLocaleDateString()}
                  </div>
                  <button
                    onClick={() => toggleMutation.mutate({ key: flag.key, enabled: !flag.enabled })}
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      flag.enabled ? "bg-emerald-500" : "bg-muted"
                    }`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      flag.enabled ? "left-5.5" : "left-0.5"
                    }`} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
