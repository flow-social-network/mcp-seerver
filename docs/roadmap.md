# Implementation roadmap

## Stage 0 — Repository baseline
- [x] Create isolated feature branch.
- [x] Establish TypeScript package and initial protocol adapter.
- [x] Add baseline tests and security/architecture notes.
- [ ] Verify repository metadata, package-manager policy, and required license.
- [ ] Run local install, typecheck, tests, build, and protocol-level client smoke test.

## Stage 1 — Core contract audit
- [ ] Inventory NoteAgents Core routes, contracts, auth middleware, and service boundaries.
- [ ] Identify stable read-only endpoints and exact request/response schemas.
- [ ] Define caller identity propagation and project-scoped authorization.
- [ ] Record decisions in ADRs before implementing Core-connected tools.

## Stage 2 — Read-only integration
- [ ] Implement a typed, allowlisted Core API client with timeouts and response limits.
- [ ] Add health/readiness distinction and a real authenticated connectivity probe.
- [ ] Add tools only for verified Core endpoints; no placeholder data.
- [ ] Add contract and integration tests against a controlled Core test environment.

## Stage 3 — Resources and prompts
- [ ] Add stable resource URIs with project authorization and data redaction.
- [ ] Add engineering prompts that do not imply elevated permissions.
- [ ] Test prompt injection and access isolation.

## Stage 4 — Guarded mutations
- [ ] Specify approvals, idempotency, audit, rollback, and cancellation.
- [ ] Implement one narrow mutation at a time with negative security tests.
- [ ] Keep arbitrary shell and unrestricted filesystem tools out of scope.

## Stage 5 — Production readiness
- [ ] Decide whether Streamable HTTP is required; if so, implement TLS/auth/rate limits.
- [ ] Add CI, dependency/security scans, SBOM policy, and reproducible lockfile.
- [ ] Run protocol E2E tests using a real MCP client.
- [ ] Publish deployment, secrets, observability, incident, and rollback runbooks.
- [ ] Require reviewed CI evidence and deployment smoke test before release.

## Completion criteria

A successful build alone is insufficient. Release requires reproducible installation, green typecheck/unit/contract/integration/security/E2E checks, verified Core authentication and authorization, no fabricated data, documented operational procedures, and evidence from the target deployment.
