/**
 * Primitive 54 — Cipher-table provenance
 *
 * Every cipher table used must trace to a citeable source: author,
 * work, edition, page. A digest of the table is bound to that
 * provenance so subsequent use is verifiable.
 */

import { createHash } from "node:crypto";

export interface CipherProvenance {
  author: string;
  work: string;
  edition: string;
  page: string;
}

export interface CipherTable {
  table: Record<string, string>;
  provenance: CipherProvenance;
  digest: string; // sha256 of canonical(table+provenance)
}

function canon(table: Record<string, string>, p: CipherProvenance): string {
  const sortedKeys = Object.keys(table).sort();
  const sortedTable = sortedKeys.map((k) => [k, table[k]]);
  return JSON.stringify({ sortedTable, p });
}

export function bindCipher(
  table: Record<string, string>,
  provenance: CipherProvenance,
): CipherTable {
  const digest = createHash("sha256").update(canon(table, provenance)).digest("hex");
  return { table, provenance, digest };
}

export function verifyCipher(ct: CipherTable): boolean {
  const expected = createHash("sha256")
    .update(canon(ct.table, ct.provenance))
    .digest("hex");
  return expected === ct.digest;
}
