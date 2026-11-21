import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createPrivateKey, sign } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  canonicalJson,
  sha256File,
  unsignedManifest,
} from './release-utils.mjs';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));

function option(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? fallback : process.argv[index + 1];
}

const plugin = JSON.parse(await readFile(path.join(root, 'plugin.json'), 'utf8'));
const version = option('version', plugin.version);
const repository = option(
  'repository',
  process.env.GITHUB_REPOSITORY || 'Schreezer/fitsnap-agent-plugin',
);
const commit = option('commit', process.env.GITHUB_SHA);
const artifactPath = option('artifact');
const outputPath = option('output', path.join(root, 'dist', 'manifest.json'));
const privateKeyPem = process.env.FITSNAP_RELEASE_PRIVATE_KEY;

if (!commit) throw new Error('A release commit is required with --commit.');
if (!artifactPath) throw new Error('A plugin archive is required with --artifact.');
if (!privateKeyPem) {
  throw new Error('FITSNAP_RELEASE_PRIVATE_KEY is required to sign a release.');
}

const rawBase = `https://raw.githubusercontent.com/${repository}/${commit}`;
const releaseBase = `https://github.com/${repository}/releases/download/v${version}`;
// Every skill shipped in skills/ gets a pinned URL and checksum.
const skillNames = (await readdir(path.join(root, 'skills'), { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();
const skills = {};

for (const name of skillNames) {
  const skillPath = path.join(root, 'skills', name, 'SKILL.md');
  skills[name] = {
    url: `${rawBase}/skills/${name}/SKILL.md`,
    sha256: await sha256File(skillPath),
  };
}

const manifest = {
  pluginId: 'fit-snap',
  pluginVersion: version,
  skillsVersion: version,
  skills,
  pluginArtifact: {
    url: `${releaseBase}/fit-snap-${version}.tar.gz`,
    sha256: await sha256File(artifactPath),
  },
  mcpContractVersion: '1',
  capabilityVersion: '1',
  releaseChannel: 'stable',
  updateUrl: `https://github.com/${repository}/releases/latest/download/manifest.json`,
  // The bundled endpoint is read-only; logging is a separate, opt-in connection.
  requestedScopes: ['read'],
  signature: {
    algorithm: 'Ed25519',
    keyId: process.env.FITSNAP_RELEASE_KEY_ID || 'fitsnap-ed25519-2026',
    value: '',
  },
};

manifest.signature.value = sign(
  null,
  Buffer.from(canonicalJson(unsignedManifest(manifest))),
  createPrivateKey(privateKeyPem),
).toString('base64');

await writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Signed ${outputPath}`);
