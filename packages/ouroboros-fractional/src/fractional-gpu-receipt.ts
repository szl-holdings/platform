/**
 * Primitive 77 — Fractional-GPU receipt
 *
 * Inspired by Google Cloud GTC 2026: A4X VMs with GB200/GB300 NVL72,
 * vGPU partitioning at 1/8, 1/4, 1/2 of a physical GPU. The lift:
 * elastic compute is only honest if every fraction is receipted.
 * Without a receipt the same slice gets double-billed and noisy
 * neighbors steal SLAs.
 *
 * The receipt records: which physical device, which fraction, which
 * tenant, when allocated, when released. The allocator refuses any
 * total > 1.0 per device.
 */

export type FractionDenominator = 1 | 2 | 4 | 8;

export interface FractionalRequest {
  tenantId: string;
  deviceId: string;
  fraction: number; // (0,1] — typically 1, 1/2, 1/4, or 1/8
  startedAt: string;
}

export interface FractionalReceipt {
  tenantId: string;
  deviceId: string;
  fraction: number;
  startedAt: string;
  releasedAt?: string;
}

export class FractionalAllocator {
  private receipts: FractionalReceipt[] = [];

  allocate(req: FractionalRequest): FractionalReceipt {
    if (req.fraction <= 0 || req.fraction > 1) {
      throw new Error(`invalid fraction ${req.fraction} — must be (0,1]`);
    }
    const used = this.receipts
      .filter((r) => r.deviceId === req.deviceId && !r.releasedAt)
      .reduce((s, r) => s + r.fraction, 0);
    if (used + req.fraction > 1 + 1e-9) {
      throw new Error(`device ${req.deviceId} oversubscribed: ${used} + ${req.fraction} > 1`);
    }
    const receipt: FractionalReceipt = {
      tenantId: req.tenantId,
      deviceId: req.deviceId,
      fraction: req.fraction,
      startedAt: req.startedAt,
    };
    this.receipts.push(receipt);
    return receipt;
  }

  release(deviceId: string, tenantId: string, releasedAt: string): boolean {
    for (const r of this.receipts) {
      if (r.deviceId === deviceId && r.tenantId === tenantId && !r.releasedAt) {
        r.releasedAt = releasedAt;
        return true;
      }
    }
    return false;
  }

  active(): FractionalReceipt[] {
    return this.receipts.filter((r) => !r.releasedAt);
  }

  utilization(deviceId: string): number {
    return this.active()
      .filter((r) => r.deviceId === deviceId)
      .reduce((s, r) => s + r.fraction, 0);
  }

  ledger(): FractionalReceipt[] {
    return [...this.receipts];
  }
}
