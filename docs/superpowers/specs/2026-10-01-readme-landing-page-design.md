# README.md — landing-page rewrite (AI-120) — Design

Row 6 of the documentation restructure tracker
(`docs/plans/2026-09-21-docs-restructure-tracker.md`). Branch
`AI-120-readme-rewrite`, cut from and PR'd into
`AI-102-docs-restructure-tracker`.

## Goal

README.md becomes the project's front door: a landing page that tells a
reporter what the toolkit does and gets them to a working copy, instead of a
deployment manual. Developer setup already moved to `CONTRIBUTING.md#local-setup`
(row 5); this row deletes it from README.

## Audience

**The top of the page is written for a reporter or editor** deciding whether
this could help their story — not technical, needs to see the utility. Newsroom
data/dev people are a secondary audience; they scroll to "Other ways to run it"
and "Learn more." Plain language throughout; no developer jargon above the
footer.

## Decisions

- **Name: "SSI Toolkit."** A rebrand to Looper is coming but renames
  everything (menu, template, docs) at once; this row doesn't front-run it.
- **Section order: pitch → Get started → Your data → Other ways to run it →
  Examples → Getting help → Learn more.** The pitch carries the "why bother";
  examples are for inspiration and further teaching, not persuasion.
- **No "Looper-shaped" terminology.** The pitch describes the pattern
  directly: run AI over your data one row at a time.
- **Screenshot is a TK placeholder** — held until the rebrand.
- **"Check the AI's work" is folded into the pitch**, framed as part of the
  method, not a separate disclaimer section.
- **Get started defers to the template.** The template Sheet's Start Here tab
  already covers setting the API key and opening the menu (old steps 3–5), so
  README stops at "make a copy, follow Start Here."
- **The "Google hasn't verified this app" section is dropped** — the template
  will carry that warning instead. Until it does, a README reader hits Google's
  block unexplained, so this is gated by a manual-QA step (see Testing).
- **No claims about what Google does with sensitive data.** README links to
  `docs/permissions.md#who-can-see-my-data` for that, rather than paraphrasing
  plan-dependent behavior.
- **A short "Your data" section** restates only what permissions.md's TL;DR
  already says (no toolkit server; AI inputs go to Google's Gemini, never to
  the developers) and links out. This also preserves row 7's requirement that
  README link to `docs/permissions.md`, which previously lived in the dropped
  unverified-app section.
- **Free-tier framing for the API key:** free to start; a few features (e.g.
  Google Search) need a paid plan. Confirmed against Google's pricing page
  (2026-10-01): Gemini 3.1 Flash-Lite (the default model) and URL context are
  free-tier; Google Search grounding is "Not available" on free.
- **Getting help = GitHub issues only.** No named contact.

## Page content

### Top of page (approved copy)

