import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@workspace/shared-ui";
import { Settings, Globe, Save, RefreshCw, Plus, Trash2 } from "lucide-react";

interface Site {
  id: number;
  slug: string;
  name: string;
  brandLabel?: string;
  description?: string;
  isActive: boolean;
}

interface SiteSetting {
  id: number;
  siteId: number;
  key: string;
  valueJson?: unknown;
}

const PRESET_SETTINGS = [
  { key: "logo_url", label: "Logo URL", type: "text", group: "Branding" },
  { key: "favicon_url", label: "Favicon URL", type: "text", group: "Branding" },
  { key: "tagline", label: "Tagline", type: "text", group: "Branding" },
  { key: "accent_color", label: "Accent Color", type: "text", group: "Branding" },
  { key: "contact_email", label: "Contact Email", type: "text", group: "Contact" },
  { key: "contact_phone", label: "Contact Phone", type: "text", group: "Contact" },
  { key: "address", label: "Address", type: "textarea", group: "Contact" },
  { key: "twitter_url", label: "Twitter / X URL", type: "text", group: "Social" },
  { key: "linkedin_url", label: "LinkedIn URL", type: "text", group: "Social" },
  { key: "github_url", label: "GitHub URL", type: "text", group: "Social" },
  { key: "feature_blog", label: "Enable Blog", type: "boolean", group: "Feature Flags" },
  { key: "feature_downloads", label: "Enable Downloads", type: "boolean", group: "Feature Flags" },
  { key: "feature_case_studies", label: "Enable Case Studies", type: "boolean", group: "Feature Flags" },
  { key: "feature_demo_requests", label: "Enable Demo Requests", type: "boolean", group: "Feature Flags" },
  { key: "google_analytics_id", label: "Google Analytics ID", type: "text", group: "Analytics" },
  { key: "plausible_domain", label: "Plausible Domain", type: "text", group: "Analytics" },
];

function SettingValueEditor({
  settingKey,
  currentValue,
  onSave,
  isSaving,
}: {
  settingKey: string;
  currentValue: unknown;
  onSave: (v: unknown) => void;
  isSaving: boolean;
}) {
  const preset = PRESET_SETTINGS.find(p => p.key === settingKey);
  const [value, setValue] = useState(
    typeof currentValue === "boolean" ? currentValue : currentValue != null ? String(currentValue) : ""
  );
  const [dirty, setDirty] = useState(false);

  function handleChange(v: unknown) {
    setValue(v as string | boolean);
    setDirty(true);
  }

  const cls = "w-full px-3 py-2 text-sm bg-muted rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary";

  let input;
  if (preset?.type === "boolean") {
    input = (
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={!!value} onChange={e => handleChange(e.target.checked)} className="w-4 h-4 accent-primary" />
        <span className="text-sm text-muted-foreground">Enabled</span>
      </label>
    );
  } else if (preset?.type === "textarea") {
    input = <textarea className={`${cls} min-h-[70px] resize-y`} value={value as string} onChange={e => handleChange(e.target.value)} />;
  } else {
    input = <input type="text" className={cls} value={value as string} onChange={e => handleChange(e.target.value)} />;
  }

  return (
    <div className="flex items-start gap-3">
      <div className="flex-1">{input}</div>
      {dirty && (
        <button
          onClick={() => { onSave(value); setDirty(false); }}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-3 py-2 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 shrink-0"
        >
          {isSaving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
          Save
        </button>
      )}
    </div>
  );
}

export default function SiteSettingsPage() {
  const qc = useQueryClient();
  const [selectedSiteId, setSelectedSiteId] = useState<number | null>(null);
  const [customKey, setCustomKey] = useState("");
  const [addingCustom, setAddingCustom] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const { data: sites } = useQuery({
    queryKey: ["cms-sites"],
    queryFn: () => apiFetch<Site[]>("/cms/sites"),
  });

  const activeSiteId = selectedSiteId ?? (sites?.[0]?.id ?? null);
  const activeSite = sites?.find(s => s.id === activeSiteId);

  const { data: settings } = useQuery({
    queryKey: ["cms-site-settings", activeSiteId],
    queryFn: () => apiFetch<SiteSetting[]>(`/cms/site-settings?site_id=${activeSiteId}`),
    enabled: activeSiteId != null,
  });

  const upsertMut = useMutation({
    mutationFn: ({ key, value }: { key: string; value: unknown }) =>
      apiFetch(`/cms/site-settings`, {
        method: "POST",
        body: JSON.stringify({ siteId: activeSiteId, key, valueJson: value }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cms-site-settings", activeSiteId] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => apiFetch(`/cms/site-settings/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cms-site-settings", activeSiteId] }),
  });

  function getSettingValue(key: string) {
    const setting = settings?.find(s => s.key === key);
    if (!setting) return undefined;
    return setting.valueJson;
  }

  async function saveKey(key: string, value: unknown) {
    setSavingKey(key);
    await upsertMut.mutateAsync({ key, value });
    setSavingKey(null);
  }

  const groups = [...new Set(PRESET_SETTINGS.map(p => p.group))];
  const customSettings = settings?.filter(s => !PRESET_SETTINGS.some(p => p.key === s.key)) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Site Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure settings per brand/site</p>
      </div>

      {sites && sites.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {sites.map(site => (
            <button
              key={site.id}
              onClick={() => setSelectedSiteId(site.id)}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                activeSiteId === site.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {site.name}
            </button>
          ))}
        </div>
      )}

      {activeSite && (
        <div className="space-y-4">
          {groups.map(group => {
            const groupSettings = PRESET_SETTINGS.filter(p => p.group === group);
            return (
              <div key={group} className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-border bg-muted/30">
                  <h3 className="text-sm font-semibold">{group}</h3>
                </div>
                <div className="divide-y divide-border">
                  {groupSettings.map(preset => (
                    <div key={preset.key} className="px-5 py-3.5">
                      <label className="text-xs text-muted-foreground mb-1.5 block font-medium">{preset.label}</label>
                      <SettingValueEditor
                        settingKey={preset.key}
                        currentValue={getSettingValue(preset.key)}
                        onSave={v => saveKey(preset.key, v)}
                        isSaving={savingKey === preset.key}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {customSettings.length > 0 && (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-border bg-muted/30">
                <h3 className="text-sm font-semibold">Custom Settings</h3>
              </div>
              <div className="divide-y divide-border">
                {customSettings.map(s => (
                  <div key={s.id} className="px-5 py-3.5 flex items-start gap-3">
                    <div className="flex-1">
                      <p className="text-xs font-mono text-muted-foreground mb-1">{s.key}</p>
                      <SettingValueEditor
                        settingKey={s.key}
                        currentValue={s.valueJson}
                        onSave={v => saveKey(s.key, v)}
                        isSaving={savingKey === s.key}
                      />
                    </div>
                    <button
                      onClick={() => deleteMut.mutate(s.id)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors mt-5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-3">Add Custom Setting</h3>
            {addingCustom ? (
              <div className="flex gap-2">
                <input
                  className="flex-1 px-3 py-2 text-sm bg-muted rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  placeholder="setting_key"
                  value={customKey}
                  onChange={e => setCustomKey(e.target.value)}
                />
                <button
                  onClick={() => { if (customKey) { saveKey(customKey, ""); setCustomKey(""); setAddingCustom(false); }}}
                  disabled={!customKey}
                  className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  Add
                </button>
                <button onClick={() => { setAddingCustom(false); setCustomKey(""); }} className="px-3 py-2 bg-muted rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAddingCustom(true)}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add custom key
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
