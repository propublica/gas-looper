# Permissions: what SSI Toolkit asks for, and why

The first time you use SSI Toolkit, Google will ask you to approve a list of permissions. This page goes through each one.

## TL;DR

- **It acts as you.** Approving these permissions lets the toolkit work with your Google account on your behalf. It can only reach things your account can already reach, and nothing more.
- **It only opens what you point it at.** It reads the sheet you have open, the folders you name, and the files linked in the cells you choose to run it on. It never searches or browses the rest of your Drive, and it has no access at all to your Gmail, Calendar, or other Google apps.
- **It never deletes your files.** The only thing it ever deletes is a temporary file it created itself (see below).
- **There's no SSI Toolkit server.** The toolkit runs on Google's own servers, and its AI features use Google's Gemini AI. Your data isn't sent to the toolkit's developers or to any company other than Google.
- **One thing to watch for:** the toolkit trusts the links in the cells you run it on. If other people can edit your sheet, check that the file links are ones you expect before running AI or Extract Text, since it opens them with your access, not theirs.
- **If you're using your own copy of the SSI Toolkit sheet, you may see an "unverified app" warning.** [Here's why that appears](#why-does-google-say-it-hasnt-verified-this-app).

## Why does Google say it "hasn't verified this app"?

If you're using your own copy of the SSI Toolkit sheet (made from the template, or set up yourself from the code), you may see a warning screen: **"Google hasn't verified this app."** That's expected. Here's what it means:

- **"Verification" is Google's review of an app before it's widely shared.** Even if the original template were verified, your copy wouldn't be, and no one can apply for it but you.
- **Google treats your copy as a brand-new app, and you're its developer.** That's why the warning lists your own email address as the developer.
- **Verification needs a single, central version of the app that everyone installs**, such as a public Google Workspace Marketplace listing. We'd love to get there, but we're not there yet.
- **Despite the lack of verification, this project has gone through [threat modeling](threat_models/ssi-toolkit-threat-model.md).** We recommend reading the rest of this page to understand what the toolkit can and can't do with your data.

To continue past the warning, click **Advanced**, then **Go to [your sheet's name] (unsafe)**. "Unsafe" is Google's standard wording for any unverified app.

## What does the consent screen mean?

Here is a line-by-line breakdown of each permission request and what features it enables. If you'd like to check any of this against the code, see [Code references](#code-references) at the bottom.

### "See, edit, create, and delete all your Google Sheets spreadsheets"

Allows the toolkit to read from and write results to your spreadsheet. Required to:

- read the data in the sheet you have open
- write results back to it, usually into a new column (Sample Rows also adds a tab to hold its sample)

If you choose an existing column for results, the toolkit writes over what's already there.

Although Google's wording says "all," the toolkit only ever opens the spreadsheet you have open, and it never deletes a spreadsheet.

### "See and download all your Google Drive files"

Allows the toolkit to read files and folders in your Drive. Required to:

- look inside a folder you choose, including its subfolders, and list the files in it
- read files linked in your spreadsheet, including other Google Sheets
- read linked files (Docs, Sheets, PDFs, images) so their contents can be analyzed by Gemini

This permission is read-only: it can't change or delete anything in your Drive.

### "See, edit, create, and delete only the specific Google Drive files you use with this app"

Allows the toolkit to create and delete files it makes itself. Required to:

- create a temporary Google Doc so Google can turn a PDF or image into text (text recognition, sometimes called OCR), then delete it

The temporary Doc's name starts with `[SSI-TEMP]` and it's deleted as soon as the text has been read.

### "See, edit, create, and delete all your Google Docs documents"

Allows the toolkit to read the text of Google Docs. Required to:

- read the text of Google Docs linked in your spreadsheet
- read the temporary Doc described above

The toolkit never edits or deletes any of your existing Docs.

### "Connect to an external service"

Allows the toolkit to talk to other Google services over the internet. Required to:

- send your data to Google's Gemini AI to be analyzed
- fetch those linked files from Google Drive over the internet. Apps Script counts this as an outside connection even though it stays within Google
- look up the real web addresses behind the sources Gemini cites when it uses Google Search

No data is sent to any service outside Google.

### "Display and run third-party web content in prompts and sidebars inside Google applications"

Required for the **📐 SSI Toolkit** menu and its sidebar to appear inside Google Sheets. "Third-party" just means not made by Google — here, that's the toolkit's own menu and sidebar. Without this permission the toolkit can't show you anything at all.

### If you see two more: your email address and personal info

If you installed the toolkit from the Google Workspace Marketplace, or your organization installed it for everyone, you may also see **"See your primary Google Account email address"** and **"See your personal info, including any personal info you've made publicly available."**

Google adds these two to every Marketplace app by default. SSI Toolkit never reads your email address or profile. Nothing in its code asks for them.

## What data is transmitted?

The toolkit is built on Google Apps Script, Google's tool for adding features to Sheets, Docs, and other Google apps. That means it runs on Google's servers. There is no separate SSI Toolkit server. If you use a Google Workspace account (through work or school), Apps Script is covered by [the same level of data protection](https://workspaceupdates.googleblog.com/2026/06/google-apps-script-workspace-core-service.html) as the rest of your Workspace.

The one exception is AI. When you use AI, the following information is sent to Google's Gemini servers:

- The cell values you selected, labeled with their column names by default
- The prompt you chose
- The content of any linked files

If you turn on Gemini's optional tools, Gemini may also reach beyond your data. With **Google Search**, it searches the web using wording based on your prompt. With **URL context**, Google's servers visit the web addresses that appear in your prompt, so those websites receive a visit.

To use AI, someone has to connect the toolkit to Gemini with a **Gemini API key**, a code that links the toolkit to a Gemini account. If you made your own copy of the toolkit, that someone is you; otherwise, it's usually whoever set the toolkit up for your team. What Google may do with what you send to Gemini depends on that Gemini account's plan, not on SSI Toolkit. On a paid plan, Google says it doesn't use your prompts to improve its products; on the free plan, it may, and people at Google may review them.

Ask whoever set up your Gemini key which plan you're on. See Google's [Gemini API terms](https://ai.google.dev/gemini-api/terms) for details.

## What data is retained?

SSI Toolkit doesn't keep its own copy of your data. Here's what does stick around, and for how long:

| What | How long | Who can see it |
|---|---|---|
| Temporary Docs made for text recognition | Deleted as soon as the text is read | You, while it exists (it's in your Drive) |
| Files sent to Gemini | [48 hours](https://ai.google.dev/gemini-api/docs/files), then deleted automatically | Whoever set up your Gemini key can see a list of them |
| Progress messages and cost estimates in the sidebar (counts, status messages, and your column names, not your cell contents) | 5 minutes and up to 6 hours | Only you |
| Error logs: the type of error, sometimes with a short message such as the name of a column that wasn't found, or an error message from Google or Gemini | 30 days ([Google's default](https://docs.cloud.google.com/logging/quotas)) | Whoever runs the toolkit's behind-the-scenes code project: the sheet's owner and anyone who can edit it, if you're using your own copy of the SSI Toolkit sheet, or your organization, if it installed the toolkit from the Google Workspace Marketplace |
| Gemini request logs: copies of what was sent and received. **Off unless someone turns them on** | None by default. If turned on: [55 days](https://ai.google.dev/gemini-api/docs/logs-datasets), or longer if saved to a dataset | Whoever set up your Gemini key |

## Who can see my data?

| Who | What they can see |
|---|---|
| SSI Toolkit's developers | Nothing. There's no SSI Toolkit server, so your data never reaches them. |
| Google | What's already in your Drive and Sheets, plus what you send to Gemini. What Google does with the Gemini part depends on your plan (see [What data is transmitted?](#what-data-is-transmitted)). |
| Whoever set up your Gemini key | A list of files sent to Gemini (for 48 hours), and copies of requests and responses only if they've turned on request logging. |
| People who can edit your sheet (if you're using your own copy of the SSI Toolkit sheet) | The toolkit's error logs. They can also see any results the toolkit writes into the sheet, as with anything else in it. |
| Your organization (if it installed the toolkit from the Google Workspace Marketplace) | The toolkit's error logs. |
| Other websites | Only if you turn on Gemini's URL context tool: those sites receive a visit to the web addresses in your prompt. |

## Questions or concerns

If something here is unclear or looks wrong, [open an issue](https://github.com/propublica/gas-ssi-toolkit/issues) on the project's GitHub page. If your organization installed the toolkit for you, your admin can tell you which Gemini plan you're on and who can see the project's logs.

## Code references

SSI Toolkit is open source. The full list of permissions it requests is in [`appsscript.json`](../appsscript.json).

| Permission | Where it's used in the code |
|---|---|
| Google Sheets | [`src/server/index.ts`](../src/server/index.ts) (each tool's entry point, e.g. `runBatchAI`, starts from `getActiveSpreadsheet`), [`src/server/safe-writes.ts`](../src/server/safe-writes.ts) (`writeSafeValue`, the one path for writing to cells; `findOrCreateColumn`) |
| Google Drive (read-only) | [`src/server/utils.ts`](../src/server/utils.ts) (`getAllFilesRecursive`), [`src/server/drive.ts`](../src/server/drive.ts) (`extractTextUniversal`, `fetchDriveMetadata`, `downloadDriveFiles`) |
| Drive files this app creates | [`src/server/drive.ts`](../src/server/drive.ts) (`extractTextUniversal`) |
| Google Docs | [`src/server/drive.ts`](../src/server/drive.ts) (`extractTextUniversal`) |
| Connect to an external service | [`src/server/api.ts`](../src/server/api.ts) (`callGeminiAPI`, `callGeminiAPIBatch`), [`src/server/files.ts`](../src/server/files.ts) (`uploadFilesToGemini`), [`src/server/drive.ts`](../src/server/drive.ts) (`fetchDriveMetadata`, `downloadDriveFiles`), [`src/server/utils.ts`](../src/server/utils.ts) (`resolveGroundingUris`) |
| Menu and sidebar | [`src/server/index.ts`](../src/server/index.ts) (`onOpen`, `showSidebar`) |
| Error logs, progress, and cost estimates | [`src/server/error-handling.ts`](../src/server/error-handling.ts) (`logError`), [`src/server/utils.ts`](../src/server/utils.ts) (`writeJobProgress`, `writeRunStats`) |
