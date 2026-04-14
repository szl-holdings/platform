import { AppShell } from "@/components/layout/AppShell";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { portalApi, type DocumentsResponse } from "@/lib/api";
import {
  FileText, Download, Eye, Search, Filter, Shield,
  Anchor, Building2, Scale, ShieldCheck, Folder
} from "lucide-react";

type DomainFilter = "all" | "vessels" | "terra" | "legal" | "security" | "general";
type TypeFilter = "all" | "report" | "filing" | "contract" | "briefing" | "invoice";

const DOMAIN_COLORS: Record<string, string> = {
  vessels: "var(--color-forge-vessels)",
  terra: "var(--color-forge-terra)",
  legal: "var(--color-forge-legal)",
  security: "var(--color-forge-security)",
  general: "var(--color-forge-gold)",
};

const DOMAIN_ICONS: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  vessels: Anchor,
  terra: Building2,
  legal: Scale,
  security: ShieldCheck,
  general: Folder,
};

const DOMAIN_LABELS: Record<string, string> = {
  vessels: "Maritime",
  terra: "Real Estate",
  legal: "Legal",
  security: "Security",
  general: "General",
};

const TYPE_COLORS: Record<string, string> = {
  report: "var(--color-forge-primary)",
  filing: "var(--color-forge-legal)",
  contract: "var(--color-forge-gold)",
  briefing: "var(--color-forge-security)",
  invoice: "var(--color-forge-terra)",
};

export default function Documents() {
  const [search, setSearch] = useState("");
  const [domainFilter, setDomainFilter] = useState<DomainFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  const { data, isLoading } = useQuery<DocumentsResponse>({
    queryKey: ["forge-portal", "documents"],
    queryFn: () => portalApi.getDocuments(),
    retry: 1,
  });
  const documents = data?.documents ?? [];

  const filtered = documents.filter(d => {
    const matchSearch = !search || d.title.toLowerCase().includes(search.toLowerCase());
    const matchDomain = domainFilter === "all" || d.domain === domainFilter;
    const matchType = typeFilter === "all" || d.type === typeFilter;
    return matchSearch && matchDomain && matchType;
  });

  return (
    <AppShell title="Document Vault" subtitle="Secure document exchange between you and your SZL team">
      <div className="p-6 max-w-7xl mx-auto space-y-5">

        {/* Security note */}
        <div
          className="flex items-center gap-3 rounded-xl px-4 py-3"
          style={{ background: "hsla(145, 62%, 36%, 0.06)", border: "1px solid hsla(145, 62%, 36%, 0.18)" }}
        >
          <Shield className="w-4 h-4 flex-shrink-0" style={{ color: "var(--color-forge-success)" }} />
          <span className="text-xs" style={{ color: "var(--color-forge-text-secondary)" }}>
            All documents are end-to-end encrypted. Access is logged and audited. Only documents explicitly shared by your SZL team are visible here.
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 lg:grid-cols-5 gap-3 animate-fade-in-up">
          {(["all", "vessels", "terra", "legal", "general"] as DomainFilter[]).map(d => {
            const count = d === "all" ? documents.length : documents.filter(doc => doc.domain === d).length;
            const Icon = d === "all" ? FileText : DOMAIN_ICONS[d];
            const color = d === "all" ? "var(--color-forge-primary)" : DOMAIN_COLORS[d];
            return (
              <button
                key={d}
                onClick={() => setDomainFilter(d)}
                className="forge-card-elevated p-3 text-left transition-all"
                style={{
                  borderColor: domainFilter === d ? color : undefined,
                  boxShadow: domainFilter === d ? `0 0 0 2px color-mix(in srgb, ${color} 16%, transparent)` : undefined,
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-3.5 h-3.5" style={{ color }} />
                  <span className="forge-eyebrow text-[0.6rem]">{d === "all" ? "All" : DOMAIN_LABELS[d]}</span>
                </div>
                <div className="forge-metric-xs" style={{ color }}>{count}</div>
              </button>
            );
          })}
        </div>

        {/* Search & filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--color-forge-text-faint)" }} />
            <input
              className="forge-input pl-9"
              placeholder="Search documents..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 flex-shrink-0" style={{ color: "var(--color-forge-text-faint)" }} />
            <select
              className="forge-input py-2 pr-8 text-sm"
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as TypeFilter)}
              style={{ minWidth: "140px" }}
            >
              <option value="all">All Types</option>
              <option value="report">Reports</option>
              <option value="filing">Filings</option>
              <option value="contract">Contracts</option>
              <option value="briefing">Briefings</option>
              <option value="invoice">Invoices</option>
            </select>
          </div>
        </div>

        {/* Document list */}
        <div className="forge-card-elevated overflow-hidden">
          <div className="px-5 py-3.5 border-b flex items-center justify-between" style={{ borderColor: "var(--color-forge-border)" }}>
            <span className="text-sm font-500" style={{ color: "var(--color-forge-text-secondary)" }}>{filtered.length} document{filtered.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="divide-y divide-[var(--color-forge-border)]">
            {filtered.length === 0 ? (
              <div className="py-12 text-center" style={{ color: "var(--color-forge-text-muted)" }}>
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <div className="text-sm">No documents match your filters</div>
              </div>
            ) : (
              filtered.map((doc, i) => {
                const Icon = DOMAIN_ICONS[doc.domain] ?? FileText;
                const domainColor = DOMAIN_COLORS[doc.domain] ?? "var(--color-forge-text-muted)";
                return (
                  <div
                    key={doc.id}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-[var(--color-forge-bg-secondary)] transition-colors animate-fade-in-up"
                    style={{ animationDelay: `${i * 0.03}s` }}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `color-mix(in srgb, ${domainColor} 12%, transparent)` }}
                    >
                      <Icon className="w-4 h-4" style={{ color: domainColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-500 text-sm truncate" style={{ color: "var(--color-forge-text)" }}>{doc.title}</div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="text-xs" style={{ color: "var(--color-forge-text-muted)" }}>{doc.uploadedBy}</span>
                        <span className="text-xs" style={{ color: "var(--color-forge-text-faint)" }}>·</span>
                        <span className="text-xs" style={{ color: "var(--color-forge-text-muted)" }}>{doc.uploadedDate}</span>
                        <span className="text-xs" style={{ color: "var(--color-forge-text-faint)" }}>·</span>
                        <span className="text-xs" style={{ color: "var(--color-forge-text-muted)" }}>{doc.size}</span>
                        <span className="text-xs" style={{ color: "var(--color-forge-text-faint)" }}>·</span>
                        <span
                          className="forge-badge"
                          style={{
                            background: `color-mix(in srgb, ${TYPE_COLORS[doc.type]} 10%, transparent)`,
                            border: `1px solid color-mix(in srgb, ${TYPE_COLORS[doc.type]} 22%, transparent)`,
                            color: TYPE_COLORS[doc.type],
                          }}
                        >
                          {doc.type}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="text-xs" style={{ color: "var(--color-forge-text-faint)", fontFamily: "var(--font-mono)" }}>{doc.version}</span>
                      <button className="forge-btn-ghost p-2" title="Preview">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="forge-btn-ghost p-2" title="Download">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="text-xs text-center" style={{ color: "var(--color-forge-text-faint)" }}>
          Document access is logged. All downloads are encrypted in transit. Access log available on request.
        </div>
      </div>
    </AppShell>
  );
}
