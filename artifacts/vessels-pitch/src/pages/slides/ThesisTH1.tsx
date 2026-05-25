import { THESIS_PAPERS } from '@szl-holdings/payload';

const paper = THESIS_PAPERS.find((p) => p.key === 'TH1-TH3')!;
const theorem = paper.theorems.find((t) => t.id === 'TH1')!;

export default function ThesisTH1() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0a0a0a] text-text">
      <div className="absolute top-0 left-0 w-[5vw] h-full bg-[#0e0e0e] border-r border-[rgba(201,183,135,0.15)]" />
      <div className="absolute top-[6vh] left-0 w-[5vw] flex flex-col items-center gap-[1vh]">
        <div className="font-mono text-[1.6vw] tracking-[0.1em] text-gold">{theorem.id}</div>
        <div className="w-[2vw] h-[2px] bg-gold" />
        <div className="font-mono text-[0.7vw] tracking-[0.25em] text-muted uppercase [writing-mode:vertical-rl] mt-[2vh]">Theorem 1 of 8</div>
      </div>

      <div className="absolute top-[6vh] left-[10vw] right-[6vw] flex items-start justify-between">
        <div className="font-mono text-[0.9vw] tracking-[0.28em] text-gold uppercase">{paper.key} · {paper.version}</div>
        <a href={paper.doiUrl} target="_blank" rel="noopener noreferrer" className="font-mono text-[0.9vw] tracking-[0.18em] text-gold uppercase no-underline border-b border-dotted border-gold">DOI {paper.doi} ↗</a>
      </div>

      <div className="absolute left-[10vw] right-[10vw] top-[20vh]">
        <div className="font-mono text-[1vw] tracking-[0.25em] text-muted uppercase mb-[3vh]">Composability invariant</div>
        <h1 className="text-[5.2vw] leading-[1.02] font-light tracking-[-0.02em]" style={{ fontFamily: "'Cormorant Garamond', serif", textWrap: "balance" }}>
          {theorem.name}
        </h1>
        <p className="mt-[5vh] max-w-[70vw] text-[1.55vw] leading-[1.5] text-text/85" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          If two systems share a doctrine SHA and use compatible Λ-floors, their composition
          A∘B is itself doctrine-locked. Composability is a theorem of the receipt category,
          not a runtime policy.
        </p>
      </div>

      <div className="absolute bottom-[6vh] left-[10vw] right-[6vw] grid grid-cols-3 gap-[3vw]">
        <div>
          <div className="font-mono text-[0.75vw] tracking-[0.25em] text-muted uppercase mb-[1vh]">Proof status</div>
          <div className="font-mono text-[1.1vw] text-gold">{theorem.proofStatus}</div>
        </div>
        <div>
          <div className="font-mono text-[0.75vw] tracking-[0.25em] text-muted uppercase mb-[1vh]">Paper</div>
          <div className="font-mono text-[1vw] text-text/80">{paper.status}</div>
        </div>
        <div>
          <div className="font-mono text-[0.75vw] tracking-[0.25em] text-muted uppercase mb-[1vh]">Underwrites</div>
          <div className="font-mono text-[1.1vw] text-text">A11oy · Sentra</div>
        </div>
      </div>
    </div>
  );
}
