import { ed25519 } from '@noble/curves/ed25519.js';
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';
import type { SigningMode, HybridSignature, HybridKeyPair, SignatureVerdict } from './types.js';

export class HybridSigner {
  private readonly _ed25519PrivateKey: Uint8Array;
  private readonly _ed25519PublicKey: Uint8Array;
  private readonly _mldsaPrivateKey: Uint8Array;
  private readonly _mldsaPublicKey: Uint8Array;
  private readonly _mode: SigningMode;

  constructor(opts: {
    ed25519PrivateKey: Uint8Array;
    ed25519PublicKey: Uint8Array;
    mldsaPrivateKey: Uint8Array;
    mldsaPublicKey: Uint8Array;
    mode?: SigningMode;
  }) {
    this._ed25519PrivateKey = opts.ed25519PrivateKey;
    this._ed25519PublicKey = opts.ed25519PublicKey;
    this._mldsaPrivateKey = opts.mldsaPrivateKey;
    this._mldsaPublicKey = opts.mldsaPublicKey;
    this._mode = opts.mode ?? 'hybrid';
  }

  get mode(): SigningMode {
    return this._mode;
  }

  get publicKeys(): { ed25519: string; mldsa65: string } {
    return {
      ed25519: bytesToHex(this._ed25519PublicKey),
      mldsa65: bytesToHex(this._mldsaPublicKey),
    };
  }

  get ed25519PublicKeyBytes(): Uint8Array {
    return this._ed25519PublicKey;
  }

  get mldsaPublicKeyBytes(): Uint8Array {
    return this._mldsaPublicKey;
  }

  sign(message: Uint8Array): HybridSignature {
    const ed25519Sig = this._mode !== 'pqc-only'
      ? bytesToHex(ed25519.sign(message, this._ed25519PrivateKey))
      : undefined;

    const mldsa65Sig = this._mode !== 'classical-only'
      ? bytesToHex(ml_dsa65.sign(this._mldsaPrivateKey, message))
      : undefined;

    return {
      alg: 'hybrid-v1',
      ed25519: ed25519Sig,
      mldsa65: mldsa65Sig,
      mode: this._mode,
      publicKeys: this.publicKeys,
    };
  }

  signString(message: string): HybridSignature {
    return this.sign(new TextEncoder().encode(message));
  }

  static verify(
    message: Uint8Array,
    signature: HybridSignature,
    minimumSecurityLevel: SigningMode = 'classical-only',
  ): SignatureVerdict {
    const verdict: SignatureVerdict = {
      valid: false,
      ed25519Valid: null,
      mldsa65Valid: null,
      mode: signature.mode ?? 'hybrid',
      minimumMet: false,
    };

    if (signature.ed25519 && signature.publicKeys?.ed25519) {
      try {
        const sigBytes = hexToBytes(signature.ed25519);
        const pubBytes = hexToBytes(signature.publicKeys.ed25519);
        verdict.ed25519Valid = ed25519.verify(sigBytes, message, pubBytes);
      } catch {
        verdict.ed25519Valid = false;
      }
    }

    if (signature.mldsa65 && signature.publicKeys?.mldsa65) {
      try {
        const sigBytes = hexToBytes(signature.mldsa65);
        const pubBytes = hexToBytes(signature.publicKeys.mldsa65);
        verdict.mldsa65Valid = ml_dsa65.verify(pubBytes, message, sigBytes);
      } catch {
        verdict.mldsa65Valid = false;
      }
    }

    if (minimumSecurityLevel === 'hybrid') {
      verdict.minimumMet = verdict.ed25519Valid === true && verdict.mldsa65Valid === true;
    } else if (minimumSecurityLevel === 'pqc-only') {
      verdict.minimumMet = verdict.mldsa65Valid === true;
    } else {
      verdict.minimumMet = verdict.ed25519Valid === true;
    }

    verdict.valid = verdict.minimumMet;
    return verdict;
  }

  static verifyString(
    message: string,
    signature: HybridSignature,
    minimumSecurityLevel: SigningMode = 'classical-only',
  ): SignatureVerdict {
    return HybridSigner.verify(
      new TextEncoder().encode(message),
      signature,
      minimumSecurityLevel,
    );
  }
}

export function generateHybridKeyPair(): HybridKeyPair {
  const ed25519Priv = ed25519.utils.randomSecretKey();
  const ed25519Pub = ed25519.getPublicKey(ed25519Priv);

  const mldsaSeed = ed25519.utils.randomSecretKey();
  const expandedSeed = sha256(mldsaSeed);
  const mldsaKeys = ml_dsa65.keygen(expandedSeed);

  return {
    ed25519: { privateKey: ed25519Priv, publicKey: ed25519Pub },
    mldsa65: { privateKey: mldsaKeys.secretKey, publicKey: mldsaKeys.publicKey },
  };
}

export function createHybridSigner(
  keyPair: HybridKeyPair,
  mode: SigningMode = 'hybrid',
): HybridSigner {
  return new HybridSigner({
    ed25519PrivateKey: keyPair.ed25519.privateKey,
    ed25519PublicKey: keyPair.ed25519.publicKey,
    mldsaPrivateKey: keyPair.mldsa65.privateKey,
    mldsaPublicKey: keyPair.mldsa65.publicKey,
    mode,
  });
}

export function computeContentHash(content: string): string {
  return bytesToHex(sha256(new TextEncoder().encode(content)));
}

export function computeBytesHash(data: Uint8Array): string {
  return bytesToHex(sha256(data));
}
