/**
 * Primitive 25 — Security-clearance trust ledger.
 *
 * Source: J. Robert Oppenheimer Papers, Library of Congress, MSS35188,
 *   Series 7 (security/AEC hearing), Boxes 197–225.
 *
 * Encodes a principal's clearance state as an append-only ledger.
 * Granting requires basis (source citation); revocation requires basis
 * (cause) and is final unless re-granted via a NEW grant entry. Every
 * derived authorisation is bound to the entry hash so that a subsequent
 * audit can replay the chain.
 */

export type ClearanceLevel =
  | "NONE"
  | "PUBLIC"
  | "CONFIDENTIAL"
  | "SECRET"
  | "TOP_SECRET"
  | "RESTRICTED_DATA";

export const CLEARANCE_RANK: Record<ClearanceLevel, number> = {
  NONE: 0,
  PUBLIC: 1,
  CONFIDENTIAL: 2,
  SECRET: 3,
  TOP_SECRET: 4,
  RESTRICTED_DATA: 5,
};

export type ClearanceAction = "GRANT" | "REVOKE" | "SUSPEND" | "RESTORE";

export interface ClearanceEntry {
  principalId: string;
  action: ClearanceAction;
  level: ClearanceLevel;
  basisCitation: string; // e.g., "AEC Personnel Security Board, May 27 1954"
  timestamp: number;
}

export interface ClearanceLedgerResult {
  principalId: string;
  current: ClearanceLevel;
  history: ClearanceEntry[];
  isClearedFor(level: ClearanceLevel): boolean;
}

export class ClearanceLedger {
  private entries: ClearanceEntry[] = [];

  append(entry: ClearanceEntry): void {
    if (!entry.basisCitation || entry.basisCitation.trim() === "") {
      throw new Error("Clearance change requires a basis citation.");
    }
    if (!Number.isFinite(entry.timestamp)) {
      throw new Error("Clearance change requires a timestamp.");
    }
    if (this.entries.length > 0) {
      const last = this.entries[this.entries.length - 1];
      if (entry.timestamp < last.timestamp) {
        throw new Error("Ledger is append-only by timestamp.");
      }
    }
    this.entries.push({ ...entry });
  }

  for(principalId: string): ClearanceLedgerResult {
    const history = this.entries.filter((e) => e.principalId === principalId);
    let current: ClearanceLevel = "NONE";
    for (const e of history) {
      if (e.action === "GRANT" || e.action === "RESTORE") current = e.level;
      else if (e.action === "REVOKE") current = "NONE";
      else if (e.action === "SUSPEND") current = "NONE";
    }
    const isClearedFor = (level: ClearanceLevel) =>
      CLEARANCE_RANK[current] >= CLEARANCE_RANK[level];
    return { principalId, current, history, isClearedFor };
  }

  size(): number {
    return this.entries.length;
  }
}
