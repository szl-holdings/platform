import { Ship } from "lucide-react";
import { Link } from "wouter";

const productLinks = [
  { label: "Platform", href: "/platform" },
  { label: "Demo", href: "/demo" },
  { label: "Security", href: "/security" },
  { label: "Pricing", href: "/pricing" },
];

const ecosystemLinks = [
  { label: "SZL Holdings", href: "/" },
  { label: "Carlota Jo", href: "/carlota-jo/" },
  { label: "Stephen Site", href: "/stephen/" },
];

const legalLinks = [
  { label: "Privacy", href: "/legal/privacy" },
  { label: "Terms", href: "/legal/terms" },
  { label: "Contact", href: "/demo" },
];

export function MarketingFooter() {
  return (
    <footer className="bg-[#030b15] border-t border-sky-500/10 py-12 lg:py-16">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center">
                <Ship className="w-4 h-4 text-sky-400" />
              </div>
              <span className="font-bold text-[14px] text-sky-50">Vessels</span>
            </div>
            <p className="text-sky-300/30 text-[13px] leading-relaxed max-w-xs mb-3">
              Maritime intelligence platform for fleet executives, operations, and commercial teams. Built by SZL Holdings.
            </p>
          </div>

          <div>
            <h4 className="text-[10px] font-semibold text-sky-400/40 uppercase tracking-[0.12em] mb-4">Product</h4>
            <ul className="space-y-2.5">
              {productLinks.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sky-300/30 text-[13px] hover:text-sky-200 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-semibold text-sky-400/40 uppercase tracking-[0.12em] mb-4">Ecosystem</h4>
            <ul className="space-y-2.5">
              {ecosystemLinks.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="text-sky-300/30 text-[13px] hover:text-sky-200 transition-colors">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-sky-500/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sky-400/20 text-[12px]">
            &copy; {new Date().getFullYear()} Vessels · SZL Holdings. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a href="https://x.com/szlholdings" target="_blank" rel="noopener noreferrer" className="text-sky-400/20 text-[12px] hover:text-sky-300/50 transition-colors">X</a>
            <a href="https://linkedin.com/company/szlholdings" target="_blank" rel="noopener noreferrer" className="text-sky-400/20 text-[12px] hover:text-sky-300/50 transition-colors">LinkedIn</a>
            <a href="https://medium.com/@stephen_38454" target="_blank" rel="noopener noreferrer" className="text-sky-400/20 text-[12px] hover:text-sky-300/50 transition-colors">Medium</a>
            {legalLinks.map((l) => (
              <Link key={l.label} href={l.href} className="text-sky-400/20 text-[12px] hover:text-sky-300/50 transition-colors">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
