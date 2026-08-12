# Release metadata

`canonical-manifest.schema.json` defines the signed Fit Snap release manifest.
Each tagged GitHub release contains an immutable plugin archive and a generated
`manifest.json` signed with Ed25519.

`public-key.pem` is the trusted verification key. Verifiers also pin its
SubjectPublicKeyInfo (SPKI) SHA-256 fingerprint:

```text
keyId: fitsnap-ed25519-2026
fingerprint: c0511c6be8712a6c529b20ac2f014f8af5747663ddb7f7746cd0e68b50f7720e
```

The private key is never committed; GitHub Actions reads it from
`FITSNAP_RELEASE_PRIVATE_KEY`.

Release commands:

```text
node scripts/create-release-manifest.mjs --version <version> --commit <sha> --artifact <archive> --output dist/manifest.json
node scripts/verify-release.mjs --manifest dist/manifest.json --public-key release/public-key.pem --artifact <archive>
node scripts/install-release.mjs --manifest https://github.com/Schreezer/fitsnap-agent-plugin/releases/latest/download/manifest.json --target <plugin-dir>
node scripts/install-release.mjs --rollback --target <plugin-dir>
```

The installer verifies the signature and archive checksum before staging, keeps
one previous bundle, and activates the new bundle with a directory rename. Host
clients may use their native update mechanism instead; the standard itself does
not require clients to run this script.

## Key rotation

Never replace the fingerprint for an existing `keyId`. To rotate keys:

1. Generate a new Ed25519 key pair and record the new SPKI SHA-256 fingerprint.
2. Add the new `keyId` and fingerprint to
   `scripts/release-utils.mjs`, while retaining the old entry. Keep the old
   `release/public-key.pem` for this transition release.
3. Publish a verifier release signed by the old key so existing installers
   receive the new trusted-key map.
4. Replace `release/public-key.pem`, update `FITSNAP_RELEASE_PRIVATE_KEY`,
   `FITSNAP_RELEASE_KEY_ID`, and the workflow, then sign subsequent releases
   with the new key.
5. Remove the old key only after all supported verifiers have migrated.
