# `.claude/` — agent configuration for this Nimbus app

Committed on purpose: every developer and every agent that opens this repository
gets the same setup, without anyone configuring it by hand.

| Path | What it does |
|---|---|
| `settings.json` | Enables the project-scoped `nimbus` MCP server from `../.mcp.json` and pre-approves its read-only tools, so routine work does not prompt. Reading `.env*` is denied outright. |
| `skills/nimbus/SKILL.md` | Loads when a task touches deploying, env vars or the build, and points the agent at the Nimbus MCP tools and the `.nimbus.yml` contract. |
| `commands/deploy.md` | `/deploy` — build, push, ship, watch until live. |
| `commands/nimbus-status.md` | `/nimbus-status` — read-only view of the app's Nimbus state. |

The MCP server itself is defined in `.mcp.json` at the repo root. It points at the
Nimbus production host by default; set `NIMBUS_MCP_URL` to override it for a
staging or self-hosted install. Authentication is per-user via WorkOS — there is no
token to put in this repository, and none should ever be added to it.

`settings.local.json` is for personal overrides and is gitignored. Edit that one,
not `settings.json`, for anything that should not apply to the whole team.
