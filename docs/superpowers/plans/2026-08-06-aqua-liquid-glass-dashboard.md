# Aqua Liquid Glass Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the approved balanced Aqua Glass dashboard layout with a readable light-theme sidebar and dense glass date/notification popovers, without changing data or behavior.

**Architecture:** Keep all dashboard data and event logic in place, but add stable presentation classes and reorder existing visual regions in `DashboardContent.tsx`. Implement appearance entirely in the independent light/dark Liquid Glass stylesheets, scoped beneath the existing test-user attribute. Add a source-level verification script that protects the scope, layout hooks, no-scale rule, and dense-popover requirements.

**Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS, Recharts, Framer Motion, PostCSS, Node.js assertions

---

### Task 1: Add Aqua Glass Regression Verification

**Files:**
- Create: `scripts/verify-aqua-dashboard.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write the failing verification script**

Create a Node script that reads `DashboardContent.tsx`, `liquid-glass.css`, and `liquid-glass-dark.css`. Assert that:

```js
assert.match(dashboard, /className="aqua-dashboard/)
assert.match(dashboard, /aqua-filter-rail/)
assert.match(dashboard, /aqua-kpi-grid/)
assert.match(dashboard, /aqua-analytics-primary/)
assert.match(lightCss, /\.aqua-kpi-grid/)
assert.match(lightCss, /\.aqua-popover/)
assert.match(lightCss, /aside nav a[\s\S]*color:/)
assert.doesNotMatch(lightCss, /aqua-dashboard[\s\S]*:hover[^{]*\{[^}]*scale\(/)
assert.match(darkCss, /\.aqua-kpi-grid/)
```

The script must print `Aqua dashboard verification passed.` only when every assertion succeeds.

- [ ] **Step 2: Add the package command**

Add this script to `package.json`:

```json
"verify:aqua-dashboard": "node scripts/verify-aqua-dashboard.mjs"
```

- [ ] **Step 3: Run the verifier and confirm RED**

Run: `npm run verify:aqua-dashboard`

Expected: FAIL because the approved semantic hooks and complete Aqua dashboard styles are not implemented yet.

- [ ] **Step 4: Commit the failing verification**

```bash
git add package.json scripts/verify-aqua-dashboard.mjs
git commit -m "test: add aqua dashboard visual regression checks"
```

### Task 2: Establish the Balanced Dashboard Hierarchy

**Files:**
- Modify: `src/components/dashboard/DashboardContent.tsx:267-740`
- Test: `scripts/verify-aqua-dashboard.mjs`

- [ ] **Step 1: Add stable presentation hooks**

Add presentation-only classes while preserving props, state, handlers, and visible text:

```tsx
<div className={`aqua-dashboard space-y-5 ...`}>
<div className="aqua-filter-rail ...">
<div className="aqua-kpi-grid ...">
<div className="aqua-secondary-grid ...">
<div className="aqua-insight-grid ...">
<div className="aqua-analytics-primary ...">
<div className="aqua-analytics-secondary ...">
<div className="aqua-detail-grid ...">
```

Give reusable visual units stable classes:

```tsx
<div className="aqua-stat-card ...">
<section className={`aqua-panel ...`}>
<div className="aqua-insight-card ...">
```

- [ ] **Step 2: Reorder the top KPI data without changing values**

Place average score first so CSS can give it primary visual weight, followed by total evaluations, pass rate, won rate, and exam pass rate. Keep each existing label, value, sublabel, icon, and tone unchanged.

- [ ] **Step 3: Move detail tables below analytics**

Keep the existing component calls intact, but move `RecentEvaluationsPanel` after the two analytics regions. Keep consultant ranking, evaluator performance, and training exam sections in the lower detail region.

- [ ] **Step 4: Add a stable date-popover class**

In `src/components/ui/DatePicker.tsx`, add `aqua-popover aqua-date-popover` to the existing calendar panel class list. Do not alter state, date calculations, event handlers, or visible copy.

- [ ] **Step 5: Add a stable notification class**

In `src/components/dashboard/Sidebar.tsx`, add `aqua-popover aqua-notification-popover` to the existing notification panel class list. Do not alter notification queries, navigation, state, or visible copy.

- [ ] **Step 6: Run TypeScript and inspect the diff**

Run: `npx tsc --noEmit`

Expected: exit 0.

Run: `git diff -- src/components/dashboard/DashboardContent.tsx src/components/ui/DatePicker.tsx src/components/dashboard/Sidebar.tsx`

Expected: presentation hooks and JSX ordering only; no changed handler bodies, queries, calculations, or text.

- [ ] **Step 7: Commit the layout hierarchy**

```bash
git add src/components/dashboard/DashboardContent.tsx src/components/ui/DatePicker.tsx src/components/dashboard/Sidebar.tsx
git commit -m "refactor: establish balanced aqua dashboard layout"
```

### Task 3: Implement the Light Aqua Glass System

**Files:**
- Modify: `src/app/liquid-glass.css`
- Test: `scripts/verify-aqua-dashboard.mjs`

- [ ] **Step 1: Strengthen the open-theme sidebar**

Use a readable pale blue glass slab and explicit navigation contrast:

```css
html[data-theme="light"] [data-liquid-glass="enabled"] aside {
  background: linear-gradient(155deg, rgba(224, 240, 255, .82), rgba(204, 226, 252, .68)) !important;
}
html[data-theme="light"] [data-liquid-glass="enabled"] aside nav a {
  color: #1d2b45 !important;
  text-shadow: 0 1px 0 rgba(255, 255, 255, .42);
}
html[data-theme="light"] [data-liquid-glass="enabled"] aside .seg-indicator {
  background: linear-gradient(135deg, rgba(255, 255, 255, .92), rgba(191, 239, 247, .74));
}
```

Make active text/icons navy, inactive icons blue-gray, and hover rows visibly brighter without scaling.

- [ ] **Step 2: Style the dashboard hierarchy**

Implement responsive grid rules under `.aqua-dashboard`:

```css
.aqua-kpi-grid { grid-template-columns: repeat(6, minmax(0, 1fr)); }
.aqua-kpi-grid > :first-child { grid-column: span 2; grid-row: span 2; }
.aqua-kpi-grid > :not(:first-child) { grid-column: span 2; }
.aqua-analytics-primary { grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr); }
.aqua-analytics-secondary { grid-template-columns: repeat(3, minmax(0, 1fr)); }
```

Add breakpoint fallbacks for tablet and mobile. Use a low-opacity structural glass surface, hairline edge, top sheen, and two-stage shadows. Cards may change border and shadow on hover but must not transform.

- [ ] **Step 3: Style dense floating glass**

Apply the shared light recipe to `.aqua-popover`, generated select panels, and comparable dropdowns:

```css
background: rgba(247, 251, 255, .91) !important;
backdrop-filter: blur(48px) saturate(190%);
border: 1px solid rgba(255, 255, 255, .78) !important;
box-shadow: 0 10px 28px rgba(23, 43, 99, .16),
            0 34px 80px -18px rgba(23, 43, 99, .34),
            var(--sheen) !important;
```

Ensure calendar cells, notification rows, titles, and muted text remain readable. Prevent background text from showing through.

- [ ] **Step 4: Run the verifier**

Run: `npm run verify:aqua-dashboard`

Expected: still FAIL only if the dark theme requirements are not yet implemented.

- [ ] **Step 5: Parse the CSS**

Run:

```bash
node -e "const fs=require('fs'),postcss=require('postcss');postcss.parse(fs.readFileSync('src/app/liquid-glass.css','utf8'))"
```

Expected: exit 0.

- [ ] **Step 6: Commit the light theme**

```bash
git add src/app/liquid-glass.css
git commit -m "style: implement aqua glass dashboard light theme"
```

### Task 4: Implement the Dark Aqua Glass Companion

**Files:**
- Modify: `src/app/liquid-glass-dark.css`
- Test: `scripts/verify-aqua-dashboard.mjs`

- [ ] **Step 1: Mirror geometry without copying light colors**

Add the same `.aqua-dashboard` grid geometry and breakpoints. Use dark tokens for surfaces, edges, shadows, and text. Keep existing application semantic colors unless contrast requires a scoped correction.

- [ ] **Step 2: Implement dense dark popovers**

Use the shared popover hooks:

```css
html[data-theme="dark"] [data-liquid-glass="enabled"] .aqua-popover {
  background: rgba(12, 19, 33, .93) !important;
  border: 1px solid rgba(255, 255, 255, .18) !important;
  backdrop-filter: blur(48px) saturate(170%);
  box-shadow: var(--d-sh-3), var(--d-sheen) !important;
}
```

Ensure date cells, notification rows, and muted text remain readable.

- [ ] **Step 3: Run GREEN verification**

Run: `npm run verify:aqua-dashboard`

Expected: `Aqua dashboard verification passed.`

- [ ] **Step 4: Parse both theme files**

Run:

```bash
node -e "const fs=require('fs'),postcss=require('postcss');for(const f of ['src/app/liquid-glass.css','src/app/liquid-glass-dark.css'])postcss.parse(fs.readFileSync(f,'utf8'),{from:f})"
```

Expected: exit 0.

- [ ] **Step 5: Commit the dark theme**

```bash
git add src/app/liquid-glass-dark.css
git commit -m "style: complete aqua glass dashboard dark theme"
```

### Task 5: Rendered QA and Final Verification

**Files:**
- Modify only if QA reveals a mismatch in the approved scope.

- [ ] **Step 1: Run full static verification**

Run:

```bash
npm run verify:aqua-dashboard
npm run build
npx tsc --noEmit
git diff --check
```

Expected: all commands exit 0. Next.js may report the existing non-fatal webpack cache warning.

- [ ] **Step 2: Verify rendered desktop behavior**

Open the authenticated dashboard as `kalite@naturalclinic.com` at desktop width. Confirm sidebar inactive/active/hover contrast, asymmetric KPI hierarchy, analytics-before-tables ordering, stationary card hover, dense date glass, dense notification glass, and no console errors.

- [ ] **Step 3: Verify rendered mobile behavior**

Check a mobile viewport. Confirm the sidebar drawer remains readable, KPI and analytics grids collapse correctly, filters wrap, tables scroll internally, and date/notification panels remain within the viewport.

- [ ] **Step 4: Verify dark theme**

Repeat the date, notification, dashboard hierarchy, and table checks in dark mode.

- [ ] **Step 5: Audit behavior preservation**

Exercise date selection, date clearing, notification navigation, theme switching, and an existing dashboard link. Confirm each produces the same state or route transition as before.

- [ ] **Step 6: Commit QA corrections if required**

```bash
git add src/app/liquid-glass.css src/app/liquid-glass-dark.css src/components/dashboard/DashboardContent.tsx src/components/dashboard/Sidebar.tsx src/components/ui/DatePicker.tsx scripts/verify-aqua-dashboard.mjs package.json
git commit -m "fix: polish aqua dashboard responsive states"
```

