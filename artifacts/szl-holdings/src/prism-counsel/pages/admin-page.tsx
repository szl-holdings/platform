import { Settings, Shield, Database, Activity, Plug, Users } from "lucide-react";

export default function AdminPage() {
  return (
    <div className="p-6 max-w-[1000px] mx-auto space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#d4a054]" />
          <h1 className="text-lg font-semibold text-slate-100">Administration</h1>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">System configuration, integrations, and access management</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: Users, title: "Team & Roles", description: "Manage attorneys, paralegals, and staff access. Configure role-based permissions.", status: "3 active users" },
          { icon: Plug, title: "Connectors", description: "Microsoft 365, case management, and document management integrations.", status: "Outlook, Teams configured" },
          { icon: Database, title: "Data Management", description: "Matter data import/export, backup schedules, and retention policies.", status: "Last backup: 2h ago" },
          { icon: Shield, title: "Security & Compliance", description: "MFA enforcement, session policies, audit log access, and privilege controls.", status: "MFA enforced" },
          { icon: Activity, title: "System Health", description: "API status, sync health, processing queues, and performance metrics.", status: "All systems operational" },
          { icon: Settings, title: "Workspace Settings", description: "Organization profile, branding, notification preferences, and defaults.", status: "SZL Legal Ops" },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="rounded-lg border border-white/[0.06] p-4 hover:border-white/[0.10] transition-colors cursor-pointer" style={{ background: "#0c1220" }}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-[#d4a054]" />
                <h3 className="text-sm font-medium text-slate-200">{item.title}</h3>
              </div>
              <p className="text-[10px] text-slate-500 mb-2">{item.description}</p>
              <div className="text-[10px] text-slate-400 font-mono">{item.status}</div>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
        <h3 className="text-sm font-semibold text-slate-200 mb-3">Integration Status</h3>
        <div className="space-y-2">
          {[
            { name: "Microsoft Outlook", status: "connected", lastSync: "5 min ago" },
            { name: "Microsoft Teams", status: "connected", lastSync: "12 min ago" },
            { name: "SharePoint / OneDrive", status: "configured", lastSync: "Pending first sync" },
            { name: "Filevine (Case Management)", status: "available", lastSync: "Not connected" },
            { name: "DocuSign", status: "available", lastSync: "Not connected" },
          ].map((int, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
              <div className={`w-2 h-2 rounded-full ${
                int.status === "connected" ? "bg-[#4a90b8]" :
                int.status === "configured" ? "bg-[#d4a054]" :
                "bg-slate-600"
              }`} />
              <span className="text-xs text-slate-200 flex-1">{int.name}</span>
              <span className="text-[10px] text-slate-500">{int.lastSync}</span>
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                int.status === "connected" ? "bg-[#4a90b8]/10 text-[#4a90b8]" :
                int.status === "configured" ? "bg-[#d4a054]/10 text-[#d4a054]" :
                "bg-slate-500/10 text-slate-400"
              }`}>{int.status.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
