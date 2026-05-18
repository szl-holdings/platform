export default function WhyNow() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body px-[6vw] py-[7vh] flex flex-col">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[1vw] tracking-[0.25em] text-gold uppercase">Section 02 · The Shift</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">03 / 16</div>
      </div>

      <h2 className="mt-[6vh] text-[4vw] leading-[1.05] font-light tracking-[-0.025em] max-w-[75vw]">
        The compliance perimeter for gas carriers
        <span className="block font-bold text-gold">moved in 2024. It will not move back.</span>
      </h2>

      <div className="mt-[8vh] grid grid-cols-3 gap-[2vw] flex-1">
        <div className="bg-panel border border-rule p-[2.5vw] flex flex-col">
          <div className="font-mono text-[0.95vw] tracking-[0.2em] text-alert uppercase mb-[2vh]">Pressure 01</div>
          <div className="text-[2.2vw] font-medium leading-[1.15] mb-[2vh]">OFAC LPG sanctions widened</div>
          <p className="text-[1.25vw] leading-[1.5] text-muted">
            Iran-origin LPG, Russian Baltic loadings, and Venezuelan barrels have all triggered designations
            of charterers, brokers, and tonnage providers since 2024.
          </p>
        </div>
        <div className="bg-panel border border-rule p-[2.5vw] flex flex-col">
          <div className="font-mono text-[0.95vw] tracking-[0.2em] text-alert uppercase mb-[2vh]">Pressure 02</div>
          <div className="text-[2.2vw] font-medium leading-[1.15] mb-[2vh]">Dark-fleet STS in gas trade</div>
          <p className="text-[1.25vw] leading-[1.5] text-muted">
            AIS gaps, identity swaps, and ship-to-ship transfers historically associated with crude tankers
            are now appearing in the VLGC and midsize gas-carrier segments.
          </p>
        </div>
        <div className="bg-panel border border-rule p-[2.5vw] flex flex-col">
          <div className="font-mono text-[0.95vw] tracking-[0.2em] text-alert uppercase mb-[2vh]">Pressure 03</div>
          <div className="text-[2.2vw] font-medium leading-[1.15] mb-[2vh]">Insurer + bank scrutiny</div>
          <p className="text-[1.25vw] leading-[1.5] text-muted">
            P&I clubs and trade-finance banks now demand auditable counterparty screening and
            voyage-level provenance on every fixture, not annual attestations.
          </p>
        </div>
      </div>

      <div className="flex items-end justify-between border-t border-rule pt-[3vh] mt-[4vh]">
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted uppercase">Vessels · Dorian Briefing</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">May 2026</div>
      </div>
    </div>
  );
}
