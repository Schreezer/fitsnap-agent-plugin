import { createHash, createPublicKey, verify } from 'node:crypto';
import { readFile } from 'node:fs/promises';

export const TRUSTED_RELEASE_KEY_FINGERPRINTS = Object.freeze({
  'fitsnap-ed25519-2026':
    'c0511c6be8712a6c529b20ac2f014f8af5747663ddb7f7746cd0e68b50f7720e',
});

export function sortForCanonicalJson(value) {
  if (Array.isArray(value)) {
    return value.map(sortForCanonicalJson);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, sortForCanonicalJson(value[key])]),
    );
  }
  return value;
}

export function canonicalJson(value) {
  return JSON.stringify(sortForCanonicalJson(value));
}

export function unsignedManifest(manifest) {
  const { signature: _signature, ...unsigned } = manifest;
  return unsigned;
}

export function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

export async function sha256File(path) {
  return sha256(await readFile(path));
}

export function publicKeyFingerprint(publicKeyPem) {
  return createHash('sha256')
    .update(createPublicKey(publicKeyPem).export({ type: 'spki', format: 'der' }))
    .digest('hex');
}

export function assertTrustedPublicKey(
  publicKeyPem,
  keyId,
  trustedKeys = TRUSTED_RELEASE_KEY_FINGERPRINTS,
) {
  const expected = trustedKeys[keyId];
  if (!expected) {
    throw new Error(`Unknown release signing key: ${keyId}`);
  }
  if (publicKeyFingerprint(publicKeyPem) !== expected) {
    throw new Error(`Release signing key fingerprint mismatch for ${keyId}.`);
  }
}

export function validateManifest(manifest) {
  if (!manifest || typeof manifest !== 'object') {
    throw new Error('Release manifest must be an object.');
  }
  if (manifest.pluginId !== 'fit-snap') {
    throw new Error('Release manifest pluginId must be fit-snap.');
  }
  if (!manifest.pluginVersion || !manifest.skillsVersion) {
    throw new Error('Release manifest is missing a plugin or skills version.');
  }
  if (!manifest.skills || typeof manifest.skills !== 'object') {
    throw new Error('Release manifest must include skills.');
  }
  if (!manifest.pluginArtifact || typeof manifest.pluginArtifact !== 'object') {
    throw new Error('Release manifest must include a plugin artifact.');
  }
  if (manifest.signature?.algorithm !== 'Ed25519') {
    throw new Error('Release manifest must use an Ed25519 signature.');
  }
  if (!manifest.signature?.keyId || !manifest.signature?.value) {
    throw new Error('Release manifest signature is incomplete.');
  }
}

export function verifyManifestSignature(
  manifest,
  publicKeyPem,
  trustedKeys = TRUSTED_RELEASE_KEY_FINGERPRINTS,
) {
  validateManifest(manifest);
  assertTrustedPublicKey(publicKeyPem, manifest.signature.keyId, trustedKeys);
  return verify(
    null,
    Buffer.from(canonicalJson(unsignedManifest(manifest))),
    publicKeyPem,
    Buffer.from(manifest.signature.value, 'base64'),
  );
}

export async function fetchBytes(url) {
  if (!url.startsWith('https://')) {
    throw new Error(`Release URL must use HTTPS: ${url}`);
  }
  const response = await fetch(url, { redirect: 'follow' });
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: HTTP ${response.status}`);
  }
  const finalUrl = new URL(response.url);
  if (finalUrl.protocol !== 'https:' || finalUrl.username || finalUrl.password) {
    throw new Error(`Release download redirected to an unsafe URL: ${response.url}`);
  }
  return Buffer.from(await response.arrayBuffer());
}
