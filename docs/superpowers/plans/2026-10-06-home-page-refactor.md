# Home Page Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the sidebar home page with a question-led entry ("What do you want to work on?") whose two choices open Guided with step 1 preset to column or Drive-folder input, without ever wiping earlier Guided work.

**Architecture:** The router gains an opt-in `{ resume: true }` navigate option that treats params as a suggestion and hands the panel its cached saved state as well. Guided forwards a `startWith` param to `InputsStep`, which seeds one empty row of that kind only when no saved row is filled in. `ToolListPanel` is rewritten to the new markup, and its old pill-button CSS is replaced.

**Tech Stack:** TypeScript (ES2019, DOM), Jest + ts-jest (jsdom), Rollup, Google Apps Script HtmlService sidebar.

**Spec:** `docs/superpowers/specs/2026-10-06-home-page-refactor-design.md`

## Global Constraints

- Branch `AI-129-update-homepage-look-and-feel`, PR target `develop`.
- No new CSS tokens or colors; reuse `sidebar.css` custom properties and existing literal colors (`rgba(26, 115, 232, 0.06)`, `#eee`). Any new `button` sets `font-family: var(--font-family)`.
- Keep the emoji icons. No marketing copy.
- Copy is verbatim from the spec, including "Turn AI \*\*formatting\*\* into rich text" with literal asterisks.
- Code style: named exports only, `const` by default, double quotes, semicolons, trailing commas, explicit return types on functions, `===`, no `any`.
- Client code calls `google.script.run` only via `src/client/services.ts` (no change needed here).
- `{{VERSION}}` must appear exactly once in `tool-list.ts`. `rollup.config.js` replaces only the first occurrence, with the package's **major** version (e.g. `9`).
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- The pre-commit hook runs `jest --bail` plus lint-staged (ESLint and Prettier on staged files). Run `npx prettier --write <files>` before committing if formatting fails.

## Review Focus

- **Whitespace-only Drive folder URL.** A user who types only spaces has not done any work, so a later home-page choice should seed rather than restore. `currentRows()` already trims, so this should hold. Pinned in Task 2.
- **Sheet with no header row.** "Columns in this sheet" on an empty sheet should still show one (empty) column picker, not crash. Pinned in Task 2.
- **Back after a resume navigate.** Guided → Switch to Freeform → Back must remount Guided with the same preset params and its latest saved state. Pinned in Task 1.
- **Double-clicking Format Markdown.** The second click while a run is in flight must be ignored, not start a second formatting call. Pinned in Task 4.
- **Footer link opens safely in a new tab.** The sidebar's `<base target="_top">` would otherwise navigate the sidebar away, and `rel="noopener"` stops the new tab from controlling the sidebar. Pinned in Task 4.

---

## File Structure

| File | Responsibility | Change |
|---|---|---|
| `src/client/types.ts` | Client UI types | Add `NavigateOptions`; extend `NavigationContext.navigate` |
| `src/client/router.ts` | Navigation stack and per-panel state cache | Honor `options.resume` |
| `src/client/panels/guided/inputs-step.ts` | Guided step 1 | `startWith` seed rule, `isFilled` helper |
| `src/client/panels/guided-ai-inference.ts` | Guided panel shell | `GuidedParams`; pass `startWith` to `InputsStep` |
| `src/client/panels/tool-list.ts` | Home page | New markup and wiring |
| `src/client/sidebar.css` | All sidebar styles | Remove old home rules, add new home block |
| `docs/architecture.md` | Contributor architecture overview | Note on params vs. `resume` |
| `__tests__/router.test.ts` | Router tests | New `resume` tests |
| `__tests__/panels/guided/inputs-step.test.ts` | InputsStep tests | New seed tests |
| `__tests__/panels/guided-ai-inference.test.ts` | Guided panel tests | New preset/resume tests |
| `__tests__/panels/tool-list.test.ts` | Home page tests | Rewritten |

---

### Task 1: Router `resume` option

