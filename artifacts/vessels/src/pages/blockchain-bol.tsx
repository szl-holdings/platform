import { useState } from "react";
import { FileText, Shield, Link, CheckCircle2, Clock, DollarSign, ChevronRight, AlertTriangle, Hash, Anchor } from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";

const BOL_DOCUMENTS = [
  {
    id: "BOL-2026-4471",
    vessel: "Pacific Navigator",
    voyage: "VOY-2026-018",
    shipper: "Gulf Petroleum Corp",
    consignee: "NWE Refining BV",
    cargo: "Crude Oil — ESPO Blend",
    quantity: "298,400 MT",
    origin: "Primorsk, Russia",
    destination: "Rotterdam, Netherlands",
    status: "transferred",
    blockHash: "0x7f3a9b2c1d4e5f6a",
    transfers: 2,
    lcStatus: "released",
    value: 189_400_000,
    created: "Apr 10, 2026",
    deliveryConfirmed: false,
  },
  {
    id: "BOL-2026-4412",
    vessel: "Arctic Breeze",
    voyage: "VOY-2026-015",
    shipper: "Qatargas Trading",
    consignee: "Tokyo Gas Co",
    cargo: "LNG",
    quantity: "62,800 MT",
    origin: "Ras Laffan, Qatar",
    destination: "Sodegaura, Japan",
    status: "in_transit",
    blockHash: "0x2c4a8d1f9e3b7c5a",
    transfers: 1,
    lcStatus: "active",
    value: 44_600_000,
    created: "Apr 12, 2026",
    deliveryConfirmed: false,
  },
  {
    id: "BOL-2026-4398",
    vessel: "Meridian Bulk",
    voyage: "VOY-2026-012",
    shipper: "BHP Shipping",
    consignee: "Baosteel Group",
    cargo: "Iron Ore",
    quantity: "174,200 MT",
    origin: "Port Hedland, Australia",
    destination: "Shanghai, China",
    status: "delivered",
    blockHash: "0x5e1b6c3d8a2f4e9b",
    transfers: 3,
    lcStatus: "settled",
    value: 28_900_000,
    created: "Mar 28, 2026",
    deliveryConfirmed: true,
  },
];

const CHAIN_EVENTS = [
  { hash: "0x7f3a9b2c…", type: "BoL Created", actor: "Gulf Petroleum Corp", timestamp: "Apr 10 09:12", status: "confirmed" },
  { hash: "0xa3d2f891…", type: "First Endorsement", actor: "Standard Chartered (LC Bank)", timestamp: "Apr 10 14:33", status: "confirmed" },
  { hash: "0xb8c1e742…", type: "Cargo Loaded — AIS Verified", timestamp: "Apr 11 06:22", actor: "Smart Port Primorsk", status: "confirmed" },
  { hash: "0x2f9e3a57…", type: "BoL Transferred", actor: "NWE Refining BV", timestamp: "Apr 12 11:05", status: "confirmed" },
  { hash: "0x4d1c8b63…", type: "LC Amendment", actor: "ING Bank NV", timestamp: "Apr 13 09:00", status: "pending" },
];

const TRADE_FINANCE = [
  { lcRef: "LC-2026-3891", issuer: "Standard Chartered", beneficiary: "Gulf Petroleum Corp", amount: 189_400_000, status: "active", triggerEvent: "Vessel arrival + discharge", autoRelease: true },
  { lcRef: "LC-2026-3847", issuer: "HSBC Hong Kong", beneficiary: "Qatargas Trading", amount: 44_600_000, status: "active", triggerEvent: "BoL acceptance + AIS confirm", autoRelease: true },
  { lcRef: "LC-2026-3802", issuer: "BNP Paribas", beneficiary: "BHP Shipping", amount: 28_900_000, status: "settled", triggerEvent: "Delivery confirmed", autoRelease: false },
];

const statusColor: Record<string, string> = {
  transferred: "text-sky-400 bg-sky-500/10 border-sky-500/20",
  in_transit: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  delivered: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  released: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  active: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  settled: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  pending: "text-sky-400 bg-sky-500/10 border-sky-500/20",
  confirmed: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
};

