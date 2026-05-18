export default function CounterpartyDD() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body px-[6vw] py-[7vh] flex flex-col">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[1vw] tracking-[0.25em] text-gold uppercase">Capability 05 · Counterparty</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">11 / 16</div>
      </div>

      <h2 className="mt-[5vh] text-[3.4vw] leading-[1.05] font-light tracking-[-0.02em] max-w-[80vw]">
        Every charterer, broker, receiver and consignee —
        <span className="block text-gold font-medium">walked all the way up the ownership chain.</span>
      </h2>

      <div className="mt-[6vh] grid grid-cols-12 gap-[2vw] flex-1">
        <div className="col-span-5 flex flex-col gap-[2vh]">
          <div className="bg-panel border border-rule p-[2vw]">
            <div className="font-mono text-[0.9vw] tracking-[0.2em] text-primary uppercase mb-[1.5vh]">UBO walk</div>
            <p className="text-[1.2vw] leading-[1.5] text-muted">
              Multi-jurisdiction corporate registry traversal. We follow the corporate veil through every
              shell until we hit a natural person, a state entity, or a sanctioned terminal node.
            </p>
          </div>
          <div className="bg-panel border border-rule p-[2vw] flex-1">
            <div className="font-mono text-[0.9vw] tracking-[0.2em] text-gold uppercase mb-[1.5vh]">Risk score</div>
            <p className="text-[1.2vw] leading-[1.5] text-muted">
              Composite of sanctions distance, PEP exposure, port-state detention history, AIS behavior of
              affiliated tonnage, and adverse-media signals — refreshed nightly.
            </p>
          </div>
        </div>

        <div className="col-span-7 bg-panel border border-rule p-[2vw] relative">
          <div className="font-mono text-[0.9vw] tracking-[0.2em] text-primary uppercase mb-[2vh]">Sample · Sigma Trading FZE → UBO graph</div>
          <svg viewBox="0 0 560 320" className="w-full h-[34vh]">
            {/* edges */}
            <line x1="60" y1="160" x2="200" y2="80" stroke="#1c2d35" strokeWidth="1.5" />
            <line x1="60" y1="160" x2="200" y2="160" stroke="#1c2d35" strokeWidth="1.5" />
            <line x1="60" y1="160" x2="200" y2="240" stroke="#1c2d35" strokeWidth="1.5" />
            <line x1="200" y1="80" x2="360" y2="60" stroke="#1c2d35" strokeWidth="1.5" />
            <line x1="200" y1="160" x2="360" y2="160" stroke="#1c2d35" strokeWidth="1.5" />
            <line x1="200" y1="240" x2="360" y2="240" stroke="#1c2d35" strokeWidth="1.5" />
            <line x1="360" y1="160" x2="500" y2="160" stroke="#EE3524" strokeWidth="2" />

            {/* nodes */}
            <circle cx="60" cy="160" r="14" fill="#06607F" />
            <text x="60" y="195" fill="#f5f1e8" fontSize="10" fontFamily="DM Mono" textAnchor="middle">SIGMA FZE</text>

            <circle cx="200" cy="80" r="10" fill="#1c2d35" stroke="#8a9499" />
            <text x="200" y="60" fill="#8a9499" fontSize="9" fontFamily="DM Mono" textAnchor="middle">SIGMA HOLD (UAE)</text>
            <circle cx="200" cy="160" r="10" fill="#1c2d35" stroke="#8a9499" />
            <text x="200" y="140" fill="#8a9499" fontSize="9" fontFamily="DM Mono" textAnchor="middle">EAST LINE LTD (CY)</text>
            <circle cx="200" cy="240" r="10" fill="#1c2d35" stroke="#8a9499" />
            <text x="200" y="262" fill="#8a9499" fontSize="9" fontFamily="DM Mono" textAnchor="middle">VIRGO INVEST (BVI)</text>

            <circle cx="360" cy="60" r="10" fill="#1c2d35" stroke="#8a9499" />
            <text x="360" y="40" fill="#8a9499" fontSize="9" fontFamily="DM Mono" textAnchor="middle">ARRAY GROUP</text>
            <circle cx="360" cy="160" r="10" fill="#1c2d35" stroke="#8a9499" />
            <text x="360" y="140" fill="#8a9499" fontSize="9" fontFamily="DM Mono" textAnchor="middle">NOMINEE TRUST</text>
            <circle cx="360" cy="240" r="10" fill="#1c2d35" stroke="#8a9499" />
            <text x="360" y="262" fill="#8a9499" fontSize="9" fontFamily="DM Mono" textAnchor="middle">UNRESOLVED</text>

            <circle cx="500" cy="160" r="14" fill="#EE3524" />
            <text x="500" y="195" fill="#EE3524" fontSize="10" fontFamily="DM Mono" textAnchor="middle">SDN ENTITY</text>

            <text x="280" y="300" fill="#EE3524" fontSize="11" fontFamily="DM Mono" textAnchor="middle">3-hop UBO match · do not fix</text>
          </svg>
        </div>
      </div>

      <div className="flex items-end justify-between border-t border-rule pt-[3vh] mt-[3vh]">
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted uppercase">Capability 05 of 06</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">11 / 16</div>
      </div>
    </div>
  );
}
