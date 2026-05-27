import { useEffect, useState } from "react";
import {
  runVoyagePipeline,
  VoyagePipelineTrace,
  type VoyagePipelineResult,
} from "@workspace/vessels-perception-viz";

const TRUST_VOYAGE = {
  voyageRef: "VOY-2026-001",
  imo: "9412987",
  aisPoints: 3200,
  counterpartyIds: ["CP-001", "CP-SDN-77"],
  sanctionsListVersion: "OFAC-SDN-2026.05.14",
};

export default function TrustReceipts() {
  const [trace, setTrace] = useState<VoyagePipelineResult | null>(null);
  useEffect(() => {
    runVoyagePipeline(TRUST_VOYAGE).then(setTrace);
  }, []);
  return <TrustReceiptsContent trace={trace} />;
}

function TrustReceiptsContent({ trace }: { trace: VoyagePipelineResult | null }) {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body px-[6vw] py-[7vh] flex flex-col">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[1vw] tracking-[0.25em] text-gold uppercase">Capability 06 · The Moat</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">12 / 16</div>
      </div>

      <div className="mt-[5vh]">
        <div className="font-mono text-[1.2vw] tracking-[0.25em] text-primary uppercase mb-[3vh]">SZL Trust Receipts</div>
        <h2 className="text-[4.2vw] leading-[1.05] font-light tracking-[-0.025em] max-w-[80vw]">
          Every screen, every decision, every voyage
          <span className="block text-gold font-medium">stamped with a cryptographic receipt no examiner can argue with.</span>
        </h2>
      </div>

      <div className="mt-[6vh] grid grid-cols-3 gap-[2vw] flex-1">
        <div className="bg-panel border border-rule p-[2vw] flex flex-col">
          <div className="font-mono text-[2.5vw] text-gold leading-[1] mb-[2vh]">01</div>
          <div className="text-[1.8vw] font-medium leading-[1.15] mb-[1.5vh]">Signed at the source</div>
          <p className="text-[1.15vw] leading-[1.5] text-muted">
            Every sanctions screen, AIS gap inference, UBO walk, and fixture decision is hashed at the
            moment it is produced — with the input data, the list version, and the operator identity.
          </p>
        </div>
        <div className="bg-panel border border-rule p-[2vw] flex flex-col">
          <div className="font-mono text-[2.5vw] text-gold leading-[1] mb-[2vh]">02</div>
          <div className="text-[1.8vw] font-medium leading-[1.15] mb-[1.5vh]">Chained, not stored</div>
          <p className="text-[1.15vw] leading-[1.5] text-muted">
            Receipts link forward and backward in a tamper-evident chain. Edit a record after the fact
            and the chain breaks — visibly, publicly, irreversibly.
          </p>
        </div>
        <div className="bg-panel border border-rule p-[2vw] flex flex-col">
          <div className="font-mono text-[2.5vw] text-gold leading-[1] mb-[2vh]">03</div>
          <div className="text-[1.8vw] font-medium leading-[1.15] mb-[1.5vh]">Defensible by design</div>
          <p className="text-[1.15vw] leading-[1.5] text-muted">
            When OFAC, OFSI, the P&amp;I club, or the trade-finance bank asks <span className="text-text">&ldquo;what did you know, and when?&rdquo;</span> —
            you hand them a verifiable answer, not a screenshot folder.
          </p>
        </div>
      </div>

      <div className="mt-[4vh] bg-panel border border-rule px-[2vw] py-[1.5vh] font-mono text-[1vw] tracking-[0.1em] text-muted overflow-hidden">
        <span className="text-gold">szl://</span>0x7c4f…91ab
        <span className="mx-[1vw] text-rule">·</span>
        OFAC SDN v2026.05.14 · screened SIGMA TRADING FZE · risk 87
        <span className="mx-[1vw] text-rule">·</span>
        signed by operator-12 · 2026-05-17T14:02:11Z
      </div>

      {/* Per-stage Λ-receipts emitted by the same sequence-pipeline the live
          Vessels surface runs. Stage shape locked by the package fixture test. */}
      {trace ? (
        <div className="mt-[2vh]">
          <VoyagePipelineTrace pipelineId={trace.pipelineId} stages={trace.stages} />
        </div>
      ) : null}

      <div className="flex items-end justify-between border-t border-rule pt-[3vh] mt-[3vh]">
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted uppercase">Capability 06 of 06</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">12 / 16</div>
      </div>
    </div>
  );
}
