import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Zap, Check, Play, FileText, Bell, Globe, Calendar, TrendingUp, Lock,
  ChevronRight, BarChart2, Clock, Anchor, Scale, Shield, Compass, ArrowRight,
  ExternalLink, CreditCard, AlertCircle, Sparkles
} from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "") || "/forge";

interface IntelligenceFeed {
  id: string;
  name: string;
  domain: string;
  frequency: string;
  description: string;
  deliveryFormat: string[];
  agents: string[];
  price: number;
  interval: "month" | "quarter";
  subscriberCount: number;
  nextDelivery: string;
  sampleAvailable: boolean;
  priceEnv: string;
  tags: string[];
  highlight?: string;
}

const FEEDS: IntelligenceFeed[] = [
  {
    id: "maritime-risk",
    name: "Weekly Maritime Risk Digest",
    domain: "Vessels",
    frequency: "Weekly",
    description: "Comprehensive maritime intelligence: flagged vessel movements, AIS dark periods, sanctions route analysis, port risk changes, and emerging choke point alerts. Curated by Helmsman + Sentinel, reviewed by human analysts.",
    deliveryFormat: ["PDF Report", "Secure Portal", "Email Summary"],
    agents: ["Helmsman v3", "Sentinel v4", "Beacon v3"],
    price: 1200,
    interval: "month",
    subscriberCount: 8,
    nextDelivery: "2026-04-15 (Tuesday)",
    sampleAvailable: true,
    priceEnv: "STRIPE_PRICE_INTEL_MARITIME_WEEKLY",
    tags: ["AIS", "sanctions", "vessel-tracking", "risk"],
    highlight: "Most subscribed",
  },
  {
    id: "property-pulse",
    name: "Monthly Property Market Pulse",
    domain: "Real Estate",
    frequency: "Monthly",
    description: "Distressed property pipeline, comparable transaction analysis, macro market risk indicators, zoning changes, and development opportunity scoring across SZL target regions.",
    deliveryFormat: ["PDF Report", "Excel Data Pack", "Secure Portal"],
    agents: ["Prospector v2", "Beacon v3"],
    price: 800,
    interval: "month",
    subscriberCount: 5,
    nextDelivery: "2026-05-01",
    sampleAvailable: true,
    priceEnv: "STRIPE_PRICE_INTEL_PROPERTY_MONTHLY",
    tags: ["property", "transactions", "market", "pipeline"],
  },
  {
    id: "legal-landscape",
    name: "Quarterly Legal Landscape Review",
    domain: "Legal",
    frequency: "Quarterly",
    description: "Regulatory shifts, case law developments, jurisdictional updates, and enforcement trend analysis across SZL's operating regions. Includes deadline calendars and exposure heat maps.",
    deliveryFormat: ["PDF Report", "Secure Portal"],
    agents: ["DocMiner v2", "Sentinel v4"],
    price: 1800,
    interval: "quarter",
    subscriberCount: 4,
    nextDelivery: "2026-07-01",
    sampleAvailable: false,
    priceEnv: "STRIPE_PRICE_INTEL_LEGAL_QUARTERLY",
    tags: ["regulatory", "compliance", "jurisdiction", "risk"],
  },
  {
    id: "threat-brief",
    name: "Weekly Security Threat Brief",
    domain: "Security",
    frequency: "Weekly",
    description: "Cyber threat intelligence, physical security advisories, OSINT-driven geopolitical risk signals, and SZL-relevant incident monitoring. CVE prioritization for SZL technology stack.",
    deliveryFormat: ["Secure Portal", "Encrypted Email"],
    agents: ["Sentinel v4", "Beacon v3"],
    price: 950,
    interval: "month",
    subscriberCount: 6,
    nextDelivery: "2026-04-15 (Tuesday)",
    sampleAvailable: true,
    priceEnv: "STRIPE_PRICE_INTEL_SECURITY_WEEKLY",
    tags: ["CVE", "OSINT", "threat-intel", "geopolitical"],
  },
];

const DOMAIN_ICON: Record<string, React.ComponentType<{className?: string}>> = {
  Vessels: Anchor,
  "Real Estate": Compass,
  Legal: Scale,
  Security: Shield,
};

const DOMAIN_COLOR: Record<string, string> = {
  Vessels: "var(--color-forge-vessels)",
  "Real Estate": "var(--color-forge-terra)",
  Legal: "var(--color-forge-legal)",
  Security: "var(--color-forge-security)",
};

