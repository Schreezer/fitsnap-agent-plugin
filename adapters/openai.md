# Codex and ChatGPT adapter

Status: the Codex development package is present. Marketplace publishing,
ChatGPT app registration, and universal-directory submission are not complete.

Use a dedicated canonical versioned Git repository and a Git-backed OpenAI
marketplace entry for development/private distribution. Users add the
marketplace once and explicitly refresh it with:

```text
codex plugin marketplace upgrade <marketplace-name>
```

The agent should not browse GitHub ad hoc during each run. Public releases use
the universal Plugins Directory publishing/review channel shared by ChatGPT
and Codex. Local source updates require refreshing the referenced plugin and
restarting the desktop app under the documented cache behavior.

ChatGPT also requires a real registered `plugin_asdk_app...` ID in `.app.json`.
No installer may fabricate that ID or embed user OAuth tokens in the bundle.
