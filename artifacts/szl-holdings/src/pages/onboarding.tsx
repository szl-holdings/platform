import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { m } from "framer-motion";
import {
  Building2, Users, Bell, Plug, CheckCircle2, ArrowRight, ArrowLeft,
  Loader2, AlertCircle, ChevronRight,
} from "lucide-react";
import { apiFetch } from "@szl-holdings/shared-ui/api-fetch";
import { markActivationEvent } from "@szl-holdings/shared-ui/onboarding";

const API = "/api";

function getCsrfToken() {
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, { credentials: "include" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error ?? "Request failed");
  }
  const json = await res.json();
  return json.data ?? json;
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", "x-csrf-token": getCsrfToken() },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error ?? "Request failed");
  }
  if (res.status === 204) return null as T;
  const json = await res.json();
  return json.data ?? json;
}

async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json", "x-csrf-token": getCsrfToken() },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error ?? "Request failed");
  }
  if (res.status === 204) return null as T;
  const json = await res.json();
  return json.data ?? json;
}

const STEPS = [
  { id: "profile", label: "Organization Profile", icon: Building2, description: "Set up your organization's identity" },
  { id: "team", label: "Invite Team", icon: Users, description: "Bring your team on board" },
  { id: "notifications", label: "Notifications", icon: Bell, description: "Configure how you receive updates" },
  { id: "integrations", label: "Integrations", icon: Plug, description: "Connect your tools" },
];

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const STEP_IDS = ["profile", "team", "notifications", "integrations"];