interface SubscriptionStatus {
  feedId: string;
  subscribed: boolean;
  since?: string;
  nextRenewal?: string;
  runs: number;
}

const MOCK_SUBSCRIPTIONS: SubscriptionStatus[] = [
  { feedId: "maritime-risk", subscribed: true, since: "2026-01-15", nextRenewal: "2026-05-15", runs: 14 },
  { feedId: "threat-brief", subscribed: true, since: "2026-02-01", nextRenewal: "2026-05-01", runs: 10 },
];

function FeedCard({ feed, subscription, onSubscribe, onPreview }: {
  feed: IntelligenceFeed;
  subscription?: SubscriptionStatus;
  onSubscribe: (feed: IntelligenceFeed) => void;
  onPreview: (feed: IntelligenceFeed) => void;
}) {
  const Icon = DOMAIN_ICON[feed.domain] || Globe;
  const color = DOMAIN_COLOR[feed.domain] || "var(--color-forge-primary)";
  const subscribed = subscription?.subscribed;

  return (
    <div
      className={cn(
        "forge-card-elevated flex flex-col transition-all",
        subscribed && "ring-1",
      )}
      style={subscribed ? { ringColor: "var(--color-forge-primary)" } as React.CSSProperties : undefined}
    >
      {feed.highlight && (
        <div className="flex items-center gap-1.5 px-4 pt-3 text-xs font-600" style={{ color: "var(--color-forge-gold)" }}>
          <Sparkles className="w-3 h-3" /> {feed.highlight}
        </div>
      )}
      <div className="p-5 flex-1 flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: `color-mix(in srgb, ${color} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 25%, transparent)` }}
          >
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-display font-600 text-sm mb-0.5" style={{ color: "var(--color-forge-text)" }}>{feed.name}</div>
            <div className="flex items-center gap-2 text-xs" style={{ color: "var(--color-forge-text-muted)" }}>
              <Calendar className="w-3 h-3" /> {feed.frequency}
              <span>·</span>
              <span>{feed.domain}</span>
            </div>
          </div>
          {subscribed && (
            <span className="flex items-center gap-1 text-xs font-600 px-2 py-0.5 rounded-full" style={{ background: "color-mix(in srgb, var(--color-forge-success) 12%, transparent)", color: "var(--color-forge-success)", border: "1px solid color-mix(in srgb, var(--color-forge-success) 25%, transparent)" }}>
              <Check className="w-2.5 h-2.5" /> Active
            </span>
          )}
        </div>

        <p className="text-xs leading-relaxed" style={{ color: "var(--color-forge-text-muted)" }}>{feed.description}</p>

        <div className="flex flex-wrap gap-1">
          {feed.tags.map(t => (
            <span key={t} className="text-xs px-2 py-0.5 rounded-full border font-mono" style={{ color: "var(--color-forge-text-muted)", borderColor: "var(--color-forge-border)" }}>{t}</span>
          ))}
        </div>

        <div className="space-y-1.5">
          <div className="text-xs font-500 mb-2" style={{ color: "var(--color-forge-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Delivery</div>
          {feed.deliveryFormat.map(f => (
            <div key={f} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--color-forge-text)" }}>
              <Check className="w-3 h-3 flex-shrink-0" style={{ color: "var(--color-forge-success)" }} /> {f}
            </div>
          ))}
        </div>

        <div className="space-y-1.5">
          <div className="text-xs font-500 mb-2" style={{ color: "var(--color-forge-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Agents</div>
          {feed.agents.map(a => (
            <div key={a} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--color-forge-text)" }}>
              <Zap className="w-3 h-3 flex-shrink-0" style={{ color: "var(--color-forge-primary)" }} /> {a}
            </div>
          ))}
        </div>

        {subscribed && subscription && (
          <div className="p-3 rounded-lg" style={{ background: "hsla(210, 20%, 94%, 0.6)", border: "1px solid var(--color-forge-border)" }}>
            <div className="text-xs font-500 mb-2" style={{ color: "var(--color-forge-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Your Subscription</div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span style={{ color: "var(--color-forge-text-muted)" }}>Subscribed since</span>
                <span style={{ color: "var(--color-forge-text)" }} className="font-600">{subscription.since}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: "var(--color-forge-text-muted)" }}>Next renewal</span>
                <span style={{ color: "var(--color-forge-text)" }} className="font-600">{subscription.nextRenewal}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: "var(--color-forge-text-muted)" }}>Reports received</span>
                <span style={{ color: "var(--color-forge-text)" }} className="font-600">{subscription.runs}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: "var(--color-forge-text-muted)" }}>Next delivery</span>
                <span style={{ color: "var(--color-forge-text)" }} className="font-600">{feed.nextDelivery}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="px-5 pb-5 flex flex-col gap-2 border-t" style={{ borderColor: "var(--color-forge-border)", paddingTop: "1rem" }}>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-display font-700" style={{ color: "var(--color-forge-text)" }}>${feed.price.toLocaleString()}</span>
            <span className="text-sm" style={{ color: "var(--color-forge-text-muted)" }}>/{feed.interval}</span>
          </div>
          <span className="text-xs" style={{ color: "var(--color-forge-text-muted)" }}>{feed.subscriberCount} subscribers</span>
        </div>

        {!subscribed ? (
          <button
            onClick={() => onSubscribe(feed)}
            className="forge-btn-primary w-full text-sm"
          >
            <CreditCard className="w-3.5 h-3.5" />
            Subscribe
          </button>
        ) : (
          <button
            className="w-full flex items-center justify-center gap-2 py-2 text-sm font-500 rounded-lg border transition-all hover:bg-red-50"
            style={{ color: "var(--color-forge-text-muted)", borderColor: "var(--color-forge-border)" }}
          >
            Manage Subscription
          </button>
        )}
        {feed.sampleAvailable && (
          <button
            onClick={() => onPreview(feed)}
            className="w-full flex items-center justify-center gap-2 py-1.5 text-xs transition-all hover:opacity-80"
            style={{ color: "var(--color-forge-primary)" }}
          >
            <Play className="w-3 h-3" /> Preview sample report
          </button>
        )}
      </div>
    </div>
  );
}

