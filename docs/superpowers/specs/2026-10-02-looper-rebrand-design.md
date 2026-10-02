# Looper Rebrand — Design

**Issue:** AI-125 · **Branch:** `AI-125-looper-rebrand` · **Target:** `develop`

## Goal

Every place a user, contributor, or installer sees "SSI Toolkit" in this repo says "Looper" instead, without breaking anything in users' existing sheets.

## Already done (not part of this work)

- GitHub repo renamed to `propublica/gas-looper`; local `origin` remote updated.
- External surfaces: template sheet, GCP OAuth consent screen, Marketplace listing, Linear naming, and the `looper-skills` repo.
- README's looper-skills link (line 21).

## Out of scope

- **`=SSI()` custom function**: slated for deletion separately. Its name, tests, footer stub, and doc comments stay untouched here.
- **Historical records**: `docs/plans/**`, `docs/superpowers/**` (other than this spec), and `docs/prototypes/**` are left as written.
- **GCP Workload Identity Federation**: unused since `deploy.yml` was removed in 783e30b.

## Delivery

One PR to `develop` containing all in-repo changes, so `develop` is never half-renamed. The tests pin the menu text and error strings, so all of these must change together anyway.

## 1. Add-on strings

| Location | Before | After |
|---|---|---|
| `src/server/index.ts` `onOpen` menu | `📐 SSI Toolkit` | `➰ Looper` |
| `src/server/index.ts` `onOpen` menu item | `📐 Open SSI Toolkit` | `➰ Open Looper` |
| `src/server/index.ts` `showSidebar` title | `SSI Toolkit` | `Looper` |
| `src/client/panels/tool-list.ts` footer | `SSI Toolkit v{{VERSION}}` | `Looper v{{VERSION}}` |
| `src/server/safe-writes.ts` T6 rejection | `[SSI Error: AI response contained an external request formula — output rejected]` | `[Error: AI response contained an external request formula — output rejected]` |
| `src/server/drive.ts` `TEMP_OCR_DOC_PREFIX` | `[SSI-TEMP] ` | `[LOOPER-TEMP] ` |

**Why changing `[SSI Error:` is safe:** `[SSI Error:` appears only in the T6 rejection string. Every other cell error is already `[Error: …]` via `formatCellError`, and no code reads cell values back to match either prefix. Existing cells keep their old text, and nothing depends on it. After this change the add-on uses a single error format.

**Why changing the temp prefix is safe:** the prefix exists only so a person can spot orphaned temporary OCR Docs in Drive (T15/R19). No code searches by it. Orphans created by older versions keep the `[SSI-TEMP]` name; the docs won't mention the old prefix.

## 2. Documentation

- **Product name**: "SSI Toolkit", and "SSI" used as a product noun, become "Looper" in `README.md`, `docs/user-guide.md`, `docs/permissions.md`, `docs/deploying-as-an-editor-add-on.md`, `CONTRIBUTING.md`, and both threat models. Generic "the toolkit" phrasing stays where it still reads naturally.
- **Menu path**: `docs/user-guide.md` and `docs/permissions.md` change to `➰ Looper → ➰ Open Looper` / `➰ Looper`.
- **Temp prefix**: `docs/permissions.md` says `[LOOPER-TEMP]`.
- **URLs**: `gas-ssi-toolkit` clone URLs, `cd` folder names, and issue links become `gas-looper` (README, CONTRIBUTING, editor add-on guide, permissions.md).
- **Skills link**: README's `ssi-skills` entry in the related-links list becomes `looper-skills`, matching line 21.

## 3. Internals

- `git mv docs/threat_models/ssi-toolkit-threat-model.md docs/threat_models/looper-threat-model.md`
- `git mv docs/threat_models/ssi-toolkit-threat-model-journalist.md docs/threat_models/looper-threat-model-journalist.md`
- Update every inbound link to those files: `.github/PULL_REQUEST_TEMPLATE.md`, the comments in `src/server/error-handling.ts`, `src/server/gemini-auth.ts`, and `src/server/safe-writes.ts`, `__tests__/api-key-hygiene.test.ts`, `docs/permissions.md`, the threat model's own companion-file table (including the planned `-source` filename), and the Security section of the gitignored `CLAUDE.local.md`.
- `package.json`: `name` → `gas-looper`; `description` → a one-line description of Looper.
- Header comments: `src/server/index.ts:2`, `src/shared/types.ts:2`.
- `scripts/release.sh`: echo text only. Claude edits the string but never runs the script.

## 4. Verification

- Update the tests that pin these strings: `__tests__/menu.test.ts`, `__tests__/safe-writes.test.ts`, `__tests__/drive.test.ts`. Also correct the stale comment in `__tests__/gemini-auth.test.ts`, which says `customFunctions.test.ts` asserts `/\[SSI Error:.*GEMINI_API_KEY/` when the test actually asserts `/\[Error:.*GEMINI_API_KEY/`.
- `npm test`, `npm run lint`, `npm run typecheck`, `npm run format:check` all pass.
- A final `git grep -n -i -E 'ssi toolkit|ssi-toolkit|gas-ssi|SSI-TEMP|SSI Error|📐'` returns only `=SSI()`-related lines and the excluded historical folders.
- **Manual QA (after deploy):** the menu reads `➰ Looper` with item `➰ Open Looper`; the sidebar title bar and footer say Looper; a T6 rejection, if reproducible, writes `[Error: …]`.

## 5. Outside the PR

- `CLAUDE.local.md` (gitignored): line 7 description, the old repo URLs, the worktree symlink path example, and the threat-model path. Updated in the same session, not committed.
- **Follow-up: README screenshot.** Capture the Looper sidebar once it's deployed, as a small separate change.
- **Follow-up: local folder rename** (`gas-ssi-toolkit/` → `gas-looper/`). Do this last, after merge. Claude's memory directory is keyed on the folder path, so it must be moved by hand; Claude will provide the steps.
