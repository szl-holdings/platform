import { Brain } from "lucide-react";
import { Link } from "wouter";

const productLinks = [
  { label: "Platform", href: "/platform" },
  { label: "Security", href: "/security" },
  { label: "Insights", href: "/insights-hub" },
  { label: "Request Access", href: "/request-access" },
];

const ecosystemLinks = [
  { label: "SZL Holdings", href: "/" },
  { label: "Vessels", href: "/vessels/" },
  { label: "Carlota Jo", href: "/carlota-jo/" },
  { label: "Stephen Site", href: "/stephen/" },
];

const legalLinks = [
  { label: "Privacy", href: "/legal/privacy" },
  { label: "Terms", href: "/legal/terms" },
  { label: "Contact", href: "/request-access" },
];

export function MarketingFooter() {
  return (
    <footer className="bg-[#040212] border-t border-violet-500/10 py-12 lg:py-16">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded bg-violet-500/12 border border-violet-500/25 flex items-center justify-center">
                <Brain className="w-3.5 h-3.5 text-violet-400" />
              </div>
              <span className="font-bold text-[14px] text-violet-50">INCA</span>
            </div>
            <p className="text-violet-300/30 text-[13px] leading-relaxed max-w-xs mb-3">
              Enterprise intelligence platform with explainable AI, traceable decisions, and auditable workflows. Built by SZL Holdings.
            </p>
          </div>

          <div>
            <h4 className="text-[10px] font-semibold text-violet-400/40 uppercase tracking-[0.12em] mb-4">Platform</h4>
            <ul className="space-y-2.5">
              {productLinks.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-violet-300/30 text-[13px] hover:text-violet-200 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-semibold text-violet-400/40 uppercase tracking-[0.12em] mb-4">Ecosystem</h4>
            <ul className="space-y-2.5">
              {ecosystemLinks.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="text-violet-300/30 text-[13px] hover:text-violet-200 transition-colors">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-violet-500/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-violet-400/20 text-[12px]">
            &copy; {new Date().getFullYear()} INCA · SZL Holdings. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {legalLinks.map((l) => (
              <Link key={l.label} href={l.href} className="text-violet-400/20 text-[12px] hover:text-violet-300/50 transition-colors">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
