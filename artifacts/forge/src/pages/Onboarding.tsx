import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  Building2, Globe, FileCheck, BarChart3, Users, CreditCard,
  CheckCircle2, ChevronRight, ChevronLeft, Anchor, Scale,
  Shield, Upload, Plus, X, Sparkles
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { portalApi } from "@/lib/api";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, label: "Company Profile", icon: Building2, description: "Tell us about your organization" },
  { id: 2, label: "Domain Interests", icon: Globe, description: "Select your intelligence domains" },
  { id: 3, label: "KYC / Compliance", icon: FileCheck, description: "Upload verification documents" },
  { id: 4, label: "Portfolio Config", icon: BarChart3, description: "Configure your investment profile" },
  { id: 5, label: "Team Invitations", icon: Users, description: "Invite your team members" },
  { id: 6, label: "Billing Setup", icon: CreditCard, description: "Choose your plan and billing" },
];

const DOMAINS = [
  { id: "vessels" as const, label: "Maritime Intelligence", icon: Anchor, color: "var(--color-forge-vessels)", description: "Fleet tracking, voyage analytics, risk monitoring, port intelligence" },
  { id: "terra" as const, label: "Real Estate Intelligence", icon: Building2, color: "var(--color-forge-terra)", description: "Property analytics, distress signals, market pulse, opportunity scoring" },
  { id: "legal" as const, label: "Legal Intelligence", icon: Scale, color: "var(--color-forge-legal)", description: "Matter management, compliance monitoring, deadline tracking, filing analysis" },
  { id: "security" as const, label: "Security Intelligence", icon: Shield, color: "var(--color-forge-security)", description: "Threat monitoring, vulnerability scanning, incident response, posture management" },
];

