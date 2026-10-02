# Looper Rebrand Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every user-, contributor-, and installer-facing "SSI Toolkit" reference in the repo with "Looper", in one PR to `develop`.

**Architecture:** Pure string/doc changes plus two `git mv` renames. No behavior changes. The add-on strings are pinned by Jest tests, so Task 1 updates those tests first (red), then the source (green).

**Tech Stack:** TypeScript, Jest, Markdown docs.

**Spec:** `docs/superpowers/specs/2026-10-02-looper-rebrand-design.md`

## Global Constraints

- Branch: `AI-125-looper-rebrand` (already exists, already checked out). Commit only; do not push (the sandbox hangs on `git push`, so the user pushes).
- Menu: `➰ Looper`; menu item: `➰ Open Looper`; sidebar title: `Looper`; footer: `Looper v{{VERSION}}`.
- T6 rejection string: `[Error: AI response contained an external request formula — output rejected]`.
- Temp OCR prefix: `[LOOPER-TEMP] ` (uppercase, trailing space). Do **not** mention the old `[SSI-TEMP]` anywhere.
- Threat models: `docs/threat_models/looper-threat-model.md` and `docs/threat_models/looper-threat-model-journalist.md`. The planned source model becomes `looper-threat-model-source.md`.
- Repo URL: `https://github.com/propublica/gas-looper`; clone folder: `gas-looper`.
- **Do not touch:** `=SSI()`, i.e. `src/server/customFunctions.ts`, `__tests__/customFunctions.test.ts`, the `SSI` stub and its JSDoc in `rollup.config.js`, and `export { SSI }` in `src/server/index.ts`. Also leave `docs/plans/**`, `docs/superpowers/**` (except this plan and its spec), and `docs/prototypes/**` alone.
- Prose: "SSI Toolkit" / "the SSI Toolkit" → "Looper" (drop the article); "SSI Toolkit's" → "Looper's"; "SSI" as a product noun → "Looper". Leave generic "the toolkit" phrasing as is.
- Never run `scripts/release.sh`. Editing its echo text is allowed.

## Review Focus

1. **Sidebar title bar** (`setTitle`) is currently untested, so a typo would only show up live. Task 1 adds a test that pins it to `Looper`.
2. **Sidebar footer text** is currently untested. Task 1 adds a test that pins `Looper v`.
3. **Stale threat-model links**: a missed link to the old filename becomes a 404 in a public doc or a dead reference in code. Task 5's grep requires zero `ssi-toolkit-threat-model` hits.
4. **Collateral `SSI()` edits**: a global find-and-replace could rename the custom function and break users' formulas. Task 5's grep audit plus the unchanged passing `customFunctions.test.ts` guard against this.
5. **Emoji rendering in the Sheets menu**: no test can check this. It's a manual QA item in the PR.

---

### Task 1: Add-on strings

**Files:**
- Modify: `src/server/index.ts:2,67,68,100,199`
- Modify: `src/client/panels/tool-list.ts:99`
- Modify: `src/server/safe-writes.ts:32`
- Modify: `src/server/drive.ts:34`
- Modify: `src/shared/types.ts:2`
- Test: `__tests__/menu.test.ts`, `__tests__/panels/tool-list.test.ts`, `__tests__/safe-writes.test.ts`, `__tests__/drive.test.ts`

**Interfaces:** none. No signatures change.

- [ ] **Step 1: Update the menu tests and add a sidebar-title test**

In `__tests__/menu.test.ts`, replace lines 95–104 so they read:

```ts
  it("creates a menu named '➰ Looper'", () => {
    onOpen();
    expect(mockCreateMenu).toHaveBeenCalledWith("➰ Looper");
  });

  it("adds a single item that opens the sidebar", () => {
    onOpen();
    expect(mockAddItem).toHaveBeenCalledTimes(1);
    expect(mockAddItem).toHaveBeenCalledWith("➰ Open Looper", "showSidebar");
  });
```

