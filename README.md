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

Pull out the category with `=REGEXEXTRACT(C2, """change"":\s*""([^""]+)""")` (where C2 is the answer cell), filter to Major Change, and read those rationales first.

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
