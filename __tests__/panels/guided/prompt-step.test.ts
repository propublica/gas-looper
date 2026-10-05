/**
 * @jest-environment jsdom
 */

jest.mock("../../../src/client/services", () => ({
  fillColumns: jest.fn(),
}));

import {
  PromptStep,
  SYSTEM_PROMPT_COLUMN_TITLE,
} from "../../../src/client/panels/guided/prompt-step";
import * as services from "../../../src/client/services";
import type { StepContext } from "../../../src/client/types";

function makeContainer(): HTMLElement {
  document.body.innerHTML = '<div id="app"></div>';
  return document.getElementById("app")!;
}

function makeCtx(): StepContext & {
  onComplete: jest.Mock;
  onError: jest.Mock;
  onBusyChange: jest.Mock;
} {
  return { onComplete: jest.fn(), onError: jest.fn(), onBusyChange: jest.fn() };
}

beforeEach(() => {
  jest.clearAllMocks();
  globalThis.alert = jest.fn();
});

describe("PromptStep — Gemini Gem link", () => {
  it("renders the link when a gemUrl is provided", () => {
    const container = makeContainer();
    const step = new PromptStep("https://gemini.google.com/gem/abc123");
    step.mount(container, makeCtx());

    const link = container.querySelector<HTMLAnchorElement>(".guided-gem-link a");
    expect(link).not.toBeNull();
    expect(link!.href).toBe("https://gemini.google.com/gem/abc123");
    expect(link!.target).toBe("_blank");
    expect(link!.rel).toContain("noopener");
  });

  it("omits the link entirely when no gemUrl is provided", () => {
    const container = makeContainer();
    const step = new PromptStep();
    step.mount(container, makeCtx());

    expect(container.querySelector(".guided-gem-link")).toBeNull();
  });

  it("omits the link for a non-http(s) scheme (e.g. a misconfigured javascript: URL)", () => {
    const container = makeContainer();
    const step = new PromptStep("javascript:alert(1)");
    step.mount(container, makeCtx());

    expect(container.querySelector(".guided-gem-link")).toBeNull();
  });

  it("cannot break out of the href attribute via an embedded quote (built via DOM APIs, not string-templated HTML)", () => {
    const container = makeContainer();
    const step = new PromptStep(`https://example.com" onclick="evil()`);
    step.mount(container, makeCtx());

    const link = container.querySelector<HTMLAnchorElement>(".guided-gem-link a");
    expect(link).not.toBeNull();
    // No separate onclick attribute was created -- the embedded quote
    // ended up safely escaped inside the single href value instead.
    expect(link!.getAttribute("onclick")).toBeNull();
    expect(link!.attributes).toHaveLength(3); // href, target, rel -- nothing extra
  });

  it("appears in both the inline flavor area and the expanded modal", () => {
    const container = makeContainer();
    const step = new PromptStep("https://gemini.google.com/gem/abc123");
    step.mount(container, makeCtx());

    expect(container.querySelectorAll(".guided-gem-link a")).toHaveLength(2);
  });
});

describe("PromptStep — Expand modal", () => {
  it("moves the textarea into the modal and reveals it on Expand", () => {
    const container = makeContainer();
    const step = new PromptStep();
    step.mount(container, makeCtx());
    container.querySelector<HTMLTextAreaElement>("#gp-prompt-text")!.value = "Draft text";

    container.querySelector<HTMLButtonElement>("#gp-expand-btn")!.click();

    expect(container.querySelector<HTMLElement>("#gp-modal-overlay")!.hidden).toBe(false);
    expect(
      container
        .querySelector("#gp-modal-textarea-slot")!
        .contains(container.querySelector("#gp-prompt-text")),
    ).toBe(true);
    // Same element, not a copy -- value survives the move automatically.
    expect(container.querySelector<HTMLTextAreaElement>("#gp-prompt-text")!.value).toBe(
      "Draft text",
    );
  });

  it("moves the textarea back and hides the modal on Close, keeping the edited value", () => {
    const container = makeContainer();
    const step = new PromptStep();
    step.mount(container, makeCtx());
    container.querySelector<HTMLButtonElement>("#gp-expand-btn")!.click();
    container.querySelector<HTMLTextAreaElement>("#gp-prompt-text")!.value = "Edited in modal";

    container.querySelector<HTMLButtonElement>("#gp-modal-close")!.click();

    expect(container.querySelector<HTMLElement>("#gp-modal-overlay")!.hidden).toBe(true);
    expect(
      container
        .querySelector("#gp-textarea-slot")!
        .contains(container.querySelector("#gp-prompt-text")),
    ).toBe(true);
    expect(container.querySelector<HTMLTextAreaElement>("#gp-prompt-text")!.value).toBe(
      "Edited in modal",
    );
  });

  it("closes when the backdrop (not the modal box itself) is clicked", () => {
    const container = makeContainer();
    const step = new PromptStep();
    step.mount(container, makeCtx());
    container.querySelector<HTMLButtonElement>("#gp-expand-btn")!.click();

    container.querySelector<HTMLElement>("#gp-modal-overlay")!.click();

    expect(container.querySelector<HTMLElement>("#gp-modal-overlay")!.hidden).toBe(true);
  });

  it("does not close when clicking inside the modal box itself", () => {
    const container = makeContainer();
    const step = new PromptStep();
    step.mount(container, makeCtx());
    container.querySelector<HTMLButtonElement>("#gp-expand-btn")!.click();

    container.querySelector<HTMLElement>(".guided-modal")!.click();

    expect(container.querySelector<HTMLElement>("#gp-modal-overlay")!.hidden).toBe(false);
  });
});

