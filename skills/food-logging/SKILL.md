---
name: food-logging
description: Use when the user reports food or drink they consumed and wants the intake saved to Forge.
---

# Forge food logging

Use Forge MCP tools to save confirmed intake when the user asks to log it.
Treat hypothetical meals as planning until the user confirms consumption.

## Workflow

1. Read the relevant day or meal when existing state affects the write.
2. Search the food catalog before creating anything. Try no more than two
   sensible searches for one food.
3. Select only an item whose identity, serving basis, and allowed unit match the
   report. For a named brand or SKU, do not substitute a nearby flavor or
   product. If evidence is insufficient, ask one concise question.
4. If no exact item exists, create a distinctly named item from trustworthy
   nutrition evidence. Use the discrepancy workflow when the supplied values
   differ from a matching catalog item.
5. Call `log_food_intake` with the correct date, meal, numeric quantity, unit,
   and resolved `foodItemId`. Batch items from the same meal when supported.
6. Re-read with `check_day_nutrition_status` and verify the intended meal row,
   quantity, unit, and scaled nutrition before saying it was logged.

## Nutrition discrepancies

Use the package label or user-supplied values with their exact serving basis.
When Forge exposes a per-entry nutrition override, show the catalog and supplied
values in the proposal. Apply the override only to the selected entry.

The legacy `log_food_intake` schema calculates nutrition from its food ID. If it
cannot store the requested entry-only override, explain the limit. Offer a
separate private food as an alternative, with the user's approval. Use
`supportLongTermDatabase: false` when creating it. Give the item a distinct name
and keep the global catalog record intact. Notes and display names do not change
counted nutrients.

## Corrections and retries

- A later food report is additive unless the user explicitly says it replaces
  or corrects an earlier entry.
- For a correction, read the exact entry and use a supported entry edit or
  proposal that preserves sibling foods. If the connected toolset lacks an
  entry edit, direct the user to the meal in Forge.
- A timeout has an unknown commit state. Read the meal before retrying so the
  same intake is not logged twice.
- Notes do not replace a correct numeric quantity or unit. If a catalog item is
  serving-only, convert the reported amount to an exact fractional serving or
  create an item with the needed unit.

## Response

Confirm exactly what was saved and disclose any estimate. Never claim success
unless the post-write read matches the user's report.
