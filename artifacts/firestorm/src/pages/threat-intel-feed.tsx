import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Rss, Globe, Shield, AlertTriangle, Clock, Radio, Eye, ExternalLink, RefreshCw } from "lucide-react";
import { cn } from "@workspace/shared-ui/utils";
import { LiveDataBadge } from "@/lib/live-badge";
import { api } from "@/lib/api";

const feedSources = [
  { name: "NVD (NIST)", type: "vulnerability", reliability: "high", url: "https://nvd.nist.gov/" },
  { name: "CISA KEV Catalog", type: "government", reliability: "high", url: "https://www.cisa.gov/known-exploited-vulnerabilities-catalog" },
  { name: "The Hacker News", type: "news", reliability: "high", url: "https://thehackernews.com/" },
  { name: "MITRE ATT&CK", type: "framework", reliability: "high", url: "https://attack.mitre.org/" },
  { name: "CERT-RO Romania", type: "national-cert", reliability: "high", url: "https://www.cert.ro/" },
  { name: "NCSC UK", type: "national-cert", reliability: "high", url: "https://www.ncsc.gov.uk/" },
  { name: "ANSSI France", type: "national-cert", reliability: "high", url: "https://www.cert.ssi.gouv.fr/" },
  { name: "BSI Germany", type: "national-cert", reliability: "high", url: "https://www.bsi.bund.de/" },
  { name: "JPCERT/CC", type: "national-cert", reliability: "high", url: "https://www.jpcert.or.jp/" },
  { name: "AusCERT", type: "national-cert", reliability: "high", url: "https://www.auscert.org.au/" },
  { name: "Abuse.ch URLhaus", type: "malware", reliability: "high", url: "https://urlhaus.abuse.ch/" },
  { name: "ENISA EU", type: "national-cert", reliability: "high", url: "https://www.enisa.europa.eu/" },
];

const severityColors: Record<string, string> = {
  CRITICAL: "bg-red-500/10 text-red-400 border-red-500/20",
  HIGH: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  MEDIUM: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  LOW: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  UNKNOWN: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  critical: "bg-red-500/10 text-red-400 border-red-500/20",
  high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  low: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return `${Math.floor(diffHrs / 24)}d ago`;
}

