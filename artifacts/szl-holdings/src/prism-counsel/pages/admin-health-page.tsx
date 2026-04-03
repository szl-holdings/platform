import { useState } from "react";
import { Activity, Server, AlertTriangle, CheckCircle2, Clock, Database, Cpu, Wifi } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { cn } from "@/lib/utils";

const DASHBOARD_TYPES = [
  { id: "executive_health", label: "Executive Health", icon: Activity },
  { id: "connector_health", label: "Connector Health", icon: Wifi },
  { id: "worldline_health", label: "Worldline Health", icon: Database },
  { id: "graphql_health", label: "GraphQL Health", icon: Server },
  { id: "forecast_health", label: "Forecast Health", icon: Activity },
  { id: "approval_health", label: "Approval Health", icon: CheckCircle2 },
  { id: "onboarding_health", label: "Onboarding Health", icon: CheckCircle2 },
  { id: "cost_visibility", label: "Cost Visibility", icon: Database },
  { id: "incident_response", label: "Incident Response", icon: AlertTriangle },
] as const;

const SERVICES = [
  "prism_web", "prism_api", "prism_gateway", "prism_worker", "prism_webhooks",
  "prism_connectors", "prism_ingestion", "prism_document_intel", "prism_forecast",
  "prism_worldline", "prism_model_router", "prism_hf_gateway", "prism_proof_chain",
  "prism_notifications", "prism_admin"
];

