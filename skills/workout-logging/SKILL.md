---
name: workout-logging
description: Log completed sets, including for workouts that already finished or were never logged; start or finish a live workout; fix or delete logged sets, exercises, and workouts; or find Forge workout sessions, exercises, and logged sets.
---

# Forge workouts

If the `fitsnap` CLI is installed and signed in to Forge, use these commands directly.

- `fitsnap forge day --section training --json` finds today's sessions. Add `--date YYYY-MM-DD` for a past date.
- `fitsnap forge find workout "Upper A" --json` resolves a named session. Use `find exercise` for an exercise.
- `fitsnap forge record workout <id> --json` reads completed sets. Use `--offset` with `nextOffset` if more sets are needed. Weights are in kg.

Otherwise, use the matching `forge_day`, `forge_find`, or `forge_record` MCP read.

Log only what the user asked you to log, with a connection that grants logging. Weights are in kg.

- **Sets for a session Forge already has**, in progress or finished (for example sets they forgot to add this morning): find the session with `forge day` / `forge_day` for that date, then use `fitsnap forge log-sets` or `forge_log_workout` with its workout ID. Sets added to a finished session count for that session's day and PRs, not today's.
- **A whole workout that was never logged** (for example "yesterday evening I did bench 3×8 at 60 kg"): check `forge day` for that date first. If the session is already there, read its sets with `forge record workout` / `forge_record` (follow `nextOffset`) and add only the sets that are missing; ask if it's unclear whether the reported sets are new, and write nothing if they are all there. Otherwise use `fitsnap forge log-workout` or `forge_log_past_workout` with the user's local date, start time (`HH:MM`), duration in minutes (default 60) and each exercise once with its sets. If the user gave no time, use a reasonable one and say which you used. Forge refuses future times and a time that overlaps another logged session.

Resolve exercise IDs with `find exercise` / `forge_find` before saving. Ask if the session, day or exercise is ambiguous, for example two sessions on "this morning". Reuse the request ID on retry; use a new one for a new log. Run `--help` on a CLI command for its options.

## Live workouts

These need the MCP tools on a connection that grants logging; the CLI doesn't start or finish sessions.

- **Start** one now only when the user asks: `forge_start_workout`, empty or from a routine found with `forge_find` (`kind: routine`). It asks Apple Watch to record it unless the user says not to (`on_watch: false`). Forge refuses while another workout is in progress; say so rather than finishing that one yourself.
- **Finish** the workout in progress when the user says they're done: `forge_finish_workout`.

## Fixing or deleting what's logged

Change or remove sets, exercises or workouts only when the user asks, with the MCP tools on a connection that grants logging. Read the workout with `forge_record` first (follow `nextOffset`) for its set and exercise IDs and its `version`, and pass that as `expected_version`. If Forge says the version is stale, read it again and retry.

- **A set:** `forge_edit_workout_set` changes reps, assisted reps or kg, marks a planned set done (`done: true`), or deletes (`action: delete`) or restores (`action: restore`) it.
- **An exercise or the workout:** `forge_edit_workout` changes the name, notes, date or times (`action: details`), adds, removes, restores or replaces an exercise, or deletes (`action: delete`) or restores (`action: restore`) the whole workout.

Confirm which workout before deleting one, and say what was removed. To undo a delete, restore it the same way.

Without a connection that grants logging (the plugin's own connection is read-only), don't promise the change: say they can start, finish or edit the session in Forge, or offer to add the Forge logging connection (`/api/v1/forge-mcp-log`).
