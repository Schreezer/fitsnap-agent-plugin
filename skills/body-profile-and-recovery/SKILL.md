---
name: body-profile-and-recovery
description: Read a Forge body-weight trend, explain gaps in the weigh-in history, or record a weigh-in the user reports.
---

# Forge weight trend

Call `forge_trend` with `metric: weight_kg` and the requested number of days. Treat dates with null values as days without a weigh-in.

To record a weigh-in the user reports, use `forge_log_weight` with a connection that grants logging, in kg or lb as they said it. Give `date` and a local `time` (`HH:MM`) for an earlier weigh-in. It joins the same history as the app and `forge_trend`. Reuse the request ID on retry. Open health records in Body in Forge.
