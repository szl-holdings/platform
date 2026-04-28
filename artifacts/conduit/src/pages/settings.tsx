import { Settings as SettingsIcon, Bell, Shield, Globe, Palette } from 'lucide-react';

const sections = [
  {
    icon: Bell,
    title: 'Notifications',
    description: 'Configure alerts for sync failures, partial runs, and connection errors.',
    status: 'Coming soon',
  },
  {
    icon: Shield,
    title: 'Access Control',
    description: 'Manage operator permissions and credential vault policies.',
    status: 'Coming soon',
  },
  {
    icon: Globe,
    title: 'API & Webhooks',
    description: 'Generate API keys for external trigger integrations and outbound webhooks.',
    status: 'Coming soon',
  },
  {
    icon: Palette,
    title: 'Appearance',
    description: 'Theme and display preferences.',
    status: 'Coming soon',
  },
];

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Global configuration for Amaru</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((section) => (
          <div key={section.title} className="conduit-card p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <section.icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-sm">{section.title}</div>
                </div>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full border border-border text-muted-foreground bg-muted">
                {section.status}
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{section.description}</p>
          </div>
        ))}
      </div>

      <div className="conduit-card p-5">
        <div className="flex items-center gap-3 mb-3">
          <SettingsIcon className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">About Amaru</h2>
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Version</dt>
          <dd className="font-mono">1.0.0</dd>
          <dt className="text-muted-foreground">Environment</dt>
          <dd className="font-mono">development</dd>
          <dt className="text-muted-foreground">API Base</dt>
          <dd className="font-mono text-xs truncate">/api/conduit</dd>
          <dt className="text-muted-foreground">Destinations</dt>
          <dd>13 supported</dd>
        </dl>
      </div>
    </div>
  );
}
