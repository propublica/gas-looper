import type { Panel, PanelId, NavigationContext, NavigateOptions } from "./types";

interface StackEntry {
  panelId: PanelId;
  params?: unknown;
  savedState?: unknown;
}

export class Router {
  private stack: StackEntry[] = [];
  private currentPanel: Panel | null = null;
  private readonly panels: Map<PanelId, Panel>;
  private readonly container: HTMLElement;
  /**
   * Remembers the last state each panel was left with, independent of
   * navigation path — lets a bare navigate() (no explicit params) restore
   * where the user left off, even after visiting unrelated panels in
   * between. Explicit params are a command by default (e.g. Guided's
   * "Switch to Freeform" config) and bypass this cache; a caller passing
   * { resume: true } marks its params as a suggestion, so the cached
   * savedState is passed along with them and the panel decides.
   */
  private readonly lastState = new Map<PanelId, { params?: unknown; savedState?: unknown }>();

  constructor(container: HTMLElement, panels: Map<PanelId, Panel>) {
    this.container = container;
    this.panels = panels;
  }

  start(initialPanelId: PanelId): void {
    const panel = this.panels.get(initialPanelId);
    if (!panel) throw new Error(`Unknown panel: ${initialPanelId}`);
    this.stack = [{ panelId: initialPanelId }];
    this.currentPanel = panel;
    this.container.innerHTML = "";
    panel.mount(this.container, this.makeNav(), undefined, undefined);
  }

  navigate(panelId: PanelId, params?: unknown, options?: NavigateOptions): void {
    const panel = this.panels.get(panelId);
    if (!panel) throw new Error(`Unknown panel: ${panelId}`);
    this.leaveCurrentPanel();

    const useCache = params === undefined || options?.resume === true;
    const cached = useCache ? this.lastState.get(panelId) : undefined;
    const effectiveParams = params ?? cached?.params;
    this.stack.push({ panelId, params: effectiveParams, savedState: cached?.savedState });
    this.currentPanel = panel;
    this.container.innerHTML = "";
    panel.mount(this.container, this.makeNav(), effectiveParams, cached?.savedState);
  }

  back(): void {
    if (this.stack.length <= 1) return;
    this.leaveCurrentPanel();
    this.stack.pop();
    const entry = this.stack[this.stack.length - 1];
    const panel = this.panels.get(entry.panelId)!;
    this.currentPanel = panel;
    this.container.innerHTML = "";
    panel.mount(this.container, this.makeNav(), entry.params, entry.savedState);
  }

  canGoBack(): boolean {
    return this.stack.length > 1;
  }

  /** Unmounts the current panel and records its final state for a future bare navigate(). */
  private leaveCurrentPanel(): void {
    if (!this.currentPanel || this.stack.length === 0) return;
    const leaving = this.stack[this.stack.length - 1];
    const savedState = this.currentPanel.unmount();
    leaving.savedState = savedState;
    this.lastState.set(leaving.panelId, { params: leaving.params, savedState });
  }

  private makeNav(): NavigationContext {
    return {
      navigate: (id, params, options) => this.navigate(id, params, options),
      back: () => this.back(),
      canGoBack: () => this.canGoBack(),
    };
  }
}
