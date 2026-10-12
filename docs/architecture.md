# Architecture

## System boundary

```text
MCP client (IDE / AI Studio)
        | MCP JSON-RPC over STDIO
        v
DEEVO NoteAgents MCP adapter
        | explicit, authenticated Core API client (future stage)
        v
NoteAgents Core API
        | existing application services/contracts
        v
Existing persistence and agent runtime
```

The adapter owns protocol translation, input/output schemas, transport lifecycle, and protocol-level error mapping. Core owns business rules, persistence, project boundaries, user permissions, Git operations, and agent execution. The adapter must call documented Core APIs or a dedicated internal service interface; it must not access Core's database directly or duplicate business logic.

## Implemented tools

| Tool | Purpose | Side effects |
| --- | --- | --- |
| `noteagents.health` | Local adapter status | None |
| `noteagents.integration.status` | Core URL configuration status, explicitly unverified | None |

No project, file, Git, task, or agent data tool is advertised until a real contract, authorization model, and integration tests exist.

## Planned capability sequence

1. Read-only health and integration diagnostics.
2. Read-only project/task/agent data via existing Core API contracts.
3. Evidence and workspace read tools with strict project scoping and path controls.
4. Mutating tools only after permission checks, approvals, idempotency, audit, and rollback behavior are specified.
5. Streamable HTTP only after deployment authentication and transport controls are implemented.

## Decisions to record before production

- Supported MCP protocol and SDK versions, pinned in the lockfile.
- Identity propagation and service-to-service authentication.
- Per-tool permission scopes and project-level authorization.
- Output size limits, pagination, timeouts, cancellation, and retry semantics.
- Audit event schema, sensitive-data redaction, retention, and trace correlation.
- Versioning and compatibility rules for Core API contracts.
- Operational health checks, metrics, deployment strategy, and rollback.
