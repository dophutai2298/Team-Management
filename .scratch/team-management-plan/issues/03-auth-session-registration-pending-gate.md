# 03: Auth session, registration, and pending access gate

**What to build:** Let employees register with company email, verify with OTP, log in, and land in a pending state until Admin approval unlocks the application.

**Blocked by:** 02: Shared InsForge integration and env contract.

**Status:** resolved

- [ ] Users can register with an allowed company email domain and submit an employee code claim.
- [ ] Email OTP verification moves the account into pending approval.
- [ ] Verified-but-unapproved users can log in but cannot access protected app features.
- [ ] Active users can access the app shell after authentication.
- [ ] Invalid domains, invalid OTPs, and blocked account states show friendly errors.
- [ ] Auth/session state flows through the shared actor/session access pattern.

## Answer

Implemented the InsForge-backed registration, OTP verification, and account access gate.

- Added InsForge migrations for allowed email domains, durable registration claims, and employee lifecycle drafts.
- Added Next.js BFF auth routes for registration, verification, sign-in, session lookup, and sign-out with SSR cookie handling.
- Added active, pending, blocked, and incomplete-registration gates using the shared `getCurrentActor()` access pattern.
- Added client registration, verification, login, pending, and account-status screens using TanStack Query mutations.
- Verified with typecheck, lint, Vitest, Playwright, production build, InsForge migration history, and API checks.