export default function OnboardingPage({ orgSlug: initialOrgSlug }: { orgSlug?: string } = {}) {
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [orgSlug, setOrgSlug] = useState<string | null>(initialOrgSlug ?? null);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState({ name: "", slug: "", domain: "", orgType: "company" });
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member" | "viewer">("member");
  const [sentInvites, setSentInvites] = useState<string[]>([]);
  const [notifPrefs, setNotifPrefs] = useState({ emailEnabled: true, smsEnabled: false, slackEnabled: false, inAppEnabled: true });

  const wizardStateQuery = useQuery<{ wizard: { currentStep: string; completedSteps: string[] } }>({
    queryKey: ["onboarding-wizard", initialOrgSlug],
    queryFn: () =>
      apiGet<{ wizard: { currentStep: string; completedSteps: string[] } }>(`/onboarding/wizard/${initialOrgSlug}`),
    enabled: !!initialOrgSlug,
    staleTime: Infinity,
    retry: false,
  });

  useEffect(() => {
    if (!wizardStateQuery.data?.wizard) return;
    const { currentStep: step, completedSteps: done } = wizardStateQuery.data.wizard;
    const stepIdx = STEP_IDS.indexOf(step);
    if (stepIdx >= 0) setCurrentStep(stepIdx);
    const doneIdxs = done.map((s) => STEP_IDS.indexOf(s)).filter((i) => i >= 0);
    setCompletedSteps(doneIdxs);
  }, [wizardStateQuery.data]);

  const createOrgMutation = useMutation({
    mutationFn: () =>
      apiPost("/onboarding/org", {
        name: profile.name,
        slug: profile.slug || slugify(profile.name),
        domain: profile.domain || undefined,
        orgType: profile.orgType || undefined,
        plan: "starter",
      }),
    onSuccess: (data: { org?: { slug?: string } }) => {
      setOrgSlug(data.org?.slug ?? (profile.slug || slugify(profile.name)));
      setCompletedSteps((prev) => [...prev, 0]);
      setCurrentStep(1);
      setError(null);
    },
    onError: (err: Error) => setError(err.message),
  });

  const sendInviteMutation = useMutation({
    mutationFn: (email: string) =>
      apiPost(`/onboarding/resend-invite/${orgSlug}`, { email, role: inviteRole }),
    onSuccess: () => {
      setSentInvites((prev) => [...prev, inviteEmail]);
      setInviteEmail("");
      setError(null);
      markActivationEvent("teamMemberInvited");
    },
    onError: (err: Error) => setError(err.message),
  });

  const advanceWizardMutation = useMutation({
    mutationFn: (step: string) =>
      apiPut(`/onboarding/wizard/${orgSlug}`, { step }),
    onSuccess: () => {},
    onError: () => {},
  });

  const completeOnboardingMutation = useMutation({
    mutationFn: () =>
      apiPost(`/onboarding/wizard/${orgSlug}/complete`, {}),
    onSuccess: () => {
      navigate("/");
    },
    onError: (err: Error) => setError(err.message),
  });

  const saveNotifPrefs = async () => {
    if (!orgSlug) return;
    try {
      await apiPut(`/orgs/${orgSlug}/notification-prefs`, notifPrefs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save notification preferences");
    }
  };

  const handleNext = async () => {
    setError(null);
    const step = STEPS[currentStep];
    if (!step) return;

    if (currentStep === 0) {
      if (!profile.name.trim()) { setError("Organization name is required"); return; }
      createOrgMutation.mutate();
      return;
    }

    if (currentStep === 2) {
      await saveNotifPrefs();
    }

    if (orgSlug) {
      advanceWizardMutation.mutate(step.id);
    }

    setCompletedSteps((prev) => [...prev, currentStep]);
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboardingMutation.mutate();
    }
  };

  const progress = Math.round(((completedSteps.length) / STEPS.length) * 100);
  const isLoading = createOrgMutation.isPending || completeOnboardingMutation.isPending;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      <div className="border-b border-white/10 px-6 py-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#c9a84c]/20 flex items-center justify-center">
          <Building2 size={16} className="text-[#c9a84c]" />
        </div>
        <span className="font-semibold text-sm">SZL Holdings — Onboarding</span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-white/40">{progress}% complete</span>
          <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#c9a84c] rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-1 max-w-5xl mx-auto w-full gap-8 px-6 py-10">
        <div className="w-60 shrink-0 flex flex-col gap-2">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const done = completedSteps.includes(i);
            const active = i === currentStep;
            return (
              <div
                key={step.id}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                  active ? "bg-white/8 border border-white/15" : "opacity-50"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  done ? "bg-emerald-500/20" : active ? "bg-[#c9a84c]/20" : "bg-white/5"
                }`}>
                  {done ? (
                    <CheckCircle2 size={15} className="text-emerald-400" />
                  ) : (
                    <Icon size={15} className={active ? "text-[#c9a84c]" : "text-white/40"} />
                  )}
                </div>
                <div>
                  <div className="text-xs font-medium">{step.label}</div>
                  <div className="text-[10px] text-white/40">{step.description}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex-1">
          <m.div
            key={currentStep}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="bg-white/4 border border-white/10 rounded-2xl p-8"
          >
            {currentStep === 0 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold">Set up your organization</h2>
                  <p className="text-sm text-white/50 mt-1">This is how your team will appear on the platform.</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-white/60 mb-1.5 block">Organization Name *</label>
                    <input
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c]/60 transition-colors"
                      placeholder="Acme Corp"
                      value={profile.name}
                      onChange={(e) => {
                        const name = e.target.value;
                        setProfile((p) => ({ ...p, name, slug: slugify(name) }));
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-white/60 mb-1.5 block">Slug (URL identifier)</label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/30">platform.co/</span>
                      <input
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c]/60 transition-colors"
                        placeholder="acme-corp"
                        value={profile.slug}
                        onChange={(e) => setProfile((p) => ({ ...p, slug: slugify(e.target.value) }))}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-white/60 mb-1.5 block">Domain (optional)</label>
                    <input
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c]/60 transition-colors"
                      placeholder="acmecorp.com"
                      value={profile.domain}
                      onChange={(e) => setProfile((p) => ({ ...p, domain: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-white/60 mb-1.5 block">Organization Type</label>
                    <select
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c]/60 transition-colors"
                      value={profile.orgType}
                      onChange={(e) => setProfile((p) => ({ ...p, orgType: e.target.value }))}
                    >
                      <option value="company">Company</option>
                      <option value="startup">Startup</option>
                      <option value="enterprise">Enterprise</option>
                      <option value="government">Government</option>
                      <option value="ngo">NGO / Non-profit</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold">Invite your team</h2>
                  <p className="text-sm text-white/50 mt-1">Add team members now or skip and do it later from settings.</p>
                </div>
                <div className="flex gap-2">
                  <input
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c]/60 transition-colors"
                    placeholder="colleague@example.com"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && inviteEmail) sendInviteMutation.mutate(inviteEmail); }}
                  />
                  <select
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as "admin" | "member" | "viewer")}
                  >
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <button
                    className="px-4 py-2.5 bg-[#c9a84c]/20 hover:bg-[#c9a84c]/30 border border-[#c9a84c]/30 rounded-lg text-sm text-[#c9a84c] font-medium transition-colors disabled:opacity-50"
                    onClick={() => inviteEmail && sendInviteMutation.mutate(inviteEmail)}
                    disabled={!inviteEmail || sendInviteMutation.isPending}
                  >
                    {sendInviteMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : "Invite"}
                  </button>
                </div>
                {sentInvites.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-white/40 font-medium">SENT INVITATIONS</p>
                    {sentInvites.map((email) => (
                      <div key={email} className="flex items-center gap-2 text-sm text-white/70">
                        <CheckCircle2 size={13} className="text-emerald-400" />
                        {email}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold">Notification preferences</h2>
                  <p className="text-sm text-white/50 mt-1">Choose how you want to receive updates and alerts.</p>
                </div>
                <div className="space-y-3">
                  {[
                    { key: "inAppEnabled", label: "In-app notifications", desc: "Real-time alerts within the platform" },
                    { key: "emailEnabled", label: "Email notifications", desc: "Digest and critical alerts via email" },
                    { key: "smsEnabled", label: "SMS notifications", desc: "Critical alerts via text message" },
                    { key: "slackEnabled", label: "Slack notifications", desc: "Alerts sent to your Slack workspace" },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between p-4 bg-white/3 border border-white/8 rounded-xl">
                      <div>
                        <p className="text-sm font-medium">{label}</p>
                        <p className="text-xs text-white/40">{desc}</p>
                      </div>
                      <button
                        className={`w-11 h-6 rounded-full transition-colors relative ${
                          notifPrefs[key as keyof typeof notifPrefs] ? "bg-[#c9a84c]" : "bg-white/15"
                        }`}
                        onClick={() => setNotifPrefs((p) => ({ ...p, [key]: !p[key as keyof typeof notifPrefs] }))}
                      >
                        <span
                          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                            notifPrefs[key as keyof typeof notifPrefs] ? "translate-x-[22px]" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold">Connect your integrations</h2>
                  <p className="text-sm text-white/50 mt-1">Link the tools your team already uses. You can configure these later from Settings.</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { name: "Slack", desc: "Team notifications", icon: "💬" },
                    { name: "GitHub", desc: "Code & deployments", icon: "🐙" },
                    { name: "Jira", desc: "Project tracking", icon: "📋" },
                    { name: "Stripe", desc: "Billing & payments", icon: "💳" },
                    { name: "Salesforce", desc: "CRM data sync", icon: "☁️" },
                    { name: "HubSpot", desc: "Marketing & sales", icon: "🔶" },
                  ].map((int) => (
                    <div key={int.name} className="flex items-center gap-3 p-3 bg-white/3 border border-white/8 rounded-xl hover:border-white/15 transition-colors cursor-pointer">
                      <span className="text-xl">{int.icon}</span>
                      <div>
                        <p className="text-sm font-medium">{int.name}</p>
                        <p className="text-xs text-white/40">{int.desc}</p>
                      </div>
                      <ChevronRight size={14} className="ml-auto text-white/20" />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-white/30">Integrations can be fully configured in Settings → Integrations after onboarding.</p>
              </div>
            )}

            {error && (
              <div className="mt-4 flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <AlertCircle size={14} className="text-red-400 shrink-0" />
                <p className="text-xs text-red-300">{error}</p>
              </div>
            )}

            <div className="mt-8 flex items-center justify-between">
              <button
                className="flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors disabled:opacity-30"
                onClick={() => currentStep > 0 && setCurrentStep(currentStep - 1)}
                disabled={currentStep === 0 || isLoading}
              >
                <ArrowLeft size={14} /> Back
              </button>
              <button
                className="flex items-center gap-2 px-5 py-2.5 bg-[#c9a84c] hover:bg-[#c9a84c]/90 text-black text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
                onClick={handleNext}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : currentStep === STEPS.length - 1 ? (
                  <>Complete Setup <CheckCircle2 size={14} /></>
                ) : (
                  <>Continue <ArrowRight size={14} /></>
                )}
              </button>
            </div>
          </m.div>
        </div>
      </div>
    </div>
  );
}
