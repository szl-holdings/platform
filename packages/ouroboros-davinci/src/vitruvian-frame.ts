/**
 * Primitive 57 — Vitruvian dual-frame check
 *
 * Vitruvian Man inscribes a body simultaneously in a circle AND a
 * square. Operationally: a claim must be admissible in two
 * independent reference frames; if only one frame admits it, the
 * claim is flagged as frame-dependent.
 */

export interface FrameTest {
  frameId: string;
  admits: boolean;
  rationale: string;
}

export interface DualFrameReceipt {
  frames: FrameTest[];
  bothAdmit: boolean;
  frameDependent: boolean;
  rationale: string;
}

export function checkDualFrame(frames: FrameTest[]): DualFrameReceipt {
  if (frames.length < 2) {
    throw new Error("dual-frame check requires at least 2 frames");
  }
  const distinctIds = new Set(frames.map((f) => f.frameId)).size;
  if (distinctIds < 2) {
    throw new Error("frames must have distinct ids");
  }
  const admits = frames.filter((f) => f.admits).length;
  const bothAdmit = admits === frames.length;
  const frameDependent = admits > 0 && admits < frames.length;
  return {
    frames,
    bothAdmit,
    frameDependent,
    rationale: bothAdmit
      ? "claim is frame-invariant: admitted in every frame"
      : frameDependent
      ? "frame-dependent: admitted in some but not all frames"
      : "claim rejected by every frame",
  };
}
