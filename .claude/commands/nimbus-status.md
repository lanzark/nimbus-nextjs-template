---
description: Show this app's Nimbus state — identity, registration, config keys and recent deployments
allowed-tools: mcp__plugin_nimbus_nimbus__nimbus_me, mcp__plugin_nimbus_nimbus__list_apps, mcp__plugin_nimbus_nimbus__get_app, mcp__plugin_nimbus_nimbus__list_env_vars, mcp__plugin_nimbus_nimbus__list_deployments, Bash, Read
---

Report where this repository stands on Nimbus. Read only — change nothing.

1. `nimbus_me` — the signed-in user, their role and organization. A missing
   `github_org` means the org has no GitHub App connected, which blocks deploys;
   say so.
2. `list_apps` — find the app matching this repo's `git remote get-url origin`.
   If there is no match, report that this repo is not registered in Nimbus and stop.
3. `get_app` — the app's id, repository and public URL.
4. `list_env_vars` — the configured keys (keys only; values are write-only by
   design). Flag any key in `.nimbus.yml`'s `deploy.env.required` that is missing.
5. `list_deployments(limit=5)` — the recent deployments with status and timestamp.
6. Read `.nimbus.yml` and report the effective build strategy — and, when it is
   `auto`, whether a `Dockerfile` exists in the build context, since that is what
   decides between a Docker and a Railpack build.

Present it as a short summary, not raw tool output. End with the one thing that
most needs attention, or say that everything is in order.
