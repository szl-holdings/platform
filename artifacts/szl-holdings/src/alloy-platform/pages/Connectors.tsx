import type { SVGProps } from "react";
import { AlloyAppShell } from "../components/AlloyAppShell";
import { Link2, Github, Slack, Database, Trello, Mail, Calendar, Settings } from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";

const CONNECTORS = [
  { id: "slack", name: "Slack", icon: Slack, status: "connected", color: "text-rose-400", bg: "bg-rose-400/10" },
  { id: "github", name: "GitHub", icon: Github, status: "connected", color: "text-slate-200", bg: "bg-slate-200/10" },
  { id: "salesforce", name: "Salesforce", icon: Database, status: "disconnected", color: "text-blue-400", bg: "bg-blue-400/10" },
  { id: "linear", name: "Linear", icon: Link2, status: "connected", color: "text-indigo-400", bg: "bg-indigo-400/10" },
  { id: "jira", name: "Jira", icon: Trello, status: "disconnected", color: "text-blue-500", bg: "bg-blue-500/10" },
  { id: "gmail", name: "Gmail", icon: Mail, status: "connected", color: "text-red-500", bg: "bg-red-500/10" },
  { id: "gcal", name: "Google Calendar", icon: Calendar, status: "error", color: "text-yellow-500", bg: "bg-yellow-500/10" },
  { id: "notion", name: "Notion", icon: FileTextIcon, status: "connected", color: "text-slate-300", bg: "bg-slate-300/10" },
];

// Reusing icon component name to avoid import issues
function FileTextIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>;
}

export default function ConnectorsPage() {
  return (
    <AlloyAppShell title="Connector Hub">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Integrations</h2>
          <p className="text-sm text-slate-400 mt-1">Connect Alloy to your enterprise data sources securely.</p>
        </div>
        <button className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-md font-medium transition-colors text-sm border border-slate-700 flex items-center gap-2">
          <Settings size={16} /> Manage Keys
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {CONNECTORS.map((c) => (
          <div key={c.id} className="bg-[#0d121c] border border-slate-800 rounded-xl p-5 hover:border-slate-600 transition-colors flex flex-col h-48">
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-2.5 rounded-lg", c.bg, c.color)}>
                <c.icon size={24} />
              </div>
              <StatusBadge status={c.status} />
            </div>
            
            <div className="mt-auto">
              <h3 className="text-base font-semibold text-white mb-1">{c.name}</h3>
              <p className="text-xs text-slate-500 mb-4">
                {c.status === 'connected' ? 'Synced 5m ago' : c.status === 'error' ? 'Auth expired' : 'Not configured'}
              </p>
              
              {c.status === 'connected' ? (
                <button className="w-full py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded transition-colors">
                  Configure
                </button>
              ) : c.status === 'error' ? (
                <button className="w-full py-1.5 text-xs font-medium text-yellow-500 bg-yellow-500/10 hover:bg-yellow-500/20 rounded transition-colors border border-yellow-500/20">
                  Reconnect
                </button>
              ) : (
                <button className="w-full py-1.5 text-xs font-medium text-white bg-[#4B8BDB] hover:bg-[#3A7AC9] rounded transition-colors">
                  Connect
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </AlloyAppShell>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'connected') {
    return <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded border border-emerald-400/20"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Active</span>;
  }
  if (status === 'error') {
    return <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/20"><div className="w-1.5 h-1.5 rounded-full bg-yellow-500" /> Error</span>;
  }
  return <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-slate-500 bg-slate-800 px-2 py-1 rounded border border-slate-700"><div className="w-1.5 h-1.5 rounded-full bg-slate-500" /> Setup</span>;
}
