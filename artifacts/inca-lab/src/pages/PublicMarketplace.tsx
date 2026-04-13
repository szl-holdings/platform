import { useState } from "react";
import { cn } from "../lib/utils";
import {
  ShoppingBag, Search, Star, Shield, BarChart3, Check, Play, Download, Globe,
  Anchor, Compass, Server, Brain, DollarSign, Award, Package, Layers, Zap,
  TrendingUp, Users, Lock, ChevronRight, Eye, Plus, Tag, Clock, ExternalLink,
  MessageSquare, Upload
} from "lucide-react";

type PricingModel = "free" | "per-run" | "subscription" | "enterprise";
type ListingType = "agent" | "model" | "skill" | "workflow";

interface MarketListing {
  id: string;
  name: string;
  creator: string;
  type: ListingType;
  domain: string;
  description: string;
  longDescription?: string;
  version: string;
  pricing: PricingModel;
  price?: number;
  featured?: boolean;
  verified: boolean;
  aibomAvailable: boolean;
  securityScanPassed: boolean;
  rating: number;
  reviews: number;
  deployments: number;
  successRate: number;
  avgLatency: number;
  tags: string[];
  whiteLabelAvailable: boolean;
  revenueShare: number;
  collection: string;
}

const LISTINGS: MarketListing[] = [
  {
    id: "sentinel-public", name: "Sentinel Security Agent", creator: "Alloy Core",
    type: "agent", domain: "Security", version: "4.1.0",
    description: "Advanced threat detection with OFAC screening, CVE correlation, and maker-checker validation.",
    longDescription: "Production-grade security monitoring agent with 99.1% success rate across 38 deployments. Includes full AIBOM, passing security scan, and SLA-backed performance.",
    pricing: "per-run", price: 0.042, featured: true, verified: true,
    aibomAvailable: true, securityScanPassed: true, rating: 4.9, reviews: 142,
    deployments: 38, successRate: 99.1, avgLatency: 890,
    tags: ["threat-intel", "OFAC", "maker-checker", "audit"], whiteLabelAvailable: true, revenueShare: 70,
    collection: "Defense Ops",
  },
  {
    id: "helmsman-public", name: "Helmsman Maritime AI", creator: "Alloy Core",
    type: "agent", domain: "Maritime", version: "3.2.4",
    description: "End-to-end maritime intelligence: AIS dark period detection, vessel ownership resolution, sanctions route analysis.",
    pricing: "per-run", price: 0.071, featured: true, verified: true,
    aibomAvailable: true, securityScanPassed: true, rating: 4.8, reviews: 87,
    deployments: 24, successRate: 97.3, avgLatency: 1240,
    tags: ["AIS", "vessels", "sanctions", "maritime"], whiteLabelAvailable: true, revenueShare: 70,
    collection: "Maritime Intelligence",
  },
  {
    id: "docminer-public", name: "DocMiner Legal Parser", creator: "SZL Legal AI",
    type: "agent", domain: "Legal", version: "2.5.1",
    description: "High-throughput legal document parsing. Extracts deadlines, obligations, counterparties, and risk flags.",
    pricing: "subscription", price: 299, verified: true,
    aibomAvailable: true, securityScanPassed: true, rating: 4.7, reviews: 63,
    deployments: 19, successRate: 94.8, avgLatency: 2100,
    tags: ["contracts", "deadlines", "NLP", "legal"], whiteLabelAvailable: false, revenueShare: 60,
    collection: "Legal AI",
  },
  {
    id: "beacon-public", name: "Beacon KPI Anomaly Detector", creator: "Alloy Analytics",
    type: "agent", domain: "Analytics", version: "3.0.1",
    description: "Multi-dimensional anomaly detection across KPI streams with 3σ thresholds, trend forecasting, and automated alerting.",
    pricing: "per-run", price: 0.028, featured: true, verified: true,
    aibomAvailable: true, securityScanPassed: true, rating: 4.8, reviews: 91,
    deployments: 31, successRate: 98.4, avgLatency: 650,
    tags: ["anomaly", "KPI", "alerting", "telemetry"], whiteLabelAvailable: true, revenueShare: 70,
    collection: "Analytics Suite",
  },
  {
    id: "maritime-risk-model", name: "Maritime Risk LoRA v2", creator: "Alloy Core",
    type: "model", domain: "Maritime", version: "2.0.0",
    description: "Fine-tuned Llama 3.1 8B on 12.4K maritime risk samples. +18.2% improvement over base on domain benchmark.",
    pricing: "subscription", price: 99, verified: true,
    aibomAvailable: true, securityScanPassed: true, rating: 4.6, reviews: 28,
    deployments: 14, successRate: 96.0, avgLatency: 380,
    tags: ["fine-tuned", "maritime", "lora", "llama"], whiteLabelAvailable: false, revenueShare: 65,
    collection: "Maritime Intelligence",
  },
  {
    id: "sanctions-skill", name: "OFAC Sanctions Screener", creator: "Compliance AI Lab",
    type: "skill", domain: "Security", version: "1.2.0",
    description: "Standalone OFAC/UN sanctions screening skill. Drop into any agent. 98.7% entity match accuracy with confidence scoring.",
    pricing: "free", verified: true,
    aibomAvailable: true, securityScanPassed: true, rating: 4.5, reviews: 44,
    deployments: 89, successRate: 98.7, avgLatency: 120,
    tags: ["OFAC", "sanctions", "compliance", "skill"], whiteLabelAvailable: false, revenueShare: 0,
    collection: "Defense Ops",
  },
  {
    id: "prospector-public", name: "Prospector Real Estate AI", creator: "Terra Intelligence",
    type: "agent", domain: "Real Estate", version: "2.1.0",
    description: "Distressed property identification, automated due diligence scoring, comparable sales analysis, and market risk.",
    pricing: "per-run", price: 0.055, verified: true,
    aibomAvailable: true, securityScanPassed: false, rating: 4.6, reviews: 44,
    deployments: 12, successRate: 96.2, avgLatency: 1580,
    tags: ["property", "due-diligence", "real-estate"], whiteLabelAvailable: true, revenueShare: 65,
    collection: "Real Estate Analytics",
  },
  {
    id: "maritime-workflow", name: "Vessel Intelligence Workflow", creator: "Alloy Core",
    type: "workflow", domain: "Maritime", version: "1.0.0",
    description: "Complete vessel investigation pipeline: AIS → ownership resolution → sanctions check → risk scoring → report generation.",
    pricing: "subscription", price: 499, featured: true, verified: true,
    aibomAvailable: true, securityScanPassed: true, rating: 4.9, reviews: 21,
    deployments: 8, successRate: 97.8, avgLatency: 4200,
    tags: ["workflow", "vessel", "maritime", "pipeline"], whiteLabelAvailable: true, revenueShare: 70,
    collection: "Maritime Intelligence",
  },
];

