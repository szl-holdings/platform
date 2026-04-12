import { AppShell } from "@/components/layout/AppShell";
import { useState } from "react";
import {
  User, Shield, Bell, Eye, Lock, Key, Globe,
  CheckCircle2, ChevronRight
} from "lucide-react";
import { CLIENT } from "@/data/mock";

const DOMAIN_COLORS: Record<string, string> = {
  vessels: "var(--color-forge-vessels)",
  terra: "var(--color-forge-terra)",
  legal: "var(--color-forge-legal)",
  security: "var(--color-forge-security)",
};

const DOMAIN_LABELS: Record<string, string> = {
  vessels: "Maritime Tracking",
  terra: "Real Estate Portfolio",
  legal: "Legal Matter Tracker",
  security: "Security Posture",
};

export default function Settings() {
  const [emailNotif, setEmailNotif] = useState(true);
  const [inPortalNotif, setInPortalNotif] = useState(true);
  const [mfaEnabled, setMfaEnabled] = useState(true);

  return (
    <AppShell title="Settings" subtitle="Account preferences and access configuration">
      <div className="p-6 max-w-2xl mx-auto space-y-5">

        {/* Profile */}
        <Section title="Account Profile" icon={User}>
          <div className="flex items-center gap-4 mb-5">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-700"
              style={{ background: "var(--color-forge-gold)" }}
            >
              {CLIENT.avatarInitials}
            </div>
            <div>
              <div className="text-base font-600" style={{ color: "var(--color-forge-text)", fontFamily: "var(--font-display)" }}>{CLIENT.name}</div>
              <div className="text-sm" style={{ color: "var(--color-forge-text-muted)" }}>{CLIENT.companyName}</div>
              <div className="text-xs mt-0.5" style={{ color: "var(--color-forge-text-faint)" }}>Member since {CLIENT.memberSince} · {CLIENT.tier.charAt(0).toUpperCase() + CLIENT.tier.slice(1)} tier</div>
            </div>
            <span className="forge-badge forge-badge-gold ml-auto">{CLIENT.tier}</span>
          </div>
          <div className="space-y-3">
            <Field label="Email Address" value={CLIENT.email} type="email" />
            <Field label="Role" value={CLIENT.relationship} disabled />
          </div>
        </Section>

        {/* Domain Access */}
        <Section title="Domain Access" icon={Eye}>
          <p className="text-xs mb-4" style={{ color: "var(--color-forge-text-muted)" }}>
            Your domain access is managed by your SZL relationship team. Contact your manager to request changes.
          </p>
          <div className="space-y-2">
            {CLIENT.domains.map(d => (
              <div
                key={d}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ background: "var(--color-forge-bg-secondary)", border: "1px solid var(--color-forge-border)" }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: DOMAIN_COLORS[d] }}
                  />
                  <span className="text-sm font-500" style={{ color: "var(--color-forge-text)" }}>{DOMAIN_LABELS[d]}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" style={{ color: "var(--color-forge-success)" }} />
                  <span className="text-xs font-500" style={{ color: "var(--color-forge-success)" }}>Enabled</span>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Notifications */}
        <Section title="Notifications" icon={Bell}>
          <div className="space-y-3">
            <Toggle
              label="Email Notifications"
              description="Receive updates and alerts via email"
              checked={emailNotif}
              onChange={setEmailNotif}
            />
            <Toggle
              label="In-Portal Notifications"
              description="Show notification badge in the portal"
              checked={inPortalNotif}
              onChange={setInPortalNotif}
            />
          </div>
        </Section>

        {/* Security */}
        <Section title="Security" icon={Shield}>
          <div className="space-y-3">
            <Toggle
              label="Two-Factor Authentication"
              description="Enhanced login security via authenticator app"
              checked={mfaEnabled}
              onChange={setMfaEnabled}
            />
            <button className="forge-btn-secondary w-full justify-between">
              <span className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                Manage Sessions
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button className="forge-btn-secondary w-full justify-between">
              <span className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Change Password
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button className="forge-btn-secondary w-full justify-between">
              <span className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Access Log
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </Section>

        {/* Compliance note */}
        <div
          className="rounded-xl p-4 text-xs"
          style={{ background: "var(--color-forge-bg-secondary)", border: "1px solid var(--color-forge-border)", color: "var(--color-forge-text-muted)" }}
        >
          <p className="mb-1 font-500" style={{ color: "var(--color-forge-text)" }}>Account management</p>
          Account creation, domain access changes, and tier upgrades are managed exclusively by the SZL Holdings team. This portal is a managed relationship platform — not a self-service product. Contact your relationship manager at <a href="mailto:clients@szlholdings.com" style={{ color: "var(--color-forge-primary)" }}>clients@szlholdings.com</a> for any account changes.
        </div>
      </div>
    </AppShell>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; children: React.ReactNode }) {
  return (
    <div className="forge-card-elevated overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b" style={{ borderColor: "var(--color-forge-border)" }}>
        <Icon className="w-4 h-4" style={{ color: "var(--color-forge-primary)" }} />
        <h3 className="font-600 text-sm" style={{ color: "var(--color-forge-text)", fontFamily: "var(--font-display)" }}>{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Field({ label, value, type = "text", disabled }: { label: string; value: string; type?: string; disabled?: boolean }) {
  return (
    <div>
      <label className="forge-eyebrow block mb-1">{label}</label>
      <input
        className="forge-input"
        type={type}
        defaultValue={value}
        disabled={disabled}
        style={{ opacity: disabled ? 0.6 : 1 }}
      />
    </div>
  );
}

function Toggle({ label, description, checked, onChange }: {
  label: string; description: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--color-forge-bg-secondary)", border: "1px solid var(--color-forge-border)" }}>
      <div>
        <div className="text-sm font-500" style={{ color: "var(--color-forge-text)" }}>{label}</div>
        <div className="text-xs" style={{ color: "var(--color-forge-text-muted)" }}>{description}</div>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative w-10 h-5 rounded-full transition-colors flex-shrink-0"
        style={{ background: checked ? "var(--color-forge-primary)" : "var(--color-forge-bg-tertiary)" }}
      >
        <span
          className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
          style={{ left: checked ? "calc(100% - 1.125rem)" : "0.125rem", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}
        />
      </button>
    </div>
  );
}
