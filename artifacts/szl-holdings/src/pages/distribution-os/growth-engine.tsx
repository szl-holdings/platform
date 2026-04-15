import { useState } from "react";
import { useLocation } from "wouter";
import { m, AnimatePresence } from "framer-motion";
import {
  Gift, Users, Mail, Tag, Share2, Star, TrendingUp, Copy, Check,
  Plus, Trash2, ChevronDown, ChevronUp, Zap, Globe, Target, BarChart3,
  Link2, CheckCircle2, ArrowUpRight,
} from "lucide-react";
import { DistributionOsLayout } from "./admin-dashboard";

const API = import.meta.env.VITE_API_URL || "";

interface Subscriber {
  id: number;
  email: string;
  source: string;
  segment: string;
  interests: string[];
  joined: string;
  engagementScore: number;
  referralCount: number;
}

interface ReferralTier {
  milestone: number;
  reward: string;
  achievers: number;
}

const SUBSCRIBER_DATA: Subscriber[] = [
  { id: 1, email: "stephen@szlholdings.com", source: "linkedin", segment: "power-user", interests: ["ai", "maritime"], joined: "2025-01-12", engagementScore: 98, referralCount: 5 },
  { id: 2, email: "alex.chen@techintel.io", source: "embed", segment: "engaged", interests: ["enterprise-tech", "ai"], joined: "2025-02-08", engagementScore: 82, referralCount: 2 },
  { id: 3, email: "marina.k@logisticsco.com", source: "x", segment: "engaged", interests: ["maritime", "supply-chain"], joined: "2025-03-01", engagementScore: 74, referralCount: 0 },
  { id: 4, email: "david.r@venture.com", source: "referral", segment: "engaged", interests: ["capital", "strategy"], joined: "2025-03-15", engagementScore: 68, referralCount: 1 },
  { id: 5, email: "sarah.m@enterprise.ai", source: "substack", segment: "new", interests: ["ai", "ops"], joined: "2025-04-10", engagementScore: 35, referralCount: 0 },
  { id: 6, email: "james.w@operator.co", source: "magic-link", segment: "new", interests: ["operations", "leadership"], joined: "2025-04-12", engagementScore: 22, referralCount: 0 },
];

const REFERRAL_TIERS: ReferralTier[] = [
  { milestone: 1, reward: "Exclusive Operator Playbook (PDF)", achievers: 48 },
  { milestone: 3, reward: "Private Slack Community Access", achievers: 18 },
  { milestone: 5, reward: "One 30-min Strategy Call", achievers: 7 },
  { milestone: 10, reward: "Annual SZL Insider Membership", achievers: 2 },
];

const SOURCE_COLORS: Record<string, string> = {
  linkedin: "#0a66c2", x: "#1a8cd8", embed: "#5a9c5a", substack: "#f05a28",
  referral: "#d4a054", "magic-link": "#8b7ac8", medium: "#e8e4de",
};

const SEGMENT_META: Record<string, { color: string; bg: string; label: string }> = {
  "power-user": { color: "#d4a054", bg: "hsla(38,65%,58%,0.1)", label: "Power User" },
  engaged: { color: "#5a9c5a", bg: "hsla(120,30%,40%,0.1)", label: "Engaged" },
  new: { color: "#4a90b8", bg: "hsla(210,50%,50%,0.1)", label: "New" },
  "at-risk": { color: "#c45a4a", bg: "hsla(0,60%,50%,0.1)", label: "At Risk" },
};

const CROSS_PROMO_PARTNERS = [
  { name: "Lyte Intelligence", desc: "AI-native ops for SMBs", subscribers: "2,400", match: 78 },
  { name: "Maritime Insider", desc: "Weekly fleet & freight intelligence", subscribers: "3,100", match: 72 },
  { name: "Operator Weekly", desc: "Tactical leadership for mid-market executives", subscribers: "4,200", match: 65 },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={{ display: "flex", alignItems: "center", gap: "0.25rem", padding: "0.3rem 0.5rem", background: "none", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "5px", color: copied ? "#5a9c5a" : "#4a4540", cursor: "pointer", fontSize: "0.6875rem" }}>
      {copied ? <Check size={11} /> : <Copy size={11} />}
    </button>
  );
}