export default function BlockchainBoLPage() {
  const [selected, setSelected] = useState(BOL_DOCUMENTS[0]);
  const [tab, setTab] = useState<"documents" | "chain" | "finance">("documents");

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link className="w-4 h-4 text-sky-400" />
            <h1 className="font-display text-xl font-bold text-sky-50">Blockchain Bill of Lading</h1>
            <Badge variant="outline" className="text-[9px] text-violet-400 border-violet-500/30 bg-violet-500/5">IMMUTABLE LEDGER</Badge>
          </div>
          <p className="text-xs text-sky-400/40">Digital BoL creation, transfer & trade finance automation on simulated blockchain</p>
        </div>
        <div className="flex items-center gap-3 text-right">
          <div><p className="text-lg font-bold font-mono text-sky-400">{BOL_DOCUMENTS.length}</p><p className="text-[9px] text-sky-400/40 uppercase tracking-wider">Active BoLs</p></div>
          <div><p className="text-lg font-bold font-mono text-emerald-400">$263M</p><p className="text-[9px] text-sky-400/40 uppercase tracking-wider">Trade Value</p></div>
        </div>
      </div>

      <div className="flex gap-1">
        {(["documents", "chain", "finance"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn("text-xs px-4 py-1.5 rounded-lg capitalize transition-colors", tab === t ? "bg-sky-500/10 text-sky-300 border border-sky-500/20" : "text-sky-400/50 hover:text-sky-300")}>
            {t === "documents" ? "BoL Documents" : t === "chain" ? "Blockchain Ledger" : "Trade Finance"}
          </button>
        ))}
      </div>

      {tab === "documents" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 space-y-3">
            {BOL_DOCUMENTS.map(doc => (
              <button key={doc.id} onClick={() => setSelected(doc)} className={cn("w-full text-left bg-[#0a1628]/80 border rounded-xl p-4 transition-all hover:border-sky-500/20", selected.id === doc.id ? "border-sky-500/30" : "border-sky-500/10")}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-3.5 h-3.5 text-violet-400" />
                      <p className="text-sm font-mono font-semibold text-sky-100">{doc.id}</p>
                      <Badge variant="outline" className={cn("text-[9px]", statusColor[doc.status])}>{doc.status.replace("_", " ")}</Badge>
                    </div>
                    <p className="text-[10px] text-sky-400/40 mb-2">{doc.vessel} · {doc.voyage}</p>
                    <div className="grid grid-cols-2 gap-1 text-[10px]">
                      <div><span className="text-sky-400/40">Cargo:</span> <span className="text-sky-300">{doc.cargo}</span></div>
                      <div><span className="text-sky-400/40">Qty:</span> <span className="text-sky-300">{doc.quantity}</span></div>
                      <div><span className="text-sky-400/40">From:</span> <span className="text-sky-300">{doc.origin}</span></div>
                      <div><span className="text-sky-400/40">To:</span> <span className="text-sky-300">{doc.destination}</span></div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold font-mono text-emerald-400">${(doc.value / 1_000_000).toFixed(1)}M</p>
                    <p className="text-[9px] text-sky-400/40">{doc.transfers} transfer{doc.transfers !== 1 ? "s" : ""}</p>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <Hash className="w-2.5 h-2.5 text-violet-400/50" />
                      <span className="text-[8px] font-mono text-violet-400/50">{doc.blockHash}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="space-y-4">
            <div className="bg-[#0a1628]/80 border border-sky-500/20 rounded-xl p-4">
              <p className="text-xs font-semibold text-sky-200 mb-3 flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-violet-400" />Document Detail</p>
              <p className="text-sm font-mono font-bold text-sky-100 mb-1">{selected.id}</p>
              <Badge variant="outline" className={cn("text-[9px] mb-3", statusColor[selected.status])}>{selected.status.replace("_", " ")}</Badge>
              <div className="space-y-2 text-[10px]">
                {[
                  { label: "Shipper", val: selected.shipper },
                  { label: "Consignee", val: selected.consignee },
                  { label: "Cargo", val: selected.cargo },
                  { label: "Quantity", val: selected.quantity },
                  { label: "Value", val: `$${(selected.value / 1_000_000).toFixed(1)}M` },
                  { label: "Transfers", val: `${selected.transfers} on-chain` },
                  { label: "LC Status", val: selected.lcStatus },
                  { label: "Created", val: selected.created },
                ].map(r => (
                  <div key={r.label} className="flex justify-between py-1 border-b border-sky-500/5 last:border-0">
                    <span className="text-sky-400/40">{r.label}</span>
                    <span className="text-sky-200 font-mono">{r.val}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 bg-violet-500/5 border border-violet-500/20 rounded-lg p-2">
                <p className="text-[9px] text-violet-400/60 mb-1 uppercase tracking-wider">Block Hash</p>
                <p className="text-[10px] font-mono text-violet-300 break-all">{selected.blockHash}…4f8d2e1c</p>
              </div>
              {selected.deliveryConfirmed && (
                <div className="mt-3 flex items-center gap-1.5 text-emerald-400 text-[10px]"><CheckCircle2 className="w-3.5 h-3.5" />Delivery confirmed — LC auto-released</div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "chain" && (
        <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
          <p className="text-xs font-semibold text-sky-200 mb-4 flex items-center gap-1.5"><Hash className="w-3.5 h-3.5 text-violet-400" />Immutable Transaction Ledger</p>
          <div className="space-y-3">
            {CHAIN_EVENTS.map((ev, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", ev.status === "confirmed" ? "bg-emerald-400" : "bg-amber-400 animate-pulse")} />
                  {i < CHAIN_EVENTS.length - 1 && <div className="w-px flex-1 bg-sky-500/10 mt-1" />}
                </div>
                <div className="pb-3">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-xs font-semibold text-sky-100">{ev.type}</p>
                    <Badge variant="outline" className={cn("text-[9px]", statusColor[ev.status])}>{ev.status}</Badge>
                  </div>
                  <p className="text-[10px] text-sky-400/50">{ev.actor}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[9px] font-mono text-violet-400/60">{ev.hash}</span>
                    <span className="text-[9px] text-sky-400/30">{ev.timestamp}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-sky-500/10 flex items-center gap-2 text-[10px] text-sky-400/40">
            <Shield className="w-3 h-3 text-emerald-400" />
            <span>Simulated blockchain · 2048-bit RSA · SHA-256 hashing · 3-of-5 multi-sig consensus</span>
          </div>
        </div>
      )}

      {tab === "finance" && (
        <div className="space-y-3">
          {TRADE_FINANCE.map((lc, i) => (
            <div key={i} className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-mono font-semibold text-sky-100">{lc.lcRef}</p>
                    <Badge variant="outline" className={cn("text-[9px]", statusColor[lc.status])}>{lc.status}</Badge>
                    {lc.autoRelease && <Badge variant="outline" className="text-[9px] text-violet-400 border-violet-500/20 bg-violet-500/5">AUTO-RELEASE</Badge>}
                  </div>
                  <p className="text-[10px] text-sky-400/40 mb-2">Issued by {lc.issuer} · Beneficiary: {lc.beneficiary}</p>
                  <div className="flex items-center gap-1.5 text-[10px] text-sky-400/50">
                    <Clock className="w-3 h-3" />Trigger: {lc.triggerEvent}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold font-mono text-emerald-400">${(lc.amount / 1_000_000).toFixed(1)}M</p>
                  {lc.status === "settled" && <div className="flex items-center justify-end gap-1 mt-1 text-emerald-400 text-[10px]"><CheckCircle2 className="w-3 h-3" />Settled</div>}
                </div>
              </div>
            </div>
          ))}
          <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl p-4">
            <p className="text-xs font-semibold text-violet-400 mb-2 flex items-center gap-1.5"><Anchor className="w-3.5 h-3.5" />Smart Contract Automation</p>
            <p className="text-[11px] text-sky-300/70">Letters of credit are programmatically released when: AIS delivery confirmation matches BoL port of discharge + signed discharge receipt is uploaded + cargo quantity within 0.5% tolerance of BoL quantity.</p>
          </div>
        </div>
      )}
    </div>
  );
}
