---
name: targets-and-preferences
description: Read Forge nutrition targets, set daily calorie and macro goals the user asks for, or locate where to edit tracking preferences.
---

# Forge targets and preferences

Call `forge_day` with the nutrition section to read the targets that applied on the requested date.

To change daily calorie or macro goals, use `forge_set_goals` with a connection that grants logging, and only when the user asks to set those numbers. Never set goals as a follow-up to logging or as your own suggestion. Pass only the goals they named; the rest stay as they are. Forge saves exactly what is given, even if macros and calories disagree, so mention a mismatch before saving. The change takes effect today in their time zone.

For other tracking preferences, direct the user to the relevant settings in Forge.
