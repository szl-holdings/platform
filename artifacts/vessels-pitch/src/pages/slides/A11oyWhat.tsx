export default function A11oyWhat() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body px-[6vw] py-[7vh] flex flex-col">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[1vw] tracking-[0.25em] text-gold uppercase">Section 04 · A11oy</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">05 / 26</div>
      </div>

      <h2 className="mt-[4vh] text-[4vw] leading-[1.05] font-light tracking-[-0.025em] max-w-[80vw]">
        A governed inference gate <span className="text-gold font-medium">at the call site.</span>
      </h2>
      <p className="mt-[2vh] text-[1.4vw] text-muted leading-[1.4] max-w-[70vw]">
        Every model call your organization makes is wrapped at the seam. Nothing leaves without a license, a policy decision, and a receipt.
      </p>

      <div className="mt-[5vh] grid grid-cols-4 gap-[1.5vw] flex-1">
        <div className="border border-rule bg-panel p-[1.8vw]">
          <div className="font-mono text-[0.85vw] tracking-[0.2em] text-primary uppercase mb-[1vh]">01 · Intercept</div>
          <div className="text-[1.3vw] font-medium mb-[1vh]">At the call site</div>
          <div className="text-[1vw] text-muted leading-[1.4]">SDK or sidecar wraps OpenAI / Anthropic / Mistral / on-prem. Drop-in, no model rewrites.</div>
        </div>
        <div className="border border-rule bg-panel p-[1.8vw]">
          <div className="font-mono text-[0.85vw] tracking-[0.2em] text-primary uppercase mb-[1vh]">02 · Gate</div>
          <div className="text-[1.3vw] font-medium mb-[1vh]">License + policy</div>
          <div className="text-[1vw] text-muted leading-[1.4]">License terms, constitution rules, and dual-use review evaluated before the call is allowed out.</div>
        </div>
        <div className="border border-rule bg-panel p-[1.8vw]">
          <div className="font-mono text-[0.85vw] tracking-[0.2em] text-primary uppercase mb-[1vh]">03 · Ground</div>
          <div className="text-[1.3vw] font-medium mb-[1vh]">From Amaru</div>
          <div className="text-[1vw] text-muted leading-[1.4]">Pulls grounded context from your domain graph — citations attached to the receipt.</div>
        </div>
        <div className="border border-gold bg-panel p-[1.8vw]">
          <div className="font-mono text-[0.85vw] tracking-[0.2em] text-gold uppercase mb-[1vh]">04 · Seal</div>
          <div className="text-[1.3vw] font-medium mb-[1vh]">Λ-receipt</div>
          <div className="text-[1vw] text-muted leading-[1.4]">Sealed, SHA-256 linked, replayable. Joins the chain Sentra reads from in near-real-time.</div>
        </div>
      </div>

      <div className="border-t border-rule pt-[2.5vh] mt-[3vh] flex items-end justify-between">
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted uppercase">No model change · one library import · governance becomes inherent</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">05 / 26</div>
      </div>
    </div>
  );
}
