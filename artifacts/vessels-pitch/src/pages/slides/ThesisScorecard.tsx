import { THESIS_LINEAGE } from '@szl-holdings/payload';

const { audit, arxiv, zenodo } = THESIS_LINEAGE;
const sorriesClosedCount = audit.leanSorriesClosed.length;

export default function ThesisScorecard() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0a0a0a] text-text">
      <svg className="absolute inset-0 w-full h-full opacity-[0.05]" viewBox="0 0 1920 1080" preserveAspectRatio="none">
        <defs>
          <pattern id="scorecard-grid" width="160" height="160" patternUnits="userSpaceOnUse">
            <path d="M 160 0 L 0 0 0 160" fill="none" stroke="#c9b787" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="1920" height="1080" fill="url(#scorecard-grid)" />
      </svg>

      <div className="absolute top-[6vh] left-[6vw] right-[6vw] flex items-start justify-between">
        <div className="font-mono text-[1vw] tracking-[0.28em] text-gold uppercase">Fly High V6 Audit · Live Counters</div>
        <div className="font-mono text-[0.85vw] tracking-[0.2em] text-muted uppercase">Mirror updated {audit.updatedAt}</div>
      </div>

      <div className="absolute left-[6vw] right-[6vw] top-[16vh]">
        <h1 className="text-[4.8vw] leading-[1] font-light tracking-[-0.02em]" style={{ fontFamily: "'Cormorant Garamond', serif", textWrap: "balance" }}>
          Lean discharge scorecard.
        </h1>
        <p className="mt-[2vh] max-w-[60vw] text-[1.3vw] text-muted" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          Sourced from <span className="font-mono text-gold text-[1vw]">THESIS_LINEAGE.audit</span>.
        </p>
      </div>

      <div className="absolute left-[6vw] right-[6vw] top-[40vh] grid grid-cols-4 gap-[1.5vw]">
        <div className="border border-[rgba(201,183,135,0.18)] bg-[rgba(201,183,135,0.03)] p-[2vh_1.2vw]">
          <div className="font-mono text-[0.75vw] tracking-[0.22em] text-muted uppercase mb-[1vh]">Doctrine V6</div>
          <div className="font-mono text-[2vw] text-gold">{audit.doctrine}</div>
        </div>
        <div className="border border-[rgba(201,183,135,0.18)] bg-[rgba(201,183,135,0.03)] p-[2vh_1.2vw]">
          <div className="font-mono text-[0.75vw] tracking-[0.22em] text-muted uppercase mb-[1vh]">P0 fixes</div>
          <div className="font-mono text-[2vw] text-[#7fb893]">{audit.p0Fixes}</div>
        </div>
        <div className="border border-[rgba(201,183,135,0.18)] bg-[rgba(201,183,135,0.03)] p-[2vh_1.2vw]">
          <div className="font-mono text-[0.75vw] tracking-[0.22em] text-muted uppercase mb-[1vh]">Beautify avg</div>
          <div className="font-mono text-[2vw] text-[#7fb893]">{audit.beautifyAvg}</div>
        </div>
        <div className="border border-[rgba(201,183,135,0.18)] bg-[rgba(201,183,135,0.03)] p-[2vh_1.2vw]">
          <div className="font-mono text-[0.75vw] tracking-[0.22em] text-muted uppercase mb-[1vh]">TH8 theorems</div>
          <div className="font-mono text-[2vw] text-gold">{audit.leanTheorems}</div>
        </div>
        <div className="border border-[rgba(201,183,135,0.18)] bg-[rgba(201,183,135,0.03)] p-[2vh_1.2vw]">
          <div className="font-mono text-[0.75vw] tracking-[0.22em] text-muted uppercase mb-[1vh]">Sorries open</div>
          <div className="font-mono text-[2vw] text-[#d4a853]">{audit.leanSorriesOpen}</div>
        </div>
        <div className="border border-[rgba(201,183,135,0.18)] bg-[rgba(201,183,135,0.03)] p-[2vh_1.2vw]">
          <div className="font-mono text-[0.75vw] tracking-[0.22em] text-muted uppercase mb-[1vh]">Sorries closed</div>
          <div className="font-mono text-[2vw] text-[#7fb893]">{sorriesClosedCount}</div>
        </div>
        <div className="border border-[rgba(201,183,135,0.18)] bg-[rgba(201,183,135,0.03)] p-[2vh_1.2vw]">
          <div className="font-mono text-[0.75vw] tracking-[0.22em] text-muted uppercase mb-[1vh]">arXiv</div>
          <div className="font-mono text-[1.1vw] text-text/85 leading-tight">{arxiv.status}</div>
          <div className="font-mono text-[0.85vw] text-gold mt-[0.6vh]">{arxiv.targetVenue}</div>
        </div>
        <div className="border border-[rgba(201,183,135,0.18)] bg-[rgba(201,183,135,0.03)] p-[2vh_1.2vw]">
          <div className="font-mono text-[0.75vw] tracking-[0.22em] text-muted uppercase mb-[1vh]">Zenodo</div>
          <div className="font-mono text-[1.1vw] text-text/85 leading-tight">{zenodo.status}</div>
          <div className="font-mono text-[0.85vw] text-gold mt-[0.6vh]">{zenodo.targetVersion}</div>
        </div>
      </div>

      <div className="absolute bottom-[6vh] left-[6vw] right-[6vw] flex items-end justify-between gap-[4vw]">
        <div className="font-mono text-[0.95vw] text-text/80 max-w-[55vw]">
          Citation hardening · <span className="text-gold">{audit.citationHardening}</span>
        </div>
        <div className="font-mono text-[0.85vw] text-muted text-right">
          © 2026 Stephen P. Lutar · SZL Holdings · ORCID 0009-0001-0110-4173
        </div>
      </div>
    </div>
  );
}
