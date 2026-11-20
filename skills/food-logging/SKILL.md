---
name: food-logging
description: Review Forge food logs, day totals, nutrition trends, or matching portions.
---

# Forge food logs

- Use `forge_day` with the nutrition section for the day’s macros, targets, and recent entry IDs.
- Use `forge_record` with `kind: meal_entry` for one logged portion. Use `forge_find` with `kind: food` for catalog matches. Keep the logged serving and catalog serving distinct when comparing them.
- Use `forge_trend` for one metric over the requested day count. Preserve missing and partial data in the answer.
- For logging, correcting a meal, or applying the macros from a package label, direct the user to the entry in Forge. The read connection cannot save changes.
