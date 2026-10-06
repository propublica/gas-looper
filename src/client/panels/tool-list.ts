import type { NavigationContext, Panel } from "../types";
import type { GuidedParams } from "./guided-ai-inference";
import { runTool, formatMarkdownSelection } from "../services";
import { jobStore } from "../job-store";

// Placeholder until our own post on row-by-row AI is published.
const WHY_ONE_ROW_URL =
  "https://www.ire.org/2026/08/13/using-llms-in-data-journalism-can-be-trustworthy-if-these-five-elements-are-in-your-methodology/";

export class ToolListPanel implements Panel {
  mount(container: HTMLElement, nav: NavigationContext): void {
    container.innerHTML = this.template();
    this.wireEvents(container, nav);
  }

  unmount(): undefined {
    return undefined;
  }

  private wireEvents(container: HTMLElement, nav: NavigationContext): void {
    // Explicit params mean a fresh Guided every time: the chosen kind is
    // always honored, and earlier Guided progress isn't restored from home.
    const openGuided = (startWith: GuidedParams["startWith"]): void => {
      const params: GuidedParams = { startWith };
      nav.navigate("guided-ai-inference", params);
    };
    container.querySelector("#btn-guided-columns")?.addEventListener("click", () => {
      openGuided("column");
    });
    container.querySelector("#btn-guided-folder")?.addEventListener("click", () => {
      openGuided("drive-folder");
    });
    container.querySelector("#btn-run-ai")?.addEventListener("click", () => {
      nav.navigate("configure-ai-run");
    });
    // Collapsed on every mount so the two Guided choices stay the focus.
    container.querySelector("#more-tools-toggle")?.addEventListener("click", () => {
      const toggle = container.querySelector<HTMLButtonElement>("#more-tools-toggle")!;
      const content = container.querySelector<HTMLElement>("#more-tools-content")!;
      content.hidden = !content.hidden;
      toggle.setAttribute("aria-expanded", String(!content.hidden));
    });
    container.querySelector("#btn-import-drive-links")?.addEventListener("click", () => {
      nav.navigate("import-drive-links");
    });
    container.querySelector("#btn-extract-text")?.addEventListener("click", () => {
      nav.navigate("extract-text");
    });
    container.querySelector("#btn-sample-rows")?.addEventListener("click", () => {
      this.dispatchTool("sampleRowsToEvaluation", "🎲 Sample Rows");
    });
    container.querySelector("#btn-format-markdown")?.addEventListener("click", () => {
      const btn = container.querySelector<HTMLButtonElement>("#btn-format-markdown")!;
      const name = btn.querySelector(".tool-row-name")!;
      btn.disabled = true;
      name.textContent = "Formatting...";
      formatMarkdownSelection()
        .catch((err: Error) => globalThis.alert(err.message))
        .finally(() => {
          btn.disabled = false;
          name.textContent = "Format Markdown";
        });
    });
  }

  private dispatchTool(fn: string, label: string): void {
    const jobId = `${fn}-${Date.now()}`;
    jobStore
      .dispatch(jobId, label, runTool(fn, jobId))
      .catch((err: Error) => globalThis.alert(err.message));
  }

  private template(): string {
    const choice = (id: string, icon: string, name: string, sub: string): string => `
      <button id="${id}" class="home-choice">
        <span class="icon">${icon}</span>
        <span>
          <span class="home-choice-name">${name}</span>
          <span class="home-choice-sub">${sub}</span>
        </span>
      </button>`;
    const toolRow = (id: string, icon: string, name: string, sub: string): string => `
      <button id="${id}" class="tool-row">
        <span class="icon">${icon}</span>
        <span>
          <span class="tool-row-name">${name}</span>
          <span class="tool-row-sub">${sub}</span>
        </span>
      </button>`;
    return `
      <p class="home-question">What do you want to work on?</p>
      <p class="home-help">AI will read each row, one at a time.</p>
      ${choice(
        "btn-guided-columns",
        "📄",
        "Columns in this sheet",
        "Text, links, or Drive files already in your spreadsheet",
      )}
      ${choice("btn-guided-folder", "📂", "A Drive folder", "Import a folder, one file per row")}
      <p class="home-freeform">Already know what to do? <button id="btn-run-ai" class="link-btn">Go Freeform</button></p>
      <div class="home-tools">
        <button type="button" id="more-tools-toggle" class="collapsible-header" aria-expanded="false" aria-controls="more-tools-content">
          <span class="collapsible-label">More tools</span>
          <span class="collapsible-summary">Import Files, Extract text, Sample, Format</span>
          <span class="collapsible-chevron">▶</span>
        </button>
        <div id="more-tools-content" class="collapsible-content" hidden>
          ${toolRow(
            "btn-import-drive-links",
            "📂",
            "Import Drive Links",
            "Add a folder's files to your sheet, by file type",
          )}
          ${toolRow("btn-extract-text", "📜", "Extract Text", "Pull text from Docs, PDFs, and images")}
          ${toolRow("btn-sample-rows", "🎲", "Sample Rows", "Pick a random set to check by hand")}
          ${toolRow(
            "btn-format-markdown",
            "📝",
            "Format Markdown",
            "Turn AI **formatting** into rich text",
          )}
        </div>
      </div>
      <div class="home-footer">
        <a href="${WHY_ONE_ROW_URL}" target="_blank" rel="noopener">Why one row at a time?</a>
        <span>Looper v{{VERSION}}</span>
      </div>
    `;
  }
}
