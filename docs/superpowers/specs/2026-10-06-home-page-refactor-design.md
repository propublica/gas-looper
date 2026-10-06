# Home Page Refactor — Design

**Issue:** AI-129 · **Branch:** `AI-129-update-homepage-look-and-feel` · **Target:** `develop`

## Goal

Make the sidebar home page start from what a reporter already has, so first-time users go straight into Guided, and quietly set the expectation that AI works through their data one row at a time.

## Decisions

- Copy, layout, and look follow the final mockup from the AI-129 brainstorm (question-led, two choice cards). Existing sidebar look, no new tokens or colors, emoji kept, no marketing copy.
- Each home-page choice opens Guided with step 1 preset to that input kind.
- **Earlier Guided work is never wiped by a home-page click.** If any step-1 row is filled in, Guided resumes as it was and the preset is ignored.
- With no filled-in rows, step 1 opens with one empty row of the chosen kind. Both "+ Column" and "+ Drive folder" stay.
- "Go Freeform" behaves like today's Freeform button, including restoring earlier Freeform state.

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
| `.home-tools` | `<h3>Other tools</h3>` then four `.tool-row` buttons (below) |
| `.home-footer` | "Why one row at a time?" link + `Looper v{{VERSION}}` |

Other-tools rows, in this order, keeping today's ids:

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
| Columns in this sheet | `nav.navigate("guided-ai-inference", { startWith: "column" }, { resume: true })` |
| A Drive folder | `nav.navigate("guided-ai-inference", { startWith: "drive-folder" }, { resume: true })` |
| Go Freeform | `nav.navigate("configure-ai-run")` (unchanged) |
| Import Drive Links / Extract Text | navigate to their panels (unchanged) |
| Sample Rows | dispatch `sampleRowsToEvaluation` with the explicit job label `"🎲 Sample Rows"` |
| Format Markdown | disable the row, set `.tool-row-name` to "Formatting...", restore on settle; alert on error |

The Sample Rows label used to come from the button's `textContent`, which would now include the description, so it becomes explicit. The value matches what the job strip shows today.

### CSS (`src/client/sidebar.css`)

- Delete `.tool-btn`, `.tool-btn:hover`, `.tool-btn:active`, `.tool-btn-text`, `.tool-btn-sub`, the `.tool-btn:has(...)` rules, and `.status-footer`. Only the home page used them.
- Add one "Home page" block: `.home-question`, `.home-help`, `.home-choice` (+ `:hover`, `-name`, `-sub`), `.home-freeform` (+ `.link-btn` with no padding), `.home-tools`, `.tool-row` (+ `:hover`, `:disabled`, `-sub`), shared `.home-choice .icon, .tool-row .icon`, `.home-footer` (+ `a`). Values come from the mockup.
- The choice-card hover background uses the existing `rgba(26, 115, 232, 0.06)` instead of the mockup's new `#f8fbff`. The footer border keeps the existing `#eee`.

## 2. Opening Guided with a preset, and resuming

### Principle

A panel receives two inputs: **params** (what the caller wants) and **savedState** (what was on screen when the person last left). Today the router treats them as either/or: explicit params mean a fresh panel. That fits **command** params, like Guided's "Switch to Freeform" handoff, which must replace leftover Freeform state.

The home page's preset is a **suggestion** that only matters when there's no existing work. A caller passes `{ resume: true }` to say its params are a suggestion: the router hands the panel both params and saved state, and the panel decides.

### Router (`src/client/router.ts`, `src/client/types.ts`)

- `NavigationContext.navigate(panelId, params?, options?: { resume?: boolean })`.
- `Router.navigate` reads `lastState` when `params === undefined` **or** `options?.resume`. Explicit params still win over cached params, and the cached `savedState` is passed through and stored on the stack entry.
- `makeNav` forwards `options`.
- The `lastState` doc comment is updated to describe the `resume` exception.

### Guided (`src/client/panels/guided-ai-inference.ts`)

- Export `GuidedParams = { startWith: InputRow["kind"] }` and implement `Panel<GuidedParams, StepFlowSavedState>`.
- Pass `params?.startWith` to the `InputsStep` constructor. Saved state goes to `StepFlow` unchanged, so Guided makes no resume decision itself.

### InputsStep (`src/client/panels/guided/inputs-step.ts`)

