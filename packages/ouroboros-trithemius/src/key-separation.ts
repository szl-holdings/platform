/**
 * Primitive 55 — Steganographic key separation
 *
 * The key MUST travel by a different channel than the carrier. This
 * primitive accepts a list of (asset, channelId) bindings and
 * verifies that the cipher-key channel is disjoint from every
 * carrier channel.
 */

export interface ChannelBinding {
  asset: "key" | "carrier";
  channelId: string;
}

export interface KeySeparationReceipt {
  keyChannels: string[];
  carrierChannels: string[];
  overlap: string[];
  passes: boolean;
  rationale: string;
}

export function auditKeySeparation(
  bindings: ChannelBinding[],
): KeySeparationReceipt {
  const keyChannels = [
    ...new Set(bindings.filter((b) => b.asset === "key").map((b) => b.channelId)),
  ];
  const carrierChannels = [
    ...new Set(bindings.filter((b) => b.asset === "carrier").map((b) => b.channelId)),
  ];
  const overlap = keyChannels.filter((c) => carrierChannels.includes(c));
  const passes = overlap.length === 0 && keyChannels.length > 0 && carrierChannels.length > 0;
  return {
    keyChannels,
    carrierChannels,
    overlap,
    passes,
    rationale: passes
      ? "key and carrier channels are disjoint"
      : overlap.length > 0
      ? "key channel overlaps carrier channel — separation violated"
      : "missing key or carrier channel binding",
  };
}
