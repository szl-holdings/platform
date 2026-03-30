import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@workspace/shared-ui";
import { BarChart3, TrendingUp, Users, Globe, FileText, MousePointer, Send, LogIn } from "lucide-react";

interface AnalyticsSummary {
  totalPageViews: number;
  uniqueVisitors: number;
  formSubmissions: number;
  ctaClicks: number;
  articleViews: number;
  signIns: number;
  topPages: { path: string; views: number }[];
  eventBreakdown: { event: string; count: number }[];
  recentEvents: { event: string; timestamp: string; properties?: Record<string, unknown> }[];
}

export default function AnalyticsOverviewPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: () => apiFetch<AnalyticsSummary>("/admin/analytics/overview"),
  });

  const EVENTS = [
    "page_view", "cta_click", "form_submit", "demo_request", "access_request",
    "private_inquiry_submit", "sign_in", "sign_up", "dashboard_view", "article_view",
    "checkout_started", "checkout_completed",
  ];

  const eventIcons: Record<string, React.ReactNode> = {
    page_view: <Globe className="w-4 h-4" />,
    cta_click: <MousePointer className="w-4 h-4" />,
    form_submit: <Send className="w-4 h-4" />,
    sign_in: <LogIn className="w-4 h-4" />,
    article_view: <FileText className="w-4 h-4" />,
  };

  const summaryCards = [
    { label: "Page Views", value: data?.totalPageViews ?? "—", icon: <Globe className="w-5 h-5 text-blue-400" /> },
    { label: "Unique Visitors", value: data?.uniqueVisitors ?? "—", icon: <Users className="w-5 h-5 text-violet-400" /> },
    { label: "Form Submissions", value: data?.formSubmissions ?? "—", icon: <Send className="w-5 h-5 text-emerald-400" /> },
    { label: "CTA Clicks", value: data?.ctaClicks ?? "—", icon: <MousePointer className="w-5 h-5 text-amber-400" /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">Plausible-powered event tracking across all apps</p>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-sm text-amber-400">
        Analytics data is collected via Plausible when <code className="font-mono text-xs">NEXT_PUBLIC_PLAUSIBLE_DOMAIN</code> is configured.
        12 event types are tracked across all apps.
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {summaryCards.map(c => (
              <div key={c.label} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{c.label}</p>
                    <p className="text-2xl font-bold mt-1">{typeof c.value === "number" ? c.value.toLocaleString() : c.value}</p>
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">{c.icon}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border bg-muted/30">
              <h3 className="text-sm font-semibold">Tracked Events (12 types)</h3>
            </div>
            <div className="divide-y divide-border">
              {EVENTS.map(event => {
                const count = data?.eventBreakdown?.find(e => e.event === event)?.count;
                return (
                  <div key={event} className="flex items-center gap-4 px-5 py-3">
                    <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
                      {eventIcons[event] ?? <BarChart3 className="w-4 h-4" />}
                    </div>
                    <span className="font-mono text-sm flex-1">{event}</span>
                    <span className="text-sm text-muted-foreground">
                      {count != null ? count.toLocaleString() : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {data?.topPages && data.topPages.length > 0 && (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-border bg-muted/30">
                <h3 className="text-sm font-semibold">Top Pages</h3>
              </div>
              <div className="divide-y divide-border">
                {data.topPages.map(p => (
                  <div key={p.path} className="flex items-center gap-4 px-5 py-2.5">
                    <Globe className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="font-mono text-xs flex-1 text-muted-foreground">{p.path}</span>
                    <span className="text-sm font-medium">{p.views.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
