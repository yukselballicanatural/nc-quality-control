/**
 * Liquid Glass design-system verification (DESIGN_SYSTEM.md §15-10).
 *
 * Checks the source, not the rendered pixels: are the tokens the design system
 * specifies actually present, and — most importantly — is every visual rule
 * still fenced inside the test-user scope so the live UI cannot change for
 * anyone else.
 *
 * Run: npm run verify:liquid-glass
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')

const light = read('src/app/liquid-glass.css')
const dark = read('src/app/liquid-glass-dark.css')

// Comment-free copies, for checks that must look at declarations only —
// otherwise prose mentioning a banned function reads as a violation.
const stripComments = css => css.replace(/\/\*[\s\S]*?\*\//g, '')
const lightCode = stripComments(light)
const darkCode = stripComments(dark)
const sidebar = read('src/components/dashboard/Sidebar.tsx')
const dashboard = read('src/components/dashboard/DashboardContent.tsx')
const layout = read('src/app/layout.tsx')

const SCOPE = '[data-liquid-glass="enabled"]'

// ─── Scope containment — the rule that protects production ──────────────────
//
// Every declaration block must be reachable only through the scope attribute,
// the theme-token roots, the geometry-only helper classes, or the JS-generated
// dropdown panel (which liquid-ui.js creates solely inside the scope).
{
  const ALLOWED_UNSCOPED = [
    /^html\[data-theme="(light|dark)"\]$/, // token roots: variables only
    /^html\[data-theme="(light|dark)"\]:has\(\[data-liquid-glass="enabled"\]\)/,
    /^html\[data-theme="(light|dark)"\]\s+body:has\(\[data-liquid-glass="enabled"\]\)/,
    /^html\[data-theme="(light|dark)"\]\s+\.lq-panel\[data-liquid-owned="true"\]/,
    /^html\[data-theme="dark"\]\s+\.lg-theme-toggle/, // icon swap, display only
    /^\.lg-theme-toggle/, // icon swap, display only
    /^\.seg-container/,
    /^\.seg-indicator/,
    /^\.lq-(native-source|trigger|trigger-label|trigger-chev|panel|panel-search|panel-search-wrap|opt)/,
  ]

  // Split a selector list on top-level commas only: the commas inside
  // :is(section, article, div) and rgba(...) are not separators.
  const splitSelectorList = list => {
    const out = []
    let depth = 0
    let current = ''
    for (const ch of list) {
      if (ch === '(' || ch === '[') depth++
      else if (ch === ')' || ch === ']') depth--
      if (ch === ',' && depth === 0) {
        out.push(current)
        current = ''
        continue
      }
      current += ch
    }
    out.push(current)
    return out
  }

  for (const [file, css] of [['liquid-glass.css', light], ['liquid-glass-dark.css', dark]]) {
    const body = css.replace(/\/\*[\s\S]*?\*\//g, '')

    // Each `}`-delimited chunk ends with one declaration block. Splitting it on
    // `{` leaves the selector list second-from-last and the declarations last,
    // which holds for plain rules and for rules nested inside an at-rule.
    const selectors = body
      .split('}')
      .map(chunk => chunk.split('{'))
      .filter(parts => parts.length >= 2)
      .map(parts => parts[parts.length - 2])
      .flatMap(splitSelectorList)
      .map(sel => sel.trim())
      .filter(Boolean)
      // Drop at-rule preludes and keyframe stops.
      .filter(sel => !sel.startsWith('@') && !/^(from|to|[\d.]+%)$/.test(sel))

    for (const sel of selectors) {
      const scoped =
        sel.includes(SCOPE) || ALLOWED_UNSCOPED.some(re => re.test(sel))
      assert.ok(
        scoped,
        `${file}: selector escapes the test-user scope → "${sel}"`
      )
    }

    assert.ok(selectors.length > 100, `${file}: only ${selectors.length} selectors parsed — the scope check is not actually reading the file`)
  }
}

// ─── §2.1 / §2.2 — raw glass physics tokens ────────────────────────────────
for (const token of ['--g-1', '--g-2', '--g-3', '--g-hover', '--edge', '--sheen', '--sh-1', '--sh-2', '--sh-3', '--blur', '--sat', '--ink', '--r-lg', '--r-md', '--r-sm', '--ease', '--spring']) {
  assert.match(light, new RegExp(`\\${token}:`), `light: missing token ${token}`)
}
for (const token of ['--d-1', '--d-2', '--d-3', '--d-hover', '--d-strong', '--d-edge', '--d-sheen', '--d-sh-1', '--d-sh-2', '--d-sh-3', '--d-blur', '--d-sat', '--d-ink', '--d-sel', '--d-r-lg', '--d-ease', '--d-spring']) {
  assert.match(dark, new RegExp(`\\${token}:`), `dark: missing token ${token}`)
}

// Radius and easing are identical across themes (§2.2 symmetry rule).
for (const [pair, value] of [[['--r-lg', '--d-r-lg'], '26px'], [['--r-md', '--d-r-md'], '20px'], [['--r-sm', '--d-r-sm'], '14px']]) {
  assert.match(light, new RegExp(`${pair[0]}:\\s*${value}`), `light: ${pair[0]} must be ${value}`)
  assert.match(dark, new RegExp(`${pair[1]}:\\s*${value}`), `dark: ${pair[1]} must be ${value}`)
}
assert.match(light, /--ease:\s*cubic-bezier\(\.22, 1, \.36, 1\)/)
assert.match(light, /--spring:\s*cubic-bezier\(\.34, 1\.4, \.56, 1\)/)
assert.match(dark, /--d-ease:\s*cubic-bezier\(\.22, 1, \.36, 1\)/)
assert.match(dark, /--d-spring:\s*cubic-bezier\(\.34, 1\.4, \.56, 1\)/)

// ─── §2.3 — semantic token layer, same names in both themes ────────────────
const SEMANTIC = ['--tm-surface', '--tm-hover', '--tm-edge', '--tm-ink', '--tm-ink-2', '--tm-ink-3', '--tm-danger', '--tm-warn', '--tm-info', '--tm-ok', '--tm-accent']
for (const token of SEMANTIC) {
  assert.match(light, new RegExp(`\\${token}:`), `light: missing semantic token ${token}`)
  assert.match(dark, new RegExp(`\\${token}:`), `dark: missing semantic token ${token}`)
}

// ─── §3 — mesh gradient: glass needs live colour behind it ─────────────────
for (const [name, css] of [['light', light], ['dark', dark]]) {
  const meshCount = (css.match(/radial-gradient\(\d+px \d+px at /g) ?? []).length
  assert.ok(meshCount >= 5, `${name}: mesh background needs >= 5 radial gradients, found ${meshCount}`)
}

// ─── §2.4 — contrast floor, measured not eyeballed ─────────────────────────
{
  const lum = hex => {
    const v = [1, 3, 5]
      .map(i => parseInt(hex.substr(i, 2), 16) / 255)
      .map(c => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)))
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]
  }
  const ratio = (a, b) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p)
    return (x + 0.05) / (y + 0.05)
  }

  // The rule the design system actually derives (§2.4): in the dark theme
  // --tm-ink-2 clears AAA and may carry small type, while --tm-ink-3 only
  // clears AA — which is exactly why small type is barred from it.
  const darkGround = '#111827'
  assert.ok(ratio('#a9b4c8', darkGround) >= 7, 'dark --tm-ink-2 must clear AAA (7:1) — it carries the small type')
  assert.ok(ratio('#78849c', darkGround) < 7, 'dark --tm-ink-3 unexpectedly clears AAA; re-check the §2.4 small-type ban')
  assert.ok(ratio('#78849c', darkGround) >= 4.5, 'dark --tm-ink-3 must at least clear AA for normal type')

  // Light theme, measured against the palest mesh ground it can sit on.
  const lightGround = '#cfdcfa'
  assert.ok(ratio('#12141a', lightGround) >= 7, 'light --tm-ink must clear AAA (7:1)')
  assert.ok(ratio('#4b5364', lightGround) >= 4.5, 'light --tm-ink-2 must clear AA (4.5:1)')
}

// ─── §5 — collapsible sidebar, gated to the test user ──────────────────────
assert.match(sidebar, /const canCollapse = isLiquidGlassUser/, 'sidebar: collapse must be gated to the glass test user')
assert.match(sidebar, /data-collapsed=\{isRailMode \? 'true' : undefined\}/, 'sidebar: rail state must ride on data-collapsed')
// The whole glass sidebar body is one branch of this ternary; the other branch
// is the untouched original layout every non-gated account keeps rendering.
assert.match(sidebar, /\{canCollapse \? \(/, 'sidebar: the glass layout must sit behind the canCollapse gate')
assert.match(sidebar, /Original layout — unchanged for every other account/, 'sidebar: the non-glass layout branch must still exist')
assert.match(sidebar, /window\.innerWidth <= 900/, 'sidebar: narrow widths must start collapsed (§5.1)')
for (const css of [light, dark]) {
  assert.match(css, /aside\[data-collapsed="true"\] \{ width: 56px !important; \}/, 'rail width must be 56px (§5.1)')
  assert.match(css, /:has\(aside\[data-collapsed="true"\]\) \.md\\:ml-64/, 'main content must reflow when the sidebar collapses')
}

// The nav label is hidden by CSS, so the accessible name has to come back as a
// tooltip in rail mode (§5.3) — and must NOT appear in full mode, where it
// would be a behaviour change for the shared component.
assert.match(sidebar, /title=\{isRailMode \? item\.label : undefined\}/, 'sidebar: rail nav needs title tooltips, full mode must not')

// ─── Theme switch owns no second theme system ──────────────────────────────
//
// The app boots its theme from the `app_theme` key plus the `data-theme`
// attribute (see the inline script in app/layout.tsx). The switcher must drive
// exactly that, not introduce a second owner such as next-themes, which would
// fight the boot script on a live system.
{
  const switcher = read('src/components/ui/CinematicThemeSwitcher.tsx')
  assert.match(sidebar, /CinematicThemeSwitcher/, 'sidebar: appearance row must use the cinematic switcher')
  assert.match(switcher, /localStorage\.setItem\('app_theme'/, 'switcher must persist to the existing app_theme key')
  assert.match(switcher, /setAttribute\('data-theme'/, 'switcher must drive the existing data-theme attribute')
  // Inspect imports only — prose naming a banned package is not a violation.
  const importsOf = src => src.match(/^\s*import[\s\S]*?from\s+'[^']+'/gm) ?? []

  assert.ok(
    !importsOf(switcher).some(line => line.includes('next-themes')),
    'switcher must not introduce a second theme owner'
  )

  // Both animation-library entry points resolve to the same installed package;
  // importing `motion` as well would ship a duplicate engine.
  for (const file of ['src/components/ui/CinematicThemeSwitcher.tsx', 'src/components/ui/AnimatedLogOutIcon.tsx']) {
    assert.ok(
      !importsOf(read(file)).some(line => /'motion(\/react)?'/.test(line)),
      `${file}: use the installed framer-motion, not a duplicate engine`
    )
  }
}

// ─── §6.4 — exactly one primary-button look ────────────────────────────────
for (const [name, css] of [['light', light], ['dark', dark]]) {
  assert.match(css, /bg-\[#1B4332\][\s\S]{0,600}linear-gradient\(150deg/, `${name}: primary buttons must fold into the single gradient look`)
  assert.match(css, /inset: 0 0 52% 0/, `${name}: primary button needs the upper-half sheen layer`)
  // Brand-tint utilities (bg-[#1B4332]/10 etc.) are chips and icon wells, not
  // buttons — they must stay excluded or they turn into solid teal blocks.
  assert.match(css, /:not\(\[class\*="bg-\[#1B4332\]\/"\]\)/, `${name}: brand-tint utilities must be excluded from the primary treatment`)
}

// ─── §10 — KPI glow, and no color-mix() on anything load-bearing ───────────
assert.match(dashboard, /data-tone=\{tone\}/, 'dashboard: KPI tiles must expose their tone for the glow mapping')
assert.match(dashboard, /className="lg-kpi /, 'dashboard: KPI tiles need the lg-kpi hook')
for (const [name, css] of [['light', lightCode], ['dark', darkCode]]) {
  for (const tone of ['green', 'blue', 'amber', 'red', 'slate', 'purple']) {
    assert.match(css, new RegExp(`\\.lg-kpi\\[data-tone="${tone}"\\]`), `${name}: no glow mapped for tone "${tone}"`)
  }
  assert.doesNotMatch(css, /color-mix\(/, `${name}: color-mix() blanks the element where unsupported — use explicit rgba (§10)`)
}

// ─── §4 — large panels must not scale: it blurs charts and jitters sticky
// table headers. Only compact tiles get the lift.
for (const [name, css] of [['light', light], ['dark', dark]]) {
  assert.match(css, /\.lg-kpi:hover \{[\s\S]{0,200}transform: translateY\(-3px\) scale\(1\.012\)/, `${name}: compact tiles must take the documented lift`)
  assert.match(css, /:has\(> table\):hover \{ transform: none !important; \}|:has\(table\):hover,[\s\S]{0,200}transform: none !important/, `${name}: table panels must stay stationary on hover`)
}

// ─── State must never be sniffed from a Tailwind class name ────────────────
//
// This one bug produced three separate visual failures: every sidebar row went
// white-on-white, and every calendar day rendered as "selected". The cause is
// that Tailwind writes its variants into the class NAME — an inactive nav row
// carries `hover:bg-white/8` and `hover:text-white`, and an unselected day
// carries `hover:bg-[#1B4332]/8`. So [class*="bg-white"] matches the inactive
// element just as well as the active one. State comes from data-active (nav) or
// from the gradient's from- colour (calendar), never from a bare bg- substring.
{
  assert.match(sidebar, /data-active=\{active \? 'true' : undefined\}/, 'sidebar: nav rows must carry an explicit data-active marker')

  for (const [name, css] of [['light', lightCode], ['dark', darkCode]]) {
    assert.doesNotMatch(
      css,
      /aside nav[^{]*a\[class\*="bg-white"\]/,
      `${name}: nav state must not be matched via the bg-white class substring`
    )
    assert.doesNotMatch(
      css,
      /aside nav[^{]*a\[class\*="text-white"\]/,
      `${name}: nav state must not be matched via the text-white class substring`
    )

    // Any broad sidebar text rule must exclude nav rows explicitly.
    for (const rule of css.match(/aside :is\(\.text-white[^{]*\{/g) ?? []) {
      assert.match(rule, /:not\(nav a\)/, `${name}: broad sidebar text rule must exclude nav rows → "${rule.trim()}"`)
    }

    // Calendar day cells: only the selected one may be filled.
    assert.doesNotMatch(
      css,
      /z-\[200\]"\] button\[class\*="bg-\[#1B4332\]"\]/,
      `${name}: calendar day fill must key off the selected day's from- colour, not a bg- substring`
    )
  }
}

// ─── Popovers must escape their host panel's stacking context ──────────────
//
// backdrop-filter creates a stacking context, so a popover inside a glass panel
// is clamped to that panel and a later sibling panel paints over it. The host
// panel is lifted while it contains an open popover.
for (const [name, css] of [['light', lightCode], ['dark', darkCode]]) {
  assert.match(
    css,
    /\[class\*="rounded"\]:has\(div\[class\*="z-\[200\]"\]\)[\s\S]{0,120}z-index:\s*80/,
    `${name}: the panel hosting an open popover must be lifted, or backdrop-filter traps the popover`
  )
}

// ─── The content column must be allowed to shrink ──────────────────────────
// Flex items default to min-width:auto, so a wide nowrap table pushes the whole
// column past the viewport instead of scrolling inside its own wrapper.
for (const [name, css] of [['light', lightCode], ['dark', darkCode]]) {
  assert.match(css, /main \{ min-width: 0 !important; \}/, `${name}: the content column needs min-width:0`)
}

// ─── Table wrappers stay flat ──────────────────────────────────────────────
//
// Several pages put bg-white/rounded on the very element that scrolls a table.
// Those wrappers are deliberately flattened (no backdrop-filter, near-flat
// fill) so a table does not sit under two stacked blurs and so sticky headers
// stay crisp. Any later panel rule must exclude them or it silently re-glasses
// the wrapper and undoes that.
for (const [name, css] of [['light', lightCode], ['dark', darkCode]]) {
  // The flattening rule must still exist at all.
  assert.match(
    css,
    /div\[class\*="overflow-x-auto"\]:has\(> table\)[\s\S]{0,300}backdrop-filter: none/,
    `${name}: table wrapper must keep backdrop-filter: none`
  )

  const flattenAt = css.search(/div\[class\*="overflow-x-auto"\]:has\(> table\) \{/)
  assert.ok(flattenAt > -1, `${name}: could not locate the table-wrapper flattening rule`)

  // Walk every rule that paints a panel background. Anything declared after
  // the flattening rule wins the cascade over it, so those must opt out of
  // table wrappers explicitly.
  const panelRule = /([^{}]*\[class\*="bg-white"\]\[class\*="rounded"\][^{}]*)\{([^{}]*)\}/g
  let checked = 0
  for (const match of css.matchAll(panelRule)) {
    const [, selector, declarations] = match
    if (!/background:/.test(declarations)) continue

    // A rule whose own subject is a table wrapper IS a flattening rule — it
    // only mentions the panel selector as an ancestor. Drop :not(...) groups
    // first so the exclusion we are looking for is not mistaken for a target.
    const positive = selector.replace(/:not\([^()]*(?:\([^()]*\)[^()]*)*\)/g, '')
    if (/:has\(> table\)|overflow-x-auto/.test(positive)) continue

    checked++
    if (match.index < flattenAt) continue // later flattening rule still wins
    assert.match(
      selector,
      /:not\(:has\(> table\)\)/,
      `${name}: this panel background rule is declared after the table-wrapper flattening rule, so it must exclude table wrappers → "${selector.trim().split('\n').pop()}"`
    )
  }
  assert.ok(checked >= 2, `${name}: expected to inspect at least 2 panel background rules, saw ${checked}`)
}

// ─── §13 — Outfit headings, loaded as a variable and scoped to glass ───────
assert.match(layout, /Outfit/, 'layout: Outfit font not loaded')
assert.match(layout, /variable: "--font-outfit"/, 'layout: Outfit must be exposed as a CSS variable')
assert.doesNotMatch(layout, /className=\{`?\$\{?outfit\.className/, 'layout: Outfit must not be applied globally — glass scope opts in')
for (const [name, css] of [['light', light], ['dark', dark]]) {
  assert.match(css, new RegExp(`${SCOPE.replace(/[[\]"]/g, m => '\\' + m)} :is\\(h1, h2, h3, h4\\) \\{\\s*font-family: var\\(--font-outfit\\)`), `${name}: Outfit must apply inside the glass scope only`)
}

console.log('Liquid Glass verification passed.')