function SubscriberRow({ sub }: { sub: Subscriber }) {
  const seg = SEGMENT_META[sub.segment] || SEGMENT_META.new;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.75rem 1rem", borderBottom: "1px solid hsla(0,0%,100%,0.04)" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#e8e4de" }}>{sub.email}</div>
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.125rem", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.6rem", fontWeight: 700, padding: "0.15rem 0.4rem", borderRadius: "3px", background: `${SOURCE_COLORS[sub.source] || "#4a4540"}15`, color: SOURCE_COLORS[sub.source] || "#4a4540" }}>{sub.source}</span>
          {sub.interests.map(i => <span key={i} style={{ fontSize: "0.6rem", color: "#4a4540" }}>#{i}</span>)}
        </div>
      </div>
      <div style={{ textAlign: "center", minWidth: 60 }}>
        <div style={{ fontSize: "0.875rem", fontWeight: 700, color: sub.engagementScore >= 80 ? "#5a9c5a" : sub.engagementScore >= 50 ? "#d4a054" : "#4a4540" }}>{sub.engagementScore}</div>
        <div style={{ fontSize: "0.5625rem", color: "#4a4540", textTransform: "uppercase" }}>Score</div>
      </div>
      <div style={{ textAlign: "center", minWidth: 50 }}>
        <div style={{ fontSize: "0.875rem", fontWeight: 700, color: sub.referralCount > 0 ? "#d4a054" : "#4a4540" }}>{sub.referralCount}</div>
        <div style={{ fontSize: "0.5625rem", color: "#4a4540", textTransform: "uppercase" }}>Refs</div>
      </div>
      <span style={{ fontSize: "0.6rem", fontWeight: 700, padding: "0.2rem 0.5rem", borderRadius: "4px", background: seg.bg, color: seg.color }}>{seg.label}</span>
      <span style={{ fontSize: "0.6875rem", color: "#4a4540", minWidth: 72 }}>{new Date(sub.joined).toLocaleDateString()}</span>
    </div>
  );
}

