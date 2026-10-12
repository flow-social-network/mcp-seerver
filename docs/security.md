# Security requirements

## Current posture

The current branch implements only two read-only local diagnostics over STDIO. It has no Core API client, remote HTTP listener, database access, filesystem tools, Git mutations, or arbitrary command execution. The configured Core URL is reported as unverified.

## Required controls before adding capabilities

- **Authentication:** use a trusted MCP client boundary. For remote transport, validate credentials server-side, including issuer, audience, expiry, and required scopes. Do not treat an untrusted `x-user-id` header as authentication.
- **Authorization:** authorize every call against the actual user, project, and action. UI/client checks are not security boundaries.
- **SSRF:** do not expose generic URL fetching. Restrict configured service destinations and reject loopback/private/link-local/metadata destinations if any destination can be influenced by an untrusted caller.
- **Filesystem:** canonicalize paths, enforce workspace roots, reject traversal, check symlinks, bound reads and writes, and prevent access to secrets/configuration files.
- **Execution:** no arbitrary shell tool. If a narrowly scoped job runner is later approved, use fixed executable/argument allowlists, isolated execution, timeouts, cancellation, quotas, and explicit approval.
- **Input/output:** validate with schemas, cap request and response sizes, paginate lists, sanitize errors, and redact tokens, PII, and secret material.
- **Prompt injection:** treat resource contents, repository files, issues, and tool output as untrusted data—not instructions to override policy or grant capabilities.
- **Audit:** record actor, tool, project, decision, outcome, latency, and correlation ID without recording secrets or unnecessary personal data.
- **Supply chain:** commit a lockfile, run dependency and secret scanning, review dependency changes, and pin supported Node/SDK versions.
- **Operations:** rate limits, bounded concurrency, timeouts, structured stderr logs for STDIO, alerting, and a tested rollback plan.

## Release gate

Do not label the server production-ready until the controls above have been mapped to implementation evidence and automated tests. Each exposed tool needs positive, negative, and cross-project authorization tests.
