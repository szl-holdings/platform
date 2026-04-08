import { Lock, Archive, Shield, Eye } from "lucide-react";

export interface MatterAwarenessBadgeProps {
  isHoldAware?: boolean;
  isExportControlled?: boolean;
  isRestrictedByMatterPermissions?: boolean;
  additionalReviewRequired?: boolean;
  compact?: boolean;
}

export function MatterAwarenessBadges({
  isHoldAware = false,
  isExportControlled = false,
  isRestrictedByMatterPermissions = false,
  additionalReviewRequired = false,
  compact = false,
}: MatterAwarenessBadgeProps) {
  const badges = [
    isHoldAware && {
      icon: Lock,
      label: "hold-aware",
      title: "This matter has an active legal hold. Additional care required before modifying or exporting records.",
      color: "#c45a4a",
    },
    isExportControlled && {
      icon: Archive,
      label: "export-controlled",
      title: "Export of this matter's data is subject to compliance controls. Approval required before external distribution.",
      color: "#d4a054",
    },
    isRestrictedByMatterPermissions && {
      icon: Shield,
      label: "restricted",
      title: "Access to certain records in this matter is restricted by matter permissions.",
      color: "#8b7ac8",
    },
    additionalReviewRequired && {
      icon: Eye,
      label: "additional review required",
      title: "One or more outputs for this matter require additional review before they can be used or exported.",
      color: "#d4a054",
    },
  ].filter(Boolean) as { icon: any; label: string; title: string; color: string }[];

  if (badges.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {badges.map((badge, i) => {
        const Icon = badge.icon;
        return (
          <span
            key={i}
            title={badge.title}
            className={`inline-flex items-center gap-1 rounded font-mono cursor-help ${compact ? "px-1 py-0.5 text-[8px]" : "px-1.5 py-0.5 text-[9px]"}`}
            style={{ background: `${badge.color}12`, color: badge.color, border: `1px solid ${badge.color}20` }}
          >
            <Icon className={compact ? "w-2 h-2" : "w-2.5 h-2.5"} />
            {badge.label}
          </span>
        );
      })}
    </div>
  );
}

export function HoldAwareBadge({ compact = false }: { compact?: boolean }) {
  return <MatterAwarenessBadges isHoldAware compact={compact} />;
}

export function ExportControlledBadge({ compact = false }: { compact?: boolean }) {
  return <MatterAwarenessBadges isExportControlled compact={compact} />;
}
