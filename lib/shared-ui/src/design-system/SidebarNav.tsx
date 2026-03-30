import * as React from "react";
import { cn } from "../utils";

export interface SidebarNavItem {
  id: string;
  label: string;
  href?: string;
  icon?: React.ReactNode;
  badge?: string | number;
  badgeVariant?: "default" | "danger" | "warning" | "success";
  children?: SidebarNavItem[];
  onClick?: () => void;
}

export interface SidebarNavSection {
  id?: string;
  label?: string;
  items: SidebarNavItem[];
}

export interface SidebarNavProps {
  sections: SidebarNavSection[];
  currentPath?: string;
  collapsed?: boolean;
  accentColor?: string;
  onNavigate?: (item: SidebarNavItem) => void;
  className?: string;
  footer?: React.ReactNode;
  header?: React.ReactNode;
}

const BADGE_COLORS: Record<string, string> = {
  default: "bg-white/10 text-white/60",
  danger: "bg-red-500/20 text-red-400",
  warning: "bg-amber-500/20 text-amber-400",
  success: "bg-emerald-500/20 text-emerald-400",
};

export function SidebarNav({
  sections,
  currentPath = "/",
  collapsed = false,
  accentColor = "hsl(215 45% 32%)",
  onNavigate,
  className,
  footer,
  header,
}: SidebarNavProps) {
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isActive = (item: SidebarNavItem) =>
    item.href ? currentPath === item.href || currentPath.startsWith(item.href + "/") : false;

  const renderItem = (item: SidebarNavItem, depth = 0) => {
    const active = isActive(item);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expanded.has(item.id);

    const Tag = item.href ? "a" : "button";

    return (
      <li key={item.id}>
        <Tag
          href={item.href}
          onClick={(e) => {
            if (hasChildren) {
              e.preventDefault();
              toggleExpanded(item.id);
            }
            item.onClick?.();
            onNavigate?.(item);
          }}
          className={cn(
            "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 group",
            depth > 0 && "pl-8 text-xs",
            active
              ? "bg-white/10 text-white"
              : "text-white/50 hover:text-white hover:bg-white/5"
          )}
          style={active ? { color: "white" } : undefined}
          aria-current={active ? "page" : undefined}
        >
          {item.icon && (
            <span
              className={cn(
                "shrink-0 w-4 h-4 transition-colors",
                active ? "text-white" : "text-white/40 group-hover:text-white/70"
              )}
              style={active ? { color: accentColor } : undefined}
            >
              {item.icon}
            </span>
          )}
          {!collapsed && (
            <>
              <span className="flex-1 truncate text-left">{item.label}</span>
              {item.badge !== undefined && (
                <span
                  className={cn(
                    "shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                    BADGE_COLORS[item.badgeVariant ?? "default"]
                  )}
                >
                  {item.badge}
                </span>
              )}
              {hasChildren && (
                <span
                  className={cn(
                    "shrink-0 text-white/30 transition-transform duration-200",
                    isExpanded && "rotate-90"
                  )}
                >
                  ›
                </span>
              )}
            </>
          )}
        </Tag>

        {hasChildren && isExpanded && !collapsed && (
          <ul className="mt-0.5 space-y-0.5">
            {item.children!.map((child) => renderItem(child, depth + 1))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <nav className={cn("flex flex-col h-full py-3", className)} aria-label="Sidebar">
      {header && <div className="px-3 mb-3">{header}</div>}

      <div className="flex-1 overflow-y-auto px-2 space-y-4">
        {sections.map((section, si) => (
          <div key={section.id ?? si}>
            {section.label && !collapsed && (
              <p className="px-2.5 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/25">
                {section.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => renderItem(item))}
            </ul>
          </div>
        ))}
      </div>

      {footer && (
        <div className={cn("px-2 pt-3 border-t border-white/8", collapsed && "px-1")}>
          {footer}
        </div>
      )}
    </nav>
  );
}
