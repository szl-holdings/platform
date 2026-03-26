import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Webhook, CheckCircle, XCircle, Clock } from "lucide-react";

export default function WebhooksPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-webhooks"],
    queryFn: api.getWebhooks,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Webhook Events</h1>
        <p className="text-sm text-muted-foreground mt-1">Incoming webhook event log</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {data?.events.map((evt) => (
            <div key={evt.id} className="rounded-lg border border-border bg-card p-4 hover:border-primary/20 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Webhook className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{evt.source}</span>
                  <code className="text-xs px-1.5 py-0.5 rounded bg-muted font-mono">{evt.event}</code>
                </div>
                <div className="flex items-center gap-2">
                  {evt.status === "processed" ? (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                      <CheckCircle className="w-3 h-3" /> Processed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-red-400">
                      <XCircle className="w-3 h-3" /> Failed
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <code className="text-xs text-muted-foreground font-mono">{JSON.stringify(evt.payload)}</code>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {new Date(evt.receivedAt).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
