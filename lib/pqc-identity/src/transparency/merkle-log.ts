import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import type { TransparencyLogEntry, TransparencyInclusionProof } from '../types.js';

function hashLeaf(data: string): string {
  return bytesToHex(sha256(new TextEncoder().encode(`leaf:${data}`)));
}

function hashNode(left: string, right: string): string {
  return bytesToHex(sha256(new TextEncoder().encode(`node:${left}:${right}`)));
}

export class TransparencyLog {
  private readonly _entries: TransparencyLogEntry[] = [];
  private readonly _leafHashes: string[] = [];
  private _merkleRoot: string = '';

  get size(): number {
    return this._entries.length;
  }

  get merkleRoot(): string {
    return this._merkleRoot;
  }

  get entries(): readonly TransparencyLogEntry[] {
    return this._entries;
  }

  append(opts: {
    entryType: 'issuance' | 'revocation';
    certThumbprint: string;
    certId: string;
    subjectDid: string;
  }): TransparencyInclusionProof {
    const timestamp = Date.now();
    const index = this._entries.length;

    const leafData = [
      index.toString(),
      timestamp.toString(),
      opts.entryType,
      opts.certThumbprint,
      opts.certId,
      opts.subjectDid,
    ].join('|');

    const leafHash = hashLeaf(leafData);

    const entry: TransparencyLogEntry = {
      index,
      timestamp,
      entryType: opts.entryType,
      certThumbprint: opts.certThumbprint,
      certId: opts.certId,
      subjectDid: opts.subjectDid,
      leafHash,
    };

    this._entries.push(entry);
    this._leafHashes.push(leafHash);
    this._merkleRoot = this._computeMerkleRoot();

    const auditPath = this._computeAuditPath(index);

    return {
      logIndex: index,
      leafHash,
      merkleRoot: this._merkleRoot,
      auditPath,
      treeSize: this._entries.length,
      timestamp,
    };
  }

  getEntry(index: number): TransparencyLogEntry | undefined {
    return this._entries[index];
  }

  getInclusionProof(index: number): TransparencyInclusionProof | null {
    if (index < 0 || index >= this._entries.length) return null;
    const entry = this._entries[index]!;
    const auditPath = this._computeAuditPath(index);
    return {
      logIndex: index,
      leafHash: entry.leafHash,
      merkleRoot: this._merkleRoot,
      auditPath,
      treeSize: this._entries.length,
      timestamp: entry.timestamp,
    };
  }

  getInclusionProofByThumbprint(thumbprint: string): TransparencyInclusionProof | null {
    const idx = this._entries.findIndex((e) => e.certThumbprint === thumbprint);
    if (idx === -1) return null;
    return this.getInclusionProof(idx);
  }

  static verifyInclusionProof(proof: TransparencyInclusionProof): boolean {
    let currentHash = proof.leafHash;
    let idx = proof.logIndex;

    for (const sibling of proof.auditPath) {
      if (idx % 2 === 0) {
        currentHash = hashNode(currentHash, sibling);
      } else {
        currentHash = hashNode(sibling, currentHash);
      }
      idx = Math.floor(idx / 2);
    }

    return currentHash === proof.merkleRoot;
  }

  private _computeMerkleRoot(): string {
    if (this._leafHashes.length === 0) return '';
    if (this._leafHashes.length === 1) return this._leafHashes[0]!;

    let layer = [...this._leafHashes];
    while (layer.length > 1) {
      const nextLayer: string[] = [];
      for (let i = 0; i < layer.length; i += 2) {
        if (i + 1 < layer.length) {
          nextLayer.push(hashNode(layer[i]!, layer[i + 1]!));
        } else {
          nextLayer.push(hashNode(layer[i]!, layer[i]!));
        }
      }
      layer = nextLayer;
    }
    return layer[0]!;
  }

  private _computeAuditPath(index: number): string[] {
    if (this._leafHashes.length <= 1) return [];

    const path: string[] = [];
    let layer = [...this._leafHashes];
    let idx = index;

    while (layer.length > 1) {
      const siblingIdx = idx % 2 === 0 ? idx + 1 : idx - 1;
      if (siblingIdx < layer.length) {
        path.push(layer[siblingIdx]!);
      } else {
        path.push(layer[idx]!);
      }

      const nextLayer: string[] = [];
      for (let i = 0; i < layer.length; i += 2) {
        if (i + 1 < layer.length) {
          nextLayer.push(hashNode(layer[i]!, layer[i + 1]!));
        } else {
          nextLayer.push(hashNode(layer[i]!, layer[i]!));
        }
      }
      layer = nextLayer;
      idx = Math.floor(idx / 2);
    }

    return path;
  }

  restoreEntries(entries: TransparencyLogEntry[]): void {
    const sorted = [...entries].sort((a, b) => a.index - b.index);
    for (const entry of sorted) {
      this._entries.push(entry);
      this._leafHashes.push(entry.leafHash);
    }
    if (this._leafHashes.length > 0) {
      this._merkleRoot = this._computeMerkleRoot();
    }
  }

  getState(): {
    merkleRoot: string;
    treeSize: number;
    latestEntry: TransparencyLogEntry | null;
  } {
    return {
      merkleRoot: this._merkleRoot,
      treeSize: this._entries.length,
      latestEntry: this._entries.length > 0 ? this._entries[this._entries.length - 1]! : null,
    };
  }
}
