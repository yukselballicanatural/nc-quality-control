# Aqua Liquid Glass Dashboard Design

## Goal

Refine the test-only Liquid Glass experience for `kalite@naturalclinic.com` into a polished Aqua Glass dashboard. The dashboard should have a clearer information hierarchy, readable navigation, and consistent high-density glass popovers while preserving all existing data, filters, API calls, labels, and user workflows.

## Scope

- Redesign the dashboard layout and visual hierarchy.
- Improve the open-theme sidebar contrast and active navigation treatment.
- Give date-picker, notification, select, and similar floating panels a shared dense-glass treatment.
- Preserve the existing light/dark theme split and the user-specific Liquid Glass scope.
- Keep all business logic, data fetching, calculations, permissions, translations, and event behavior unchanged.

## Visual Direction

The selected direction is **Aqua Glass**:

- A cool mesh background using ice blue, sky blue, and restrained aqua highlights.
- Low-opacity glass for large structural surfaces so the mesh remains visible.
- More opaque frosted glass for controls and floating panels so content behind them cannot compete with foreground text.
- Natural Clinic green is reserved for selected states, positive metrics, focus rings, and primary actions.
- Dark navy is the primary open-theme text color.
- Panels use fine light edges, a top-edge sheen, and two-layer soft shadows.
- Cards never scale on hover. Hover feedback is limited to subtle border, light, and shadow changes.

## Dashboard Layout

### Filter Rail

The dashboard filters become a single slim floating glass toolbar at the top of the content area. Controls retain their current behavior and labels. On narrower screens, the controls wrap predictably instead of overflowing.

### KPI Region

The KPI region uses asymmetric hierarchy rather than five equal cards:

- The primary quality score receives the largest visual weight.
- Supporting KPIs are more compact and grouped around the primary metric.
- Large numeric values use tabular figures and high contrast.
- Labels remain small, bold, and restrained.

### Analytics Region

The middle of the dashboard uses a balanced two-column analytics composition:

- The most important performance chart receives the wider column.
- Distribution and channel analysis use narrower supporting panels.
- Existing chart data and interactions remain unchanged.
- Nested card framing is removed. Inner content is separated by spacing, tonal surfaces, and fine dividers.

### Detail Region

Tables, recent evaluations, and training-exam information appear in calm, single-layer glass panels. Table headers remain readable and sticky where already supported. Table containers never move or scale on hover.

## Sidebar

In the light theme, the sidebar becomes a slightly darker blue-tinted glass slab so it remains visibly separate from the page mesh.

- Inactive navigation text uses high-contrast navy.
- Icons use a coordinated blue-gray tone with sufficient contrast.
- Hover uses a restrained white glass wash.
- The active item uses a clearly visible white/aqua illuminated capsule with strong text and icon contrast.
- Profile information uses its own subtle inset glass surface.
- Mobile uses the same visual language in the existing drawer behavior.

The dark-theme sidebar keeps its current dark glass foundation but receives matching contrast and active-state discipline.

## Floating Glass Surfaces

Date pickers, notifications, generated select panels, and comparable popovers share one dense-glass recipe.

### Light Theme

- Surface opacity target: approximately 88-92%.
- Strong blur and saturation preserve a glass edge without exposing background text.
- A bright hairline edge and top sheen establish thickness.
- A broad two-stage shadow separates the panel from the dashboard.
- Internal rows and calendar cells remain mostly transparent, using only restrained hover fills.

### Dark Theme

- A near-opaque navy glass surface replaces white or transparent popovers.
- Text remains high contrast.
- Aqua is used for selected dates, focus, and hover states.
- The same elevation and radius system is retained.

Floating panels must remain within the viewport on desktop and mobile. Existing open/close and selection behavior is unchanged.

## Motion

- Page entry, active navigation indicator, and popover opening may animate.
- Structural cards and tables do not scale or translate on hover.
- Hover transitions are limited to 150-250ms light, border, and shadow changes.
- `prefers-reduced-motion: reduce` disables decorative movement.

## Responsive Behavior

- KPI content collapses to two columns on small screens and one column when space becomes too narrow.
- Analytics panels become a single column on mobile.
- Tables retain horizontal scrolling inside their own isolated containers.
- The filter toolbar wraps into readable rows.
- Date and notification panels use the available viewport width and do not clip against screen edges.
- The mobile sidebar remains an overlay drawer and preserves readable contrast.

## Implementation Boundaries

- Dashboard JSX may be rearranged to establish the approved hierarchy.
- CSS classes may be added or adjusted only where required for stable visual targeting.
- No API, Supabase, data transformation, calculation, permission, translation, or state behavior may change.
- No visible labels or content may be invented or renamed.
- Liquid Glass remains scoped to the existing test user until a separate rollout is approved.
- Both theme files remain independent: light rules stay in `liquid-glass.css`, dark rules stay in `liquid-glass-dark.css`.

## Verification

- Production build and TypeScript checks pass.
- CSS parses successfully and braces are balanced.
- Open and dark themes are checked separately.
- Desktop and mobile layouts are checked for clipping, overlap, unreadable text, and scroll traps.
- Sidebar inactive, hover, and active states are readable in the light theme.
- Dashboard cards do not move or scale on hover.
- Date picker and notification panels obscure background text while retaining a visible glass character.
- Date selection, date clearing, notification navigation, filters, tables, and theme switching retain their existing behavior.
- Browser console contains no relevant runtime errors.

