# Nimbus Next.js template

A [Next.js](https://nextjs.org) App Router starter wired for the Nimbus platform:
one manifest describes the deploy, and the agent configuration is committed so
every developer and every AI agent that opens this repo works the same way.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Edit `src/app/page.tsx` — the
page hot-reloads.

## Deploying

Deploys go through Nimbus. From an agent connected to the Nimbus MCP server:

```
/deploy
```

which builds, pushes, ships and watches the deployment until it is live. By hand,
the same sequence is the **Deploy** button on the app's page in the Nimbus
dashboard — it pushes the app's environment variables and builds the default
branch head.

`/nimbus-status` shows where the app stands: registration, configured keys and
recent deployments, without changing anything.

### `.nimbus.yml`

The deployment contract lives in [`.nimbus.yml`](.nimbus.yml). Every field is
commented; the one that decides the build is `build.strategy`:

| Value | Build |
|---|---|
| `auto` *(default)* | A `Dockerfile` in the build context wins. With none — the state this template ships in — Railpack detects the Next.js app and builds it. |
| `railpack` | Always Railpack. A `Dockerfile` in the repo is ignored rather than silently taking over. |
| `dockerfile` | Always the Dockerfile at `build.dockerfile`. A missing file fails the deploy instead of quietly building something else. |

To move to Docker:

```bash
mv Dockerfile.example Dockerfile
# set build.strategy: dockerfile in .nimbus.yml
docker build -t app . && docker run -p 3000:3000 -e PORT=3000 app
```

`Dockerfile.example` is a working multi-stage build for this template and is inert
until renamed.

The rest of the manifest declares the runtime: the port (`$PORT` is injected —
`next start` reads it, so never hardcode one), the start command, the healthcheck
path backed by `src/app/api/health/route.ts`, and which environment-variable keys
the app needs.

### Configuration

Environment variables are set in the Nimbus dashboard or with the MCP `set_env_vars`
tool. Values are stored encrypted and are **never readable back** — the API returns
keys only. They reach the container on the next deploy, so setting one on a running
app requires a redeploy.

Nothing secret belongs in this repository. `.env*` is gitignored; list the keys your
app needs under `deploy.env` in `.nimbus.yml` instead, so a deploy missing one fails
early with the key named rather than booting a broken container.

## Agent setup

| Path | Purpose |
|---|---|
| [`.mcp.json`](.mcp.json) | Project-scoped Nimbus MCP server. `NIMBUS_MCP_URL` overrides the host for staging or self-hosted installs. |
| [`.claude/settings.json`](.claude/settings.json) | Enables that server and pre-approves its read-only tools; denies reading `.env*`. |
| [`.claude/skills/nimbus/SKILL.md`](.claude/skills/nimbus/SKILL.md) | Loads whenever a task touches deploys, config or the build. |
| [`.claude/commands/`](.claude/commands) | `/deploy` and `/nimbus-status`. |
| [`CLAUDE.md`](CLAUDE.md) | Repo-wide rules: MCP-only platform access, no committed secrets, code quality. |

Authentication is per user through WorkOS when the MCP server connects — there is no
token to add to this repository, and none should ever be added.

## Learn more

- [Next.js documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
