const ROWS = [
  { model: "Claude 4.5 Sonnet", license: "Anthropic commercial · class-2 dual-use", policy: "Allowed · constitution gate" },
  { model: "GPT-4o", license: "OpenAI commercial · no training opt-out by default", policy: "Allowed · PII redactor on" },
  { model: "Llama 3.3 70B (self-host)", license: "Meta community · acceptable use", policy: "Allowed · org-only" },
  { model: "Mistral Large (EU host)", license: "Mistral commercial · EU residency", policy: "Allowed · counsel-only" },
  { model: "DeepSeek R1 (third-party API)", license: "Class-2 jurisdiction flag", policy: "Held · escalate to Costa" },
];

export default function A11oyLicense() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body px-[6vw] py-[6vh] flex flex-col">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[1vw] tracking-[0.25em] text-gold uppercase">Section 04 · A11oy · Lexicon</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">06 / 26</div>
      </div>

      <h2 className="mt-[3vh] text-[3.4vw] leading-[1.05] font-light tracking-[-0.025em]">
        Every model the org touches <span className="text-gold font-medium">has a license card.</span>
      </h2>
      <p className="mt-[1.5vh] text-[1.15vw] text-muted leading-[1.4] max-w-[78vw]">
        License terms parsed at registration. Re-evaluated at every call. When a vendor changes terms — your gate moves the same day, not at year-end review.
      </p>

      <div className="mt-[3vh] flex-1 border border-rule bg-panel overflow-hidden">
        <div className="grid grid-cols-[1.4fr_2.2fr_1.6fr] font-mono text-[0.85vw] tracking-[0.2em] text-gold uppercase border-b border-rule px-[1.5vw] py-[1.2vh]">
          <div>Model</div><div>License</div><div>Policy decision</div>
        </div>
        {ROWS.map((r, i) => (
          <div key={r.model} className={`grid grid-cols-[1.4fr_2.2fr_1.6fr] px-[1.5vw] py-[1.6vh] text-[1.05vw] leading-[1.4] ${i < ROWS.length - 1 ? "border-b border-rule" : ""}`}>
            <div className="font-mono text-text">{r.model}</div>
            <div className="text-muted">{r.license}</div>
            <div className="font-mono text-[0.95vw]" style={{ color: r.policy.startsWith("Held") ? "#c9b787" : "#9aa3a6" }}>{r.policy}</div>
          </div>
        ))}
      </div>

      <div className="mt-[2.5vh] border border-gold bg-bg p-[1.5vw]">
        <div className="font-mono text-[0.85vw] tracking-[0.2em] text-gold uppercase mb-[0.8vh]">For Marina</div>
        <div className="text-[1.2vw] text-text leading-[1.45]">
          One pane sees every license decision across the org. A vendor changing terms is an event on the audit board — not a surprise in a renewal cycle.
        </div>
      </div>

      <div className="border-t border-rule pt-[2vh] mt-[2.5vh] flex items-end justify-between">
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted uppercase">GET /api/a11oy/lexicon/catalog · governance you can query</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">06 / 26</div>
      </div>
    </div>
  );
}