In the same file's `describe("showSidebar", …)` block, add after the "evaluates the template and shows the sidebar" test:

```ts
  it("titles the sidebar 'Looper'", () => {
    showSidebar();
    const output = mockEvaluate.mock.results[0].value;
    expect(output.setTitle).toHaveBeenCalledWith("Looper");
  });
```

- [ ] **Step 2: Add a footer test**

In `__tests__/panels/tool-list.test.ts`, inside `describe("ToolListPanel", …)`, add:

```ts
  it("shows the Looper name and version in the footer", () => {
    const c = mountPanel();
    expect(c.querySelector(".status-footer")!.textContent).toContain("Looper v");
  });
```

- [ ] **Step 3: Update the T6 and temp-prefix expectations**

```bash
sed -i '' 's/\[SSI Error: AI response contained/[Error: AI response contained/g' __tests__/safe-writes.test.ts
sed -i '' 's/\[SSI-TEMP\]/[LOOPER-TEMP]/g' __tests__/drive.test.ts
```

Expected: 7 replacements in `safe-writes.test.ts` (lines 34, 117, 148, 187, 217, 261, 342) and 3 in `drive.test.ts` (lines 218, 243, 258). Check with `grep -c 'SSI' __tests__/safe-writes.test.ts __tests__/drive.test.ts`; both counts should be 0.

- [ ] **Step 4: Run the tests and confirm they fail**

Run: `npx jest __tests__/menu.test.ts __tests__/panels/tool-list.test.ts __tests__/safe-writes.test.ts __tests__/drive.test.ts`
Expected: FAIL. The menu tests expect `➰ Looper`, the title test expects `Looper`, the footer test can't find "Looper v", the safe-writes tests receive `[SSI Error: …`, and the drive tests receive `[SSI-TEMP] report.pdf`.

- [ ] **Step 5: Update the source strings**

- `src/server/index.ts:67`: `.createMenu("📐 SSI Toolkit")` → `.createMenu("➰ Looper")`
- `src/server/index.ts:68`: `.addItem("📐 Open SSI Toolkit", "showSidebar")` → `.addItem("➰ Open Looper", "showSidebar")`
- `src/server/index.ts:100`: `.setTitle("SSI Toolkit")` → `.setTitle("Looper")`
- `src/server/index.ts:199` (comment): `// [SSI-TEMP] prefix` → `// [LOOPER-TEMP] prefix`
- `src/server/index.ts:2` (comment): ` * index.ts — Entry point for SSI Drive & AI Tools.` → ` * index.ts — Entry point for Looper.`
- `src/client/panels/tool-list.ts:99`: `<strong>SSI Toolkit v{{VERSION}}</strong>` → `<strong>Looper v{{VERSION}}</strong>`
- `src/server/safe-writes.ts:32`: `"[SSI Error: AI response contained an external request formula — output rejected]"` → `"[Error: AI response contained an external request formula — output rejected]"`
- `src/server/drive.ts:34`: `const TEMP_OCR_DOC_PREFIX = "[SSI-TEMP] ";` → `const TEMP_OCR_DOC_PREFIX = "[LOOPER-TEMP] ";`
- `src/shared/types.ts:2` (comment): ` * Shared types for the SSI Toolkit.` → ` * Shared types for Looper.`

Leave `export { SSI } from "./customFunctions";` (line 11) unchanged.

- [ ] **Step 6: Run the tests and confirm they pass**