const COLLECTIONS = ["All", "Maritime Intelligence", "Legal AI", "Defense Ops", "Real Estate Analytics", "Analytics Suite"];
const TYPES: ListingType[] = ["agent", "model", "skill", "workflow"];
const PRICING_OPTIONS: PricingModel[] = ["free", "per-run", "subscription", "enterprise"];

const DOMAIN_ICON: Record<string, React.ComponentType<{className?: string}>> = {
  Maritime: Anchor, Security: Shield, Legal: BarChart3, "Real Estate": Compass,
  Analytics: TrendingUp, Infrastructure: Server, default: Brain,
};

const DOMAIN_COLOR: Record<string, string> = {
  Maritime: "#3b82f6", Security: "#f43f5e", Legal: "#f59e0b", "Real Estate": "#22d3ee",
  Analytics: "#10b981", Infrastructure: "#f97316",
};

const TYPE_BADGE: Record<ListingType, { label: string; color: string }> = {
  agent: { label: "Agent", color: "#7c3aed" },
  model: { label: "Model", color: "#22c55e" },
  skill: { label: "Skill", color: "#f97316" },
  workflow: { label: "Workflow", color: "#60a5fa" },
};

const PRICING_DISPLAY: Record<PricingModel, string> = {
  free: "Free",
  "per-run": "Per Run",
  subscription: "Subscription",
  enterprise: "Enterprise",
};

function PricingLabel({ listing }: { listing: MarketListing }) {
  if (listing.pricing === "free") return <span className="text-emerald-400 font-semibold text-xs">Free</span>;
  if (listing.pricing === "per-run") return <span className="text-foreground font-mono text-xs">${listing.price?.toFixed(3)}/run</span>;
  if (listing.pricing === "subscription") return <span className="text-foreground font-mono text-xs">${listing.price}/mo</span>;
  return <span className="text-muted-foreground text-xs">Enterprise</span>;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={cn("w-3 h-3", i <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-border")} />
      ))}
    </div>
  );
}

