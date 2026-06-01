/**
 * ledger/ — T04 Receipt-substrate (Yawar-Ledger).
 *
 * Backing (REAL): mirrors a11oy/packages/receipt-substrate/src/index.ts
 *   (canonical JSON, hash chaining, prev_receipt_hash). Formal layer:
 *   Lutar/Transduction/ReceiptInvariant.lean (receipt_transduction_invariant,
 *   receipt_round_trip_preserves_body — proven).
 *
 * Real append-only chain with SHA-256 prev-hash linkage (delegates to tamper/).
 * No mocks.
 */

import { chainAppend, hashJson, verifyChain } from "../tamper/index.ts";
import type { ChainLink } from "../tamper/index.ts";

export interface LedgerEntry {
  readonly sequence: number;
  readonly timestampIso: string;
  readonly actor: string;
  readonly eventType: string;
  readonly payloadHash: string;
  readonly prevHash: string | null;
  readonly entryHash: string;
  readonly body: unknown;
}

export class ReceiptLedger {
  private entries: LedgerEntry[] = [];
  private lastLink: ChainLink | null = null;

  /** append — add a receipt; chains it to the previous via SHA-256. */
  append(actor: string, eventType: string, body: unknown): LedgerEntry {
    const link = chainAppend(this.lastLink, body);
    const entry: LedgerEntry = {
      sequence: link.index,
      timestampIso: new Date().toISOString(),
      actor,
      eventType,
      payloadHash: hashJson(body),
      prevHash: link.prevHash,
      entryHash: link.linkHash,
      body,
    };
    this.entries.push(entry);
    this.lastLink = link;
    return entry;
  }

  /**
   * verify — recompute the full chain from the stored bodies (a real
   * round-trip: re-hash each body, re-derive each link hash). Returns validity
   * and the index of the first broken link, if any.
   */
  verify(): { valid: boolean; brokenAt: number | null } {
    const rebuilt: ChainLink[] = this.entries.map((e) => ({
      index: e.sequence,
      bodyHash: hashJson(e.body),
      prevHash: e.prevHash,
      linkHash: e.entryHash,
    }));
    // Also confirm the stored payloadHash matches a fresh hash of the body.
    for (const e of this.entries) {
      if (e.payloadHash !== hashJson(e.body)) return { valid: false, brokenAt: e.sequence };
    }
    return verifyChain(rebuilt);
  }

  /** prevHashOk — confirms the latest entry's prevHash matches the prior link. */
  prevHashOk(): boolean {
    if (this.entries.length < 2) return true;
    const last = this.entries[this.entries.length - 1];
    const prev = this.entries[this.entries.length - 2];
    return last.prevHash === prev.entryHash;
  }

  all(): readonly LedgerEntry[] {
    return this.entries;
  }
}
