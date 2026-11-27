---
name: food-logging
description: Log a Forge meal, fix or delete a logged food entry (and undo a delete), or review food entries, day totals, nutrition trends, and matching portions.
---

# Forge food logs

If the `fitsnap` CLI is installed and signed in to Forge, use these commands directly.

- `fitsnap forge day --section nutrition --json` reads today's macros and targets. Add `--date YYYY-MM-DD` for a past date.
- `fitsnap forge trend protein_g --days 7 --json` reads a metric over a day count. Preserve missing and partial values.
- `fitsnap forge find food "yogurt" --json` looks up catalog matches. `fitsnap forge record meal_entry <id> --json` reads a logged portion.

Otherwise, use the matching `forge_day`, `forge_trend`, `forge_find`, or `forge_record` MCP read.

## New entries

For a requested new entry, use `fitsnap forge log-meal --help` or `forge_log_meal` with a connection that grants logging. For several foods eaten together, use `forge_log_meal_items` (up to 10, saved all or none). Label macros describe the full portion being logged. Reuse the request ID on retry; use a new one for a new log.

## Fixing or deleting an entry

Change or remove an entry only when the user asks. These need the MCP tools on a connection that grants logging; the CLI only reads and logs.

1. Find the entry: `forge_day` for that date lists its entries, and `forge_find` with `kind: meal_entry` searches logged food by name (the last 30 days by default). If more than one entry matches, ask which.
2. Read it with `forge_record` (`kind: meal_entry`) for its current `version`, and pass that as `expected_version`. If Forge says the version is stale, read it again and retry; don't guess.
3. **Fix it in place** with `forge_edit_meal_entry`: amount and unit (grams are recomputed), meal, or nutrient values the user gave for the whole entry. A correction changes only that entry unless the user agrees to more: ask before using `apply_to: food` (also their saved food, for future logs) or `food_and_past` (and their other entries of it). Never delete and re-log to make a change.
4. **Delete it** with `forge_delete_meal_entry`. Say what was removed. To undo, call it again with `restore: true` and the version the delete returned.