describe("PromptStep — required prompt", () => {
  it("alerts and does not call fillColumns when the prompt is empty", () => {
    const container = makeContainer();
    const step = new PromptStep();
    const ctx = makeCtx();
    step.mount(container, ctx);
    container.querySelector<HTMLButtonElement>("#gp-continue")!.click();
    expect(globalThis.alert).toHaveBeenCalledWith(
      expect.stringContaining("describe what the AI should do"),
    );
    expect(services.fillColumns).not.toHaveBeenCalled();
    expect(ctx.onComplete).not.toHaveBeenCalled();
  });

  it("alerts on whitespace-only input", () => {
    const container = makeContainer();
    const step = new PromptStep();
    step.mount(container, makeCtx());
    container.querySelector<HTMLTextAreaElement>("#gp-prompt-text")!.value = "   ";
    container.querySelector<HTMLButtonElement>("#gp-continue")!.click();
    expect(globalThis.alert).toHaveBeenCalled();
    expect(services.fillColumns).not.toHaveBeenCalled();
  });
});

describe("PromptStep — commit", () => {
  it("writes a single fill-value FillColumnSpec and calls onComplete", async () => {
    (services.fillColumns as jest.Mock).mockResolvedValue({ rowRange: { start: 2, end: 5 } });
    const container = makeContainer();
    const step = new PromptStep();
    const ctx = makeCtx();
    step.mount(container, ctx);
    container.querySelector<HTMLTextAreaElement>("#gp-prompt-text")!.value =
      "You are a helpful assistant.";
    container.querySelector<HTMLButtonElement>("#gp-continue")!.click();
    await Promise.resolve();
    await Promise.resolve();

    expect(services.fillColumns).toHaveBeenCalledWith({
      cols: [
        {
          colTitle: SYSTEM_PROMPT_COLUMN_TITLE,
          fillStrategy: { kind: "fill-value", value: "You are a helpful assistant." },
        },
      ],
      inputValues: {},
    });
    expect(ctx.onComplete).toHaveBeenCalledTimes(1);
    expect(step.getResult()).toEqual({ systemPromptCol: SYSTEM_PROMPT_COLUMN_TITLE });
  });

  it("reverts the continue button to idle on success too -- StepFlow can re-expand this step's DOM later without a mount(), so a leftover loading state would otherwise stay stuck", async () => {
    (services.fillColumns as jest.Mock).mockResolvedValue({ rowRange: { start: 2, end: 5 } });
    const container = makeContainer();
    const step = new PromptStep();
    step.mount(container, makeCtx());
    container.querySelector<HTMLTextAreaElement>("#gp-prompt-text")!.value = "Do something.";
    const continueBtn = container.querySelector<HTMLButtonElement>("#gp-continue")!;
    continueBtn.click();
    for (let i = 0; i < 5; i++) await Promise.resolve();

    expect(continueBtn.disabled).toBe(false);
    expect(continueBtn.textContent).toBe("Import & Continue");
  });

  it("shows a loading state on the continue button while fillColumns is in flight, then reverts to idle on failure", async () => {
    let rejectFillColumns!: (err: Error) => void;
    (services.fillColumns as jest.Mock).mockReturnValue(
      new Promise((_resolve, reject) => {
        rejectFillColumns = reject;
      }),
    );
    const container = makeContainer();
    const step = new PromptStep();
    step.mount(container, makeCtx());
    container.querySelector<HTMLTextAreaElement>("#gp-prompt-text")!.value = "Do something.";
    const continueBtn = container.querySelector<HTMLButtonElement>("#gp-continue")!;
    continueBtn.click();
    await Promise.resolve();

    expect(continueBtn.disabled).toBe(true);
    expect(continueBtn.textContent).toContain("Importing...");

    rejectFillColumns(new Error("boom"));
    for (let i = 0; i < 5; i++) await Promise.resolve();

    expect(continueBtn.disabled).toBe(false);
    expect(continueBtn.textContent).toBe("Import & Continue");
  });

  it("calls ctx.onError and alerts, not onComplete, when fillColumns rejects", async () => {
    (services.fillColumns as jest.Mock).mockRejectedValue(new Error("write failed"));
    const container = makeContainer();
    const step = new PromptStep();
    const ctx = makeCtx();
    step.mount(container, ctx);
    container.querySelector<HTMLTextAreaElement>("#gp-prompt-text")!.value = "Do something.";
    container.querySelector<HTMLButtonElement>("#gp-continue")!.click();
    for (let i = 0; i < 5; i++) await Promise.resolve();

    expect(ctx.onError).toHaveBeenCalledTimes(1);
    expect(ctx.onComplete).not.toHaveBeenCalled();
    expect(globalThis.alert).toHaveBeenCalledWith(expect.stringContaining("write failed"));
  });
});

