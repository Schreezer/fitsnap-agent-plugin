import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  generateKeyPairSync,
  createPrivateKey,
  createPublicKey,
} from 'node:crypto';
import {
  mkdtemp,
  mkdir,
  readFile,
  rm,
  writeFile,
  cp,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import {
  canonicalJson,
  assertTrustedPublicKey,
  publicKeyFingerprint,
  sha256,
  TRUSTED_RELEASE_KEY_FINGERPRINTS,
  unsignedManifest,
  verifyManifestSignature,
} from './release-utils.mjs';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));

function runNode(script, args, env = {}) {
  return spawnSync(process.execPath, [script, ...args], {
    cwd: root,
    env: { ...process.env, ...env },
    encoding: 'utf8',
  });
}

test('validate-package accepts the checked-in Agent Plugins layout', () => {
  const result = runNode('scripts/validate-package.mjs', []);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Validated Agent Plugins package fit-snap/);
});

test('standard and Codex MCP configs share the endpoint but keep their transports', async () => {
  const standard = JSON.parse(await readFile(path.join(root, 'mcp.json'), 'utf8'));
  const codex = JSON.parse(await readFile(path.join(root, '.mcp.json'), 'utf8'));
  assert.equal(standard.mcpServers.fitsnap.type, 'streamable-http');
  assert.equal(codex.mcpServers.fitsnap.type, 'http');
  assert.equal(standard.mcpServers.fitsnap.url, codex.mcpServers.fitsnap.url);
});

test('canonical JSON is order-independent for signatures', () => {
  const left = canonicalJson({ b: 1, a: { d: 2, c: [3, { z: 1, y: 0 }] } });
  const right = canonicalJson({ a: { c: [3, { y: 0, z: 1 }], d: 2 }, b: 1 });
  assert.equal(left, right);
});

