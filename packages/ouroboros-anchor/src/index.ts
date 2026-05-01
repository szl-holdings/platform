import { createHash } from "node:crypto";
import { submitRekorEntry } from "./rekor.js";

export * from "./rekor.js";

export type AnchorDriver = "LOCAL" | "REKOR" | "INTERNAL_HSM";

export interface AnchorEntry {
  readonly chainId: string;
  readonly rootHash: string;
  readonly timestamp: number;
  readonly driver: AnchorDriver;
  readonly receipt: string;
}

export interface AnchorConfig {
  readonly driver: AnchorDriver;
  readonly rekorUrl?: string;
  readonly hsmKeyId?: string;
  /** When true and driver=REKOR, makes a live HTTP submission. */
  readonly live?: boolean;
  readonly signatureBase64?: string;
  readonly publicKeyBase64?: string;
}

export function computeMerkleRoot(leaves: string[]): string {
  if (leaves.length === 0) return sha256("");
  let layer = leaves.map((l) => sha256(l));
  while (layer.length > 1) {
    const next: string[] = [];
    for (let i = 0; i < layer.length; i += 2) {
      const a = layer[i];
      const b = i + 1 < layer.length ? layer[i + 1] : a;
      next.push(sha256(a + b));
    }
    layer = next;
  }
  return layer[0];
}

export function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export class WitnessAnchor {
  constructor(private readonly cfg: AnchorConfig) {}

  async anchor(chainId: string, leaves: string[]): Promise<AnchorEntry> {
    const rootHash = computeMerkleRoot(leaves);
    const timestamp = Date.now();
    const receipt = await this.publish(chainId, rootHash, timestamp);
    return { chainId, rootHash, timestamp, driver: this.cfg.driver, receipt };
  }

  verify(entry: AnchorEntry, leaves: string[]): boolean {
    return computeMerkleRoot(leaves) === entry.rootHash;
  }

  private async publish(chainId: string, root: string, ts: number): Promise<string> {
    switch (this.cfg.driver) {
      case "LOCAL":
        return `local:${sha256(`${chainId}:${root}:${ts}`)}`;
      case "REKOR": {
        if (this.cfg.live === true) {
          const sig = this.cfg.signatureBase64 ?? "";
          const pk = this.cfg.publicKeyBase64 ?? "";
          const entry = await submitRekorEntry(root, sig, pk, {
            rekorUrl: this.cfg.rekorUrl,
          });
          return `rekor:${entry.uuid}:${entry.logIndex}:${root}`;
        }
        return `rekor:${this.cfg.rekorUrl ?? "https://rekor.sigstore.dev"}:${root}`;
      }
      case "INTERNAL_HSM":
        if (!this.cfg.hsmKeyId) throw new Error("hsmKeyId required for INTERNAL_HSM");
        return `hsm:${this.cfg.hsmKeyId}:${root}`;
    }
  }
}

export function anchorVerdict(entry: AnchorEntry, ageMaxMs: number): "OK" | "STALE" | "MISSING" {
  if (!entry || !entry.rootHash) return "MISSING";
  if (Date.now() - entry.timestamp > ageMaxMs) return "STALE";
  return "OK";
}
