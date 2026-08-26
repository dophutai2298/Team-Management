# 01: Foundation app shell, providers, and API contract

**What to build:** Create the first usable application shell: routed app layout, HeroUI theme/provider setup, TanStack Query provider, VI/EN i18n foundation, dark/light mode switching, standard loading/error conventions, and the shared API response contract used by the rest of the MVP.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] The app has a dashboard shell with protected-area layout, navigation placeholders, and route-level loading/error boundaries.
- [ ] HeroUI is configured as the primary component provider and supports both dark and light mode.
- [ ] Users can switch between dark and light mode, and the selected theme persists across reloads.
- [ ] TanStack Query is available to Client Components through a single provider.
- [ ] VI/EN i18n foundation exists with Vietnamese as default and English fallback.
- [ ] API responses use a consistent success/error shape that client code can type against.
