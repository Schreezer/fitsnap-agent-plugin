# Poke adapter

Status: documented Recipe target; no Fit Snap Recipe or update-status MCP tool
is shipped from this checkout.

The Poke adapter is a Recipe that supplies onboarding context and requires the
stable authenticated Fit Snap remote MCP integration. It consumes the same
canonical capability and safety guidance, but an OpenAI plugin manifest does
not install it.

Poke periodically re-syncs the remote MCP tool catalog and provides manual
re-sync, so backward-compatible server tool schemas and descriptions can
evolve behind the stable endpoint. Published Recipe edits currently apply to
new sign-ups only. The public contract does not provide a general updater for
existing users' local skill/context files; existing users may need an explicit
refresh or reinstall for Recipe guidance changes.

A future Poke automation may perform a nightly notification check only by
calling a read-only Fit Snap plugin-version/update-status MCP tool. It cannot
install shell cron, rewrite `SKILL.md`, or approve new permissions. That MCP
tool is required backend work and is not implemented today. Safety-critical
validation and mutation policy therefore remain server-enforced.
