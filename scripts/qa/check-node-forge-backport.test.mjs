import assert from 'node:assert/strict';
import {
  constants,
  createHash,
  generateKeyPairSync,
  privateEncrypt,
  sign,
  verify,
  X509Certificate,
} from 'node:crypto';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import test from 'node:test';
import {
  assertForgeBytes,
  assertPatchBinding,
  loadConsumerPackages,
  provenance,
} from './check-node-forge-backport.mjs';

const { forge, certificates, scope } = loadConsumerPackages();
if (process.env.CI) {
  assert.ok(
    process.env.NODE_FORGE_BACKPORT_PRISTINE_ROOT,
    'CI requires the hash-verified pristine control',
  );
}
const ownedKeys = generateKeyPairSync('rsa', { modulusLength: 2048 });
const privatePEM = ownedKeys.privateKey.export({ type: 'pkcs1', format: 'pem' });
const publicPEM = ownedKeys.publicKey.export({ type: 'spki', format: 'pem' });
const forgePublic = forge.pki.publicKeyFromPem(publicPEM);
const message = Buffer.from([0, 0x80, 0xff, 0x53, 0x5a, 0x4c]);

// Independent small DER encoder. Only these fixed owned-key fixtures use it.
function tlv(tag, value) {
  assert.ok(value.length < 128);
  return Buffer.concat([Buffer.from([tag, value.length]), value]);
}
function sequence(values) {
  return tlv(0x30, Buffer.concat(values));
}
const sha256OID = tlv(0x06, Buffer.from('608648016503040201', 'hex'));
const sha1OID = tlv(0x06, Buffer.from('2b0e03021a', 'hex'));
const nullParameter = tlv(0x05, Buffer.alloc(0));

function ownedDigestSignature(children, hash = 'sha256') {
  const digest = createHash(hash).update(message).digest();
  const info = sequence([sequence(children), tlv(0x04, digest)]);
  const paddingLength = 256 - info.length - 3;
  assert.ok(paddingLength >= 8);
  const block = Buffer.concat([
    Buffer.from([0, 1]),
    Buffer.alloc(paddingLength, 0xff),
    Buffer.from([0]),
    info,
  ]);
  return {
    digest,
    signature: privateEncrypt(
      { key: ownedKeys.privateKey, padding: constants.RSA_NO_PADDING },
      block,
    ),
  };
}

test(`patch and exact consumer bytes: ${scope}`, () => {
  assertPatchBinding();
});

test('byte guard rejects a supplied incorrect hash', () => {
  const packages = loadConsumerPackages();
  assert.throws(() => assertForgeBytes(packages.forgeRoot, '0'.repeat(64)), /pinned source/);
});

for (const algorithm of ['sha256', 'sha1']) {
  test(`native ${algorithm} signature verifies in native crypto and Forge`, () => {
    const signature = sign(algorithm, message, ownedKeys.privateKey);
    const digest = createHash(algorithm).update(message).digest('binary');
    assert.ok(verify(algorithm, message, ownedKeys.publicKey, signature));
    assert.ok(forgePublic.verify(digest, signature.toString('binary')));
    assert.equal(verify(algorithm, Buffer.from('changed'), ownedKeys.publicKey, signature), false);
    assert.equal(
      forgePublic.verify(
        createHash(algorithm).update('changed').digest('binary'),
        signature.toString('binary'),
      ),
      false,
    );
  });
}

test('Forge SHA-256 signature verifies with independent native crypto', () => {
  const signature = forge.pki
    .privateKeyFromPem(privatePEM)
    .sign(forge.md.sha256.create().update(message.toString('binary')));
  assert.ok(verify('sha256', message, ownedKeys.publicKey, Buffer.from(signature, 'binary')));
});

const malformedAlgorithms = [
  ['extra octet after NULL', [sha256OID, nullParameter, tlv(0x04, Buffer.from('extra'))]],
  ['extra NULL', [sha256OID, nullParameter, nullParameter]],
  ['unexpected parameter without NULL', [sha256OID, tlv(0x04, Buffer.from('extra'))]],
];
for (const [label, children] of malformedAlgorithms) {
  test(`nested algorithm rejects ${label}, outer DigestInfo still has two children`, () => {
    const { digest, signature } = ownedDigestSignature(children);
    assert.equal(verify('sha256', message, ownedKeys.publicKey, signature), false);
    assert.throws(
      () => forgePublic.verify(digest.toString('binary'), signature.toString('binary')),
      /valid RSASSA-PKCS1-v1_5 DigestInfo/,
    );
  });
}

