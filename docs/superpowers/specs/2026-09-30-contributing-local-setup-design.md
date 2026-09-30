# CONTRIBUTING.md — Local Setup + threat-model pointer (AI-119) — Design

Row 5 of the documentation restructure tracker
(`docs/plans/2026-09-21-docs-restructure-tracker.md`). Branch
`AI-119-contributing-local-setup`, cut from and PR'd into
`AI-102-docs-restructure-tracker`.

## Goal

A developer who wants to change the toolkit can get from `git clone` to seeing
their change in a Sheet using only `CONTRIBUTING.md`. That lets row 6 (AI-120)
delete README's "Deployment (for contributors)" and "Development" sections
without losing anything.

Audience is developers — technical language is fine (unlike
`docs/permissions.md`).

## Decisions

- **One setup path: a container-bound script on the contributor's own dev
  Sheet.** Fastest loop — the menu appears on push, no test deployment. README's
  current container-bound vs. editor add-on choice is dropped; a single line
  points to `docs/deploying-as-an-editor-add-on.md` for add-on-specific work or
  distribution. Rationale: nearly all contributor work behaves the same in both
  modes, and the add-on path already has a full guide that a partial copy would
  drift from.
- **Setup steps are written out, not linked.** The container-bound path has no
  GCP project linking, Marketplace, or deployment IDs, so it shares only ~4 lines
  with the distributor guide (`.clasp.json`, `clasp:login`, Apps Script API
  toggle, Node 22). Local Setup is self-contained, mirroring row 4's choice.
- **README's "Enable the Drive Advanced Service" step is dropped.**
  `appsscript.json` declares `enabledAdvancedServices` (Drive v3) and `clasp
push` carries it over. A container-bound script uses Apps Script's default GCP
  project, where Google documents the underlying API as enabled automatically —
  unlike the standard GCP project in row 4, which needs a manual Drive API
  enable. **Not yet empirically confirmed for this repo**; covered by the manual
  QA step below. If QA fails, the step comes back.
- **README's "Development" commands block moves here** as a "Day-to-day
  commands" subsection at the end of Local Setup. Testing's duplicate
  three-command block is removed in favor of a pointer.
- **"Adding a new Gemini tool" and "Adding a recipe" are deleted.** Both
  subsystems are expected to change and we'd rather not overcommit on
  documentation. (Row 1 had moved the Gemini tool checklist into CONTRIBUTING;
  this row reverses that part.) With only "Exposing a new server function"
  left, it's promoted to its own top-level section instead of keeping a
  single-child "Adding Features" heading.
- **`CLAUDE.md` is not touched.** Deduplication between CONTRIBUTING and
  `CLAUDE.md` is deferred to the `CLAUDE.md` → `AGENTS.md` migration (see
  Tracker update).
- **No pointer to `docs/plans/` or `docs/superpowers/`** — that lives in
  `docs/architecture.md` (row 1).

## Resulting structure of CONTRIBUTING.md

1. `# Contributing` + short intro containing:
   - Threat-model pointer: before opening a PR, check whether the change
     affects anything in [`docs/threat_models/`](../../threat_models/) and
     update it in the same PR if so.
   - `docs/permissions.md` pointer: changes to OAuth scopes, data flows, or
     functions listed in its code-references table must update it in the same
     PR (it's public and user-facing). One line beyond the issue's ask; both
     obligations already exist in `CLAUDE.md` but aren't visible to a human
     contributor.
2. `## Local Setup` (new)
3. `## Branch Workflow` (unchanged)
4. `## Exposing a new server function` (promoted from "Adding Features";
   content unchanged)
5. `## Testing` (trimmed)
6. `## Code Style` (trimmed)

### Local Setup

**Prerequisites**

- A Google account
- Node.js 22 (pinned in `.nvmrc`; `nvm use` picks it up)
- Apps Script API enabled at script.google.com/home/usersettings — without it
  the first push fails with "User has not enabled the Apps Script API."
- A Gemini API key, with README's AI Studio spend-cap tip
- `@google/clasp` is a devDependency — no global install

**Steps**

1. Create a new Google Sheet to use as your dev Sheet, then open
   **Extensions → Apps Script**. This creates the container-bound project.
2. **Project Settings → Script Properties** → add `GEMINI_API_KEY`. Keep
   README's note: the key is visible to anyone with Editor access to the Sheet.
3. **Project Settings** → copy the **Script ID**.
4. Create `.clasp.json` at the repo root (README's heredoc, `rootDir:
"./dist"`); note it's gitignored.
5. `npm install`, `npm run clasp:login`, `npm run deploy`, then reload the
   Sheet — the **SSI Tools** menu appears.

Followed by the one-line pointer to `docs/deploying-as-an-editor-add-on.md`.

**Day-to-day commands** — README's grouped block (Build / Deploy / Test /
Quality / Utilities) with per-command comments, plus `lint:fix` and `format`
(referenced by Code Style but missing from README's block). Note that
`deploy:watch` rebuilds and pushes on every change. Omits `push:watch` and
`prepare` (internal plumbing).

### Testing

Remove the three-command block; replace with a one-line pointer to Day-to-day
commands. Mocking-GAS-globals, mocking-`google.script.run`, and Coverage
subsections unchanged.

### Code Style

Lead with: ESLint + Prettier + husky pre-commit hooks enforce most of this.
Keep only the rules tooling doesn't mechanically catch: named exports only;
`unknown` over `any`; naming conventions (UpperCamelCase / lowerCamelCase /
CONSTANT*CASE); `*`-prefix unused parameters. Closing line points to the
commands block for `lint:fix`/`format`.

## Out of scope

- `README.md` — row 6 removes its Deployment and Development sections.
- `CLAUDE.md` — see Tracker update.
- `docs/threat_models/`, `docs/plans/`, `docs/superpowers/` content.

## Tracker update (same PR)

- Row 5: status → spec approved, with spec and branch links; → merged after
  merge, matching other rows. Record the Gemini tool / recipe section deletion.
- Note for the `CLAUDE.md` → `AGENTS.md` migration: make CONTRIBUTING the
  canonical source for human-relevant conventions; port the conventions only
  `CLAUDE.md` currently has (`@customfunction` stub step, error-handling
  channels and `safe-writes.ts` / `sanitizeForCell`, CSS tokens); have the
  agent file import CONTRIBUTING rather than duplicate it, keeping only
  agent-specific material (sandbox, PR mechanics, session rules).
- Note for row 6: README's Deployment/Development content now lives at
  `CONTRIBUTING.md#local-setup`.

## Verification

- `npm run format:check` passes.
- Every relative link in CONTRIBUTING.md resolves.
- Manual QA (in PR body): follow Local Setup verbatim on a fresh Sheet without
  touching the Services panel, then run **SSI Tools → Extract Text** on a Drive
  PDF. A Drive service error means the dropped Advanced Service step must be
  restored.
