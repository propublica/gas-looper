# Contributing

## Local Setup

These directions will help you run the toolkit as a [container-bound script](https://developers.google.com/apps-script/guides/bound) attached to a Google Sheet you own. It's the fastest dev loop: every push shows up in your Sheet's menu, with no test deployment needed. If you're working on add-on-specific behavior or distributing the toolkit, see [Deploying as an Editor Add-on](docs/deploying-as-an-editor-add-on.md) instead.

### Prerequisites

- A Google account
- Node.js 22 (pinned in `.nvmrc`)
- The Apps Script API enabled at [script.google.com/home/usersettings](https://script.google.com/home/usersettings). Without it, your first push fails with "User has not enabled the Apps Script API."
- [A Gemini API key](https://ai.google.dev/gemini-api/docs/api-key)
  - Tip: [AI Studio](https://aistudio.google.com/api-keys) makes it easy to mint a key and [set a monthly spend cap](https://aistudio.google.com/spend) to avoid surprise billing

[`@google/clasp`](https://github.com/google/clasp) is included as a devDependency, so no global install is needed.

### 1. Clone the repo

If you're contributing from outside ProPublica, fork the repo first and clone your fork's URL instead.

```zsh
git clone https://github.com/propublica/gas-ssi-toolkit.git
cd gas-ssi-toolkit
nvm use
```

### 2. Create a dev Sheet and its Apps Script project

Create a new Google Sheet to use as your dev Sheet, then open **Extensions → Apps Script**. This creates an Apps Script project bound to that Sheet.

### 3. Set your Gemini API key

In the script editor: **Project Settings** → **Script Properties** → add `GEMINI_API_KEY` with your API key. **Anyone with Editor access to your dev Sheet can see this key.**

### 4. Get the script ID

In the script editor: **Project Settings** → copy the **Script ID**.

### 5. Create `.clasp.json`

At the repo root (the file is gitignored):

```zsh
cat > .clasp.json << 'EOF'
{
  "scriptId": "<your-script-id>",
  "rootDir": "./dist"
}
EOF
```

### 6. Install and deploy

```zsh
npm install
npm run clasp:login    # authenticate with Google
npm run deploy         # build + push to Apps Script
```

On your first push, clasp asks whether to overwrite the manifest. Answer **y**: that's how `appsscript.json`'s Drive advanced service and OAuth scopes reach your project. Answering no (or running non-interactively) skips the push entirely.

Reload your dev Sheet. The **📐 SSI Toolkit** menu should appear. The first time you run anything from it, Google shows a **"Google hasn't verified this app"** warning. Click **Advanced**, then **Go to [your sheet's name] (unsafe)**, and grant access. [`docs/permissions.md`](docs/permissions.md) explains each permission.

### Day-to-day commands

```bash
# Build
npm run build               # clean build to dist/
npm run build:watch         # rebuild on file changes

# Deploy
npm run deploy              # build + push to your Apps Script project
npm run deploy:watch        # rebuild and push on every change

# Test
npm test                    # run all tests
npm run test:watch          # watch mode
npm run test:coverage       # with per-file coverage thresholds

# Quality
npm run lint                # ESLint
npm run lint:fix            # ESLint with auto-fix
npm run typecheck           # type-check without building
npm run format              # Prettier (rewrites files)
npm run format:check        # check Prettier formatting

# Utilities
npm run clasp:open          # open the Apps Script editor in your browser
npm run clasp:logs          # open Cloud Logging (needs a linked standard GCP project)
```

For container-bound dev, check logs on the script editor's **Executions** page instead. `clasp:logs` only works once you've linked a standard GCP project.

## Branch Workflow

```
feature-branch → develop   (PR + code review)
develop        → main      (PR = release gate)
```

`develop` is the default branch and where all PRs land. `main` holds only released code — it's what distributors deploy from — so never open a PR against it.

Feature work happens on branches, merged to `develop` via PR. When ready to ship, `develop` is merged to `main` via a PR containing manual QA instructions — that merge is the release gate.

## Exposing a new server function

Apps Script has no module system — it only sees top-level global functions. Rollup wraps everything in an IIFE assigned to `_GASEntry`, and `rollup.config.js`'s `footer` field appends plain global stubs that delegate into it (e.g. `function onOpen(e) { _GASEntry.onOpen(e); }`).

**To expose a new function to Apps Script, you must do both:**

1. `export` it from `src/server/index.ts`
2. Add a matching global stub in the `footer` of `rollup.config.js`

Skipping step 2 means Apps Script can't discover or call the function. If the function is also called from the client, also add it to `src/client/google.d.ts` — that file is **not auto-generated**, so a client-callable function typechecks against stale declarations and only fails at runtime if you skip this.

## Testing

Tests live in `__tests__/`. See [Day-to-day commands](#day-to-day-commands) for how to run them.

### Mocking GAS globals

Apps Script globals (`UrlFetchApp`, `DriveApp`, `SpreadsheetApp`, etc.) must be set on `globalThis` **before** importing the module under test, because imports execute immediately:

```ts
(globalThis as any).UrlFetchApp = { fetch: jest.fn() };
const { callGeminiAPI } = await import("../src/server/api");
```

### Mocking `google.script.run`

Capture the success/failure handlers registered by the function under test, then invoke them manually to simulate GAS callbacks:

```ts
const mockRun = {
  withSuccessHandler: jest.fn().mockReturnThis(),
  withFailureHandler: jest.fn().mockReturnThis(),
  myServerFunction: jest.fn(),
};
(globalThis as unknown as { google: unknown }).google = { script: { run: mockRun } };

let capturedSuccess: (v: unknown) => void;
mockRun.withSuccessHandler.mockImplementation((fn) => {
  capturedSuccess = fn;
  return mockRun;
});
// Later: capturedSuccess(mockValue) to simulate a successful GAS response.
```

### Coverage

Coverage is enforced per-file. Run `npm run test:coverage` to check thresholds. Two files are excluded from coverage collection:

- `src/server/index.ts` — deeply coupled to SpreadsheetApp UI globals, not unit-tested.
- `src/client/sidebar-entry.ts` — calls `init()` immediately at module load time, before `beforeEach` can set up the DOM.

## Code Style

The code follows the Google TypeScript Style Guide. ESLint, Prettier, and the husky pre-commit hooks enforce most of it automatically. The conventions tooling doesn't fully catch:

- Named exports only (no default exports)
- Avoid `any`; prefer `unknown`
- UpperCamelCase for types/interfaces, lowerCamelCase for functions/variables, CONSTANT_CASE for constants
- Prefix unused parameters with `_`

## Before opening a PR

- **Run `npm run lint:fix` and `npm run format`** (see [Day-to-day commands](#day-to-day-commands)).
- **Check the threat model.** If your change affects anything documented in [`docs/threat_models/`](docs/threat_models/), or introduces a new threat, update it in the same PR.
- **Keep [`docs/permissions.md`](docs/permissions.md) accurate.** If you change OAuth scopes in `appsscript.json`, add or change a data flow, change what's retained or logged, or rename/move a function listed in its "Code references" table, update it in the same PR. It's public and user-facing.
