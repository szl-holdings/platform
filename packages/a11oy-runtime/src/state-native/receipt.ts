import type { KeyLike } from 'node:crypto';
import { digestObject } from './canonical.js';
import { signDigest, verifyDigest } from './crypto.js';
import { StateNativeError } from './errors.js';
import type {
  KernelExecutionReceipt,
  KernelReceiptUnsigned,
  ReceiptSigner,
} from './types.js';

function snapshotUnsignedReceipt(unsigned: KernelReceiptUnsigned): KernelReceiptUnsigned {
  return Object.freeze({
    ...unsigned,
    inputCapsuleIds: Object.freeze([...unsigned.inputCapsuleIds]),
    inputDigests: Object.freeze([...unsigned.inputDigests]),
    outputCapsuleIds: Object.freeze([...unsigned.outputCapsuleIds]),
    outputDigests: Object.freeze([...unsigned.outputDigests]),
    verifier: unsigned.verifier
      ? Object.freeze({
          ...unsigned.verifier,
          evidenceDigests: Object.freeze([...unsigned.verifier.evidenceDigests]),
        })
      : undefined,
    budget: Object.freeze({ ...unsigned.budget }),
  });
}

export function createKernelExecutionReceipt(
  unsigned: KernelReceiptUnsigned,
  signer: ReceiptSigner,
): KernelExecutionReceipt {
  const snapshot = snapshotUnsignedReceipt(unsigned);
  const receiptDigest = digestObject(snapshot);
  return Object.freeze({
    ...snapshot,
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