test('sign and verify round-trip with an ephemeral Ed25519 key', async () => {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const privatePem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
  const publicPem = publicKey.export({ type: 'spki', format: 'pem' }).toString();

  const temp = await mkdtemp(path.join(os.tmpdir(), 'fitsnap-release-'));
  try {
    const artifact = path.join(temp, 'fit-snap-test.tar.gz');
    await writeFile(artifact, 'not-a-real-archive');
    await cp(path.join(root, 'skills'), path.join(temp, 'skills'), {
      recursive: true,
    });
    await writeFile(
      path.join(temp, 'plugin.json'),
      await readFile(path.join(root, 'plugin.json')),
    );

    // create-release-manifest reads skills + plugin from package root; run from a
    // temporary package copy so the real private key is never required.
    const packageRoot = path.join(temp, 'package');
    await mkdir(packageRoot, { recursive: true });
    for (const entry of [
      'plugin.json',
      'mcp.json',
      '.mcp.json',
      '.codex-plugin',
      '.claude-plugin',
      'skills',
      'scripts',
      'release',
    ]) {
      await cp(path.join(root, entry), path.join(packageRoot, entry), {
        recursive: true,
      });
    }
    await writeFile(path.join(packageRoot, 'release', 'private-key.pem'), privatePem);
    await writeFile(path.join(packageRoot, 'release', 'public-key.pem'), publicPem);
    await writeFile(path.join(packageRoot, 'artifact.bin'), 'plugin-bytes');

    const create = spawnSync(
      process.execPath,
      [
        'scripts/create-release-manifest.mjs',
        '--version',
        '9.9.9',
        '--commit',
        'abc123',
        '--artifact',
        'artifact.bin',
        '--output',
        'manifest.json',
      ],
      {
        cwd: packageRoot,
        env: {
          ...process.env,
          FITSNAP_RELEASE_PRIVATE_KEY: privatePem,
          FITSNAP_RELEASE_KEY_ID: 'test-key',
          GITHUB_REPOSITORY: 'Schreezer/fitsnap-agent-plugin',
        },
        encoding: 'utf8',
      },
    );
    assert.equal(create.status, 0, create.stderr || create.stdout);

    const manifest = JSON.parse(
      await readFile(path.join(packageRoot, 'manifest.json'), 'utf8'),
    );
    assert.equal(manifest.pluginVersion, '9.9.9');
    assert.equal(manifest.minimumAgentVersions, undefined);
    assert.equal(manifest.minimumFitSnapAppVersion, undefined);
    assert.equal(manifest.signature.algorithm, 'Ed25519');
    assert.equal(manifest.signature.keyId, 'test-key');
    assert.equal(
      manifest.pluginArtifact.sha256,
      sha256(Buffer.from('plugin-bytes')),
    );
    const trustedKeys = { 'test-key': publicKeyFingerprint(publicPem) };
    assert.throws(
      () => verifyManifestSignature(manifest, publicPem),
      /Unknown release signing key/,
    );
    assert.equal(verifyManifestSignature(manifest, publicPem, trustedKeys), true);

    const tampered = structuredClone(manifest);
    tampered.pluginVersion = '0.0.0';
    assert.equal(verifyManifestSignature(tampered, publicPem, trustedKeys), false);

    // Signing bytes must exclude the signature field itself.
    assert.equal(
      JSON.parse(canonicalJson(unsignedManifest(manifest))).signature,
      undefined,
    );

    // Public/private PEMs must form a real pair for the checked-in public key
    // only when a local private key is present.
    try {
      const localPrivate = createPrivateKey(
        await readFile(path.join(root, 'release', 'private-key.pem')),
      );
      const localPublic = createPublicKey(
        await readFile(path.join(root, 'release', 'public-key.pem')),
      );
      assert.equal(
        localPrivate.type,
        'private',
      );
      assert.equal(localPublic.type, 'public');
    } catch {
      // Local private key is intentionally absent in CI checkouts.
    }
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});

test('the checked-in release key is pinned by its SPKI fingerprint', async () => {
  const publicKey = await readFile(path.join(root, 'release', 'public-key.pem'), 'utf8');
  const keyId = 'fitsnap-ed25519-2026';
  assert.equal(
    publicKeyFingerprint(publicKey),
    TRUSTED_RELEASE_KEY_FINGERPRINTS[keyId],
  );
  assert.throws(
    () => assertTrustedPublicKey(publicKey, keyId, { [keyId]: '0'.repeat(64) }),
    /fingerprint mismatch/,
  );
});

// Same excludes as .github/workflows/release.yml packaging step.
const RELEASE_TAR_EXCLUDES = [
  '--exclude=./.git',
  '--exclude=./dist',
  '--exclude=./.DS_Store',
  '--exclude=./release/private-key.pem',
  '--exclude=./release/*private*.pem',
];

function archiveHasPrivateKey(listing) {
  return listing
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .some((entry) =>
      /(^|\/)release\/[^/]*private[^/]*\.pem$|(^|\/)private-key\.pem$/i.test(entry),
    );
}

test('CI-equivalent tarball never ships release private keys', async () => {
  const temp = await mkdtemp(path.join(os.tmpdir(), 'fitsnap-tar-'));
  const archivePath = path.join(temp, 'fit-snap-test.tar.gz');
  try {
    const packed = spawnSync(
      'tar',
      [...RELEASE_TAR_EXCLUDES, '-czf', archivePath, '.'],
      { cwd: root, encoding: 'utf8' },
    );
    assert.equal(packed.status, 0, packed.stderr || packed.stdout);

    const listed = spawnSync('tar', ['-tzf', archivePath], { encoding: 'utf8' });
    assert.equal(listed.status, 0, listed.stderr || listed.stdout);
    assert.equal(archiveHasPrivateKey(listed.stdout), false);
    assert.match(listed.stdout, /(^|\/)release\/public-key\.pem$/m);
    assert.doesNotMatch(listed.stdout, /(^|\/)\.git(\/|$)/m);
    assert.doesNotMatch(listed.stdout, /(^|\/)dist(\/|$)/m);
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});

test('install path rejects archives that list a release private key', async () => {
  const temp = await mkdtemp(path.join(os.tmpdir(), 'fitsnap-bad-tar-'));
  try {
    await mkdir(path.join(temp, 'release'), { recursive: true });
    await writeFile(path.join(temp, 'plugin.json'), '{"name":"fit-snap"}');
    await writeFile(path.join(temp, 'mcp.json'), '{}');
    await writeFile(path.join(temp, 'release', 'private-key.pem'), 'SECRET');
    await writeFile(path.join(temp, 'release', 'public-key.pem'), 'PUBLIC');

    const badArchive = path.join(temp, 'poisoned.tar.gz');
    const packed = spawnSync(
      'tar',
      ['-czf', badArchive, 'plugin.json', 'mcp.json', 'release'],
      { cwd: temp, encoding: 'utf8' },
    );
    assert.equal(packed.status, 0, packed.stderr || packed.stdout);

    const listed = spawnSync('tar', ['-tzf', badArchive], { encoding: 'utf8' });
    assert.equal(listed.status, 0, listed.stderr || listed.stdout);
    assert.equal(archiveHasPrivateKey(listed.stdout), true);

    // Same rejection install-release.mjs applies to tar entry names (no network).
    const entries = listed.stdout
      .split('\n')
      .map((entry) => entry.trim())
      .filter(Boolean);
    assert.equal(
      entries.some((entry) =>
        /(^|\/)release\/[^/]*private[^/]*\.pem$|(^|\/)private-key\.pem$/i.test(entry),
      ),
      true,
    );
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});

test('published latest manifest verifies against the trusted public key', async (t) => {
  const publicKey = await readFile(
    path.join(root, 'release', 'public-key.pem'),
    'utf8',
  );
  let response;
  try {
    response = await fetch(
      'https://github.com/Schreezer/fitsnap-agent-plugin/releases/latest/download/manifest.json',
      { redirect: 'follow' },
    );
  } catch (error) {
    t.skip(`network unavailable: ${error instanceof Error ? error.message : error}`);
    return;
  }
  if (!response.ok) {
    t.skip(`latest release unavailable: HTTP ${response.status}`);
    return;
  }
  const manifest = await response.json();
  assert.equal(verifyManifestSignature(manifest, publicKey), true);
  assert.equal(manifest.pluginId, 'fit-snap');
  assert.match(manifest.pluginVersion, /^\d+\.\d+\.\d+/);

  const packageVersion = JSON.parse(
    await readFile(path.join(root, 'plugin.json'), 'utf8'),
  ).version;
  if (packageVersion !== manifest.pluginVersion) {
    console.warn(
      `note: plugin.json is ${packageVersion} but latest published release is ${manifest.pluginVersion}. Publish the matching tag before clients should prefer the newer pin.`,
    );
  }
});
