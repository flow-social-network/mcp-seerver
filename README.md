# DEEVO / NoteAgents MCP Server

A protocol adapter that exposes explicitly implemented NoteAgents capabilities through the Model Context Protocol (MCP). Business logic, authorization decisions, data access, and agent execution remain owned by NoteAgents Core; this repository must not clone those responsibilities.

## Current implementation

- Official TypeScript MCP SDK, using MCP over **STDIO**.
- `noteagents.health`: reports the local adapter's version/runtime.
- `noteagents.integration.status`: reports whether `NOTEAGENTS_CORE_URL` is configured; it explicitly does not claim the Core API is reachable or authenticated.
- Strict TypeScript configuration and unit tests for the initial health/configuration behavior.
- No write tools, arbitrary shell execution, filesystem access, credentials, or Core mutations are exposed in this foundation.

The initial repository was an empty shell with only a README. This branch establishes the smallest runnable protocol adapter; it is not yet a complete integration with NoteAgents Core and must not be represented as production-ready.

## Requirements

- Node.js 20.11 or newer
- npm 10 or newer

## Local setup

```bash
npm install
cp .env.example .env
npm run typecheck
npm test
npm run build
npm start
```

MCP STDIO clients launch `node dist/index.js` as a subprocess. The client configuration should use an absolute path to the generated entrypoint and the working directory of this repository. Do not send human-readable logs to stdout: stdout is reserved for MCP protocol frames; diagnostics belong on stderr.

For development:

```bash
npm run dev
```

## Configuration

- `MCP_TRANSPORT`: currently documentation-only; STDIO is the only implemented transport.
- `NOTEAGENTS_CORE_URL`: optional absolute Core API URL. HTTPS is required except for loopback development URLs. A URL is only configuration, not a connectivity check or authentication.
- `LOG_LEVEL`: reserved for structured logging when logging configuration is implemented.

Do not commit secrets or place access tokens in tool arguments, prompts, resources, source control, or logs.

## Architecture and security boundaries

1. This service is a protocol adapter, not a replacement for Core.
2. Add tools only when backed by a real Core contract and integration test. Do not return fabricated sample records as if they were real.
3. Every future tool must validate input, authenticate the caller, enforce server-side user/project authorization, apply bounded timeouts and output limits, redact sensitive data, and write an audit record where applicable.
4. Read-only capabilities come before mutation tools. File writes, Git mutations, task execution, and agent execution require explicit permissions and approval policy.
5. Never trust identity supplied only through an arbitrary header. Never expose unrestricted shell commands or unbounded filesystem paths.
6. HTTP transport is not implemented. Before enabling it, define TLS termination, authentication/OAuth, token audience and scope validation, rate limits, origin policy, request limits, and deployment-specific threat controls.
7. Core API requests must use an explicit endpoint allowlist and must not become a generic URL fetcher; reject private/link-local destinations when a remote endpoint can be user-influenced.

See [docs/requirements-audit.md](docs/requirements-audit.md) for the evidence-based requirements matrix and blockers; also see [docs/architecture.md](docs/architecture.md), [docs/security.md](docs/security.md), and [docs/roadmap.md](docs/roadmap.md).

## Verification status

Code has been committed to the feature branch. A green CI run, live Core connectivity, authenticated client integration, and production deployment have **not** been verified by this README. Review the branch and run the checks before merging.
