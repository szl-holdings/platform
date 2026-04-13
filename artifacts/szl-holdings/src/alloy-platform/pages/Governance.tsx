import { AlloyAppShell } from "../components/AlloyAppShell";
import { ShieldAlert, CheckCircle, Clock, AlertTriangle, FileSearch, Fingerprint } from "lucide-react";

export default function GovernancePage() {
  return (
    <AlloyAppShell title="Governance Dashboard">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Compliance & Control</h2>
            <p className="text-sm text-slate-400 mt-1">Audit logs, policy enforcement, and human-in-the-loop approvals.</p>
          </div>
          <div className="flex items-center gap-4 bg-[#0d121c] border border-slate-800 px-4 py-2 rounded-lg">
            <div className="text-sm text-slate-400">Platform Health Score</div>
            <div className="text-xl font-bold text-emerald-400">98.4%</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Approval Queue */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Clock size={16} className="text-yellow-500" /> Pending Approvals
            </h3>
            
            <div className="bg-[#0d121c] border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800">
              {[
                { id: "APP-092", title: "Send Mass Email Campaign (Marketing)", agent: "Outreach Bot", risk: "High" },
                { id: "APP-093", title: "Modify Production Database Record", agent: "Data Janitor", risk: "Critical" },
                { id: "APP-094", title: "Approve $5,000 Vendor Invoice", agent: "Finance Copilot", risk: "Medium" },
              ].map(item => (
                <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 w-2 h-2 rounded-full bg-yellow-500" />
                    <div>
                      <div className="text-sm font-medium text-slate-200">{item.title}</div>
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                        <span className="font-mono text-slate-400">{item.id}</span>
                        <span>•</span>
                        <span>Requested by {item.agent}</span>
                        <span>•</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold ${
                          item.risk === 'Critical' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
                          item.risk === 'High' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 
                          'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}>{item.risk} Risk</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="text-xs font-medium text-slate-400 hover:text-white px-3 py-1.5 rounded hover:bg-slate-800 transition-colors">Review</button>
                    <button className="text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 rounded transition-colors shadow-sm shadow-emerald-900/20">Approve</button>
                  </div>
                </div>
              ))}
            </div>

            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mt-8 pt-4 border-t border-slate-800">
              <FileSearch size={16} className="text-[#4B8BDB]" /> Recent Policy Violations Blocked
            </h3>
            
            <div className="bg-[#0d121c] border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800">
              {[
                { time: "10 mins ago", event: "Attempted PII extraction to external API", agent: "Summarizer", policy: "Data DLP-01" },
                { time: "2 hours ago", event: "Rate limit exceeded for GitHub connector", agent: "Code Reviewer", policy: "Rate Limit R-05" },
              ].map((item, i) => (
                <div key={i} className="p-3 flex items-center gap-4 text-sm">
                  <div className="text-xs text-slate-500 w-24 shrink-0">{item.time}</div>
                  <ShieldAlert size={16} className="text-red-400 shrink-0" />
                  <div className="flex-1 text-slate-300 truncate">{item.event}</div>
                  <div className="text-xs font-mono text-slate-500 shrink-0 bg-slate-800 px-2 py-1 rounded">{item.policy}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Fingerprint size={16} className="text-purple-400" /> Active Policies
            </h3>
            <div className="bg-[#0d121c] border border-slate-800 rounded-xl p-4 space-y-3">
              <PolicyToggle title="PII Redaction" desc="Automatically mask sensitive data in prompts" active />
              <PolicyToggle title="Human in Loop (Financial)" desc="Require approval for actions > $1000" active />
              <PolicyToggle title="Strict Output Formatting" desc="Force JSON structure on all Agent responses" active={false} />
              <PolicyToggle title="Audit Logging" desc="Retain full request/response history (90 days)" active />
            </div>
          </div>
        </div>
      </div>
    </AlloyAppShell>
  );
}

function PolicyToggle({ title, desc, active }: { title: string, desc: string, active: boolean }) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-lg">
      <div className="pr-4">
        <div className="text-sm font-medium text-slate-200">{title}</div>
        <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
      </div>
      <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${active ? 'bg-[#4B8BDB]' : 'bg-slate-700'}`}>
        <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${active ? 'translate-x-5' : 'translate-x-1'}`} />
      </div>
    </div>
  );
}
