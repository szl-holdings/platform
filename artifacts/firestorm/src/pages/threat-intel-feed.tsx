import { useState, useEffect } from "react";
import { Rss, Globe, Shield, AlertTriangle, Clock, Radio, Eye, Filter, RefreshCw, ExternalLink, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

const feedSources = [
  { name: "CISA Advisories", type: "government", reliability: "high" },
  { name: "MITRE CVE Feed", type: "vulnerability", reliability: "high" },
  { name: "AlienVault OTX", type: "community", reliability: "medium" },
  { name: "Recorded Future", type: "commercial", reliability: "high" },
  { name: "VirusTotal", type: "malware", reliability: "high" },
  { name: "Shodan Monitor", type: "exposure", reliability: "medium" },
];

const feedItems = [
  { id: "TIF-001", title: "Critical RCE in Apache Log4j (CVE-2026-XXXX)", source: "CISA Advisories", severity: "critical", category: "vulnerability", timestamp: "3 min ago", iocs: 24, description: "Remote code execution vulnerability in Apache Log4j 3.x allowing unauthenticated attackers to execute arbitrary code", tags: ["rce", "apache", "log4j", "critical"], read: false },
  { id: "TIF-002", title: "APT-41 Campaign Targeting Financial Services", source: "Recorded Future", severity: "high", category: "apt", timestamp: "18 min ago", iocs: 156, description: "Chinese state-sponsored group APT-41 observed conducting supply chain attacks against financial institutions in EU/US", tags: ["apt41", "financial", "supply-chain"], read: false },
  { id: "TIF-003", title: "New Ransomware Variant: BlackMatter 3.0", source: "VirusTotal", severity: "high", category: "malware", timestamp: "42 min ago", iocs: 89, description: "New ransomware strain with advanced evasion techniques targeting VMware ESXi hypervisors", tags: ["ransomware", "blackmatter", "esxi"], read: true },
  { id: "TIF-004", title: "Exposed Kubernetes API Servers Detected", source: "Shodan Monitor", severity: "medium", category: "exposure", timestamp: "1 hr ago", iocs: 12, description: "3 externally-facing Kubernetes API servers detected with default configurations in monitored IP ranges", tags: ["kubernetes", "misconfiguration", "exposure"], read: true },
  { id: "TIF-005", title: "Phishing Campaign Using Fake Microsoft 365 Login", source: "AlienVault OTX", severity: "medium", category: "phishing", timestamp: "2 hr ago", iocs: 45, description: "Large-scale phishing campaign distributing credential-harvesting pages mimicking Microsoft 365 login portal", tags: ["phishing", "microsoft", "credentials"], read: true },
  { id: "TIF-006", title: "Zero-Day in Fortinet FortiOS SSL VPN", source: "CISA Advisories", severity: "critical", category: "vulnerability", timestamp: "3 hr ago", iocs: 18, description: "Actively exploited zero-day vulnerability in FortiOS SSL VPN allowing pre-authentication RCE", tags: ["zero-day", "fortinet", "vpn", "critical"], read: true },
  { id: "TIF-007", title: "DDoS Amplification via Memcached Reflection", source: "MITRE CVE Feed", severity: "medium", category: "ddos", timestamp: "4 hr ago", iocs: 67, description: "Increased memcached reflection attacks observed with amplification factors exceeding 50,000x", tags: ["ddos", "memcached", "amplification"], read: true },
  { id: "TIF-008", title: "Insider Threat Indicators Update", source: "Recorded Future", severity: "low", category: "insider", timestamp: "6 hr ago", iocs: 8, description: "Updated behavioral indicators for insider threat detection based on recent case studies", tags: ["insider", "behavioral", "indicators"], read: true },
];

const severityColors: Record<string, string> = {
  critical: "bg-red-500/10 text-red-400 border-red-500/20",
  high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  low: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

export default function ThreatIntelFeed() {
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const filtered = feedItems.filter(item =>
    (categoryFilter === "all" || item.category === categoryFilter) &&
    (!showUnreadOnly || !item.read)
  );

  const unreadCount = feedItems.filter(i => !i.read).length;
  const totalIocs = feedItems.reduce((s, i) => s + i.iocs, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Rss className="w-6 h-6 text-primary" />
            Threat Intelligence Feed
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Aggregated threat intelligence from {feedSources.length} sources</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
            <Radio className="w-3 h-3 animate-pulse" /> Live Feed
          </span>
          {unreadCount > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-400/10 text-red-400 text-xs font-medium">
              {unreadCount} unread
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Feed Items</p>
          <p className="text-2xl font-bold text-foreground">{feedItems.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total IOCs</p>
          <p className="text-2xl font-bold text-cyan-400">{totalIocs}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Sources Active</p>
          <p className="text-2xl font-bold text-emerald-400">{feedSources.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Critical Items</p>
          <p className="text-2xl font-bold text-red-400">{feedItems.filter(i => i.severity === "critical").length}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex gap-1">
          {["all", "vulnerability", "apt", "malware", "phishing", "exposure", "ddos"].map(c => (
            <button key={c} onClick={() => setCategoryFilter(c)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors",
                categoryFilter === c ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
              )}>{c}</button>
          ))}
        </div>
        <button onClick={() => setShowUnreadOnly(!showUnreadOnly)}
          className={cn("ml-auto px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
            showUnreadOnly ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
          )}>Unread Only</button>
      </div>

      <div className="space-y-3">
        {filtered.map(item => (
          <div key={item.id} className={cn(
            "bg-card border rounded-xl p-5 transition-all hover:border-primary/20",
            !item.read ? "border-primary/30" : "border-border"
          )}>
            <div className="flex items-start gap-4">
              {!item.read && <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono text-muted-foreground">{item.id}</span>
                  <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium uppercase border", severityColors[item.severity])}>{item.severity}</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Globe className="w-3 h-3" /> {item.source}</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto"><Clock className="w-3 h-3" /> {item.timestamp}</span>
                </div>
                <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                <div className="flex items-center gap-3 mt-3">
                  <span className="text-xs text-cyan-400 flex items-center gap-1"><Eye className="w-3 h-3" /> {item.iocs} IOCs</span>
                  <div className="flex gap-1">
                    {item.tags.map(tag => (
                      <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">#{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">Feed Sources</h3>
        <div className="grid grid-cols-3 gap-3">
          {feedSources.map(src => (
            <div key={src.name} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <div>
                <p className="text-sm text-foreground">{src.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{src.type} · {src.reliability} reliability</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
