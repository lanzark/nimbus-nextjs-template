# This is a Nimbus app

Created from the Nimbus template by `create_nimbus_app`, and deployed by Nimbus —
not by Vercel, not by `railway up`, not by a GitHub Action in this repo.

**Everything that touches the platform goes through the Nimbus MCP server**, which
carries the caller's identity — the only thing that tells Nimbus which organization
and which app a request belongs to. The connection comes from the `nimbus` plugin
([`lanzark/nimbus-plugin`](https://github.com/lanzark/nimbus-plugin)), which
`.claude/settings.json` registers and enables, so it is there once the folder is
trusted. If it is not, stop and tell the user to run `/plugin install nimbus@lanzark`
and `/mcp` — never reach for `gh`, a personal access token, or another deploy tool
instead.

**The MCP server describes itself.** Its own instructions and prompts are the
authority on which tools exist and how to create, configure, clone, push and ship an
app; read them there rather than assuming a flow from this file. Guidance that lives
in the server reaches every app and every client at once — a copy pinned here would
go stale the moment the platform changes.

Two facts about this repository that the server cannot know:

- **`.nimbus.yml`** at the root decides how this app is built. Keep it minimal:
  `build.strategy: auto` is right unless the app genuinely needs a Dockerfile, in
  which case rename `Dockerfile.example` and set `strategy: dockerfile`.
- **Never commit a secret.** `.env*` is gitignored and `.claude/settings.json`
  denies reading it. Configuration belongs in Nimbus, where values are stored
  encrypted and are never readable back.

## Code quality

This is a real product surface, not a scaffold — leave it looking deliberate.

- Build with the App Router under `src/app`. Server Components by default; add
  `"use client"` only where interactivity actually requires it.
- Style with Tailwind v4 (configured via `@tailwindcss/postcss`); keep dark mode
  working, since the template ships with it.
- Prefer fewer, simpler layouts over clever ones. No broken spacing, no misaligned
  elements, no placeholder copy left behind.
- `npm run build` must pass before you push — it is the same build Nimbus runs, so a
  failure here is a failed deploy. `npm run lint` before committing.
- This template uses **npm**, not pnpm. Keep `package-lock.json` committed and in
  sync; both build strategies install from it.
- The app must listen on `$PORT`. `next start` reads it — never hardcode a port.
- `/api/health` is a plain liveness endpoint. Keep it cheap and dependency-free — it
  has to answer on a container that has only just booted.

@AGENTS.md
