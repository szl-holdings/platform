import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Webhook, CheckCircle, XCircle, Clock, Search, Filter } from "lucide-react";
import { useState } from "react";

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <div className="h-7 w-40 bg-muted rounded animate-pulse" />
        <div className="h-4 w-52 bg-muted/60 rounded animate-pulse mt-2" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 h-24 animate-pulse" />
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
        <Webhook className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-medium mb-1">No webhook events</h3>
      <p className="text-xs text-muted-foreground text-center max-w-sm">Webhook events will appear here as they are received from external services.</p>
    </div>
  );
}

export default function WebhooksPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-webhooks"],
    queryFn: api.getWebhooks,
  });

  if (isLoading) return <LoadingSkeleton />;

  let events = data?.events ?? [];
  if (search) {
    events = events.filter((e) =>
      e.source.toLowerCase().includes(search.toLowerCase()) ||
      e.event.toLowerCase().includes(search.toLowerCase())
    );
  }
  if (statusFilter !== "all") {
    events = events.filter((e) => e.status === statusFilter);
  }

  const processedCount = data?.events.filter(e => e.status === "processed").length ?? 0;
  const failedCount = data?.events.filter(e => e.status === "failed").length ?? 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Webhook Events</h1>
          <p className="text-sm text-muted-foreground mt-1">Incoming webhook event log</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400">{processedCount} processed</span>
          {failedCount > 0 && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-red-500/10 text-red-400">{failedCount} failed</span>
          )}
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search sources, events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-muted/40 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-9 pr-8 py-2 text-sm rounded-lg border border-border bg-muted/40 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none cursor-pointer transition-all"
          >
            <option value="all">All Status</option>
            <option value="processed">Processed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {events.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {events.map((evt) => (
            <div
              key={evt.id}
              className={`rounded-xl border bg-card p-4 transition-all hover:shadow-md border-l-2 ${
                evt.status === "processed"
                  ? "border-border border-l-emerald-500 hover:border-emerald-500/30"
                  : "border-border border-l-red-500 hover:border-red-500/30"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    evt.status === "processed" ? "bg-primary/10" : "bg-red-500/10"
                  }`}>
                    <Webhook className={`w-4 h-4 ${evt.status === "processed" ? "text-primary" : "text-red-400"}`} />
                  </div>
                  <div>
                    <span className="text-sm font-medium">{evt.source}</span>
                    <code className="text-xs px-1.5 py-0.5 rounded bg-muted font-mono ml-2">{evt.event}</code>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {evt.status === "processed" ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium bg-emerald-500/10 px-2.5 py-1 rounded-full">
                      <CheckCircle className="w-3 h-3" /> Processed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs text-red-400 font-medium bg-red-500/10 px-2.5 py-1 rounded-full">
                      <XCircle className="w-3 h-3" /> Failed
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between mt-3">
                <code className="text-xs text-muted-foreground font-mono bg-muted/40 px-2 py-1 rounded max-w-md truncate">
                  {JSON.stringify(evt.payload)}
                </code>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0 ml-3">
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
