import { useState } from "react";

import { Link } from "wouter";
import { ArrowLeft, Database, Search, X, ExternalLink } from "lucide-react";
import { apiUrl, fetchJson } from "../cognitive/shared";
import { productDashboardUrl, productEntityUrl, inferProductForEntity } from "./product-links";
import { useStandardQuery } from "@szl-holdings/api-client-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const PRODUCT_COLORS: Record<string, string> = {
  lyte:    "#d4a054",
  vessels: "#0ea5e9",
  terra:   "#22c55e",
  prism:   "#a855f7",
  aegis:   "#ef4444",
  carlota: "#f59e0b",
};

const KIND_COLORS: Record<string, string> = {
  "policy-decision":  "#8b7ac8",
  "compliance-event": "#ef4444",
  "distress-signal":  "#f59e0b",
  "matter-filing":    "#a855f7",
  "threat-signal":    "#ef4444",
  "threat-actor":     "#ef4444",
  "engagement-flag":  "#f59e0b",
  "cargo-event":      "#0ea5e9",
  "asset-link":       "#22c55e",
  "run-record":       "#d4a054",
  "route-deviation":  "#0ea5e9",
  "portfolio-cluster":"#22c55e",
  "counterparty-risk":"#a855f7",
};

interface EvidenceNode {
  evidenceId: string;
  product: string;
  kind: string;
  ref: string;
  summary: string;
  entityId: string;
  /**
   * Authoritative owning product for the entity, provided by the API. This is
   * the originating product (the earliest trace that recorded the entity).
   * UI prefers this over the local string-prefix heuristic.
   */
  entityOwner?: string;
  tags: string[];
  capturedAt: string;
  traceId: string;
  drillUrl: string;
}

interface EvidenceResponse {
  nodes: EvidenceNode[];
  total: number;
  productMeta: Record<string, { label: string; color: string; icon: string }>;
}

const PRODUCTS = ["lyte", "vessels", "terra", "prism", "aegis", "carlota"];

