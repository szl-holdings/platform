import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Shield, Link, CheckCircle2, Clock, Hash, Anchor, RefreshCw, AlertTriangle, PlusCircle, X } from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

interface BolChainEvent {
  sequence: number;
  eventType: string;
  actor: string;
  timestamp: string;
  hash: string;
  prevHash: string;
  signature: string;
  confirmed: boolean;
}

interface BolDocument {
  id: string;
  vesselName: string;
  imo: string;
  voyageId: string;
  shipper: string;
  consignee: string;
  notifyParty: string;
  cargo: string;
  quantity: string;
  quantityMt: number;
  unit: string;
  originPort: string;
  destinationPort: string;
  status: "draft" | "issued" | "in_transit" | "transferred" | "delivered" | "settled";
  lcRef: string;
  lcIssuer: string;
  lcAmount: number;
  lcStatus: "pending" | "active" | "amended" | "settled";
  autoLcRelease: boolean;
  transferCount: number;
  genesisHash: string;
  headHash: string;
  chain?: BolChainEvent[];
  createdAt: string;
  updatedAt: string;
  deliveryConfirmed: boolean;
}

interface BolListResponse {
  documents: BolDocument[];
  totals: {
    count: number;
    totalTradeValue: number;
    inTransit: number;
    delivered: number;
  };
}

interface VerifyResponse {
  bolId?: string;
  valid?: boolean;
  chainLength?: number;
  genesisHash?: string;
  headHash?: string;
  verifiedAt?: string;
  algorithm?: string;
  error?: string;
}

const statusColor: Record<string, string> = {
  draft: "text-sky-400/50 bg-sky-500/5 border-sky-500/10",
  issued: "text-sky-400 bg-sky-500/10 border-sky-500/20",
  transferred: "text-sky-400 bg-sky-500/10 border-sky-500/20",
  in_transit: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  delivered: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  settled: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  released: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  active: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  amended: "text-sky-400 bg-sky-500/10 border-sky-500/20",
  pending: "text-sky-400/50 bg-sky-500/5 border-sky-500/10",
  confirmed: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
};

function fmtMoney(n: number) {
  return `$${(n / 1_000_000).toFixed(1)}M`;
}

