import { useQuery } from "@tanstack/react-query";
import { Eye, FileText, Hand, Bot, ShieldCheck, ExternalLink } from "lucide-react";
import { cn } from "../utils.js";
import { color } from "../tokens/index.js";

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
  { label: string; modeColor: string; Icon: React.FC<{ className?: string }> }
> = {
  observe: {
    label: "Observe",
    modeColor: color.text.secondary,
    Icon: Eye,
  },
  recommend: {
    label: "Recommend",
    modeColor: color.accent.violet,
    Icon: FileText,
  },
  draft: {
    label: "Draft",
    modeColor: color.accent.blue,
    Icon: FileText,
  },
  "approval-required": {
    label: "Approval Required",
    modeColor: color.accent.amber,
    Icon: Hand,
  },
  "auto-within-guardrails": {
    label: "Auto · Guardrails",
    modeColor: color.accent.green,
    Icon: Bot,
  },
};

export interface PolicyModeBadgeProps {
  product: string;
  actionType?: string;
  workspace?: string;
  className?: string;
  variant?: "dark" | "light";
  deepLinkBase?: string;
}

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
      return res.json() as Promise<ResolveResponse>;
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
        "group inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-mono font-semibold tracking-wide transition-colors no-underline whitespace-nowrap",
        className,
      )}
      style={{
        color: meta.modeColor,
        background: variant === "light" ? color.bg.overlay : color.bg.overlay,
        border: `1px solid ${color.border.default}`,
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
