# Permissions: what SSI Toolkit asks for, and why

The first time you use SSI Toolkit, Google will ask you to approve a list of permissions. This page goes through each one: what it lets the toolkit do, which feature needs it, and what the toolkit *can't* do with it.

SSI Toolkit is open source, so you don't have to take our word for any of this. Each section links to the code that backs it up, and the full list of permissions the code asks for lives in one file, [`appsscript.json`](../appsscript.json).

## Tl;DR

- **It acts as you.** Approving these permissions lets the toolkit work with your Google account on your behalf. It can only reach things your account can already reach, and nothing more.
- **It only opens what you point it at.** It reads the sheet you have open, the folders you name, and the files linked in the cells you choose to run it on. It never searches or browses the rest of your Drive.
- **There's no SSI Toolkit server.** The code runs on Google's servers, inside Google Apps Script. AI requests are handled by Google's Gemini servers. Your data isn't sent to the toolkit's developers or to any company other than Google.
- **One thing to watch for:** the toolkit trusts the links in the cells you run it on. If other people can edit your sheet, check that the file links are ones you expect before running Run AI or Extract Text, since it opens them with your access, not theirs.

## What does the consent screen mean?

Here is a line-by-line breakdown of each permission request and what features they enable:

### "See, edit, create, and delete all your Google Sheets spreadsheets"

Allows the SSI Toolkit to read from and write results to your spreadsheet. Required to:

- read the data in your current Google Sheet
- write results back to it, usually into a new column (Sample Rows also adds a tab to hold its sample)

The toolkit only ever opens the spreadsheet you have open, and it never deletes a spreadsheet.