InputsStep owns the "is there real work?" rule, because it defines what a filled-in row is.

- A module-level `isFilled(row)` helper (column has a `colTitle`, folder has a `url`) replaces the duplicated predicate in `hydrate()` and `handleContinue()`.
- The constructor takes an optional `startWith`.
- On `mount()`: if `startWith` is set and no saved row `isFilled`, render a single seed row in place of the saved rows (leftover empty rows are dropped). Otherwise render saved rows as today.
- Column seed: `{ kind: "column", colTitle: "" }`.
- Folder seed: `{ kind: "drive-folder", url: "", colTitle: "Drive Link" }`, so the next added folder is "Drive Link 2". Its URL input gets focus.

### Paths

| # | Earlier Guided state | Entry | Result |
|---|---|---|---|
| a | None | Either choice | Seeded row of that kind |
| b | Only empty rows | Different choice | Seed replaces the empty row |
| c | Filled row, step 1 open | Different choice | Rows restored, no seed |
| d | Filled row | Same choice | Rows restored, no extra row |
| e | Step 1 completed (on step 2 or 3) | Either choice | Whole flow restored at the current step |
| f | Mixed column + folder rows | Either choice | Both restored |
| g | Folder URL typed, not imported | Either choice | URL restored |
| h | Any | Guided → Switch to Freeform → Back | Guided as left (back stack, unchanged) |
| i | Old Freeform state | Guided → Switch to Freeform | Handoff config overrides old Freeform state (no `resume`) |

## 3. Testing

Written test-first.

- **`__tests__/router.test.ts`**: with `resume`, the panel receives new params and cached saved state. With `resume` and nothing cached, saved state is undefined. Without `resume`, explicit params still drop the cache.
- **`__tests__/panels/guided/inputs-step.test.ts`**:
  - Seeds a column row.
  - Seeds a focused folder row, and the next added folder is titled "Drive Link 2".
  - Filled saved rows are restored instead of seeded.
  - All-empty saved rows are replaced by the seed.
  - A typed-but-unimported folder URL counts as filled. *(g)*
  - Nothing is seeded without `startWith`.
- **`__tests__/panels/guided-ai-inference.test.ts`**:
  - `startWith` reaches step 1.
  - A filled row plus a different preset restores the row.
  - A flow saved on step 2 or 3 plus a preset reopens on that step. *(e)*
- **`__tests__/panels/tool-list.test.ts`**, rewritten:
  - Question copy.
  - Each choice's `navigate` call, including `{ resume: true }`.
  - Bare Freeform navigate.
  - Other-tools order and copy.
  - Footer link text, `target="_blank"`, and version.
  - Sample Rows job label.
  - Format Markdown in-flight and error states.
- Per-file coverage thresholds hold, and the full gate passes: lint, typecheck, format check, `test:coverage`, build.

## 4. Docs

- **`docs/architecture.md`**, Panel / Router System: a sentence or two on command vs. suggestion params and `resume`.
- **Threat model and `docs/permissions.md`**: no change. No new RPC, data flow, OAuth scope, or dependency. The only addition is a static outbound link the user clicks.

## 5. Manual QA (dev sheet)

The dev sheet also has the Marketplace Looper installed, which can mask branch changes. Make sure you are testing the branch build.

1. The home page matches the mockup, with working hover states on cards and rows.
2. **Fresh:** "Columns in this sheet" opens one empty column picker. Back, then "A Drive folder" opens one folder box with the cursor in it. *(a, b)*
3. **Filled step 1:** pick a column and type a folder URL without importing. Back, then click each choice in turn: both rows survive, no extra row. *(c, d, f, g)*
4. **Completed steps:** finish steps 1 and 2. Back, then click either choice: Guided reopens on step 3 with the prompt intact. *(e)*
5. **Back stack:** from step 3, "Switch to Freeform", then Back: Guided is as left. *(h)*
6. **Freeform handoff wins:** open Freeform and set some columns, go home, open Guided, "Switch to Freeform": Freeform shows Guided's config. *(i)*
7. "Go Freeform" opens Freeform, and Freeform → Back → Go Freeform restores its earlier state.
8. Other tools still work: Sample Rows shows "🎲 Sample Rows" in the job strip, and Format Markdown shows "Formatting..." while running.
9. "Why one row at a time?" opens the IRE post in a new tab, and the footer shows the right version.
