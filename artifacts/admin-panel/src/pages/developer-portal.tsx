import { useState } from "react";
import { Globe, Key, Copy, CheckCheck, Code, BookOpen, ExternalLink } from "lucide-react";

const API_ROUTES = [
  { method: "GET", path: "/api/cms/sites", description: "List all sites" },
  { method: "GET", path: "/api/cms/ventures", description: "List ventures" },
  { method: "POST", path: "/api/cms/ventures", description: "Create venture", auth: true },
  { method: "PATCH", path: "/api/cms/ventures/:id", description: "Update venture", auth: true },
  { method: "DELETE", path: "/api/cms/ventures/:id", description: "Delete venture", auth: true },
  { method: "GET", path: "/api/cms/articles", description: "List articles" },
  { method: "POST", path: "/api/cms/articles", description: "Create article", auth: true },
  { method: "GET", path: "/api/cms/testimonials", description: "List testimonials" },
  { method: "POST", path: "/api/cms/contact-submissions", description: "Submit contact form" },
  { method: "GET", path: "/api/admin/overview", description: "System overview", auth: true },
  { method: "GET", path: "/api/admin/users", description: "List users", auth: true },
  { method: "GET", path: "/api/admin/audit-log", description: "Audit log", auth: true },
];

const METHOD_COLORS: Record<string, string> = {
  GET: "text-emerald-400 bg-emerald-500/10",
  POST: "text-blue-400 bg-blue-500/10",
  PATCH: "text-amber-400 bg-amber-500/10",
  DELETE: "text-red-400 bg-red-500/10",
  PUT: "text-violet-400 bg-violet-500/10",
};

export default function DeveloperPortal() {
  const [copied, setCopied] = useState<string | null>(null);

  const baseUrl = typeof window !== "undefined" ? `${window.location.protocol}//${window.location.host}/api` : "/api";

  async function copyToClipboard(text: string, key: string) {
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Developer Portal</h1>
        <p className="text-sm text-muted-foreground mt-1">API documentation and developer resources</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Base URL", value: baseUrl, icon: <Globe className="w-4 h-4 text-muted-foreground" />, copyKey: "baseUrl" },
        ].map(item => (
          <div key={item.label} className="md:col-span-3 bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            {item.icon}
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="font-mono text-sm mt-0.5">{item.value}</p>
            </div>
            <button onClick={() => copyToClipboard(item.value, item.copyKey)} className="text-muted-foreground hover:text-foreground transition-colors">
              {copied === item.copyKey ? <CheckCheck className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
          <Code className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">API Endpoints</h3>
        </div>
        <div className="divide-y divide-border">
          {API_ROUTES.map((r, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3">
              <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded shrink-0 ${METHOD_COLORS[r.method] || "bg-muted text-muted-foreground"}`}>
                {r.method}
              </span>
              <span className="font-mono text-xs flex-1 text-muted-foreground">{r.path}</span>
              <span className="text-xs text-muted-foreground hidden sm:block">{r.description}</span>
              {r.auth && (
                <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                  <Key className="w-3 h-3" />Auth
                </span>
              )}
              <button onClick={() => copyToClipboard(`${baseUrl}${r.path}`, `route-${i}`)} className="text-muted-foreground hover:text-foreground transition-colors">
                {copied === `route-${i}` ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
