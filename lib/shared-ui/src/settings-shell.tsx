/**
 * Unified Settings Shell
 *
 * Provides a consistent sidebar + content layout for settings pages across
 * all apps. Apps compose their own panels and pass them as children.
 *
 * Usage:
 *   <SettingsShell app="aegis" activeSection="account">
 *     <AccountPanel />
 *   </SettingsShell>
 */

import { type ReactNode } from "react";
import { cn } from "./utils";
import {
  User, Users, Bell, Plug, ShieldCheck, CreditCard, Sliders, FileText,
} from "lucide-react";

export type SettingsSection =
  | "account"
  | "workspace"
  | "team"
  | "notifications"
  | "integrations"
  | "security"
  | "billing"
  | "preferences"
  | "audit";

interface SettingsSectionDef {
  id: SettingsSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const SETTINGS_SECTIONS: SettingsSectionDef[] = [
  { id: "account", label: "Account", icon: User },
  { id: "workspace", label: "Workspace", icon: Sliders },
  { id: "team", label: "Team", icon: Users },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "integrations", label: "Integrations", icon: Plug },
  { id: "security", label: "Security", icon: ShieldCheck },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "preferences", label: "Preferences", icon: Sliders },
  { id: "audit", label: "Audit Log", icon: FileText },
];

export interface SettingsShellProps {
  activeSection: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
  children: ReactNode;
  availableSections?: SettingsSection[];
  isAdmin?: boolean;
  accentColor?: string;
  appName?: string;
  className?: string;
}

export function SettingsShell({
  activeSection,
  onSectionChange,
  children,
  availableSections,
  isAdmin = false,
  accentColor,
  appName,
  className,
}: SettingsShellProps) {
  const sections = SETTINGS_SECTIONS.filter((s) => {
    if (s.adminOnly && !isAdmin) return false;
    if (availableSections && !availableSections.includes(s.id)) return false;
    return true;
  });

  return (
    <div className={cn("flex h-full min-h-0", className)}>
      <aside className="w-52 shrink-0 border-r border-border/60 bg-muted/20 flex flex-col">
        {appName && (
          <div className="px-4 pt-5 pb-3 border-b border-border/40">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              {appName}
            </p>
            <p className="text-xs text-foreground font-medium mt-0.5">Settings</p>
          </div>
        )}
        <nav className="flex-1 py-2 overflow-y-auto">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => onSectionChange(section.id)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-colors text-left",
                  isActive
                    ? "text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
                )}
                style={
                  isActive && accentColor
                    ? { color: accentColor, background: `${accentColor}0d`, borderRight: `2px solid ${accentColor}` }
                    : isActive
                    ? {}
                    : undefined
                }
              >
                <Icon
                  className={cn(
                    "w-4 h-4 shrink-0",
                    isActive ? "opacity-100" : "opacity-50",
                  )}
                />
                {section.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 min-w-0 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SettingsPage — full-page wrapper with header
// ─────────────────────────────────────────────────────────────────────────────

export interface SettingsPageProps extends SettingsShellProps {
  title?: string;
  description?: string;
}

export function SettingsPage({ title, description, ...shellProps }: SettingsPageProps) {
  return (
    <div className="flex flex-col h-full">
      {(title || description) && (
        <div className="px-6 py-4 border-b border-border/60 shrink-0">
          {title && <h1 className="text-lg font-semibold">{title}</h1>}
          {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
        </div>
      )}
      <div className="flex-1 min-h-0">
        <SettingsShell {...shellProps} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SettingsSection — panel wrapper with consistent spacing
// ─────────────────────────────────────────────────────────────────────────────

export interface SettingsSectionPanelProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function SettingsSectionPanel({
  title,
  description,
  children,
  className,
}: SettingsSectionPanelProps) {
  return (
    <div className={cn("p-6 space-y-6", className)}>
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SettingsRow — a single labelled field row
// ─────────────────────────────────────────────────────────────────────────────

export interface SettingsRowProps {
  label: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function SettingsRow({ label, description, children, className }: SettingsRowProps) {
  return (
    <div className={cn("flex items-start justify-between gap-6 py-4 border-b border-border/40 last:border-0", className)}>
      <div className="min-w-[180px] max-w-[240px]">
        <p className="text-sm font-medium">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
        )}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SettingsCard — grouped settings block
// ─────────────────────────────────────────────────────────────────────────────

export interface SettingsCardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function SettingsCard({ title, children, className }: SettingsCardProps) {
  return (
    <div className={cn("rounded-xl border border-border/60 bg-card overflow-hidden", className)}>
      {title && (
        <div className="px-5 py-3 border-b border-border/40 bg-muted/20">
          <p className="text-sm font-medium">{title}</p>
        </div>
      )}
      <div className="px-5 divide-y divide-border/40">{children}</div>
    </div>
  );
}

export const SETTINGS_SECTIONS_CONFIG = SETTINGS_SECTIONS;
