# 03: Auth session, registration, and pending access gate

**What to build:** Let employees register with company email, verify with OTP, log in, and land in a pending state until Admin approval unlocks the application.

**Blocked by:** 02: Shared InsForge integration and env contract.

**Status:** ready-for-agent

- [ ] Users can register with an allowed company email domain and submit an employee code claim.
- [ ] Email OTP verification moves the account into pending approval.
- [ ] Verified-but-unapproved users can log in but cannot access protected app features.
- [ ] Active users can access the app shell after authentication.
- [ ] Invalid domains, invalid OTPs, and blocked account states show friendly errors.
- [ ] Auth/session state flows through the shared actor/session access pattern.
