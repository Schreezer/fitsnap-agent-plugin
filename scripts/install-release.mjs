import { execFileSync } from 'node:child_process';
import { lstat, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  fetchBytes,
  sha256,
  verifyManifestSignature,
} from './release-utils.mjs';

function option(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? fallback : process.argv[index + 1];
}

const target = path.resolve(option('target', 'fit-snap'));
const manifestInput = option('manifest');
const publicKeyPath = option(
  'public-key',
  path.resolve(fileURLToPath(new URL('../release/public-key.pem', import.meta.url))),
);
const previous = `${target}.previous`;

if (!manifestInput) throw new Error('--manifest is required.');

if (process.argv.includes('--rollback')) {
  await lstat(previous).catch(() => {
    throw new Error(`No rollback bundle exists at ${previous}.`);
  });
  const temporary = `${target}.rollback-${process.pid}`;
  await rename(target, temporary).catch(() => undefined);
  await rename(previous, target);
  await rm(previous, { recursive: true, force: true });
  await rename(temporary, previous).catch(() => undefined);
  console.log(`Rolled back ${target}.`);
  process.exit(0);
}

const manifest = manifestInput.startsWith('https://')
  ? JSON.parse((await fetchBytes(manifestInput)).toString('utf8'))
  : JSON.parse(await readFile(manifestInput, 'utf8'));
const publicKey = await readFile(publicKeyPath, 'utf8');
if (!verifyManifestSignature(manifest, publicKey)) {
  throw new Error('Release signature verification failed.');
}

const archive = await fetchBytes(manifest.pluginArtifact.url);
if (sha256(archive) !== manifest.pluginArtifact.sha256) {
  throw new Error('Plugin artifact checksum does not match the manifest.');
}

const parent = path.dirname(target);
const staging = await mkdtemp(path.join(parent, '.fit-snap-staging-'));
const archivePath = path.join(staging, 'plugin.tar.gz');
await writeFile(archivePath, archive);

try {
  const entries = execFileSync('tar', ['-tzf', archivePath], { encoding: 'utf8' })
    .split('\n')
    .map((entry) => entry.trim())
    .filter(Boolean);
  if (entries.some((entry) => entry.startsWith('/') || entry.split('/').includes('..'))) {
    throw new Error('Plugin archive contains an unsafe path.');
  }

  execFileSync('tar', ['-xzf', archivePath, '-C', staging]);
  await lstat(path.join(staging, 'plugin.json'));
  await lstat(path.join(staging, 'mcp.json'));
  await rm(archivePath);
  await rm(previous, { recursive: true, force: true });
  await rename(target, previous).catch(() => undefined);
  await rename(staging, target);
  console.log(`Installed Fit Snap release ${manifest.pluginVersion} at ${target}.`);
} catch (error) {
  await rm(staging, { recursive: true, force: true });
  throw error;
}
