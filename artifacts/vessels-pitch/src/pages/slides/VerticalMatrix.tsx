const VERTS = [
  { v: "Shipping & Energy", a: "Charter clause screen, sanctions on every fixture, port-state risk", m: "AIS, P&I bulletins, charter library", s: "OT + ICS posture, IMO 2025 cyber risk" },
  { v: "Financial Services", a: "SR 11-7 model risk gate, pre-trade screen, KYV provenance", m: "Vendor due diligence, trade memos, sanctions registers", s: "FFIEC, NYDFS 500, FedRAMP-aligned" },
  { v: "Healthcare / Life Sci", a: "PHI-aware policy, IRB-bound research calls", m: "Trial protocols, EHR ontologies, lit corpus", s: "HIPAA, HITRUST, GxP readiness" },
  { v: "Public Sector / Defense", a: "Air-gapped, identity-pinned, jurisdiction-locked", m: "FOUO docs, doctrine, threat catalogs", s: "CMMC L2/L3, FedRAMP-mod, IL4/5" },
  { v: "Critical Infra / ICS", a: "OT-segregated calls, vendor allow-list enforced", m: "Asset registers, runbooks, incident library", s: "NIST 800-82, IEC 62443" },
  { v: "Legal & Counsel", a: "Privilege-namespaced calls, citation-required", m: "Matter files, sanctions registers, prior memos", s: "Discovery export, retention windows" },
];

export default function VerticalMatrix() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body px-[6vw] py-[5vh] flex flex-col">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[1vw] tracking-[0.25em] text-gold uppercase">Section 08 · Verticals · Matrix</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">18 / 40</div>
      </div>

      <h2 className="mt-[2.5vh] text-[3.2vw] leading-[1.05] font-light tracking-[-0.025em] max-w-[82vw]">
        Six verticals × three layers. <span className="text-gold font-medium">Same substrate everywhere.</span>
      </h2>

      <div className="mt-[3vh] flex-1 border border-rule bg-panel overflow-hidden">
        <div className="grid grid-cols-[1.4fr_2.1fr_2.1fr_2.1fr] font-mono text-[0.78vw] tracking-[0.2em] text-gold uppercase border-b border-rule px-[1.3vw] py-[1vh]">
          <div>Vertical</div><div>A11oy applied</div><div>Amaru sources</div><div>Sentra programs</div>
        </div>
        {VERTS.map((v, i) => (
          <div key={v.v} className={`grid grid-cols-[1.4fr_2.1fr_2.1fr_2.1fr] px-[1.3vw] py-[1.4vh] text-[0.92vw] leading-[1.35] ${i < VERTS.length - 1 ? "border-b border-rule" : ""}`}>
            <div className="font-medium text-text">{v.v}</div>
            <div className="text-muted">{v.a}</div>
            <div className="text-muted">{v.m}</div>
            <div className="text-muted">{v.s}</div>
          </div>
        ))}
      </div>

      <div className="border-t border-rule pt-[1.8vh] mt-[2vh] flex items-end justify-between">
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted uppercase">Each new vertical inherits the receipt chain — does not rebuild it</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">18 / 40</div>
      </div>
    </div>
  );
}
