import { AlloyAppShell } from "../components/AlloyAppShell";
import { Key, BookOpen, Activity, Copy, TerminalSquare, ExternalLink, Github } from "lucide-react";

export default function DeveloperPage() {
  return (
    <AlloyAppShell title="Developer Portal">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white tracking-tight">API & Development</h2>
        <p className="text-sm text-slate-400 mt-1">Manage keys, monitor usage, and integrate Alloy into your custom apps.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col - API Keys */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#0d121c] border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-[#0a0e17]">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Key size={16} className="text-[#4B8BDB]" /> API Keys
              </h3>
              <button className="text-xs font-medium text-white bg-[#4B8BDB] px-3 py-1.5 rounded hover:bg-[#3A7AC9] transition-colors">
                Create new key
              </button>
            </div>
            <div className="divide-y divide-slate-800">
              <KeyRow name="Production API" keyPreview="al_prod_8f92...x1p" created="Oct 12, 2024" lastUsed="2 mins ago" />
              <KeyRow name="Development Server" keyPreview="al_dev_3b41...m9q" created="Nov 05, 2024" lastUsed="1 hour ago" />
              <KeyRow name="Test Script Runner" keyPreview="al_test_7c22...v4n" created="Dec 01, 2024" lastUsed="Never" />
            </div>
          </div>

          <div className="bg-[#0d121c] border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
              <TerminalSquare size={16} className="text-emerald-400" /> Quick Start
            </h3>
            <div className="bg-black border border-slate-800 rounded-lg p-4 font-mono text-sm overflow-x-auto">
              <div className="text-slate-500 mb-2"># Install the official SDK</div>
              <div className="text-emerald-400 mb-4">npm install @alloy/sdk</div>
              
              <div className="text-slate-500 mb-2"># Initialize client and run a workflow</div>
              <div className="text-[#4B8BDB]">import</div> <div className="text-slate-300 inline">{"{ Alloy } "}</div>
              <div className="text-[#4B8BDB]">from</div> <div className="text-amber-300 inline">"'@alloy/sdk'"</div><div className="text-slate-300">;</div>
              <br/>
              <div className="text-slate-300">
                const alloy = new Alloy(process.env.ALLOY_API_KEY);<br/><br/>
                const run = await alloy.workflows.trigger("wf_lead_scoring", {"{"}<br/>
                &nbsp;&nbsp;email: "prospect@example.com"<br/>
                {"}"});<br/><br/>
                console.log(run.result);
              </div>
            </div>
          </div>
        </div>

        {/* Right Col - Resources */}
        <div className="space-y-4">
          <div className="bg-[#0d121c] border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">API Usage (30 days)</h3>
            <div className="flex items-end gap-2 h-24 mb-2">
              {/* Fake chart bars */}
              {[40, 65, 45, 80, 95, 70, 50, 85, 100, 60].map((h, i) => (
                <div key={i} className="flex-1 bg-[#4B8BDB]/20 hover:bg-[#4B8BDB]/40 transition-colors rounded-t-sm relative group cursor-pointer" style={{ height: `${h}%` }}>
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {h * 123}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>Nov 15</span>
              <span>Dec 15</span>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-800">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-slate-400">Total Requests</span>
                <span className="text-sm font-medium text-white">42,891</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Error Rate</span>
                <span className="text-sm font-medium text-emerald-400">0.02%</span>
              </div>
            </div>
          </div>

          <div className="bg-[#0d121c] border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Resources</h3>
            <div className="space-y-2">
              <ResourceLink icon={<BookOpen size={16}/>} title="API Documentation" />
              <ResourceLink icon={<Activity size={16}/>} title="System Status" />
              <ResourceLink icon={<Github size={16}/>} title="SDK Source (GitHub)" />
            </div>
          </div>
        </div>
      </div>
    </AlloyAppShell>
  );
}

function KeyRow({ name, keyPreview, created, lastUsed }: { name: string, keyPreview: string, created: string, lastUsed: string }) {
  return (
    <div className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
      <div>
        <div className="text-sm font-medium text-slate-200">{name}</div>
        <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
          <span>Created {created}</span>
          <span>•</span>
          <span>Last used {lastUsed}</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <code className="text-xs text-slate-400 bg-slate-900 px-2 py-1 rounded border border-slate-800">{keyPreview}</code>
        <button className="text-slate-500 hover:text-white transition-colors" title="Copy to clipboard">
          <Copy size={16} />
        </button>
      </div>
    </div>
  );
}

function ResourceLink({ icon, title }: { icon: React.ReactNode, title: string }) {
  return (
    <a href="#" className="flex items-center justify-between p-3 rounded-lg border border-slate-800 hover:bg-slate-800/50 hover:border-slate-700 transition-colors text-slate-300 hover:text-white group">
      <div className="flex items-center gap-3 text-sm">
        <span className="text-slate-500 group-hover:text-[#4B8BDB] transition-colors">{icon}</span>
        {title}
      </div>
      <ExternalLink size={14} className="text-slate-600 group-hover:text-slate-400" />
    </a>
  );
}
