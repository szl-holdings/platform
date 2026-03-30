import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Webhook, CheckCircle2, XCircle, Clock } from "lucide-react";

const STATUS_STYLES = {
  processed: "text-emerald-400 bg-emerald-500/10",
  failed: "text-red-400 bg-red-500/10",
  pending: "text-amber-400 bg-amber-500/10",
};

export default function WebhooksPage() {
  const { data, isLoading } = useQuery({ queryKey: ["admin-webhooks"], queryFn: api.getWebhooks });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Webhooks</h1>
        <p className="text-sm text-muted-foreground mt-1">Incoming and outgoing webhook events</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Event Type</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Source</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data?.events.map((e) => (
                <tr key={e.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <Webhook className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="font-mono text-xs">{e.eventType}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{e.source || e.provider || "—"}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[e.status as keyof typeof STATUS_STYLES] || "bg-muted text-muted-foreground"}`}>
                      {e.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">
                    {e.createdAt ? new Date(e.createdAt).toLocaleString() : "—"}
                  </td>
                </tr>
              ))}
              {data?.events.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-12 text-center text-muted-foreground text-sm">No webhook events recorded</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
