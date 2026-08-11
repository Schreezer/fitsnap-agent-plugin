---
name: body-profile-and-recovery
description: Use when the user wants to update their current weight/profile or asks for recovery, sleep, wearable, or durable health context from Fit Snap.
---

# Fit Snap body profile and recovery

Use Fit Snap MCP tools for all reads and writes. Do not turn a current profile
field into a historical measurement claim, and do not turn wearable context
into a medical diagnosis.

## Current weight and profile

1. Inspect `update_user_profile` with `get_tool_schema` before writing.
2. Confirm the numeric value and `kg` or `lbs` unit. Ask one concise question if
   either is missing.
3. Use `profile_type: "onboarding"` with `weight` and `weight_unit` only when
   the user wants their current Fit Snap profile weight updated.
4. Re-read the available user/profile status and verify the current value.
5. Say "current profile weight updated," not "weigh-in logged." The current MCP
   contract does not expose a dedicated historical weigh-in ledger tool.

## Recovery and wearable context

1. Use `get_wearable_data` for latest metrics, history, trends, or imported
   workouts. Request only the smallest view needed.
2. Treat missing values as unavailable. Never invent sleep, HRV, resting heart
   rate, recovery, strain, steps, or workout metrics.
3. Use `manage_health_notes` only for a user-requested durable health, injury,
   equipment, energy, or dietary-health note. Temporary circumstances belong
   in the relevant workout/meal execution context instead.
4. Ask before creating or materially changing a durable health note. Re-read or
   use the mutation receipt before claiming it was saved.

## Response

Separate verified Fit Snap facts from interpretation. Keep recovery coaching
conservative, specific, and non-medical.
