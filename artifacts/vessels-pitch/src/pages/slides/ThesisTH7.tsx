import { THESIS_PAPERS } from '@szl-holdings/payload';

const paper = THESIS_PAPERS.find((p) => p.key === 'TH4-TH7')!;
const theorem = paper.theorems.find((t) => t.id === 'TH7')!;

export default function ThesisTH7() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0a0a0a] text-text">
      <div className="absolute top-0 left-0 w-[5vw] h-full bg-[#0e0e0e] border-r border-[rgba(201,183,135,0.15)]" />
      <div className="absolute top-[6vh] left-0 w-[5vw] flex flex-col items-center gap-[1vh]">
        <div className="font-mono text-[1.6vw] tracking-[0.1em] text-gold">{theorem.id}</div>
        <div className="w-[2vw] h-[2px] bg-gold" />
        <div className="font-mono text-[0.7vw] tracking-[0.25em] text-muted uppercase [writing-mode:vertical-rl] mt-[2vh]">Theorem 7 of 8</div>
      </div>

      <div className="absolute top-[6vh] left-[10vw] right-[6vw] flex items-start justify-between">
        <div className="font-mono text-[0.9vw] tracking-[0.28em] text-gold uppercase">{paper.key} · {paper.version}</div>
        <a href={paper.doiUrl} target="_blank" rel="noopener noreferrer" className="font-mono text-[0.9vw] tracking-[0.18em] text-gold uppercase no-underline border-b border-dotted border-gold">DOI {paper.doi} ↗</a>
      </div>

      <div className="absolute left-[10vw] right-[10vw] top-[20vh]">
        <div className="font-mono text-[1vw] tracking-[0.25em] text-muted uppercase mb-[3vh]">Machine-checked in Lean 4 · sorry count 0</div>
        <h1 className="text-[5.2vw] leading-[1.02] font-light tracking-[-0.02em]" style={{ fontFamily: "'Cormorant Garamond', serif", textWrap: "balance" }}>
          {theorem.name}
        </h1>
        <p className="mt-[5vh] max-w-[72vw] text-[1.55vw] leading-[1.5] text-text/85" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          <span className="italic">PassReceipt(r)</span> is inhabited iff every λ-axis clears
          its floor — the type itself is the proof. Gate evaluation is proof construction;
          receipt verification is proof checking. The runtime is its own proof assistant.
        </p>
      </div>

      <div className="absolute bottom-[6vh] left-[10vw] right-[6vw] grid grid-cols-3 gap-[3vw]">
        <div>
          <div className="font-mono text-[0.75vw] tracking-[0.25em] text-muted uppercase mb-[1vh]">Proof status</div>
          <div className="font-mono text-[1.1vw] text-[#7fb893]">{theorem.proofStatus}</div>
        </div>
        <div>
          <div className="font-mono text-[0.75vw] tracking-[0.25em] text-muted uppercase mb-[1vh]">Paper</div>
          <div className="font-mono text-[1vw] text-text/80">{paper.status}</div>
        </div>
        <div>
          <div className="font-mono text-[0.75vw] tracking-[0.25em] text-muted uppercase mb-[1vh]">Underwrites</div>
          <div className="font-mono text-[1.1vw] text-text">Carlota Jo</div>
        </div>
      </div>
    </div>
  );
}
