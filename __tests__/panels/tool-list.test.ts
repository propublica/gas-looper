/**
 * @jest-environment jsdom
 */

jest.mock("../../src/client/services", () => ({
  runTool: jest.fn(),
  formatMarkdownSelection: jest.fn(),
}));

jest.mock("../../src/client/job-store", () => ({
  jobStore: { dispatch: jest.fn().mockResolvedValue(undefined) },
}));

import { ToolListPanel } from "../../src/client/panels/tool-list";
import * as services from "../../src/client/services";
import * as jobStoreModule from "../../src/client/job-store";
import type { NavigationContext } from "../../src/client/types";

const mockNav: NavigationContext = {
  navigate: jest.fn(),
  back: jest.fn(),
  canGoBack: jest.fn().mockReturnValue(false),
};

function mountPanel(): HTMLElement {
  document.body.innerHTML = '<div id="app"></div>';
  const container = document.getElementById("app")!;
  const panel = new ToolListPanel();
  panel.mount(container, mockNav);
  return container;
}

beforeEach(() => {
  jest.clearAllMocks();
  (jobStoreModule.jobStore.dispatch as jest.Mock).mockResolvedValue(undefined);
});

describe("ToolListPanel — entry question", () => {
  it("asks what the user wants to work on", () => {
    const c = mountPanel();
    expect(c.querySelector(".home-question")!.textContent).toBe("What do you want to work on?");
    expect(c.querySelector(".home-help")!.textContent).toBe(
      "AI will read each row, one at a time.",
    );
  });

  it("renders the two choices with their descriptions, columns first", () => {
    const c = mountPanel();
    const choices = Array.from(c.querySelectorAll(".home-choice")).map((el) => [
      el.id,
      el.querySelector(".home-choice-name")!.textContent,
      el.querySelector(".home-choice-sub")!.textContent,
    ]);
    expect(choices).toEqual([
      [
        "btn-guided-columns",
        "Columns in this sheet",
        "Text, links, or Drive files already in your spreadsheet",
      ],
      ["btn-guided-folder", "A Drive folder", "Import a folder, one file per row"],
    ]);
  });

  it("'Columns in this sheet' opens Guided preset to column input, resuming earlier work", () => {
    const c = mountPanel();
    c.querySelector<HTMLButtonElement>("#btn-guided-columns")!.click();
    expect(mockNav.navigate).toHaveBeenCalledWith(
      "guided-ai-inference",
      { startWith: "column" },
      { resume: true },
    );
  });

  it("'A Drive folder' opens Guided preset to Drive-folder input, resuming earlier work", () => {
    const c = mountPanel();
    c.querySelector<HTMLButtonElement>("#btn-guided-folder")!.click();
    expect(mockNav.navigate).toHaveBeenCalledWith(
      "guided-ai-inference",
      { startWith: "drive-folder" },
      { resume: true },
    );
  });

  it("'Go Freeform' is a text link that navigates to configure-ai-run with no params", () => {
    const c = mountPanel();
    const link = c.querySelector<HTMLButtonElement>(".home-freeform #btn-run-ai")!;
    expect(link.classList.contains("link-btn")).toBe(true);
    expect(link.textContent).toBe("Go Freeform");
    link.click();
    expect(mockNav.navigate).toHaveBeenCalledWith("configure-ai-run");
  });
});

