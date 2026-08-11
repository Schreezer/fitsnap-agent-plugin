# Add Fit Snap to your agent

This package adds Fit Snap to an agent the user already operates. The external
agent remains responsible for its model, inference, context, orchestration, and
costs. Fit Snap provides OAuth-authorized MCP tools, user-owned fitness data,
server-validated mutations, and domain skills.

It does **not** make Hermes, OpenClaw, or another personal agent the runtime for
Fit Snap's own in-app AI. That is a separate future product lane and is not open
for new connections.

## Canonical capability source

The canonical source in this package is:

- `plugin.json`: the Agent Plugins v1 manifest;
- `mcp.json`: the stable remote Fit Snap MCP endpoint;
- `skills/food-logging/SKILL.md`;
- `skills/workout-logging/SKILL.md`;
- `skills/body-profile-and-recovery/SKILL.md`.

The legacy `.codex-plugin/plugin.json` and `.mcp.json` files remain only as a
Codex compatibility adapter. New clients should load the standard root files.
No adapter may fork the behavior rules. Host-specific installers copy or map
these immutable release artifacts and configure the same MCP endpoint.

The package contains no user tokens, database credentials, Hermes
configuration, or personal food/workout history. OAuth credentials remain in
the host's protected credential store and are never placed in the bundle.

## Portability status

The root package follows the portable Agent Plugins v1 layout. Client-specific
installation and authentication remain host responsibilities.

- **Codex:** the compatibility files are retained for the current Codex
  marketplace flow. The standard root package is the canonical source.
- **ChatGPT:** register the MCP connection in developer mode and add the real
  `plugin_asdk_app...` ID through `.app.json` before testing or directory
  submission. Never fabricate this ID.
- **Hermes:** Hermes uses its own MCP configuration and `SKILL.md` installation
  layout. Distribute a thin Fit Snap Hermes plugin/tap from the canonical Git
  repository. Hermes retains source provenance and supports `hermes skills
  check`, `hermes skills update`, and `hermes plugins update <plugin-name>`.
  Those commands do not make the OpenAI manifest portable to Hermes.
- **Poke:** use a Poke Recipe plus the stable remote Fit Snap MCP integration.
  Poke periodically re-syncs remote MCP tools, but published Recipe edits apply
  only to new sign-ups under the currently documented behavior. Do not claim
  that Poke updates an existing user's copied `SKILL.md` content.

See [`adapters/README.md`](adapters/README.md) and
[`PORTABILITY_AND_UPDATE_CONTRACT.md`](PORTABILITY_AND_UPDATE_CONTRACT.md).

## OpenAI distribution

The public repository is the canonical distribution source. GitHub releases are
created from version tags and include the plugin archive, signed release
manifest, and trusted public signing key.

1. Add the repository as a Git-backed source pinned by release `ref` or `sha`
   for private/development use.
2. Users add that marketplace once with `codex plugin marketplace add ...` and
   refresh it explicitly with `codex plugin marketplace upgrade ...`.
3. Submit approved public releases to the universal Plugins Directory shared by
   ChatGPT and Codex. Public-directory updates follow that publishing/review
   channel, not a custom GitHub polling script.

The Agent Plugins specification does not define a marketplace. A GitHub release
is the public, inspectable source; each host decides how it installs and updates
the package.

## ChatGPT registration shape

ChatGPT's app directory is a separate distribution channel. It requires a real
ChatGPT-issued app ID and a client-specific registration file; this package does
not fabricate that ID. Direct MCP setup works without ChatGPT registration.

```json
{
  "apps": {
    "fitsnap": {
      "id": "plugin_asdk_app_FROM_CHATGPT",
      "category": "Health & Fitness"
    }
  }
}
```
