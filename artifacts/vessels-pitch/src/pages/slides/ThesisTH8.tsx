import { THESIS_PAPERS } from '@szl-holdings/payload';

const paper = THESIS_PAPERS.find((p) => p.key === 'TH8-GLR')!;
const theorem = paper.theorems.find((t) => t.id === 'TH8')!;

export default function ThesisTH8() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0a0a0a] text-text">
      <div className="absolute top-0 left-0 w-[5vw] h-full bg-[#0e0e0e] border-r border-[rgba(201,183,135,0.15)]" />
      <div className="absolute top-[6vh] left-0 w-[5vw] flex flex-col items-center gap-[1vh]">
        <div className="font-mono text-[1.6vw] tracking-[0.1em] text-gold">{theorem.id}</div>
        <div className="w-[2vw] h-[2px] bg-gold" />
        <div className="font-mono text-[0.7vw] tracking-[0.25em] text-muted uppercase [writing-mode:vertical-rl] mt-[2vh]">Theorem 8 of 8</div>
      </div>

      <div className="absolute top-[6vh] left-[10vw] right-[6vw] flex items-start justify-between">
        <div className="font-mono text-[0.9vw] tracking-[0.28em] text-gold uppercase">{paper.key} · {paper.version}</div>
        <a href={paper.doiUrl} target="_blank" rel="noopener noreferrer" className="font-mono text-[0.9vw] tracking-[0.18em] text-gold uppercase no-underline border-b border-dotted border-gold">DOI {paper.doi} ↗</a>
      </div>

      <div className="absolute left-[10vw] right-[10vw] top-[18vh]">
        <div className="font-mono text-[1vw] tracking-[0.25em] text-muted uppercase mb-[3vh]">Target venue · POPL 2027 or CAV 2027</div>
        <h1 className="text-[5vw] leading-[1.02] font-light tracking-[-0.02em]" style={{ fontFamily: "'Cormorant Garamond', serif", textWrap: "balance" }}>
          {theorem.name}
        </h1>
        <p className="mt-[4vh] max-w-[72vw] text-[1.5vw] leading-[1.5] text-text/85" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          The graded Lambda-receipt calculus carries TH8a–c: capability revocation by
          construction, replay as grade identity, and Λ-floor as linear-logic provability.
          Lean 4 skeleton is live; sorries are tracked in the audit below.
        </p>
      </div>

      <div className="absolute bottom-[18vh] left-[10vw] right-[10vw] grid grid-cols-3 gap-[2vw]">
        <div className="border border-[rgba(201,183,135,0.18)] bg-[rgba(201,183,135,0.03)] p-[1.5vh_1.5vw]">
          <div className="font-mono text-[0.85vw] text-gold mb-[0.6vh]">TH8a</div>
          <div className="font-mono text-[0.95vw] text-text/85">Capability revocation by construction</div>
        </div>
        <div className="border border-[rgba(201,183,135,0.18)] bg-[rgba(201,183,135,0.03)] p-[1.5vh_1.5vw]">
          <div className="font-mono text-[0.85vw] text-gold mb-[0.6vh]">TH8b</div>
          <div className="font-mono text-[0.95vw] text-text/85">Deterministic replay as grade identity</div>
        </div>
        <div className="border border-[rgba(201,183,135,0.18)] bg-[rgba(201,183,135,0.03)] p-[1.5vh_1.5vw]">
          <div className="font-mono text-[0.85vw] text-gold mb-[0.6vh]">TH8c</div>
          <div className="font-mono text-[0.95vw] text-text/85">Λ-floor as linear-logic provability</div>
        </div>
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
          <div className="font-mono text-[1.1vw] text-text">Amaru (canonical lineage)</div>
        </div>
      </div>
    </div>
  );
}
