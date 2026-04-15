import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Rss, Globe, Shield, AlertTriangle, Clock, Radio, Eye, ExternalLink,
  RefreshCw, Sparkles, Loader2, ChevronDown, ChevronUp, Database,
  Activity, Crosshair, Target, CheckCircle, WifiOff, Wifi, BarChart3,
} from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";
import { LiveDataBadge } from "@/lib/live-badge";
import { api } from "@/lib/api";
import { ThreatFeedSimulator } from "@szl-holdings/observability";
import type { FeedSource, StixIoc, AptCampaign, FeedHealthPanel } from "@szl-holdings/observability";

const feedSim = new ThreatFeedSimulator(0xfeed1337);
const NOW = Date.now();
const simIocs = feedSim.generateIocs(50, NOW);
const simCampaigns = feedSim.generateAptCampaigns(NOW);
const feedHealth = feedSim.generateFeedHealthPanel(NOW);

const TLP_COLORS: Record<string, string> = {
  WHITE: "bg-white/10 text-white border-white/20",
  GREEN: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  AMBER: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  RED: "bg-red-500/10 text-red-400 border-red-500/20",
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-red-500/10 text-red-400 border-red-500/20",
  high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  low: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  CRITICAL: "bg-red-500/10 text-red-400 border-red-500/20",
  HIGH: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  MEDIUM: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  LOW: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  UNKNOWN: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

const KILL_CHAIN_STEP: Record<string, number> = {
  reconnaissance: 1, weaponization: 2, delivery: 3,
  exploitation: 4, installation: 5, "command-and-control": 6, "actions-on-objectives": 7,
};

const KILL_CHAIN_COLORS: Record<string, string> = {
  reconnaissance: "bg-blue-500/20 text-blue-400",
  weaponization: "bg-indigo-500/20 text-indigo-400",
  delivery: "bg-amber-500/20 text-amber-400",
  exploitation: "bg-orange-500/20 text-orange-400",
  installation: "bg-red-500/20 text-red-400",
  "command-and-control": "bg-red-600/25 text-red-300",
  "actions-on-objectives": "bg-red-700/30 text-red-200",
};

function timeAgo(ms: number) {
  const diffMins = Math.floor((Date.now() - ms) / 60000);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return `${Math.floor(diffHrs / 24)}d ago`;
}

function SourceStatusIcon({ status }: { status: FeedSource["status"] }) {
  if (status === "active") return <Wifi className="w-3 h-3 text-emerald-400" />;
  if (status === "degraded") return <Activity className="w-3 h-3 text-amber-400" />;
  return <WifiOff className="w-3 h-3 text-red-400" />;
}

function FeedHealthPanelView({ panel }: { panel: FeedHealthPanel }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
        <Database className="w-4 h-4 text-cyan-400" />
        Feed Health — Ingestion Status
      </h3>
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { label: "Total IOCs", value: panel.totalIocs.toLocaleString(), color: "text-foreground" },
          { label: "Fresh (24h)", value: panel.freshIocs, color: "text-emerald-400" },
          { label: "Avg Confidence", value: `${panel.avgConfidence}%`, color: "text-cyan-400" },
          { label: "Sources", value: panel.sources.filter(s => s.status === "active").length + "/" + panel.sources.length, color: "text-foreground" },
        ].map(({ label, value, color }) => (
          <div key={label} className="text-center bg-muted/30 rounded-lg p-2.5">
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {panel.sources.map((src) => (
          <div key={src.name} className="flex items-center gap-3">
            <SourceStatusIcon status={src.status} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium truncate">{src.name}</span>
                <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full border capitalize",
                  src.status === "active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                  src.status === "degraded" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                  "bg-red-500/10 text-red-400 border-red-500/20"
                )}>
                  {src.status}
                </span>
                <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full border capitalize",
                  src.staleness === "fresh" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                  src.staleness === "recent" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                  src.staleness === "stale" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                  "bg-red-500/10 text-red-400 border-red-500/20"
                )}>
                  {src.staleness}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-0.5 text-[10px] text-muted-foreground">
                <span>{src.iocCount.toLocaleString()} IOCs</span>
                <span>{src.ingestRatePerHour}/hr ingestion</span>
                <span>{timeAgo(src.lastIngested)}</span>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="flex items-center gap-1 justify-end">
                <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${src.confidence}%` }} />
                </div>
                <span className="text-[10px] text-cyan-400">{src.confidence}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AptCampaignCard({ campaign }: { campaign: AptCampaign }) {
  const step = KILL_CHAIN_STEP[campaign.activePhase] ?? 1;
  return (
    <div className={cn(
      "bg-card border border-border rounded-xl p-4 hover:border-primary/20 transition-all",
      campaign.tlp === "RED" && "border-red-500/20",
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="font-semibold text-sm text-foreground">{campaign.name}</span>
            <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-mono border", TLP_COLORS[campaign.tlp])}>
              TLP:{campaign.tlp}
            </span>
            <span className="text-xs text-muted-foreground">{campaign.alias}</span>
            <span className={cn("text-[10px] px-2 py-0.5 rounded-full border capitalize", KILL_CHAIN_COLORS[campaign.activePhase])}>
              Phase {step}/7: {campaign.activePhase.replace(/-/g, " ")}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-2">{campaign.description}</p>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span><Globe className="w-3 h-3 inline mr-1" />Origin: {campaign.originCountry}</span>
            <span><Crosshair className="w-3 h-3 inline mr-1" />{campaign.iocCount} IOCs</span>
            <span><Clock className="w-3 h-3 inline mr-1" />Last: {timeAgo(campaign.lastActivity)}</span>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {campaign.targetSectors.map(s => (
              <span key={s} className="text-[9px] px-1.5 py-0.5 bg-muted/50 rounded text-muted-foreground">{s}</span>
            ))}
          </div>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {campaign.mitreAttack.slice(0, 6).map(t => (
              <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20 font-mono">{t}</span>
            ))}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-lg font-bold font-mono text-foreground">{campaign.confidence}%</div>
          <div className="text-[9px] text-muted-foreground">confidence</div>
        </div>
      </div>
      <div className="mt-3 pt-2 border-t border-border">
        <div className="flex items-center gap-1">
          {Array.from({ length: 7 }, (_, i) => (
            <div
              key={i}
              className={cn(
                "flex-1 h-1.5 rounded-full transition-all",
                i < step ? "bg-red-500" : "bg-muted",
              )}
              title={Object.keys(KILL_CHAIN_STEP)[i]}
            />
          ))}
        </div>
        <p className="text-[9px] text-muted-foreground mt-1">Kill Chain Progression</p>
      </div>
    </div>
  );
}

function IocCard({ ioc }: { ioc: StixIoc }) {
  const [expanded, setExpanded] = useState(false);
  const sourceCount = ioc.sources.length;

  return (
    <div className="bg-card border border-border rounded-xl p-4 hover:border-primary/20 transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium border", SEVERITY_COLORS[ioc.severity])}>
              {ioc.severity}
            </span>
            <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-mono border", TLP_COLORS[ioc.tlp])}>
              TLP:{ioc.tlp}
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted/40 text-muted-foreground font-mono">
              {ioc.type.replace("file:hashes.", "").replace("-addr", "")}
            </span>
            {ioc.aptCampaign && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20">
                {ioc.aptCampaign}
              </span>
            )}
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted/40 text-muted-foreground capitalize">
              {ioc.killChainPhase.replace(/-/g, " ")}
            </span>
          </div>
          <p className="text-sm font-mono text-foreground truncate">{ioc.value}</p>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ioc.description}</p>
          <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
            <span><Eye className="w-3 h-3 inline mr-1" />{sourceCount} source{sourceCount !== 1 ? "s" : ""}</span>
            <span><Clock className="w-3 h-3 inline mr-1" />First seen {timeAgo(ioc.firstSeen)}</span>
            {ioc.expiresAt && ioc.expiresAt > Date.now() && (
              <span className="text-amber-400">
                Expires in {Math.ceil((ioc.expiresAt - Date.now()) / 86_400_000)}d
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {ioc.mitreAttack.map(t => (
              <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20 font-mono">{t}</span>
            ))}
          </div>
          {expanded && (
            <div className="mt-2 pt-2 border-t border-border space-y-1.5">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Source Attribution</p>
              {ioc.sources.map(src => (
                <div key={src.name} className="flex items-center gap-2">
                  <SourceStatusIcon status={src.status} />
                  <span className="text-xs text-foreground">{src.name}</span>
                  <span className="text-[10px] text-cyan-400 ml-auto">{src.confidence}%</span>
                  <span className="text-[10px] text-muted-foreground">{timeAgo(src.lastIngested)}</span>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => setExpanded(e => !e)}
            className="mt-2 text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {expanded ? "Hide sources" : "Show source attribution"}
          </button>
        </div>
        <div className="text-right shrink-0">
          <div className="text-lg font-bold font-mono text-foreground">{ioc.confidence}%</div>
          <div className="text-[9px] text-muted-foreground">confidence</div>
        </div>
      </div>
    </div>
  );
}

interface ThreatAnalysis {
  loading: boolean;
  content: string;
  error?: string;
  expanded: boolean;
}

export default function ThreatIntelFeed() {
  const [activeTab, setActiveTab] = useState<"iocs" | "campaigns" | "cves" | "kev" | "news" | "certs">("campaigns");
  const [analyses, setAnalyses] = useState<Record<string, ThreatAnalysis>>({});

  const analyzeThread = async (id: string, title: string, description: string, severity: string, tags?: string[]) => {
    setAnalyses(prev => ({ ...prev, [id]: { loading: true, content: "", expanded: true } }));
    try {
      const res = await fetch("/api/intelligence/ai/threat-triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ threat: `${title}: ${description}`, severity, affectedSystems: tags ?? [] }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAnalyses(prev => ({ ...prev, [id]: { loading: false, content: data.data?.triage ?? data.triage ?? "No analysis returned", expanded: true } }));
    } catch (err) {
      setAnalyses(prev => ({ ...prev, [id]: { loading: false, content: "", error: err instanceof Error ? err.message : "Analysis failed", expanded: true } }));
    }
  };

  const { data: cveData, isLoading: cveLoading, refetch: refetchCves } = useQuery({
    queryKey: ["live-nvd-cves"],
    queryFn: () => api.live.nvdCves("CRITICAL", undefined, 15),
    staleTime: 600000,
    refetchInterval: 600000,
  });

  const { data: kevData, isLoading: kevLoading, refetch: refetchKev } = useQuery({
    queryKey: ["live-cisa-kev"],
    queryFn: () => api.live.cisaKev(false, 20),
    staleTime: 3600000,
    refetchInterval: 3600000,
  });

  const { data: newsData, isLoading: newsLoading, refetch: refetchNews } = useQuery({
    queryKey: ["live-threat-news"],
    queryFn: () => api.live.threatNews(),
    staleTime: 600000,
    refetchInterval: 600000,
  });

  const { data: certData, isLoading: certLoading, refetch: refetchCerts } = useQuery({
    queryKey: ["live-cert-advisories"],
    queryFn: () => api.live.certAdvisories(),
    staleTime: 3600000,
    refetchInterval: 3600000,
  });

  const cves = cveData?.vulnerabilities ?? [];
  const kevVulns = kevData?.vulnerabilities ?? [];
  const newsItems = newsData?.news ?? [];
  const certFeeds = certData?.feeds ?? [];
  const allCertAdvisories = certFeeds.flatMap((f: any) => f.advisories ?? []);

  const isLive = (cveData?.fetchedAt != null && cves.length > 0) ||
    (kevData?.liveFeed === true) || (newsData?.liveData === true) || (certData?.liveFeeds > 0);

  const isLoading = activeTab === "cves" ? cveLoading : activeTab === "kev" ? kevLoading :
    activeTab === "certs" ? certLoading : activeTab === "news" ? newsLoading : false;

  const handleRefresh = () => {
    if (activeTab === "cves") refetchCves();
    else if (activeTab === "kev") refetchKev();
    else if (activeTab === "certs") refetchCerts();
    else if (activeTab === "news") refetchNews();
  };

  const AiTriagePanel = ({ id }: { id: string }) => {
    const a = analyses[id];
    if (!a || a.loading) return null;
    return (
      <div className="mt-3 pt-3 border-t border-border">
        {a.error ? (
          <p className="text-xs text-red-400">{a.error}</p>
        ) : (
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="flex items-center gap-1 mb-2 text-[10px] text-muted-foreground">
              <Sparkles className="w-3 h-3 text-primary" /> Sentinel AI
              <button onClick={() => setAnalyses(prev => ({ ...prev, [id]: { ...prev[id], expanded: !prev[id].expanded } }))} className="ml-auto">
                {a.expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
            {a.expanded && <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">{a.content}</p>}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Rss className="w-6 h-6 text-primary" />
            Threat Intelligence Feed
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            STIX 2.1 IOCs · APT campaigns · Multi-source attribution: MISP, OTX, Recorded Future, GreyNoise, Abuse.ch
          </p>
        </div>
        <div className="flex items-center gap-3">
          <LiveDataBadge isLive={isLive} isLoading={isLoading} />
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-2 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-red-500/25 bg-red-500/5 p-4 flex items-start gap-4">
        <Radio className="w-4 h-4 text-red-400 animate-pulse shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs font-bold text-red-300">ACTIVE CAMPAIGN — {simCampaigns[0]?.name ?? "Operation Darkwing"} ({simCampaigns[0]?.alias ?? "APT29 / Cozy Bear"})</span>
            <span className={cn("text-[9px] font-mono px-1.5 py-0.5 rounded border", TLP_COLORS[simCampaigns[0]?.tlp ?? "RED"])}>
              TLP:{simCampaigns[0]?.tlp ?? "RED"}
            </span>
            <span className="text-[9px] font-mono bg-violet-500/10 text-violet-400 border border-violet-500/20 px-1.5 py-0.5 rounded">
              STIX {simCampaigns[0]?.id ?? "campaign--0001"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {simCampaigns[0]?.description ?? "Sophisticated campaign active."}
            {" "}{simCampaigns[0]?.iocCount ?? 48} IOCs tracked. CISA coordination initiated.
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {(simCampaigns[0]?.mitreAttack ?? ["T1566.001", "T1003.001", "T1021.002", "T1078"]).map(t => (
              <span key={t} className="text-[9px] font-mono bg-violet-500/10 text-violet-400 border border-violet-500/20 px-1.5 py-0.5 rounded">{t}</span>
            ))}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-lg font-bold font-mono text-red-400">{simCampaigns[0]?.confidence ?? 97}%</div>
          <div className="text-[9px] text-muted-foreground">confidence</div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Active Campaigns</p>
          <p className="text-2xl font-bold text-red-400">{simCampaigns.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total IOCs (all feeds)</p>
          <p className="text-2xl font-bold text-orange-400">{feedHealth.totalIocs.toLocaleString()}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Active Feed Sources</p>
          <p className="text-2xl font-bold text-cyan-400">
            {feedHealth.sources.filter(s => s.status === "active").length}/{feedHealth.sources.length}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">NVD Critical CVEs</p>
          <p className="text-2xl font-bold text-red-400">{cveLoading ? "—" : cves.filter((c: any) => c.severity === "CRITICAL").length}</p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-border pb-0 flex-wrap">
        {(["campaigns", "iocs", "cves", "kev", "news", "certs"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={cn("px-4 py-2 text-sm font-medium rounded-t-lg transition-colors capitalize",
              activeTab === tab ? "bg-card border border-b-card border-border text-foreground -mb-px" : "text-muted-foreground hover:text-foreground"
            )}>
            {tab === "cves" ? "NVD CVEs" : tab === "kev" ? "CISA KEV" : tab === "certs" ? "CERT Advisories" :
              tab === "news" ? "Threat News" : tab === "campaigns" ? "APT Campaigns" : "STIX IOCs"}
          </button>
        ))}
      </div>

      {activeTab === "campaigns" && (
        <div className="space-y-4">
          <FeedHealthPanelView panel={feedHealth} />
          <div className="space-y-3">
            {simCampaigns.map(campaign => (
              <AptCampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        </div>
      )}

      {activeTab === "iocs" && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{simIocs.length} IOCs · sorted by confidence</span>
            <span>·</span>
            <span>Sources: MISP, OTX, Recorded Future, GreyNoise, Abuse.ch</span>
          </div>
          {simIocs
            .sort((a, b) => b.confidence - a.confidence)
            .map(ioc => (
              <IocCard key={ioc.id} ioc={ioc} />
            ))}
        </div>
      )}

      {activeTab === "cves" && (
        <div className="space-y-3">
          {cveLoading ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground">
              <Radio className="w-4 h-4 animate-pulse mr-2" /> Loading NVD data...
            </div>
          ) : cves.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No CVE data available</div>
          ) : cves.map((cve: any) => (
            <div key={cve.id} className="bg-card border border-border rounded-xl p-4 hover:border-primary/20 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="font-mono text-xs text-primary">{cve.id}</span>
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium uppercase border", SEVERITY_COLORS[cve.severity])}>
                      {cve.severity}
                    </span>
                    {cve.cvssScore && <span className="text-xs text-muted-foreground">CVSS {cve.cvssScore.toFixed(1)}</span>}
                    {cve.cisaExploited && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/10 text-red-400 border border-red-500/20">CISA Exploited</span>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {cve.published ? new Date(cve.published).toLocaleDateString() : "Unknown"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{cve.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    {cve.vendor && cve.vendor !== "Various" && <span><Globe className="w-3 h-3 inline mr-1" />{cve.vendor}</span>}
                    {cve.attackVector && <span>Attack: {cve.attackVector}</span>}
                    {cve.cwe && <span>{cve.cwe}</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => analyzeThread(cve.id, cve.id, cve.description ?? "", cve.severity, [cve.cwe, cve.attackVector, cve.vendor].filter(Boolean))}
                      disabled={analyses[cve.id]?.loading}
                      className="text-[10px] px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors flex items-center gap-1 disabled:opacity-50"
                    >
                      {analyses[cve.id]?.loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      {analyses[cve.id]?.loading ? "Analyzing..." : "AI Triage"}
                    </button>
                  </div>
                  <AiTriagePanel id={cve.id} />
                </div>
                <a href={`https://nvd.nist.gov/vuln/detail/${cve.id}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors shrink-0">
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "kev" && (
        <div className="space-y-3">
          {kevLoading ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground">
              <Radio className="w-4 h-4 animate-pulse mr-2" /> Loading CISA KEV data...
            </div>
          ) : kevVulns.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No KEV data available</div>
          ) : kevVulns.map((v: any) => (
            <div key={v.cveID} className="bg-card border border-border rounded-xl p-4 hover:border-orange-500/20 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="font-mono text-xs text-orange-400">{v.cveID}</span>
                    {v.knownRansomwareCampaignUse === "Known" && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/10 text-red-400 border border-red-500/20">Ransomware</span>
                    )}
                    <span className="text-xs text-muted-foreground">Due: {v.dueDate ?? "—"}</span>
                    {v.dateAdded && <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1"><Clock className="w-3 h-3" /> Added {v.dateAdded}</span>}
                  </div>
                  <h3 className="text-sm font-medium text-foreground mb-1">{v.vulnerabilityName ?? v.product}</h3>
                  <p className="text-xs text-muted-foreground">{v.shortDescription ?? v.requiredAction}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => analyzeThread(v.cveID, v.vulnerabilityName ?? v.cveID, v.shortDescription ?? "", v.knownRansomwareCampaignUse === "Known" ? "critical" : "high")}
                      disabled={analyses[v.cveID]?.loading}
                      className="text-[10px] px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors flex items-center gap-1 disabled:opacity-50"
                    >
                      {analyses[v.cveID]?.loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      {analyses[v.cveID]?.loading ? "Analyzing..." : "AI Triage"}
                    </button>
                  </div>
                  <AiTriagePanel id={v.cveID} />
                </div>
                <a href={`https://nvd.nist.gov/vuln/detail/${v.cveID}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-orange-400 transition-colors shrink-0">
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "news" && (
        <div className="space-y-3">
          {newsLoading ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground">
              <Radio className="w-4 h-4 animate-pulse mr-2" /> Loading threat news...
            </div>
          ) : newsItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No news available</div>
          ) : newsItems.map((item: any) => (
            <div key={item.id} className="bg-card border border-border rounded-xl p-4 hover:border-primary/20 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium uppercase border", SEVERITY_COLORS[item.severity])}>
                      {item.severity}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Globe className="w-3 h-3" /> {item.source}</span>
                    {item.publishedAt && <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1"><Clock className="w-3 h-3" /> {timeAgo(new Date(item.publishedAt).getTime())}</span>}
                  </div>
                  <h3 className="text-sm font-medium text-foreground mb-1">{item.title}</h3>
                  {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground capitalize">{item.category}</span>
                    <button
                      onClick={() => analyzeThread(item.id, item.title, item.description ?? "", item.severity, [item.category])}
                      disabled={analyses[item.id]?.loading}
                      className="text-[10px] px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors flex items-center gap-1 disabled:opacity-50"
                    >
                      {analyses[item.id]?.loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      {analyses[item.id]?.loading ? "Analyzing..." : "AI Triage"}
                    </button>
                  </div>
                  <AiTriagePanel id={item.id} />
                </div>
                {item.url && item.url !== "#" && (
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors shrink-0">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "certs" && (
        <div className="space-y-4">
          {certLoading ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground">
              <Radio className="w-4 h-4 animate-pulse mr-2" /> Loading CERT advisories...
            </div>
          ) : allCertAdvisories.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No CERT advisory data available</div>
          ) : certFeeds.filter((f: any) => f.advisories?.length > 0).map((feed: any) => (
            <div key={feed.feedId}>
              <div className="flex items-center gap-2 mb-2">
                <div className={cn("w-2 h-2 rounded-full", feed.liveData ? "bg-emerald-400 animate-pulse" : "bg-red-400")} />
                <h3 className="text-sm font-semibold text-foreground">{feed.feedName}</h3>
                <span className="text-xs text-muted-foreground">{feed.country} · {feed.region}</span>
                <span className="text-xs text-muted-foreground ml-auto">{feed.advisoryCount} advisories</span>
              </div>
              <div className="space-y-2 mb-4">
                {feed.advisories.map((adv: any) => (
                  <div key={adv.id} className="bg-card border border-border rounded-xl p-4 hover:border-primary/20 transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium uppercase border", SEVERITY_COLORS[adv.severity])}>
                            {adv.severity}
                          </span>
                          {adv.publishedAt && <span className="text-xs text-muted-foreground ml-auto"><Clock className="w-3 h-3 inline mr-1" />{timeAgo(new Date(adv.publishedAt).getTime())}</span>}
                        </div>
                        <h4 className="text-sm font-medium text-foreground">{adv.title}</h4>
                        {adv.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{adv.description}</p>}
                      </div>
                      {adv.url && <a href={adv.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors shrink-0"><ExternalLink className="w-4 h-4" /></a>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