Run: `npx jest __tests__/menu.test.ts __tests__/panels/tool-list.test.ts __tests__/safe-writes.test.ts __tests__/drive.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/server/index.ts src/client/panels/tool-list.ts src/server/safe-writes.ts src/server/drive.ts src/shared/types.ts __tests__/menu.test.ts __tests__/panels/tool-list.test.ts __tests__/safe-writes.test.ts __tests__/drive.test.ts
git commit -m "feat: rebrand add-on UI strings to Looper (AI-125)

Menu, sidebar title/footer, temp OCR doc prefix, and the T6 rejection
string, which now uses the same [Error: ...] format as every other
cell error.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Threat-model rename and links

**Files:**
- Rename: `docs/threat_models/ssi-toolkit-threat-model.md` → `docs/threat_models/looper-threat-model.md`
- Rename: `docs/threat_models/ssi-toolkit-threat-model-journalist.md` → `docs/threat_models/looper-threat-model-journalist.md`
- Modify (links): `.github/PULL_REQUEST_TEMPLATE.md:20`, `eslint.config.mjs:50`, `src/server/error-handling.ts:10`, `src/server/gemini-auth.ts:14`, `src/server/safe-writes.ts:8`, `__tests__/api-key-hygiene.test.ts:10`, `docs/permissions.md:21`

**Interfaces:** Produces the new filenames that Task 3 and Task 5 rely on.

- [ ] **Step 1: Rename the files**

```bash
git mv docs/threat_models/ssi-toolkit-threat-model.md docs/threat_models/looper-threat-model.md
git mv docs/threat_models/ssi-toolkit-threat-model-journalist.md docs/threat_models/looper-threat-model-journalist.md
```

- [ ] **Step 2: Rewrite every inbound link**

```bash
git grep -l 'ssi-toolkit-threat-model' -- . ':!docs/plans' ':!docs/superpowers' \
  | xargs sed -i '' 's/ssi-toolkit-threat-model/looper-threat-model/g'
```

This covers the seven link sites listed above, plus the companion-file table in `looper-threat-model.md` (lines 326–327, including the planned `-source` filename).

- [ ] **Step 3: Update the threat-model prose**

In `docs/threat_models/looper-threat-model.md`:
- Line 1: `# SSI Toolkit — Threat Model` → `# Looper — Threat Model`
- Line 5: `| Project | SSI Toolkit (Google Apps Script add-on for Google Sheets) |` → `| Project | Looper (Google Apps Script add-on for Google Sheets) |`
- Line 145: `read by SSI Toolkit server` → `read by Looper server`
- Lines 243 and 289: `[SSI-TEMP]` → `[LOOPER-TEMP]`

Leave mentions of `SSI()` (lines 248, 299, and any others) unchanged.

In `docs/threat_models/looper-threat-model-journalist.md`:
- Line 1: `# SSI Toolkit — Journalist Threat Model` → `# Looper — Journalist Threat Model`
- Line 5: `| Project | SSI Toolkit (Google Apps Script add-on for Google Sheets) |` → `| Project | Looper (Google Apps Script add-on for Google Sheets) |`
- Line 37: `reaches for SSI on a task` → `reaches for Looper on a task`
- Line 39: `decide to use SSI Toolkit without` → `decide to use Looper without`

- [ ] **Step 4: Verify**

Run: `git grep -n -E 'ssi-toolkit-threat-model|SSI Toolkit|SSI-TEMP' -- docs/threat_models .github eslint.config.mjs src __tests__/api-key-hygiene.test.ts`
Expected: no output.

Run: `npx jest __tests__/api-key-hygiene.test.ts && npm run lint`
Expected: PASS. The eslint config still parses, since only the string inside the message changed.

- [ ] **Step 5: Commit**