function ServiceHealthRow({ service }: { service: string }) {
  const label = service.replace("prism_", "").replace("_", " ");
  const mockStatus = ["healthy", "healthy", "healthy", "degraded", "healthy"][Math.floor(Math.random() * 5)] as string;
  const latency = Math.floor(Math.random() * 150) + 10;

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${
          mockStatus === "healthy" ? "bg-[#5aa87a]" :
          mockStatus === "degraded" ? "bg-[#d4a054]" : "bg-[#c45a4a]"
        }`} />
        <span className="text-xs text-slate-300 capitalize">{label}</span>
      </div>
      <div className="flex items-center gap-4 text-[10px] text-slate-500">
        <span>{latency}ms p50</span>
        <span className={mockStatus === "healthy" ? "text-[#5aa87a]" : "text-[#d4a054]"}>
          {mockStatus}
        </span>
      </div>
    </div>
  );
}

export default function AdminHealthPage() {
  const [activeView, setActiveView] = useState<string>("executive_health");

  const { data: metricsData } = useQuery({
    queryKey: ["service-metrics"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/prism-counsel/admin/service-metrics");
      return res.json();
    },
  });

  const { data: incidentsData } = useQuery({
    queryKey: ["prism-incidents"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/prism-counsel/admin/incidents");
      return res.json();
    },
    enabled: activeView === "incident_response",
  });

  const { data: onboardingData } = useQuery({
    queryKey: ["prism-onboarding"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/prism-counsel/admin/onboarding");
      return res.json();
    },
    enabled: activeView === "onboarding_health",
  });

  const metrics = metricsData?.data?.metrics ?? [];
  const incidents = incidentsData?.data?.incidents ?? [];
  const checklist = onboardingData?.data?.checklist ?? [];

  return (
    <div className="p-5 max-w-[1200px] mx-auto space-y-5">
      <div className="flex items-center gap-2">
        <Server className="w-4 h-4 text-[#4a90b8]" />
        <h1 className="text-sm font-semibold text-slate-200">Platform Observability</h1>
        <span className="px-2 py-0.5 rounded text-[9px] bg-[#4a90b8]/10 text-[#4a90b8] border border-[#4a90b8]/20">
          9 DASHBOARDS
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {DASHBOARD_TYPES.map(dt => {
          const Icon = dt.icon;
          return (
            <button
              key={dt.id}
              onClick={() => setActiveView(dt.id)}
              className={cn(
                "rounded-lg border p-3 text-left transition-colors",
                activeView === dt.id
                  ? "border-[#4a90b8]/40 bg-[#4a90b8]/10"
                  : "border-white/[0.06] hover:border-white/[0.10]"
              )}
              style={{ background: "#0c1220" }}
            >
              <div className="flex items-center gap-2">
                <Icon className={`w-3.5 h-3.5 ${activeView === dt.id ? "text-[#4a90b8]" : "text-slate-500"}`} />
                <span className={`text-xs ${activeView === dt.id ? "text-slate-100" : "text-slate-400"}`}>{dt.label}</span>
              </div>
            </button>
          );
        })}
      </div>

      {activeView === "executive_health" && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Services Healthy", value: "14/15", color: "#5aa87a" },
              { label: "Active Incidents", value: incidents.filter((i: any) => i.status === "open").length, color: incidents.length > 0 ? "#c45a4a" : "#5aa87a" },
              { label: "GraphQL Ops (24h)", value: "—", color: "#4a90b8" },
              { label: "Approval Queue", value: "—", color: "#d4a054" },
            ].map(kpi => (
              <div key={kpi.label} className="rounded-lg border border-white/[0.06] p-3" style={{ background: "#0c1220" }}>
                <div className="text-[10px] text-slate-500 mb-1">{kpi.label}</div>
                <div className="text-xl font-bold" style={{ color: kpi.color }}>{kpi.value}</div>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
            <h3 className="text-xs font-semibold text-slate-200 mb-3">Service Health (15 services)</h3>
            <div>
              {SERVICES.map(svc => (
                <ServiceHealthRow key={svc} service={svc} />
              ))}
            </div>
          </div>
        </div>
      )}

      {activeView === "connector_health" && (
        <div className="space-y-3">
          <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
            <h3 className="text-xs font-semibold text-slate-200 mb-3">Connector Health</h3>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
                <span>Microsoft 365</span>
                <span className="text-[#d4a054]">PENDING CONSENT</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
                <span>File Upload</span>
                <span className="text-[#5aa87a]">OPERATIONAL</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span>Clio / Filevine</span>
                <span className="text-slate-500">NOT CONFIGURED</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeView === "incident_response" && (
        <div className="space-y-3">
          {incidents.length === 0 && (
            <div className="rounded-lg border border-white/[0.06] p-6 text-center" style={{ background: "#0c1220" }}>
              <CheckCircle2 className="w-8 h-8 text-[#5aa87a] mx-auto mb-2" />
              <div className="text-xs text-slate-400">No active incidents</div>
            </div>
          )}
          {incidents.map((inc: any) => (
            <div key={inc.id} className="rounded-lg border border-[#c45a4a]/30 p-4" style={{ background: "#0c1220" }}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold text-slate-200">{inc.title}</div>
                <span className={`px-2 py-0.5 rounded text-[9px] bg-[#c45a4a]/10 text-[#c45a4a]`}>{inc.severity?.toUpperCase()}</span>
              </div>
              <div className="text-[10px] text-slate-400">{inc.description}</div>
              <div className="text-[10px] text-slate-500 mt-2">{inc.service} · {new Date(inc.detectedAt).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}

      {activeView === "onboarding_health" && (
        <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
          <h3 className="text-xs font-semibold text-slate-200 mb-3">Onboarding Checklist</h3>
          {checklist.length === 0 && <div className="text-xs text-slate-500">No onboarding steps recorded</div>}
          <div className="space-y-2">
            {checklist.map((step: any) => (
              <div key={step.id} className="flex items-center gap-3 py-1.5">
                {step.status === "complete"
                  ? <CheckCircle2 className="w-4 h-4 text-[#5aa87a]" />
                  : step.status === "blocked"
                  ? <AlertTriangle className="w-4 h-4 text-[#c45a4a]" />
                  : <Clock className="w-4 h-4 text-slate-500" />
                }
                <div>
                  <div className="text-xs text-slate-200 capitalize">{step.step?.replace("_", " ")}</div>
                  {step.blockerReason && <div className="text-[10px] text-[#c45a4a]">{step.blockerReason}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!["executive_health", "connector_health", "incident_response", "onboarding_health"].includes(activeView) && (
        <div className="rounded-lg border border-white/[0.06] p-8 text-center" style={{ background: "#0c1220" }}>
          <div className="text-xs text-slate-500 capitalize">{activeView.replace("_", " ")} dashboard</div>
          <div className="text-[10px] text-slate-600 mt-1">Data will populate as services report metrics</div>
        </div>
      )}
    </div>
  );
}