export default function ThreatIntelFeed() {
  const [activeTab, setActiveTab] = useState<"cves" | "kev" | "news" | "certs">("cves");

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
    (kevData?.liveFeed === true) ||
    (newsData?.liveData === true) ||
    (certData?.liveFeeds > 0);

  const handleRefresh = () => {
    if (activeTab === "cves") refetchCves();
    else if (activeTab === "kev") refetchKev();
    else if (activeTab === "certs") refetchCerts();
    else refetchNews();
  };

  const isLoading = activeTab === "cves" ? cveLoading : activeTab === "kev" ? kevLoading : activeTab === "certs" ? certLoading : newsLoading;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Rss className="w-6 h-6 text-primary" />
            Threat Intelligence Feed
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Live vulnerability data from NVD, CISA KEV, and security news feeds
          </p>
        </div>
        <div className="flex items-center gap-3">
          <LiveDataBadge isLive={isLive} isLoading={isLoading} />
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-2 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground transition-colors disabled:opacity-50"
            title="Refresh feed"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">NVD Critical CVEs</p>
          <p className="text-2xl font-bold text-red-400">{cveLoading ? "—" : cves.filter((c: any) => c.severity === "CRITICAL").length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">CISA KEV Total</p>
          <p className="text-2xl font-bold text-orange-400">{kevLoading ? "—" : (kevData?.totalKevCount ?? "—")}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Ransomware-Linked</p>
          <p className="text-2xl font-bold text-amber-400">{kevLoading ? "—" : (kevData?.ransomwareKnownCount ?? "—")}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">News Items</p>
          <p className="text-2xl font-bold text-cyan-400">{newsLoading ? "—" : newsItems.length}</p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-border pb-0 flex-wrap">
        {(["cves", "kev", "news", "certs"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={cn("px-4 py-2 text-sm font-medium rounded-t-lg transition-colors capitalize",
              activeTab === tab ? "bg-card border border-b-card border-border text-foreground -mb-px" : "text-muted-foreground hover:text-foreground"
            )}>
            {tab === "cves" ? "NVD CVEs" : tab === "kev" ? "CISA KEV" : tab === "certs" ? "CERT Advisories" : "Threat News"}
          </button>
        ))}
      </div>

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
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium uppercase border", severityColors[cve.severity])}>
                      {cve.severity}
                    </span>
                    {cve.cvssScore && (
                      <span className="text-xs text-muted-foreground">CVSS {cve.cvssScore.toFixed(1)}</span>
                    )}
                    {cve.cisaExploited && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                        CISA Exploited
                      </span>
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
                </div>
                <a
                  href={`https://nvd.nist.gov/vuln/detail/${cve.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors shrink-0"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
          {cveData?.fetchedAt && (
            <p className="text-xs text-muted-foreground text-center">
              Source: NIST NVD · Updated {new Date(cveData.fetchedAt).toLocaleTimeString()}
            </p>
          )}
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
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                        Ransomware
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      Due: {v.dueDate ?? "—"}
                    </span>
                    {v.dateAdded && (
                      <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Added {v.dateAdded}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-medium text-foreground mb-1">{v.vulnerabilityName ?? v.product}</h3>
                  <p className="text-xs text-muted-foreground">{v.shortDescription ?? v.requiredAction}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <span><Shield className="w-3 h-3 inline mr-1" />{v.vendorProject}</span>
                    <span>{v.product}</span>
                  </div>
                </div>
                <a
                  href={`https://nvd.nist.gov/vuln/detail/${v.cveID}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-orange-400 transition-colors shrink-0"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
          {kevData?.catalogVersion && (
            <p className="text-xs text-muted-foreground text-center">
              CISA KEV Catalog v{kevData.catalogVersion} · {kevData.totalKevCount} total entries
              {kevData.fetchedAt && ` · Updated ${new Date(kevData.fetchedAt).toLocaleTimeString()}`}
            </p>
          )}
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
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium uppercase border", severityColors[item.severity])}>
                      {item.severity}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Globe className="w-3 h-3" /> {item.source}
                    </span>
                    {item.publishedAt && (
                      <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {timeAgo(item.publishedAt)}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-medium text-foreground mb-1">{item.title}</h3>
                  {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground capitalize">{item.category}</span>
                  </div>
                </div>
                {item.url && item.url !== "#" && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors shrink-0"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          ))}
          {newsData?.fetchedAt && (
            <p className="text-xs text-muted-foreground text-center">
              Source: The Hacker News · Updated {new Date(newsData.fetchedAt).toLocaleTimeString()}
            </p>
          )}
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
          ) : (
            <>
              {certFeeds.filter((f: any) => f.advisories?.length > 0).map((feed: any) => (
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
                              <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium uppercase border", severityColors[adv.severity])}>
                                {adv.severity}
                              </span>
                              <span className="text-xs text-muted-foreground">{feed.feedName}</span>
                              {adv.publishedAt && (
                                <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> {timeAgo(adv.publishedAt)}
                                </span>
                              )}
                            </div>
                            <h4 className="text-sm font-medium text-foreground mb-1">{adv.title}</h4>
                            {adv.summary && <p className="text-xs text-muted-foreground line-clamp-2">{adv.summary}</p>}
                          </div>
                          {adv.url && adv.url !== "#" && (
                            <a href={adv.url} target="_blank" rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-primary transition-colors shrink-0">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {certData?.fetchedAt && (
                <p className="text-xs text-muted-foreground text-center">
                  {certData.liveFeeds} of {certData.totalFeeds} feeds live · Updated {new Date(certData.fetchedAt).toLocaleTimeString()}
                </p>
              )}
            </>
          )}
        </div>
      )}

      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">Connected Intelligence Sources</h3>
        <div className="grid grid-cols-2 gap-3">
          {feedSources.map(src => (
            <div key={src.name} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{src.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{src.type} · {src.reliability} reliability</p>
              </div>
              <a href={src.url} target="_blank" rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors">
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