```bash
git add -A docs/threat_models .github/PULL_REQUEST_TEMPLATE.md eslint.config.mjs src/server/error-handling.ts src/server/gemini-auth.ts src/server/safe-writes.ts __tests__/api-key-hygiene.test.ts docs/permissions.md
git commit -m "docs: rename threat models to looper-threat-model* (AI-125)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: User and contributor docs

**Files:**
- Modify: `README.md:1,11,32,47,51,60`
- Modify: `docs/user-guide.md:1,3,5,7,11,13,136`
- Modify: `docs/permissions.md:1,3,10,12,16,58,81,87,107,121,124,130,134`
- Modify: `docs/deploying-as-an-editor-add-on.md:3,5,9,12,55,62,63`
- Modify: `CONTRIBUTING.md:22,23,62`

**Interfaces:** Consumes the threat-model link already fixed in `docs/permissions.md:21` by Task 2.

- [ ] **Step 1: Replace the repo URLs and folder names**

```bash
sed -i '' 's#propublica/gas-ssi-toolkit#propublica/gas-looper#g; s#^cd gas-ssi-toolkit$#cd gas-looper#' README.md CONTRIBUTING.md docs/deploying-as-an-editor-add-on.md docs/permissions.md
sed -i '' 's#\[ssi-skills\](https://github.com/propublica/ssi-skills)#[looper-skills](https://github.com/propublica/looper-skills)#' README.md
```

- [ ] **Step 2: Update the menu path and temp prefix**

- `docs/user-guide.md:7`: `**📐 SSI Toolkit → 📐 Open SSI Toolkit**` → `**➰ Looper → ➰ Open Looper**`
- `docs/permissions.md:81`: `**📐 SSI Toolkit** menu` → `**➰ Looper** menu`
- `CONTRIBUTING.md:62`: `**📐 SSI Toolkit** menu` → `**➰ Looper** menu`
- `docs/permissions.md:58`: `` `[SSI-TEMP]` `` → `` `[LOOPER-TEMP]` `` (don't add any note about the old prefix)

- [ ] **Step 3: Update the product name in prose**

Edit each remaining "SSI Toolkit" by hand, following the prose rule in Global Constraints. Read each sentence after editing so the grammar still works. Known sites:
- `README.md`: lines 1 (`# Looper`), 11, 32, 47
- `docs/user-guide.md`: line 1 (`# Looper — User Guide`), line 3 (`the SSI Toolkit's tools` → `Looper's tools`), line 5 (`Don't have Looper yet?`), line 11 (`SSI is best leveraged` → `Looper is best leveraged`), line 13 (`the full featureset of the SSI Toolkit` → `the full featureset of Looper`), line 136 (`Chain the SSI Toolkit and` → `Chain Looper and`)
- `docs/permissions.md`: lines 1 (`# Permissions: what Looper asks for, and why`), 3, 10 (`There's no Looper server.`), 12 and 16 (`your own copy of the Looper sheet`), 87, 107, 121 (`Looper's developers` … `There's no Looper server`), 124, 134
- `docs/deploying-as-an-editor-add-on.md`: lines 3, 5, 9, 12, 55

- [ ] **Step 4: Verify**

Run: `git grep -n -E 'SSI Toolkit|gas-ssi|ssi-skills|SSI-TEMP|📐' -- README.md CONTRIBUTING.md docs/user-guide.md docs/permissions.md docs/deploying-as-an-editor-add-on.md; git grep -n -w SSI -- README.md CONTRIBUTING.md docs/user-guide.md docs/permissions.md docs/deploying-as-an-editor-add-on.md`
Expected: no output. If a line mentions `=SSI()` as a function, list it in the commit body and leave it. None are expected.

Run: `npx prettier --check README.md CONTRIBUTING.md docs/*.md` (this is informational only; `format:check` covers `src/`).

- [ ] **Step 5: Commit**

