/**
 * Node-only file-backed receipt storage. Kept in a separate module so the
 * main client can be imported from browser bundles (Vite/Rollup) without
 * pulling in `node:fs` / `node:path`.
 *
 * Import as: `import { JsonlFileStorage } from '@workspace/aef-sdk/node-storage';`
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { LambdaReceipt, ReceiptStorage } from '@szl-holdings/szl-receipts';

export class JsonlFileStorage implements ReceiptStorage {
  constructor(private readonly path: string) {
    mkdirSync(dirname(path), { recursive: true });
  }
  append(receipt: LambdaReceipt): void {
    appendFileSync(this.path, JSON.stringify(receipt) + '\n', 'utf8');
  }
  readAll(): LambdaReceipt[] {
    if (!existsSync(this.path)) return [];
    return readFileSync(this.path, 'utf8')
      .split('\n')
      .filter((l) => l.trim().length > 0)
      .map((l) => JSON.parse(l) as LambdaReceipt);
  }
}
