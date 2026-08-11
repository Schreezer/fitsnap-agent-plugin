---
name: food-logging
description: Use when the user reports food or drink they consumed and wants the intake saved to Fit Snap.
---

# Fit Snap food logging

Use Fit Snap MCP tools for all reads and writes. Treat past-tense intake such as
"I ate" or "I had" as a logging request. Treat "what if" or "I might have" as
planning only until the user confirms consumption.

## Workflow

1. Read the relevant day or meal when existing state affects the write.
2. Search the food catalog before creating anything. Try no more than two
   sensible searches for one food.
3. Select only an item whose identity, serving basis, and allowed unit match the
   report. For a named brand or SKU, do not substitute a nearby flavor or
   product. If evidence is insufficient, ask one concise question.
4. If no exact item exists, create a clearly named item from trustworthy
   nutrition evidence. Do not fabricate missing values or report notes-only
   nutrients as counted by Fit Snap.
5. Call `log_food_intake` with the correct date, meal, numeric quantity, unit,
   and resolved `foodItemId`. Batch items from the same meal when supported.
6. Re-read with `check_day_nutrition_status` and verify the intended meal row,
   quantity, unit, and scaled nutrition before saying it was logged.

## Corrections and retries

- A later food report is additive unless the user explicitly says it replaces
  or corrects an earlier entry.
- For a correction, inspect live state, remove only the incorrect row, preserve
  sibling foods, log the corrected row, and verify again.
- A timeout has an unknown commit state. Read the meal before retrying so the
  same intake is not logged twice.
- Notes do not replace a correct numeric quantity or unit. If a catalog item is
  serving-only, convert the reported amount to an exact fractional serving or
  create an item with the needed unit.

## Response

Confirm exactly what was saved and disclose any estimate. Never claim success
unless the post-write read matches the user's report.
