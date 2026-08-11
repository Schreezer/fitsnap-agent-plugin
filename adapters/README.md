# Host adapters

All adapters consume the same released MCP URL and immutable skill artifacts.
They may translate installation/configuration mechanics, but they must not edit
domain behavior or add permissions.

| Host | Current adapter boundary |
|---|---|
| Codex | Native OpenAI plugin package. Updates use the configured marketplace/directory channel. |
| ChatGPT | Same package plus a registered `.app.json` MCP connection ID. |
| Hermes | Package a thin Hermes plugin/tap from the canonical Git source. Hermes provides provenance-aware `skills check`/`skills update` and `plugins update`; the Fit Snap adapter and signed release pipeline are not implemented in this checkout. |
| Poke | Publish a Recipe requiring the stable remote Fit Snap MCP. MCP tool metadata re-syncs, but Recipe edits currently affect new sign-ups only; no existing-user `SKILL.md` updater is documented. |

Every adapter must show installed plugin/skills versions, update availability,
and last-known-good status once the signed update protocol is implemented. A
host that cannot meet the verification/atomic-swap contract stays manual-only.

See [`hermes.md`](hermes.md), [`poke.md`](poke.md), and [`openai.md`](openai.md)
for accurate installation and update behavior by host.
