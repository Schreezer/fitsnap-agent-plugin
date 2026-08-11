# Hermes adapter

Status: documented target; no Fit Snap Hermes installer or scheduled job is
shipped from this checkout.

The production adapter should be a Hermes plugin/tap backed by the canonical
Fit Snap plugin Git repository. It maps the stable authenticated MCP endpoint
and the canonical, immutable Fit Snap skills into Hermes' native package shape.
It must not copy credentials into the repository or alter domain rules.

Hermes already tracks skill provenance and upstream hashes. Users can run:

```text
hermes skills tap add <owner/repository>
hermes skills check
hermes skills update
hermes skills update <name>
hermes plugins update <plugin-name>
```

An installer may optionally offer a native nightly scheduled check. The default
is check plus notification. It may not treat guidance inside `SKILL.md` as the
updater or silently apply releases that add scopes, destructive capabilities,
endpoint/auth changes, major versions, or meaningful mutation-policy changes.
Those changes require explicit approval and, when applicable, reauthorization.

Safe patch/minor guidance auto-application is future, opt-in behavior and still
requires the signed-manifest checks, complete staging, validation, atomic swap,
and last-known-good rollback in the shared update contract. A started session
keeps its starting versions; Hermes normally sees updated skills in a new
session. `/reset` or `--now` is an explicit request to refresh current context.
