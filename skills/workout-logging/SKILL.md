---
name: workout-logging
description: Log completed sets or find Forge workout sessions, exercises, and logged sets.
---

# Forge workouts

With a connected shell, use these commands directly.

- `fitsnap forge day --section training --json` finds today's sessions. Add `--date YYYY-MM-DD` for a past date.
- `fitsnap forge find workout "Upper A" --json` resolves a named session. Use `find exercise` for an exercise.
- `fitsnap forge record workout <id> --json` reads completed sets. Use `--offset` with `nextOffset` if more sets are needed. Weights are in kg.

Without the CLI, use the matching `forge_day`, `forge_find`, or `forge_record` MCP read.

For explicitly requested new sets, use `fitsnap forge log-sets --help` or `forge_log_workout` with a connection that grants logging. Resolve the active workout and exercise IDs before saving. Ask if the workout or exercise is ambiguous. Reuse the request ID on retry. Use Forge to start a session or edit existing sets.