export default function GrowthEnginePage() {
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState<"referrals" | "subscribers" | "magic-link" | "cross-promo">("referrals");
  const [emailInput, setEmailInput] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [filterSegment, setFilterSegment] = useState("all");
  const [filterSource, setFilterSource] = useState("all");

  const referralLink = "https://szlholdings.com/r/STEPHEN42";

  const filteredSubs = SUBSCRIBER_DATA.filter(s => {
    if (filterSegment !== "all" && s.segment !== filterSegment) return false;
    if (filterSource !== "all" && s.source !== filterSource) return false;
    return true;
  });

  const totalSubs = SUBSCRIBER_DATA.length;
  const powerUsers = SUBSCRIBER_DATA.filter(s => s.segment === "power-user").length;
  const referralSubs = SUBSCRIBER_DATA.filter(s => s.source === "referral").length;
  const avgEngagement = Math.round(SUBSCRIBER_DATA.reduce((s, sub) => s + sub.engagementScore, 0) / SUBSCRIBER_DATA.length);

  const TABS = [
    { key: "referrals" as const, label: "Referral Program", icon: Share2 },
    { key: "subscribers" as const, label: "Subscriber Intelligence", icon: Users },
    { key: "magic-link" as const, label: "Magic Link Capture", icon: Zap },
    { key: "cross-promo" as const, label: "Cross-Promotion", icon: Globe },
  ];

  return (
    <DistributionOsLayout currentPath={location}>
      <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#e8e4de" }}>Growth Engine</h1>
          <p style={{ fontSize: "0.8125rem", color: "#6b6560", marginTop: "0.25rem" }}>
            Referral program · Subscriber intelligence · Magic link signup · Cross-promotion network
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem", marginBottom: "1.75rem" }}>
          {[
            { label: "Total Subscribers", value: totalSubs, color: "#d4a054", icon: Users },
            { label: "Power Users", value: powerUsers, color: "#5a9c5a", icon: Star },
            { label: "Via Referrals", value: referralSubs, color: "#8b7ac8", icon: Share2 },
            { label: "Avg Engagement", value: `${avgEngagement}/100`, color: "#4a90b8", icon: TrendingUp },
          ].map(stat => (
            <div key={stat.label} style={{ padding: "1.125rem 1.25rem", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.05)", borderRadius: "10px" }}>
              <stat.icon size={13} style={{ color: stat.color, marginBottom: "0.5rem" }} />
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: "0.6875rem", color: "#4a4540", marginTop: "0.125rem" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: "0.25rem", marginBottom: "1.75rem", borderBottom: "1px solid hsla(0,0%,100%,0.06)", paddingBottom: 0 }}>
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.625rem 1.25rem", background: "none", border: "none", borderBottom: activeTab === tab.key ? "2px solid #d4a054" : "2px solid transparent", color: activeTab === tab.key ? "#e8e4de" : "#6b6560", fontSize: "0.875rem", fontWeight: activeTab === tab.key ? 600 : 400, cursor: "pointer", marginBottom: "-1px" }}>
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "referrals" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ padding: "1.5rem", background: "hsla(38,65%,58%,0.05)", border: "1px solid hsla(38,65%,58%,0.15)", borderRadius: "12px" }}>
              <div style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#d4a054", textTransform: "uppercase", marginBottom: "0.875rem" }}>Your Referral Link</div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.875rem 1rem", background: "hsla(0,0%,0%,0.2)", border: "1px solid hsla(38,65%,58%,0.2)", borderRadius: "8px" }}>
                <Link2 size={14} style={{ color: "#d4a054", flexShrink: 0 }} />
                <code style={{ flex: 1, fontSize: "0.9375rem", color: "#e8e4de", fontFamily: "monospace" }}>{referralLink}</code>
                <CopyButton text={referralLink} />
                <a href={referralLink} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "0.25rem", padding: "0.375rem 0.625rem", background: "hsla(40,60%,50%,0.12)", border: "1px solid hsla(40,60%,50%,0.2)", borderRadius: "5px", color: "#d4a054", fontSize: "0.6875rem", textDecoration: "none", fontWeight: 600 }}>
                  Preview <ArrowUpRight size={11} />
                </a>
              </div>
              <p style={{ fontSize: "0.75rem", color: "#6b6560", marginTop: "0.625rem" }}>
                Each person who subscribes via your link is tracked. Share this in content, bio, or with readers directly.
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#e8e4de", marginBottom: "1rem" }}>Reward Milestones (Beehiiv-style Boosts)</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                {REFERRAL_TIERS.map((tier, i) => (
                  <div key={tier.milestone} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.25rem", background: i === 0 ? "hsla(38,65%,58%,0.05)" : "hsla(0,0%,100%,0.02)", border: `1px solid ${i === 0 ? "hsla(38,65%,58%,0.15)" : "hsla(0,0%,100%,0.05)"}`, borderRadius: "10px" }}>
                    <div style={{ width: 44, height: 44, borderRadius: "10px", background: i === 0 ? "hsla(38,65%,58%,0.12)" : "hsla(0,0%,100%,0.04)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: "1.125rem", fontWeight: 800, color: i === 0 ? "#d4a054" : "#6b6560" }}>{tier.milestone}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.5625rem", fontWeight: 700, color: "#4a4540", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.25rem" }}>{tier.milestone} referral{tier.milestone !== 1 ? "s" : ""}</div>
                      <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#e8e4de" }}>{tier.reward}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "1.125rem", fontWeight: 700, color: "#5a9c5a" }}>{tier.achievers}</div>
                      <div style={{ fontSize: "0.5625rem", color: "#4a4540", textTransform: "uppercase" }}>Achievers</div>
                    </div>
                    <Gift size={16} style={{ color: i === 0 ? "#d4a054" : "#4a4540", flexShrink: 0 }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "subscribers" && (
          <div>
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
              <select value={filterSegment} onChange={e => setFilterSegment(e.target.value)} style={{ padding: "0.375rem 0.75rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "6px", color: "#c8c2ba", fontSize: "0.75rem" }}>
                <option value="all">All Segments</option>
                {Object.entries(SEGMENT_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <select value={filterSource} onChange={e => setFilterSource(e.target.value)} style={{ padding: "0.375rem 0.75rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "6px", color: "#c8c2ba", fontSize: "0.75rem" }}>
                <option value="all">All Sources</option>
                {Object.keys(SOURCE_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <span style={{ fontSize: "0.75rem", color: "#4a4540", alignSelf: "center" }}>{filteredSubs.length} subscribers</span>
            </div>

            <div style={{ background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.06)", borderRadius: "10px", overflow: "hidden" }}>
              <div style={{ display: "flex", padding: "0.5rem 1rem", borderBottom: "1px solid hsla(0,0%,100%,0.05)" }}>
                <span style={{ flex: 1, fontSize: "0.5625rem", fontWeight: 700, color: "#4a4540", textTransform: "uppercase" }}>Subscriber</span>
                <span style={{ minWidth: 60, textAlign: "center", fontSize: "0.5625rem", fontWeight: 700, color: "#4a4540", textTransform: "uppercase" }}>Score</span>
                <span style={{ minWidth: 50, textAlign: "center", fontSize: "0.5625rem", fontWeight: 700, color: "#4a4540", textTransform: "uppercase" }}>Refs</span>
                <span style={{ minWidth: 80, fontSize: "0.5625rem", fontWeight: 700, color: "#4a4540", textTransform: "uppercase" }}>Segment</span>
                <span style={{ minWidth: 72, fontSize: "0.5625rem", fontWeight: 700, color: "#4a4540", textTransform: "uppercase" }}>Joined</span>
              </div>
              {filteredSubs.map(sub => <SubscriberRow key={sub.id} sub={sub} />)}
            </div>
          </div>
        )}

        {activeTab === "magic-link" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ padding: "1.5rem", background: "hsla(270,40%,50%,0.05)", border: "1px solid hsla(270,40%,50%,0.15)", borderRadius: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.875rem" }}>
                <Zap size={16} style={{ color: "#8b7ac8" }} />
                <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#e8e4de" }}>Magic Link Email Capture</h2>
              </div>
              <p style={{ fontSize: "0.8125rem", color: "#6b6560", lineHeight: 1.6, marginBottom: "1.25rem" }}>
                Readers enter their email and receive an instant magic link — no password, no friction. Works in embedded widgets, on any website, and directly in newsletters.
              </p>
              <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.875rem" }}>
                <input
                  type="email"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  placeholder="Enter email to test magic link..."
                  style={{ flex: 1, padding: "0.625rem 0.875rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.12)", borderRadius: "8px", color: "#e8e4de", fontSize: "0.875rem" }}
                />
                <button onClick={() => { if (emailInput) { setMagicLinkSent(true); setTimeout(() => setMagicLinkSent(false), 4000); } }} disabled={!emailInput} style={{ padding: "0.625rem 1.25rem", background: "#8b7ac8", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 700, fontSize: "0.875rem", cursor: "pointer", opacity: emailInput ? 1 : 0.5 }}>
                  Send Magic Link
                </button>
              </div>
              {magicLinkSent && (
                <m.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} style={{ padding: "0.75rem 1rem", background: "hsla(120,30%,40%,0.1)", border: "1px solid hsla(120,30%,40%,0.25)", borderRadius: "8px", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <CheckCircle2 size={14} style={{ color: "#5a9c5a" }} />
                  <span style={{ fontSize: "0.8125rem", color: "#5a9c5a" }}>Magic link sent to {emailInput}. No password needed.</span>
                </m.div>
              )}
            </div>

            <div>
              <h2 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#e8e4de", marginBottom: "0.875rem" }}>Embed Magic Link Capture</h2>
              <div style={{ background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.06)", borderRadius: "10px", overflow: "hidden" }}>
                <pre style={{ padding: "1rem", margin: 0, fontSize: "0.75rem", color: "#c8c2ba", overflowX: "auto", fontFamily: "monospace", lineHeight: 1.65 }}>
{`<script>
  (function(d, s) {
    var js = d.createElement(s);
    js.src = "https://szlholdings.com/widget.js";
    js.dataset.type = "newsletter-signup";
    js.dataset.theme = "dark";
    js.dataset.magicLink = "true";
    d.body.appendChild(js);
  }(document, 'script'));
</script>

<!-- Or use the iframe -->
<iframe
  src="https://szlholdings.com/embed/signup?magic=true"
  width="100%" height="200"
  frameborder="0"
></iframe>`}
                </pre>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
              {[
                { label: "Magic Links Sent", value: "148", color: "#8b7ac8", sub: "Last 30 days" },
                { label: "Conversion Rate", value: "68%", color: "#5a9c5a", sub: "Click-to-confirm" },
                { label: "Embed Installs", value: "12", color: "#d4a054", sub: "Active widget installs" },
              ].map(s => (
                <div key={s.label} style={{ padding: "1rem 1.25rem", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.05)", borderRadius: "8px" }}>
                  <div style={{ fontSize: "1.5rem", fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: "0.75rem", color: "#e8e4de", fontWeight: 600, marginTop: "0.25rem" }}>{s.label}</div>
                  <div style={{ fontSize: "0.6875rem", color: "#4a4540" }}>{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "cross-promo" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ padding: "1rem 1.25rem", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.06)", borderRadius: "10px" }}>
              <div style={{ fontSize: "0.75rem", color: "#6b6560", lineHeight: 1.6 }}>
                Cross-promotion lets you opt in to recommend other newsletters at the bottom of your content, and have your newsletter recommended in theirs. Audience match score ensures relevance.
              </div>
            </div>

            <div>
              <h2 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#e8e4de", marginBottom: "0.875rem" }}>Recommended Partners</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {CROSS_PROMO_PARTNERS.map(partner => (
                  <div key={partner.name} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1.25rem", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.06)", borderRadius: "10px" }}>
                    <div style={{ width: 48, height: 48, borderRadius: "10px", background: "hsla(0,0%,100%,0.05)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Globe size={20} style={{ color: "#d4a054" }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#e8e4de" }}>{partner.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "#6b6560" }}>{partner.desc}</div>
                      <div style={{ fontSize: "0.6875rem", color: "#4a4540", marginTop: "0.125rem" }}>{partner.subscribers} subscribers</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "1.25rem", fontWeight: 800, color: partner.match >= 70 ? "#5a9c5a" : "#d4a054" }}>{partner.match}%</div>
                      <div style={{ fontSize: "0.5625rem", color: "#4a4540", textTransform: "uppercase" }}>Audience Match</div>
                    </div>
                    <button style={{ padding: "0.5rem 1rem", background: "hsla(38,65%,58%,0.1)", border: "1px solid hsla(38,65%,58%,0.2)", borderRadius: "6px", color: "#d4a054", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}>
                      Partner
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: "1.25rem", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.06)", borderRadius: "10px" }}>
              <div style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#4a4540", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.875rem" }}>My Cross-Promo Slot (shown at bottom of all content)</div>
              <div style={{ padding: "1rem", background: "hsla(0,0%,100%,0.03)", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "8px", marginBottom: "0.875rem" }}>
                <div style={{ fontSize: "0.625rem", color: "#4a4540", textTransform: "uppercase", marginBottom: "0.5rem" }}>Preview</div>
                <div style={{ padding: "0.875rem", background: "#0b0f19", borderRadius: "8px", border: "1px solid hsla(0,0%,100%,0.08)" }}>
                  <div style={{ fontSize: "0.625rem", color: "#4a4540", textTransform: "uppercase", marginBottom: "0.5rem" }}>Recommended Reads</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{ fontSize: "0.8125rem", color: "#e8e4de" }}><strong>Maritime Insider</strong> — Weekly fleet & freight intelligence for operators</div>
                    <button style={{ padding: "0.25rem 0.75rem", background: "#d4a054", color: "#070a10", border: "none", borderRadius: "4px", fontSize: "0.6875rem", fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>Subscribe</button>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button style={{ padding: "0.5rem 1rem", background: "hsla(0,0%,100%,0.05)", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "6px", color: "#6b6560", fontSize: "0.75rem", cursor: "pointer" }}>Disable Cross-Promo</button>
                <button style={{ padding: "0.5rem 1rem", background: "#d4a054", border: "none", borderRadius: "6px", color: "#070a10", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}>Edit My Slot</button>
              </div>
            </div>
          </div>
        )}
      </m.div>
    </DistributionOsLayout>
  );
}