describe("PromptStep — unmount/mount round trip", () => {
  it("unmount() returns the full, untruncated 'Prompt: ' summary -- truncation is StepFlow's job", () => {
    const container = makeContainer();
    const step = new PromptStep();
    step.mount(container, makeCtx());
    const long = "x".repeat(80);
    container.querySelector<HTMLTextAreaElement>("#gp-prompt-text")!.value = long;
    const result = step.unmount();
    expect(result?.summary).toBe("Prompt: " + long);
    expect(result?.savedState.promptText).toBe(long);
  });

  it("mount(savedState) restores the prompt text", () => {
    const container = makeContainer();
    const step = new PromptStep();
    step.mount(container, makeCtx(), { promptText: "restored text" });
    expect(container.querySelector<HTMLTextAreaElement>("#gp-prompt-text")!.value).toBe(
      "restored text",
    );
  });

  it("unmount() before mount returns undefined", () => {
    expect(new PromptStep().unmount()).toBeUndefined();
  });
});

describe("PromptStep — setInteractive", () => {
  it("disables and re-enables the Continue button", () => {
    const container = makeContainer();
    const step = new PromptStep();
    step.mount(container, makeCtx());

    step.setInteractive(false);
    expect(container.querySelector<HTMLButtonElement>("#gp-continue")!.disabled).toBe(true);

    step.setInteractive(true);
    expect(container.querySelector<HTMLButtonElement>("#gp-continue")!.disabled).toBe(false);
  });

  it("is a no-op before mount -- StepFlow re-asserts the gate at mount time, so a still-locked step can legitimately be told its state first", () => {
    expect(() => new PromptStep().setInteractive(false)).not.toThrow();
  });
});

describe("PromptStep — onBusyChange", () => {
  it("reports busy true before the request and false after it resolves", async () => {
    (services.fillColumns as jest.Mock).mockResolvedValue(undefined);
    const container = makeContainer();
    const step = new PromptStep();
    const ctx = makeCtx();
    step.mount(container, ctx);
    container.querySelector<HTMLTextAreaElement>("#gp-prompt-text")!.value = "Summarize this.";

    container.querySelector<HTMLButtonElement>("#gp-continue")!.click();
    expect(ctx.onBusyChange).toHaveBeenNthCalledWith(1, true);

    await Promise.resolve();
    await Promise.resolve();

    expect(ctx.onBusyChange).toHaveBeenNthCalledWith(2, false);
  });

  it("reports busy false after a failed request", async () => {
    (services.fillColumns as jest.Mock).mockRejectedValue(new Error("boom"));
    const container = makeContainer();
    const step = new PromptStep();
    const ctx = makeCtx();
    step.mount(container, ctx);
    container.querySelector<HTMLTextAreaElement>("#gp-prompt-text")!.value = "Summarize this.";

    container.querySelector<HTMLButtonElement>("#gp-continue")!.click();
    await Promise.resolve();
    await Promise.resolve();

    expect(ctx.onBusyChange).toHaveBeenLastCalledWith(false);
    expect(ctx.onError).toHaveBeenCalled();
  });
});