function CheckoutModal({ feed, onClose }: { feed: IntelligenceFeed; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mockMode, setMockMode] = useState(false);

  async function handleCheckout() {
    if (!email) { setError("Please enter your email"); return; }
    setLoading(true);
    setError(null);

    try {
      const apiBase = import.meta.env.VITE_API_URL ?? "/api";
      const successUrl = `${window.location.origin}${BASE}/intelligence?session_id={CHECKOUT_SESSION_ID}&subscribed=${feed.id}`;
      const cancelUrl = `${window.location.origin}${BASE}/intelligence`;

      const resp = await fetch(`${apiBase}/billing/marketplace/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedId: feed.id,
          feedName: feed.name,
          email,
          successUrl,
          cancelUrl,
        }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        if (data.stripeMode === "mock" || data.mockMode) {
          setMockMode(true);
          return;
        }
        throw new Error(data.error ?? "Failed to initiate checkout");
      }

      if (data.data?.url) {
        window.location.href = data.data.url;
      } else {
        setMockMode(true);
      }
    } catch (err) {
      setMockMode(true);
    } finally {
      setLoading(false);
    }
  }

  const Icon = DOMAIN_ICON[feed.domain] || Globe;
  const color = DOMAIN_COLOR[feed.domain] || "var(--color-forge-primary)";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md mx-4 rounded-2xl shadow-2xl"
        style={{ background: "var(--color-forge-surface)", border: "1px solid var(--color-forge-border)" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5 border-b" style={{ borderColor: "var(--color-forge-border)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `color-mix(in srgb, ${color} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 25%, transparent)` }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div>
              <div className="font-display font-600 text-sm" style={{ color: "var(--color-forge-text)" }}>Subscribe to {feed.name}</div>
              <div className="text-xs" style={{ color: "var(--color-forge-text-muted)" }}>${feed.price.toLocaleString()}/{feed.interval} · Secured by Stripe</div>
            </div>
            <button onClick={onClose} className="ml-auto text-lg leading-none" style={{ color: "var(--color-forge-text-muted)" }}>✕</button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {mockMode ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <div className="font-display font-600 mb-1" style={{ color: "var(--color-forge-text)" }}>Subscription Request Received</div>
              <div className="text-xs" style={{ color: "var(--color-forge-text-muted)" }}>
                Your relationship manager will contact you to finalize billing setup. Live Stripe integration activates when keys are configured.
              </div>
              <button onClick={onClose} className="forge-btn-primary mt-4">Close</button>
            </div>
          ) : (
            <>
              <div className="p-3 rounded-lg text-xs" style={{ background: "hsla(210, 20%, 94%, 0.6)", border: "1px solid var(--color-forge-border)" }}>
                <div className="flex items-start gap-2">
                  <Lock className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: "var(--color-forge-success)" }} />
                  <span style={{ color: "var(--color-forge-text-muted)" }}>
                    Encrypted checkout via Stripe. First delivery within {feed.frequency.toLowerCase()} cycle.
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-500 mb-1" style={{ color: "var(--color-forge-text-muted)" }}>Your Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@yourcompany.com"
                  className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none"
                  style={{ border: "1px solid var(--color-forge-border)", background: "var(--color-forge-surface)", color: "var(--color-forge-text)" }}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-xs text-red-600">
                  <AlertCircle className="w-3 h-3" /> {error}
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span style={{ color: "var(--color-forge-text-muted)" }}>Subscription</span>
                  <span style={{ color: "var(--color-forge-text)" }} className="font-600">{feed.name}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: "var(--color-forge-text-muted)" }}>Frequency</span>
                  <span style={{ color: "var(--color-forge-text)" }}>{feed.frequency}</span>
                </div>
                <div className="flex justify-between text-xs border-t pt-2" style={{ borderColor: "var(--color-forge-border)" }}>
                  <span style={{ color: "var(--color-forge-text)" }} className="font-600">Total</span>
                  <span style={{ color: "var(--color-forge-text)" }} className="font-700 font-display">${feed.price.toLocaleString()}/{feed.interval}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={loading}
                className="forge-btn-primary w-full"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><CreditCard className="w-4 h-4" /> Proceed to Checkout</>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SampleModal({ feed, onClose }: { feed: IntelligenceFeed; onClose: () => void }) {
  const Icon = DOMAIN_ICON[feed.domain] || Globe;
  const color = DOMAIN_COLOR[feed.domain] || "var(--color-forge-primary)";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-2xl mx-4 rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: "var(--color-forge-surface)", border: "1px solid var(--color-forge-border)" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5 border-b" style={{ borderColor: "var(--color-forge-border)", background: "hsla(210, 20%, 94%, 0.6)" }}>
          <div className="flex items-center gap-3">
            <Icon className="w-5 h-5" style={{ color }} />
            <div className="font-display font-600" style={{ color: "var(--color-forge-text)" }}>Sample: {feed.name}</div>
            <button onClick={onClose} className="ml-auto" style={{ color: "var(--color-forge-text-muted)" }}>✕</button>
          </div>
        </div>
        <div className="p-5 max-h-[60vh] overflow-y-auto">
          <div className="text-xs font-mono mb-4" style={{ color: "var(--color-forge-text-muted)" }}>
            SAMPLE REPORT — For illustration only · {new Date().toDateString()}
          </div>
          <div className="space-y-4">
            <div className="p-4 rounded-lg" style={{ border: "1px solid var(--color-forge-border)" }}>
              <div className="font-display font-600 mb-2" style={{ color: "var(--color-forge-text)" }}>Executive Summary</div>
              <p className="text-sm leading-relaxed" style={{ color: "var(--color-forge-text-muted)" }}>
                This {feed.frequency.toLowerCase()} intelligence report covers the {feed.domain} domain for the period ending {new Date().toDateString()}.
                {feed.agents.length} specialized AI agents analyzed over 12,000 data points across primary, secondary, and open-source intelligence streams.
                {feed.id === "maritime-risk" ? " Seven vessels flagged for enhanced due diligence. Three new AIS anomalies detected in the Strait of Malacca corridor." : ""}
                {feed.id === "property-pulse" ? " 14 distressed properties identified in target acquisition zones. Cap rate compression of 42bps observed in suburban commercial." : ""}
                {feed.id === "threat-brief" ? " 3 critical CVEs affecting SZL technology stack. Geopolitical risk elevated across 2 operating regions." : ""}
                {feed.id === "legal-landscape" ? " 6 regulatory changes with direct impact on SZL operations. 2 enforcement trend escalations flagged." : ""}
              </p>
            </div>
            {["Key Findings", "Risk Indicators", "Recommended Actions"].map(section => (
              <div key={section} className="p-4 rounded-lg" style={{ border: "1px solid var(--color-forge-border)" }}>
                <div className="font-600 text-sm mb-2" style={{ color: "var(--color-forge-text)" }}>{section}</div>
                <div className="space-y-1.5">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--color-forge-text-muted)" }}>
                      <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color }} />
                      <span>Sample {section.toLowerCase()} item {i} — actual content delivered to subscribers</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 border-t flex justify-end" style={{ borderColor: "var(--color-forge-border)" }}>
          <button onClick={onClose} className="forge-btn-secondary mr-2 text-sm">Close</button>
        </div>
      </div>
    </div>
  );
}

export default function IntelligenceSubscriptions() {
  const [checkoutFeed, setCheckoutFeed] = useState<IntelligenceFeed | null>(null);
  const [previewFeed, setPreviewFeed] = useState<IntelligenceFeed | null>(null);
  const [filter, setFilter] = useState<string>("All");

  const subscriptions = MOCK_SUBSCRIPTIONS;
  const domains = ["All", ...Array.from(new Set(FEEDS.map(f => f.domain)))];
  const filtered = filter === "All" ? FEEDS : FEEDS.filter(f => f.domain === filter);
  const activeCount = subscriptions.filter(s => s.subscribed).length;

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "var(--color-forge-bg)" }}>
      {checkoutFeed && <CheckoutModal feed={checkoutFeed} onClose={() => setCheckoutFeed(null)} />}
      {previewFeed && <SampleModal feed={previewFeed} onClose={() => setPreviewFeed(null)} />}

      <div className="px-6 py-5 border-b" style={{ background: "var(--color-forge-surface)", borderColor: "var(--color-forge-border)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display font-700 text-xl" style={{ color: "var(--color-forge-text)" }}>Intelligence Subscriptions</h1>
              <p className="text-sm mt-0.5" style={{ color: "var(--color-forge-text-muted)" }}>
                Subscribe to automated intelligence feeds delivered by SZL's AI agent fleet
              </p>
            </div>
            <div className="text-right">
              <div className="text-lg font-display font-700" style={{ color: "var(--color-forge-primary)" }}>{activeCount}</div>
              <div className="text-xs" style={{ color: "var(--color-forge-text-muted)" }}>Active subscriptions</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 py-5 max-w-5xl mx-auto w-full">
        {activeCount > 0 && (
          <div className="mb-5 p-4 rounded-xl" style={{ background: "color-mix(in srgb, var(--color-forge-primary) 6%, transparent)", border: "1px solid color-mix(in srgb, var(--color-forge-primary) 18%, transparent)" }}>
            <div className="flex items-center gap-2 mb-2">
              <Bell className="w-4 h-4" style={{ color: "var(--color-forge-primary)" }} />
              <span className="text-sm font-600" style={{ color: "var(--color-forge-text)" }}>Active Intelligence Feeds</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {subscriptions.filter(s => s.subscribed).map(s => {
                const feed = FEEDS.find(f => f.id === s.feedId)!;
                return (
                  <div key={s.feedId} className="flex items-center justify-between text-xs">
                    <span style={{ color: "var(--color-forge-text)" }}>{feed?.name}</span>
                    <span style={{ color: "var(--color-forge-text-muted)" }}>Next: {feed?.nextDelivery}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 mb-5">
          {domains.map(d => (
            <button
              key={d}
              onClick={() => setFilter(d)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-500 border transition-all", filter === d ? "text-white" : "")}
              style={filter === d ? { background: "var(--color-forge-primary)", borderColor: "var(--color-forge-primary)" } : { background: "transparent", borderColor: "var(--color-forge-border)", color: "var(--color-forge-text-muted)" }}
            >
              {d}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map(feed => (
            <FeedCard
              key={feed.id}
              feed={feed}
              subscription={subscriptions.find(s => s.feedId === feed.id)}
              onSubscribe={setCheckoutFeed}
              onPreview={setPreviewFeed}
            />
          ))}
        </div>

        <div className="mt-6 p-4 rounded-xl text-xs flex items-start gap-3" style={{ background: "hsla(210, 20%, 94%, 0.6)", border: "1px solid var(--color-forge-border)" }}>
          <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "var(--color-forge-primary)" }} />
          <div style={{ color: "var(--color-forge-text-muted)" }}>
            <span className="font-600" style={{ color: "var(--color-forge-text)" }}>Custom intelligence feeds </span>
            available on request. Contact your SZL relationship manager to configure domain-specific briefings, delivery schedules, and coverage scopes.
          </div>
        </div>
      </div>
    </div>
  );
}
