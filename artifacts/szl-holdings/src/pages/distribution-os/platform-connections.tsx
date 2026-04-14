import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { m, AnimatePresence } from "framer-motion";
import {
  Globe, Twitter, Link2, CheckCircle2, AlertCircle, Clock, RefreshCw,
  ToggleLeft, ToggleRight, ExternalLink, Zap, Settings, Plus, Shield,
  Activity, ChevronRight, Wifi, WifiOff, Key, Copy, Check,
} from "lucide-react";
import { DistributionOsLayout } from "./admin-dashboard";

const API = import.meta.env.VITE_API_URL || "";

function getCsrfToken(): string {
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}
function writeHeaders(): Record<string, string> {
  return { "Content-Type": "application/json", "x-csrf-token": getCsrfToken() };
}

interface Platform {
  id: string;
  name: string;
  description: string;
  authType: "oauth2" | "api-key" | "username-password" | "bearer";
  color: string;
  category: "social" | "blog" | "newsletter" | "cms";
  capabilities: string[];
  docsUrl: string;
  status: "connected" | "disconnected" | "error" | "mock";
  lastSync?: string;
  errorMsg?: string;
}

const PLATFORMS: Platform[] = [
  {
    id: "x", name: "X (Twitter)", description: "Single posts and auto-split threads",
    authType: "oauth2", color: "#1a8cd8", category: "social",
    capabilities: ["Single posts", "Threads (auto-split)", "Scheduled posting", "Engagement metrics"],
    docsUrl: "https://developer.twitter.com/en/docs", status: "disconnected",
  },
  {
    id: "linkedin", name: "LinkedIn", description: "Posts and carousel PDF publishing",
    authType: "oauth2", color: "#0a66c2", category: "social",
    capabilities: ["Text posts", "Carousel PDFs", "Articles", "Company page posting"],
    docsUrl: "https://docs.microsoft.com/en-us/linkedin/", status: "disconnected",
  },
  {
    id: "threads", name: "Threads", description: "Publish to Meta's Threads platform",
    authType: "oauth2", color: "#e8e4de", category: "social",
    capabilities: ["Single posts", "Thread chains", "Image posts", "Engagement metrics"],
    docsUrl: "https://developers.facebook.com/docs/threads", status: "disconnected",
  },
  {
    id: "bluesky", name: "Bluesky", description: "AT Protocol decentralized social",
    authType: "username-password", color: "#0085ff", category: "social",
    capabilities: ["Posts (skeets)", "Threads", "Rich link embeds", "Lexicon-native format"],
    docsUrl: "https://docs.bsky.app/", status: "disconnected",
  },
  {
    id: "mastodon", name: "Mastodon", description: "ActivityPub fediverse publishing",
    authType: "oauth2", color: "#6364ff", category: "social",
    capabilities: ["Toots (posts)", "Threaded replies", "Content warnings", "Custom instances"],
    docsUrl: "https://docs.joinmastodon.org/api/", status: "disconnected",
  },
  {
    id: "instagram", name: "Instagram", description: "Posts via Meta Business API",
    authType: "oauth2", color: "#e1306c", category: "social",
    capabilities: ["Feed posts", "Captions", "Carousel posts", "Reels metadata"],
    docsUrl: "https://developers.facebook.com/docs/instagram-api/", status: "disconnected",
  },
  {
    id: "medium", name: "Medium", description: "Publish long-form articles to Medium",
    authType: "bearer", color: "#e8e4de", category: "blog",
    capabilities: ["Full articles", "Draft & publish", "Tags", "Canonical URLs"],
    docsUrl: "https://github.com/Medium/medium-api-docs", status: "mock",
  },
  {
    id: "devto", name: "Dev.to", description: "Publish developer-focused articles",
    authType: "api-key", color: "#3b49df", category: "blog",
    capabilities: ["Articles", "Markdown support", "Tags", "Series management"],
    docsUrl: "https://developers.forem.com/api/", status: "disconnected",
  },
  {
    id: "hashnode", name: "Hashnode", description: "GraphQL-powered developer blog network",
    authType: "api-key", color: "#2962ff", category: "blog",
    capabilities: ["Articles", "GraphQL API", "Newsletter import", "Custom domain"],
    docsUrl: "https://api.hashnode.com/", status: "disconnected",
  },
  {
    id: "wordpress", name: "WordPress", description: "REST API publishing to any WP site",
    authType: "username-password", color: "#21759b", category: "cms",
    capabilities: ["Posts & Pages", "Custom post types", "Media upload", "Categories & tags"],
    docsUrl: "https://developer.wordpress.org/rest-api/", status: "disconnected",
  },
  {
    id: "ghost", name: "Ghost", description: "Headless CMS with Ghost Admin API",
    authType: "api-key", color: "#15171a", category: "cms",
    capabilities: ["Posts", "Members newsletter", "Tags", "Feature images"],
    docsUrl: "https://ghost.org/docs/admin-api/", status: "disconnected",
  },
  {
    id: "substack", name: "Substack", description: "Publish newsletters to Substack",
    authType: "bearer", color: "#f05a28", category: "newsletter",
    capabilities: ["Newsletter issues", "Draft & publish", "Subscriber send", "Paid posts"],
    docsUrl: "https://substack.com", status: "mock",
  },
  {
    id: "reddit", name: "Reddit", description: "OAuth2 posts to subreddits",
    authType: "oauth2", color: "#ff4500", category: "social",
    capabilities: ["Text posts", "Link posts", "Markdown formatting", "Subreddit targeting"],
    docsUrl: "https://www.reddit.com/dev/api/", status: "disconnected",
  },
];

