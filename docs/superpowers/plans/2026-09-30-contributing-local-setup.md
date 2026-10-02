# CONTRIBUTING.md Local Setup (AI-119) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure `CONTRIBUTING.md` so a developer can go from clone to a working dev Sheet using only that file, and surface the threat-model and permissions-doc obligations.

**Architecture:** Docs-only change to two files. `CONTRIBUTING.md` is rewritten in full (new intro pointers, new Local Setup section, promoted server-function section, trimmed Testing and Code Style). The restructure tracker records the outcome. No code, no README or `CLAUDE.md` edits.

**Tech Stack:** Markdown, Prettier (`npm run format:check` covers `.md`), git.

**Spec:** `docs/superpowers/specs/2026-09-30-contributing-local-setup-design.md`

## Global Constraints

- Branch `AI-119-contributing-local-setup`; PR targets `AI-102-docs-restructure-tracker`, not `develop`.
- Do not modify `README.md`, `CLAUDE.md`, or anything under `docs/threat_models/`, `docs/plans/` (except the tracker), `docs/superpowers/` (except this plan).
- One setup path only: container-bound script on the contributor's own dev Sheet.
- No "Enable the Drive Advanced Service" step.
- No pointer to `docs/plans/` or `docs/superpowers/` in CONTRIBUTING.
- Node version: 22 (matches `.nvmrc`).
- Audience is developers; technical language is fine.
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

These are the newcomer failure modes the doc must head off. Each is pinned by a grep check in Task 1, Step 2.

1. First `npm run deploy` fails with "User has not enabled the Apps Script API": the prerequisite must name the toggle URL and quote the error.
2. `npm run deploy` run before `npm run clasp:login`: the steps must list login before deploy, in one code block, in that order.
3. `.clasp.json` missing `rootDir: "./dist"`, so clasp pushes `src/` TypeScript: the heredoc must include `rootDir`.
4. Menu doesn't show after push: the doc must say to reload the Sheet.
5. Drive tools fail because the advanced service isn't on. This can't be checked by grep; it's covered by the manual QA step in the PR body (Task 2, Step 4).

---

### Task 1: Rewrite CONTRIBUTING.md

**Files:**
- Modify: `CONTRIBUTING.md` (full replacement)

**Interfaces:**
- Produces: the anchor `CONTRIBUTING.md#local-setup` (referenced by the tracker note in Task 2) and `#day-to-day-commands` (referenced within the file).

- [ ] **Step 1: Replace `CONTRIBUTING.md` with exactly this content**

````markdown
# Contributing

