---
name: food-logging
description: Log a Forge meal or review food entries, day totals, nutrition trends, and matching portions.
---

# Forge food logs

If the `fitsnap` CLI is installed and signed in to Forge, use these commands directly.

- `fitsnap forge day --section nutrition --json` reads today's macros and targets. Add `--date YYYY-MM-DD` for a past date.
- `fitsnap forge trend protein_g --days 7 --json` reads a metric over a day count. Preserve missing and partial values.
- `fitsnap forge find food "yogurt" --json` looks up catalog matches. `fitsnap forge record meal_entry <id> --json` reads a logged portion.

Otherwise, use the matching `forge_day`, `forge_trend`, `forge_find`, or `forge_record` MCP read.

For a requested new entry, use `fitsnap forge log-meal --help` or `forge_log_meal` with a connection that grants logging. Label macros describe the full portion being logged. Reuse the request ID on retry. For changes to an existing entry, open that entry in Forge.