export function EvidenceRegistryPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  function handleSearch(v: string) {
    setSearch(v);
    clearTimeout((window as unknown as { _evidenceDebounce?: ReturnType<typeof setTimeout> })._evidenceDebounce);
    (window as unknown as { _evidenceDebounce?: ReturnType<typeof setTimeout> })._evidenceDebounce = setTimeout(() => setDebouncedSearch(v), 300);
  }

  const params = new URLSearchParams({ limit: "100" });
  if (debouncedSearch) params.set("q", debouncedSearch);
  if (selectedProduct) params.set("product", selectedProduct);

  const { data, isLoading, error } = useStandardQuery<EvidenceResponse>({
    queryKey: ["cross-platform", "evidence", debouncedSearch, selectedProduct],
    queryFn: () => fetchJson<EvidenceResponse>(apiUrl(`/cross-platform/evidence?${params}`)),
    staleTime: 30_000,
  });

  const nodes = data?.nodes ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="flex flex-col h-full" style={{ background: "#080c14", color: "rgba(255,255,255,0.85)" }}>
      <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-3">
          <Link href={`${BASE}/strategy/cross-platform`} className="flex items-center gap-1.5 text-xs hover:opacity-70 transition-opacity" style={{ color: "rgba(255,255,255,0.35)" }}>
            <ArrowLeft className="w-3 h-3" />
            Correlations
          </Link>
          <span style={{ color: "rgba(255,255,255,0.12)" }}>/</span>
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4" style={{ color: "#8b7ac8" }} />
            <span className="text-sm font-semibold">Shared Evidence Registry</span>
          </div>
        </div>
        <span className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>{total} nodes</span>
      </div>

      <div className="px-6 py-3 border-b flex flex-col gap-3" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.2)" }} />
          <input
            type="text"
            placeholder="Search by entity, ref, summary, or tag…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-8 pr-8 py-2 rounded text-sm outline-none"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)", caretColor: "#8b7ac8" }}
          />
          {search && (
            <button onClick={() => { setSearch(""); setDebouncedSearch(""); }} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "rgba(255,255,255,0.3)" }}>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setSelectedProduct(null)}
            className="px-2.5 py-1 rounded text-[10px] font-semibold uppercase tracking-wide transition-all"
            style={{ background: !selectedProduct ? "rgba(139,122,200,0.12)" : "rgba(255,255,255,0.04)", border: `1px solid ${!selectedProduct ? "rgba(139,122,200,0.3)" : "rgba(255,255,255,0.08)"}`, color: !selectedProduct ? "#8b7ac8" : "rgba(255,255,255,0.4)" }}
          >
            All
          </button>
          {PRODUCTS.map((p) => {
            const color = PRODUCT_COLORS[p];
            const active = selectedProduct === p;
            return (
              <button
                key={p}
                onClick={() => setSelectedProduct(active ? null : p)}
                className="px-2.5 py-1 rounded text-[10px] font-semibold uppercase tracking-wide transition-all"
                style={{ background: active ? `${color}18` : "rgba(255,255,255,0.04)", border: `1px solid ${active ? color + "40" : "rgba(255,255,255,0.08)"}`, color: active ? color : "rgba(255,255,255,0.4)" }}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 py-4">
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(139,122,200,0.2)", borderTopColor: "#8b7ac8" }} />
          </div>
        )}
        {error && <div className="text-center py-12 text-sm" style={{ color: "#ef4444" }}>Failed to load evidence registry</div>}
        {!isLoading && !error && nodes.length === 0 && (
          <div className="text-center py-12 text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>No evidence nodes match your query</div>
        )}

        <div className="grid gap-2">
          {nodes.map((node) => {
            const prodColor = PRODUCT_COLORS[node.product] ?? "#8b7ac8";
            const kindColor = KIND_COLORS[node.kind] ?? "#8b7ac8";

            return (
              <div
                key={node.evidenceId}
                className="rounded-lg px-4 py-3 flex items-start gap-4"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="shrink-0 flex flex-col gap-1.5 items-start">
                  <a
                    href={productDashboardUrl(node.product)}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`Open ${node.product} dashboard`}
                    className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded uppercase hover:opacity-80 transition-opacity"
                    style={{ color: prodColor, background: `${prodColor}12`, border: `1px solid ${prodColor}25` }}
                  >
                    {node.product}
                  </a>
                  <span
                    className="text-[8px] font-mono px-1.5 py-0.5 rounded"
                    style={{ color: kindColor, background: `${kindColor}10`, border: `1px solid ${kindColor}20` }}
                  >
                    {node.kind}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-[10px] font-mono font-bold" style={{ color: "#8b7ac8" }}>{node.ref}</span>
                    {(() => {
                      const owner = node.entityOwner ?? inferProductForEntity(node.entityId, [node.product]);
                      const entityUrl = productEntityUrl(owner, node.entityId);
                      const ownerColor = PRODUCT_COLORS[owner] ?? "#8b7ac8";
                      if (!entityUrl) {
                        return (
                          <span className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>→ {node.entityId}</span>
                        );
                      }
                      return (
                        <a
                          href={entityUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`Open ${node.entityId} in ${owner}`}
                          className="group flex items-center gap-1 text-[9px] font-mono hover:opacity-80 transition-opacity"
                          style={{ color: ownerColor }}
                        >
                          <span style={{ color: "rgba(255,255,255,0.2)" }}>→</span>
                          <span>{node.entityId}</span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100" />
                        </a>
                      );
                    })()}
                  </div>
                  <p className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>{node.summary}</p>
                  <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                    {node.tags.map((t) => (
                      <span key={t} className="text-[8px] font-mono px-1 py-px rounded" style={{ color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.25)" }}>{node.evidenceId}</div>
                  <div className="text-[9px] font-mono mt-1" style={{ color: "rgba(255,255,255,0.2)" }}>{new Date(node.capturedAt).toLocaleDateString()}</div>
                  {node.traceId && (
                    <a
                      href={node.drillUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[9px] font-mono mt-1 block hover:opacity-70 transition-opacity truncate max-w-[100px]"
                      style={{ color: "#8b7ac8" }}
                      title={node.traceId}
                    >
                      {node.traceId.slice(0, 12)}…
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
