---
name: targets-and-preferences
description: Read or change Forge nutrition targets, display units, or training preferences.
---

# Forge targets and preferences

1. Read the relevant current values. Use `get_nutritional_goals` for nutrition targets. Resolve the exact fields the user intends to change.
2. Use a typed Forge proposal tool when available. Show the requested values and effective date, then report the proposal as awaiting approval until Forge confirms it was applied.
3. For the legacy `set_nutrition_targets` tool, preserve the complete current target set when changing one field. Supply calories, protein, carbohydrates, fats, and fiber if set. Omitted carbohydrate and fat targets are derived by the server. Ask before rebalancing macros or replacing unknown values. Confirm the exact before and after values before calling the write tool.
4. For legacy preferences, inspect `update_user_profile` and send only supported, requested fields in the matching profile type. Use `preferences` for training settings such as RIR or rest. Treat display units as writable only where the tool exposes the requested setting. Obtain confirmation for the exact settings before writing.
5. If Forge requires an in-app strategy approval, surface the approval request and wait. After a direct write, verify the persisted fields or the returned authoritative record. Report rejected fields or future effective dates explicitly.
