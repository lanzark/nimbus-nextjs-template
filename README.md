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

Deploys go through Nimbus: the **Deploy** button on the app's page in the dashboard,
or an AI agent connected to the Nimbus MCP server. Either way it pushes the app's
environment variables and builds the default-branch head, so push before deploying.

Ask the agent to deploy and it will use the MCP's own tools and guided flow — the
steps live in the server, not in this repository, so they stay right as the platform
changes.

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

The Nimbus MCP connection comes from the **`nimbus` plugin** in the
[`lanzark/nimbus-plugin`](https://github.com/lanzark/nimbus-plugin) marketplace.
[`.claude/settings.json`](.claude/settings.json) registers that marketplace and
enables the plugin, so Claude Code installs it on its own once you trust the folder.
By hand:

```shell
/plugin marketplace add lanzark/nimbus-plugin
/plugin install nimbus@lanzark
/mcp          # sign in to plugin:nimbus:nimbus over OAuth
```

Authentication is per user through WorkOS AuthKit — there is no token to add to this
repository, and none should ever be added.

That is deliberately all the agent configuration this repo carries. The tools, the
prompts and the instructions for working with Nimbus live in the MCP server, which
every app and every MCP-capable client shares; the plugin is only the connection to
it. The two files here that cannot be central are [`CLAUDE.md`](CLAUDE.md), which
names this repo's stack conventions, and [`.nimbus.yml`](.nimbus.yml), which is this
app's own deploy contract.

## Learn more

- [Next.js documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
