import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Palette, Save, RotateCcw, Eye, EyeOff } from "lucide-react";
import { apiGet, apiPut, apiDelete } from "../lib/api";
import { toast } from "sonner";

interface OrgBranding {
  id: number;
  orgId: number;
  appName: string | null;
  tagline: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  customCss: string | null;
  emailFromName: string | null;
  emailFooterText: string | null;
  supportEmail: string | null;
  supportUrl: string | null;
  privacyUrl: string | null;
  termsUrl: string | null;
}

interface OrgBrandingResponse {
  branding: OrgBranding | null;
}

const DEFAULT_BRANDING = {
  appName: "",
  tagline: "",
  logoUrl: "",
  faviconUrl: "",
  primaryColor: "#6366f1",
  secondaryColor: "#7c3aed",
  accentColor: "#06b6d4",
  backgroundColor: "#0f172a",
  surfaceColor: "#1e293b",
  textColor: "#f8fafc",
  customCss: "",
  emailFromName: "",
  emailFooterText: "",
  supportEmail: "",
  supportUrl: "",
  privacyUrl: "",
  termsUrl: "",
};

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-700/50">
      <label className="text-sm text-slate-300">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer border border-slate-600 bg-transparent"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-24 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
        />
      </div>
    </div>
  );
}

function TextField({ label, value, onChange, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-medium text-slate-300 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
      />
    </div>
  );
}

