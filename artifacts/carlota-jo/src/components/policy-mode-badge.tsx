import { useQuery } from "@tanstack/react-query";
import { Eye, FileText, Hand, Bot, ShieldCheck, ExternalLink } from "lucide-react";

type PolicyMode =
  | "observe"
  | "recommend"
  | "draft"
  | "approval-required"
  | "auto-within-guardrails";

interface ResolveResponse {
  resolved: {
    mode: PolicyMode;
    scope?: { product: string; actionType: string; workspace: string };
    reason?: string;
  } | null;
  effectiveMode: PolicyMode;
  source: "registry" | "default";
}

const MODE_META: Record<
  PolicyMode,
  { label: string; color: string; bg: string; border: string; Icon: React.FC<{ size?: number }> }
> = {
  observe: { label: "Observe", color: "#7c8a9a", bg: "rgba(124,138,154,0.12)", border: "rgba(124,138,154,0.40)", Icon: Eye },
  recommend: { label: "Recommend", color: "#8b7ac8", bg: "rgba(139,122,200,0.12)", border: "rgba(139,122,200,0.40)", Icon: FileText },
  draft: { label: "Draft", color: "#0ea5e9", bg: "rgba(14,165,233,0.12)", border: "rgba(14,165,233,0.40)", Icon: FileText },
  "approval-required": { label: "Approval Required", color: "#B8960C", bg: "rgba(184,150,12,0.12)", border: "rgba(184,150,12,0.40)", Icon: Hand },
  "auto-within-guardrails": { label: "Auto · Guardrails", color: "#22c55e", bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.40)", Icon: Bot },
};

export interface PolicyModeBadgeProps {
  product: string;
  actionType?: string;
  workspace?: string;
  variant?: "light" | "dark";
}

export function PolicyModeBadge({ product, actionType, workspace, variant = "dark" }: PolicyModeBadgeProps) {
  const params = new URLSearchParams({ product });
  if (actionType) params.set("actionType", actionType);
  if (workspace) params.set("workspace", workspace);

  const q = useQuery<ResolveResponse>({
    queryKey: ["policy-modes-resolve", product, actionType ?? "*", workspace ?? "*"],
    queryFn: async () => {
      const res = await fetch(`/api/policy-modes/resolve?${params.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  const mode = q.data?.effectiveMode ?? "approval-required";
  const meta = MODE_META[mode] ?? MODE_META["approval-required"];
  const isLoading = q.isLoading;

  const deepLink = `/command/operations/policy-manager?product=${encodeURIComponent(product)}`;

  const tooltip = q.data?.resolved
    ? `Policy mode: ${meta.label} · Click to manage in Unified Command`
    : `No rule for ${product} — defaulting to Approval Required.`;

  return (
    <a
      href={deepLink}
      title={tooltip}
      data-testid={`policy-mode-badge-${product}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 10px",
        borderRadius: 8,
        background: variant === "light" ? "rgba(255,255,255,0.06)" : meta.bg,
        border: `1px solid ${meta.border}`,
        color: meta.color,
        fontSize: 10,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        textDecoration: "none",
        whiteSpace: "nowrap",
      }}
    >
      <ShieldCheck size={12} />
      <meta.Icon size={12} />
      <span>{isLoading ? "Policy…" : meta.label}</span>
      <ExternalLink size={10} style={{ opacity: 0.55 }} />
    </a>
  );
}

export default PolicyModeBadge;
