import { useQuery } from "@tanstack/react-query";
import { Eye, FileText, Hand, Bot, ShieldCheck, ExternalLink } from "lucide-react";
import { cn } from "../utils";

export type PolicyMode =
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
  { label: string; color: string; bg: string; border: string; Icon: React.FC<{ className?: string }> }
> = {
  observe: {
    label: "Observe",
    color: "#7c8a9a",
    bg: "rgba(124,138,154,0.10)",
    border: "rgba(124,138,154,0.35)",
    Icon: Eye,
  },
  recommend: {
    label: "Recommend",
    color: "#8b7ac8",
    bg: "rgba(139,122,200,0.10)",
    border: "rgba(139,122,200,0.35)",
    Icon: FileText,
  },
  draft: {
    label: "Draft",
    color: "#0ea5e9",
    bg: "rgba(14,165,233,0.10)",
    border: "rgba(14,165,233,0.35)",
    Icon: FileText,
  },
  "approval-required": {
    label: "Approval Required",
    color: "#d4a054",
    bg: "rgba(212,160,84,0.10)",
    border: "rgba(212,160,84,0.35)",
    Icon: Hand,
  },
  "auto-within-guardrails": {
    label: "Auto · Guardrails",
    color: "#22c55e",
    bg: "rgba(34,197,94,0.10)",
    border: "rgba(34,197,94,0.35)",
    Icon: Bot,
  },
};

export interface PolicyModeBadgeProps {
  /** Product slug used to scope the policy lookup (e.g. "vessels", "terra"). */
  product: string;
  /** Optional action type narrowing the lookup scope. */
  actionType?: string;
  /** Optional workspace narrowing the lookup scope. */
  workspace?: string;
  /** Extra tailwind classes appended to the badge. */
  className?: string;
  /**
   * Visual variant.
   * - "dark" (default): mode-tinted background, suitable for dark surfaces.
   * - "light": neutral translucent background; mode color is used for text/border only.
   */
  variant?: "dark" | "light";
  /** Optional override for the deep-link target. Defaults to the Unified Command policy manager. */
  deepLinkBase?: string;
}

/**
 * PolicyModeBadge — shared, governance-aware badge that resolves the current
 * policy mode for a product and links to the Unified Command policy manager.
 *
 * Used across product surfaces (Vessels, Terra, Carlota, …) so that mode
 * metadata, colors, query behavior, and deep-link targets stay in sync.
 */
export function PolicyModeBadge({
  product,
  actionType,
  workspace,
  className,
  variant = "dark",
  deepLinkBase = "/command/operations/policy-manager",
}: PolicyModeBadgeProps) {
  const params = new URLSearchParams({ product });
  if (actionType) params.set("actionType", actionType);
  if (workspace) params.set("workspace", workspace);

  const q = useQuery<ResolveResponse>({
    queryKey: ["policy-modes-resolve", product, actionType ?? "*", workspace ?? "*"],
    queryFn: async () => {
      const res = await fetch(`/api/policy-modes/resolve?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  const mode: PolicyMode = q.data?.effectiveMode ?? "approval-required";
  const meta = MODE_META[mode] ?? MODE_META["approval-required"];
  const isLoading = q.isLoading;

  const deepLink = `${deepLinkBase}?product=${encodeURIComponent(product)}`;

  const tooltip = q.data?.resolved
    ? `Policy mode: ${meta.label}\nScope: ${q.data.resolved.scope?.product ?? product} · ${
        q.data.resolved.scope?.actionType ?? "*"
      }${q.data.resolved.reason ? `\n${q.data.resolved.reason}` : ""}\nClick to manage rules in Unified Command`
    : `No rule registered for ${product} — defaulting to Approval Required.\nClick to add a rule in Unified Command.`;

  return (
    <a
      href={deepLink}
      title={tooltip}
      className={cn(
        "group inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-mono font-semibold tracking-wide transition-colors no-underline whitespace-nowrap",
        className
      )}
      style={{
        color: meta.color,
        background: variant === "light" ? "rgba(255,255,255,0.06)" : meta.bg,
        border: `1px solid ${meta.border}`,
      }}
      data-testid={`policy-mode-badge-${product}`}
    >
      <ShieldCheck className="w-3 h-3 opacity-60" />
      <meta.Icon className="w-3 h-3" />
      <span className="uppercase tracking-wider">
        {isLoading ? "Policy…" : meta.label}
      </span>
      <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-70 transition-opacity" />
    </a>
  );
}

export default PolicyModeBadge;
