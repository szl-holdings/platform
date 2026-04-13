import { AlloyAppShell } from "../components/AlloyAppShell";
import { useUser } from "@clerk/react";
import { CreditCard, Zap, Download, Check } from "lucide-react";

export default function AccountPage() {
  const { user } = useUser();

  return (
    <AlloyAppShell title="Account & Billing">
      <div className="max-w-4xl space-y-6">
        
        {/* Profile Section */}
        <div className="bg-[#0d121c] border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-6 flex items-start gap-6">
            <div className="h-20 w-20 rounded-full bg-slate-800 border-2 border-slate-700 overflow-hidden shrink-0">
              {user?.imageUrl ? (
                <img src={user.imageUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500 text-2xl font-semibold">
                  {user?.firstName?.charAt(0) || "?"}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">
                {user?.fullName || "User Name"}
              </h2>
              <p className="text-sm text-slate-400 mb-4">
                {user?.primaryEmailAddress?.emailAddress || "user@example.com"}
              </p>
              <div className="flex gap-3">
                <button className="text-sm font-medium text-white bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-md transition-colors border border-slate-700">
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current Plan */}
          <div className="bg-[#0d121c] border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Current Plan</h3>
              <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-[#4B8BDB] bg-[#4B8BDB]/10 border border-[#4B8BDB]/20 rounded">
                Enterprise
              </span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">$499<span className="text-sm font-normal text-slate-500">/mo</span></div>
            <p className="text-sm text-slate-400 mb-6">Renews on Dec 15, 2024</p>
            
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2 text-sm text-slate-300">
                <Check size={16} className="text-emerald-400" /> Unlimited Workflows
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-300">
                <Check size={16} className="text-emerald-400" /> Dedicated Compute Nodes
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-300">
                <Check size={16} className="text-emerald-400" /> Priority Support
              </li>
            </ul>

            <button className="w-full text-sm font-medium text-white bg-[#4B8BDB] hover:bg-[#3A7AC9] py-2 rounded-md transition-colors">
              Manage Subscription
            </button>
          </div>

          {/* Usage */}
          <div className="bg-[#0d121c] border border-slate-800 rounded-xl p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-6">
              <Zap className="text-yellow-500" size={20} />
              <h3 className="text-lg font-semibold text-white">Usage Meter</h3>
            </div>

            <div className="space-y-6 flex-1">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-300 font-medium">Compute Hours</span>
                  <span className="text-slate-400">142 / 500</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-[#4B8BDB] w-[28%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-300 font-medium">Storage</span>
                  <span className="text-slate-400">45 GB / 100 GB</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 w-[45%]" />
                </div>
              </div>
            </div>
            
            <div className="mt-6 text-xs text-slate-500 text-center">
              Usage resets at the beginning of the billing cycle.
            </div>
          </div>
        </div>

        {/* Invoices */}
        <div className="bg-[#0d121c] border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex items-center gap-2">
            <CreditCard size={18} className="text-slate-400" />
            <h3 className="text-lg font-semibold text-white">Billing History</h3>
          </div>
          <div className="divide-y divide-slate-800">
            {[
              { date: "Nov 15, 2024", amount: "$499.00", status: "Paid", invoice: "INV-2024-11" },
              { date: "Oct 15, 2024", amount: "$499.00", status: "Paid", invoice: "INV-2024-10" },
              { date: "Sep 15, 2024", amount: "$499.00", status: "Paid", invoice: "INV-2024-09" },
            ].map((inv) => (
              <div key={inv.invoice} className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="text-sm font-medium text-slate-200 w-28">{inv.date}</div>
                  <div className="text-sm text-slate-400 font-mono">{inv.amount}</div>
                  <div className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{inv.status}</div>
                </div>
                <button className="text-slate-500 hover:text-white p-1.5 rounded hover:bg-slate-800 transition-colors" title="Download Invoice">
                  <Download size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </AlloyAppShell>
  );
}
