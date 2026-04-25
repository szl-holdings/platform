import type { ProofPacket } from '../schema';
import { SEED_PROOF_PACKETS } from '../demo/seedProofPackets';

export interface ProofLedgerInterface {
  record(packet: ProofPacket): Promise<ProofPacket>;
  get(id: string): Promise<ProofPacket | undefined>;
  forEntity(entityId: string): Promise<ProofPacket[]>;
  list(): Promise<{ packets: ProofPacket[]; total: number }>;
}

class InMemoryProofLedger implements ProofLedgerInterface {
  private store: Map<string, ProofPacket> = new Map(SEED_PROOF_PACKETS.map(p => [p.id, p]));

  async record(packet: ProofPacket): Promise<ProofPacket> {
    this.store.set(packet.id, packet);
    return packet;
  }

  async get(id: string): Promise<ProofPacket | undefined> {
    return this.store.get(id);
  }

  async forEntity(entityId: string): Promise<ProofPacket[]> {
    return Array.from(this.store.values()).filter(p => p.entityId === entityId);
  }

  async list(): Promise<{ packets: ProofPacket[]; total: number }> {
    const packets = Array.from(this.store.values()).sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
    return { packets, total: packets.length };
  }
}

export const proofLedger: ProofLedgerInterface = new InMemoryProofLedger();