> # SSI Toolkit
>
> **A Google Sheets add-on that runs AI over your data, one row at a time.**
>
> *[TK: screenshot of the sidebar next to a filled-in output column — pending Looper rebrand]*
>
> SSI Toolkit puts AI right alongside your Google Sheets. Pick the columns you
> want the AI to look at — plain text, Drive files like PDFs and scanned
> documents, web addresses, or YouTube links — write your directions once, and
> it runs them on every row, putting each answer in a new column. Asking one
> narrow question of 45 videos or 38,000 mission statements turns a big
> reporting question into small ones that the AI handles better and you can
> check row by row: the AI sorts and triages, you verify. And because the
> answers land in a column, you can filter, sort, pivot and `SUMIF` them like
> the rest of your data. Built at ProPublica, it's already helping reporters
> sort medical records, filter hours of YouTube video and sift court dockets.
>
> See [what reporters use it for](#examples), or get help writing your first
> prompt with [ssi-skills](https://github.com/propublica/ssi-skills).

Web addresses are read via the URL Context tool (`src/server/tools.ts`), which
the user switches on per run.

### Get started

- **What you'll need**
  - A Google account
  - A Gemini API key — free to start; a few features (like Google Search) need
    a paid plan. Your plan also affects what Google can do with what you send
    it → `docs/permissions.md#who-can-see-my-data`. Links: AI Studio to mint a
    key, and to set a monthly spend cap.
- **Copy the template**
  1. Open the template Sheet (current URL from today's README) and click
     **Request access** if prompted — requests are approved individually.
  2. **File → Make a copy.**
  3. Follow the **Start Here** tab in your copy.
- Closing line: next, the [User Guide](docs/user-guide.md) walks through each
  tool.

Heading is `## Get started`; anchor becomes `#get-started` (see Cross-doc edits).

### Your data

2–3 sentences: SSI Toolkit has no server of its own; it runs on Google's
servers. When you use AI, the cells, prompt and linked files you choose go to
Google's Gemini — never to the toolkit's developers. Link: "Permissions and
your data" → `docs/permissions.md`.

### Other ways to run it

- Want your own copy without requesting access, or want to change the code?
  → `CONTRIBUTING.md#local-setup`
- Rolling it out to a whole organization on Google Workspace? →
  `docs/deploying-as-an-editor-add-on.md` (a personal Gmail account can't
  publish privately)
- "Start with the template either way."

### Examples

Heading anchor must be `#examples` (the pitch links to it). Each example:
one-sentence situation → the per-row prompt in a code block → one line on what
the output column lets you do. Two examples for now; more (Drive files, web
addresses) can be added later.

1. **YouTube.** ~45 Glenn Beck videos that mention Ken Paxton; which are
   actual conversations between the two? Prompt shown **in full**, verbatim
   (the one actually used — it replaces the simplified Yes/No version in the
   blog post):

   ```
   Return a single JSON object with exactly the following fields -- no other fields, and no text before or after the JSON object.

   - `is_paxton_interview` -- a boolean (true/false). True if this video shows Glenn Beck and Texas Attorney General Ken Paxton having a conversation with each other (e.g. an interview, phone call, or direct exchange). False if Paxton is only mentioned, shown in a clip, or discussed without an actual conversation between the two.
   - `reasoning` -- a string. A brief explanation for the classification, citing what is actually shown or said in the video.
   ```

   Output: filter `is_paxton_interview` to true and that's your list; the
   `reasoning` field is what you check.

2. **Plain text.** 38,000 nonprofit mission statements, two consecutive years
   per nonprofit — did their DEI language change? Two input columns, which also
   shows multi-column prompts. Link to the published
   [Deleting DEI](https://www.propublica.org/article/deleting-dei-language-nonprofits-irs-forms)
   story. The page shows a **condensed** prompt, explicitly labeled "condensed
   for readability," followed by a collapsed
   `<details><summary>Full prompt we used</summary>` block containing the
   full prompt verbatim (as supplied by Aaron, 2026-10-01; ~600 words with
   definitions, evidence lists, classification rules, tie-breakers, output
   format, and examples). Condensed version:

   ```
   Compare these two consecutive-year mission statements from the same
   nonprofit. Using only the text provided, judge how their DEI (diversity,
   equity, inclusion) language changed.

   - Major Change: explicit DEI language or commitments added or removed, or a
     big shift in specificity (named groups, goals, resources).
   - Subtle Change: smaller shifts, like adding "inclusive" or "welcoming"
     without concrete commitments, or softening explicit language.
   - No Change: same DEI content; only style or unrelated edits.
   If unsure, pick the less severe category.

   Return only JSON:
   {"change": "No Change" | "Subtle Change" | "Major Change",
    "rationale": "<≤50 words citing the specific language differences>"}
   ```

   Output: a category column plus a rationale — filter to Major Change and
   read those rationales first.

The full prompt text lives in the implementation plan (verbatim), not here.

### Getting help

One line: questions, bugs or ideas → open a GitHub issue
(`https://github.com/propublica/gas-ssi-toolkit/issues`).

### Learn more (footer)

- User Guide — how to use each tool
- Permissions and your data — `docs/permissions.md`
- Deploying as an Editor add-on — for organizations
- Contributing — set up a dev copy and work on the code (replaces the stale
  "how to add features" description)
- Architecture and Releasing — for maintainers
- ssi-skills — help writing prompts

Then: "Built by ProPublica. [MIT License](LICENSE)."

### Removed from README

- "Note: Avoid making changes in the online Apps Script editor" (moves to
  CONTRIBUTING — see below)
- "Built with TypeScript, bundled by Rollup, and deployed via clasp"
- "About the 'Google hasn't verified this app' screen"
- "Deployment (for contributors)" and "Development" (already in CONTRIBUTING
  since row 5)
- Old "Further Reading"

## Cross-doc edits (same PR)

1. **Inbound `#get-your-own-copy` links → `#get-started`:**
   - `docs/releasing.md:3`
   - `docs/deploying-as-an-editor-add-on.md:5`
   - `docs/user-guide.md:18` — also rewrite the sentence's claim that README has
     "the full walkthrough, including setting your own Gemini API key and getting
     past Google's 'unverified app' warning"; point to the template's Start Here
     tab instead. Touch only this sentence (row 3, AI-117, owns the rest of that
     section).
2. **CONTRIBUTING.md:** add the "avoid editing in the online Apps Script editor —
   changes are overwritten on the next deploy" note to Local Setup, next to
   step 6 (Install and deploy).
3. **Threat model** (`docs/threat_models/ssi-toolkit-threat-model.md`): R16
   (line 240) and the AI-90 open-items row (line 294) say the spend cap is
   documented in "the README's Prerequisites section." Update both to list
   where it's documented now: README (Get started → What you'll need),
   `CONTRIBUTING.md` (Local Setup prerequisites), and
   `docs/deploying-as-an-editor-add-on.md` (Prerequisites).
4. **Tracker:** mark row 6 status and link this spec.

## Testing / manual QA

- All relative links and anchors in README resolve on GitHub (`#examples`,
  `#who-can-see-my-data`, `CONTRIBUTING.md#local-setup`, etc.), and the three
  repointed inbound links land on `#get-started`.
- Docs-only change: no build, lint, or Prettier step touches Markdown
  (lint-staged runs on `*.ts` only), so link checking is the whole test.
- **Gate before the tracker branch merges to `develop`:** confirm the template
  Sheet's Start Here tab includes the "Google hasn't verified this app"
  walkthrough. README no longer documents it.

## Out of scope

- Screenshots (blocked on the Looper rebrand).
- Additional examples beyond the two above.
- Looper renaming.
- Template Sheet content changes (the Start Here verification warning is
  Aaron's, tracked only as a QA gate here).
