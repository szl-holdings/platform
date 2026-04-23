import { Ship } from 'lucide-react';
import { Link } from 'wouter';
import { MarketingNav } from '@/components/MarketingNav';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#060e1a] text-sky-50 flex flex-col">
      <MarketingNav />
      <div className="flex-1 flex items-center justify-center px-6 pt-20">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mx-auto mb-4">
              <Ship className="w-6 h-6 text-sky-400" />
            </div>
            <h1 className="text-[22px] font-bold text-sky-50 mb-1">Sign in to SEXTANT</h1>
            <p className="text-sky-300/40 text-[13px]">Access your fleet command dashboard</p>
          </div>
          <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-2xl p-7 space-y-4">
            <div>
              <label className="block text-[11px] font-medium text-sky-400/50 mb-1.5 uppercase tracking-[0.08em]">
                Work email
              </label>
              <input
                type="email"
                placeholder="you@company.com"
                className="w-full bg-[#060e1a] border border-sky-500/15 rounded-lg px-3.5 py-2.5 text-[13px] text-sky-100 placeholder-sky-400/25 focus:outline-none focus:border-sky-500/40 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-sky-400/50 mb-1.5 uppercase tracking-[0.08em]">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full bg-[#060e1a] border border-sky-500/15 rounded-lg px-3.5 py-2.5 text-[13px] text-sky-100 placeholder-sky-400/25 focus:outline-none focus:border-sky-500/40 transition-colors"
              />
            </div>
            <Link href="/dashboard">
              <button className="w-full py-3 bg-sky-400 hover:bg-sky-300 text-[#060e1a] font-bold rounded-xl transition-all text-[14px]">
                Sign in
              </button>
            </Link>
            <p className="text-center text-[12px] text-sky-400/30">
              Don't have access?{' '}
              <Link href="/demo" className="text-sky-400 hover:text-sky-300">
                Request a demo
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
