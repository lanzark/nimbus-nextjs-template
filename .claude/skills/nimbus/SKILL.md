---
name: nimbus
description: How this app is built, configured and shipped on the Nimbus platform — the Nimbus MCP tools to use for git credentials, environment variables and deploys, and the `.nimbus.yml` build contract. Use whenever the task touches deploying, shipping, releasing, env vars, secrets, build strategy, Dockerfile vs Railpack, `.nimbus.yml`, pushing to the repo, or the app's public URL.
---

# Working on a Nimbus app

This repository was created from the Nimbus template by `create_nimbus_app`, and it
is deployed by Nimbus. The **Nimbus MCP server is the only supported way** to reach
the platform from an agent: it carries the caller's identity, so the platform can
tell which organization and which app a request belongs to.

## Use the MCP, not the alternatives

| You need to | Use | Never |
|---|---|---|
| Know who you are / which org | `nimbus_me` | guessing from git remote |
| Find the app's id | `list_apps`, `get_app` | hardcoding an id |
| Clone or push | `get_git_token` → `git push <git_remote_url> HEAD:main` | `gh`, a PAT, an SSH key |
| Read config keys | `list_env_vars` | reading `.env` |
| Set config | `set_env_vars`, `delete_env_var` | committing values |
| Ship | `deploy_app` → poll `list_deployments` | `vercel`, `railway`, `docker push` |

The tools are named `mcp__plugin_nimbus_nimbus__<tool>` — they come from the
**`nimbus` plugin**, which `.claude/settings.json` registers and enables from the
`lanzark` marketplace. If they are not available, **stop and say so** rather than
falling back to another deploy path. The fix is `/plugin install nimbus@lanzark`
followed by `/mcp` to sign in over OAuth, not a token in this repo.

Two rules that never bend:

- **Never commit a secret.** Values set through `set_env_vars` are stored encrypted
  and are never readable back — that is deliberate. `.env*` is gitignored; keep it
  that way.
- **Git tokens are short-lived (~1h).** Call `get_git_token` immediately before each
  push rather than reusing one from earlier in the session. A permission error on
  push means the token expired: mint a new one, do not retry the old URL.

## Deploying

```
1. npm run build                 # catch type errors locally first
2. get_git_token(repo=<name>)    # fresh credential
3. git push <git_remote_url> HEAD:main
4. deploy_app(app_id=<id>)       # builds the pushed commit
5. list_deployments(app_id=<id>) # poll until status is live or failed
```

Nimbus deploys the **default branch head**, resolved at deploy time — so a deploy
without a push first re-ships what is already there. Push, then deploy.

Environment variables reach the container on the **next** deploy, not immediately.
Setting a variable on a running app requires a redeploy to take effect.

A failed build is read from `list_deployments`. Reproduce it locally with
`npm run build` before changing anything — most failures are ordinary TypeScript or
lint errors, not platform problems.

## `.nimbus.yml` — the build contract

`.nimbus.yml` at the repo root decides how the app is built. Read it before
changing anything about the build; edit it rather than working around it.

`build.strategy` is the field that matters:

- **`auto`** (the template default) — a `Dockerfile` in the build context wins;
  with none, Railpack detects the Next.js app and builds it. The template ships
  no Dockerfile, so this is a Railpack build.
- **`railpack`** — always Railpack; a Dockerfile in the repo is ignored.
- **`dockerfile`** — always the Dockerfile at `build.dockerfile`. Missing file is a
  failed deploy, not a silent fallback.

To move this app to Docker: `mv Dockerfile.example Dockerfile`, set
`build.strategy: dockerfile`, then verify with `docker build -t app . && docker run
-p 3000:3000 -e PORT=3000 app` before pushing. `Dockerfile.example` is a working
multi-stage build for this template — it is inert until renamed.

Other fields worth knowing:

- `build.context` — root directory for the build. Point it at a subdirectory to
  build one app out of a monorepo.
- `runtime.port` / `runtime.startCommand` — the app **must** listen on `$PORT`.
  `next start` reads it automatically; never hardcode a port in the start command.
- `runtime.healthcheckPath` — polled until it answers 200 before the deploy is
  marked live. `src/app/api/health/route.ts` backs the default `/api/health`. If
  you delete that route, clear the field too, or every deploy will hang and fail.
- `deploy.env.required` — keys that must exist before the app starts. Adding a key
  here turns a runtime crash into an early, named deploy failure. Declare keys
  only; values never belong in this file.

`dev` is the only environment this MVP ships to. `prod` and the approval gate come
later — do not invent other environment names in this file.
