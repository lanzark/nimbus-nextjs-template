# This is a Nimbus app

Created from the Nimbus template by `create_nimbus_app`, and deployed by Nimbus —
not by Vercel, not by `railway up`, not by a GitHub Action in this repo.

**Everything that touches the platform goes through the Nimbus MCP server.** It
carries the caller's identity, which is how Nimbus knows the organization and the
app a request belongs to; nothing else can express that. The connection comes from
the **`nimbus` plugin** ([`lanzark/nimbus-plugin`](https://github.com/lanzark/nimbus-plugin)),
which `.claude/settings.json` registers and enables, so it is there once the folder
is trusted. If it is not, stop and tell the user to run `/plugin install
nimbus@lanzark` and `/mcp` — never reach for `gh`, a personal access token, or
another deploy tool instead.

Its tools are namespaced `mcp__plugin_nimbus_nimbus__<tool>`; this file names them
bare for readability.

| Task | Tool |
|---|---|
| Who am I / which org | `nimbus_me` |
| Find this app | `list_apps`, `get_app` |
| Clone or push | `get_git_token` → `git push <git_remote_url> HEAD:main` |
| Configure | `set_env_vars`, `list_env_vars`, `delete_env_var` |
| Ship | `deploy_app`, then poll `list_deployments` |

`/deploy` runs the whole build → push → deploy → watch sequence.
`/nimbus-status` reports where the app stands without changing anything.
Details on both, and on the build contract, live in `.claude/skills/nimbus/SKILL.md`.

## Deploying

`.nimbus.yml` at the repo root decides how this app is built. `build.strategy: auto`
— the default — means a `Dockerfile` in the build context wins, and with none
(the shipped state) Railpack detects the Next.js app. Set `dockerfile` or
`railpack` to force one. `Dockerfile.example` is a working multi-stage build for
this template, inert until it is renamed to `Dockerfile`.

Two things to keep true:

- **The app listens on `$PORT`.** `next start` reads it; never hardcode a port.
- **`/api/health` answers 200.** `.nimbus.yml` polls it before marking a deploy
  live. Delete the route and you must clear `runtime.healthcheckPath` too.

Nimbus deploys the **default-branch head**, so push before deploying. Environment
variables take effect on the next deploy, never on a running container.

## Secrets

Never commit one. `.env*` is gitignored and `.claude/settings.json` denies reading
it. Configuration belongs in Nimbus via `set_env_vars`, where values are stored
encrypted and are **never readable back** — `list_env_vars` returns keys only, by
design. Anyone who needs to change a value overwrites it.

## Code quality

This is a real product surface, not a scaffold — leave it looking deliberate.

- Build with the App Router under `src/app`. Server Components by default; add
  `"use client"` only where interactivity actually requires it.
- Style with Tailwind v4 (configured via `@tailwindcss/postcss`); keep dark mode
  working, since the template ships with it.
- Prefer fewer, simpler layouts over clever ones. No broken spacing, no misaligned
  elements, no placeholder copy left behind.
- `npm run build` must pass before you push — it is the same build Nimbus runs, so
  a failure here is a failed deploy. `npm run lint` before committing.
- This template uses **npm**, not pnpm. Keep `package-lock.json` committed and in
  sync; both build strategies install from it.

@AGENTS.md
