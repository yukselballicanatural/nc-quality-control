# Liquid Glass Interactions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the exact supplied Liquid Glass visual and interaction specification to the `kalite@naturalclinic.com` dashboard without changing application data or business behavior.

**Architecture:** Keep the two existing theme stylesheets isolated by `data-theme` and the existing user-specific dashboard marker. Add one progressive-enhancement script that no-ops outside that marker, styles existing React custom controls, and enhances only native selects and detectable segmented groups.

**Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS, plain browser JavaScript, CSS backdrop filters

---

### Task 1: Lock the theme scope and shared geometry

**Files:**
- Modify: `src/app/liquid-glass.css`
- Modify: `src/app/liquid-glass-dark.css`

- [ ] **Step 1: Add a static scope check that fails on unscoped visual selectors**

Run a Node script that reads both files and reports theme rules that do not include the matching `html[data-theme]` prefix, excluding shared `.seg-*` geometry and keyframes.

- [ ] **Step 2: Verify the current files fail the supplied-value comparison**

Compare the current duplicated refinement block against the supplied mesh, tokens, and timing values. Expected: FAIL because the appended light refinement changes the required background and surface values.

- [ ] **Step 3: Replace the light and dark files with one coherent rule set each**

Use the exact supplied tokens and timing values. Scope all visual selectors through `[data-liquid-glass="enabled"]`; keep only segment positioning geometry shared and theme-independent.

- [ ] **Step 4: Verify CSS braces and selector scope**

Run the brace and scope scripts. Expected: both stylesheets report balanced braces and no unscoped theme visuals.

### Task 2: Add progressive native-control enhancement

**Files:**
- Create: `public/api/liquid-ui.js`

- [ ] **Step 1: Create a browser fixture assertion before implementation**

The fixture must expect no generated elements without `[data-liquid-glass="enabled"]`, one trigger per native select inside scope, one panel open at a time, native `change` dispatch after selection, and one indicator per eligible group.

- [ ] **Step 2: Run the fixture before the script exists**

Expected: FAIL because `/api/liquid-ui.js` is missing and no controls are enhanced.

- [ ] **Step 3: Implement guarded enhancement**

Add duplicate guards, MutationObserver scanning, native select trigger/panel creation, capture-phase outside dismissal, Escape support, viewport flipping/repositioning, and segmented indicator sizing with font/load/resize remeasurement.

- [ ] **Step 4: Run the fixture again**

Expected: PASS for scope isolation, event propagation, dismissal, and indicator movement.

### Task 3: Load the script without changing application behavior

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Confirm the compiled page does not currently request `/api/liquid-ui.js`**

Expected: no script reference in the root layout.

- [ ] **Step 2: Add Next.js `Script` with `afterInteractive` strategy**

Keep the existing pre-paint theme script unchanged and load the progressive enhancement after React hydration.

- [ ] **Step 3: Run TypeScript checking**

Run `cmd /c npx tsc --noEmit`. Expected: exit code 0.

### Task 4: Production and visual verification

**Files:**
- Verify: `src/app/liquid-glass.css`
- Verify: `src/app/liquid-glass-dark.css`
- Verify: `public/api/liquid-ui.js`
- Verify: `src/app/layout.tsx`

- [ ] **Step 1: Build production output**

Run `cmd /c npm run build`. Expected: successful Next.js production build.

- [ ] **Step 2: Inspect both themes in the browser**

Use a dashboard fixture with the real compiled assets. Capture light and dark screenshots and inspect background mesh, sidebar/header/card glass, tables, controls, modals, and responsive layout.

- [ ] **Step 3: Exercise interactions**

Verify the indicator starts in place without animation, slides between items, native select panels flip and dismiss correctly, and existing React date/select controls remain functional and visually consistent.

- [ ] **Step 4: Audit the final diff**

Confirm no API, Supabase, store, scoring, submission, translation, or application state files changed.