for (const [algorithm, oid] of [
  ['sha256', sha256OID],
  ['sha1', sha1OID],
]) {
  test(`${algorithm} retains optional NULL compatibility`, () => {
    for (const children of [[oid], [oid, nullParameter]]) {
      const { digest, signature } = ownedDigestSignature(children, algorithm);
      assert.ok(forgePublic.verify(digest.toString('binary'), signature.toString('binary')));
    }
  });
}

test('pristine package control accepts the same three malformed structures', {
  skip: !process.env.NODE_FORGE_BACKPORT_PRISTINE_ROOT,
}, () => {
  const pristineRoot = process.env.NODE_FORGE_BACKPORT_PRISTINE_ROOT;
  assertForgeBytes(pristineRoot, provenance.node_forge.pristine_rsa_sha256);
  const pristine = createRequire(join(pristineRoot, 'package.json'))('./lib/index.js');
  const pristinePublic = pristine.pki.publicKeyFromPem(publicPEM);
  for (const [, children] of malformedAlgorithms) {
    const { digest, signature } = ownedDigestSignature(children);
    assert.ok(pristinePublic.verify(digest.toString('binary'), signature.toString('binary')));
  }
});

test('Expo certificate and binary signature interoperate with native crypto', () => {
  const keys = certificates.convertKeyPairPEMToKeyPair({
    privateKeyPEM: privatePEM,
    publicKeyPEM: publicPEM,
  });
  const certificate = certificates.generateSelfSignedCodeSigningCertificate({
    keyPair: keys,
    validityNotBefore: new Date(Date.now() - 60_000),
    validityNotAfter: new Date(Date.now() + 3_600_000),
    commonName: 'SZL owned regression fixture',
  });
  const pem = certificates.convertCertificateToCertificatePEM(certificate);
  const parsed = certificates.convertCertificatePEMToCertificate(pem);
  certificates.validateSelfSignedCertificate(parsed, keys);
  const native = new X509Certificate(pem);
  assert.ok(native.verify(ownedKeys.publicKey));
  assert.ok(native.checkPrivateKey(ownedKeys.privateKey));
  const signed = Buffer.from(
    certificates.signBufferRSASHA256AndVerify(keys.privateKey, parsed, message),
    'base64',
  );
  assert.ok(verify('sha256', message, native.publicKey, signed));
  assert.equal(verify('sha256', Buffer.from('changed'), native.publicKey, signed), false);
  const other = generateKeyPairSync('rsa', { modulusLength: 2048 });
  assert.throws(() =>
    certificates.validateSelfSignedCertificate(parsed, {
      publicKey: keys.publicKey,
      privateKey: forge.pki.privateKeyFromPem(
        other.privateKey.export({ type: 'pkcs1', format: 'pem' }),
      ),
    }),
  );
});

test('Expo CSR and development certificate retain native signature verification', () => {
  const keys = certificates.convertKeyPairPEMToKeyPair({
    privateKeyPEM: privatePEM,
    publicKeyPEM: publicPEM,
  });
  const csr = certificates.convertCSRPEMToCSR(
    certificates.convertCSRToCSRPEM(certificates.generateCSR(keys, 'SZL owned CSR fixture')),
  );
  assert.ok(csr.verify());
  const requestInfo = forge.asn1
    .toDer(forge.pki.certificationRequestToAsn1(csr).value[0])
    .getBytes();
  assert.ok(
    verify(
      'sha256',
      Buffer.from(requestInfo, 'binary'),
      ownedKeys.publicKey,
      Buffer.from(csr.signature, 'binary'),
    ),
  );
  const issuer = certificates.generateSelfSignedCodeSigningCertificate({
    keyPair: keys,
    validityNotBefore: new Date(Date.now() - 60_000),
    validityNotAfter: new Date(Date.now() + 3_600_000),
    commonName: 'SZL owned issuer fixture',
  });
  const issued = certificates.generateDevelopmentCertificateFromCSR(
    keys.privateKey,
    issuer,
    csr,
    'owned-fixture-app',
    'owned-fixture-scope',
  );
  assert.ok(
    new X509Certificate(certificates.convertCertificateToCertificatePEM(issued)).verify(
      ownedKeys.publicKey,
    ),
  );
  const projectExtension = issued.getExtension({ id: certificates.expoProjectInformationOID });
  assert.equal(projectExtension.value, 'owned-fixture-app,owned-fixture-scope');
  csr.signature = String.fromCharCode(csr.signature.charCodeAt(0) ^ 1) + csr.signature.slice(1);
  assert.throws(() =>
    certificates.generateDevelopmentCertificateFromCSR(
      keys.privateKey,
      issuer,
      csr,
      'owned-fixture-app',
      'owned-fixture-scope',
    ),
  );
});
