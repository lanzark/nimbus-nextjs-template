# `.claude/` — agent configuration for this Nimbus app

Committed on purpose: every developer and every agent that opens this repository
gets the same setup, without anyone configuring it by hand.

| Path | What it does |
|---|---|
| `settings.json` | Registers the `lanzark` marketplace and enables the `nimbus` plugin, which is what connects the Nimbus MCP server. Pre-approves the plugin's read-only tools so routine work does not prompt, and denies reading `.env*` outright. |
| `skills/nimbus/SKILL.md` | Loads when a task touches deploying, env vars or the build, and points the agent at the Nimbus MCP tools and the `.nimbus.yml` contract. |
| `commands/deploy.md` | `/deploy` — build, push, ship, watch until live. |
| `commands/nimbus-status.md` | `/nimbus-status` — read-only view of the app's Nimbus state. |

## The plugin owns the MCP connection

This repo does **not** define the Nimbus MCP server itself. The endpoint, its
transport and its auth live once in
[`lanzark/nimbus-plugin`](https://github.com/lanzark/nimbus-plugin), and every Nimbus
app points at that — so when the endpoint moves, or a prod environment is added
beside today's dev one, nothing in this repository has to change.

`extraKnownMarketplaces` and `enabledPlugins` in `settings.json` do the work: once
the folder is trusted, Claude Code registers the marketplace, installs the plugin and
enables it with no separate step. Install it by hand with:

```shell
/plugin marketplace add lanzark/nimbus-plugin
/plugin install nimbus@lanzark
```

Auth is per user over OAuth (WorkOS AuthKit) — run `/mcp`, pick
`plugin:nimbus:nimbus` and sign in. There is no token to put in this repository, and
none should ever be added to it.

Plugin tools are namespaced `mcp__plugin_nimbus_nimbus__<tool>`, which is why the
allow-list entries in `settings.json` and the `allowed-tools` in `commands/` read the
way they do.

`settings.local.json` is for personal overrides and is gitignored. Edit that one,
not `settings.json`, for anything that should not apply to the whole team.