describe("ToolListPanel — other tools", () => {
  it("renders the other tools as rows with one-line descriptions, in order", () => {
    const c = mountPanel();
    expect(c.querySelector(".home-tools h3")!.textContent).toBe("Other tools");
    const rows = Array.from(c.querySelectorAll(".tool-row")).map((row) => [
      row.id,
      row.querySelector(".tool-row-name")!.textContent,
      row.querySelector(".tool-row-sub")!.textContent,
    ]);
    expect(rows).toEqual([
      [
        "btn-import-drive-links",
        "Import Drive Links",
        "Add a folder's files to your sheet, by file type",
      ],
      ["btn-extract-text", "Extract Text", "Pull text from Docs, PDFs, and images"],
      ["btn-sample-rows", "Sample Rows", "Pick a random set to check by hand"],
      ["btn-format-markdown", "Format Markdown", "Turn AI **formatting** into rich text"],
    ]);
  });

  it("clicking Import Drive Links navigates to import-drive-links panel", () => {
    const c = mountPanel();
    c.querySelector<HTMLButtonElement>("#btn-import-drive-links")!.click();
    expect(mockNav.navigate).toHaveBeenCalledWith("import-drive-links");
  });

  it("clicking Extract Text navigates to extract-text panel", () => {
    const c = mountPanel();
    c.querySelector<HTMLButtonElement>("#btn-extract-text")!.click();
    expect(mockNav.navigate).toHaveBeenCalledWith("extract-text");
  });

  it("clicking Sample Rows dispatches a job labelled '🎲 Sample Rows' (no description)", () => {
    (services.runTool as jest.Mock).mockResolvedValue(undefined);
    const c = mountPanel();
    c.querySelector<HTMLButtonElement>("#btn-sample-rows")!.click();
    expect(services.runTool).toHaveBeenCalledWith(
      "sampleRowsToEvaluation",
      expect.stringMatching(/^sampleRowsToEvaluation-\d+$/),
    );
    expect(jobStoreModule.jobStore.dispatch).toHaveBeenCalledWith(
      expect.stringMatching(/^sampleRowsToEvaluation-\d+$/),
      "🎲 Sample Rows",
      expect.anything(),
    );
  });

  it("disables Format Markdown and shows 'Formatting...' while in flight, then restores", async () => {
    let resolve!: () => void;
    (services.formatMarkdownSelection as jest.Mock).mockReturnValue(
      new Promise<void>((res) => {
        resolve = res;
      }),
    );
    const c = mountPanel();
    const btn = c.querySelector<HTMLButtonElement>("#btn-format-markdown")!;

    btn.click();
    expect(btn.disabled).toBe(true);
    expect(btn.querySelector(".tool-row-name")!.textContent).toBe("Formatting...");
    expect(btn.querySelector(".tool-row-sub")).not.toBeNull();

    resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(btn.disabled).toBe(false);
    expect(btn.querySelector(".tool-row-name")!.textContent).toBe("Format Markdown");
  });

  it("ignores a second Format Markdown click while the first is in flight", () => {
    (services.formatMarkdownSelection as jest.Mock).mockReturnValue(new Promise<void>(() => {}));
    const c = mountPanel();
    const btn = c.querySelector<HTMLButtonElement>("#btn-format-markdown")!;
    btn.click();
    btn.click();
    expect(services.formatMarkdownSelection).toHaveBeenCalledTimes(1);
  });

  it("re-enables Format Markdown and alerts on error", async () => {
    let reject!: (err: Error) => void;
    (services.formatMarkdownSelection as jest.Mock).mockReturnValue(
      new Promise<void>((_, rej) => {
        reject = rej;
      }),
    );
    const mockAlert = jest.fn();
    const origAlert = globalThis.alert;
    globalThis.alert = mockAlert;

    const c = mountPanel();
    const btn = c.querySelector<HTMLButtonElement>("#btn-format-markdown")!;
    btn.click();
    expect(btn.disabled).toBe(true);

    reject(new Error("GAS error"));
    await Promise.resolve();
    await Promise.resolve();
    expect(btn.disabled).toBe(false);
    expect(btn.querySelector(".tool-row-name")!.textContent).toBe("Format Markdown");
    expect(mockAlert).toHaveBeenCalledWith("GAS error");

    globalThis.alert = origAlert;
  });
});

describe("ToolListPanel — footer", () => {
  it("links 'Why one row at a time?' to the IRE post in a new tab", () => {
    const c = mountPanel();
    const link = c.querySelector<HTMLAnchorElement>(".home-footer a")!;
    expect(link.textContent).toBe("Why one row at a time?");
    expect(link.getAttribute("href")).toBe(
      "https://www.ire.org/2026/08/13/using-llms-in-data-journalism-can-be-trustworthy-if-these-five-elements-are-in-your-methodology/",
    );
    expect(link.target).toBe("_blank");
    expect(link.rel).toBe("noopener");
  });

  it("shows the Looper version placeholder exactly once", () => {
    const c = mountPanel();
    const footer = c.querySelector(".home-footer")!;
    expect(footer.textContent).toContain("Looper v{{VERSION}}");
    expect(c.innerHTML.split("{{VERSION}}")).toHaveLength(2);
  });
});

it("unmount() returns undefined", () => {
  document.body.innerHTML = '<div id="app"></div>';
  const panel = new ToolListPanel();
  panel.mount(document.getElementById("app")!, mockNav);
  expect(panel.unmount()).toBeUndefined();
});
