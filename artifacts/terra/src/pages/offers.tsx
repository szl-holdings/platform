import { motion } from "framer-motion";
import { useState } from "react";
import { DollarSign, Clock, CheckCircle, AlertTriangle, ArrowLeftRight } from "lucide-react";
import { offers, type Offer } from "@/data/brokerage";
import { RiskBadge, ApprovalChip, formatCurrency, ConfidenceBadge } from "@/components/brokerage-ui";
import { cn } from "@workspace/shared-ui/utils";

function timeUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff < 0) return "Expired";
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `${hours}h left`;
  const days = Math.floor(hours / 24);
  return `${days}d left`;
}

function OfferCard({ offer }: { offer: Offer }) {
  const expiring = new Date(offer.expiresAt).getTime() - Date.now() < 4 * 3600000;
  const expired = new Date(offer.expiresAt).getTime() < Date.now();
  const financing = {
    strong: { label: "Strong Financing", cls: "text-emerald-400 bg-emerald-500/10" },
    moderate: { label: "Moderate Financing", cls: "text-amber-400 bg-amber-500/10" },
    weak: { label: "Weak Financing", cls: "text-rose-400 bg-rose-500/10" },
  }[offer.financingStrength];

  return (
    <div className={cn(
      "rounded-xl border bg-terra-surface/50 overflow-hidden transition-all hover:border-terra-border-hover",
      offer.brokerApprovalRequired && !offer.brokerApproved ? "border-amber-500/40 bg-amber-500/5" :
      expiring && !expired ? "border-rose-500/40 bg-rose-500/5" :
      "border-terra-border"
    )}>
      <div className="px-5 py-4 border-b border-terra-border/50">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-bold text-terra-text">{offer.listingAddress}</p>
            <p className="text-xs text-terra-text-secondary mt-0.5">{offer.buyerName} · {offer.agentName}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
              offer.direction === "incoming" ? "bg-blue-500/10 text-blue-400" : "bg-violet-500/10 text-violet-400"
            )}>{offer.direction}</span>
            <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase",
              offer.status === "accepted" ? "bg-emerald-500/10 text-emerald-400" :
              offer.status === "countered" ? "bg-amber-500/10 text-amber-400" :
              offer.status === "rejected" ? "bg-rose-500/10 text-rose-400" :
              offer.status === "expired" ? "bg-slate-500/10 text-slate-400" :
              "bg-blue-500/10 text-blue-400"
            )}>{offer.status}</span>
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-end gap-3 mb-4">
          <div>
            <p className="text-[10px] text-terra-text-muted">Offer Price</p>
            <p className="text-2xl font-display font-bold text-terra-text">{formatCurrency(offer.price)}</p>
          </div>
          <div className="text-xs">
            <span className={cn("font-semibold",
              offer.price >= offer.listPrice ? "text-emerald-400" : "text-rose-400"
            )}>
              {offer.price >= offer.listPrice ? "+" : ""}{formatCurrency(offer.price - offer.listPrice)} vs list
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
          <div>
            <p className="text-[10px] text-terra-text-muted">Earnest Money</p>
            <p className="font-semibold text-terra-text">{formatCurrency(offer.earnestMoney)}</p>
          </div>
          <div>
            <p className="text-[10px] text-terra-text-muted">Down Payment</p>
            <p className="font-semibold text-terra-text">{formatCurrency(offer.downPayment)}</p>
          </div>
          <div>
            <p className="text-[10px] text-terra-text-muted">Financing</p>
            <p className="font-semibold text-terra-text capitalize">{offer.financingType.toUpperCase()}</p>
          </div>
          <div>
            <p className="text-[10px] text-terra-text-muted">Close Date</p>
            <p className="font-semibold text-terra-text">{offer.closingDate}</p>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-[10px] text-terra-text-muted mb-1.5">Contingencies</p>
          <div className="flex flex-wrap gap-1.5">
            {offer.contingencies.map((c, i) => (
              <span key={i} className={cn("text-[10px] px-2 py-0.5 rounded-full border",
                c.waived ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/5 line-through" : "border-terra-border text-terra-text-secondary"
              )}>
                {c.type} ({c.days}d){c.waived ? " waived" : ""}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className={cn("text-[10px] px-2 py-0.5 rounded-full", financing.cls)}>{financing.label}</span>
          <ConfidenceBadge value={offer.closeConfidence / 100} />
        </div>

        {offer.brokerApprovalRequired && (
          <div className="mb-3">
            <ApprovalChip approved={offer.brokerApproved} label={offer.brokerApproved ? "Broker Approved" : "Awaiting Broker Approval"} />
          </div>
        )}

        {!expired && (
          <div className={cn("flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg",
            expiring ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" : "bg-terra-surface text-terra-text-muted border border-terra-border"
          )}>
            <Clock className="w-3.5 h-3.5" />
            Expires: {timeUntil(offer.expiresAt)}
          </div>
        )}

        {offer.recommendation && (
          <div className="mt-3 flex items-start gap-2 text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 rounded-lg px-3 py-2">
            <CheckCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>{offer.recommendation}</span>
          </div>
        )}

        {offer.counterHistory.length > 0 && (
          <div className="mt-3 border-t border-terra-border pt-3">
            <p className="text-[10px] font-semibold text-terra-text-muted uppercase tracking-wider mb-2">Counter History</p>
            {offer.counterHistory.map((c, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-terra-text-secondary">
                <ArrowLeftRight className="w-3 h-3 text-terra-text-muted" />
                <span>{c.from}: {formatCurrency(c.price)}</span>
                <span className="text-terra-text-muted">· {c.date}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ComparisonTable({ listing, listingOffers }: { listing: string; listingOffers: Offer[] }) {
  if (listingOffers.length < 2) return null;
  return (
    <div className="rounded-xl border border-terra-border bg-terra-surface/50 overflow-hidden mb-6">
      <div className="px-5 py-3.5 border-b border-terra-border">
        <h3 className="font-display font-bold text-terra-text">Offer Comparison — {listing}</h3>
        <p className="text-xs text-terra-text-muted mt-0.5">{listingOffers.length} offers received</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-terra-border">
              <th className="text-left py-3 px-4 text-[10px] font-semibold text-terra-text-muted">Metric</th>
              {listingOffers.map(o => (
                <th key={o.id} className="text-left py-3 px-4 text-[10px] font-semibold text-terra-text-muted">{o.buyerName}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { label: "Offer Price", key: (o: Offer) => formatCurrency(o.price) },
              { label: "vs. List", key: (o: Offer) => <span className={o.price >= o.listPrice ? "text-emerald-400" : "text-rose-400"}>{o.price >= o.listPrice ? "+" : ""}{formatCurrency(o.price - o.listPrice)}</span> },
              { label: "Financing", key: (o: Offer) => o.financingType.toUpperCase() },
              { label: "Down Payment", key: (o: Offer) => formatCurrency(o.downPayment) },
              { label: "Close Date", key: (o: Offer) => o.closingDate },
              { label: "Contingencies", key: (o: Offer) => o.contingencies.filter(c => !c.waived).length + " active" },
              { label: "Close Confidence", key: (o: Offer) => <ConfidenceBadge value={o.closeConfidence / 100} /> },
              { label: "Financing Strength", key: (o: Offer) => <span className={o.financingStrength === "strong" ? "text-emerald-400" : o.financingStrength === "moderate" ? "text-amber-400" : "text-rose-400"}>{o.financingStrength}</span> },
            ].map(row => (
              <tr key={row.label} className="border-b border-terra-border/50 hover:bg-terra-surface-hover">
                <td className="py-2.5 px-4 text-xs font-medium text-terra-text-muted">{row.label}</td>
                {listingOffers.map(o => (
                  <td key={o.id} className="py-2.5 px-4 text-xs text-terra-text">{row.key(o)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function OffersPage() {
  const [directionFilter, setDirectionFilter] = useState<"all" | "incoming" | "outgoing">("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = offers.filter(o => {
    if (directionFilter !== "all" && o.direction !== directionFilter) return false;
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    return true;
  });

  const listingsWithMultiple = [...new Set(offers.filter(o => o.direction === "incoming").map(o => o.listingAddress))].filter(listing =>
    offers.filter(o => o.listingAddress === listing && o.direction === "incoming").length >= 2
  );

  const brokerQueue = offers.filter(o => o.brokerApprovalRequired && !o.brokerApproved);
  const expiring = offers.filter(o => {
    const diff = new Date(o.expiresAt).getTime() - Date.now();
    return diff > 0 && diff < 24 * 3600000 && o.status === "pending";
  });

  return (
    <div className="p-6 space-y-6 overflow-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-terra-text">Offers + Negotiation</h1>
        <p className="text-sm text-terra-text-secondary mt-1">Incoming and outgoing offers, comparison surface, expiration tracking, and broker approvals</p>
      </motion.div>

      {/* Alert Banners */}
      {brokerQueue.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-500/30 bg-amber-500/10">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <p className="text-sm text-amber-400 font-semibold">{brokerQueue.length} offer{brokerQueue.length > 1 ? "s" : ""} awaiting broker approval</p>
        </div>
      )}
      {expiring.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-rose-500/30 bg-rose-500/10">
          <Clock className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <p className="text-sm text-rose-400 font-semibold">{expiring.length} offer{expiring.length > 1 ? "s" : ""} expiring within 24 hours</p>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Offers", value: offers.length },
          { label: "Pending", value: offers.filter(o => o.status === "pending").length },
          { label: "Broker Queue", value: brokerQueue.length, alert: brokerQueue.length > 0 },
          { label: "Expiring Soon", value: expiring.length, alert: expiring.length > 0 },
        ].map(m => (
          <div key={m.label} className={cn("rounded-xl border p-4 bg-terra-surface/50", (m as any).alert && m.value > 0 ? "border-rose-500/30" : "border-terra-border")}>
            <p className="text-[10px] text-terra-text-muted uppercase tracking-wider">{m.label}</p>
            <p className={cn("text-2xl font-display font-bold mt-1", (m as any).alert && m.value > 0 ? "text-rose-400" : "text-terra-text")}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="flex rounded-lg border border-terra-border overflow-hidden">
          {(["all", "incoming", "outgoing"] as const).map(d => (
            <button key={d} onClick={() => setDirectionFilter(d)} className={cn("px-3 py-2 text-xs font-medium capitalize", directionFilter === d ? "bg-terra-primary text-white" : "bg-terra-surface text-terra-text-muted")}>
              {d === "all" ? "All" : d}
            </button>
          ))}
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-terra-border bg-terra-surface text-sm text-terra-text focus:outline-none">
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="countered">Countered</option>
          <option value="rejected">Rejected</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {/* Comparison Tables for multiple-offer listings */}
      {listingsWithMultiple.map(listing => (
        <ComparisonTable
          key={listing}
          listing={listing}
          listingOffers={offers.filter(o => o.listingAddress === listing && o.direction === "incoming")}
        />
      ))}

      {/* Offer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(offer => <OfferCard key={offer.id} offer={offer} />)}
      </div>
    </div>
  );
}
