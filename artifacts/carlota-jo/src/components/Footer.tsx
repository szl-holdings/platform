export default function Footer() {
  return (
    <footer className="bg-[#06080c] border-t border-[#f5f0e8]/5 py-14 lg:py-16">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-4">
            <div className="mb-5">
              <h3
                className="text-[18px] font-light text-[#f5f0e8] leading-none"
                style={{ fontFamily: "Georgia, 'Palatino Linotype', serif" }}
              >
                Carlota Jo
              </h3>
              <p className="text-[9px] tracking-[0.3em] uppercase text-[#c8a96a]/45 font-medium mt-1">
                Consulting
              </p>
            </div>
            <p className="text-[13px] text-[#f5f0e8]/28 leading-relaxed max-w-xs font-light">
              Discreet. Tailored. Trusted.
            </p>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-[10px] font-medium tracking-[0.22em] uppercase text-[#f5f0e8]/28 mb-4">
              Practice
            </h4>
            <ul className="space-y-2.5">
              {[
                "Board & Governance",
                "Capital Strategy",
                "Transformation",
                "M&A Advisory",
                "Stakeholder Engagement",
                "Growth Strategy",
              ].map((s) => (
                <li key={s}>
                  <span className="text-[13px] text-[#f5f0e8]/22 hover:text-[#f5f0e8]/55 transition-colors cursor-default font-light">
                    {s}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-[10px] font-medium tracking-[0.22em] uppercase text-[#f5f0e8]/28 mb-4">
              Firm
            </h4>
            <ul className="space-y-2.5 text-[13px] text-[#f5f0e8]/22 font-light">
              {["About", "Approach", "Enquiries", "Confidentiality"].map((item) => (
                <li key={item}>
                  <span className="hover:text-[#f5f0e8]/55 transition-colors cursor-default">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-4">
            <h4 className="text-[10px] font-medium tracking-[0.22em] uppercase text-[#f5f0e8]/28 mb-4">
              Contact
            </h4>
            <ul className="space-y-2.5 text-[13px] text-[#f5f0e8]/22 font-light">
              <li>inquiries@carlotajo.com</li>
              <li className="leading-relaxed">
                London &nbsp;·&nbsp; New York
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-7 border-t border-[#f5f0e8]/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-[11px] text-[#f5f0e8]/15 tracking-wider">
            &copy; {new Date().getFullYear()} Carlota Jo Consulting. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            {["Privacy Policy", "Terms of Engagement", "NDA Request"].map((item) => (
              <span key={item} className="text-[11px] text-[#f5f0e8]/15 tracking-wider hover:text-[#f5f0e8]/32 transition-colors cursor-pointer">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