**Files:**
- Modify: `src/client/types.ts` (the `NavigationContext` interface, around line 100)
- Modify: `src/client/router.ts:15-23` (`lastState` comment), `:36-46` (`navigate`), `:73-79` (`makeNav`)
- Modify: `docs/architecture.md` (Panel / Router System section)
- Test: `__tests__/router.test.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces:
  - `export interface NavigateOptions { resume?: boolean }` in `src/client/types.ts`
  - `NavigationContext.navigate(panelId: PanelId, params?: unknown, options?: NavigateOptions): void`
  - `Router.navigate(panelId: PanelId, params?: unknown, options?: NavigateOptions): void`. With `options.resume`, the panel's `mount()` receives the explicit `params` **and** the panel's cached `savedState` (or `undefined` if none is cached).

- [ ] **Step 1: Write the failing tests**

Add these three tests inside the `describe("Router", ...)` block in `__tests__/router.test.ts`, directly after the existing test `"navigate() with explicit params ignores any cached state for that panel"`. Do not change that existing test: it is the guard that command params (no `resume`) still bypass the cache.

```ts
  it("navigate() with params and { resume: true } passes the new params AND the cached state", () => {
    const home = makePanel("home");
    const guided = makePanel("guided");
    let nav: NavigationContext | null = null;
    home.mount = function (container, n) {
      nav = n;
      container.innerHTML = "<div data-panel='home'></div>";
    };
    const router = new Router(
      container,
      new Map([
        ["tool-list", home],
        ["guided-ai-inference", guided],
      ]),
    );
    router.start("tool-list");
    nav!.navigate("guided-ai-inference", { startWith: "column" }, { resume: true });
    (guided as ReturnType<typeof makePanel>).unmountReturn = { activeStepIndex: 1 };
    router.back();
    nav!.navigate("guided-ai-inference", { startWith: "drive-folder" }, { resume: true });

    const calls = (guided as ReturnType<typeof makePanel>).mountCalls;
    const secondMount = calls[1] as { params: unknown; savedState: unknown };
    expect(secondMount.params).toEqual({ startWith: "drive-folder" });
    expect(secondMount.savedState).toEqual({ activeStepIndex: 1 });
  });

  it("navigate() with { resume: true } and nothing cached passes savedState undefined", () => {
    const home = makePanel("home");
    const guided = makePanel("guided");
    const router = new Router(
      container,
      new Map([
        ["tool-list", home],
        ["guided-ai-inference", guided],
      ]),
    );
    router.start("tool-list");
    router.navigate("guided-ai-inference", { startWith: "column" }, { resume: true });

    const firstMount = (guided as ReturnType<typeof makePanel>).mountCalls[0] as {
      params: unknown;
      savedState: unknown;
    };
    expect(firstMount.params).toEqual({ startWith: "column" });
    expect(firstMount.savedState).toBeUndefined();
  });

  it("back() after a resume navigate remounts with the same params and the latest state", () => {
    const home = makePanel("home");
    const guided = makePanel("guided");
    const freeform = makePanel("freeform");
    const router = new Router(
      container,
      new Map([
        ["tool-list", home],
        ["guided-ai-inference", guided],
        ["configure-ai-run", freeform],
      ]),
    );
    router.start("tool-list");
    router.navigate("guided-ai-inference", { startWith: "column" }, { resume: true });
    (guided as ReturnType<typeof makePanel>).unmountReturn = { activeStepIndex: 2 };
    router.navigate("configure-ai-run", { promptCols: ["a"] }); // "Switch to Freeform"
    router.back();

    const calls = (guided as ReturnType<typeof makePanel>).mountCalls;
    const remount = calls[1] as { params: unknown; savedState: unknown };
    expect(remount.params).toEqual({ startWith: "column" });
    expect(remount.savedState).toEqual({ activeStepIndex: 2 });
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest __tests__/router.test.ts`
Expected: FAIL. The first test fails to compile (`Expected 1-2 arguments, but got 3` on `nav!.navigate(...)`) or, once compiled, `secondMount.savedState` is `undefined`. (The third test is a pin for existing back-stack behavior and may pass on its own once the file compiles.)

- [ ] **Step 3: Add `NavigateOptions` and extend `NavigationContext`**

In `src/client/types.ts`, replace:

```ts
/**
 * Passed to each panel's mount() so panels can trigger navigation
 * without importing the router directly.
 */
export interface NavigationContext {
  navigate(panelId: PanelId, params?: unknown): void;
```

with:

```ts
export interface NavigateOptions {
  /** Treat `params` as a suggestion rather than a command: the panel also
   * receives its cached savedState and decides which wins. Without this,
   * explicit params mean a fresh panel (e.g. Guided's "Switch to Freeform"
   * handoff must replace leftover Freeform state). */
  resume?: boolean;
}

/**
 * Passed to each panel's mount() so panels can trigger navigation
 * without importing the router directly.
 */
export interface NavigationContext {
  navigate(panelId: PanelId, params?: unknown, options?: NavigateOptions): void;
```

- [ ] **Step 4: Honor `resume` in the router**

In `src/client/router.ts`, change the import line to:

```ts
import type { Panel, PanelId, NavigationContext, NavigateOptions } from "./types";
```

Replace the `lastState` doc comment with:

```ts
  /**
   * Remembers the last state each panel was left with, independent of
   * navigation path — lets a bare navigate() (no explicit params) restore
   * where the user left off, even after visiting unrelated panels in
   * between. Explicit params are a command by default (e.g. Guided's
   * "Switch to Freeform" config) and bypass this cache; a caller passing
   * { resume: true } marks its params as a suggestion, so the cached
   * savedState is passed along with them and the panel decides.
   */
```

Replace the `navigate` method with:

```ts
  navigate(panelId: PanelId, params?: unknown, options?: NavigateOptions): void {
    const panel = this.panels.get(panelId);
    if (!panel) throw new Error(`Unknown panel: ${panelId}`);
    this.leaveCurrentPanel();

    const useCache = params === undefined || options?.resume === true;
    const cached = useCache ? this.lastState.get(panelId) : undefined;
    const effectiveParams = params ?? cached?.params;
    this.stack.push({ panelId, params: effectiveParams, savedState: cached?.savedState });
    this.currentPanel = panel;
    this.container.innerHTML = "";
    panel.mount(this.container, this.makeNav(), effectiveParams, cached?.savedState);
  }
```

In `makeNav()`, replace `navigate: (id, params) => this.navigate(id, params),` with:

```ts
      navigate: (id, params, options) => this.navigate(id, params, options),
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx jest __tests__/router.test.ts`
Expected: PASS (all router tests, including the unchanged "explicit params ignores any cached state").

- [ ] **Step 6: Document the rule in `docs/architecture.md`**

In the "Panel / Router System" section, append this paragraph after the existing one:

```markdown
When a panel is navigated to, it can receive two things: **params** (what the caller wants) and **saved state** (what was on screen when the user last left it). By default, explicit params are a command and the panel starts fresh with them. That's how Guided's "Switch to Freeform" hands over its config. A caller that passes `{ resume: true }` marks its params as a suggestion instead: the panel gets its saved state as well and decides which wins. The home page uses this to open Guided with step 1 preset to column or Drive-folder input without wiping earlier Guided work.
```

- [ ] **Step 7: Typecheck, then commit**

Run: `npm run typecheck`
Expected: no errors.

```bash
git add src/client/types.ts src/client/router.ts __tests__/router.test.ts docs/architecture.md
git commit -m "Add resume option to router navigate (AI-129)

Explicit params still bypass a panel's cached state by default; passing
{ resume: true } hands the panel both, so a caller's params can act as a
suggestion that doesn't wipe earlier work.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: InputsStep `startWith` seed

**Files:**
- Modify: `src/client/panels/guided/inputs-step.ts`
- Test: `__tests__/panels/guided/inputs-step.test.ts`

**Interfaces:**
- Consumes: `InputRow` (already exported from this file): `{ kind: "column"; colTitle: string } | { kind: "drive-folder"; url: string; colTitle: string }`.
- Produces: `new InputsStep(headers: string[], startWith?: InputRow["kind"])`. On `mount()`, if `startWith` is set and no saved row is filled in, renders exactly one empty row of that kind in place of the saved rows (column seed `{ kind: "column", colTitle: "" }`; folder seed `{ kind: "drive-folder", url: "", colTitle: "Drive Link" }`, with its URL input focused). Otherwise behaves as today.

- [ ] **Step 1: Write the failing tests**

Append to `__tests__/panels/guided/inputs-step.test.ts` (it already defines `makeContainer()`, `makeCtx()`, and imports `InputsStep` and `InputsStepSavedState`):

```ts
describe("InputsStep — startWith seed", () => {
  it("seeds one empty column row on a fresh mount", () => {
    const container = makeContainer();
    new InputsStep(["col_a"], "column").mount(container, makeCtx());
    expect(container.querySelectorAll(".guided-input-row")).toHaveLength(1);
    expect(container.querySelector(".guided-input-col-picker")).not.toBeNull();
  });

  it("seeds a column row even when the sheet has no headers", () => {
    const container = makeContainer();
    new InputsStep([], "column").mount(container, makeCtx());
    expect(container.querySelectorAll(".guided-input-col-picker")).toHaveLength(1);
  });

  it("seeds one empty Drive-folder row whose URL box has focus", () => {
    const container = makeContainer();
    new InputsStep([], "drive-folder").mount(container, makeCtx());
    const urlInputs = container.querySelectorAll<HTMLInputElement>(".guided-input-folder-url");
    expect(urlInputs).toHaveLength(1);
    expect(document.activeElement).toBe(urlInputs[0]);
  });

  it("keeps both add buttons, and a folder added after the seed is 'Drive Link 2'", () => {
    const container = makeContainer();
    const step = new InputsStep([], "drive-folder");
    step.mount(container, makeCtx());
    container.querySelector<HTMLButtonElement>("#gi-add-column")!.click();
    container.querySelector<HTMLButtonElement>("#gi-add-folder")!.click();
    const titles = step.unmount()!.savedState.rows.map((r) => r.colTitle);
    expect(titles).toEqual(["Drive Link", "", "Drive Link 2"]);
  });

  it("restores saved rows instead of seeding when any row is filled in", () => {
    const container = makeContainer();
    const saved: InputsStepSavedState = {
      rows: [
        { kind: "column", colTitle: "col_a" },
        { kind: "drive-folder", url: "https://drive.google.com/drive/folders/abc", colTitle: "Drive Link" },
      ],
    };
    new InputsStep(["col_a"], "column").mount(container, makeCtx(), saved);
    expect(container.querySelectorAll(".guided-input-row")).toHaveLength(2);
    expect(container.querySelector<HTMLInputElement>(".guided-input-folder-url")!.value).toBe(
      "https://drive.google.com/drive/folders/abc",
    );
  });

  it("treats a typed-but-unimported folder URL as filled in", () => {
    const container = makeContainer();
    const step = new InputsStep([], "drive-folder");
    step.mount(container, makeCtx());
    container.querySelector<HTMLInputElement>(".guided-input-folder-url")!.value =
      "https://drive.google.com/drive/folders/abc";
    const saved = step.unmount()!.savedState;

    const container2 = makeContainer();
    new InputsStep(["col_a"], "column").mount(container2, makeCtx(), saved);
    expect(container2.querySelector(".guided-input-col-picker")).toBeNull();
    expect(container2.querySelector<HTMLInputElement>(".guided-input-folder-url")!.value).toBe(
      "https://drive.google.com/drive/folders/abc",
    );
  });

  it("treats a whitespace-only folder URL as empty and seeds instead", () => {
    const container = makeContainer();
    const step = new InputsStep([], "drive-folder");
    step.mount(container, makeCtx());
    container.querySelector<HTMLInputElement>(".guided-input-folder-url")!.value = "   ";
    const saved = step.unmount()!.savedState;

    const container2 = makeContainer();
    new InputsStep(["col_a"], "column").mount(container2, makeCtx(), saved);
    expect(container2.querySelectorAll(".guided-input-row")).toHaveLength(1);
    expect(container2.querySelector(".guided-input-col-picker")).not.toBeNull();
    expect(container2.querySelector(".guided-input-folder-url")).toBeNull();
  });

  it("replaces all-empty saved rows with the seed", () => {
    const container = makeContainer();
    const saved: InputsStepSavedState = { rows: [{ kind: "column", colTitle: "" }] };
    new InputsStep(["col_a"], "drive-folder").mount(container, makeCtx(), saved);
    expect(container.querySelectorAll(".guided-input-row")).toHaveLength(1);
    expect(container.querySelector(".guided-input-folder-url")).not.toBeNull();
  });

  it("does not seed without startWith", () => {
    const container = makeContainer();
    new InputsStep(["col_a"]).mount(container, makeCtx());
    expect(container.querySelectorAll(".guided-input-row")).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest __tests__/panels/guided/inputs-step.test.ts`
Expected: FAIL. ts-jest reports `Expected 1 arguments, but got 2` for `new InputsStep([...], "column")`.

- [ ] **Step 3: Add the `isFilled` helper and use it in the two existing places**

In `src/client/panels/guided/inputs-step.ts`, directly above `export class InputsStep`, add:

```ts
function isFilled(row: InputRow): boolean {
  return row.kind === "column" ? row.colTitle !== "" : row.url !== "";
}
```

In `hydrate()`, replace:

```ts
    const rows = savedState.rows.filter((r) =>
      r.kind === "column" ? r.colTitle !== "" : r.url !== "",
    );
```

with:

```ts
    const rows = savedState.rows.filter(isFilled);
```

In `handleContinue()`, replace:

```ts
    const rows = this.currentRows().filter((r) =>
      r.kind === "column" ? r.colTitle !== "" : r.url !== "",
    );
```

with:

```ts
    const rows = this.currentRows().filter(isFilled);
```

- [ ] **Step 4: Add `startWith` and the seed rule**

Replace the constructor:

```ts
  constructor(headers: string[]) {
    this.headers = headers;
  }
```

with:

```ts
  private readonly startWith?: InputRow["kind"];

  /** `startWith` comes from the home page's "Columns in this sheet" / "A
   * Drive folder" choices. It only applies while step 1 has no filled-in
   * rows -- real work always wins over the preset. */
  constructor(headers: string[], startWith?: InputRow["kind"]) {
    this.headers = headers;
    this.startWith = startWith;
  }
```

In `mount()`, replace:

```ts
    for (const row of savedState?.rows ?? []) this.addRow(row);
```

with:

```ts
    const seed = this.seedRow(savedState);
    for (const row of seed ? [seed] : (savedState?.rows ?? [])) this.addRow(row);
    if (seed?.kind === "drive-folder") {
      container.querySelector<HTMLInputElement>(".guided-input-folder-url")!.focus();
    }
```

Add this private method directly above `computeNextFolderNumber()`:

```ts
  /** The row to show in place of savedState's rows, or null to keep them. */
  private seedRow(savedState?: InputsStepSavedState): InputRow | null {
    if (!this.startWith || savedState?.rows.some(isFilled)) return null;
    return this.startWith === "column"
      ? { kind: "column", colTitle: "" }
      : { kind: "drive-folder", url: "", colTitle: "Drive Link" };
  }
```

(`mount()` already calls `computeNextFolderNumber()` after adding rows, so a seeded "Drive Link" makes the next folder "Drive Link 2".)

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx jest __tests__/panels/guided/inputs-step.test.ts`
Expected: PASS (all InputsStep tests, old and new).

- [ ] **Step 6: Commit**

```bash
npx prettier --write src/client/panels/guided/inputs-step.ts __tests__/panels/guided/inputs-step.test.ts
git add src/client/panels/guided/inputs-step.ts __tests__/panels/guided/inputs-step.test.ts
git commit -m "Seed Guided step 1 from a startWith preset when it has no work (AI-129)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Guided accepts `GuidedParams`

**Files:**
- Modify: `src/client/panels/guided-ai-inference.ts`
- Test: `__tests__/panels/guided-ai-inference.test.ts`

**Interfaces:**
- Consumes: `new InputsStep(headers, startWith?)` from Task 2; `InputRow` from `./guided/inputs-step`.
- Produces: `export interface GuidedParams { startWith: InputRow["kind"] }` from `src/client/panels/guided-ai-inference.ts`. `GuidedAIInferencePanel implements Panel<GuidedParams, StepFlowSavedState>`, and `mount(container, nav, params?: GuidedParams, savedState?)` forwards `params?.startWith` to `InputsStep`.

- [ ] **Step 1: Write the failing tests**

In `__tests__/panels/guided-ai-inference.test.ts`, change the import line

```ts
import { GuidedAIInferencePanel } from "../../src/client/panels/guided-ai-inference";
```

to

```ts
import {
  GuidedAIInferencePanel,
  type GuidedParams,
} from "../../src/client/panels/guided-ai-inference";
```

and change

```ts
import type { NavigationContext } from "../../src/client/types";
```

to

```ts
import type { NavigationContext, StepFlowSavedState } from "../../src/client/types";
```

Then append:

```ts
describe("GuidedAIInferencePanel — startWith preset", () => {
  async function mountWithPreset(
    startWith: GuidedParams["startWith"],
    savedState?: StepFlowSavedState,
  ): Promise<{ container: HTMLElement; panel: GuidedAIInferencePanel }> {
    (services.getSheetHeaders as jest.Mock).mockResolvedValue(["NoteCol", "OtherCol"]);
    const container = makeContainer();
    const panel = new GuidedAIInferencePanel();
    panel.mount(container, mockNav, { startWith }, savedState);
    for (let i = 0; i < 5; i++) await Promise.resolve();
    return { container, panel };
  }

  function pickSeededColumn(container: HTMLElement): void {
    container.querySelector<HTMLElement>(".token-add-btn")!.click();
    container.querySelector<HTMLElement>('.token-option[data-value="NoteCol"]')!.click();
  }

  it("opens step 1 with one row of the preset kind", async () => {
    const { container } = await mountWithPreset("drive-folder");
    expect(container.querySelectorAll(".guided-input-row")).toHaveLength(1);
    expect(container.querySelector(".guided-input-folder-url")).not.toBeNull();
  });

  it("restores a filled-in step 1 even when reopened with a different preset", async () => {
    const { container, panel } = await mountWithPreset("column");
    pickSeededColumn(container);
    const saved = panel.unmount();

    const { container: container2 } = await mountWithPreset("drive-folder", saved);
    expect(container2.querySelectorAll(".guided-input-row")).toHaveLength(1);
    expect(container2.querySelector(".guided-input-folder-url")).toBeNull();
    expect(container2.querySelector(".guided-input-col-picker")!.textContent).toContain("NoteCol");
  });

  it("reopens on the step the user reached, ignoring the preset", async () => {
    (services.fillColumns as jest.Mock).mockResolvedValue({ rowRange: { start: 2, end: 5 } });
    const { container, panel } = await mountWithPreset("column");
    pickSeededColumn(container);
    container.querySelector<HTMLButtonElement>("#gi-continue")!.click();
    await Promise.resolve();
    container.querySelector<HTMLTextAreaElement>("#gp-prompt-text")!.value = "Summarize this.";
    container.querySelector<HTMLButtonElement>("#gp-continue")!.click();
    for (let i = 0; i < 5; i++) await Promise.resolve();
    const saved = panel.unmount();
    expect(saved?.activeStepIndex).toBe(2);

    const { container: container2 } = await mountWithPreset("drive-folder", saved);
    const icons = container2.querySelectorAll(".step-icon");
    expect(icons[0].textContent).toBe("✓");
    expect(icons[1].textContent).toBe("✓");
    expect(container2.querySelector("#run-btn")).not.toBeNull();
    expect(container2.querySelector(".guided-input-folder-url")).toBeNull();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest __tests__/panels/guided-ai-inference.test.ts`
Expected: FAIL. ts-jest reports that `GuidedParams` is not exported, and that `{ startWith }` is not assignable to `undefined`.

- [ ] **Step 3: Implement `GuidedParams`**

In `src/client/panels/guided-ai-inference.ts`, change

```ts
import { InputsStep } from "./guided/inputs-step";
```

to

```ts
import { InputsStep, type InputRow } from "./guided/inputs-step";
```

Replace

```ts
export class GuidedAIInferencePanel implements Panel<undefined, StepFlowSavedState> {
```

with

```ts
export interface GuidedParams {
  /** Which kind of input row step 1 opens with when it has no work yet.
   * Sent by the home page with { resume: true }, so earlier progress
   * arrives as savedState and wins (see InputsStep). */
  startWith: InputRow["kind"];
}

export class GuidedAIInferencePanel implements Panel<GuidedParams, StepFlowSavedState> {
```

In `mount()`, rename the parameter `_params?: undefined,` to `params?: GuidedParams,`, and replace

```ts
          const inputsStep = new InputsStep(headers);
```

with

```ts
          const inputsStep = new InputsStep(headers, params?.startWith);
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest __tests__/panels/guided-ai-inference.test.ts`
Expected: PASS (all Guided panel tests).

- [ ] **Step 5: Typecheck, then commit**

Run: `npm run typecheck`
Expected: no errors.

```bash
npx prettier --write src/client/panels/guided-ai-inference.ts __tests__/panels/guided-ai-inference.test.ts
git add src/client/panels/guided-ai-inference.ts __tests__/panels/guided-ai-inference.test.ts
git commit -m "Let Guided open with a startWith preset (AI-129)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: New home page

**Files:**
- Modify (full rewrite): `src/client/panels/tool-list.ts`
- Modify: `src/client/sidebar.css`
- Test (full rewrite): `__tests__/panels/tool-list.test.ts`

**Interfaces:**
- Consumes: `NavigationContext.navigate(panelId, params?, options?)` and `NavigateOptions` from Task 1; `GuidedParams` from Task 3; `runTool`, `formatMarkdownSelection` from `../services`; `jobStore` from `../job-store`.
- Produces: the home page DOM. Element ids `#btn-guided-columns`, `#btn-guided-folder`, `#btn-run-ai`, `#btn-import-drive-links`, `#btn-extract-text`, `#btn-sample-rows`, `#btn-format-markdown`. Classes `.home-question`, `.home-help`, `.home-choice`, `.home-choice-name`, `.home-choice-sub`, `.home-freeform`, `.home-tools`, `.tool-row`, `.tool-row-name`, `.tool-row-sub`, `.home-footer`.

- [ ] **Step 1: Write the failing tests**

Replace the entire contents of `__tests__/panels/tool-list.test.ts` with:

```ts
/**
 * @jest-environment jsdom
 */

jest.mock("../../src/client/services", () => ({
  runTool: jest.fn(),
  formatMarkdownSelection: jest.fn(),
}));

jest.mock("../../src/client/job-store", () => ({
  jobStore: { dispatch: jest.fn().mockResolvedValue(undefined) },
}));

import { ToolListPanel } from "../../src/client/panels/tool-list";
import * as services from "../../src/client/services";
import * as jobStoreModule from "../../src/client/job-store";
import type { NavigationContext } from "../../src/client/types";

const mockNav: NavigationContext = {
  navigate: jest.fn(),
  back: jest.fn(),
  canGoBack: jest.fn().mockReturnValue(false),
};

function mountPanel(): HTMLElement {
  document.body.innerHTML = '<div id="app"></div>';
  const container = document.getElementById("app")!;
  const panel = new ToolListPanel();
  panel.mount(container, mockNav);
  return container;
}

beforeEach(() => {
  jest.clearAllMocks();
  (jobStoreModule.jobStore.dispatch as jest.Mock).mockResolvedValue(undefined);
});

describe("ToolListPanel — entry question", () => {
  it("asks what the user wants to work on", () => {
    const c = mountPanel();
    expect(c.querySelector(".home-question")!.textContent).toBe("What do you want to work on?");
    expect(c.querySelector(".home-help")!.textContent).toBe(
      "AI will read each row, one at a time.",
    );
  });

  it("renders the two choices with their descriptions, columns first", () => {
    const c = mountPanel();
    const choices = Array.from(c.querySelectorAll(".home-choice")).map((el) => [
      el.id,
      el.querySelector(".home-choice-name")!.textContent,
      el.querySelector(".home-choice-sub")!.textContent,
    ]);
    expect(choices).toEqual([
      [
        "btn-guided-columns",
        "Columns in this sheet",
        "Text, links, or Drive files already in your spreadsheet",
      ],
      ["btn-guided-folder", "A Drive folder", "Import a folder, one file per row"],
    ]);
  });

  it("'Columns in this sheet' opens Guided preset to column input, resuming earlier work", () => {
    const c = mountPanel();
    c.querySelector<HTMLButtonElement>("#btn-guided-columns")!.click();
    expect(mockNav.navigate).toHaveBeenCalledWith(
      "guided-ai-inference",
      { startWith: "column" },
      { resume: true },
    );
  });

  it("'A Drive folder' opens Guided preset to Drive-folder input, resuming earlier work", () => {
    const c = mountPanel();
    c.querySelector<HTMLButtonElement>("#btn-guided-folder")!.click();
    expect(mockNav.navigate).toHaveBeenCalledWith(
      "guided-ai-inference",
      { startWith: "drive-folder" },
      { resume: true },
    );
  });

  it("'Go Freeform' is a text link that navigates to configure-ai-run with no params", () => {
    const c = mountPanel();
    const link = c.querySelector<HTMLButtonElement>(".home-freeform #btn-run-ai")!;
    expect(link.classList.contains("link-btn")).toBe(true);
    expect(link.textContent).toBe("Go Freeform");
    link.click();
    expect(mockNav.navigate).toHaveBeenCalledWith("configure-ai-run");
  });
});

describe("ToolListPanel — other tools", () => {
  it("renders the other tools as rows with one-line descriptions, in order", () => {
    const c = mountPanel();
    expect(c.querySelector(".home-tools h3")!.textContent).toBe("Other tools");
    const rows = Array.from(c.querySelectorAll(".tool-row")).map((row) => [
      row.id,
      row.querySelector(".tool-row-name")!.textContent,
      row.querySelector(".tool-row-sub")!.textContent,
    ]);
    expect(rows).toEqual([
      [
        "btn-import-drive-links",
        "Import Drive Links",
        "Add a folder's files to your sheet, by file type",
      ],
      ["btn-extract-text", "Extract Text", "Pull text from Docs, PDFs, and images"],
      ["btn-sample-rows", "Sample Rows", "Pick a random set to check by hand"],
      ["btn-format-markdown", "Format Markdown", "Turn AI **formatting** into rich text"],
    ]);
  });

  it("clicking Import Drive Links navigates to import-drive-links panel", () => {
    const c = mountPanel();
    c.querySelector<HTMLButtonElement>("#btn-import-drive-links")!.click();
    expect(mockNav.navigate).toHaveBeenCalledWith("import-drive-links");
  });

  it("clicking Extract Text navigates to extract-text panel", () => {
    const c = mountPanel();
    c.querySelector<HTMLButtonElement>("#btn-extract-text")!.click();
    expect(mockNav.navigate).toHaveBeenCalledWith("extract-text");
  });

  it("clicking Sample Rows dispatches a job labelled '🎲 Sample Rows' (no description)", () => {
    (services.runTool as jest.Mock).mockResolvedValue(undefined);
    const c = mountPanel();
    c.querySelector<HTMLButtonElement>("#btn-sample-rows")!.click();
    expect(services.runTool).toHaveBeenCalledWith(
      "sampleRowsToEvaluation",
      expect.stringMatching(/^sampleRowsToEvaluation-\d+$/),
    );
    expect(jobStoreModule.jobStore.dispatch).toHaveBeenCalledWith(
      expect.stringMatching(/^sampleRowsToEvaluation-\d+$/),
      "🎲 Sample Rows",
      expect.anything(),
    );
  });

  it("disables Format Markdown and shows 'Formatting...' while in flight, then restores", async () => {
    let resolve!: () => void;
    (services.formatMarkdownSelection as jest.Mock).mockReturnValue(
      new Promise<void>((res) => {
        resolve = res;
      }),
    );
    const c = mountPanel();
    const btn = c.querySelector<HTMLButtonElement>("#btn-format-markdown")!;

    btn.click();
    expect(btn.disabled).toBe(true);
    expect(btn.querySelector(".tool-row-name")!.textContent).toBe("Formatting...");
    expect(btn.querySelector(".tool-row-sub")).not.toBeNull();

    resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(btn.disabled).toBe(false);
    expect(btn.querySelector(".tool-row-name")!.textContent).toBe("Format Markdown");
  });

  it("ignores a second Format Markdown click while the first is in flight", () => {
    (services.formatMarkdownSelection as jest.Mock).mockReturnValue(new Promise<void>(() => {}));
    const c = mountPanel();
    const btn = c.querySelector<HTMLButtonElement>("#btn-format-markdown")!;
    btn.click();
    btn.click();
    expect(services.formatMarkdownSelection).toHaveBeenCalledTimes(1);
  });

  it("re-enables Format Markdown and alerts on error", async () => {
    let reject!: (err: Error) => void;
    (services.formatMarkdownSelection as jest.Mock).mockReturnValue(
      new Promise<void>((_, rej) => {
        reject = rej;
      }),
    );
    const mockAlert = jest.fn();
    const origAlert = globalThis.alert;
    globalThis.alert = mockAlert;

    const c = mountPanel();
    const btn = c.querySelector<HTMLButtonElement>("#btn-format-markdown")!;
    btn.click();
    expect(btn.disabled).toBe(true);

    reject(new Error("GAS error"));
    await Promise.resolve();
    await Promise.resolve();
    expect(btn.disabled).toBe(false);
    expect(btn.querySelector(".tool-row-name")!.textContent).toBe("Format Markdown");
    expect(mockAlert).toHaveBeenCalledWith("GAS error");

    globalThis.alert = origAlert;
  });
});

describe("ToolListPanel — footer", () => {
  it("links 'Why one row at a time?' to the IRE post in a new tab", () => {
    const c = mountPanel();
    const link = c.querySelector<HTMLAnchorElement>(".home-footer a")!;
    expect(link.textContent).toBe("Why one row at a time?");
    expect(link.getAttribute("href")).toBe(
      "https://www.ire.org/2026/08/13/using-llms-in-data-journalism-can-be-trustworthy-if-these-five-elements-are-in-your-methodology/",
    );
    expect(link.target).toBe("_blank");
    expect(link.rel).toBe("noopener");
  });

  it("shows the Looper version placeholder exactly once", () => {
    const c = mountPanel();
    const footer = c.querySelector(".home-footer")!;
    expect(footer.textContent).toContain("Looper v{{VERSION}}");
    expect(c.innerHTML.split("{{VERSION}}")).toHaveLength(2);
  });
});

it("unmount() returns undefined", () => {
  document.body.innerHTML = '<div id="app"></div>';
  const panel = new ToolListPanel();
  panel.mount(document.getElementById("app")!, mockNav);
  expect(panel.unmount()).toBeUndefined();
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest __tests__/panels/tool-list.test.ts`
Expected: FAIL. `.home-question` is null (`Cannot read properties of null`), and the choice ids don't exist.

- [ ] **Step 3: Rewrite `ToolListPanel`**

Replace the entire contents of `src/client/panels/tool-list.ts` with:

```ts
import type { NavigationContext, Panel } from "../types";
import type { GuidedParams } from "./guided-ai-inference";
import { runTool, formatMarkdownSelection } from "../services";
import { jobStore } from "../job-store";

// Placeholder until our own post on row-by-row AI is published.
const WHY_ONE_ROW_URL =
  "https://www.ire.org/2026/08/13/using-llms-in-data-journalism-can-be-trustworthy-if-these-five-elements-are-in-your-methodology/";

export class ToolListPanel implements Panel {
  mount(container: HTMLElement, nav: NavigationContext): void {
    container.innerHTML = this.template();
    this.wireEvents(container, nav);
  }

  unmount(): undefined {
    return undefined;
  }

  private wireEvents(container: HTMLElement, nav: NavigationContext): void {
    // A preset is a suggestion: { resume: true } lets earlier Guided work win.
    const openGuided = (startWith: GuidedParams["startWith"]): void => {
      const params: GuidedParams = { startWith };
      nav.navigate("guided-ai-inference", params, { resume: true });
    };
    container.querySelector("#btn-guided-columns")?.addEventListener("click", () => {
      openGuided("column");
    });
    container.querySelector("#btn-guided-folder")?.addEventListener("click", () => {
      openGuided("drive-folder");
    });
    container.querySelector("#btn-run-ai")?.addEventListener("click", () => {
      nav.navigate("configure-ai-run");
    });
    container.querySelector("#btn-import-drive-links")?.addEventListener("click", () => {
      nav.navigate("import-drive-links");
    });
    container.querySelector("#btn-extract-text")?.addEventListener("click", () => {
      nav.navigate("extract-text");
    });
    container.querySelector("#btn-sample-rows")?.addEventListener("click", () => {
      this.dispatchTool("sampleRowsToEvaluation", "🎲 Sample Rows");
    });
    container.querySelector("#btn-format-markdown")?.addEventListener("click", () => {
      const btn = container.querySelector<HTMLButtonElement>("#btn-format-markdown")!;
      const name = btn.querySelector(".tool-row-name")!;
      btn.disabled = true;
      name.textContent = "Formatting...";
      formatMarkdownSelection()
        .catch((err: Error) => globalThis.alert(err.message))
        .finally(() => {
          btn.disabled = false;
          name.textContent = "Format Markdown";
        });
    });
  }

  private dispatchTool(fn: string, label: string): void {
    const jobId = `${fn}-${Date.now()}`;
    jobStore
      .dispatch(jobId, label, runTool(fn, jobId))
      .catch((err: Error) => globalThis.alert(err.message));
  }

  private template(): string {
    const choice = (id: string, icon: string, name: string, sub: string): string => `
      <button id="${id}" class="home-choice">
        <span class="icon">${icon}</span>
        <span>
          <span class="home-choice-name">${name}</span>
          <span class="home-choice-sub">${sub}</span>
        </span>
      </button>`;
    const toolRow = (id: string, icon: string, name: string, sub: string): string => `
      <button id="${id}" class="tool-row">
        <span class="icon">${icon}</span>
        <span>
          <span class="tool-row-name">${name}</span>
          <span class="tool-row-sub">${sub}</span>
        </span>
      </button>`;
    return `
      <p class="home-question">What do you want to work on?</p>
      <p class="home-help">AI will read each row, one at a time.</p>
      ${choice(
        "btn-guided-columns",
        "📄",
        "Columns in this sheet",
        "Text, links, or Drive files already in your spreadsheet",
      )}
      ${choice("btn-guided-folder", "📂", "A Drive folder", "Import a folder, one file per row")}
      <p class="home-freeform">Already know what to do? <button id="btn-run-ai" class="link-btn">Go Freeform</button></p>
      <div class="home-tools">
        <h3>Other tools</h3>
        ${toolRow(
          "btn-import-drive-links",
          "📂",
          "Import Drive Links",
          "Add a folder's files to your sheet, by file type",
        )}
        ${toolRow("btn-extract-text", "📜", "Extract Text", "Pull text from Docs, PDFs, and images")}
        ${toolRow("btn-sample-rows", "🎲", "Sample Rows", "Pick a random set to check by hand")}
        ${toolRow(
          "btn-format-markdown",
          "📝",
          "Format Markdown",
          "Turn AI **formatting** into rich text",
        )}
      </div>
      <div class="home-footer">
        <a href="${WHY_ONE_ROW_URL}" target="_blank" rel="noopener">Why one row at a time?</a>
        <span>Looper v{{VERSION}}</span>
      </div>
    `;
  }
}
```

Note: the "Go Freeform" `<p>` is kept on one line on purpose. Splitting it would add whitespace around the link text, and the test asserts `textContent` is exactly "Go Freeform". If Prettier rewraps the template literal, it leaves template-literal contents alone, so this is safe.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest __tests__/panels/tool-list.test.ts`
Expected: PASS.

- [ ] **Step 5: Replace the home-page CSS**

In `src/client/sidebar.css`, delete these rule blocks entirely. They are used only by the old home page (`grep -rn "tool-btn\|status-footer" src` should return only `sidebar.css` before deletion):
- `.tool-btn { ... }`, `.tool-btn:hover { ... }`, `.tool-btn:active { ... }` (around lines 59–86)
- `.status-footer { ... }` (around lines 95–105)
- The whole `/* ── Tool list button hierarchy ── */` section: `.tool-btn-text`, `.tool-btn-sub`, `.tool-btn:hover .tool-btn-sub`, the comment block, `.tool-btn:has(.tool-btn-text)`, and `.tool-btn:has(.tool-btn-text) .icon` (around lines 535–566)

Keep the global `.icon` rule. In place of the deleted "Tool list button hierarchy" section (just before `.field-helper`), add:

```css
/* ── Home page (ToolListPanel) ── */

.home-question {
  font-size: var(--font-size-400);
  font-weight: 500;
  margin: 0 0 4px 0;
}

.home-help {
  font-size: var(--font-size-200);
  color: var(--text-secondary);
  line-height: 1.45;
  margin: 0 0 12px 0;
}

.home-choice {
  width: 100%;
  display: flex;
  gap: 12px;
  align-items: flex-start;
  text-align: left;
  padding: 12px;
  margin-bottom: 8px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  font-family: var(--font-family);
  color: var(--text-main);
}

.home-choice:hover {
  border-color: var(--primary-blue);
  background: rgba(26, 115, 232, 0.06);
}

.home-choice .icon,
.tool-row .icon {
  margin: 0;
  font-size: var(--font-size-400);
  width: 20px;
}

.home-choice-name {
  display: block;
  font-size: var(--font-size-300);
  font-weight: 500;
}

.home-choice-sub {
  display: block;
  font-size: var(--font-size-200);
  color: var(--text-secondary);
  line-height: 1.4;
  margin-top: 2px;
}

.home-freeform {
  font-size: var(--font-size-200);
  color: var(--text-secondary);
  margin: 10px 0 0 4px;
}

.home-freeform .link-btn {
  padding: 0;
}

.home-tools {
  margin-top: 28px;
}

.tool-row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 4px;
  background: none;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  text-align: left;
  font-family: var(--font-family);
  font-size: var(--font-size-300);
  color: var(--text-main);
}

.tool-row:hover {
  background: var(--hover-blue);
  color: var(--primary-blue);
}

.tool-row:disabled {
  opacity: 0.6;
  cursor: default;
}

.tool-row-name {
  display: block;
}

.tool-row-sub {
  display: block;
  font-size: var(--font-size-200);
  color: var(--text-secondary);
}

.home-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 28px;
  padding-top: 12px;
  border-top: 1px solid #eee;
  font-size: var(--font-size-100);
  color: var(--text-secondary);
}

.home-footer a {
  color: var(--text-secondary);
}
```

Then confirm nothing still references the removed classes:

Run: `grep -rn "tool-btn\|status-footer" src`
Expected: no output.

- [ ] **Step 6: Commit**

```bash
npx prettier --write src/client/panels/tool-list.ts src/client/sidebar.css __tests__/panels/tool-list.test.ts
npx jest __tests__/panels/tool-list.test.ts
git add src/client/panels/tool-list.ts src/client/sidebar.css __tests__/panels/tool-list.test.ts
git commit -m "Redesign sidebar home page around 'What do you want to work on?' (AI-129)

Two choices open Guided preset to column or Drive-folder input; Freeform
moves to a text link; other tools become compact rows with one-line
descriptions; footer links to 'Why one row at a time?'.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Full verification

**Files:** none (fixes only if a check fails)

**Interfaces:** consumes everything above; produces a branch that passes CI's checks and a built `dist/Sidebar.html`.

- [ ] **Step 1: Run the full gate**

Run each and confirm:

```bash
npm run lint           # Expected: 0 errors, 0 warnings
npm run typecheck      # Expected: no output after the two tsc commands
npm run format:check   # Expected: "All matched files use Prettier code style!"
npm run test:coverage  # Expected: all suites pass; no "coverage threshold" failures
npm run build          # Expected: dist/Sidebar.html and dist/index.js created
```

If lint reports a missing explicit return type, add the return type at the reported line rather than disabling the rule.

- [ ] **Step 2: Check the built sidebar**

```bash
grep -c "What do you want to work on?" dist/Sidebar.html   # Expected: 1
grep -o "Looper v[^<]*" dist/Sidebar.html                   # Expected: "Looper v" + major version, e.g. "Looper v9"
grep -c "{{VERSION}}" dist/Sidebar.html                     # Expected: 0
```

- [ ] **Step 3: Commit any fixes**

Only if Steps 1–2 required changes:

```bash
git add -A src __tests__ docs
git commit -m "Fix lint/format issues in home page refactor (AI-129)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 4: Hand off manual QA**

Manual QA on the dev sheet is done by the human, using the nine steps in section 5 of the spec. Report the branch as ready for `npm run deploy` and QA. Do not deploy, push, or open a PR without being asked.
