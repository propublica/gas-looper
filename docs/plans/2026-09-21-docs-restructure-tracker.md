# Documentation Restructure — Tracker

Tracks progress on reorganizing the repo's audience-facing documentation
around a priority order of **container-bound script installers** →
**editor add-on installers/distributors** → **SSI Toolkit developers**.
Installation instructions are currently scattered unhelpfully between
README.md and docs/user-guide.md, with no single authoritative source for
either audience.

Rather than one combined effort, each row below gets its own brainstorm →
(spec, for the architectural ones) → implementation → PR. There is no
single overarching spec document — this tracker is the coordination point
across sessions.

**Branching model:** every row's branch is cut from
`AI-102-docs-restructure-tracker`, not from `develop`, and its PR targets
`AI-102-docs-restructure-tracker`, not `develop` — this deviates from
CLAUDE.md's default (feature branch → `develop`), so say so explicitly if
a session's PR step asks. Rows merge into `AI-102-docs-restructure-tracker`
incrementally as they land; that branch merges into `develop` once, at
the end, as a single PR. If you're starting a fresh session for a row,
make sure your local `AI-102-docs-restructure-tracker` is up to date
before branching from it, since earlier rows may have already merged in.

**Out of scope:** `docs/threat_models/`, `docs/superpowers/`,
`docs/plans/`, and `docs/prototypes/` keep their current location and
content unchanged. This effort only adds pointers to them where
appropriate (see rows 1 and 5). Migrating `CLAUDE.md` to `AGENTS.md`
(also named in the parent issue, AI-102) is a separate effort, tracked
independently of this tracker.

The "Starting hypothesis" column below is this session's initial take on
each doc's scope — not settled. Each row gets its own brainstorming
session before any implementation, and that session can revise, expand,
or reshape the scope, including moving content between rows or merging
or splitting rows. Don't treat these descriptions as a ceiling.