Start with [Local Setup](#local-setup) to get a working dev loop against your own Google Sheet.

Before opening a PR:

- **Check the threat model.** If your change affects anything documented in [`docs/threat_models/`](docs/threat_models/), or introduces a new threat, update it in the same PR.
- **Keep [`docs/permissions.md`](docs/permissions.md) accurate.** If you change OAuth scopes in `appsscript.json`, add or change a data flow, change what's retained or logged, or rename/move a function listed in its "Code references" table, update it in the same PR. It's public and user-facing.

## Local Setup

You'll run the toolkit as a [container-bound script](https://developers.google.com/apps-script/guides/bound) attached to a Google Sheet you own. It's the fastest dev loop: every push shows up in your Sheet's menu, with no test deployment needed. If you're working on add-on-specific behavior or distributing the toolkit, see [Deploying as an Editor Add-on](docs/deploying-as-an-editor-add-on.md) instead.

### Prerequisites

- A Google account
- Node.js 22 (pinned in `.nvmrc`, so `nvm use` picks it up)
- The Apps Script API enabled at [script.google.com/home/usersettings](https://script.google.com/home/usersettings). Without it, your first push fails with "User has not enabled the Apps Script API."
- [A Gemini API key](https://ai.google.dev/gemini-api/docs/api-key)
  - Tip: [AI Studio](https://aistudio.google.com/api-keys) makes it easy to mint a key and [set a monthly spend cap](https://aistudio.google.com/spend) to avoid surprise billing

`@google/clasp` is included as a devDependency, so no global install is needed.

### 1. Create a dev Sheet and its Apps Script project

Create a new Google Sheet to use as your dev Sheet, then open **Extensions → Apps Script**. This creates an Apps Script project bound to that Sheet.

### 2. Set your Gemini API key

In the script editor: **Project Settings** → **Script Properties** → add `GEMINI_API_KEY` with your API key. Anyone with Editor access to your dev Sheet can see this key.

### 3. Get the script ID

In the script editor: **Project Settings** → copy the **Script ID**.

### 4. Create `.clasp.json`

At the repo root (the file is gitignored):

```zsh
cat > .clasp.json << 'EOF'
{
  "scriptId": "<your-script-id>",
  "rootDir": "./dist"
}
EOF
```

### 5. Install and deploy

```zsh
npm install
npm run clasp:login    # authenticate with Google
npm run deploy         # build + push to Apps Script
```

Reload your dev Sheet. The **📐 SSI Toolkit** menu should appear.

### Day-to-day commands

```bash
# Build
npm run build               # clean build to dist/
npm run build:watch         # rebuild on file changes

# Deploy
npm run deploy              # build + push to your Apps Script project
npm run deploy:watch        # rebuild and push on every change

# Test
npm test                    # run all tests
npm run test:watch          # watch mode
npm run test:coverage       # with per-file coverage thresholds

# Quality
npm run lint                # ESLint
npm run lint:fix            # ESLint with auto-fix
npm run typecheck           # type-check without building
npm run format              # Prettier (rewrites files)
npm run format:check        # check Prettier formatting

# Utilities
npm run clasp:open          # open the Apps Script editor in your browser
npm run clasp:logs          # tail execution logs
```

## Branch Workflow

```
feature-branch → develop   (PR + code review)
develop        → main      (PR = release gate)
```

Feature work happens on branches, merged to `develop` via PR. When ready to ship, `develop` is merged to `main` via a PR containing manual QA instructions — that merge is the release gate.

## Exposing a new server function

Apps Script has no module system — it only sees top-level global functions. Rollup wraps everything in an IIFE assigned to `_GASEntry`, and `rollup.config.js`'s `footer` field appends plain global stubs that delegate into it (e.g. `function onOpen(e) { _GASEntry.onOpen(e); }`).

**To expose a new function to Apps Script, you must do both:**

1. `export` it from `src/server/index.ts`
2. Add a matching global stub in the `footer` of `rollup.config.js`

Skipping step 2 means Apps Script can't discover or call the function. If the function is also called from the client, also add it to `src/client/google.d.ts` — that file is **not auto-generated**, so a client-callable function typechecks against stale declarations and only fails at runtime if you skip this.

## Testing

Tests live in `__tests__/`. See [Day-to-day commands](#day-to-day-commands) for how to run them.

### Mocking GAS globals

Apps Script globals (`UrlFetchApp`, `DriveApp`, `SpreadsheetApp`, etc.) must be set on `globalThis` **before** importing the module under test, because imports execute immediately:

```ts
(globalThis as any).UrlFetchApp = { fetch: jest.fn() };
const { callGeminiAPI } = await import("../src/server/api");
```

### Mocking `google.script.run`

Capture the success/failure handlers registered by the function under test, then invoke them manually to simulate GAS callbacks:

```ts
const mockRun = {
  withSuccessHandler: jest.fn().mockReturnThis(),
  withFailureHandler: jest.fn().mockReturnThis(),
  myServerFunction: jest.fn(),
};
(globalThis as unknown as { google: unknown }).google = { script: { run: mockRun } };

let capturedSuccess: (v: unknown) => void;
mockRun.withSuccessHandler.mockImplementation((fn) => {
  capturedSuccess = fn;
  return mockRun;
});
// Later: capturedSuccess(mockValue) to simulate a successful GAS response.
```

### Coverage

Coverage is enforced per-file. Run `npm run test:coverage` to check thresholds. Two files are excluded from coverage collection:

- `src/server/index.ts` — deeply coupled to SpreadsheetApp UI globals, not unit-tested.
- `src/client/sidebar-entry.ts` — calls `init()` immediately at module load time, before `beforeEach` can set up the DOM.

## Code Style

The code follows the Google TypeScript Style Guide. ESLint, Prettier, and the husky pre-commit hooks enforce most of it automatically. The conventions tooling doesn't fully catch:

- Named exports only (no default exports)
- Avoid `any`; prefer `unknown`
- UpperCamelCase for types/interfaces, lowerCamelCase for functions/variables, CONSTANT_CASE for constants
- Prefix unused parameters with `_`

Run `npm run lint:fix` and `npm run format` before pushing (see [Day-to-day commands](#day-to-day-commands)).
````

- [ ] **Step 2: Run the content checks**

Run from the repo root:

```bash
f=CONTRIBUTING.md
check() { grep -qF -- "$1" "$f" && echo "ok   $1" || echo "FAIL $1"; }
check "script.google.com/home/usersettings"
check "User has not enabled the Apps Script API"
check '"rootDir": "./dist"'
check "Reload your dev Sheet"
check "docs/threat_models/"
check "docs/permissions.md"
check "docs/deploying-as-an-editor-add-on.md"
# login must precede deploy
awk '/clasp:login/{l=NR} /npm run deploy  /{d=NR} END{print (l && d && l<d) ? "ok   login before deploy" : "FAIL login before deploy"}' "$f"
# things that must be gone
for s in "Drive Advanced Service" "Adding a new Gemini tool" "Adding a recipe" "## Adding Features" "docs/plans" "docs/superpowers"; do
  grep -qF -- "$s" "$f" && echo "FAIL still present: $s" || echo "ok   absent: $s"
done
# relative links resolve
grep -oE '\]\((docs/[^)#]*)' "$f" | sed 's/](//' | while read -r p; do test -e "$p" && echo "ok   link $p" || echo "FAIL link $p"; done
# in-file anchors exist
grep -qE '^## Local Setup$' "$f" && echo "ok   anchor local-setup" || echo "FAIL anchor local-setup"
grep -qE '^### Day-to-day commands$' "$f" && echo "ok   anchor day-to-day-commands" || echo "FAIL anchor day-to-day-commands"
```

Expected: every line starts with `ok`.

- [ ] **Step 3: Run Prettier**

Run: `./node_modules/.bin/prettier --check CONTRIBUTING.md`
Expected: `All matched files use Prettier code style!`. If it warns, run `./node_modules/.bin/prettier --write CONTRIBUTING.md`, review the diff (formatting only), then re-run Step 2.

- [ ] **Step 4: Commit**

```bash
git add CONTRIBUTING.md
git commit -m "docs: add Local Setup and threat-model pointer to CONTRIBUTING (AI-119)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 2: Update the restructure tracker and prepare the PR

**Files:**
- Modify: `docs/plans/2026-09-21-docs-restructure-tracker.md` (row 5; new migration note in "Sequencing notes")

**Interfaces:**
- Consumes: the `CONTRIBUTING.md#local-setup` anchor from Task 1.

- [ ] **Step 1: Update row 5 of the table**

Replace row 5's cells so they read:
- Status: `Spec approved`
- Spec: `[design](../superpowers/specs/2026-09-30-contributing-local-setup-design.md)`
- Branch: `` `AI-119-contributing-local-setup` ``
- Starting hypothesis: prefix the existing text with this, then keep the original text after "Original hypothesis:" (matching row 7's pattern):

  `Scope finalized during this row's brainstorm: Local Setup prescribes one path (container-bound script on a personal dev Sheet), with a one-line pointer to row 4's guide for add-on work; setup steps written out rather than linked; README's Drive Advanced Service step dropped (manifest covers it — confirmed by manual QA); README's "Development" commands block moved here as "Day-to-day commands", replacing Testing's duplicate; intro gains the threat-model pointer plus a docs/permissions.md pointer; "Adding a new Gemini tool" and "Adding a recipe" deleted (both subsystems expected to change — reverses part of row 1), leaving "Exposing a new server function" as its own section; Code Style trimmed to what tooling doesn't enforce. CLAUDE.md untouched (see sequencing note). Original hypothesis:`

- [ ] **Step 2: Add two bullets to "Sequencing notes"**

Append:

```markdown
- Row 6 (README) can now point its dropped "Deployment (for contributors)"
  and "Development" content at `CONTRIBUTING.md#local-setup` (row 5).
- For the separate `CLAUDE.md` → `AGENTS.md` migration: make
  `CONTRIBUTING.md` the canonical source for human-relevant conventions.
  First port what only `CLAUDE.md` has today (the `@customfunction` stub
  step, the error-handling channels and `safe-writes.ts` /
  `sanitizeForCell`, the CSS tokens), then have the agent file import
  CONTRIBUTING instead of duplicating it, keeping only agent-specific
  material (sandbox, PR mechanics, session rules). Decided during row 5's
  brainstorm; deferred there to keep that PR docs-only.
```

- [ ] **Step 3: Format and commit**

```bash
./node_modules/.bin/prettier --check docs/plans/2026-09-21-docs-restructure-tracker.md
git add docs/plans/2026-09-21-docs-restructure-tracker.md docs/superpowers/plans/2026-09-30-contributing-local-setup.md
git commit -m "docs: record AI-119 spec outcome in restructure tracker

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

Expected: Prettier passes. If the tracker already failed Prettier before this change (check with `git stash; prettier --check …; git stash pop`), don't reformat the whole table; leave pre-existing formatting as-is.

- [ ] **Step 4: Hand off push and PR**

Pushing hangs in this sandbox (known issue), so hand `git push -u origin AI-119-contributing-local-setup` to the user. After they push, create the PR against `AI-102-docs-restructure-tracker` per CLAUDE.md's "Creating PRs" (curl, with `Authorization: Bearer $GH_TOKEN`, JSON payload written to a `$TMPDIR` file first). The Manual QA feature-specific steps, placed above the template's regression checklist:

1. On a fresh Google Sheet, follow CONTRIBUTING.md → Local Setup verbatim. Do **not** open the Apps Script editor's Services panel.
2. After `npm run deploy`, reload the Sheet and confirm the **📐 SSI Toolkit** menu appears.
3. Run **📐 SSI Toolkit → Open SSI Toolkit → Extract Text** on a row linking a Drive PDF. Confirm text is extracted. A Drive service error means the dropped Advanced Service step must be restored.
4. Click through every link in CONTRIBUTING.md on the PR's rendered file view and confirm each resolves.
