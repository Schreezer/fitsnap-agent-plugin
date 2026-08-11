# Fit Snap plugin portability and update contract

Status: implemented release contract. Version `0.3.0` is the first Agent
Plugins v1 package with signed GitHub release artifacts and a reference
verification/activation script.

## Product boundary

This protocol distributes **Fit Snap inside an existing agent**. The host agent
keeps responsibility for inference, context, model billing, and execution.
Routing Fit Snap's own in-app AI through a personal agent is a separate,
future-only product and is outside this protocol.

## Canonical release

Each release is immutable and lives in the public versioned Fit Snap plugin
repository. A release contains:

- the OpenAI plugin package;
- canonical skill artifacts;
- thin host adapters;
- one signed release manifest;
- an Ed25519 signature plus checksum metadata;
- the trusted public verification key.

The signed manifest contains:

```json
{
  "pluginId": "fit-snap",
  "pluginVersion": "0.3.0",
  "skillsVersion": "0.3.0",
  "skills": {
    "food-logging": { "url": "https://.../skills/food-logging/SKILL.md", "sha256": "..." },
    "workout-logging": { "url": "https://.../skills/workout-logging/SKILL.md", "sha256": "..." },
    "body-profile-and-recovery": { "url": "https://.../skills/body-profile-and-recovery/SKILL.md", "sha256": "..." }
  },
  "pluginArtifact": {
    "url": "https://.../fit-snap-0.3.0.tar.gz",
    "sha256": "..."
  },
  "mcpContractVersion": "1",
  "capabilityVersion": "1",
  "minimumAgentVersions": {
    "codex": "...",
    "chatgpt": "...",
    "hermes": "...",
    "poke": "..."
  },
  "minimumFitSnapAppVersion": "...",
  "releaseChannel": "stable",
  "updateUrl": "https://.../manifest.json",
  "requestedScopes": ["read", "write"],
  "signature": { "algorithm": "...", "keyId": "...", "value": "..." }
}
```

The normative field boundary is also captured in
[`release/canonical-manifest.schema.json`](release/canonical-manifest.schema.json).
The release workflow computes content hashes and signs the canonical bytes. The
reference installer fails closed on an absent/invalid signature, hash mismatch,
unsafe archive path, or failed staging. No credentials or bearer tokens are
release artifacts.

## MCP contract evolution

The stable remote MCP URL is expected to evolve server-side without a plugin
reinstall for additive, backward-compatible capabilities.

- Capability discovery exposes the active contract/capability version.
- Existing tool names and schemas preserve their semantics.
- Deprecations publish replacement guidance and an explicit support window.
- Breaking behavior uses a new tool/contract version; it never silently changes
  the meaning of an installed mutation workflow.
- Scope additions and destructive capabilities require approval and OAuth
  reauthorization.

Skill/manifest changes and breaking contract support ship as a new semantic
plugin release.

## Adapter update transaction

Where a host supports an updater, the thin adapter or reference installer:

1. Fetches the signed manifest over HTTPS.
2. Verifies the manifest signature, release compatibility, and
   requested scopes.
3. Downloads the immutable plugin artifact.
4. Verifies its SHA-256 checksum and stages the complete candidate bundle.
5. Requires explicit user approval for new scopes, destructive capabilities,
   or materially changed mutation behavior. Safe guidance-only updates may be
   configured to auto-activate.
6. Atomically swaps the complete bundle and retains the last known-good bundle
   for rollback.
7. Pins plugin, skill, and MCP contract versions when a run starts. The pin
   remains fixed through a meal/workout logging sequence; a new release applies
   only to subsequent runs.

Failed/offline checks continue with the last known-good compatible bundle.
Signature/checksum/compatibility failures never partially activate. Hosts show
installed version, channel, last check, update/error state, and last-known-good
version, with **Check for updates** and **Repair** actions.

## Distribution-specific update behavior

- **OpenAI public directory:** publish/review a new plugin version through the
  universal directory. Do not add a parallel background Git poller.
- **OpenAI private/repo marketplace:** use a Git-backed marketplace entry pinned
  by `ref` or `sha`; users explicitly run `codex plugin marketplace upgrade`.
  npm sources may use a version/range and install without lifecycle scripts.
- **Local OpenAI marketplace:** update the referenced directory and restart the
  desktop app so the cached local package is refreshed.
- **Hermes:** publish a thin Hermes plugin/tap backed by the canonical Git
  repository. Hermes can check and update provenance-tracked skills and GitHub
  plugins with its native commands. A future installer may optionally schedule
  a nightly **check and notify** job. It must not silently apply every release.
  Safe patch/minor guidance updates may be opt-in only after signature/hash
  verification, staging, validation, atomic activation, and last-known-good
  rollback. Major versions, scope additions, destructive capabilities, MCP
  endpoint/auth changes, and mutation-policy changes require explicit approval
  and reauthorization. Updated content activates for a new session; `/reset` or
  `--now` may deliberately invalidate Hermes' current prompt cache.
- **Poke:** publish a Recipe requiring the stable remote MCP integration. Poke
  periodically re-syncs the remote tool catalog and supports a manual re-sync,
  so additive server-side schema/description changes do not require re-adding
  the integration. Published Recipe edits currently apply to new sign-ups, not
  existing users, and Poke does not document a general local `SKILL.md` updater.
  A future scheduled Poke automation may call only a read-only Fit Snap
  update-status MCP tool and notify the user; it cannot install shell cron or
  rewrite local skills. That MCP status tool is not implemented today.

Safety-critical validation and mutation policy remain enforced by the Fit Snap
MCP server regardless of the age of client guidance.

## Scheduled checks

A skill may explain update commands, but prose in `SKILL.md` is not an updater:
the skill may not load on a given day, and unverified self-rewrites have no
supply-chain verification or reliable rollback.

- Nightly checking is optional and disabled until the host adapter explicitly
  installs it with user consent.
- The default action is check plus notification. Applying an update remains a
  separate action unless the user opted into eligible safe guidance updates.
- The status surface must show installed/latest versions, last check, result,
  and pending approval, with **Check now**, **Update**, and **Repair/rollback**.
- A run records its starting plugin, skill, and MCP contract versions. Staged
  updates activate only for subsequent sessions/workouts/meals.
- Offline or failed checks retain the last known-good compatible bundle.

## Remaining host-specific work

- ChatGPT directory registration still requires a real ChatGPT-issued app ID.
- Hermes and Poke still need native adapters; the portable package is ready for
  those adapters to consume.
- Automatic background checks remain opt-in and host-owned. Fit Snap does not
  silently update an agent or grant new scopes.
