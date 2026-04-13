import { AlloyAppShell } from "../components/AlloyAppShell";
import { Plus, Users, Settings, Activity, Brain, Server } from "lucide-react";

const DEMO_AGENTS = [
  { id: 1, name: "Contract Analyzer", role: "Legal", status: "active", runs: 1243, model: "GPT-4o" },
  { id: 2, name: "Support Triage", role: "Support", status: "active", runs: 8521, model: "Claude 3.5 Sonnet" },
  { id: 3, name: "Code Reviewer", role: "Engineering", status: "paused", runs: 432, model: "GPT-4o" },
  { id: 4, name: "Lead Scorer", role: "Sales", status: "active", runs: 3211, model: "Llama 3" },
];

export default function AgentsPage() {
  return (
    <AlloyAppShell title="Agent Studio">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Active Agents</h2>
          <p className="text-sm text-slate-400 mt-1">Manage, configure, and monitor your specialized AI agents.</p>
        </div>
        <button className="flex items-center gap-2 bg-[#4B8BDB] hover:bg-[#3A7AC9] text-white px-4 py-2 rounded-md font-medium transition-colors text-sm">
          <Plus size={16} /> Create Agent
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#0d121c] border border-slate-800 rounded-xl overflow-hidden">
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-800 text-xs font-medium text-slate-500 uppercase tracking-wider bg-[#0a0e17]">
              <div className="col-span-5">Agent Name</div>
              <div className="col-span-3">Model</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2 text-right">Executions</div>
            </div>
            <div className="divide-y divide-slate-800/50">
              {DEMO_AGENTS.map((agent) => (
                <div key={agent.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-slate-800/20 transition-colors group cursor-pointer">
                  <div className="col-span-5 flex items-center gap-3">
                    <div className="h-8 w-8 rounded bg-slate-800 flex items-center justify-center text-slate-300 group-hover:bg-[#4B8BDB]/20 group-hover:text-[#4B8BDB] transition-colors">
                      <Brain size={16} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-200">{agent.name}</div>
                      <div className="text-xs text-slate-500">{agent.role}</div>
                    </div>
                  </div>
                  <div className="col-span-3 text-sm text-slate-400 flex items-center gap-1.5">
                    <Server size={14} /> {agent.model}
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${agent.status === 'active' ? 'bg-green-500' : 'bg-slate-500'}`} />
                    <span className="text-sm text-slate-300 capitalize">{agent.status}</span>
                  </div>
                  <div className="col-span-2 text-right text-sm font-mono text-slate-400">
                    {agent.runs.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detail Panel */}
        <div className="bg-[#0d121c] border border-slate-800 rounded-xl p-5 h-[600px] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Agent Details</h3>
            <button className="text-slate-400 hover:text-white"><Settings size={18} /></button>
          </div>

          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-800">
            <div className="h-12 w-12 rounded-lg bg-[#4B8BDB]/10 text-[#4B8BDB] flex items-center justify-center border border-[#4B8BDB]/20">
              <Brain size={24} />
            </div>
            <div>
              <div className="text-base font-medium text-white">Contract Analyzer</div>
              <div className="text-sm text-slate-400">Legal Department</div>
            </div>
          </div>

          <div className="space-y-6 flex-1 overflow-y-auto">
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">System Prompt</h4>
              <div className="bg-slate-900 rounded border border-slate-800 p-3 text-xs text-slate-300 font-mono leading-relaxed h-32 overflow-y-auto">
                You are an expert legal contract analyzer. Your job is to extract key entities, dates, obligations, and liabilities from uploaded legal documents. Always output in structured JSON format according to the schema provided. Flag any non-standard liability clauses.
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Capabilities</h4>
              <div className="space-y-2">
                {['Read PDF/DOCX', 'Web Search', 'Slack API Write'].map((cap) => (
                  <div key={cap} className="flex items-center justify-between bg-slate-900 rounded border border-slate-800 p-2.5">
                    <span className="text-sm text-slate-300">{cap}</span>
                    <div className="w-8 h-4 bg-[#4B8BDB] rounded-full relative">
                      <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AlloyAppShell>
  );
}
