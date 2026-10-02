# Looper

**A Google Sheets extension that runs AI over your data, one row at a time. Built and tested by ProPublica journalists.**

At ProPublica, we use spreadsheets to organize many of our investigations. They also help us wield AI effectively.

Constraining AI to a single row forces us to break big questions into smaller, more carefully considered chunks, which are usually easier for the AI to answer and easier for us to audit.

This approach helped power stories like [Deleting DEI](https://www.propublica.org/article/deleting-dei-language-nonprofits-irs-forms), [DOJ Declinations](https://www.propublica.org/article/trump-doj-immigration-bondi-declinations-criminal-investigations) and [Woke Grants](https://www.propublica.org/article/ted-cruz-woke-grants-national-science-foundation).

We built Looper right into Google Sheets because that's where hundreds of newsrooms around the world already work.

Here is the core flow:

1. Select the spreadsheet columns you want the AI to look at
2. Craft the set of directions you want the AI to follow
3. Run the AI over each row

Use it to analyze text, Google Drive files (PDFs, Docs, images, audio and video), public web addresses and YouTube links. **Because the answers land in a spreadsheet column, you can filter, sort and pivot them like the rest of your data.**

For help writing your first prompt, check out [looper-skills](https://github.com/propublica/looper-skills).

## Get started

### What you'll need

- A Google account
- A Gemini API key. It's free to start, though a few features (like Google Search) need a paid plan. Your plan also affects what Google can do with what you send it — see [Who can see my data?](docs/permissions.md#who-can-see-my-data). [AI Studio](https://aistudio.google.com/api-keys) makes it easy to create a key and, if you add billing, to [set a monthly spend cap](https://aistudio.google.com/spend).

### Option 1: Copy the template

The easiest way to get started is to open our [template sheet](https://docs.google.com/spreadsheets/d/1Nti37ya2PzO7LeJ03YFCmRdNn2U2RsHNPa58Hzi8HzI/edit?usp=sharing). It comes with Looper pre-installed and a tutorial to walk you through it.

You'll likely see a **Request access** prompt — click it. We approve requests individually.

When you're ready to begin, open the **Installation** tab and follow its setup steps. It will walk you through copying the template, configuring an API key and the relevant permissions. See [Your data](#your-data) for more privacy information.

Our [User Guide](docs/user-guide.md) covers every tool available plus helpful tips.

### Option 2: Other ways to run it

- **Want your own copy without requesting access, or want to change the code?** Set one up yourself with [Local Setup in CONTRIBUTING.md](CONTRIBUTING.md#local-setup).
- **Rolling it out to a whole organization on Google Workspace?** See [Deploying as an Editor add-on](docs/deploying-as-an-editor-add-on.md). This needs a Workspace account; a personal Gmail account can't publish an add-on privately.

## Your data

Looper has no server of its own. It runs on Google's servers, and when you use AI, the cells, prompt and linked files you choose are sent to Gemini — never to the toolkit's developers. For what each permission on Google's consent screen means, where it's used, and who can see what, read [Permissions: what Looper asks for, and why](docs/permissions.md).

## Getting help

Questions, bugs or ideas? [Open a GitHub issue](https://github.com/propublica/gas-looper/issues).

## Learn more

- [User Guide](docs/user-guide.md) — tips and tricks for each tool
- [Permissions and your data](docs/permissions.md) — what the toolkit can access, and who can see what
- [Deploying as an Editor add-on](docs/deploying-as-an-editor-add-on.md) — for organizations
- [Contributing](CONTRIBUTING.md) — set up a dev copy and work on the code
- [Architecture](docs/architecture.md) and [Releasing](docs/releasing.md) — for maintainers
- [looper-skills](https://github.com/propublica/looper-skills) — help writing prompts

[MIT License](LICENSE)
