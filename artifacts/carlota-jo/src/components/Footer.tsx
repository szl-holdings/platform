export default function Footer() {
  return (
    <footer className="bg-[#06080c] border-t border-[#f5f0e8]/5 py-14 lg:py-16">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-4">
            <h3 className="font-serif text-2xl font-light text-ink-900 mb-1.5">
              Carlota Jo
            </h3>
            <p className="text-[10px] tracking-[0.3em] uppercase text-warm-gold font-medium mb-5">
              Premium Operational Services · SZL Holdings
            </p>
            <p className="text-sm text-ink-500 leading-relaxed max-w-xs font-light">
              Discreet operational and residence support for high-touch environments. Quietly structured. Precisely executed.
            </p>
          </div>

          <div className="md:col-span-3">
            <h4 className="text-[10px] font-medium tracking-[0.2em] uppercase text-stone-400 mb-5">
              Services
            </h4>
            <ul className="space-y-2.5">
              {[
                "Residence Management",
                "Household Staff Coordination",
                "Bespoke Travel Architecture",
                "Discreet Project Execution",
              ].map((s) => (
                <li key={s}>
                  <span className="text-sm text-ink-500 font-light">
                    {s}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-[10px] font-medium tracking-[0.2em] uppercase text-stone-400 mb-5">
              SZL Ecosystem
            </h4>
            <ul className="space-y-3 text-sm text-ink-500 font-light">
              <li><a href="/" className="hover:text-ink-900 transition-colors">SZL Holdings</a></li>
              <li><a href="/alloy/" className="hover:text-ink-900 transition-colors">Alloy</a></li>
              <li><a href="/lyte-command-center/" className="hover:text-ink-900 transition-colors">Lyte</a></li>
              <li><a href="/vessels/" className="hover:text-ink-900 transition-colors">Vessels</a></li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <h4 className="text-[10px] font-medium tracking-[0.2em] uppercase text-stone-400 mb-5">
              Contact
            </h4>
            <ul className="space-y-3 text-sm text-ink-500 font-light">
              <li className="hover:text-ink-900 transition-colors">inquiries@carlotajo.com</li>
              <li className="leading-relaxed text-stone-400">
                Washington, D.C. · London · Singapore
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-7 border-t border-[#f5f0e8]/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-[11px] text-[#f5f0e8]/15 tracking-wider">
            &copy; {new Date().getFullYear()} Carlota Jo Consulting. All rights reserved.
          </p>
          <p className="text-[11px] text-stone-400 tracking-wider font-light">
            A service brand of SZL Holdings
          </p>
        </div>
      </div>
    </footer>
  );
}