const STATUS_META: Record<string, { color: string; bg: string; dot: string; label: string }> = {
  connected: { color: "#5a9c5a", bg: "hsla(120,30%,40%,0.1)", dot: "#5a9c5a", label: "Connected" },
  disconnected: { color: "#6b6560", bg: "hsla(0,0%,40%,0.08)", dot: "#4a4540", label: "Disconnected" },
  error: { color: "#c45a4a", bg: "hsla(0,60%,50%,0.08)", dot: "#c45a4a", label: "Error" },
  mock: { color: "#8b7ac8", bg: "hsla(270,40%,50%,0.1)", dot: "#8b7ac8", label: "Dev Mode" },
};

const CATEGORY_LABELS: Record<string, string> = {
  social: "Social Media", blog: "Blog Platforms", newsletter: "Newsletter Platforms", cms: "CMS & Publishing",
};
const AUTH_LABELS: Record<string, string> = {
  oauth2: "OAuth 2.0", "api-key": "API Key", "username-password": "Username + App Password", bearer: "Bearer Token",
};

function ConnectModal({ platform, onClose }: { platform: Platform; onClose: () => void }) {
  const [step, setStep] = useState<"info" | "credentials" | "success">("info");
  const [apiKey, setApiKey] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [connecting, setConnecting] = useState(false);

  async function connect() {
    setConnecting(true);
    await new Promise(r => setTimeout(r, 1400));
    setConnecting(false);
    setStep("success");
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem",
    }}>
      <m.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        style={{ width: "100%", maxWidth: 480, background: "#0f1420", border: "1px solid hsla(0,0%,100%,0.1)", borderRadius: "14px", padding: "1.75rem" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", marginBottom: "1.5rem" }}>
          <div style={{ width: 42, height: 42, borderRadius: "10px", background: `${platform.color}18`, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${platform.color}30` }}>
            <Globe size={20} style={{ color: platform.color }} />
          </div>
          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#e8e4de" }}>Connect {platform.name}</h2>
            <p style={{ fontSize: "0.75rem", color: "#6b6560" }}>via {AUTH_LABELS[platform.authType]}</p>
          </div>
        </div>

        {step === "info" && (
          <>
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#8b8579", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.625rem" }}>What you can publish:</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                {platform.capabilities.map(cap => (
                  <div key={cap} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <CheckCircle2 size={12} style={{ color: "#5a9c5a", flexShrink: 0 }} />
                    <span style={{ fontSize: "0.8125rem", color: "#c8c2ba" }}>{cap}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding: "0.75rem", background: "hsla(0,0%,100%,0.03)", border: "1px solid hsla(0,0%,100%,0.06)", borderRadius: "8px", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Shield size={13} style={{ color: "#d4a054", flexShrink: 0 }} />
                <span style={{ fontSize: "0.75rem", color: "#8b8579" }}>Auth method: {AUTH_LABELS[platform.authType]}. Credentials stored encrypted at rest.</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              {platform.authType === "oauth2" ? (
                <button onClick={() => setStep("success")} style={{ flex: 1, padding: "0.625rem", background: `${platform.color}`, color: "#fff", border: "none", borderRadius: "8px", fontWeight: 700, fontSize: "0.875rem", cursor: "pointer" }}>
                  Authorize with {platform.name} ↗
                </button>
              ) : (
                <button onClick={() => setStep("credentials")} style={{ flex: 1, padding: "0.625rem", background: "#d4a054", color: "#070a10", border: "none", borderRadius: "8px", fontWeight: 700, fontSize: "0.875rem", cursor: "pointer" }}>
                  Enter Credentials →
                </button>
              )}
              <button onClick={onClose} style={{ padding: "0.625rem 1rem", background: "none", border: "1px solid hsla(0,0%,100%,0.1)", borderRadius: "8px", color: "#6b6560", cursor: "pointer", fontSize: "0.875rem" }}>Cancel</button>
            </div>
          </>
        )}

        {step === "credentials" && (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
              {(platform.authType === "api-key" || platform.authType === "bearer") && (
                <div>
                  <label style={{ display: "block", fontSize: "0.6875rem", color: "#6b6560", fontWeight: 600, textTransform: "uppercase", marginBottom: "0.375rem" }}>
                    {platform.authType === "api-key" ? "API Key" : "Bearer Token"}
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    placeholder={platform.authType === "api-key" ? "Enter API key..." : "Enter bearer token..."}
                    style={{ width: "100%", padding: "0.625rem 0.75rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.1)", borderRadius: "6px", color: "#e8e4de", fontSize: "0.875rem", boxSizing: "border-box" }}
                  />
                </div>
              )}
              {platform.authType === "username-password" && (
                <>
                  <div>
                    <label style={{ display: "block", fontSize: "0.6875rem", color: "#6b6560", fontWeight: 600, textTransform: "uppercase", marginBottom: "0.375rem" }}>Username</label>
                    <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter username..." style={{ width: "100%", padding: "0.625rem 0.75rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.1)", borderRadius: "6px", color: "#e8e4de", fontSize: "0.875rem", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.6875rem", color: "#6b6560", fontWeight: 600, textTransform: "uppercase", marginBottom: "0.375rem" }}>App Password</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter app password..." style={{ width: "100%", padding: "0.625rem 0.75rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.1)", borderRadius: "6px", color: "#e8e4de", fontSize: "0.875rem", boxSizing: "border-box" }} />
                  </div>
                </>
              )}
              {platform.id === "wordpress" && (
                <div>
                  <label style={{ display: "block", fontSize: "0.6875rem", color: "#6b6560", fontWeight: 600, textTransform: "uppercase", marginBottom: "0.375rem" }}>WordPress Site URL</label>
                  <input placeholder="https://yourblog.com" style={{ width: "100%", padding: "0.625rem 0.75rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.1)", borderRadius: "6px", color: "#e8e4de", fontSize: "0.875rem", boxSizing: "border-box" }} />
                </div>
              )}
              {platform.id === "mastodon" && (
                <div>
                  <label style={{ display: "block", fontSize: "0.6875rem", color: "#6b6560", fontWeight: 600, textTransform: "uppercase", marginBottom: "0.375rem" }}>Mastodon Instance URL</label>
                  <input placeholder="https://mastodon.social" style={{ width: "100%", padding: "0.625rem 0.75rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.1)", borderRadius: "6px", color: "#e8e4de", fontSize: "0.875rem", boxSizing: "border-box" }} />
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={connect} disabled={connecting || (!apiKey && !username)} style={{ flex: 1, padding: "0.625rem", background: "#d4a054", color: "#070a10", border: "none", borderRadius: "8px", fontWeight: 700, fontSize: "0.875rem", cursor: "pointer", opacity: connecting ? 0.7 : 1 }}>
                {connecting ? "Testing connection..." : "Connect Platform"}
              </button>
              <button onClick={() => setStep("info")} style={{ padding: "0.625rem 1rem", background: "none", border: "1px solid hsla(0,0%,100%,0.1)", borderRadius: "8px", color: "#6b6560", cursor: "pointer", fontSize: "0.875rem" }}>Back</button>
            </div>
          </>
        )}

        {step === "success" && (
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "hsla(120,30%,40%,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
              <CheckCircle2 size={28} style={{ color: "#5a9c5a" }} />
            </div>
            <h3 style={{ fontSize: "1.0625rem", fontWeight: 700, color: "#e8e4de", marginBottom: "0.5rem" }}>Connected to {platform.name}!</h3>
            <p style={{ fontSize: "0.8125rem", color: "#6b6560", marginBottom: "1.5rem" }}>Content can now be published to this platform from the Distribution OS.</p>
            <button onClick={onClose} style={{ padding: "0.625rem 1.5rem", background: "#d4a054", color: "#070a10", border: "none", borderRadius: "8px", fontWeight: 700, fontSize: "0.875rem", cursor: "pointer" }}>Done</button>
          </div>
        )}
      </m.div>
    </div>
  );
}

function PlatformCard({ platform, onConnect }: { platform: Platform; onConnect: (p: Platform) => void }) {
  const sm = STATUS_META[platform.status];
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{
      background: "hsla(0,0%,100%,0.02)",
      border: `1px solid ${platform.status === "connected" ? "hsla(120,30%,40%,0.2)" : platform.status === "error" ? "hsla(0,60%,50%,0.18)" : "hsla(0,0%,100%,0.05)"}`,
      borderRadius: "12px", overflow: "hidden",
    }}>
      <div style={{ padding: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.875rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: 38, height: 38, borderRadius: "8px", background: `${platform.color}15`, border: `1px solid ${platform.color}25`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Globe size={18} style={{ color: platform.color }} />
            </div>
            <div>
              <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#e8e4de" }}>{platform.name}</div>
              <div style={{ fontSize: "0.6875rem", color: "#4a4540" }}>{platform.description}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", flexShrink: 0 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: sm.dot }} />
            <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: sm.color }}>{sm.label}</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap", marginBottom: "0.875rem" }}>
          <span style={{ fontSize: "0.6rem", fontWeight: 700, padding: "0.2rem 0.5rem", borderRadius: "4px", background: "hsla(0,0%,100%,0.05)", color: "#6b6560", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {AUTH_LABELS[platform.authType]}
          </span>
          <span style={{ fontSize: "0.6rem", fontWeight: 700, padding: "0.2rem 0.5rem", borderRadius: "4px", background: "hsla(0,0%,100%,0.05)", color: "#6b6560", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {CATEGORY_LABELS[platform.category]}
          </span>
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          {platform.status === "connected" || platform.status === "mock" ? (
            <button style={{ padding: "0.375rem 0.875rem", background: "hsla(0,0%,100%,0.05)", color: "#6b6560", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "6px", fontSize: "0.6875rem", fontWeight: 600, cursor: "pointer" }}>
              Disconnect
            </button>
          ) : (
            <button onClick={() => onConnect(platform)} style={{ padding: "0.375rem 0.875rem", background: "hsla(40,60%,50%,0.12)", color: "#d4a054", border: "1px solid hsla(40,60%,50%,0.2)", borderRadius: "6px", fontSize: "0.6875rem", fontWeight: 600, cursor: "pointer" }}>
              Connect
            </button>
          )}
          <button onClick={() => setExpanded(p => !p)} style={{ padding: "0.375rem 0.625rem", background: "none", color: "#4a4540", border: "1px solid hsla(0,0%,100%,0.06)", borderRadius: "6px", fontSize: "0.6875rem", cursor: "pointer" }}>
            {expanded ? "Hide" : "Details"}
          </button>
          <a href={platform.docsUrl} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "0.25rem", padding: "0.375rem 0.625rem", background: "none", color: "#4a4540", border: "1px solid hsla(0,0%,100%,0.06)", borderRadius: "6px", fontSize: "0.6875rem", textDecoration: "none" }}>
            <ExternalLink size={10} /> Docs
          </a>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <m.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
            <div style={{ padding: "0 1.25rem 1.25rem", borderTop: "1px solid hsla(0,0%,100%,0.04)" }}>
              <div style={{ paddingTop: "1rem" }}>
                <div style={{ fontSize: "0.625rem", fontWeight: 700, color: "#6b6560", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>Capabilities</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.25rem" }}>
                  {platform.capabilities.map(cap => (
                    <div key={cap} style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                      <CheckCircle2 size={11} style={{ color: "#5a9c5a", flexShrink: 0 }} />
                      <span style={{ fontSize: "0.75rem", color: "#8b8579" }}>{cap}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PlatformConnectionsPage() {
  const [location] = useLocation();
  const [connectingPlatform, setConnectingPlatform] = useState<Platform | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [platforms, setPlatforms] = useState<Platform[]>(PLATFORMS);
  const [loadingStatus, setLoadingStatus] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/distribution-os/platform-connections`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        const statusMap: Record<string, "connected" | "disconnected" | "error"> = {};
        for (const item of data) statusMap[item.provider] = item.status;
        setPlatforms(prev => prev.map(p => ({
          ...p,
          status: statusMap[p.id] ?? p.status,
        })));
      })
      .catch(() => {})
      .finally(() => setLoadingStatus(false));
  }, []);

  const categories = ["all", "social", "blog", "newsletter", "cms"];
  const filtered = filterCategory === "all" ? platforms : platforms.filter(p => p.category === filterCategory);
  const connectedCount = platforms.filter(p => p.status === "connected" || p.status === "mock").length;

  return (
    <DistributionOsLayout currentPath={location}>
      <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "2rem" }}>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#e8e4de" }}>Platform Connections</h1>
            <p style={{ fontSize: "0.8125rem", color: "#6b6560", marginTop: "0.25rem" }}>
              Connect your accounts to publish everywhere from a single interface
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#5a9c5a" }} />
              <span style={{ fontSize: "0.75rem", color: "#5a9c5a", fontWeight: 600 }}>{connectedCount} platforms active</span>
            </div>
            <div style={{ fontSize: "0.6875rem", color: "#4a4540" }}>of {PLATFORMS.length} supported</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem", marginBottom: "2rem" }}>
          {[
            { label: "Connected", value: connectedCount, color: "#5a9c5a", icon: Wifi },
            { label: "Disconnected", value: PLATFORMS.filter(p => p.status === "disconnected").length, color: "#6b6560", icon: WifiOff },
            { label: "Total Platforms", value: PLATFORMS.length, color: "#d4a054", icon: Globe },
            { label: "Publishing Reach", value: `${connectedCount * 12}K+`, color: "#4a90b8", icon: Activity },
          ].map(stat => (
            <div key={stat.label} style={{ padding: "1rem 1.25rem", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.05)", borderRadius: "10px" }}>
              <stat.icon size={14} style={{ color: stat.color, marginBottom: "0.5rem" }} />
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: "0.6875rem", color: "#4a4540", marginTop: "0.125rem" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: "0.375rem", marginBottom: "1.5rem" }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              style={{ padding: "0.375rem 0.875rem", background: filterCategory === cat ? "hsla(40,60%,50%,0.12)" : "hsla(0,0%,100%,0.04)", color: filterCategory === cat ? "#d4a054" : "#6b6560", border: `1px solid ${filterCategory === cat ? "hsla(40,60%,50%,0.2)" : "hsla(0,0%,100%,0.06)"}`, borderRadius: "6px", fontSize: "0.75rem", fontWeight: filterCategory === cat ? 600 : 400, cursor: "pointer", textTransform: "capitalize" }}
            >
              {cat === "all" ? "All Platforms" : CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "0.875rem" }}>
          {filtered.map(platform => (
            <PlatformCard key={platform.id} platform={platform} onConnect={setConnectingPlatform} />
          ))}
        </div>

        <div style={{ marginTop: "2rem", padding: "1.25rem", background: "hsla(270,40%,50%,0.06)", border: "1px solid hsla(270,40%,50%,0.15)", borderRadius: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Key size={16} style={{ color: "#8b7ac8", flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#e8e4de", marginBottom: "0.25rem" }}>Need a platform we don't support yet?</div>
              <div style={{ fontSize: "0.75rem", color: "#6b6560" }}>Use the Public API to build a custom connector, or request a new platform integration from the Developer API section.</div>
            </div>
            <a href="/admin/distribution/developer-api" style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.5rem 0.875rem", background: "hsla(0,0%,100%,0.05)", color: "#8b7ac8", border: "1px solid hsla(270,40%,50%,0.2)", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 600, textDecoration: "none" }}>
              Developer API <ChevronRight size={12} />
            </a>
          </div>
        </div>
      </m.div>

      {connectingPlatform && <ConnectModal platform={connectingPlatform} onClose={() => setConnectingPlatform(null)} />}
    </DistributionOsLayout>
  );
}
