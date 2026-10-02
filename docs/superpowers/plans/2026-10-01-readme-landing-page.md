# README Landing-Page Rewrite (AI-120) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace README.md's deployment manual with a reporter-facing landing page, and fix every doc that pointed at the old README.

**Architecture:** Docs-only. One full rewrite of `README.md` (exact content below), then small edits in four other docs for inbound links, a relocated warning, threat-model references, and the tracker. "Tests" are a link/anchor checker script run before and after.

**Tech Stack:** GitHub-flavored Markdown; Python 3 (stdlib only) for the link checker.

**Spec:** `docs/superpowers/specs/2026-10-01-readme-landing-page-design.md`

## Global Constraints

- Product name is **"SSI Toolkit"** everywhere. Do not write "Looper".
- Do not use the term "Looper-shaped".
- No claims about what Google does with sensitive data; link to `docs/permissions.md#who-can-see-my-data` instead.
- The screenshot stays a visible TK placeholder.
- Getting help = GitHub issues only (`https://github.com/propublica/gas-ssi-toolkit/issues`). No named contact.
- The full DEI prompt is reproduced **verbatim**, byte-for-byte as given in Task 1 (curly quotes, `≤`, `→` included).
- Branch `AI-120-readme-rewrite`; PR targets `AI-102-docs-restructure-tracker`, **not** `develop`.
- Commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

- **Broken anchors after the heading rename:** anything linking `README.md#get-your-own-copy` must land on `#get-started`. Pinned by the checker in Task 1 Step 1 / Task 2.
- **The pitch's `#examples` link:** the Examples heading must be exactly `## Examples`. Pinned by the checker.
- **Collapsed `<details>` block rendering:** GitHub needs a blank line after `</summary>` and before `</details>` or the fenced code block renders as raw text. Pinned by Task 1 Step 4 (grep check).
- **JSON-in-one-cell reality:** the toolkit writes each answer as one JSON string in one cell; it does not split fields into columns. Copy must not say "filter the field" without a way to extract it. Pinned by Task 1 Step 4 (REGEXEXTRACT present).
- **Stale README claims elsewhere:** `docs/user-guide.md` promised the README covers the API key and unverified-app walkthrough. Pinned by Task 2 Step 4 grep.

---

### Task 1: Rewrite README.md

**Files:**
- Create: `$TMPDIR/check_links.py` (scratch, not committed)
- Modify: `README.md` (full replacement)
- Modify: `docs/superpowers/specs/2026-10-01-readme-landing-page-design.md` (fix the two example "Output:" lines)

**Interfaces:**
- Produces: README headings `## Get started` (anchor `#get-started`) and `## Examples` (anchor `#examples`), consumed by Task 2.

- [ ] **Step 1: Write the link checker**

```bash
cat > "$TMPDIR/check_links.py" << 'EOF'
"""Check relative Markdown links (file + #anchor) in the given files."""
import re, sys, pathlib

def slug(h):
    h = h.strip().lower()
    h = re.sub(r"[^\w\- ]", "", h)  # GitHub drops punctuation, keeps letters/digits/_/-
    return h.replace(" ", "-")

def anchors(path):
    text = path.read_text(encoding="utf-8")
    text = re.sub(r"```.*?```", "", text, flags=re.S)
    return {slug(m.group(1)) for m in re.finditer(r"^#{1,6}\s+(.+?)\s*$", text, re.M)}

bad = 0
for f in sys.argv[1:]:
    p = pathlib.Path(f)
    text = re.sub(r"```.*?```", "", p.read_text(encoding="utf-8"), flags=re.S)
    for target in re.findall(r"\]\(([^)\s]+)\)", text):
        if re.match(r"[a-z]+:", target):
            continue
        file_part, _, anchor = target.partition("#")
        dest = (p.parent / file_part).resolve() if file_part else p.resolve()
        if not dest.exists():
            print(f"{f}: missing file {target}"); bad += 1; continue
        if anchor and dest.suffix == ".md" and anchor not in anchors(dest):
            print(f"{f}: missing anchor {target}"); bad += 1
print("OK" if not bad else f"{bad} broken"); sys.exit(1 if bad else 0)
EOF
```

- [ ] **Step 2: Run it against the current README to confirm it works**

