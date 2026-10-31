# Plugin and configuration snapshot

Saved on 2026-10-31. These are local backups; no plugin was updated or deployed.

## Saved packages

| Folder | Plugin | Version |
| --- | --- | --- |
| `../plugins/apoio-maternidade/` | Mamãe Mins | 0.4.5 |
| `../plugins/mcp-mins/` | mcp-mins | 1.0.1 |
| `../plugins/listas-e-diario/` | Mamãe Mins · Listas e diário | 1.0.1 |

All 44 files listed by Plugin Creator for these current releases were retrieved, including hidden manifests, App associations, MCP/OAuth declarations, skills, personal context/reference files, and the original plugin's runtime and tests. Each package also includes its installed `.codex-remote-plugin-install.json` identity mapping. Published source takes precedence over the installed cache; the Listas e diário root manifest differs from its cached copy. Files retain their contents with a final newline added where needed by the local writer.

`plugin-releases.json` records backend plugin IDs, release IDs, scope, versions, and complete published file inventories. `plugin-checksums.json` records SHA-256 hashes of the saved package files. These snapshots do not automatically refresh or install plugins.

## Configuration

- `site.json`: current Site metadata, MCP endpoint/OAuth resource, plugin association, access settings, and attached schedule summaries when available. Credentials and temporary tokens are omitted.
- `codex-project.toml`: the project-specific trust setting from the local Codex configuration, for reference. No plugin-specific settings were present in that file.
- `../.openai/hosting.json`: existing authoritative Site project ID and D1/R2 bindings (`DB`, `BUCKET`). Kept in its original location.
- Existing root build/package/TypeScript configuration, `scripts/`, `worker/`, `db/`, and `drizzle/` remain the source for this Site's development and storage schema.
- The original plugin's remote MCP server connection and OAuth configuration are in `../plugins/apoio-maternidade/mcp.json` and `.mcp.json`; its runtime README explains the included standalone runtime.

## Boundaries of this backup

This saves the three current plugin releases and available Site configuration, not historical releases. Live D1 records, R2 audio, remote MCP data, OAuth sessions, hosted environment variable values, and account-level automation definitions are not exported. Hosting infrastructure and separately hosted server deployment settings cannot be reconstructed from the plugin package alone. Account-wide Codex settings, authentication files, logs, and unrelated plugins are excluded.

The skills contain personal context; preserve the repository's intended private audience. The snapshot folders are not excluded by the project's `.gitignore`. Files are saved locally and have not been committed or pushed.
