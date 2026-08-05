# Liquid Glass Interactions Design

## Scope

Apply the supplied Liquid Glass visual and interaction specification only inside the dashboard shell rendered for `kalite@naturalclinic.com`. Preserve all data flow, API calls, form state, calculations, text, translations, and existing event handlers.

## Architecture

- `src/app/liquid-glass.css` owns the light theme and scopes every visual rule to `html[data-theme="light"]` plus `[data-liquid-glass="enabled"]`.
- `src/app/liquid-glass-dark.css` owns the dark theme with equivalent isolation.
- `public/api/liquid-ui.js` is a progressively enhanced, framework-free layer. The `/api/` static path uses the middleware's existing public exclusion without changing authentication logic; the script exits unless the enabled dashboard root exists.
- Existing React `DatePicker` and `SearchableSelect` components remain the source of behavior. They already provide the required calendar views, Escape handling, outside-click handling, and value propagation, so the theme styles their existing DOM instead of duplicating controls.
- Native `select` elements are enhanced by `liquid-ui.js`. The original element remains in the DOM as the value source, receives native `input` and `change` events, and can be restored if the test scope disappears.
- Navigation and radio groups receive one movable indicator only when a reliable active state can be detected. The script does not alter existing click handlers.

## Visual System

Use the exact mesh backgrounds, opacity levels, blur, saturation, edge, shadow, radius, easing, focus, table, typography, modal, and scrollbar values from the supplied specification. Geometry shared by both themes lives in a theme-independent section, while colors and optical treatment remain theme-scoped.

The current dashboard structure is mapped semantically: the floating sidebar and sticky header are primary glass panels; white cards and modal boxes become glass surfaces; form controls use the stronger input surface; table headers stay nearly opaque; and repeated metric/card surfaces receive spring hover treatment without applying backdrop blur to every table row.

## Interaction Safety

The enhancement script uses `mousedown` in capture phase for reliable dismissal, permits one floating control at a time, supports Escape, and repositions open select panels on resize and scroll. Mutation and resize observers are scoped and guarded against duplicate enhancement. Reduced-motion settings suppress all decorative animation.

## Verification

- Validate CSS brace balance and ensure theme selectors are scoped.
- Parse `public/api/liquid-ui.js` and verify it is inert without the enabled root.
- Run TypeScript checking and a production build.
- In a browser fixture using the real compiled CSS and script, inspect light and dark layouts, click the sliding indicator, open a native select, test outside-click/Escape dismissal, and inspect the existing date picker styling.
- Confirm source changes do not touch Supabase, APIs, stores, calculations, form submission, or translations.
