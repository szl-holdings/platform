import type { ComponentType } from "react";
import { AlloyAppShell } from "../components/AlloyAppShell";
import { Play, Pause, Search, Plus, GitBranch, Cpu, Database, Send, AlertCircle } from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";

export default function WorkflowsPage() {
  return (
    <AlloyAppShell title="Workflow Builder">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Workflows</h2>
          <p className="text-sm text-slate-400 mt-1">Orchestrate agents, data, and logic in visual execution graphs.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-md font-medium transition-colors text-sm border border-slate-700">
            <Play size={16} /> Run Active
          </button>
          <button className="flex items-center gap-2 bg-[#4B8BDB] hover:bg-[#3A7AC9] text-white px-4 py-2 rounded-md font-medium transition-colors text-sm">
            <Plus size={16} /> New Workflow
          </button>
        </div>
      </div>

      <div className="flex gap-6 h-[calc(100vh-14rem)]">
        {/* Canvas Area */}
        <div className="flex-1 bg-[#0d121c] border border-slate-800 rounded-xl relative overflow-hidden flex items-center justify-center">
          {/* Grid Background */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          
          {/* Mock Nodes */}
          <div className="relative w-full h-full p-8 flex items-center justify-center">
            
            <div className="absolute top-20 left-20">
              <Node title="Webhook Trigger" icon={AlertCircle} type="trigger" />
            </div>
            
            <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-slate-700" style={{ zIndex: 0 }}>
              <path d="M 220 120 C 300 120, 300 240, 380 240" fill="none" strokeWidth="2" strokeDasharray="4 4" className="animate-pulse" />
              <path d="M 580 240 C 660 240, 660 160, 740 160" fill="none" strokeWidth="2" />
              <path d="M 580 240 C 660 240, 660 320, 740 320" fill="none" strokeWidth="2" />
            </svg>

            <div className="absolute top-[200px] left-[380px]">
              <Node title="Lead Scorer Agent" icon={Cpu} type="agent" active />
            </div>

            <div className="absolute top-[120px] left-[740px]">
              <Node title="Salesforce Update" icon={Database} type="action" />
            </div>

            <div className="absolute top-[280px] left-[740px]">
              <Node title="Slack Notification" icon={Send} type="action" />
            </div>

          </div>

          {/* Canvas Controls */}
          <div className="absolute bottom-4 left-4 flex bg-slate-900 border border-slate-800 rounded-lg p-1 shadow-lg z-10">
            <button className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800"><Plus size={16}/></button>
            <button className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800"><Pause size={16}/></button>
          </div>
        </div>

        {/* Sidebar Templates */}
        <div className="w-80 bg-[#0d121c] border border-slate-800 rounded-xl flex flex-col hidden xl:flex">
          <div className="p-4 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-white mb-3">Node Library</h3>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 text-slate-500 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search nodes..." 
                className="w-full bg-slate-900 border border-slate-800 rounded-md py-1.5 pl-9 pr-3 text-sm text-slate-200 outline-none focus:border-[#4B8BDB]"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <NodeGroup title="Triggers" items={['Webhook', 'Schedule', 'Email Received']} icon={AlertCircle} />
            <NodeGroup title="Agents" items={['Contract Analyzer', 'Lead Scorer', 'Code Reviewer']} icon={Cpu} />
            <NodeGroup title="Actions" items={['Send Email', 'Slack Message', 'Update DB', 'HTTP Request']} icon={Send} />
          </div>
        </div>
      </div>
    </AlloyAppShell>
  );
}

function Node({ title, icon: Icon, type, active }: { title: string, icon: ComponentType<{ size?: number; className?: string }>, type: string, active?: boolean }) {
  return (
    <div className={cn(
      "w-48 bg-slate-900 border rounded-lg shadow-xl p-3 z-10 relative",
      active ? "border-[#4B8BDB] ring-1 ring-[#4B8BDB]/50" : "border-slate-700"
    )}>
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-8 h-8 rounded-md flex items-center justify-center shrink-0",
          type === 'trigger' ? "bg-purple-500/10 text-purple-400" :
          type === 'agent' ? "bg-[#4B8BDB]/10 text-[#4B8BDB]" :
          "bg-emerald-500/10 text-emerald-400"
        )}>
          <Icon size={16} />
        </div>
        <div>
          <div className="text-sm font-medium text-slate-200 truncate">{title}</div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">{type}</div>
        </div>
      </div>
      
      {/* Ports */}
      {type !== 'trigger' && <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-slate-800 border border-slate-600 rounded-full" />}
      {type !== 'action' && <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-slate-800 border border-slate-600 rounded-full" />}
      
      {active && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900 animate-pulse" />
      )}
    </div>
  );
}

function NodeGroup({ title, items, icon: Icon }: { title: string, items: string[], icon: ComponentType<{ size?: number; className?: string }> }) {
  return (
    <div>
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
        <Icon size={14} /> {title}
      </div>
      <div className="space-y-2">
        {items.map(item => (
          <div key={item} className="p-2.5 bg-slate-800/50 border border-slate-800 rounded-md text-sm text-slate-300 cursor-grab hover:bg-slate-800 transition-colors">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
