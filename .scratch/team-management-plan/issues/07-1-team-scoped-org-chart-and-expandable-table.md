# 07.1: Team-scoped organization chart and expandable reporting table

**What to build:** Improve the existing read-only Organization view by keeping the reporting table as the default view, adding hierarchical row expansion with TanStack Table, and adding a team-scoped organization chart using `@unicef/react-org-chart`.

**Blocked by:** 07: Team hierarchy and read-only organization view.

**Status:** ready-for-agent

## Organization table

- [x] Keep the existing reporting structure table as the default organization view.
- [x] Use TanStack Table expanding so employees with direct reports can expand/collapse their reporting subtree.
- [x] Show an expand/collapse control only for rows that have report children.
- [x] Preserve the current Person, Assignment, and Reports information.
- [x] Expanded rows are visually indented by hierarchy depth.
- [x] Expanding/collapsing rows must not change organization data or reporting assignments.
- [x] Existing organization authorization and team/subtree scope rules remain unchanged.

## Team organization chart

- [x] Add a Chart view for displaying the reporting hierarchy of one selected team.
- [x] Use `@unicef/react-org-chart` for the chart implementation:
  `https://github.com/unicef/react-org-chart`.
- [x] Add a team selector to the Chart view so the user can switch between teams they are allowed to view.
- [x] Clicking a team from the Organization UI should open/switch to the Chart view with that team selected.
- [x] The chart renders only organization data allowed by the existing authorization scope for the selected team.
- [x] Preserve the existing `reportsTo` relationships when converting organization data into the nested tree model required by the chart library.
- [x] If a selected team produces multiple top-level reporting roots, use a non-persisted synthetic team root for visualization only; do not modify domain data.
- [x] Each person node should show at minimum the employee name, assignment/role, team context, and direct-report count when available.
- [x] The chart remains read-only. Do not add drag-and-drop reassignment, manager editing, or team membership editing.
- [x] Support the library's basic pan and zoom behavior so larger teams remain usable.
- [x] Provide an empty state when the selected team has no visible members.

## View behavior

- [x] Users can switch between `Table` and `Chart` without navigating away from the Organization feature.
- [x] Table state and selected team should remain stable while switching views when practical.
- [x] Loading, empty, and error states should use the application's existing shared patterns.
- [x] The layout must remain usable on desktop and smaller screens; the chart area may scroll/pan instead of compressing nodes until unreadable.

## Data and implementation notes

- Reuse the existing `/api/organization` data and current team/subtree authorization rules where possible.
- Prefer a UI adapter that transforms existing organization resources into the nested `tree` structure expected by `@unicef/react-org-chart`; do not duplicate organization business logic in the component.
- For the TanStack Table hierarchy, derive child rows from the existing `reportsTo` relationship and use TanStack expanding APIs rather than manually rendering nested tables.
- The org-chart package is D3/SVG based and supports lazy-loaded children, pan, and zoom. Integrate it as a client-side component if required by the current Next.js rendering setup.
- Do not change unrelated employee, team, role, permission, or reporting behavior.

## Acceptance criteria

- [x] The Organization page still provides the existing reporting table.
- [x] Manager rows can expand/collapse their direct and nested reports through TanStack Table.
- [x] A user can open the Chart view from a team and see that team selected.
- [x] A user can change the selected team from the Chart view.
- [x] The chart correctly represents visible `reportsTo` relationships for the selected team.
- [x] Users cannot see employees outside their existing authorized organization scope.
- [x] No organization data can be edited from either the Table or Chart view.
- [x] Existing organization tests continue to pass, with additional coverage for table expansion, team selection, and chart data transformation.

## Implementation notes

- Kept `/api/organization` and its authorization boundary unchanged; all hierarchy adapters operate only on the visible response.
- Added cycle-safe reporting adapters for TanStack `subRows` and the UNICEF nested tree model.
- Pinned `@unicef/react-org-chart` to `0.1.0`, which retains native D3 pan/zoom without the vulnerable jsPDF dependency chain introduced by later releases.
- Browser smoke checks verified nonblank SVG rendering, native pan/zoom, no runtime errors, and no horizontal overflow at a 390px viewport.
