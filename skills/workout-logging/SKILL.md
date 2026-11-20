---
name: workout-logging
description: Find Forge workout sessions or exercises and review completed sets.
---

# Forge workouts

- For a date, call `forge_day` with the training section. For a named session or exercise, call `forge_find` with its type and name.
- Call `forge_record` with `kind: workout` for actual sets. Follow `nextOffset` only if the user needs more sets.
- Report weights in kg and distances in meters or convert to the user’s preferred units while preserving what was logged. For new sets or edits, use the workout in Forge.