export default function BrandingPage() {
  const { orgId } = useParams<{ orgId?: string }>();
  const selectedOrgId = orgId ? parseInt(orgId, 10) : null;
  const qc = useQueryClient();
  const [preview, setPreview] = useState(false);
  const [form, setForm] = useState(DEFAULT_BRANDING);

  const { data, isLoading } = useQuery<OrgBrandingResponse>({
    queryKey: ["org-branding", selectedOrgId],
    queryFn: () => apiGet(`/orgs/${selectedOrgId}/branding`),
    enabled: !!selectedOrgId,
  });

  useEffect(() => {
    if (data?.branding) {
      const b = data.branding;
      setForm({
        appName: b.appName ?? "",
        tagline: b.tagline ?? "",
        logoUrl: b.logoUrl ?? "",
        faviconUrl: b.faviconUrl ?? "",
        primaryColor: b.primaryColor,
        secondaryColor: b.secondaryColor,
        accentColor: b.accentColor,
        backgroundColor: b.backgroundColor,
        surfaceColor: b.surfaceColor,
        textColor: b.textColor,
        customCss: b.customCss ?? "",
        emailFromName: b.emailFromName ?? "",
        emailFooterText: b.emailFooterText ?? "",
        supportEmail: b.supportEmail ?? "",
        supportUrl: b.supportUrl ?? "",
        privacyUrl: b.privacyUrl ?? "",
        termsUrl: b.termsUrl ?? "",
      });
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (values: typeof form) => apiPut(`/orgs/${selectedOrgId}/branding`, values),
    onSuccess: () => {
      toast.success("Branding saved");
      qc.invalidateQueries({ queryKey: ["org-branding", selectedOrgId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const resetMutation = useMutation({
    mutationFn: () => apiDelete(`/orgs/${selectedOrgId}/branding`),
    onSuccess: () => {
      toast.success("Branding reset to defaults");
      setForm(DEFAULT_BRANDING);
      qc.invalidateQueries({ queryKey: ["org-branding", selectedOrgId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const setField = (key: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [key]: v }));

  if (!selectedOrgId) {
    return (
      <div className="p-8">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center">
          <Palette className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h2 className="text-white font-semibold mb-2">Select a Tenant</h2>
          <p className="text-slate-400 text-sm">Navigate to a tenant's branding from the Tenants page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">White-Label Branding</h1>
          <p className="text-slate-400 text-sm mt-0.5">Org #{selectedOrgId} — Customize tenant identity</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreview((p) => !p)}
            className="flex items-center gap-2 px-3 py-2 border border-slate-600 text-slate-300 hover:border-slate-500 rounded-lg text-sm transition-colors"
          >
            {preview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {preview ? "Hide" : "Preview"}
          </button>
          <button
            onClick={() => resetMutation.mutate()}
            disabled={resetMutation.isPending}
            className="flex items-center gap-2 px-3 py-2 border border-slate-600 text-slate-300 hover:border-red-500 hover:text-red-400 rounded-lg text-sm transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          <button
            onClick={() => saveMutation.mutate(form)}
            disabled={saveMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Save className="w-4 h-4" />
            {saveMutation.isPending ? "Saving…" : "Save Branding"}
          </button>
        </div>
      </div>

      {preview && (
        <div
          className="rounded-xl p-6 mb-6 border"
          style={{
            backgroundColor: form.backgroundColor,
            borderColor: form.primaryColor + "40",
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            {form.logoUrl && (
              <img src={form.logoUrl} alt="Logo" className="h-8 rounded" onError={(e) => { e.currentTarget.style.display = "none"; }} />
            )}
            <div>
              <p className="font-bold" style={{ color: form.textColor }}>{form.appName || "Your App Name"}</p>
              {form.tagline && <p className="text-xs" style={{ color: form.textColor + "80" }}>{form.tagline}</p>}
            </div>
          </div>
          <div className="flex gap-2">
            <div className="px-3 py-1.5 rounded text-xs font-medium text-white" style={{ backgroundColor: form.primaryColor }}>Primary Action</div>
            <div className="px-3 py-1.5 rounded text-xs font-medium text-white" style={{ backgroundColor: form.secondaryColor }}>Secondary</div>
            <div className="px-3 py-1.5 rounded text-xs font-medium text-white" style={{ backgroundColor: form.accentColor }}>Accent</div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-slate-800 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Identity</h3>
            <TextField label="App Name" value={form.appName} onChange={setField("appName")} placeholder="Your Brand Name" />
            <TextField label="Tagline" value={form.tagline} onChange={setField("tagline")} placeholder="Your tagline or slogan" />
            <TextField label="Logo URL" value={form.logoUrl} onChange={setField("logoUrl")} placeholder="https://..." type="url" />
            <TextField label="Favicon URL" value={form.faviconUrl} onChange={setField("faviconUrl")} placeholder="https://...favicon.ico" type="url" />
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Colors</h3>
            <ColorField label="Primary" value={form.primaryColor} onChange={setField("primaryColor")} />
            <ColorField label="Secondary" value={form.secondaryColor} onChange={setField("secondaryColor")} />
            <ColorField label="Accent" value={form.accentColor} onChange={setField("accentColor")} />
            <ColorField label="Background" value={form.backgroundColor} onChange={setField("backgroundColor")} />
            <ColorField label="Surface" value={form.surfaceColor} onChange={setField("surfaceColor")} />
            <ColorField label="Text" value={form.textColor} onChange={setField("textColor")} />
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Email & Support</h3>
            <TextField label="From Name (Email)" value={form.emailFromName} onChange={setField("emailFromName")} placeholder="Your Brand" />
            <TextField label="Email Footer" value={form.emailFooterText} onChange={setField("emailFooterText")} placeholder="Footer text..." />
            <TextField label="Support Email" value={form.supportEmail} onChange={setField("supportEmail")} placeholder="support@yourbrand.com" type="email" />
            <TextField label="Support URL" value={form.supportUrl} onChange={setField("supportUrl")} placeholder="https://help.yourbrand.com" type="url" />
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Legal Links</h3>
            <TextField label="Privacy Policy URL" value={form.privacyUrl} onChange={setField("privacyUrl")} placeholder="https://..." type="url" />
            <TextField label="Terms of Service URL" value={form.termsUrl} onChange={setField("termsUrl")} placeholder="https://..." type="url" />
            <div className="mt-4">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Custom CSS</label>
              <textarea
                value={form.customCss}
                onChange={(e) => setField("customCss")(e.target.value)}
                placeholder="/* Custom CSS overrides */"
                rows={5}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
