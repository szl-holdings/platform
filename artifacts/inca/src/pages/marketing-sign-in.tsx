import { Link } from "wouter";
import { Brain } from "lucide-react";
import { MarketingNav } from "@/components/MarketingNav";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#060410] text-violet-50 flex flex-col">
      <MarketingNav />
      <div className="flex-1 flex items-center justify-center px-6 pt-20">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded bg-violet-500/12 border border-violet-500/25 flex items-center justify-center mx-auto mb-4">
              <Brain className="w-6 h-6 text-violet-400" />
            </div>
            <h1 className="text-[22px] font-bold text-violet-50 mb-1">Sign in to INCA</h1>
            <p className="text-violet-300/40 text-[13px]">Access your intelligence platform</p>
          </div>
          <div className="bg-[#0d0a1a]/80 border border-violet-500/10 rounded-2xl p-7 space-y-4">
            <div>
              <label className="block text-[11px] font-medium text-violet-400/50 mb-1.5 uppercase tracking-[0.08em]">Work email</label>
              <input type="email" placeholder="you@organisation.com" className="w-full bg-[#060410] border border-violet-500/15 rounded-lg px-3.5 py-2.5 text-[13px] text-violet-100 placeholder-violet-400/25 focus:outline-none focus:border-violet-500/40 transition-colors" />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-violet-400/50 mb-1.5 uppercase tracking-[0.08em]">Password</label>
              <input type="password" placeholder="••••••••" className="w-full bg-[#060410] border border-violet-500/15 rounded-lg px-3.5 py-2.5 text-[13px] text-violet-100 placeholder-violet-400/25 focus:outline-none focus:border-violet-500/40 transition-colors" />
            </div>
            <Link href="/dashboard">
              <button className="w-full py-3 rounded text-[14px] font-bold text-violet-50 bg-violet-600 hover:bg-violet-500 transition-colors">
                Sign in
              </button>
            </Link>
            <p className="text-center text-[12px] text-violet-400/30">
              Don't have access? <Link href="/request-access" className="text-violet-400 hover:text-violet-300">Request access</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
