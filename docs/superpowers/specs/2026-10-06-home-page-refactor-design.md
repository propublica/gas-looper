# Home Page Refactor — Design

**Issue:** AI-129 · **Branch:** `AI-129-update-homepage-look-and-feel` · **Target:** `develop`

## Goal

Make the sidebar home page start from what a reporter already has, so first-time users go straight into Guided, and quietly set the expectation that AI works through their data one row at a time.

## Decisions

- Copy, layout, and look follow the final mockup from the AI-129 brainstorm (question-led, two choice cards). Existing sidebar look, no new tokens or colors, emoji kept, no marketing copy.
- Each home-page choice opens Guided with step 1 preset to that input kind.
- **A home-page choice always opens a fresh Guided** with that choice honored. Earlier Guided progress is not restored from the home page. *(Revised after QA; see "Revision" below.)*
- With no filled-in rows, step 1 opens with one empty row of the chosen kind. Both "+ Column" and "+ Drive folder" stay.
- "Go Freeform" behaves like today's Freeform button, including restoring earlier Freeform state.

## Revision (2026-10-06, after QA)

The first version resumed earlier Guided work through the home page, via an opt-in `{ resume: true }` option on `Router.navigate`. In QA, coming back to a half-filled Guided after clicking a home-page choice felt awkward, because the click could be ignored. The resume option and its router change were removed. Each choice now opens a fresh Guided.

- **Kept as before:** Freeform still restores through "Go Freeform". The back stack still restores (Guided → Switch to Freeform → Back). Test-result persistence (AI-87) is unchanged.
- **Accepted cost:** a detour through the home page mid-flow (e.g. to Extract Text) restarts Guided. Anything Guided already wrote to the sheet (Drive Link and System Prompt columns) stays there, and a lost Test result brings back the "without testing first" prompt.

## Out of scope

- Guided's own title and intro copy.
- The existing state loss when a panel is left before its columns finish loading (`unmount()` returns nothing and the router caches that). This change does not make it worse.
- Refreshing the button screenshots in `docs/user-guide.md` (`images/user-guide/btn-*.png`). Follow-up for a human, since it needs a live sidebar.

## 1. Home page

### Markup (`src/client/panels/tool-list.ts`)

Top to bottom:

