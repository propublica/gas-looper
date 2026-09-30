# Permissions Doc Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish `docs/permissions.md`, a public, company-agnostic explanation of every OAuth permission the SSI Toolkit requests and what happens to user data, and point to it from README, the distributor guide, and CLAUDE.md.

**Architecture:** Documentation only, no code changes. One new Markdown file, three one-line pointers, and a tracker update. Every factual claim is either backed by a code reference (checked by grep) or by a Google doc (checked by fetching it) before it's written.

**Tech Stack:** Markdown (GitHub-flavored), rendered on github.com.

**Spec:** `docs/superpowers/specs/2026-09-30-permissions-doc-design.md`

## Global Constraints

- Audience is non-technical. Plain language first; code references sit at the end of each section, never inline in the explanation.
- Company-agnostic: no "ProPublica", no product@ address, no link to any organization's Workspace agreement.
- Each permission heading is Google's **exact** consent-screen wording; a plain-language one-line summary sits directly beneath.
- Code references are **relative links to a file plus a function name**: never line numbers, never commit permalinks. Relative links (`../src/server/drive.ts`) render correctly on GitHub on any branch.
- Order of permission sections matches the Marketplace consent screen: `spreadsheets`, `drive.readonly`, `drive.file`, `documents`, `script.external_request`, `script.container.ui`, then the Marketplace-only note.
- If a Google source contradicts an assumption in this plan (Task 1), **stop and report to Aaron**. Don't silently reword.
- Branch: `AI-121-permissions-doc`. The PR targets `AI-102-docs-restructure-tracker`, **not** `develop` (tracker's branching model).

## Review Focus

- **A permission described as narrower than it is.** A reader expects the doc to tell the whole truth. E.g. `script.external_request` also covers the Drive REST downloads, not only Gemini, and the Sample Rows tool adds a tab. Pinned by the Task 1 claim-check step.
- **A claim the code no longer backs** (a renamed function, or a new data flow since the spec). A reader clicking "See the code" expects to find the named function in that file. Pinned by the Task 1 grep step.
- **Stale or wrong Google facts** (tier terms, Files API retention). A reader expects the numbers to be current Google policy. Pinned by the Task 1 verification step.
- **Hidden data visibility for whoever runs the project.** A Marketplace user expects to know whether their organization can see anything: error logs go to the project owner, and a Gemini API key owner may be able to turn on request logging. Pinned by Task 1 verification item 4.
- **Broken relative links** from `docs/`, and README/guide anchors. A reader expects every link to work. Pinned by the Task 1 and Task 2 link-check steps.

---

### Task 1: Write `docs/permissions.md`

**Files:**
- Create: `docs/permissions.md`

**Interfaces:**
- Produces: the file path `docs/permissions.md`, which Task 2 links to from `README.md` and `docs/deploying-as-an-editor-add-on.md` (relative paths `docs/permissions.md` and `permissions.md` respectively).

- [ ] **Step 1: Re-verify the scope list**

Run: `grep -A8 oauthScopes appsscript.json`
Expected: exactly `spreadsheets`, `drive.readonly`, `drive.file`, `documents`, `script.external_request`, `script.container.ui`. If different, stop and report.

- [ ] **Step 2: Verify external facts**

Fetch each page with WebFetch and record what it says, with a quote, in your task report:

1. `https://ai.google.dev/gemini-api/terms`: how Google handles prompts and responses for **unpaid** vs. **paid** services (improving products, human review). Also note any region exception (e.g. EEA/UK/Switzerland users treated as paid).
2. `https://ai.google.dev/gemini-api/docs/files`: how long uploaded files are stored. The expected answer is 48 hours.
3. `https://developers.google.com/workspace/marketplace/enable-configure-sdk` (or the Marketplace SDK OAuth scopes doc it links): that email and profile scopes are included by default. Keep the URL to link from the doc. If no page states it, the doc states it without a link (Aaron confirmed it from the SDK UI).
4. Search the Gemini API docs (`https://ai.google.dev/gemini-api/docs/logs-datasets` or similar) for **API request logging**: whether the owner of an API key/project can store request and response content, and whether it's off by default.

5. `https://developers.google.com/apps-script/guides/services/authorization` (and the `spreadsheets.currentonly` / `documents.currentonly` scope descriptions): confirm the "currentonly" scopes only cover the document the script is bound to or opened in, so they can't open *other* Sheets/Docs by ID. This backs the doc's "Google doesn't offer a narrower permission" sentences. If it isn't confirmed, delete those two sentences rather than guessing.

If item 1 or 2 differs from the draft wording in Step 4, or item 4 shows logging is **on** by default, stop and report to Aaron before writing. If item 4 shows opt-in logging exists, keep the draft's sentence about it (marked `[LOGGING]` in Step 4). If no such feature exists, delete that sentence.

- [ ] **Step 3: Verify every code reference**

Run:
```bash
for pair in \
  "src/server/index.ts:onOpen" "src/server/index.ts:showSidebar" "src/server/index.ts:runBatchAI" \
  "src/server/index.ts:insertSheet" "src/server/index.ts:getActiveSpreadsheet" \
  "src/server/safe-writes.ts:writeSafeValue" \
  "src/server/drive.ts:exportAndEncodeFile" "src/server/drive.ts:extractTextUniversal" \
  "src/server/drive.ts:fetchDriveMetadata" "src/server/drive.ts:downloadDriveFiles" \
  "src/server/drive.ts:Drive.Files.remove" \
  "src/server/utils.ts:getAllFilesRecursive" "src/server/utils.ts:resolveGroundingUris" \
  "src/server/utils.ts:writeJobProgress" "src/server/utils.ts:writeRunStats" \
  "src/server/api.ts:callGeminiAPI" "src/server/api.ts:callGeminiAPIBatch" \
  "src/server/files.ts:uploadFilesToGemini" "src/server/error-handling.ts:logError"; do
  f=${pair%%:*}; s=${pair#*:}; grep -q "$s" "$f" && echo "ok  $pair" || echo "MISSING $pair"; done
grep -rn "Session\.\|getActiveUser\|getEffectiveUser\|getEmail\|userinfo" src || echo "no identity reads"
grep -rn "searchFiles\|getRootFolder\|deleteSheet\|setTrashed" src/server || echo "no drive-wide or destructive ops"
```
Expected: every line `ok`, then `no identity reads` and `no drive-wide or destructive ops`. For any `MISSING` or unexpected hit, stop and report.

- [ ] **Step 4: Write the file**

Create `docs/permissions.md` with this content, adjusted only where Step 2 findings require it (remove the `[LOGGING]` marker either way):

````markdown
# Permissions: what SSI Toolkit asks for, and why

The first time you use SSI Toolkit, Google asks you to approve a list of permissions. Some of them sound broad. This page goes through each one in plain language: what it lets the toolkit do, which feature needs it, and what the toolkit *doesn't* do with it.

SSI Toolkit is open source, so you don't have to take our word for any of this. Each section ends with a link to the code that backs it up, and the full list of permissions the code asks for lives in one file, [`appsscript.json`](../appsscript.json).

## The short version

- **It acts as you.** Approving these permissions lets the toolkit work with your Google account on your behalf. It can only reach things your account can already reach, and nothing more.
- **It only opens what you point it at.** It reads the sheet you have open, the folders you name, and the files linked in the cells you choose to run it on. It never searches or browses the rest of your Drive.
- **One thing to watch for:** the toolkit trusts the links in the cells you run it on. If other people can edit your sheet, check that the file links are ones you expect before running Run AI or Extract Text, since it opens them with your access, not theirs.
- **There's no SSI Toolkit server.** The code runs on Google's servers, inside Google Apps Script. Your data isn't sent to the toolkit's developers or to any company other than Google.

## Line by line

Each heading below is the exact wording Google shows you, in the same order.

### "See, edit, create, and delete all your Google Sheets spreadsheets"

**Reading and writing your spreadsheet.**

Every tool reads from the sheet you have open and writes its results back into it, usually into a new column. Sample Rows also adds a new tab to hold the sample. If you use another Google Sheet as an input to Run AI, the toolkit reads that Sheet too.

The toolkit never deletes a spreadsheet. Google doesn't offer a narrower permission that would still let it read the other Sheets you link to, which is why the wording says "all."

**See the code:** [`src/server/index.ts`](../src/server/index.ts) (each tool's entry point, e.g. `runBatchAI`), [`src/server/safe-writes.ts`](../src/server/safe-writes.ts) (`writeSafeValue`, the one path for writing to cells), [`src/server/drive.ts`](../src/server/drive.ts) (`exportAndEncodeFile`, for reading a linked Sheet)

### "See and download all your Google Drive files"

**Reading the files and folders you point it at.**

This lets the toolkit:

- list the files inside a folder you name (Import Drive Links). It collects each file's name and link, not its contents.
- read the text of files linked in your sheet (Extract Text).
- download files linked in your sheet so they can be sent to Gemini for analysis (Run AI).

This permission is read-only: it can't change or delete anything. It covers "all" your files because the toolkit can't know in advance which files you'll link to, but it only opens the ones you point it at (see [the short version](#the-short-version)).

**See the code:** [`src/server/utils.ts`](../src/server/utils.ts) (`getAllFilesRecursive`), [`src/server/drive.ts`](../src/server/drive.ts) (`extractTextUniversal`, `fetchDriveMetadata`, `downloadDriveFiles`)

### "See, edit, create, and delete only the specific Google Drive files you use with this app"

**Creating (and cleaning up) a temporary file for text recognition.**

To pull text out of a PDF or an image, Extract Text uses Google Drive's built-in text recognition (OCR). That works by making a temporary Google Doc copy of the file. This permission lets the toolkit create that temporary Doc and then delete it.

The temporary Doc is deleted permanently as soon as its text has been read, not moved to your Trash. The delete runs even if reading the text fails. If the delete itself ever fails, the toolkit tells you the name of the leftover Doc so you can remove it yourself. This permission only covers files the toolkit created. It can't touch anything else in your Drive.

**See the code:** [`src/server/drive.ts`](../src/server/drive.ts) (`extractTextUniversal`)

### "See, edit, create, and delete all your Google Docs documents"

**Reading the text of Google Docs.**

Extract Text uses this to read the text of Google Docs linked in your sheet, and to read the temporary Doc described above.

The toolkit only reads Docs. It never edits or deletes a Doc you own. As with Sheets, Google doesn't offer a narrower permission that would still let it read the Docs you link to.

**See the code:** [`src/server/drive.ts`](../src/server/drive.ts) (`extractTextUniversal`)

### "Connect to an external service"

**Talking to Google services over the internet.**

Apps Script needs this permission for any web request the code makes itself. SSI Toolkit makes them only to Google services:

- **Google's Gemini API**, to send your prompts and files for analysis (Run AI and the `=SSI()` formula).
- **Google Drive's API**, to download the files you've linked so they can be sent to Gemini.
- **Google's own search-result links**, when Gemini uses Google Search to answer. Gemini returns its sources as Google redirect links, and the toolkit checks each one to show you the real web address. It doesn't send any of your data in that step, and it doesn't visit the site itself.

No data is sent to any service outside Google.

**See the code:** [`src/server/api.ts`](../src/server/api.ts) (`callGeminiAPI`, `callGeminiAPIBatch`), [`src/server/files.ts`](../src/server/files.ts) (`uploadFilesToGemini`), [`src/server/drive.ts`](../src/server/drive.ts) (`fetchDriveMetadata`, `downloadDriveFiles`), [`src/server/utils.ts`](../src/server/utils.ts) (`resolveGroundingUris`)

### "Display and run third-party web content in prompts and sidebars inside Google applications"

**Showing the SSI Toolkit menu and sidebar.**

This is what lets the toolkit add its menu to Google Sheets and open its sidebar panel. "Third-party" just means content that isn't made by Google, which here is the toolkit's own interface. Without this permission the toolkit can't show you anything at all.

**See the code:** [`src/server/index.ts`](../src/server/index.ts) (`onOpen`, `showSidebar`)

### If you see two more: your email address and personal info

If you installed the toolkit from the Google Workspace Marketplace, or your organization installed it for everyone, you may also see **"See your primary Google Account email address"** and **"See your personal info, including any personal info you've made publicly available."**

Google adds these two to every Marketplace app by default ([Google's documentation](MARKETPLACE_URL)). SSI Toolkit never reads your email address or profile. Nothing in its code asks for them.

## What happens to your data

### What gets sent where

When you use **Run AI** or the `=SSI()` formula, the cell values and files you selected are sent to Google's Gemini API to be analyzed. That's the only place your data goes outside of Google Drive and Sheets. **Import Drive Links**, **Extract Text**, and **Sample Rows** don't use Gemini at all; they work entirely within Google Drive, Docs, and Sheets.

### What's kept, and for how long

- **The temporary OCR Doc**: deleted as soon as its text is read (see above).
- **Files sent to Gemini**: stored by Gemini's Files API and deleted automatically after 48 hours ([Google's documentation](https://ai.google.dev/gemini-api/docs/files)).
- **Progress and run statistics**: the sidebar's progress messages and cost estimates are held in temporary storage tied to your account, for 5 minutes and up to 6 hours respectively. They contain counts and status messages, not your content.
- **Error logs**: when something goes wrong, the toolkit records only the *type* of error, never the error's message or any of your content. Whoever runs the toolkit's Apps Script project can see these logs: you, if you made your own copy, or your organization, if it installed the toolkit for everyone.

The toolkit itself doesn't keep a copy of your data anywhere else.

**See the code:** [`src/server/error-handling.ts`](../src/server/error-handling.ts) (`logError`), [`src/server/utils.ts`](../src/server/utils.ts) (`writeJobProgress`, `writeRunStats`)

### What Google may do with what you send to Gemini

This depends on your organization's Gemini API plan, not on the toolkit.

- **On a paid plan**, Google says it doesn't use your prompts or responses to improve its products.
- **On the free (unpaid) plan**, Google may use them to improve its products, and people at Google may review them.

Ask whoever set up your Gemini API key which plan you're on. If you made your own copy, that's you. See Google's [Gemini API terms](https://ai.google.dev/gemini-api/terms) for the details. [LOGGING] Whoever owns the Gemini API key can also choose to turn on request logging in Google AI Studio, which stores copies of requests and responses. It's off unless they enable it.

## Questions or concerns

If something here is unclear or looks wrong, [open an issue](https://github.com/propublica/gas-ssi-toolkit/issues) on the project's GitHub page. If your organization installed the toolkit for you, your admin can tell you which Gemini plan you're on and who can see the project's logs.
````

Replace `MARKETPLACE_URL` with the URL from Step 2 item 3. If there's none, delete the parenthetical `([Google's documentation](MARKETPLACE_URL))` and keep the sentence.

- [ ] **Step 5: Check claims against the code**

Re-read each "it never…" / "only…" sentence and confirm it against Step 3's output:
- never deletes a spreadsheet or Doc: the only removal is `Drive.Files.remove` on the temp Doc.
- no identity reads.
- `=SSI()` sends to Gemini and doesn't use Drive files: `grep -n "Drive\|fetchAndEncode" src/server/customFunctions.ts`, expected no Drive usage.
- Import Drive Links, Extract Text, and Sample Rows don't call Gemini: `grep -n "callGeminiAPI" src/server/index.ts` hits only inside `runBatchAI`'s flow.

If any check fails, fix the sentence to match the code and note the change in your report.

- [ ] **Step 6: Check links and placeholders**

Run:
```bash
grep -n "MARKETPLACE_URL\|\[LOGGING\]\|TODO\|TBD" docs/permissions.md || echo "clean"
grep -o '](\.\./[^)#]*' docs/permissions.md | sed 's/](\.\.\///' | sort -u | while read p; do test -e "$p" && echo "ok $p" || echo "BROKEN $p"; done
```
Expected: `clean`, then only `ok` lines. Confirm that the `#the-short-version` anchor matches the `## The short version` heading.

- [ ] **Step 7: Commit**

```bash
git add docs/permissions.md
git commit -m "docs: add permissions.md explaining each OAuth scope (AI-121)"
```

---

### Task 2: Pointers, upkeep rule, and tracker

**Files:**
- Modify: `README.md` (end of the "About the 'Google hasn't verified this app' screen" section)
- Modify: `docs/deploying-as-an-editor-add-on.md` (end of "Set up the Marketplace listing", just before the `**TK:**` line)
- Modify: `CLAUDE.md` (Security section, the bullet list of "Changes that always warrant a threat model review")
- Modify: `docs/plans/2026-09-21-docs-restructure-tracker.md` (row 7)

**Interfaces:**
- Consumes: `docs/permissions.md` from Task 1.

- [ ] **Step 1: README pointer**

In `README.md`, after the paragraph ending "You'll only need to do this once per copy.", add a new paragraph:

```markdown
Wondering what the permissions on the next screen mean? [Permissions: what SSI Toolkit asks for, and why](docs/permissions.md) explains each one in plain language.
```

- [ ] **Step 2: Distributor guide pointer**

In `docs/deploying-as-an-editor-add-on.md`, insert before the `**TK:** a marketplace-listing asset packet` line:

```markdown
**Something to share with your users.** Your users will see a list of permissions when they first open the toolkit. [permissions.md](permissions.md) explains each one in plain language, including the two extra email/profile lines the Marketplace adds by default.
```

- [ ] **Step 3: CLAUDE.md upkeep rule**

In `CLAUDE.md`'s Security section, append this bullet to the "Changes that always warrant a threat model review" list:

```markdown
- **Anything `docs/permissions.md` describes** — OAuth scope changes, new or changed data flows, retention/logging changes, or renaming/moving a function it links under "See the code" must update `docs/permissions.md` in the same PR. It's public and user-facing; a stale claim there is a trust problem, not just a docs bug. Its "One thing to watch for" caveat exists because T16/R23 is open (AI-77) — update or remove it when that lands
```

- [ ] **Step 4: Tracker row 7**

In `docs/plans/2026-09-21-docs-restructure-tracker.md`, row 7, set:
- Doc: `` `docs/permissions.md` (new) `` (drop "tentative")
- Status: `Implemented`
- Spec: `[design](../superpowers/specs/2026-09-30-permissions-doc-design.md)`
- Branch: `` `AI-121-permissions-doc` ``
- Starting hypothesis cell: prepend `Scope finalized during this row's brainstorm: standalone file (placement settled), aimed at non-technical users nervous about the consent screen; permissions + data handling, explicitly not a privacy policy; company-agnostic; each permission headed by Google's exact wording with a plain summary beneath and a "See the code" link; the two Marketplace-default identity lines handled as a closing note, not a section; includes an "only opens what you point it at" guarantee with a T16 caveat (fix tracked as AI-77). Pointers added from README's unverified-app section (row 6's README rewrite must keep it) and the distributor guide.`

Keep the table's column alignment consistent with neighboring rows (Prettier doesn't cover Markdown here, so match by eye).

- [ ] **Step 5: Link check**

Run:
```bash
test -e docs/permissions.md && grep -c "docs/permissions.md" README.md && grep -c "(permissions.md)" docs/deploying-as-an-editor-add-on.md && test -e docs/superpowers/specs/2026-09-30-permissions-doc-design.md && echo ok
```
Expected: `1`, `1`, `ok`.

- [ ] **Step 6: Commit**

```bash
git add README.md docs/deploying-as-an-editor-add-on.md CLAUDE.md docs/plans/2026-09-21-docs-restructure-tracker.md
git commit -m "docs: link permissions.md from README, distributor guide, and CLAUDE.md (AI-121)"
```

---

## Notes for the PR (after both tasks)

- The PR targets `AI-102-docs-restructure-tracker`, **not** `develop`. Say so explicitly in the PR body.
- Threat model: no new data flow or scope, so no threat model edit. The Security checklist should note that `docs/permissions.md` documents T16 as a user-facing caveat.
- Pushing may hang in this sandbox (see memory); hand the push off to Aaron if it does.
