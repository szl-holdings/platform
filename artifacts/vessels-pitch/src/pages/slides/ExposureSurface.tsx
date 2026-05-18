export default function ExposureSurface() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body px-[6vw] py-[7vh] flex flex-col">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[1vw] tracking-[0.25em] text-gold uppercase">Section 04 · Exposure</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">05 / 16</div>
      </div>

      <h2 className="mt-[5vh] text-[3.8vw] leading-[1.05] font-light tracking-[-0.02em] max-w-[78vw]">
        Six surfaces where a single bad signal
        <span className="block text-alert font-medium">becomes a headline, a delisting, or a frozen P&amp;I cover.</span>
      </h2>

      <div className="mt-[7vh] grid grid-cols-3 grid-rows-2 gap-[2vw] flex-1">
        <div className="bg-panel border border-rule p-[2vw] flex flex-col gap-[1.5vh]">
          <div className="font-mono text-[1.6vw] text-gold">01</div>
          <div className="text-[1.8vw] font-medium leading-[1.15]">Sanctioned charterer</div>
          <div className="text-[1.1vw] text-muted leading-[1.4]">A subsidiary or alias picked up by OFAC after fixture is signed.</div>
        </div>
        <div className="bg-panel border border-rule p-[2vw] flex flex-col gap-[1.5vh]">
          <div className="font-mono text-[1.6vw] text-gold">02</div>
          <div className="text-[1.8vw] font-medium leading-[1.15]">Receiver in gray jurisdiction</div>
          <div className="text-[1.1vw] text-muted leading-[1.4]">Discharge port flagged for re-export of Russian or Iranian-origin LPG.</div>
        </div>
        <div className="bg-panel border border-rule p-[2vw] flex flex-col gap-[1.5vh]">
          <div className="font-mono text-[1.6vw] text-gold">03</div>
          <div className="text-[1.8vw] font-medium leading-[1.15]">AIS gap mid-voyage</div>
          <div className="text-[1.1vw] text-muted leading-[1.4]">VLGC goes dark for hours near a known STS cluster. Insurer asks why.</div>
        </div>
        <div className="bg-panel border border-rule p-[2vw] flex flex-col gap-[1.5vh]">
          <div className="font-mono text-[1.6vw] text-gold">04</div>
          <div className="text-[1.8vw] font-medium leading-[1.15]">Ship-to-ship with shadow tonnage</div>
          <div className="text-[1.1vw] text-muted leading-[1.4]">Counterparty vessel under suspicious ownership comes alongside in open water.</div>
        </div>
        <div className="bg-panel border border-rule p-[2vw] flex flex-col gap-[1.5vh]">
          <div className="font-mono text-[1.6vw] text-gold">05</div>
          <div className="text-[1.8vw] font-medium leading-[1.15]">Beneficial owner change</div>
          <div className="text-[1.1vw] text-muted leading-[1.4]">Charterer ownership shifts mid-charter through a new corporate veil.</div>
        </div>
        <div className="bg-panel border border-rule p-[2vw] flex flex-col gap-[1.5vh]">
          <div className="font-mono text-[1.6vw] text-gold">06</div>
          <div className="text-[1.8vw] font-medium leading-[1.15]">Documentation gap</div>
          <div className="text-[1.1vw] text-muted leading-[1.4]">No defensible audit trail of who screened what, when, and against which list.</div>
        </div>
      </div>

      <div className="flex items-end justify-between border-t border-rule pt-[3vh] mt-[3vh]">
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted uppercase">Exposure surface · Vessels analysis</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">05 / 16</div>
      </div>
    </div>
  );
}