function fmtTs(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

interface CreateFormData {
  vesselName: string;
  imo: string;
  voyageId: string;
  shipper: string;
  consignee: string;
  notifyParty: string;
  cargo: string;
  quantityMt: string;
  unit: string;
  originPort: string;
  destinationPort: string;
  lcRef: string;
  lcIssuer: string;
  lcAmount: string;
}

const EMPTY_FORM: CreateFormData = {
  vesselName: "", imo: "", voyageId: "", shipper: "", consignee: "", notifyParty: "",
  cargo: "", quantityMt: "", unit: "MT", originPort: "", destinationPort: "",
  lcRef: "", lcIssuer: "", lcAmount: "",
};

export default function BlockchainBoLPage() {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<"documents" | "chain" | "finance">("documents");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CreateFormData>(EMPTY_FORM);
  const [verifyResult, setVerifyResult] = useState<VerifyResponse | null>(null);

  const { data, isLoading, isError, refetch } = useQuery<BolListResponse>({
    queryKey: ["vessels-bol-list"],
    queryFn: () =>
      fetch(`${API_BASE}/vessels/modules/bills-of-lading`, { credentials: "include" })
        .then(r => r.json()).then(d => d.data ?? d),
    staleTime: 30_000,
  });

  const { data: selectedDoc, isLoading: isLoadingDoc } = useQuery<BolDocument>({
    queryKey: ["vessels-bol-detail", selectedId],
    queryFn: () =>
      fetch(`${API_BASE}/vessels/modules/bills-of-lading/${selectedId}`, { credentials: "include" })
        .then(r => r.json()).then(d => d.data ?? d),
    enabled: !!selectedId,
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: async (body: object) => {
      const r = await fetch(`${API_BASE}/vessels/modules/bills-of-lading`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error ?? d?.message ?? `HTTP ${r.status}`);
      return d.data ?? d;
    },
    onSuccess: (doc: BolDocument) => {
      qc.invalidateQueries({ queryKey: ["vessels-bol-list"] });
      setShowCreate(false);
      setForm(EMPTY_FORM);
      setSelectedId(doc.id);
    },
  });

  async function handleVerify(id: string) {
    const r = await fetch(`${API_BASE}/vessels/modules/bills-of-lading/${id}/verify`, { credentials: "include" });
    const d = await r.json();
    if (!r.ok) { setVerifyResult({ error: d?.error ?? `HTTP ${r.status}` }); return; }
    setVerifyResult(d.data ?? d);
  }

  const docs = data?.documents ?? [];
  const totals = data?.totals;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link className="w-4 h-4 text-sky-400" />
            <h1 className="font-display text-xl font-bold text-sky-50">Blockchain Bill of Lading</h1>
            <Badge variant="outline" className="text-[9px] text-violet-400 border-violet-500/30 bg-violet-500/5">HASH CHAIN LEDGER</Badge>
          </div>
          <p className="text-xs text-sky-400/40">Server-side HMAC-SHA256 hash chain · cryptographic provenance for every BoL event</p>
        </div>
        <div className="flex items-center gap-4">
          {totals && (
            <>
              <div className="text-right">
                <p className="text-lg font-bold font-mono text-sky-400">{totals.count}</p>
                <p className="text-[9px] text-sky-400/40 uppercase tracking-wider">Active BoLs</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold font-mono text-emerald-400">{fmtMoney(totals.totalTradeValue)}</p>
                <p className="text-[9px] text-sky-400/40 uppercase tracking-wider">Trade Value</p>
              </div>
            </>
          )}
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-1.5 text-xs border border-sky-500/20 bg-sky-500/5 text-sky-300 px-3 py-1.5 rounded-lg hover:bg-sky-500/10 transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" /> New BoL
          </button>
          <button onClick={() => refetch()} className="text-sky-400/40 hover:text-sky-300 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {showCreate && (
        <div className="bg-[#0a1628]/80 border border-sky-500/20 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-sky-200 flex items-center gap-1.5"><PlusCircle className="w-3.5 h-3.5 text-sky-400" />Create New Bill of Lading</p>
            <button onClick={() => setShowCreate(false)}><X className="w-4 h-4 text-sky-400/40 hover:text-sky-300" /></button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { key: "vesselName", label: "Vessel Name *" },
              { key: "imo", label: "IMO Number" },
              { key: "voyageId", label: "Voyage ID" },
              { key: "shipper", label: "Shipper *" },
              { key: "consignee", label: "Consignee *" },
              { key: "notifyParty", label: "Notify Party" },
              { key: "cargo", label: "Cargo Description *" },
              { key: "quantityMt", label: "Quantity" },
              { key: "unit", label: "Unit (MT / TEU / BBL)" },
              { key: "originPort", label: "Port of Loading *" },
              { key: "destinationPort", label: "Port of Discharge *" },
              { key: "lcRef", label: "LC Reference" },
              { key: "lcIssuer", label: "LC Issuing Bank" },
              { key: "lcAmount", label: "LC Amount (USD)" },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="text-[10px] text-sky-400/50 uppercase tracking-wider block mb-1">{label}</label>
                <input
                  value={form[key as keyof CreateFormData]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full bg-[#060d1a] border border-sky-500/20 rounded-lg px-3 py-2 text-xs text-sky-100 placeholder-sky-400/20 focus:outline-none focus:border-sky-500/40"
                  placeholder={label.replace(" *", "")}
                />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => createMutation.mutate({
                ...form,
                quantityMt: Number(form.quantityMt) || 0,
                lcAmount: Number(form.lcAmount) || 0,
              })}
              disabled={createMutation.isPending || !form.vesselName || !form.shipper || !form.consignee || !form.cargo || !form.originPort || !form.destinationPort}
              className="text-xs bg-sky-500/10 text-sky-300 border border-sky-500/20 px-4 py-2 rounded-lg hover:bg-sky-500/15 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {createMutation.isPending ? "Creating…" : "Create BoL & Register on Chain"}
            </button>
            {createMutation.isError && (
              <span className="text-xs text-red-400">Failed to create BoL</span>
            )}
          </div>
        </div>
      )}

      {verifyResult && (
        <div className={cn("rounded-xl border p-4 flex items-start gap-3",
          verifyResult.error ? "border-red-500/30 bg-red-500/5" :
          verifyResult.valid ? "border-emerald-500/20 bg-emerald-500/5" : "border-red-500/20 bg-red-500/5")}>
          {verifyResult.error || !verifyResult.valid
            ? <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            : <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
          <div className="flex-1 min-w-0">
            {verifyResult.error ? (
              <p className="text-xs font-semibold mb-1 text-red-300">{verifyResult.error}</p>
            ) : (
              <>
                <p className={cn("text-xs font-semibold mb-1", verifyResult.valid ? "text-emerald-300" : "text-red-300")}>
                  {verifyResult.bolId} — Chain {verifyResult.valid ? "VALID" : "TAMPERED"}
                </p>
                <div className="space-y-0.5 text-[10px] text-sky-400/50 font-mono">
                  <p>Events: {verifyResult.chainLength} · Algorithm: {verifyResult.algorithm}</p>
                  <p>Genesis: {verifyResult.genesisHash}</p>
                  <p>Head: {verifyResult.headHash}</p>
                </div>
              </>
            )}
          </div>
          <button onClick={() => setVerifyResult(null)} className="text-sky-400/30 hover:text-sky-300"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      <div className="flex gap-1">
        {(["documents", "chain", "finance"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn("text-xs px-4 py-1.5 rounded-lg capitalize transition-colors", tab === t ? "bg-sky-500/10 text-sky-300 border border-sky-500/20" : "text-sky-400/50 hover:text-sky-300")}>
            {t === "documents" ? "BoL Documents" : t === "chain" ? "Blockchain Ledger" : "Trade Finance"}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center h-32 text-sky-400/40 text-sm">
          <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Loading bills of lading…
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center justify-center h-32 gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <p className="text-sm text-sky-400/50">Failed to load bills of lading</p>
          <button onClick={() => refetch()} className="text-xs text-sky-400 border border-sky-500/20 px-3 py-1.5 rounded-lg">Retry</button>
        </div>
      )}

      {!isLoading && !isError && tab === "documents" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 space-y-3">
            {docs.map(doc => (
              <button key={doc.id} onClick={() => setSelectedId(selectedId === doc.id ? null : doc.id)}
                className={cn("w-full text-left bg-[#0a1628]/80 border rounded-xl p-4 transition-all hover:border-sky-500/20", selectedId === doc.id ? "border-sky-500/30" : "border-sky-500/10")}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-3.5 h-3.5 text-violet-400" />
                      <p className="text-sm font-mono font-semibold text-sky-100">{doc.id}</p>
                      <Badge variant="outline" className={cn("text-[9px]", statusColor[doc.status])}>{doc.status.replace("_", " ")}</Badge>
                    </div>
                    <p className="text-[10px] text-sky-400/40 mb-2">{doc.vesselName} · {doc.voyageId}</p>
                    <div className="grid grid-cols-2 gap-1 text-[10px]">
                      <div><span className="text-sky-400/40">Cargo:</span> <span className="text-sky-300">{doc.cargo}</span></div>
                      <div><span className="text-sky-400/40">Qty:</span> <span className="text-sky-300">{doc.quantity}</span></div>
                      <div><span className="text-sky-400/40">From:</span> <span className="text-sky-300">{doc.originPort}</span></div>
                      <div><span className="text-sky-400/40">To:</span> <span className="text-sky-300">{doc.destinationPort}</span></div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold font-mono text-emerald-400">{fmtMoney(doc.lcAmount)}</p>
                    <p className="text-[9px] text-sky-400/40">{doc.transferCount} transfer{doc.transferCount !== 1 ? "s" : ""}</p>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <Hash className="w-2.5 h-2.5 text-violet-400/50" />
                      <span className="text-[8px] font-mono text-violet-400/50">{doc.headHash?.slice(0, 12)}…</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {selectedId && (
              isLoadingDoc ? (
                <div className="bg-[#0a1628]/80 border border-sky-500/20 rounded-xl p-4 flex items-center justify-center h-32">
                  <RefreshCw className="w-4 h-4 animate-spin text-sky-400/40" />
                </div>
              ) : selectedDoc ? (
                <div className="bg-[#0a1628]/80 border border-sky-500/20 rounded-xl p-4">
                  <p className="text-xs font-semibold text-sky-200 mb-3 flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-violet-400" />Document Detail</p>
                  <p className="text-sm font-mono font-bold text-sky-100 mb-1">{selectedDoc.id}</p>
                  <Badge variant="outline" className={cn("text-[9px] mb-3", statusColor[selectedDoc.status])}>{selectedDoc.status.replace("_", " ")}</Badge>
                  <div className="space-y-2 text-[10px]">
                    {[
                      { label: "Shipper", val: selectedDoc.shipper },
                      { label: "Consignee", val: selectedDoc.consignee },
                      { label: "Notify Party", val: selectedDoc.notifyParty || "—" },
                      { label: "Cargo", val: selectedDoc.cargo },
                      { label: "Quantity", val: selectedDoc.quantity },
                      { label: "Value", val: fmtMoney(selectedDoc.lcAmount) },
                      { label: "Transfers", val: `${selectedDoc.transferCount} on-chain` },
                      { label: "LC Status", val: selectedDoc.lcStatus },
                      { label: "Created", val: fmtTs(selectedDoc.createdAt) },
                    ].map(r => (
                      <div key={r.label} className="flex justify-between py-1 border-b border-sky-500/5 last:border-0">
                        <span className="text-sky-400/40">{r.label}</span>
                        <span className="text-sky-200 font-mono text-right max-w-[60%] truncate">{r.val}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 bg-violet-500/5 border border-violet-500/20 rounded-lg p-2">
                    <p className="text-[9px] text-violet-400/60 mb-1 uppercase tracking-wider">Head Hash</p>
                    <p className="text-[10px] font-mono text-violet-300 break-all">{selectedDoc.headHash}</p>
                  </div>
                  {selectedDoc.deliveryConfirmed && (
                    <div className="mt-3 flex items-center gap-1.5 text-emerald-400 text-[10px]">
                      <CheckCircle2 className="w-3.5 h-3.5" />Delivery confirmed — LC auto-released
                    </div>
                  )}
                  <button
                    onClick={() => handleVerify(selectedDoc.id)}
                    className="mt-3 w-full text-xs border border-violet-500/20 text-violet-400 py-1.5 rounded-lg hover:bg-violet-500/5 transition-colors"
                  >
                    Verify Chain Integrity
                  </button>
                </div>
              ) : null
            )}
            {!selectedId && (
              <div className="bg-[#0a1628]/40 border border-sky-500/10 rounded-xl p-6 text-center">
                <FileText className="w-6 h-6 text-sky-400/20 mx-auto mb-2" />
                <p className="text-xs text-sky-400/30">Select a document to view details and verify chain integrity</p>
              </div>
            )}
          </div>
        </div>
      )}

      {!isLoading && !isError && tab === "chain" && (
        <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
          <p className="text-xs font-semibold text-sky-200 mb-4 flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5 text-violet-400" />Immutable Transaction Ledger
            {selectedDoc && <span className="text-sky-400/30 font-normal ml-2">· {selectedDoc.id}</span>}
          </p>
          {!selectedId ? (
            <p className="text-xs text-sky-400/30 text-center py-8">Select a document from the BoL Documents tab to inspect its chain</p>
          ) : isLoadingDoc ? (
            <div className="flex items-center justify-center h-24"><RefreshCw className="w-4 h-4 animate-spin text-sky-400/40" /></div>
          ) : selectedDoc?.chain ? (
            <div className="space-y-3">
              {selectedDoc.chain.map((ev, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", ev.confirmed ? "bg-emerald-400" : "bg-amber-400 animate-pulse")} />
                    {i < selectedDoc.chain!.length - 1 && <div className="w-px flex-1 bg-sky-500/10 mt-1" />}
                  </div>
                  <div className="pb-3">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-xs font-semibold text-sky-100">{ev.eventType}</p>
                      <Badge variant="outline" className={cn("text-[9px]", ev.confirmed ? statusColor.confirmed : statusColor.pending)}>
                        {ev.confirmed ? "confirmed" : "pending"}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-sky-400/50">{ev.actor}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-[9px] font-mono text-violet-400/60">hash: {ev.hash}</span>
                      <span className="text-[9px] font-mono text-sky-400/20">prev: {ev.prevHash?.slice(0, 12)}…</span>
                      <span className="text-[9px] text-sky-400/30">{fmtTs(ev.timestamp)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
          <div className="mt-4 pt-4 border-t border-sky-500/10 flex items-center gap-2 text-[10px] text-sky-400/40">
            <Shield className="w-3 h-3 text-emerald-400" />
            <span>HMAC-SHA256 hash chain · each event links to its predecessor · tamper-evident provenance</span>
          </div>
        </div>
      )}

      {!isLoading && !isError && tab === "finance" && (
        <div className="space-y-3">
          {docs.filter(d => d.lcRef).map(doc => (
            <div key={doc.id} className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-mono font-semibold text-sky-100">{doc.lcRef}</p>
                    <Badge variant="outline" className={cn("text-[9px]", statusColor[doc.lcStatus])}>{doc.lcStatus}</Badge>
                    {doc.autoLcRelease && <Badge variant="outline" className="text-[9px] text-violet-400 border-violet-500/20 bg-violet-500/5">AUTO-RELEASE</Badge>}
                  </div>
                  <p className="text-[10px] text-sky-400/40 mb-2">
                    Issued by {doc.lcIssuer} · Beneficiary: {doc.shipper}
                  </p>
                  <p className="text-[10px] text-sky-400/50">
                    BoL: {doc.id} · {doc.cargo} · {doc.quantity}
                  </p>
                  {doc.autoLcRelease && (
                    <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-sky-400/50">
                      <Clock className="w-3 h-3" />Trigger: AIS delivery + discharge receipt + quantity within 0.5% tolerance
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold font-mono text-emerald-400">{fmtMoney(doc.lcAmount)}</p>
                  {doc.deliveryConfirmed && (
                    <div className="flex items-center justify-end gap-1 mt-1 text-emerald-400 text-[10px]">
                      <CheckCircle2 className="w-3 h-3" />Settled
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl p-4">
            <p className="text-xs font-semibold text-violet-400 mb-2 flex items-center gap-1.5"><Anchor className="w-3.5 h-3.5" />Smart Contract Automation</p>
            <p className="text-[11px] text-sky-300/70">
              Letters of credit are programmatically released when: AIS delivery confirmation matches BoL port of discharge
              + signed discharge receipt is uploaded + cargo quantity within 0.5% tolerance of BoL quantity.
              Each release event is appended to the hash chain for permanent audit trail.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
