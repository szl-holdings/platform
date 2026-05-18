export default function WhyUs() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body px-[6vw] py-[7vh] flex flex-col">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[1vw] tracking-[0.25em] text-gold uppercase">Section 08 · Why Vessels</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">15 / 16</div>
      </div>

      <h2 className="mt-[5vh] text-[3.6vw] leading-[1.05] font-light tracking-[-0.02em] max-w-[78vw]">
        Other vendors give you a dashboard.
        <span className="block text-gold font-medium">We give you something that holds up in an examination room.</span>
      </h2>

      <div className="mt-[7vh] grid grid-cols-2 gap-[3vw] flex-1">
        <div className="flex flex-col gap-[2vh]">
          <div className="bg-panel border border-rule p-[2vw]">
            <div className="font-mono text-[0.9vw] tracking-[0.2em] text-primary uppercase mb-[1vh]">Built on a shared platform</div>
            <p className="text-[1.2vw] leading-[1.5] text-muted">
              Vessels sits in the same operating family as A11oy (brand orchestration) and Sentra (cyber resilience).
              Shared identity, shared receipts, shared signals. The intelligence layer doesn&apos;t live in a silo.
            </p>
          </div>
          <div className="bg-panel border border-rule p-[2vw]">
            <div className="font-mono text-[0.9vw] tracking-[0.2em] text-primary uppercase mb-[1vh]">Maritime-first, not maritime-bolted-on</div>
            <p className="text-[1.2vw] leading-[1.5] text-muted">
              VLGC, LR1, LR2, MR, suezmax, aframax — the domain model is shipping&apos;s, not a generic CRM. Voyage objects, fixture objects, STS objects, port-state objects.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-[2vh]">
          <div className="bg-panel border border-rule p-[2vw]">
            <div className="font-mono text-[0.9vw] tracking-[0.2em] text-primary uppercase mb-[1vh]">Receipts as a primitive</div>
            <p className="text-[1.2vw] leading-[1.5] text-muted">
              SZL trust receipts are not a feature — they are how every read and write inside the platform is recorded. That is the difference between a tool and an audit defence.
            </p>
          </div>
          <div className="bg-panel border border-rule p-[2vw]">
            <div className="font-mono text-[0.9vw] tracking-[0.2em] text-primary uppercase mb-[1vh]">Built to be replaced — never</div>
            <p className="text-[1.2vw] leading-[1.5] text-muted">
              Open data export, open API, no proprietary lock-in on your fleet data, your screenings, or your receipts. If we ever fail you, you walk with everything.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-end justify-between border-t border-rule pt-[3vh] mt-[3vh]">
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted uppercase">Why Vessels</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">15 / 16</div>
      </div>
    </div>
  );
}