function ListingCard({ listing, onDeploy, onView }: {
  listing: MarketListing;
  onDeploy: (id: string) => void;
  onView: (listing: MarketListing) => void;
}) {
  const Icon = DOMAIN_ICON[listing.domain] || Brain;
  const color = DOMAIN_COLOR[listing.domain] || "#7c3aed";
  const typeBadge = TYPE_BADGE[listing.type];

  return (
    <div className={cn("inca-panel p-4 flex flex-col gap-3 hover:border-primary/30 transition-all cursor-pointer", listing.featured && "border-primary/20")}>
      {listing.featured && (
        <div className="flex items-center gap-1 text-xs text-primary font-medium">
          <Award className="w-3 h-3" /> Featured
        </div>
      )}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="text-sm font-semibold text-foreground">{listing.name}</span>
            {listing.verified && (
              <span className="flex items-center gap-0.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                <Check className="w-2.5 h-2.5" /> Verified
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs px-1.5 py-0.5 rounded border font-medium" style={{ background: `${typeBadge.color}15`, color: typeBadge.color, borderColor: `${typeBadge.color}30` }}>
              {typeBadge.label}
            </span>
            <span className="text-xs text-muted-foreground">{listing.domain} · v{listing.version}</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{listing.description}</p>

      <div className="flex flex-wrap gap-1">
        {listing.tags.slice(0, 4).map(t => (
          <span key={t} className="text-xs font-mono bg-secondary border border-border rounded px-1.5 py-0.5 text-muted-foreground">{t}</span>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-2 py-2 border-y border-border/40">
        <div className="text-center">
          <div className="text-sm font-mono font-bold text-foreground">{listing.successRate}%</div>
          <div className="text-xs text-muted-foreground">Success</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-mono font-bold text-foreground">{listing.avgLatency}ms</div>
          <div className="text-xs text-muted-foreground">Latency</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-mono font-bold text-foreground">{listing.deployments}</div>
          <div className="text-xs text-muted-foreground">Deploys</div>
        </div>
        <div className="text-center">
          <PricingLabel listing={listing} />
          <div className="text-xs text-muted-foreground">{PRICING_DISPLAY[listing.pricing]}</div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <StarRating rating={listing.rating} />
          <span className="text-xs text-muted-foreground">{listing.rating} ({listing.reviews})</span>
        </div>
        <div className="flex items-center gap-1.5">
          {listing.aibomAvailable && (
            <span className="text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded">AIBOM</span>
          )}
          {listing.whiteLabelAvailable && (
            <span className="text-xs text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded">White-label</span>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onDeploy(listing.id)}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors"
        >
          <Download className="w-3 h-3" /> Deploy
        </button>
        <button
          onClick={() => onView(listing)}
          className="px-3 py-1.5 bg-secondary text-muted-foreground hover:text-foreground rounded-lg text-xs transition-colors flex items-center gap-1"
        >
          <Eye className="w-3 h-3" /> Details
        </button>
      </div>
    </div>
  );
}

function ListingDetailModal({ listing, onClose, onDeploy }: { listing: MarketListing; onClose: () => void; onDeploy: (id: string) => void }) {
  const Icon = DOMAIN_ICON[listing.domain] || Brain;
  const color = DOMAIN_COLOR[listing.domain] || "#7c3aed";
  const [tab, setTab] = useState<"overview" | "security" | "reviews">("overview");

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl mx-4 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 p-5 border-b border-border">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
          <div>
            <div className="font-display font-semibold text-foreground">{listing.name}</div>
            <div className="text-xs text-muted-foreground">{listing.creator} · {listing.domain} · v{listing.version}</div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {listing.verified && (
              <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded">
                <Check className="w-3 h-3" /> Verified
              </span>
            )}
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg leading-none">✕</button>
          </div>
        </div>

        <div className="flex gap-1 px-5 pt-4 border-b border-border">
          {(["overview", "security", "reviews"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={cn("px-3 py-1.5 text-xs font-medium rounded-t-md capitalize transition-all", tab === t ? "bg-secondary text-foreground border-t border-x border-border" : "text-muted-foreground hover:text-foreground")}>
              {t === "security" ? "Security & AIBOM" : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-4 max-h-96 overflow-y-auto">
          {tab === "overview" && (
            <>
              <p className="text-sm text-muted-foreground leading-relaxed">{listing.longDescription || listing.description}</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Creator", value: listing.creator },
                  { label: "Pricing", value: `${PRICING_DISPLAY[listing.pricing]}${listing.price ? ` — $${listing.pricing === "per-run" ? listing.price?.toFixed(3) + "/run" : listing.price + "/mo"}` : ""}` },
                  { label: "Success Rate", value: `${listing.successRate}%` },
                  { label: "Avg Latency", value: `${listing.avgLatency}ms` },
                  { label: "Total Deployments", value: String(listing.deployments) },
                  { label: "Revenue Share", value: `${listing.revenueShare}% to creator` },
                  { label: "White-label", value: listing.whiteLabelAvailable ? "Available" : "Not available" },
                  { label: "Rating", value: `${listing.rating}/5 (${listing.reviews} reviews)` },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-secondary rounded-lg p-3">
                    <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
                    <div className="text-sm font-medium text-foreground">{value}</div>
                  </div>
                ))}
              </div>
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="text-xs font-medium text-primary mb-1">Collection: {listing.collection}</div>
                <div className="text-xs text-muted-foreground">Domain-curated collection with related listings and compatible dependencies.</div>
              </div>
            </>
          )}

          {tab === "security" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className={cn("p-3 rounded-lg border", listing.aibomAvailable ? "bg-emerald-500/5 border-emerald-500/20" : "bg-secondary border-border")}>
                  <div className="flex items-center gap-2 mb-1">
                    {listing.aibomAvailable ? <Check className="w-4 h-4 text-emerald-400" /> : <Shield className="w-4 h-4 text-muted-foreground" />}
                    <span className="text-xs font-medium text-foreground">AI Bill of Materials</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{listing.aibomAvailable ? "AIBOM available — full provenance chain" : "Not available"}</div>
                </div>
                <div className={cn("p-3 rounded-lg border", listing.securityScanPassed ? "bg-emerald-500/5 border-emerald-500/20" : "bg-amber-500/5 border-amber-500/20")}>
                  <div className="flex items-center gap-2 mb-1">
                    {listing.securityScanPassed ? <Check className="w-4 h-4 text-emerald-400" /> : <Shield className="w-4 h-4 text-amber-400" />}
                    <span className="text-xs font-medium text-foreground">Security Scan</span>
                  </div>
                  <div className={cn("text-xs", listing.securityScanPassed ? "text-emerald-400" : "text-amber-400")}>
                    {listing.securityScanPassed ? "All checks passed" : "Scan pending review"}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { label: "Prompt injection resistance", ok: true },
                  { label: "No credentials in bundle", ok: true },
                  { label: "Dependency vulnerability scan", ok: listing.securityScanPassed },
                  { label: "License compliance check", ok: true },
                  { label: "Data exfiltration prevention", ok: listing.securityScanPassed },
                ].map(({ label, ok }) => (
                  <div key={label} className="flex items-center gap-2.5">
                    {ok ? <Check className="w-4 h-4 text-emerald-400" /> : <Shield className="w-4 h-4 text-amber-400" />}
                    <span className={cn("text-xs", ok ? "text-foreground" : "text-muted-foreground")}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "reviews" && (
            <div className="space-y-3">
              <div className="flex items-center gap-4 p-3 bg-secondary rounded-lg">
                <div className="text-3xl font-display font-bold text-foreground">{listing.rating}</div>
                <div>
                  <StarRating rating={listing.rating} />
                  <div className="text-xs text-muted-foreground mt-0.5">{listing.reviews} verified deployments</div>
                </div>
              </div>
              {[
                { user: "Maritime Analyst", rating: 5, comment: "Exceptional accuracy on AIS dark period detection. Reduced manual review time by 70%.", verified: true },
                { user: "Compliance Lead", rating: 5, comment: "Sanctions screening accuracy is outstanding. Has caught edge cases our previous tool missed.", verified: true },
                { user: "Data Scientist", rating: 4, comment: "Very solid performance. Latency is higher than expected but the results quality justifies it.", verified: true },
              ].slice(0, 3).map((review, i) => (
                <div key={i} className="p-3 bg-secondary rounded-lg border border-border">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary font-bold">{review.user[0]}</div>
                    <span className="text-xs font-medium text-foreground">{review.user}</span>
                    {review.verified && <span className="text-xs text-emerald-400">✓ Verified Deploy</span>}
                    <div className="ml-auto flex gap-0.5">
                      {[1,2,3,4,5].map(s => <Star key={s} className={cn("w-3 h-3", s <= review.rating ? "text-amber-400 fill-amber-400" : "text-border")} />)}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-5 border-t border-border flex gap-3">
          <button
            onClick={() => { onDeploy(listing.id); onClose(); }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Download className="w-4 h-4" /> Deploy to Environment
          </button>
          {listing.whiteLabelAvailable && (
            <button className="px-4 py-2.5 bg-secondary text-muted-foreground rounded-lg text-sm hover:text-foreground transition-colors flex items-center gap-1.5">
              <Package className="w-4 h-4" /> White-label
            </button>
          )}
          <button onClick={onClose} className="px-4 py-2.5 bg-secondary text-muted-foreground rounded-lg text-sm hover:text-foreground transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function PublishListingModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<"form" | "success">("form");
  const [name, setName] = useState("");
  const [type, setType] = useState<ListingType>("agent");
  const [pricing, setPricing] = useState<PricingModel>("per-run");
  const [price, setPrice] = useState("");

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl w-full max-w-lg mx-4 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 p-5 border-b border-border">
          <Upload className="w-5 h-5 text-primary" />
          <div className="font-display font-semibold text-foreground">Publish to Marketplace</div>
          <button onClick={onClose} className="ml-auto text-muted-foreground hover:text-foreground text-lg leading-none">✕</button>
        </div>
        {step === "form" ? (
          <div className="p-5 space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Listing Name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="My Agent Name" className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Type</label>
              <div className="grid grid-cols-4 gap-2">
                {TYPES.map(t => (
                  <button key={t} onClick={() => setType(t)} className={cn("py-2 rounded-lg border text-xs font-medium capitalize transition-all", type === t ? "border-primary/35 bg-primary/8 text-primary" : "border-border text-muted-foreground hover:text-foreground")}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Pricing Model</label>
              <div className="grid grid-cols-2 gap-2">
                {PRICING_OPTIONS.map(p => (
                  <button key={p} onClick={() => setPricing(p)} className={cn("py-2 rounded-lg border text-xs font-medium transition-all", pricing === p ? "border-primary/35 bg-primary/8 text-primary" : "border-border text-muted-foreground hover:text-foreground")}>
                    {PRICING_DISPLAY[p]}
                  </button>
                ))}
              </div>
            </div>
            {(pricing === "per-run" || pricing === "subscription") && (
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">
                  Price {pricing === "per-run" ? "(per run, USD)" : "(monthly, USD)"}
                </label>
                <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder={pricing === "per-run" ? "0.05" : "99"} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:border-primary/40" />
              </div>
            )}
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-xs text-muted-foreground">
              Platform takes 30% · Creator receives 70% on sales. Security scan and AIBOM generation run automatically on publish.
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => name && setStep("success")}
                disabled={!name}
                className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" /> Publish Listing
              </button>
              <button onClick={onClose} className="px-4 py-2.5 bg-secondary text-muted-foreground rounded-lg text-sm hover:text-foreground transition-colors">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <Check className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="font-semibold text-foreground mb-1">Listing Submitted!</div>
            <div className="text-sm text-muted-foreground mb-1">{name}</div>
            <div className="text-xs text-muted-foreground">Security scan running · AIBOM generating · Review in 24h</div>
            <button onClick={onClose} className="mt-5 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function PublicMarketplace() {
  const [search, setSearch] = useState("");
  const [collection, setCollection] = useState("All");
  const [typeFilter, setTypeFilter] = useState<ListingType | "All">("All");
  const [pricingFilter, setPricingFilter] = useState<PricingModel | "All">("All");
  const [sortBy, setSortBy] = useState<"rating" | "deployments" | "cost" | "latency">("rating");
  const [deployedIds, setDeployedIds] = useState<Set<string>>(new Set());
  const [selectedListing, setSelectedListing] = useState<MarketListing | null>(null);
  const [showPublish, setShowPublish] = useState(false);

  const filtered = LISTINGS.filter(l => {
    if (search && !l.name.toLowerCase().includes(search.toLowerCase()) && !l.description.toLowerCase().includes(search.toLowerCase()) && !l.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))) return false;
    if (collection !== "All" && l.collection !== collection) return false;
    if (typeFilter !== "All" && l.type !== typeFilter) return false;
    if (pricingFilter !== "All" && l.pricing !== pricingFilter) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === "rating") return b.rating - a.rating;
    if (sortBy === "deployments") return b.deployments - a.deployments;
    if (sortBy === "cost") return (a.price ?? 0) - (b.price ?? 0);
    return a.avgLatency - b.avgLatency;
  });

  function handleDeploy(id: string) {
    setDeployedIds(prev => new Set([...prev, id]));
    setTimeout(() => setDeployedIds(prev => { const s = new Set(prev); s.delete(id); return s; }), 3000);
  }

  const totalDeployments = LISTINGS.reduce((s, l) => s + l.deployments, 0);
  const freePkgs = LISTINGS.filter(l => l.pricing === "free").length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {selectedListing && <ListingDetailModal listing={selectedListing} onClose={() => setSelectedListing(null)} onDeploy={handleDeploy} />}
      {showPublish && <PublishListingModal onClose={() => setShowPublish(false)} />}

      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-5 rounded-full bg-primary" />
            <h1 className="text-xl font-display font-semibold text-foreground">Public Marketplace</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-3.5">
            Public storefront for governed AI agents, models, skills, and workflows. Every listing includes AIBOM, security scan, and live performance telemetry.
          </p>
        </div>
        <button
          onClick={() => setShowPublish(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Upload className="w-4 h-4" /> Publish Listing
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="kpi-tile p-3 text-center">
          <div className="text-xl font-display font-bold text-primary">{LISTINGS.length}</div>
          <div className="text-xs text-muted-foreground">Listings</div>
        </div>
        <div className="kpi-tile p-3 text-center">
          <div className="text-xl font-display font-bold text-foreground">{totalDeployments}</div>
          <div className="text-xs text-muted-foreground">Total Deployments</div>
        </div>
        <div className="kpi-tile p-3 text-center">
          <div className="text-xl font-display font-bold text-foreground">{freePkgs}</div>
          <div className="text-xs text-muted-foreground">Free Listings</div>
        </div>
        <div className="kpi-tile p-3 text-center">
          <div className="text-xl font-display font-bold text-emerald-400">{LISTINGS.filter(l => l.aibomAvailable).length}</div>
          <div className="text-xs text-muted-foreground">AIBOM Ready</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search listings, tags..."
            className="w-full bg-secondary border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
          />
        </div>
        <select value={collection} onChange={e => setCollection(e.target.value)} className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40">
          {COLLECTIONS.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as typeof typeFilter)} className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40">
          <option value="All">All Types</option>
          {TYPES.map(t => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </select>
        <select value={pricingFilter} onChange={e => setPricingFilter(e.target.value as typeof pricingFilter)} className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40">
          <option value="All">All Pricing</option>
          {PRICING_OPTIONS.map(p => <option key={p} value={p}>{PRICING_DISPLAY[p]}</option>)}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)} className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40">
          <option value="rating">Sort: Rating</option>
          <option value="deployments">Sort: Most Deployed</option>
          <option value="cost">Sort: Lowest Cost</option>
          <option value="latency">Sort: Fastest</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        <span className="text-xs text-muted-foreground self-center">Collections:</span>
        {COLLECTIONS.filter(c => c !== "All").map(c => (
          <button
            key={c}
            onClick={() => setCollection(collection === c ? "All" : c)}
            className={cn("px-2.5 py-1 rounded-md text-xs font-medium transition-all", collection === c ? "bg-primary/15 text-primary border border-primary/25" : "bg-secondary text-muted-foreground hover:text-foreground border border-transparent")}
          >
            {c}
          </button>
        ))}
      </div>

      {deployedIds.size > 0 && (
        <div className="mb-4 px-4 py-3 bg-emerald-500/10 border border-emerald-500/25 rounded-lg text-sm text-emerald-400 flex items-center gap-2">
          <Check className="w-4 h-4" /> Deployed to Alloy environment. Dependencies resolved automatically.
        </div>
      )}

      <div className="text-xs text-muted-foreground mb-3">{filtered.length} listings found</div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(listing => (
          <ListingCard key={listing.id} listing={listing} onDeploy={handleDeploy} onView={setSelectedListing} />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-3 flex flex-col items-center justify-center py-16 text-muted-foreground">
            <ShoppingBag className="w-8 h-8 mb-3" />
            <div className="text-sm">No listings match your filters</div>
            <button onClick={() => { setSearch(""); setCollection("All"); setTypeFilter("All"); setPricingFilter("All"); }} className="mt-3 text-xs text-primary hover:text-primary/80 transition-colors">Clear filters</button>
          </div>
        )}
      </div>
    </div>
  );
}
