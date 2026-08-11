# Release metadata

`canonical-manifest.schema.json` defines the signed Fit Snap release manifest.
Each tagged GitHub release contains an immutable plugin archive and a generated
`manifest.json` signed with Ed25519.

`public-key.pem` is the trusted verification key. The private key is never
committed; GitHub Actions reads it from `FITSNAP_RELEASE_PRIVATE_KEY`.

Release commands:

```text
node scripts/create-release-manifest.mjs --version 0.3.0 --commit <sha> --artifact <archive> --output dist/manifest.json
node scripts/verify-release.mjs --manifest dist/manifest.json --public-key release/public-key.pem --artifact <archive>
node scripts/install-release.mjs --manifest https://github.com/Schreezer/fitsnap-agent-plugin/releases/latest/download/manifest.json --target <plugin-dir>
node scripts/install-release.mjs --rollback --target <plugin-dir>
```

The installer verifies the signature and archive checksum before staging, keeps
one previous bundle, and activates the new bundle with a directory rename. Host
clients may use their native update mechanism instead; the standard itself does
not require clients to run this script.
