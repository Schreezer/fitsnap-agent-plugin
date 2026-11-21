---
name: workout-logging
description: Log completed sets, including for workouts that already finished or were never logged, or find Forge workout sessions, exercises, and logged sets.
---

# Forge workouts

If the `fitsnap` CLI is installed and signed in to Forge, use these commands directly.

- `fitsnap forge day --section training --json` finds today's sessions. Add `--date YYYY-MM-DD` for a past date.
- `fitsnap forge find workout "Upper A" --json` resolves a named session. Use `find exercise` for an exercise.
- `fitsnap forge record workout <id> --json` reads completed sets. Use `--offset` with `nextOffset` if more sets are needed. Weights are in kg.

Otherwise, use the matching `forge_day`, `forge_find`, or `forge_record` MCP read.

Log only what the user asked you to log, with a connection that grants logging. Weights are in kg.

- **Sets for a session Forge already has**, in progress or finished (for example sets they forgot to add this morning): find the session with `forge day` / `forge_day` for that date, then use `fitsnap forge log-sets` or `forge_log_workout` with its workout ID. Sets added to a finished session count for that session's day and PRs, not today's.
- **A whole workout that was never logged** (for example "yesterday evening I did bench 3×8 at 60 kg"): check `forge day` for that date first. If the session is already there, add sets to it instead. Otherwise use `fitsnap forge log-workout` or `forge_log_past_workout` with the user's local date, start time (`HH:MM`), duration in minutes (default 60) and each exercise once with its sets. If the user gave no time, use a reasonable one and say which you used. Forge refuses future times and a time that overlaps another logged session.

Resolve exercise IDs with `find exercise` / `forge_find` before saving. Ask if the session, day or exercise is ambiguous, for example two sessions on "this morning". Reuse the request ID on retry; use a new one for a new log. Run `--help` on a CLI command for its options. Use Forge to start a live session or edit or delete existing sets.
