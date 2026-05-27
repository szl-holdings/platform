export default function AccessPeter() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body px-[6vw] py-[7vh] flex flex-col">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[1vw] tracking-[0.25em] text-gold uppercase">Section 15 · Access · Peter</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">34 / 40</div>
      </div>

      <h2 className="mt-[4vh] text-[3.4vw] leading-[1.05] font-light tracking-[-0.025em] max-w-[80vw]">
        Five asks — <span className="text-gold font-medium">none require production access day one.</span>
      </h2>

      <div className="mt-[4vh] grid grid-cols-2 gap-[1.8vw] flex-1">
        <div className="border border-rule bg-panel p-[1.8vw]">
          <div className="font-mono text-[0.85vw] tracking-[0.2em] text-primary uppercase mb-[0.8vh]">1 · Two ops workflows</div>
          <div className="text-[1.3vw] mb-[0.5vh]">Pre-fixture screen + charter clause brief</div>
          <div className="text-[1vw] text-muted">We govern those two with A11oy in pilot. You see the receipts within 14 days.</div>
        </div>
        <div className="border border-rule bg-panel p-[1.8vw]">
          <div className="font-mono text-[0.85vw] tracking-[0.2em] text-primary uppercase mb-[0.8vh]">2 · One read-only data source</div>
          <div className="text-[1.3vw] mb-[0.5vh]">Charter library or P&amp;I bulletin feed</div>
          <div className="text-[1vw] text-muted">Amaru ingests under a license card. Citations attached to every brief. Hashes-only retention.</div>
        </div>
        <div className="border border-rule bg-panel p-[1.8vw]">
          <div className="font-mono text-[0.85vw] tracking-[0.2em] text-primary uppercase mb-[0.8vh]">3 · IT/OT topology read</div>
          <div className="text-[1.3vw] mb-[0.5vh]">Passive — Sentra scores from inventory</div>
          <div className="text-[1vw] text-muted">No agents on bridge systems day one. Office estate + remote-vendor access logs only.</div>
        </div>
        <div className="border border-rule bg-panel p-[1.8vw]">
          <div className="font-mono text-[0.85vw] tracking-[0.2em] text-primary uppercase mb-[0.8vh]">4 · Two contacts</div>
          <div className="text-[1.3vw] mb-[0.5vh]">One ops + one P&amp;I — Stamford / Athens</div>
          <div className="text-[1vw] text-muted">30 minutes a week for the review. Not a steering committee.</div>
        </div>
        <div className="col-span-2 border border-gold bg-panel p-[1.8vw]">
          <div className="font-mono text-[0.85vw] tracking-[0.2em] text-gold uppercase mb-[0.8vh]">5 · Sponsor — Peter, or one named delegate</div>
          <div className="text-[1.3vw] mb-[0.5vh]">So the day-90 readout lands on the desk that signs production.</div>
          <div className="text-[1vw] text-muted">No procurement loop required for pilot — pilot fee capped, returnable against year-one.</div>
        </div>
      </div>

      <div className="border-t border-rule pt-[2vh] mt-[2.5vh] flex items-end justify-between">
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted uppercase">No SSO · no prod access · no IT lift in week one</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">34 / 40</div>
      </div>
    </div>
  );
}
