# Permissions Doc — Design

## Purpose

New doc: `docs/permissions.md`. Row 7 of the [documentation restructure
tracker](../../plans/2026-09-21-docs-restructure-tracker.md) (Linear
[AI-121](https://linear.app/propublica/issue/AI-121)). A single, shareable
source of truth explaining why the SSI Toolkit requests each permission on
Google's OAuth consent screen, what it actually does with them, and what
happens to the user's data — with links to the code as evidence.

## Audience

Non-technical users who are alarmed by the consent screen ("See, edit,
create, and delete all your Google Sheets…") and want to know whether their
data is being treated with care. Secondary audience: a skeptical reader (a
newsroom security lead, an IT admin deciding whether to allow the add-on)
who will click through to the code.

## Scope decisions from brainstorming

- **Standalone file, not folded into README or CONTRIBUTING.md.** Resolves
  the placement question left open in the tracker. Easy to link to and share.
  README and the distributor guide point at it; they don't duplicate it.
- **Permissions + data handling, not a privacy policy.** The consent-screen
  breakdown is the core, followed by a short "what happens to your data"
  section. Deliberately *not* framed as a privacy policy — the repo can't
  make legal commitments on behalf of every organization that installs it.
- **Company-agnostic.** The file is public and serves every installer, not
  just ProPublica. Aaron's earlier internal draft (ProPublica privacy policy)
  is the starting material, but all ProPublica-specific content is removed:
  the "ProPublica Internal Tool" label, the product@ contact, and the link
  to ProPublica's Workspace data agreement.
- **Code references as evidence.** Each permission section ends with one
  discreet "See the code" line — file path plus function name, never line
  numbers (they drift) and never commit permalinks (they point at stale
  code). Plain-language explanation stays readable without clicking.
- **Google's wording as the heading, friendly wording underneath.** Each
  permission's heading is Google's exact consent-screen text, so a reader
  scanning for "what is this line asking me to approve?" finds it
  immediately. A plain-language one-line summary (e.g. "Reading and writing
  your spreadsheet") sits directly beneath, followed by the detail.
- **No up-front "which screen you'll see" section.** Most readers don't need
  to be prepared for install-path differences. The two Marketplace-only
  lines are handled by a short note at the end of the line-by-line section
  instead (see "Two consent screens" below).
- **Contact: GitHub Issues**, plus "if your organization installed this for
  you, your admin can tell you which Gemini plan you're on."

## Corrections to the earlier internal draft

Each claim in the draft was checked against the code during brainstorming.
These need to change in the public doc:

1. **"Your data does not leave Google's infrastructure" + Workspace
   agreement link.** Specific to ProPublica's arrangement. Each installer
   uses their own Gemini API key, and Gemini's data-use terms differ by
   tier. Replaced by the tier explanation below.
2. **Gemini Files API retention was missing.** `uploadFilesToGemini`
   (`src/server/files.ts`) uploads Drive files to the Gemini Files API,
   which keeps them for a limited window before auto-deleting (believed to
   be 48 hours — verify).
3. **"Does not directly store, log, or retain any of your data."** Close but
   not exact. Error logs record only the error's *type*, never its message
   or content (`logError`, `src/server/error-handling.ts`; T12). Job
   progress and run statistics are held in the user's own `CacheService`
   for 5 minutes and up to 6 hours respectively (`writeJobProgress`,
   `writeRunStats`, `src/server/utils.ts`).
4. **"No data is sent to any other external service."** Nearly right. For
   search-grounded answers, `resolveGroundingUris` (`src/server/utils.ts`)
   requests Google's own redirect URLs to find each source's real link. It
   reads the redirect without following it, and no user data is sent.
   Stated in one precise sentence.

Claims in the draft that the code confirms and that carry over:

- Reading other Google Sheets referenced as file inputs
  (`exportAndEncodeFile`, `src/server/drive.ts`).
- The OCR temp Doc is permanently deleted with `Drive.Files.remove`, not
  trashed, inside a `finally` so it runs even when reading fails; if the
  delete itself fails, the user is alerted with the orphaned doc's name
  (`extractTextUniversal`, `src/server/drive.ts`; T15).
- "Acts as you" — the toolkit can only reach what the user's account can.

## The "only opens what you point it at" guarantee

Aaron flagged "accesses only the data you direct it to" as the most
important guarantee in the draft. Verified during brainstorming: nothing in
`src/server` searches Drive, walks the root folder, or enumerates
spreadsheets. Every access starts from one of:

- **A folder the user names** — Import Drive Links and the recipe
  list-drive-folder step (`getAllFilesRecursive`, `src/server/utils.ts`;
  collects names and links, not contents).
- **A Drive link in a cell the user chose to run on** — Extract Text, Run AI
  file inputs.
- **The open sheet** — every other access goes through
  `getActiveSpreadsheet()` in `src/server/index.ts`.

**Caveat (T16, open).** The toolkit trusts whatever Drive links are in the
selected cells, and someone else may have put them there. A collaborator
with edit access can plant a link to a file the user can open but they
can't; running Run AI then fetches it with the user's access and writes
Gemini's output where the collaborator can read it. The Guided flow widens
this, since it treats any Drive link in any input column as a file. The fix
(R23) is tracked as [AI-77](https://linear.app/propublica/issue/AI-77); a
comment there requires updating or removing this caveat when it lands.

Approved wording (may be lightly edited for flow):

> **The toolkit only opens what you point it at.** It reads the sheet you
> have open, the folders you name, and the files linked in the cells you
> choose to run it on. It never searches or browses the rest of your Drive.
>
> **One thing to watch for:** the toolkit trusts the links in the cells you
> run it on. If other people can edit your sheet, check that the file links
> are ones you expect before running Run AI or Extract Text — it opens them
> with your access, not theirs.

The caveat describes a habit, not an exploit recipe. Omitting it would make
the headline guarantee misleading.

## Two consent screens

Not given its own section in the doc — covered by a short note at the end
of the line-by-line section, phrased from the reader's side rather than in
SDK terms, e.g.: "If you installed the toolkit from the Google Workspace
Marketplace, or your organization installed it for everyone, you may also
see these two lines. Google adds them to every Marketplace app by default;
the toolkit never reads your email address or profile."

Background: the Marketplace install shows **8** lines; a copied template Sheet
(container-bound) shows **6**. The extra two — "See your primary Google
Account email address" (`userinfo.email`) and "See your personal info…"
(`userinfo.profile`) — are added by the Google Workspace Marketplace SDK
("Email and profile scopes are included by default," per the SDK's OAuth
Scopes configuration page, confirmed by Aaron's screenshot). They are not in
`appsscript.json`, and nothing in `src/` reads the user's identity: no
`Session.getActiveUser()`, `getEmail()`, or `userinfo` usage. The one
near-miss, `ScriptApp.getOAuthToken()` in `runBatchAI`, obtains an access
token for the Drive REST calls that download user-referenced files — it's
part of `drive.readonly`'s use, not an identity read.

## Scope-to-code map

Source of truth for scopes: `appsscript.json` (re-verify at implementation
time). Order matches the Marketplace consent screen.

| Consent line | Scope | Feature(s) | See the code |
|---|---|---|---|
| See, edit, create, and delete all your Google Sheets spreadsheets | `spreadsheets` | All tools (read/write the open sheet); Run AI reading a referenced Sheet | `src/server/index.ts` (tool entry points), `src/server/safe-writes.ts` (`writeSafeValue` et al.), `src/server/drive.ts` (`exportAndEncodeFile`) |
| See and download all your Google Drive files | `drive.readonly` | Import Drive Links; Extract Text; Run AI file inputs | `src/server/utils.ts` (`getAllFilesRecursive`), `src/server/drive.ts` (`extractTextUniversal`, `fetchDriveMetadata`, `downloadDriveFiles`) |
| See, edit, create, and delete only the specific Google Drive files you use with this app | `drive.file` | Extract Text OCR temp Doc | `src/server/drive.ts` (`extractTextUniversal`) |
| See, edit, create, and delete all your Google Docs documents | `documents` | Extract Text (Docs and OCR temp Doc) | `src/server/drive.ts` (`extractTextUniversal`) |
| Connect to an external service | `script.external_request` | Run AI (Gemini API calls, Files API uploads, Drive REST downloads, grounding link resolution) | `src/server/api.ts` (`callGeminiAPI`, `callGeminiAPIBatch`), `src/server/files.ts` (`uploadFilesToGemini`), `src/server/drive.ts` (`fetchDriveMetadata`, `downloadDriveFiles`), `src/server/utils.ts` (`resolveGroundingUris`) |
| Display and run third-party web content in prompts and sidebars inside Google applications | `script.container.ui` | The SSI Toolkit menu and sidebar | `src/server/index.ts` (`onOpen`, `showSidebar`) |
| See your primary Google Account email address | `userinfo.email` (Marketplace only) | None — SDK default | — |
| See your personal info… | `userinfo.profile` (Marketplace only) | None — SDK default | — |

Note for implementation: `script.external_request` also covers the Drive
REST calls made via `UrlFetchApp` — the doc must not say "only used to talk
to Gemini." Accurate framing: every outbound request goes to a Google
service (Gemini API, Drive API, Google's grounding redirect links).

## Doc outline (`docs/permissions.md`)

1. **Opening** — 2–3 sentences: what this page explains; the toolkit is
   open source and every claim links to the code that backs it.
2. **The short version**
   - It acts as you — it can only reach what your account can already reach.
   - It only opens what you point it at (wording above).
   - One thing to watch for (T16 caveat, wording above).
   - No outside server — everything runs inside your Apps Script project on
     Google's servers.
3. **Line by line** — one subsection per consent-screen line, in the order
   of the table above. Each: Google's exact wording as the heading →
   plain-language one-line summary → what it lets the toolkit do → which
   feature needs it → "See the code:" line. Ends with the Marketplace note
   covering the two extra identity lines (wording above).
4. **What happens to your data**
   - *What gets sent where* — Gemini only for AI; Drive/Docs/Sheets are
     read inside Google; the grounding-redirect sentence.
   - *What's kept, and for how long* — OCR temp Doc (deleted immediately);
     Gemini Files API uploads (auto-deleted after the retention window);
     cache (up to 6 hours, progress/stats only); error logs (error types
     only, never content).
   - *Gemini's data terms depend on your plan* — both tiers stated plainly
     (paid: Google says it doesn't use your data to improve its products;
     free/unpaid: it may), with a link to Google's current terms and "ask
     whoever set up your API key which plan you're on."
5. **Questions or concerns** — GitHub Issues; your admin if your
   organization installed it.

## Changes outside the doc

- **`README.md`** — one-line pointer to `docs/permissions.md` in the
  "About the 'Google hasn't verified this app' screen" section. (Row 6
  rewrites README later; the pointer should survive that rewrite — note it
  in the tracker.)
- **`docs/deploying-as-an-editor-add-on.md`** — one-line pointer, framed for
  distributors who want something to share with their users.
- **`CLAUDE.md` Security section** — one line: changes to OAuth scopes or to
  how user data is sent, stored, or retained must also update
  `docs/permissions.md`, including its code references.
- **Tracker row 7** — status, spec link, branch.

## Verification before writing

Check these against Google's current documentation at implementation time.
If a source contradicts the assumption, bring it back to Aaron rather than
silently rewording:

1. Gemini API data-use terms for unpaid vs. paid tiers (Gemini API
   Additional Terms of Service).
2. Gemini Files API retention period (believed 48 hours).
3. Marketplace SDK default `userinfo.email` / `userinfo.profile` scopes
   (already confirmed via Aaron's screenshot; find a linkable doc if one
   exists).
4. Re-verify the scope list in `appsscript.json` and every function name in
   the scope-to-code map against the current code.

## Out of scope

- Fixing T16/R23 (tracked separately as AI-77).
- Threat model edits — this doc adds no new data flow or scope. (If
  implementation turns up a discrepancy with the threat model, raise it
  rather than fixing it inline.)
- A formal privacy policy or a distributor privacy-policy template.
- Reducing the requested scopes (e.g. whether `documents` could be
  narrowed). The doc explains the current scopes, it doesn't change them.

## Testing

Documentation only; no code changes. Verification is: every function name
and file path in the doc resolves (grep), every external link loads, the
scope list matches `appsscript.json`, and `npm run format:check` passes if
Prettier covers the touched Markdown files.