```bash
git add README.md CONTRIBUTING.md docs/user-guide.md docs/permissions.md docs/deploying-as-an-editor-add-on.md
git commit -m "docs: rebrand user and contributor docs to Looper (AI-125)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Package metadata and remaining internals

**Files:**
- Modify: `package.json:2,4`
- Modify: `package-lock.json` (the two `"name": "gas-project"` entries, at the root and under `packages[""]`)
- Modify: `scripts/release.sh:10`
- Modify: `__tests__/gemini-auth.test.ts:32`

- [ ] **Step 1: Edit package metadata**

- `package.json`: `"name": "gas-project"` → `"name": "gas-looper"`; `"description": "Google Apps Script project with TypeScript, Rollup, and Clasp"` → `"description": "Looper — a Google Sheets add-on for running AI and document tools across spreadsheet rows"`
- `package-lock.json`: replace `"name": "gas-project"` with `"name": "gas-looper"` in both places. Don't run `npm install`, because the sandbox blocks registry.npmjs.org. Check with `grep -n '"gas-' package-lock.json | head`; it should show exactly two `gas-looper` lines.

- [ ] **Step 2: Edit the remaining strings**

- `scripts/release.sh:10`: `echo "⚠️  This will update the SSI Toolkit for everyone who has it installed."` → `echo "⚠️  This will update Looper for everyone who has it installed."`. Edit only; never run this script.
- `__tests__/gemini-auth.test.ts:32`: `// Pinned wording: customFunctions.test.ts asserts /\[SSI Error:.*GEMINI_API_KEY/` → `// Pinned wording: customFunctions.test.ts asserts /\[Error:.*GEMINI_API_KEY/`

- [ ] **Step 3: Verify**

Run: `npx jest __tests__/gemini-auth.test.ts && bash -n scripts/release.sh && node -e "JSON.parse(require('fs').readFileSync('package-lock.json'))"`
Expected: PASS, no syntax error, no JSON error.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json scripts/release.sh __tests__/gemini-auth.test.ts
git commit -m "chore: rename package to gas-looper and fix stale strings (AI-125)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Full verification and local config

**Files:**
- Modify (gitignored, not committed): `CLAUDE.local.md`

- [ ] **Step 1: Leftover audit**

Run:
```bash
git grep -n -E 'SSI Toolkit|SSI Tools|ssi-toolkit|gas-ssi|SSI-TEMP|SSI Error|📐|ssi-skills' -- . ':!docs/plans' ':!docs/superpowers' ':!docs/prototypes'
git grep -n -w 'SSI' -- . ':!docs/plans' ':!docs/superpowers' ':!docs/prototypes'
```
Expected hits, all `=SSI()`-related and allowed:
- `src/server/customFunctions.ts` (function, `logUnexpected("SSI", …)`)
- `src/server/index.ts:11` (`export { SSI }`)
- `rollup.config.js:112,115` (the SSI stub and its JSDoc)
- `__tests__/customFunctions.test.ts`
- `src/server/gemini-auth.ts:9` (comment about `SSI()`'s catch block)
- `docs/threat_models/looper-threat-model.md` mentions of `SSI()` (e.g. lines 248, 299)

Anything else is a miss. Fix it and commit separately (`git commit -m "fix: missed Looper rename in <file> (AI-125)"`).

- [ ] **Step 2: Full checks**

Run: `npm test && npm run lint && npm run typecheck && npm run format:check && npm run build`
Expected: all pass. Then run `grep -c 'Looper' dist/index.js dist/Sidebar.html`; both should be ≥ 1.

- [ ] **Step 3: Update `CLAUDE.local.md` (not committed)**

- Line 7: `via a custom menu ("SSI Tools")` → `via a custom menu ("➰ Looper")`
- Every `docs/threat_models/ssi-toolkit-threat-model.md` → `docs/threat_models/looper-threat-model.md`
- Every `propublica/gas-ssi-toolkit` → `propublica/gas-looper` (the git remote example and the PR-creation curl URL)
- The worktree symlink example `/path/to/gas-ssi-toolkit/.clasp.json` → `/path/to/gas-looper/.clasp.json`

Verify: `grep -n -E 'ssi-toolkit|gas-ssi|SSI Tools' CLAUDE.local.md` should print nothing.

- [ ] **Step 4: Hand off**

Report to the user:
- The commit list (`git log --oneline develop..HEAD`).
- They need to push the branch themselves, since `git push` hangs in the sandbox.
- Manual QA for the PR: run `npm run deploy`, reload the dev sheet, and check that the menu reads `➰ Looper` with `➰ Open Looper`, the emoji renders, and the sidebar title bar and footer say Looper.
- Remaining follow-ups: the README screenshot, and the local folder rename plus memory move (steps to be provided after merge).
