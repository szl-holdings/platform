import { AlertTriangle, Info, } from 'lucide-react';
import { DataProvenance } from '@/lib/data-provenance';
import { AlloyKernelPanel } from '@/components/AlloyKernelPanel';

export default function ThreatOverview() {
  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-display font-bold text-slate-100">Threat Overview</h1>
            <DataProvenance source="seed" label="Demo Data" />
          </div>
          <p className="text-slate-400 mt-1">Active indicator feed and adversary intelligence</p>
        </div>
      </header>

      <div className="sentra-panel overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-800/50 border-b border-[#f5f5f5]/10 text-[11px] uppercase tracking-wider text-slate-400 font-mono">
              <th className="px-6 py-4 font-medium">Indicator</th>
              <th className="px-6 py-4 font-medium">Type</th>
              <th className="px-6 py-4 font-medium">Severity</th>
              <th className="px-6 py-4 font-medium">TLP</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Last Seen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            <tr className="hover:bg-[#f5f5f5]/5 transition-colors group">
              <td className="px-6 py-4 text-sm font-mono text-[#f5f5f5]">45.227.252.12</td>
              <td className="px-6 py-4 text-xs text-slate-400">IPv4 / C2 Node</td>
              <td className="px-6 py-4">
                <span className="px-2 py-0.5 rounded bg-[#f5f5f5]/10 border border-[#f5f5f5]/20 text-[10px] text-[#f5f5f5] font-mono">
                  CRITICAL
                </span>
              </td>
              <td className="px-6 py-4">
                <span className="px-2 py-0.5 rounded bg-[#f5f5f5]/10 border border-[#f5f5f5]/20 text-[10px] text-[#f5f5f5] font-mono">
                  RED
                </span>
              </td>
              <td className="px-6 py-4 text-xs text-[#c9b787] font-mono">ACTIVE</td>
              <td className="px-6 py-4 text-xs text-slate-500 font-mono">4m ago</td>
            </tr>
            <tr className="hover:bg-[#f5f5f5]/5 transition-colors group">
              <td className="px-6 py-4 text-sm font-mono text-[#f5f5f5]">k7s-update.cc</td>
              <td className="px-6 py-4 text-xs text-slate-400">FQDN / Malware Staging</td>
              <td className="px-6 py-4">
                <span className="px-2 py-0.5 rounded bg-[#f5f5f5]/10 border border-[#f5f5f5]/20 text-[10px] text-[#f5f5f5] font-mono">
                  CRITICAL
                </span>
              </td>
              <td className="px-6 py-4">
                <span className="px-2 py-0.5 rounded bg-[#f5f5f5]/10 border border-[#f5f5f5]/20 text-[10px] text-[#f5f5f5] font-mono">
                  RED
                </span>
              </td>
              <td className="px-6 py-4 text-xs text-[#c9b787] font-mono">ACTIVE</td>
              <td className="px-6 py-4 text-xs text-slate-500 font-mono">12m ago</td>
            </tr>
            <tr className="hover:bg-slate-800/50 transition-colors group">
              <td className="px-6 py-4 text-sm font-mono text-slate-300">8d1e3f...a290</td>
              <td className="px-6 py-4 text-xs text-slate-400">SHA256 / Payload</td>
              <td className="px-6 py-4">
                <span className="px-2 py-0.5 rounded bg-[#c9b787]/10 border border-[#c9b787]/20 text-[10px] text-[#c9b787] font-mono">
                  HIGH
                </span>
              </td>
              <td className="px-6 py-4">
                <span className="px-2 py-0.5 rounded bg-[#c9b787]/10 border border-[#c9b787]/20 text-[10px] text-[#c9b787] font-mono">
                  AMBER
                </span>
              </td>
              <td className="px-6 py-4 text-xs text-slate-400 font-mono">MONITORING</td>
              <td className="px-6 py-4 text-xs text-slate-500 font-mono">1h ago</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="sentra-panel p-6">
          <h2 className="text-lg font-display font-bold mb-4 flex items-center gap-2 text-[#f5f5f5]">
            <AlertTriangle className="w-5 h-5" />
            Adversary Profile: TA-2891
          </h2>
          <div className="space-y-4">
            <p className="text-sm text-slate-400">
              Linked to recent campaign targeting OT infrastructure in the region. Uses custom
              encrypted payloads to disable PLC controllers after initial access via exposed HMI.
            </p>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="p-3 rounded bg-slate-800/50 border border-slate-700">
                <div className="text-[10px] text-slate-500 uppercase font-mono mb-1">
                  Motivations
                </div>
                <div className="text-xs text-slate-300 font-medium">Financial / Distruption</div>
              </div>
              <div className="p-3 rounded bg-slate-800/50 border border-slate-700">
                <div className="text-[10px] text-slate-500 uppercase font-mono mb-1">
                  Sophistication
                </div>
                <div className="text-xs text-slate-300 font-medium">Advanced</div>
              </div>
            </div>
          </div>
        </div>

        <div className="sentra-panel p-6">
          <h2 className="text-lg font-display font-bold mb-4 flex items-center gap-2 text-[#8a8a8a]">
            <Info className="w-5 h-5" />
            Recent Mitigations
          </h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-1 bg-[#8a8a8a] rounded-full shrink-0" />
              <div>
                <div className="text-xs font-bold text-slate-200">Firewall Rule Deployed</div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Blocked outbound traffic to 45.x.x.x across all DMZ segments.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-1 bg-[#8a8a8a] rounded-full shrink-0" />
              <div>
                <div className="text-xs font-bold text-slate-200">EDR Profile Updated</div>
                <p className="text-[11px] text-slate-500 mt-1">
                  New behavior detection for TA-2891 staging patterns enabled.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AlloyKernelPanel />
    </div>
  );
}
