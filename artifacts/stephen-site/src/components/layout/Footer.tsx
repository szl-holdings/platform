import { Link } from "wouter";

const navLinks = [
  { label: "Work", href: "/work" },
  { label: "Thesis", href: "/thesis" },
  { label: "Speaking", href: "/speaking" },
  { label: "Writing", href: "/writing" },
  { label: "About", href: "/about" },
  { label: "Invest", href: "/interested" },
  { label: "Contact", href: "/contact" },
];

const ecosystemLinks = [
  { label: "SZL Holdings", href: "/szl-holdings/" },
  { label: "Lyte", href: "/lyte-command-center/" },
  { label: "Vessels", href: "/vessels/" },
  { label: "Aegis", href: "/firestorm/" },
  { label: "Terra", href: "/terra/" },
  { label: "PRISM Counsel", href: "/prism-counsel/" },
  { label: "Carlota Jo", href: "/carlota-jo/" },
];

export function Footer() {
  return (
    <footer className="bg-[#060910] border-t border-white/5 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          <div className="md:col-span-4">
            <p className="text-2xl font-black tracking-tight mb-2" style={{ color: "rgba(255,255,255,0.9)" }}>
              Stephen Lutar
            </p>
            <p className="text-[10px] font-bold tracking-[0.25em] uppercase mb-5" style={{ color: "rgba(99,102,241,0.5)" }}>
              Founder & CEO — SZL Holdings
            </p>
            <p className="text-[13px] font-light leading-relaxed max-w-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
              Builder-operator behind 16 live applications, 375 database tables, and 1,618+ API endpoints. One compounding architecture.
            </p>
            <div className="flex items-center gap-3 mt-5">
              {[
                { label: "16", sub: "Apps" },
                { label: "375", sub: "Tables" },
                { label: "1.6K+", sub: "Endpoints" },
              ].map((s, i) => (
                <div key={s.label} className="flex items-center gap-3">
                  {i > 0 && <div className="w-px h-6" style={{ background: "rgba(255,255,255,0.06)" }} />}
                  <div>
                    <p className="text-sm font-bold" style={{ color: "#6366F1", fontFamily: "'JetBrains Mono', monospace" }}>{s.label}</p>
                    <p className="text-[8px] tracking-[0.2em] uppercase" style={{ color: "rgba(255,255,255,0.2)" }}>{s.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-[10px] font-bold tracking-[0.22em] uppercase mb-5" style={{ color: "rgba(255,255,255,0.2)" }}>Navigation</h4>
            <ul className="space-y-3">
              {navLinks.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-[13px] font-light transition-colors" style={{ color: "rgba(255,255,255,0.25)" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.6)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.25)"; }}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-3">
            <h4 className="text-[10px] font-bold tracking-[0.22em] uppercase mb-5" style={{ color: "rgba(255,255,255,0.2)" }}>Ecosystem</h4>
            <ul className="space-y-3">
              {ecosystemLinks.map((item) => (
                <li key={item.label}>
                  <a href={item.href} className="text-[13px] font-light transition-colors" style={{ color: "rgba(255,255,255,0.25)" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.6)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.25)"; }}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-3">
            <h4 className="text-[10px] font-bold tracking-[0.22em] uppercase mb-5" style={{ color: "rgba(255,255,255,0.2)" }}>Contact</h4>
            <a href="mailto:stephenlutar2@gmail.com" className="text-[13px] font-light block mb-3 transition-colors" style={{ color: "rgba(255,255,255,0.35)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.6)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.35)"; }}>
              stephenlutar2@gmail.com
            </a>
            <div className="space-y-2.5">
              <a href="https://linkedin.com/in/stephenlutar" target="_blank" rel="noopener noreferrer" className="text-[13px] font-light transition-colors block" style={{ color: "rgba(255,255,255,0.25)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.6)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.25)"; }}>LinkedIn</a>
              <a href="https://github.com/szl-holdings" target="_blank" rel="noopener noreferrer" className="text-[13px] font-light transition-colors block" style={{ color: "rgba(255,255,255,0.25)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.6)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.25)"; }}>GitHub</a>
              <a href="https://x.com/szlholdings" target="_blank" rel="noopener noreferrer" className="text-[13px] font-light transition-colors block" style={{ color: "rgba(255,255,255,0.25)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.6)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.25)"; }}>X / Twitter</a>
              <a href="https://szlholdings.substack.com" target="_blank" rel="noopener noreferrer" className="text-[13px] font-light transition-colors block" style={{ color: "rgba(255,255,255,0.25)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.6)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.25)"; }}>Substack</a>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-7 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-[11px] tracking-wider" style={{ color: "rgba(255,255,255,0.12)" }}>
            &copy; {new Date().getFullYear()} Stephen Lutar. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <Link href="/legal/privacy" className="text-[11px] tracking-wider transition-colors" style={{ color: "rgba(255,255,255,0.12)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.35)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.12)"; }}>
              Privacy
            </Link>
            <Link href="/legal/terms" className="text-[11px] tracking-wider transition-colors" style={{ color: "rgba(255,255,255,0.12)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.35)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.12)"; }}>
              Terms
            </Link>
            <span className="text-[11px] tracking-wider" style={{ color: "rgba(255,255,255,0.08)" }}>Part of SZL Holdings</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
