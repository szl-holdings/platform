import type { KeyLike } from 'node:crypto';
import { digestObject } from './canonical.js';
import { signDigest, verifyDigest } from './crypto.js';
import { StateNativeError } from './errors.js';
import type {
  KernelExecutionReceipt,
  KernelReceiptUnsigned,
  ReceiptSigner,
} from './types.js';

export function createKernelExecutionReceipt(
  unsigned: KernelReceiptUnsigned,
  signer: ReceiptSigner,
): KernelExecutionReceipt {
  const receiptDigest = digestObject(unsigned);
  return Object.freeze({
    ...unsigned,
    receiptDigest,
    signature: Object.freeze({
      algorithm: 'Ed25519',
      keyId: signer.keyId,
      value: signDigest(signer.privateKey, receiptDigest),
    }),
  });
}

export function verifyKernelExecutionReceipt(
  receipt: KernelExecutionReceipt,
  publicKey: KeyLike,
): boolean {
  const { receiptDigest, signature, ...unsigned } = receipt;
  const expectedDigest = digestObject(unsigned);
  if (expectedDigest !== receiptDigest) {
    return false;
  }
  return signature.algorithm === 'Ed25519' && verifyDigest(publicKey, receiptDigest, signature.value);
}

export function assertKernelExecutionReceipt(
  receipt: KernelExecutionReceipt,
  publicKey: KeyLike,
): void {
  if (!verifyKernelExecutionReceipt(receipt, publicKey)) {
    throw new StateNativeError('SIGNATURE_INVALID', 'Kernel execution receipt verification failed.', {
      receiptId: receipt.receiptId,
    });
  }
}
