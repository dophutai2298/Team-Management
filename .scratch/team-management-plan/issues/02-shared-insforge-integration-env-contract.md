# 02: Shared InsForge integration and env contract

**What to build:** Add the shared InsForge integration layer that every feature will use, with reusable browser, server user-scoped, and server-only admin clients instead of creating new clients inside each query.

**Blocked by:** 01: Foundation app shell, providers, and API contract.

**Status:** ready-for-agent

- [ ] Environment variables required for InsForge are documented and validated at startup.
- [ ] Browser, server user-scoped, and server-only admin InsForge clients are separated clearly.
- [ ] Server-only credentials are never exposed to the client bundle.
- [ ] Repository/service code can reuse shared InsForge clients without repeated initialization.
- [ ] A health-check or equivalent smoke path verifies the app can reach the configured backend.