**See the code:** [`src/server/index.ts`](../src/server/index.ts) (each tool's entry point, e.g. `runBatchAI`, all of which start from `getActiveSpreadsheet`), [`src/server/safe-writes.ts`](../src/server/safe-writes.ts) (`writeSafeValue`, the one path for writing to cells)

### "See and download all your Google Drive files"

Allows the SSI Toolkit to read files and folders in your Drive. Required to:

- scan a folder you specify, including its subfolders, and list the files inside it
- read the content of files you reference in your spreadsheet, including other Google Sheets
- retrieve file contents (Docs, Sheets, PDFs, images) to send to Gemini for analysis

This permission is read-only: it can't change or delete anything in your Drive.

**See the code:** [`src/server/utils.ts`](../src/server/utils.ts) (`getAllFilesRecursive`), [`src/server/drive.ts`](../src/server/drive.ts) (`extractTextUniversal`, `fetchDriveMetadata`, `downloadDriveFiles`)

### "See, edit, create, and delete only the specific Google Drive files you use with this app"

Allows the SSI Toolkit to create and delete files it generates itself. Required to:

- create and delete a temporary Google Doc to perform text extraction on PDFs and images

It can't touch any other file in your Drive.

**See the code:** [`src/server/drive.ts`](../src/server/drive.ts) (`extractTextUniversal`)

### "See, edit, create, and delete all your Google Docs documents"

Allows the SSI Toolkit to read the text content of Google Docs. Required to:

- read the body text of Google Docs you reference in your spreadsheet
- read the temporary Docs created during text extraction

The toolkit never edits or deletes any of your existing Docs.

**See the code:** [`src/server/drive.ts`](../src/server/drive.ts) (`extractTextUniversal`)

### "Connect to an external service"

Allows the SSI Toolkit to make outbound network requests. Required to:

- send data to Google's Gemini API to perform inference
- download files you've linked from Google Drive so they can be sent to Gemini
- look up the real web addresses behind the source links Gemini returns when it uses Google Search

No data is sent to any service outside Google.

**See the code:** [`src/server/api.ts`](../src/server/api.ts) (`callGeminiAPI`, `callGeminiAPIBatch`), [`src/server/files.ts`](../src/server/files.ts) (`uploadFilesToGemini`), [`src/server/drive.ts`](../src/server/drive.ts) (`fetchDriveMetadata`, `downloadDriveFiles`), [`src/server/utils.ts`](../src/server/utils.ts) (`resolveGroundingUris`)

### "Display and run third-party web content in prompts and sidebars inside Google applications"

Required for the SSI Tools menu and sidebar to appear inside Google Sheets. Without this permission the add-on cannot display its interface at all.

**See the code:** [`src/server/index.ts`](../src/server/index.ts) (`onOpen`, `showSidebar`)

### If you see two more: your email address and personal info

If you installed the toolkit from the Google Workspace Marketplace, or your organization installed it for everyone, you may also see **"See your primary Google Account email address"** and **"See your personal info, including any personal info you've made publicly available."**

Google adds these two to every Marketplace app by default. SSI Toolkit never reads your email address or profile. Nothing in its code asks for them.

## What personal data is accessed?

SSI Toolkit only opens what you point it at:

- The contents of the active Google Sheet
- Google Drive files and folders you reference in your spreadsheet

It never searches or browses the rest of your Drive.

SSI Toolkit may use your Drive to create a temporary copy of certain file types (PDFs, images) in order to access Google Drive's native text extraction (OCR) capabilities. See ["See, edit, create, and delete only the specific Google Drive files you use with this app"](#see-edit-create-and-delete-only-the-specific-google-drive-files-you-use-with-this-app) for more details.

## What data is transmitted?

SSI Toolkit is built on Apps Script, meaning it runs on Google's servers. There is no third-party SSI Toolkit server. If you use a Google Workspace account (through work or school), Apps Script is covered by [the same level of data protection](https://workspaceupdates.googleblog.com/2026/06/google-apps-script-workspace-core-service.html) as the rest of your Workspace.

The one exception is AI. When you use Run AI or the `=SSI()` formula, the following information is transmitted to Google's Gemini servers:

- The cell values you selected (and, for Run AI, their column names)
- The prompt you chose
- The content of any linked files (Run AI only)

If a Run AI input cell contains a YouTube link, Gemini watches that video directly from YouTube.

If you turn on Gemini's optional tools, Gemini may also reach beyond your data. With **Google Search**, it searches the web using wording based on your prompt. With **URL context**, Google's servers visit the web addresses that appear in your prompt, so those websites receive a request for that address.

What Google may do with what you send to Gemini depends on your Gemini API plan, not on SSI Toolkit:

- **On a paid plan**, Google says it doesn't use your prompts or responses to improve its products. It keeps them for a limited time only to detect abuse.
- **On the free (unpaid) plan**, Google may use them to improve its products, and people at Google may review them.
- **In the European Economic Area, Switzerland, or the UK**, Google applies the paid-plan rules even on the free plan.

Ask whoever set up your Gemini API key which plan you're on. See Google's [Gemini API terms](https://ai.google.dev/gemini-api/terms) for details.

## What data is retained?

SSI Toolkit doesn't keep its own copy of your data. Here's what does stick around, and for how long.

Temporary files created during text extraction (their names start with `[SSI-TEMP]`) are deleted immediately after use.

Files sent to Gemini are [stored on Google's infrastructure for 48 hours](https://ai.google.dev/gemini-api/docs/files) before being deleted automatically. They're stored in the Google Cloud project that owns the Gemini API key, and whoever owns that key can see a list of them during that time.

The sidebar's progress messages and cost estimates are held in temporary Apps Script storage tied to your account, for 5 minutes and up to 6 hours respectively. They contain counts, status messages, and your column names, not your cell contents.

When something goes wrong, the toolkit's own logging records only the *type* of error. Google also automatically logs errors the toolkit shows you, and unexpected crashes. Those entries can include a short message, such as the name of a column that wasn't found, or an error message from Google or Gemini. Whoever runs the toolkit's Apps Script project can see these logs. If the toolkit is attached to a copy of the template sheet, that's the sheet's owner and anyone who can edit it. If your organization installed it for everyone, it's your organization.

**See the code:** [`src/server/error-handling.ts`](../src/server/error-handling.ts) (`logError`), [`src/server/utils.ts`](../src/server/utils.ts) (`writeJobProgress`, `writeRunStats`)

Whoever owns the Gemini API key can also choose to turn on [request logging](https://ai.google.dev/gemini-api/docs/logs-datasets) in Google AI Studio, which stores copies of requests and responses. It's off unless they enable it.

## Questions or concerns

If something here is unclear or looks wrong, [open an issue](https://github.com/propublica/gas-ssi-toolkit/issues) on the project's GitHub page. If your organization installed the toolkit for you, your admin can tell you which Gemini plan you're on and who can see the project's logs.