| #   | Doc                                           | Type          | Status      | Issue                                                | Spec | Branch                                                                                                                 | Starting hypothesis                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| --- | --------------------------------------------- | ------------- | ----------- | ---------------------------------------------------- | ---- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `docs/architecture.md` + `CONTRIBUTING.md`    | Bounded       | Merged      | [AI-115](https://linear.app/propublica/issue/AI-115) | —    | `AI-115-architecture-historical-records`, merged via [PR #177](https://github.com/propublica/gas-ssi-toolkit/pull/177) | Scope grew during this row's own brainstorm: architecture.md trimmed to four high-level sections only (Server/Client, Build Pipeline, Panel/Router System, Historical Design Records) — module-level detail (Tool System checklist, expose-a-function checklist, google.d.ts note) moved into CONTRIBUTING.md's existing "Adding Features" subsections, which previously just pointed at the sections now cut.                                                                                                                                                                                                                                                                                           |
| 2   | `docs/releasing.md`                           | Bounded       | Merged      | [AI-116](https://linear.app/propublica/issue/AI-116) | —    | `AI-116-document-release-process`, merged via [PR #178](https://github.com/propublica/gas-ssi-toolkit/pull/178)        | Scope grew substantially during this row's brainstorm: what started as documenting the git tag + GitHub release step became a full restructure into a numbered, step-by-step walkthrough covering all three distribution points (template Sheet, ProPublica's private Marketplace listing, and the public GitHub repo external adopters build from) — the third wasn't part of the original two-target framing. Also surfaced and fixed a real process gap along the way: repointing the Apps Script deployment doesn't by itself publish to Marketplace-installed users, so `scripts/release.sh` now blocks on a manual Marketplace SDK App Configuration update instead of silently reporting success. |
| 3   | `docs/user-guide.md`                          | Bounded       | Not started | [AI-117](https://linear.app/propublica/issue/AI-117) | —    | —                                                                                                                      | Trim "Installing the add-on" down to one line + pointer to row 4's doc. Everything else (tool-by-tool guidance, tips) stays as-is.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 4   | `docs/deploying-as-an-editor-add-on.md` (new) | Architectural | Merged | [AI-118](https://linear.app/propublica/issue/AI-118) | [design](../superpowers/specs/2026-09-22-deploying-as-editor-add-on-design.md) | `AI-118-deploying-as-editor-add-on`, merged via [PR #180](https://github.com/propublica/gas-ssi-toolkit/pull/180) | Scope finalized during this row's brainstorm: dropped the "what to tell your users" section (deferred, not part of this doc for now) and a *separate* Drive Advanced Service toggle in the Apps Script editor UI (the manifest declaration in `appsscript.json` covers that toggle; a standard GCP project's underlying Drive API still needs enabling by hand, which the doc documents as part of linking the GCP project rather than as its own step — corrected post-review, see the design doc); added linking the Apps Script project to the distributor's own standard GCP project (required for Marketplace distribution) and setting the Gemini API key. Remaining scope: what an editor add-on is, how to create one, the manual clasp steps to push `main` → your own project, and the two-step "push isn't live until you repoint the Marketplace listing" gotcha. |
| 5 | `CONTRIBUTING.md` | Architectural | Merged | [AI-119](https://linear.app/propublica/issue/AI-119) | [design](../superpowers/specs/2026-09-30-contributing-local-setup-design.md) | `AI-119-contributing-local-setup`, merged via [PR #183](https://github.com/propublica/gas-ssi-toolkit/pull/183) | Scope finalized during this row's brainstorm: Local Setup prescribes one path (container-bound script on a personal dev Sheet), with a one-line pointer to row 4's guide for add-on work; setup steps written out rather than linked; README's Drive Advanced Service step dropped (manifest covers it — to be confirmed in the PR's manual QA); README's "Development" commands block moved here as "Day-to-day commands", replacing Testing's duplicate; a git clone step added; a closing "Before opening a PR" checklist holds the threat-model pointer plus a docs/permissions.md pointer (moved from the top during review — it's read at PR time, not setup time); "Adding a new Gemini tool" and "Adding a recipe" deleted (both subsystems expected to change — reverses part of row 1), leaving "Exposing a new server function" as its own section; Code Style trimmed to what tooling doesn't enforce. Also added a Prerequisites section to row 4's distributor guide (Workspace account + GCP-project permission requirements). CLAUDE.md untouched (see sequencing note). Original hypothesis: New "Local Setup" section up top, ported from README's current deployment steps (prerequisites, create your own Apps Script project, `.clasp.json`, `npm install`, deploy). Plus a one-line pointer to `docs/threat_models/`, which CLAUDE.md already requires checking before a PR but nothing currently surfaces to a contributor. |
| 6   | `README.md`                                   | Architectural | Merged | [AI-120](https://linear.app/propublica/issue/AI-120) | [design](../superpowers/specs/2026-10-01-readme-landing-page-design.md) | `AI-120-readme-rewrite`, merged via [PR #185](https://github.com/propublica/gas-ssi-toolkit/pull/185) | Scope finalized during this row's brainstorm: written for a reporter first; pitch drawn from Aaron's blog post (one-row-at-a-time framing, no "Looper-shaped" term, "check the AI's work" folded in); Get started defers to the template's Installation tab (API key, unverified-app warning dropped from README); short "Your data" section linking to permissions.md; examples section and screenshot dropped during review (the template's tutorial covers examples; screenshot waits on the Looper rebrand); name stays "SSI Toolkit". Original hypothesis: Landing-page rewrite: pitch (decomposition-for-investigations framing), evidence section (examples/screenshots — **blocked on Aaron supplying content**), "Get started" pointing at the CBS template rather than raw steps, a pointer to row 4's doc, and a links-out section. Drops "Deployment (for contributors)" and "Development" entirely — that content moves to row 5. |
| 7 | `docs/permissions.md` (new) | Architectural | Merged | [AI-121](https://linear.app/propublica/issue/AI-121) | [design](../superpowers/specs/2026-09-30-permissions-doc-design.md) | `AI-121-permissions-doc`, merged via [PR #182](https://github.com/propublica/gas-ssi-toolkit/pull/182) | Scope finalized during this row's brainstorm (then reshaped in review into scannable bullets, FAQ sections, a retention table, a who-can-see table, and a closing code-references table): standalone file (placement settled), aimed at non-technical users nervous about the consent screen; permissions + data handling, explicitly not a privacy policy; company-agnostic; each permission headed by Google's exact wording with a plain summary beneath and a "See the code" link; the two Marketplace-default identity lines handled as a closing note, not a section; includes an "only opens what you point it at" guarantee with a T16 caveat (fix tracked as AI-77). Pointers added from README's unverified-app section (row 6's README rewrite must keep it) and the distributor guide. Original hypothesis: Explain why each OAuth scope in `appsscript.json` is requested (`spreadsheets`, `drive.readonly`, `drive.file`, `documents`, `script.external_request`, `script.container.ui`) — surfaced from AI-102's "why permissions are requested" ask, not part of the original four-bucket brainstorm. Placement is genuinely open: a new file, folded into README's "unverified app" section, or into CONTRIBUTING.md near the threat-model pointer (row 5). |
| 8 | `docs/deploying-as-an-editor-add-on.md` + `CONTRIBUTING.md` | Bounded | Merged | [AI-122](https://linear.app/propublica/issue/AI-122) | — | `AI-122-distributor-guide-deploy-from-main`, merged via [PR #184](https://github.com/propublica/gas-ssi-toolkit/pull/184) | Surfaced after row 5 merged: GitHub's default branch is `develop`, but the distributor guide never mentioned `main`, so a word-for-word distributor deployed unreleased code. Guide now clones `--branch main`, starts every update with `git checkout main && git pull`, and notes release tags for pinning/rollback; CONTRIBUTING's Branch Workflow says `main` holds only released code. Deliberately not switching the default branch to `main` (it would default new PRs' base to `main`). |

**Status values:** not started → brainstorming → spec approved (architectural rows only) → implemented → merged

## Sequencing notes

- **Gate before `AI-102-docs-restructure-tracker` merges to `develop`:**
  the template Sheet's Installation tab must include the "Google hasn't
  verified this app" walkthrough. Row 6 removed it from README, so until
  the template has it, a new user hits Google's block unexplained.
- Row 3 (user-guide.md) references row 4's filename and should land at or
  after row 4, to avoid a dead link.
- Rows 1, 2, and 7 are fully independent and can happen in any order.
- A simplified release script for editor-add-on distributors (referenced
  conceptually in row 4) is explicitly out of scope for this effort. Row
  4 documents the manual clasp steps and notes the script as a future
  follow-up.
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
  Also fix two stale names in `CLAUDE.md` found in row 5's review: the
  menu is "📐 SSI Toolkit" (not "SSI Tools"), and `docs/permissions.md`'s
  table is "Code references" (not "For the technically curious").
