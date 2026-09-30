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

Every tool reads from the sheet you have open and writes its results back into it, usually into a new column. Sample Rows also adds a tab to hold the sample, or adds to the one it made last time.

Although Google's wording says "all," the toolkit only ever opens the spreadsheet you have open, and it never deletes a spreadsheet. (If you link another Google Sheet as a Run AI input, the toolkit reads it using the Drive permission below, not this one.)

**See the code:** [`src/server/index.ts`](../src/server/index.ts) (each tool's entry point, e.g. `runBatchAI`, all of which start from `getActiveSpreadsheet`), [`src/server/safe-writes.ts`](../src/server/safe-writes.ts) (`writeSafeValue`, the one path for writing to cells)

### "See and download all your Google Drive files"

**Reading the files and folders you point it at.**

This lets the toolkit:

- list the files inside a folder you name, including its subfolders (Import Drive Links and recipes). It collects each file's link (and checks its file type, if you filter by type), not its contents.
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

The toolkit only reads Docs. It never edits or deletes any of your existing Docs. The Google Docs service the toolkit uses in Apps Script needs this permission even just to read a Doc you link to.

**See the code:** [`src/server/drive.ts`](../src/server/drive.ts) (`extractTextUniversal`)

### "Connect to an external service"

**Talking to Google services over the internet.**

Apps Script needs this permission for any web request the code makes itself. SSI Toolkit makes them only to Google services:

- **Google's Gemini API**, to send your prompts and files for analysis (Run AI and the `=SSI()` formula).
- **Google Drive's API**, to download the files you've linked so they can be sent to Gemini.
- **Google's own search-result links**, when Gemini uses Google Search to answer. Gemini returns its sources as Google redirect links, and the toolkit checks each one to show you the real web address. It doesn't send any of your data in that step, and it doesn't visit the site itself.

The toolkit's own code never sends data to any service outside Google. (Gemini's optional tools work a little differently; see [What gets sent where](#what-gets-sent-where).)

**See the code:** [`src/server/api.ts`](../src/server/api.ts) (`callGeminiAPI`, `callGeminiAPIBatch`), [`src/server/files.ts`](../src/server/files.ts) (`uploadFilesToGemini`), [`src/server/drive.ts`](../src/server/drive.ts) (`fetchDriveMetadata`, `downloadDriveFiles`), [`src/server/utils.ts`](../src/server/utils.ts) (`resolveGroundingUris`)

### "Display and run third-party web content in prompts and sidebars inside Google applications"

**Showing the SSI Toolkit menu and sidebar.**

This is what lets the toolkit add its menu to Google Sheets and open its sidebar panel. "Third-party" just means content that isn't made by Google, which here is the toolkit's own interface. Without this permission the toolkit can't show you anything at all.

**See the code:** [`src/server/index.ts`](../src/server/index.ts) (`onOpen`, `showSidebar`)

### If you see two more: your email address and personal info

If you installed the toolkit from the Google Workspace Marketplace, or your organization installed it for everyone, you may also see **"See your primary Google Account email address"** and **"See your personal info, including any personal info you've made publicly available."**

Google adds these two to every Marketplace app by default. SSI Toolkit never reads your email address or profile. Nothing in its code asks for them.

## What happens to your data

### What gets sent where

When you use **Run AI** or the `=SSI()` formula, the cell values you selected (and, for Run AI, their column names and any linked files) are sent to Google's Gemini API to be analyzed. That's the only place your data goes outside of Google Drive and Sheets. **Import Drive Links**, **Extract Text**, and **Sample Rows** don't use Gemini at all; they work entirely within Google Drive, Docs, and Sheets.

If you turn on Gemini's optional tools, Gemini may reach beyond your data. With **Google Search**, it searches the web using wording based on your prompt. With **URL context**, Google's servers visit the web addresses that appear in your prompt, so those websites receive a request for that address. The toolkit itself still only talks to Google.

### What's kept, and for how long

- **The temporary OCR Doc**: deleted as soon as its text is read (see above).
- **Files sent to Gemini**: stored by Gemini's Files API, in the Google Cloud project that owns the Gemini API key, and deleted automatically after 48 hours ([Google's documentation](https://ai.google.dev/gemini-api/docs/files)). Whoever owns that key can see a list of them while they're stored.
- **Progress and run statistics**: the sidebar's progress messages and cost estimates are held in temporary storage tied to your account, for 5 minutes and up to 6 hours respectively. They contain counts, status messages, and your column names, not your cell contents.
- **Error logs**: when something goes wrong, the toolkit's own logging records only the *type* of error. Google also automatically logs errors the toolkit shows you, and unexpected crashes. Those entries can include a short message, such as the name of a column that wasn't found, or an error message from Google or Gemini. Whoever runs the toolkit's Apps Script project can see these logs. If the toolkit is attached to a copy of the template sheet, that's the sheet's owner and anyone who can edit it. If your organization installed it for everyone, it's your organization.

The toolkit itself doesn't keep a copy of your data anywhere else.

**See the code:** [`src/server/error-handling.ts`](../src/server/error-handling.ts) (`logError`), [`src/server/utils.ts`](../src/server/utils.ts) (`writeJobProgress`, `writeRunStats`)

### What Google may do with what you send to Gemini

This depends on your organization's Gemini API plan, not on the toolkit.

- **On a paid plan**, Google says it doesn't use your prompts or responses to improve its products. It keeps them for a limited time only to detect abuse.
- **On the free (unpaid) plan**, Google may use them to improve its products, and people at Google may review them.
- **In the European Economic Area, Switzerland, or the UK**, Google applies the paid-plan rules even on the free plan.

Ask whoever set up your Gemini API key which plan you're on. If you made your own copy, that's you. See Google's [Gemini API terms](https://ai.google.dev/gemini-api/terms) for the details. Whoever owns the Gemini API key can also choose to turn on [request logging](https://ai.google.dev/gemini-api/docs/logs-datasets) in Google AI Studio, which stores copies of requests and responses. It's off unless they enable it.

## Questions or concerns

If something here is unclear or looks wrong, [open an issue](https://github.com/propublica/gas-ssi-toolkit/issues) on the project's GitHub page. If your organization installed the toolkit for you, your admin can tell you which Gemini plan you're on and who can see the project's logs.
