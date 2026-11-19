---
name: workout-logging
description: Use when the user reports completed sets, reps, load, cardio, substitutions, or a finished workout and wants it saved to Forge.
---

# Forge workout logging

Use Forge MCP tools for all reads and writes. User-reported performance is an
execution log, not permission to rewrite future programming.

## Workflow

1. Call `get_workout_data` to identify the intended workout. If multiple pending
   workouts are plausible and none has activity or a user-supplied identity,
   ask which workout rather than guessing.
2. Read workout detail with exercise and set IDs. Match existing workout
   exercises before searching the catalog or creating a new exercise.
3. Use workout instance IDs and set IDs for logging. A catalog exercise ID is
   not a workout exercise instance ID.
4. Immediately before writing, fetch logging detail and its latest
   `workout_revision`.
5. Send actual reps, load, RIR, duration, distance, completion, or skips through
   `log_workout_performance` with the expected revision. Never place actual
   performance values in structural exercise-management calls.
6. Prefer completing planned set rows. Add structural rows only for explicit
   extra work, then re-read to obtain their IDs before logging performance.
7. Re-read full detail and verify actual values and completion timestamps. Only
   then complete the workout if the user said the session is finished.

## Integrity rules

- Record only clean completed reps as `actual_reps`; preserve assisted, failed,
  or form-broken attempts in notes.
- Never turn target values into actuals when the user did not report them.
- Delete skipped exercises only when the user explicitly identifies them as
  unperformed. Preserve unknown rows and describe them honestly.
- On a stale revision or timeout, re-read before retrying. Do not duplicate a
  set or complete the workout twice.
- Ask one concise question if missing detail would materially misrepresent the
  workout.

## Response

Confirm the workout, movement, set number, and saved actuals. Never say
"logged", "completed", or "saved" unless the verification read matches.