Run: `python3 "$TMPDIR/check_links.py" README.md docs/user-guide.md docs/releasing.md docs/deploying-as-an-editor-add-on.md`
Expected: `OK` (today's links resolve; `#get-your-own-copy` still exists). This proves the checker passes on known-good input before you rely on it.

- [ ] **Step 3: Replace README.md with exactly this content**

````markdown
# SSI Toolkit

**A Google Sheets add-on that runs AI over your data, one row at a time.**

*[TK: screenshot of the sidebar next to a filled-in output column — pending Looper rebrand]*

SSI Toolkit puts AI right alongside your Google Sheets. Pick the columns you want the AI to look at — plain text, Drive files like PDFs and scanned documents, web addresses, or YouTube links — write your directions once, and it runs them on every row, putting each answer in a new column. Asking one narrow question of 45 videos or 38,000 mission statements turns a big reporting question into small ones that the AI handles better and you can check row by row: the AI sorts and triages, you verify. And because the answers land in a column, you can filter, sort, pivot and `SUMIF` them like the rest of your data. Built at ProPublica, it's already helping reporters sort medical records, filter hours of YouTube video and sift court dockets.

See [what reporters use it for](#examples), or get help writing your first prompt with [ssi-skills](https://github.com/propublica/ssi-skills).

## Get started

### What you'll need

- A Google account
- A Gemini API key. It's free to start, though a few features (like Google Search) need a paid plan. Your plan also affects what Google can do with what you send it — see [Who can see my data?](docs/permissions.md#who-can-see-my-data). [AI Studio](https://aistudio.google.com/api-keys) makes it easy to create a key and, if you add billing, to [set a monthly spend cap](https://aistudio.google.com/spend).

### Copy the template

1. Open the [template Sheet](https://docs.google.com/spreadsheets/d/1Nti37ya2PzO7LeJ03YFCmRdNn2U2RsHNPa58Hzi8HzI/edit?usp=sharing). You'll likely see a **Request access** prompt — click it. We approve requests individually.
2. Once you have access, go to **File → Make a copy**. Your copy is entirely yours: its own script, its own data, its own API key.
3. Open the **Start Here** tab in your copy and follow its setup steps.

Then head to the [User Guide](docs/user-guide.md), which walks through each tool.

## Your data

SSI Toolkit has no server of its own. It runs on Google's servers, and when you use AI, the cells, prompt and linked files you choose are sent to Google's Gemini — never to the toolkit's developers. For what each permission on Google's consent screen means, and who can see what, read [Permissions: what SSI Toolkit asks for, and why](docs/permissions.md).

## Other ways to run it

Most people should start with the template. Two other options:

- **Want your own copy without requesting access, or want to change the code?** Set one up yourself with [Local Setup in CONTRIBUTING.md](CONTRIBUTING.md#local-setup).
- **Rolling it out to a whole organization on Google Workspace?** See [Deploying as an Editor add-on](docs/deploying-as-an-editor-add-on.md). This needs a Workspace account; a personal Gmail account can't publish an add-on privately.

## Examples

Each example is one question, asked of every row. Use them as starting points for your own.

### Finding the interviews in a pile of YouTube videos

You've collected links to about 45 Glenn Beck videos that mention Texas Attorney General Ken Paxton. A few are actual conversations with him; most just mention him. Put the links in a column and ask each one:

```
Return a single JSON object with exactly the following fields -- no other fields, and no text before or after the JSON object.

- `is_paxton_interview` -- a boolean (true/false). True if this video shows Glenn Beck and Texas Attorney General Ken Paxton having a conversation with each other (e.g. an interview, phone call, or direct exchange). False if Paxton is only mentioned, shown in a clip, or discussed without an actual conversation between the two.
- `reasoning` -- a string. A brief explanation for the classification, citing what is actually shown or said in the video.
```

Each answer lands in its cell as a small JSON object. Pull the true/false into its own column with a formula like `=REGEXEXTRACT(B2, """is_paxton_interview"":\s*(true|false)")`, filter to `true`, and you have your list — with the AI's `reasoning` right next to each one so you can check it.

### Tracking changes in 38,000 mission statements

For [Deleting DEI](https://www.propublica.org/article/deleting-dei-language-nonprofits-irs-forms), reporters had 38,000 nonprofit mission statements — two consecutive years for each nonprofit — and wanted to know which had changed their DEI language. With last year's statement in one column and this year's in the next, the prompt (condensed here for readability) was:

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

<details>
<summary>Full prompt we used</summary>

```
You are a careful, neutral analyst of organizational mission statements. Your job is to compare two consecutive-year mission statements from the SAME nonprofit and judge how the language changed with respect to DEI (Diversity, Equity, Inclusion), using ONLY the text provided.

DEFINITIONS (use these exactly):
- Diversity: presence of variety within the workforce in characteristics such as race, gender, ethnicity, sexual orientation, disability, age, culture, class, veteran status, or religion.
- Equity: fairness and justice, including attention to societal disparities and allocating resources and decision-making authority to groups historically disadvantaged; considering a person’s unique circumstances and adjusting treatment so outcomes are equal.
- Inclusion: an organizational culture where all employees feel their voices will be heard and experience belonging and integration.

EVIDENCE YOU MAY USE:
- Explicit DEI terms and synonyms in either statement.
  * Diversity: diversity, representation, underrepresented, historically marginalized, demographic mix, inclusive hiring, diverse workforce.
  * Equity: equity, equitable, fairness, justice, pay equity, accessibility, accommodations, remove barriers, anti-racism, resource allocation, measurable goals targeting disparities.
  * Inclusion: inclusion, inclusive, belonging, welcoming culture, psychological safety, employee voice, participation, integration.
- Strength/specificity signals: policies, goals/metrics, resource commitments, programs (e.g., “DEI office,” “pay equity analysis,” “targets”), named communities (e.g., “Black, Latinx, LGBTQ+, people with disabilities”).
- Directional changes: added, strengthened, weakened, or removed DEI language (including shifts to generic/neutral phrasing).

CLASSIFICATION RULES (pick ONE):
- Major Change: Clear introduction OR removal of explicit DEI language or commitments; or a substantial shift in strength/specificity (e.g., adding named groups, measurable goals, resource allocation; or deleting such content).
- Subtle Change: Smaller but notable shifts that plausibly relate to DEI—e.g., adding “inclusive,” “belonging,” or “welcoming” without policies/metrics; softening/toning down explicit language; generic phrases like “serve all” newly added. Changes are obvious but could be interpreted rather than directly stated.
- No Change: DEI content is effectively the same (only style/synonyms/order changed), or changes are unrelated to DEI.

TIE-BREAKERS & EDGE CASES:
- If unsure between two categories, choose the less severe one that is still supported by the text.
- Negative shifts (removals/softening) should still be labeled Major or Subtle based on magnitude.
- Ignore non-DEI edits (grammar, mission scope unrelated to workforce/culture/fairness).

OUTPUT FORMAT (strict):
Return ONLY valid JSON with two properties and nothing else:
{
  "change": "No Change" | "Subtle Change" | "Major Change",
  "rationale": "<≤50 words explaining the key evidence driving your choice>"
}

CHECKS BEFORE OUTPUT:
- Ensure the JSON is valid and contains exactly the two properties.
- Keep the rationale ≤ 50 words and reference concrete language differences.
- Do not include analysis notes, scores, or extra fields.

EXAMPLES (for format only; do not reuse content):
Example A → {"change":"Major Change","rationale":"Adds explicit equity and belonging commitments, names marginalized groups, and introduces measurable hiring goals not present last year."}
Example B → {"change":"Subtle Change","rationale":"New 'inclusive' and 'welcoming' phrasing without concrete actions; overall commitments remain general."}
Example C → {"change":"No Change","rationale":"Same DEI terms and emphasis; edits are stylistic with no added or removed commitments."}
Example D → {"change":"Major Change","rationale":"Removed a richly diverse and inclusive community with no replacement; no equity/belonging terms appear in the current text."}
```

</details>

Extract the `change` field the same way, filter to Major Change, and read those rationales first.

## Getting help

Questions, bugs or ideas? [Open a GitHub issue](https://github.com/propublica/gas-ssi-toolkit/issues).

## Learn more

- [User Guide](docs/user-guide.md) — how to use each tool
- [Permissions and your data](docs/permissions.md) — what the toolkit can access, and who can see what
- [Deploying as an Editor add-on](docs/deploying-as-an-editor-add-on.md) — for organizations
- [Contributing](CONTRIBUTING.md) — set up a dev copy and work on the code
- [Architecture](docs/architecture.md) and [Releasing](docs/releasing.md) — for maintainers
- [ssi-skills](https://github.com/propublica/ssi-skills) — help writing prompts

Built by ProPublica. [MIT License](LICENSE).
````

- [ ] **Step 4: Verify the README**

Run:
```bash
python3 "$TMPDIR/check_links.py" README.md
grep -c "Looper-shaped\|Get your own copy\|Deployment (for contributors)\|## Development\|Further Reading" README.md   # expect 0
grep -n "^## " README.md        # expect: Get started, Your data, Other ways to run it, Examples, Getting help, Learn more
grep -n -A1 "</summary>" README.md   # line after </summary> must be blank
grep -n -B1 "</details>" README.md   # line before </details> must be blank
grep -c "REGEXEXTRACT" README.md     # expect 1
```
Expected: checker prints `OK`; the counts and heading list match the comments.

- [ ] **Step 5: Correct the spec's example output wording**

In `docs/superpowers/specs/2026-10-01-readme-landing-page-design.md`, replace:

```
   Output: filter `is_paxton_interview` to true and that's your list; the
   `reasoning` field is what you check.
```
with:
```
   Output: each answer is one JSON object in one cell (the toolkit doesn't
   split fields into columns), so the README shows a `REGEXEXTRACT` formula
   that pulls `is_paxton_interview` into its own column, then filter to true;
   the `reasoning` field is what you check.
```

- [ ] **Step 6: Commit**

```bash
git add README.md docs/superpowers/specs/2026-10-01-readme-landing-page-design.md
git commit -m "docs: rewrite README as a landing page (AI-120)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Cross-doc edits

**Files:**
- Modify: `docs/releasing.md:3`
- Modify: `docs/deploying-as-an-editor-add-on.md:5`
- Modify: `docs/user-guide.md:18`
- Modify: `CONTRIBUTING.md` (step 6, after the "Reload your dev Sheet…" paragraph)
- Modify: `docs/threat_models/ssi-toolkit-threat-model.md:240,294`

**Interfaces:**
- Consumes: `README.md#get-started` from Task 1.

- [ ] **Step 1: Run the checker to see the failures this task fixes**

Run: `python3 "$TMPDIR/check_links.py" docs/user-guide.md docs/releasing.md docs/deploying-as-an-editor-add-on.md`
Expected: FAIL — three `missing anchor ../README.md#get-your-own-copy` lines.

- [ ] **Step 2: Repoint the two plain anchor links**

In `docs/releasing.md` and `docs/deploying-as-an-editor-add-on.md`, replace `../README.md#get-your-own-copy` with `../README.md#get-started`. Change nothing else on those lines.

- [ ] **Step 3: Rewrite the user-guide sentence**

In `docs/user-guide.md`, replace this exact sentence (end of line 18):

```
See the main [README](../README.md#get-your-own-copy) for the full walkthrough, including setting your own Gemini API key and getting past Google's "unverified app" warning the first time you run the menu.
```
with:
```
The Start Here tab in your copy walks you through setting your own Gemini API key and getting past Google's "unverified app" warning the first time you run the menu. See the main [README](../README.md#get-started) for an overview.
```
Touch nothing else in `docs/user-guide.md` — row 3 (AI-117) owns the rest of that section.

- [ ] **Step 4: Add the overwrite warning to CONTRIBUTING.md**

In `CONTRIBUTING.md`, directly after the paragraph that begins `Reload your dev Sheet. The **📐 SSI Toolkit** menu should appear.`, insert a blank line and:

```
> **Note:** Make code changes in this repo, not in the online Apps Script editor — the next `npm run deploy` overwrites anything edited there.
```

- [ ] **Step 5: Update the threat model's spend-cap references**

In `docs/threat_models/ssi-toolkit-threat-model.md`:

Line 240 (R16), replace:
```
Documented for developers in the README's Prerequisites section.
```
with:
```
Documented in README.md (Get started → What you'll need), CONTRIBUTING.md (Local Setup → Prerequisites), and docs/deploying-as-an-editor-add-on.md (Prerequisites).
```

Line 294 (AI-90 open-items row), replace:
```
documented in the README (R16)
```
with:
```
documented in README.md, CONTRIBUTING.md, and docs/deploying-as-an-editor-add-on.md (R16)
```

- [ ] **Step 6: Verify**

Run:
```bash
python3 "$TMPDIR/check_links.py" README.md CONTRIBUTING.md docs/user-guide.md docs/releasing.md docs/deploying-as-an-editor-add-on.md
grep -rn "get-your-own-copy" --include='*.md' . | grep -v node_modules | grep -v "docs/plans\|docs/superpowers"   # expect no output
grep -n "full walkthrough" docs/user-guide.md        # expect no output
grep -c "README's Prerequisites" docs/threat_models/ssi-toolkit-threat-model.md   # expect 0
```
Expected: checker `OK`; the greps match the comments.

- [ ] **Step 7: Commit**

```bash
git add docs/releasing.md docs/deploying-as-an-editor-add-on.md docs/user-guide.md CONTRIBUTING.md docs/threat_models/ssi-toolkit-threat-model.md
git commit -m "docs: repoint README links, move editor-overwrite note, update spend-cap refs (AI-120)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Update the tracker

**Files:**
- Modify: `docs/plans/2026-09-21-docs-restructure-tracker.md` (row 6; sequencing notes)

- [ ] **Step 1: Update row 6**

In the row-6 table line:
- Status: `Not started` → `Implemented`
- Spec: `—` → `[design](../superpowers/specs/2026-10-01-readme-landing-page-design.md)`
- Branch: `—` → `` `AI-120-readme-rewrite` ``
- Starting hypothesis: prepend `Scope finalized during this row's brainstorm: written for a reporter first; pitch drawn from Aaron's blog post (one-row-at-a-time framing, no "Looper-shaped" term, "check the AI's work" folded in); Get started defers to the template's Start Here tab (API key, unverified-app warning dropped from README); short "Your data" section linking to permissions.md; two examples (YouTube, plain text) with real prompts, DEI prompt condensed with the full text collapsed; screenshot left as TK pending the Looper rebrand; name stays "SSI Toolkit". Original hypothesis: ` before the existing text.

- [ ] **Step 2: Replace the first sequencing note**

Replace the bullet that begins `- Row 6 (README) should land after rows 4 and 5 exist` with:

```
- **Gate before `AI-102-docs-restructure-tracker` merges to `develop`:**
  the template Sheet's Start Here tab must include the "Google hasn't
  verified this app" walkthrough. Row 6 removed it from README, so until
  the template has it, a new user hits Google's block unexplained. README's
  screenshot is still a TK placeholder pending the Looper rebrand.
```

- [ ] **Step 3: Verify and commit**

Run: `grep -n "^| 6 " docs/plans/2026-09-21-docs-restructure-tracker.md | grep -c "Implemented"` — expect `1`.

```bash
git add docs/plans/2026-09-21-docs-restructure-tracker.md
git commit -m "docs: mark row 6 implemented in restructure tracker (AI-120)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Open the PR

- [ ] **Step 1:** `git branch --show-current` — must be `AI-120-readme-rewrite`.
- [ ] **Step 2:** Push is handed to Aaron (sandbox hangs on `git push`): give him `git push -u origin AI-120-readme-rewrite`.
- [ ] **Step 3:** Build the body from `.github/PULL_REQUEST_TEMPLATE.md` per CLAUDE.md "Creating PRs". **Base is `AI-102-docs-restructure-tracker`.** Feature-specific manual QA steps, numbered above the regression checklist:
  1. On the PR's GitHub file view, open README.md and confirm the pitch's "what reporters use it for" link jumps to Examples.
  2. Expand "Full prompt we used" and confirm it renders as a code block, not raw text.
  3. Click each link in README's Learn more, Your data, and What you'll need sections; all resolve.
  4. From `docs/user-guide.md`, `docs/releasing.md`, and `docs/deploying-as-an-editor-add-on.md`, click the README link; it lands on Get started.
  5. **Before the tracker branch merges to `develop`:** open the template Sheet's Start Here tab and confirm it includes the "Google hasn't verified this app" walkthrough (README no longer documents it).
  Notes: TK screenshot placeholder is intentional (pending Looper rebrand). Threat-model edit only updates documentation-location references for R16; no threat changes.
- [ ] **Step 4:** Create the PR with curl per memory (`-H "Authorization: Bearer $GH_TOKEN"`, JSON payload written to a `$TMPDIR` file first).