export default function Onboarding() {
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    companyName: "",
    industry: "",
    size: "",
    website: "",
    headquarters: "",
    selectedDomains: [] as string[],
    kycFiles: [] as { name: string; type: string }[],
    investmentHorizon: "medium",
    riskProfile: "moderate",
    allocations: { vessels: 30, terra: 40, legal: 15, security: 15 },
    invitations: [] as { email: string; role: string }[],
    inviteEmail: "",
    inviteRole: "viewer",
    selectedTier: "professional",
    billingCycle: "annual",
  });

  const { data: status } = useQuery({
    queryKey: ["forge-portal", "onboarding"],
    queryFn: () => portalApi.getOnboardingStatus(),
    retry: 1,
  });

  useEffect(() => {
    if (!status || status.status === "not_started") return;
    if (status.status === "in_progress" && status.currentStep > 1) {
      setCurrentStep(status.currentStep);
    }
    setFormData(prev => ({
      ...prev,
      companyName: status.companyProfile?.name ?? prev.companyName,
      industry: status.companyProfile?.industry ?? prev.industry,
      size: status.companyProfile?.size ?? prev.size,
      website: status.companyProfile?.website ?? prev.website,
      headquarters: status.companyProfile?.headquarters ?? prev.headquarters,
      selectedDomains: status.domainInterests?.length ? status.domainInterests : prev.selectedDomains,
      kycFiles: status.kycDocuments?.length ? status.kycDocuments.map(d => ({ name: d.name, type: d.type })) : prev.kycFiles,
      investmentHorizon: status.portfolioConfig?.investmentHorizon ?? prev.investmentHorizon,
      riskProfile: status.portfolioConfig?.riskProfile ?? prev.riskProfile,
      allocations: status.portfolioConfig?.targetAllocation
        ? { vessels: status.portfolioConfig.targetAllocation.vessels ?? 30, terra: status.portfolioConfig.targetAllocation.terra ?? 40, legal: status.portfolioConfig.targetAllocation.legal ?? 15, security: status.portfolioConfig.targetAllocation.security ?? 15 }
        : prev.allocations,
      invitations: status.teamInvitations?.length ? status.teamInvitations.map(t => ({ email: t.email, role: t.role })) : prev.invitations,
      selectedTier: status.billingSetup?.tier ?? prev.selectedTier,
      billingCycle: status.billingSetup?.billingCycle ?? prev.billingCycle,
    }));
  }, [status]);

  const submitStep = useMutation({
    mutationFn: (params: { step: number; data: Record<string, unknown> }) =>
      portalApi.submitOnboardingStep(params.step, params.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forge-portal", "onboarding"] });
      if (currentStep < 6) setCurrentStep(currentStep + 1);
    },
  });

  const isCompleted = status?.status === "completed";

  function handleNext() {
    const stepData: Record<string, unknown> = {};
    switch (currentStep) {
      case 1:
        stepData.name = formData.companyName;
        stepData.industry = formData.industry;
        stepData.size = formData.size;
        stepData.website = formData.website;
        stepData.headquarters = formData.headquarters;
        break;
      case 2:
        stepData.domains = formData.selectedDomains;
        break;
      case 3:
        stepData.documents = formData.kycFiles.map(f => ({
          name: f.name, type: f.type, uploadedAt: new Date().toISOString(), status: "uploaded",
        }));
        break;
      case 4:
        stepData.investmentHorizon = formData.investmentHorizon;
        stepData.riskProfile = formData.riskProfile;
        stepData.targetAllocation = formData.allocations;
        break;
      case 5:
        stepData.invitations = formData.invitations.map(inv => ({
          ...inv, status: "pending", sentAt: new Date().toISOString(),
        }));
        break;
      case 6:
        stepData.tier = formData.selectedTier;
        stepData.billingCycle = formData.billingCycle;
        stepData.stripeCustomerId = null;
        break;
    }
    submitStep.mutate({ step: currentStep, data: stepData });
  }

  function toggleDomain(d: string) {
    setFormData(prev => ({
      ...prev,
      selectedDomains: prev.selectedDomains.includes(d)
        ? prev.selectedDomains.filter(x => x !== d)
        : [...prev.selectedDomains, d],
    }));
  }

  function addInvite() {
    if (!formData.inviteEmail.trim()) return;
    setFormData(prev => ({
      ...prev,
      invitations: [...prev.invitations, { email: prev.inviteEmail.trim(), role: prev.inviteRole }],
      inviteEmail: "",
    }));
  }

  function removeInvite(idx: number) {
    setFormData(prev => ({
      ...prev,
      invitations: prev.invitations.filter((_, i) => i !== idx),
    }));
  }

  if (isCompleted) {
    return (
      <AppShell title="Onboarding Complete" subtitle="Your portal is fully configured">
        <div className="p-6 max-w-3xl mx-auto">
          <div className="forge-card-elevated p-10 text-center animate-fade-in-up">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--color-forge-success) 15%, transparent)" }}>
              <CheckCircle2 className="w-8 h-8" style={{ color: "var(--color-forge-success)" }} />
            </div>
            <h2 className="text-xl font-700 mb-2" style={{ color: "var(--color-forge-text)", fontFamily: "var(--font-display)" }}>Welcome to Forge</h2>
            <p className="text-sm mb-6" style={{ color: "var(--color-forge-text-muted)" }}>
              Your portal has been fully provisioned. All selected intelligence domains are active, your team invitations have been sent, and billing is configured.
            </p>
            <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
              {[
                { label: "Domains Active", value: String(status?.domainInterests?.length ?? 4) },
                { label: "KYC Status", value: "Verified" },
                { label: "Team Invited", value: String(status?.teamInvitations?.length ?? 0) },
                { label: "Billing", value: status?.billingSetup?.tier ?? "Active" },
              ].map(item => (
                <div key={item.label} className="p-3 rounded-lg" style={{ background: "var(--color-forge-bg-secondary)" }}>
                  <div className="text-xs" style={{ color: "var(--color-forge-text-muted)" }}>{item.label}</div>
                  <div className="text-sm font-600 mt-0.5" style={{ color: "var(--color-forge-text)" }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Client Onboarding" subtitle="Configure your Forge portal in minutes">
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isDone = currentStep > step.id;
            return (
              <button
                key={step.id}
                onClick={() => isDone && setCurrentStep(step.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg transition-all flex-shrink-0 text-left",
                  isActive && "ring-1",
                  isDone && "cursor-pointer",
                )}
                style={{
                  background: isActive ? "color-mix(in srgb, var(--color-forge-primary) 10%, transparent)" : isDone ? "color-mix(in srgb, var(--color-forge-success) 8%, transparent)" : "var(--color-forge-bg-secondary)",
                  borderColor: isActive ? "var(--color-forge-primary)" : "transparent",
                  
                }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: isDone ? "var(--color-forge-success)" : isActive ? "var(--color-forge-primary)" : "var(--color-forge-bg-tertiary)",
                    color: isDone || isActive ? "#fff" : "var(--color-forge-text-muted)",
                  }}
                >
                  {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                </div>
                <div className="hidden md:block">
                  <div className="text-xs font-600" style={{ color: isActive ? "var(--color-forge-primary)" : isDone ? "var(--color-forge-success)" : "var(--color-forge-text-muted)" }}>{step.label}</div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="forge-card-elevated p-6 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="w-5 h-5" style={{ color: "var(--color-forge-primary)" }} />
            <div>
              <h2 className="text-lg font-600" style={{ color: "var(--color-forge-text)", fontFamily: "var(--font-display)" }}>
                {STEPS[currentStep - 1].label}
              </h2>
              <p className="text-sm" style={{ color: "var(--color-forge-text-muted)" }}>{STEPS[currentStep - 1].description}</p>
            </div>
            <span className="ml-auto forge-eyebrow">Step {currentStep} of 6</span>
          </div>

          {currentStep === 1 && (
            <div className="space-y-4">
              {[
                { label: "Company Name", key: "companyName", placeholder: "Acme Capital Partners" },
                { label: "Industry", key: "industry", placeholder: "Financial Services" },
                { label: "Company Size", key: "size", placeholder: "50-200 employees" },
                { label: "Website", key: "website", placeholder: "https://example.com" },
                { label: "Headquarters", key: "headquarters", placeholder: "New York, NY" },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-xs font-600 mb-1.5" style={{ color: "var(--color-forge-text-muted)" }}>{field.label}</label>
                  <input
                    type="text"
                    value={(formData as unknown as Record<string, string>)[field.key] ?? ""}
                    onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    style={{ background: "var(--color-forge-bg-secondary)", color: "var(--color-forge-text)", border: "1px solid var(--color-forge-border)" }}
                  />
                </div>
              ))}
            </div>
          )}

          {currentStep === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DOMAINS.map(domain => {
                const Icon = domain.icon;
                const selected = formData.selectedDomains.includes(domain.id);
                return (
                  <button
                    key={domain.id}
                    onClick={() => toggleDomain(domain.id)}
                    className={cn("p-4 rounded-lg text-left transition-all", selected && "ring-2")}
                    style={{
                      background: selected ? `color-mix(in srgb, ${domain.color} 10%, transparent)` : "var(--color-forge-bg-secondary)",
                      border: `1px solid ${selected ? domain.color : "var(--color-forge-border)"}`,
                      
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `color-mix(in srgb, ${domain.color} 15%, transparent)` }}>
                        <Icon className="w-5 h-5" style={{ color: domain.color }} />
                      </div>
                      <div>
                        <div className="text-sm font-600" style={{ color: "var(--color-forge-text)" }}>{domain.label}</div>
                        <div className="text-xs mt-1" style={{ color: "var(--color-forge-text-muted)" }}>{domain.description}</div>
                      </div>
                      {selected && <CheckCircle2 className="w-5 h-5 flex-shrink-0 ml-auto" style={{ color: domain.color }} />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors hover:border-[var(--color-forge-primary)]"
                style={{ borderColor: "var(--color-forge-border)" }}
                onClick={() => setFormData(prev => ({
                  ...prev,
                  kycFiles: [...prev.kycFiles, { name: `Document_${prev.kycFiles.length + 1}.pdf`, type: "identification" }],
                }))}
              >
                <Upload className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--color-forge-text-muted)" }} />
                <div className="text-sm font-500" style={{ color: "var(--color-forge-text)" }}>Click to upload KYC/AML documents</div>
                <div className="text-xs mt-1" style={{ color: "var(--color-forge-text-muted)" }}>Government ID, proof of address, corporate registration</div>
              </div>
              {formData.kycFiles.length > 0 && (
                <div className="space-y-2">
                  {formData.kycFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: "var(--color-forge-bg-secondary)" }}>
                      <FileCheck className="w-4 h-4" style={{ color: "var(--color-forge-success)" }} />
                      <span className="text-sm flex-1" style={{ color: "var(--color-forge-text)" }}>{file.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "color-mix(in srgb, var(--color-forge-success) 15%, transparent)", color: "var(--color-forge-success)" }}>Uploaded</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-600 mb-2" style={{ color: "var(--color-forge-text-muted)" }}>Investment Horizon</label>
                <div className="flex gap-2">
                  {["short", "medium", "long"].map(h => (
                    <button
                      key={h}
                      onClick={() => setFormData(prev => ({ ...prev, investmentHorizon: h }))}
                      className="px-4 py-2 rounded-lg text-sm font-500 capitalize transition-all"
                      style={{
                        background: formData.investmentHorizon === h ? "var(--color-forge-primary)" : "var(--color-forge-bg-secondary)",
                        color: formData.investmentHorizon === h ? "#fff" : "var(--color-forge-text)",
                        border: `1px solid ${formData.investmentHorizon === h ? "var(--color-forge-primary)" : "var(--color-forge-border)"}`,
                      }}
                    >
                      {h} term
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-600 mb-2" style={{ color: "var(--color-forge-text-muted)" }}>Risk Profile</label>
                <div className="flex gap-2">
                  {["conservative", "moderate", "aggressive"].map(r => (
                    <button
                      key={r}
                      onClick={() => setFormData(prev => ({ ...prev, riskProfile: r }))}
                      className="px-4 py-2 rounded-lg text-sm font-500 capitalize transition-all"
                      style={{
                        background: formData.riskProfile === r ? "var(--color-forge-primary)" : "var(--color-forge-bg-secondary)",
                        color: formData.riskProfile === r ? "#fff" : "var(--color-forge-text)",
                        border: `1px solid ${formData.riskProfile === r ? "var(--color-forge-primary)" : "var(--color-forge-border)"}`,
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-600 mb-2" style={{ color: "var(--color-forge-text-muted)" }}>Target Allocation</label>
                <div className="space-y-3">
                  {DOMAINS.map(domain => (
                    <div key={domain.id} className="flex items-center gap-3">
                      <span className="text-sm w-32" style={{ color: "var(--color-forge-text)" }}>{domain.label.replace(" Intelligence", "")}</span>
                      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--color-forge-bg-secondary)" }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${formData.allocations[domain.id]}%`, background: domain.color }}
                        />
                      </div>
                      <span className="text-xs font-mono w-10 text-right" style={{ color: "var(--color-forge-text-muted)" }}>{formData.allocations[domain.id]}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="email"
                  value={formData.inviteEmail}
                  onChange={e => setFormData(prev => ({ ...prev, inviteEmail: e.target.value }))}
                  placeholder="colleague@company.com"
                  className="flex-1 px-3 py-2 rounded-lg text-sm"
                  style={{ background: "var(--color-forge-bg-secondary)", color: "var(--color-forge-text)", border: "1px solid var(--color-forge-border)" }}
                />
                <select
                  value={formData.inviteRole}
                  onChange={e => setFormData(prev => ({ ...prev, inviteRole: e.target.value }))}
                  className="px-3 py-2 rounded-lg text-sm"
                  style={{ background: "var(--color-forge-bg-secondary)", color: "var(--color-forge-text)", border: "1px solid var(--color-forge-border)" }}
                >
                  <option value="viewer">Viewer</option>
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
                <button onClick={addInvite} className="px-3 py-2 rounded-lg" style={{ background: "var(--color-forge-primary)", color: "#fff" }}>
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {formData.invitations.length > 0 ? (
                <div className="space-y-2">
                  {formData.invitations.map((inv, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: "var(--color-forge-bg-secondary)" }}>
                      <Users className="w-4 h-4" style={{ color: "var(--color-forge-text-muted)" }} />
                      <span className="text-sm flex-1" style={{ color: "var(--color-forge-text)" }}>{inv.email}</span>
                      <span className="text-xs px-2 py-0.5 rounded capitalize" style={{ background: "color-mix(in srgb, var(--color-forge-primary) 12%, transparent)", color: "var(--color-forge-primary)" }}>{inv.role}</span>
                      <button onClick={() => removeInvite(idx)}><X className="w-3.5 h-3.5" style={{ color: "var(--color-forge-text-muted)" }} /></button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--color-forge-text-faint)" }} />
                  <p className="text-sm" style={{ color: "var(--color-forge-text-muted)" }}>No team members invited yet. You can add them later from Settings.</p>
                </div>
              )}
            </div>
          )}

          {currentStep === 6 && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-600 mb-2" style={{ color: "var(--color-forge-text-muted)" }}>Select Plan</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { id: "starter", name: "Starter", price: "$2,500/mo", desc: "Essential intelligence for growing firms" },
                    { id: "professional", name: "Professional", price: "$7,500/mo", desc: "Advanced analytics and AI agents", badge: "Recommended" },
                    { id: "enterprise", name: "Enterprise", price: "Custom", desc: "Full platform access with dedicated support" },
                  ].map(tier => (
                    <button
                      key={tier.id}
                      onClick={() => setFormData(prev => ({ ...prev, selectedTier: tier.id }))}
                      className={cn("p-4 rounded-lg text-left transition-all relative", formData.selectedTier === tier.id && "ring-2")}
                      style={{
                        background: formData.selectedTier === tier.id ? "color-mix(in srgb, var(--color-forge-primary) 8%, transparent)" : "var(--color-forge-bg-secondary)",
                        border: `1px solid ${formData.selectedTier === tier.id ? "var(--color-forge-primary)" : "var(--color-forge-border)"}`,
                        
                      }}
                    >
                      {tier.badge && (
                        <span className="absolute -top-2 right-3 text-[0.6rem] font-700 px-2 py-0.5 rounded-full text-white" style={{ background: "var(--color-forge-primary)" }}>{tier.badge}</span>
                      )}
                      <div className="text-sm font-600" style={{ color: "var(--color-forge-text)" }}>{tier.name}</div>
                      <div className="text-lg font-700 mt-1" style={{ color: "var(--color-forge-primary)", fontFamily: "var(--font-mono)" }}>{tier.price}</div>
                      <div className="text-xs mt-1" style={{ color: "var(--color-forge-text-muted)" }}>{tier.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-600 mb-2" style={{ color: "var(--color-forge-text-muted)" }}>Billing Cycle</label>
                <div className="flex gap-2">
                  {[
                    { id: "monthly", label: "Monthly" },
                    { id: "annual", label: "Annual", badge: "Save 10%" },
                  ].map(cycle => (
                    <button
                      key={cycle.id}
                      onClick={() => setFormData(prev => ({ ...prev, billingCycle: cycle.id }))}
                      className="px-4 py-2 rounded-lg text-sm font-500 transition-all flex items-center gap-2"
                      style={{
                        background: formData.billingCycle === cycle.id ? "var(--color-forge-primary)" : "var(--color-forge-bg-secondary)",
                        color: formData.billingCycle === cycle.id ? "#fff" : "var(--color-forge-text)",
                        border: `1px solid ${formData.billingCycle === cycle.id ? "var(--color-forge-primary)" : "var(--color-forge-border)"}`,
                      }}
                    >
                      {cycle.label}
                      {cycle.badge && <span className="text-[0.6rem] px-1.5 py-0.5 rounded-full bg-white/20">{cycle.badge}</span>}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-8 pt-4" style={{ borderTop: "1px solid var(--color-forge-border)" }}>
            <button
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-500 disabled:opacity-30 transition-colors"
              style={{ color: "var(--color-forge-text-muted)" }}
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={handleNext}
              disabled={submitStep.isPending}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-600 text-white transition-colors"
              style={{ background: "var(--color-forge-primary)" }}
            >
              {currentStep === 6 ? "Complete Setup" : "Continue"} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