| Element | Content |
|---|---|
| `.home-question` | "What do you want to work on?" |
| `.home-help` | "AI will read each row, one at a time." |
| `.home-choice#btn-guided-columns` | 📄 **Columns in this sheet** / "Text, links, or Drive files already in your spreadsheet" |
| `.home-choice#btn-guided-folder` | 📂 **A Drive folder** / "Import a folder, one file per row" |
| `.home-freeform` | "Already know what to do?" + `.link-btn#btn-run-ai` "Go Freeform" |
| `.home-tools` | "More tools" disclosure, collapsed on every mount: `#more-tools-toggle` (`.collapsible-header` with label "More tools", summary "Import Files, Extract text, Sample, Format", chevron) controlling `#more-tools-content` (`.collapsible-content`), which holds the four `.tool-row` buttons (below). Reuses the RunControls MODEL/TOOLS `.collapsible-*` styles. *(Added after QA so the tools don't compete with the two choices.)* |
| `.home-footer` | "Why one row at a time?" link + `Looper v{{VERSION}}` |

More-tools rows, in this order, keeping today's ids:

| Id | Icon | Name | Description |
|---|---|---|---|
| `#btn-import-drive-links` | 📂 | Import Drive Links | Add a folder's files to your sheet, by file type |
| `#btn-extract-text` | 📜 | Extract Text | Pull text from Docs, PDFs, and images |
| `#btn-sample-rows` | 🎲 | Sample Rows | Pick a random set to check by hand |
| `#btn-format-markdown` | 📝 | Format Markdown | Turn AI \*\*formatting\*\* into rich text |

Each row's name is in a `.tool-row-name` span and its description in `.tool-row-sub`.

The footer link points at the IRE post (`https://www.ire.org/2026/08/13/using-llms-in-data-journalism-can-be-trustworthy-if-these-five-elements-are-in-your-methodology/`), held in one named constant commented as a placeholder for our own post. It needs `target="_blank" rel="noopener"` because `Sidebar.html` sets `<base target="_top">`. `{{VERSION}}` is still replaced at build time by `rollup.config.js`.

### Behavior

| Click | Action |
|---|---|
| Columns in this sheet | `nav.navigate("guided-ai-inference", { startWith: "column" })` |
| A Drive folder | `nav.navigate("guided-ai-inference", { startWith: "drive-folder" })` |
| Go Freeform | `nav.navigate("configure-ai-run")` (unchanged) |
| Import Drive Links / Extract Text | navigate to their panels (unchanged) |
| Sample Rows | dispatch `sampleRowsToEvaluation` with the explicit job label `"🎲 Sample Rows"` |
| Format Markdown | disable the row, set `.tool-row-name` to "Formatting...", restore on settle; alert on error |

The Sample Rows label used to come from the button's `textContent`, which would now include the description, so it becomes explicit. The value matches what the job strip shows today.

### CSS (`src/client/sidebar.css`)

- Delete `.tool-btn`, `.tool-btn:hover`, `.tool-btn:active`, `.tool-btn-text`, `.tool-btn-sub`, the `.tool-btn:has(...)` rules, and `.status-footer`. Only the home page used them.
- Add one "Home page" block: `.home-question`, `.home-help`, `.home-choice` (+ `:hover`, `-name`, `-sub`), `.home-freeform` (+ `.link-btn` with no padding), `.home-tools`, `.tool-row` (+ `:hover`, `:disabled`, `-sub`), shared `.home-choice .icon, .tool-row .icon`, `.home-footer` (+ `a`). Values come from the mockup.
- The choice-card hover background uses the existing `rgba(26, 115, 232, 0.06)` instead of the mockup's new `#f8fbff`. The footer border keeps the existing `#eee`.

## 2. Opening Guided with a preset

### Router

No change. Explicit params already bypass the router's per-panel cache, so a home-page choice always mounts a fresh Guided. `back()` still remounts a panel from its stack entry, which holds both its params and its latest saved state.

### Guided (`src/client/panels/guided-ai-inference.ts`)

- Export `GuidedParams = { startWith: InputRow["kind"] }` and implement `Panel<GuidedParams, StepFlowSavedState>`.
- Pass `params?.startWith` to the `InputsStep` constructor. Saved state goes to `StepFlow` unchanged.

### InputsStep (`src/client/panels/guided/inputs-step.ts`)

InputsStep owns the "is there real work?" rule, because it defines what a filled-in row is. The rule matters on Back from Freeform, where Guided gets its preset params and its saved state together.

- A module-level `isFilled(row)` helper (column has a `colTitle`, folder has a `url`) replaces the duplicated predicate in `hydrate()` and `handleContinue()`.
- The constructor takes an optional `startWith`.
- On `mount()`: if `startWith` is set and no saved row `isFilled`, render a single seed row in place of the saved rows (leftover empty rows are dropped). Otherwise render saved rows as today.
- Column seed: `{ kind: "column", colTitle: "" }`.
- Folder seed: `{ kind: "drive-folder", url: "", colTitle: "Drive Link" }`, so the next added folder is "Drive Link 2". Its URL input gets focus.

### Paths

| # | Situation | Result |
|---|---|---|
| a | Home → either choice | Fresh Guided, seeded row of that kind |
| b | Guided with progress → home → either choice | Fresh Guided, seeded row of that kind; earlier progress not restored |
| c | Guided → Switch to Freeform → Back, step 1 has filled rows | Rows restored, no seed |
| d | Guided → Switch to Freeform → Back, on step 2 or 3 | Whole flow restored at that step |
| e | Old Freeform state, then Guided → Switch to Freeform | Handoff config overrides old Freeform state |

## 3. Testing

Written test-first.

- **`__tests__/router.test.ts`**: `back()` remounts a panel with its original params and latest saved state. The existing test that explicit params bypass the cache stays.
- **`__tests__/panels/guided/inputs-step.test.ts`**:
  - Seeds a column row.
  - Seeds a focused folder row, and the next added folder is titled "Drive Link 2".
  - Filled saved rows are restored instead of seeded.
  - All-empty saved rows are replaced by the seed.
  - A typed-but-unimported folder URL counts as filled.
  - Nothing is seeded without `startWith`.
- **`__tests__/panels/guided-ai-inference.test.ts`**:
  - `startWith` reaches step 1.
  - A filled row plus a preset restores the row (Back from Freeform). *(c)*
  - A flow saved on step 2 or 3 plus a preset reopens on that step (Back from Freeform). *(d)*
- **`__tests__/panels/tool-list.test.ts`**, rewritten:
  - Question copy.
  - Each choice's `navigate` call: exactly `("guided-ai-inference", { startWith })`, with no third argument.
  - Bare Freeform navigate.
  - "More tools" label and summary; collapsed by default; toggle opens and closes and keeps `aria-expanded` in sync.
  - More-tools order and copy.
  - Footer link text, `target="_blank"`, and version.
  - Sample Rows job label.
  - Format Markdown in-flight and error states.
- Per-file coverage thresholds hold, and the full gate passes: lint, typecheck, format check, `test:coverage`, build.

## 4. Docs

- **Threat model and `docs/permissions.md`**: no change. No new RPC, data flow, OAuth scope, or dependency. The only addition is a static outbound link the user clicks.

## 5. Manual QA (dev sheet)

The dev sheet also has the Marketplace Looper installed, which can mask branch changes. Make sure you are testing the branch build.

1. The home page matches the mockup, with working hover states on cards and rows.
2. **Fresh:** "Columns in this sheet" opens one empty column picker. Back, then "A Drive folder" opens one folder box with the cursor in it. *(a)*
3. **Always fresh from home:** pick a column in step 1 (or finish steps 1 and 2). Back, then click either choice: Guided starts fresh with that choice's row. *(b)*
4. **Back stack:** finish steps 1 and 2, then "Switch to Freeform", then Back: Guided is as left, on step 3. *(c, d)*
5. **Freeform handoff wins:** open Freeform and set some columns, go home, open Guided, "Switch to Freeform": Freeform shows Guided's config. *(e)*
6. "Go Freeform" opens Freeform, and Freeform → Back → Go Freeform restores its earlier state.
7. "More tools" starts collapsed, its summary fits on one line with no "…", the toggle opens and closes (chevron rotates; Tab then Enter/Space works), and expanded tools still work: Sample Rows shows "🎲 Sample Rows" in the job strip, and Format Markdown shows "Formatting..." while running.
8. "Why one row at a time?" opens the IRE post in a new tab, and the footer shows the right version.
