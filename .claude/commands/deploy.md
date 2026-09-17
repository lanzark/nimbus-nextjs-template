---
description: Build, push and ship this app to Nimbus, then watch the deployment until it is live
argument-hint: "[optional note about what changed]"
allowed-tools: mcp__nimbus__nimbus_me, mcp__nimbus__list_apps, mcp__nimbus__get_app, mcp__nimbus__get_git_token, mcp__nimbus__deploy_app, mcp__nimbus__list_deployments, mcp__nimbus__list_env_vars, Bash, Read, Glob, Grep
---

Ship this repository to Nimbus. $ARGUMENTS

Work through these steps in order and stop at the first one that fails, reporting
what failed and what the user has to do about it. Do not fall back to any deploy
path other than the Nimbus MCP.

1. **Check the working tree.** `git status --short` and `git log --oneline -3`. If
   there are uncommitted changes, show them and ask whether to commit before
   deploying — never commit on the user's behalf without asking, and never commit
   `.env*` or anything holding a secret.

2. **Verify the build.** Run `npm run build`. A red build is the end of the run:
   report the errors and stop. Deploying a build that fails locally only burns a
   remote build cycle.

3. **Identify the app.** `nimbus_me` to confirm identity and organization, then
   `list_apps` and match this repository by its git remote. If no app matches, say
   so — this repo is not registered in Nimbus, and `create_nimbus_app` is the fix.

4. **Check configuration.** Read `.nimbus.yml` and compare `deploy.env.required`
   against `list_env_vars`. Any required key that is missing stops the run: name
   the keys and tell the user to set them with `set_env_vars`, since values can
   only be written, never read back.

5. **Push.** `get_git_token(repo=<bare repo name>)` for a fresh credential, then
   `git push <git_remote_url> HEAD:main`. Tokens expire in about an hour — mint one
   here rather than reusing an earlier one.

6. **Deploy.** `deploy_app(app_id=<id>)`. Nimbus builds the default-branch head, so
   step 5 must have landed first.

7. **Watch it.** Poll `list_deployments(app_id=<id>, limit=5)` until the newest
   deployment reads live or failed. On failure, report the build error and the
   likely cause — check `.nimbus.yml`'s `build.strategy` against what is actually
   in the repo (a `Dockerfile` present under `strategy: auto` takes over the
   build) before blaming the platform.

Finish with the deployment status and the app's public URL.
