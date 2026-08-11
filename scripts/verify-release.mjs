import { readFile } from 'node:fs/promises';
import path from 'node:path';

import {
  fetchBytes,
  sha256,
  verifyManifestSignature,
} from './release-utils.mjs';

function option(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? fallback : process.argv[index + 1];
}

const manifestPath = option('manifest');
const publicKeyPath = option('public-key', 'release/public-key.pem');
const artifactPath = option('artifact');
const shouldDownload = process.argv.includes('--download');

if (!manifestPath) throw new Error('--manifest is required.');

const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const publicKey = await readFile(publicKeyPath, 'utf8');
if (!verifyManifestSignature(manifest, publicKey)) {
  throw new Error('Release signature verification failed.');
}

if (artifactPath) {
  const digest = sha256(await readFile(artifactPath));
  if (digest !== manifest.pluginArtifact.sha256) {
    throw new Error('Local plugin artifact checksum does not match the manifest.');
  }
}

if (shouldDownload) {
  const artifact = await fetchBytes(manifest.pluginArtifact.url);
  if (sha256(artifact) !== manifest.pluginArtifact.sha256) {
    throw new Error('Downloaded plugin artifact checksum does not match the manifest.');
  }

  for (const [name, entry] of Object.entries(manifest.skills)) {
    const skill = await fetchBytes(entry.url);
    if (sha256(skill) !== entry.sha256) {
      throw new Error(`Skill checksum does not match the manifest: ${name}`);
    }
  }
}

console.log(`Verified Fit Snap release ${manifest.pluginVersion}.`);
