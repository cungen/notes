import {
  ItemView,
  KeymapEventHandler,
  MarkdownView,
  Notice,
  Scope,
  TFile,
  WorkspaceLeaf,
  type App,
  type ViewStateResult,
} from "obsidian";
import MindElixir, { DARK_THEME, RIGHT, THEME } from "mind-elixir";
import type { MindElixirInstance, NodeObj, Topic } from "mind-elixir";
import { parseInline } from "marked";
import mindElixirCss from "mind-elixir/style.css";
import { markdownToMindElixirData } from "./mind-data";
import {
  buildHeadingLine,
  ensureLeadingHeading,
  headingLevelFromLine,
  insertChildHeadingLines,
  insertSiblingHeadingLines,
  parseAtxHeadingTree,
  replaceListLineBody,
  flattenOutline,
} from "./parser";
import { readBaseline, safeApplyContent, safeReplaceLine, type ContentBaseline } from "./safe-write";

export const ZMIND_VIEW_TYPE = "zmind-view";

/** Set false after layout looks correct. Adds colored outlines (see styles.css `.zmind-debug-layout`). */
const ZMIND_DEBUG_LAYOUT = false;
/** Set false to stop Obsidian toasts for Mind Elixir bus events. */
const ZMIND_DEBUG_MIND_EVENTS = false;
/** Throttle toasts for high-frequency bus events (ms). */
const ZMIND_DEBUG_THROTTLE_MS = 1200;

const CSS_INJECT_ID = "zmind-mind-elixir-styles";

function escapeHtmlMinimal(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Inline-only HTML — `marked.parse` wraps in `<p>` and breaks `me-tpc` layout (list vs heading styling). */
function topicMarkdownToHtml(src: string): string {
  const t = src.trim().length ? src : "(empty)";
  try {
    return parseInline(t, { async: false }) as string;
  } catch {
    return escapeHtmlMinimal(t);
  }
}

/** Block Mind Elixir structural edits — outline shape comes from Markdown only. */
const denyStructural = (): boolean => false;

async function openMarkdownAtLine(app: App, file: TFile, line: number) {
  let target: WorkspaceLeaf | null = null;
  app.workspace.iterateAllLeaves((leaf) => {
    const v = leaf.view;
    if (v instanceof MarkdownView && v.file?.path === file.path) target = leaf;
  });
  if (target) {
    await app.workspace.setActiveLeaf(target, { focus: true });
  } else {
    await app.workspace.getLeaf("tab").openFile(file, { active: true });
  }
  const md = app.workspace.getActiveViewOfType(MarkdownView);
  if (!md || md.file?.path !== file.path) return;
  const lineLen = md.editor.getLine(line).length;
  md.editor.setCursor({ line, ch: 0 });
  md.editor.setSelection({ line, ch: 0 }, { line, ch: lineLen });
  md.editor.scrollIntoView({ from: { line, ch: 0 }, to: { line, ch: lineLen } }, true);
}

export class ZmindView extends ItemView {
  private file: TFile | null = null;
  private baseline: ContentBaseline | null = null;
  private ignoreNextModify = false;
  private mind: MindElixirInstance | null = null;
  private resizeObs: ResizeObserver | null = null;
  /** Outer host (flex fill); Mind Elixir mounts only inside {@link mapCanvas}. */
  private mapHost!: HTMLDivElement;
  /** Passed to Mind Elixir — ME clears this element’s `innerHTML` on init (never put UI here). */
  private mapCanvas!: HTMLDivElement;
  private hintEl!: HTMLDivElement;
  /** Resize Obsidian `.view-content` so we can sync full pane height (fixes half-pane). */
  private viewContentResizeObs: ResizeObserver | null = null;

  /** Source line for the selected heading (`metadata.line` on Mind Elixir nodes). */
  private focusedLine: number | null = null;

  private queuedPath: string | null = null;
  private keymapHandlers: KeymapEventHandler[] = [];
  private mindDebugLast = { scale: 0, move: 0, linkDiv: 0 };
  /** Native listener on ME `.map-container` — must use capture so we run before ME’s bubble `dblclick`. */
  private mindDblClickCleanup: (() => void) | null = null;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
    this.navigation = true;
  }

  getViewType(): string {
    return ZMIND_VIEW_TYPE;
  }

  getDisplayText(): string {
    if (this.file) return `Zmind: ${this.file.basename}`;
    return "Zmind";
  }

  getIcon(): string {
    return "git-branch";
  }

  onResize(): void {
    this.scheduleMindRefit();
  }

  async onOpen() {
    /** Re-open/reload can call onOpen again; prevent stacked shells (caused “hint bar in middle”). */
    this.containerEl.empty();
    this.scope = new Scope(this.app.scope);
    this.containerEl.addClass("zmind-root");
    if (ZMIND_DEBUG_LAYOUT) {
      this.containerEl.addClass("zmind-debug-layout");
    }
    this.containerEl.closest(".workspace-leaf")?.classList.add("zmind-workspace-leaf");

    const shell = this.containerEl.createDiv({ cls: "zmind-shell" });
    this.hintEl = shell.createDiv({
      cls: "zmind-hint-bar",
      text: "Zmind · Click = select · Space or F2 = edit inline · Tab/Enter = new heading (via plugin) · Alt+click = open in editor",
    });

    this.mapHost = shell.createDiv({ cls: "zmind-map-host" });
    this.mapCanvas = this.mapHost.createDiv({ cls: "zmind-map-canvas" });

    this.mapHost.setAttr("tabindex", "0");
    this.registerDomEvent(this.mapHost, "pointerdown", () => {
      void this.app.workspace.setActiveLeaf(this.leaf);
      this.mapHost.focus({ preventScroll: true });
    });

    /** Box selection uses `selectNodes`; single-click focus is synced from `me-tpc.nodeObj`. */
    this.registerDomEvent(
      this.mapCanvas,
      "click",
      (ev: MouseEvent) => {
        const tpc = (ev.target as HTMLElement).closest("me-tpc") as Topic | null;
        if (!tpc?.nodeObj) return;
        void this.app.workspace.setActiveLeaf(this.leaf);
        this.syncFocusFromNodeObj(tpc.nodeObj);
        try {
          this.mind?.selectNode(tpc);
        } catch {
          /* noop */
        }
      },
      { capture: true },
    );

    this.registerDomEvent(this.mapCanvas, "click", (ev: MouseEvent) => {
      if (!ev.altKey || !this.file || this.focusedLine == null) return;
      ev.preventDefault();
      void openMarkdownAtLine(this.app, this.file, this.focusedLine);
    });

    this.registerDomEvent(
      this.mapCanvas,
      "focusin",
      (ev: FocusEvent) => {
        if (!ZMIND_DEBUG_MIND_EVENTS) return;
        const t = ev.target as HTMLElement | null;
        if (t?.id === "input-box") {
          new Notice("Zmind: inline edit #input-box focused", 3500);
        }
      },
      { capture: true },
    );

    if (this.scope) {
      this.keymapHandlers.push(
        this.scope.register([], "Space", () => {
          if (this.focusedLine == null) {
            new Notice("Select a node first.");
            return false;
          }
          if (ZMIND_DEBUG_MIND_EVENTS) {
            new Notice(`Zmind: Space → edit (line ${this.focusedLine})`, 2500);
          }
          this.startMindInlineEdit();
          return false;
        }),
      );
      this.keymapHandlers.push(
        this.scope.register([], "Tab", () => {
          void this.insertChildFromKeyboard();
          return false;
        }),
      );
      this.keymapHandlers.push(
        this.scope.register([], "Enter", () => {
          void this.insertSiblingFromKeyboard();
          return false;
        }),
      );
    }

    this.registerEvent(
      this.app.vault.on("modify", (f) => {
        if (!(f instanceof TFile) || !this.file || f.path !== this.file.path) return;
        if (this.ignoreNextModify) {
          this.ignoreNextModify = false;
          return;
        }
        void this.reloadFromDisk();
      }),
    );

    this.resizeObs = new ResizeObserver(() => {
      this.scheduleMindRefit();
    });
    this.resizeObs.observe(this.mapCanvas);

    this.viewContentResizeObs = new ResizeObserver(() => this.scheduleMindRefit());
    const viewContent = this.containerEl.closest(".view-content");
    if (viewContent instanceof HTMLElement) {
      this.viewContentResizeObs.observe(viewContent);
    }
    const leafContent = this.containerEl.closest(".workspace-leaf-content");
    if (leafContent instanceof HTMLElement) {
      this.viewContentResizeObs.observe(leafContent);
    }

    this.registerEvent(
      this.app.workspace.on("layout-change", () => {
        this.scheduleMindRefit();
      }),
    );
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () => {
        if (this.app.workspace.activeLeaf !== this.leaf) return;
        this.scheduleMindRefit();
      }),
    );

    requestAnimationFrame(() => {
      this.coerceViewContentHeight();
      this.syncPaneFillHeight();
      requestAnimationFrame(() => {
        this.scheduleMindRefit();
        if (ZMIND_DEBUG_LAYOUT) {
          window.setTimeout(() => this.debugToastLayoutRects(), 700);
        }
      });
    });

    const path =
      this.queuedPath ?? (this.leaf.getViewState().state as { file?: string } | undefined)?.file;
    this.queuedPath = null;
    if (typeof path === "string" && path) {
      const af = this.app.vault.getAbstractFileByPath(path);
      if (af instanceof TFile) await this.setFile(af);
    }
  }

  private injectMindElixirCss() {
    if (document.getElementById(CSS_INJECT_ID)) return;
    const style = document.createElement("style");
    style.id = CSS_INJECT_ID;
    style.textContent = mindElixirCss;
    document.head.appendChild(style);
  }

  /** Theme Mind Elixir selection color to Obsidian accent (native `.selected` outline). */
  private applyMindThemeVars() {
    const accent =
      getComputedStyle(this.containerEl).getPropertyValue("--interactive-accent").trim() ||
      getComputedStyle(document.body).getPropertyValue("--interactive-accent").trim() ||
      "#705dcf";
    this.mapCanvas.style.setProperty("--selected", accent);
    this.mapCanvas.style.setProperty("--accent-color", accent);
  }

  /** Walk ancestors only — `workspace-leaf.querySelector(".view-content")` can hit another tab/pane. */
  private findViewContentEl(): HTMLElement | null {
    let el: HTMLElement | null = this.containerEl;
    for (let i = 0; i < 40 && el; i++) {
      if (el.classList.contains("view-content")) return el;
      el = el.parentElement;
    }
    return null;
  }

  private coerceViewContentHeight() {
    let el: HTMLElement | null = this.containerEl;
    for (let i = 0; i < 8 && el; i++) {
      if (el.classList.contains("view-content")) {
        el.style.flex = "1 1 0";
        el.style.minHeight = "0";
        el.style.height = "100%";
        el.style.maxHeight = "100%";
        el.style.display = "flex";
        el.style.flexDirection = "column";
        break;
      }
      el = el.parentElement;
    }
  }

  /**
   * Fill the pane height. Prefer `.workspace-leaf` minus `.view-header` — `.view-content` alone
   * often reports ~half height when the flex chain above it is wrong.
   */
  private syncPaneFillHeight() {
    const leaf = this.containerEl.closest(".workspace-leaf") as HTMLElement | null;
    const leafContent = this.containerEl.closest(".workspace-leaf-content") as HTMLElement | null;
    const vc = this.findViewContentEl();

    if (leafContent) {
      leafContent.style.display = "flex";
      leafContent.style.flexDirection = "column";
      leafContent.style.minHeight = "0";
      leafContent.style.flex = "1 1 auto";
    }
    if (vc) {
      vc.style.flex = "1 1 auto";
      vc.style.flexGrow = "1";
      vc.style.display = "flex";
      vc.style.flexDirection = "column";
      vc.style.alignSelf = "stretch";
      vc.style.minHeight = "0";
      vc.style.height = "100%";
      vc.style.maxHeight = "none";
    }
    this.containerEl.style.flex = "1 1 auto";
    this.containerEl.style.minHeight = "0";
    this.containerEl.style.height = "100%";
    this.containerEl.style.maxHeight = "none";
    this.mapHost.style.flex = "1 1 auto";
    this.mapHost.style.minHeight = "0";
    const shell = this.mapHost.parentElement;
    if (shell?.classList.contains("zmind-shell")) {
      shell.style.flex = "1 1 auto";
      shell.style.minHeight = "0";
      shell.style.height = "100%";
      shell.style.maxHeight = "none";
    }
  }

  /**
   * Mind Elixir registers `dblclick` in bubble phase and only calls `beginEdit` when
   * `event.target` is `me-tpc`. Clicks on `span.text` etc. never open the editor.
   * Install capture on `this.mind.container` and use `editTopic` (same as Space shortcut).
   */
  private attachMindDblClickEditFix() {
    if (!this.mind || this.mindDblClickCleanup) return;
    const container = this.mind.container;
    const handler = (ev: Event) => {
      if (!(ev instanceof MouseEvent) || ev.type !== "dblclick") return;
      if (ev.altKey || ev.button !== 0) return;
      const raw = ev.target;
      if (!(raw instanceof HTMLElement)) return;
      const tpc = raw.closest("me-tpc") as Topic | null;
      if (!tpc?.nodeObj || !this.mind) return;
      ev.preventDefault();
      ev.stopImmediatePropagation();
      void this.app.workspace.setActiveLeaf(this.leaf);
      this.mapHost.focus({ preventScroll: true });
      this.syncFocusFromNodeObj(tpc.nodeObj);
      try {
        this.mind.selectNode(tpc);
        this.mind.editTopic(tpc);
      } catch {
        new Notice("Zmind: double-click edit failed.");
      }
    };
    container.addEventListener("dblclick", handler, true);
    this.mindDblClickCleanup = () => {
      container.removeEventListener("dblclick", handler, true);
    };
    this.register(() => {
      this.mindDblClickCleanup?.();
      this.mindDblClickCleanup = null;
    });
  }

  /** Mind Elixir mounts `.map-container` — force it to fill our pane. */
  private coerceMapContainerSize() {
    const mc = this.mapCanvas.querySelector(".map-container") as HTMLElement | null;
    if (!mc) return;
    mc.style.height = "100%";
    mc.style.width = "100%";
    mc.style.minHeight = "0";
    mc.style.boxSizing = "border-box";
  }

  /** Resolve markdown line from Mind Elixir node (`id` like `L12` or `metadata.line`). */
  private lineFromNodeObj(o: NodeObj | undefined): number | null {
    if (!o) return null;
    const meta = o.metadata as { line?: number } | undefined;
    if (meta != null && typeof meta.line === "number" && Number.isFinite(meta.line)) {
      return meta.line;
    }
    const id = o.id;
    if (typeof id === "string" && id.startsWith("L")) {
      const n = parseInt(id.slice(1), 10);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  }

  private syncFocusFromNodeObj(o: NodeObj | undefined) {
    const line = this.lineFromNodeObj(o);
    this.focusedLine = line;
    this.hintEl.toggleClass("zmind-hint--active", line != null);
  }

  async onClose() {
    for (const h of this.keymapHandlers) {
      try {
        this.scope?.unregister(h);
      } catch {
        /* noop */
      }
    }
    this.keymapHandlers = [];
    this.resizeObs?.disconnect();
    this.resizeObs = null;
    this.viewContentResizeObs?.disconnect();
    this.viewContentResizeObs = null;
    try {
      this.mindDblClickCleanup?.();
      this.mindDblClickCleanup = null;
      this.mind?.destroy();
    } catch {
      /* noop */
    }
    this.mind = null;
    this.containerEl.empty();
    this.containerEl.closest(".workspace-leaf")?.classList.remove("zmind-workspace-leaf");
  }

  getState(): Record<string, unknown> {
    return { file: this.file?.path ?? "" };
  }

  async setState(state: unknown, result: ViewStateResult): Promise<void> {
    await super.setState(state, result);
    const p = typeof state === "object" && state && "file" in state ? (state as { file?: string }).file : undefined;
    if (typeof p !== "string" || !p) return;
    this.queuedPath = p;
    if (!this.mapHost) return;
    const af = this.app.vault.getAbstractFileByPath(p);
    if (af instanceof TFile) await this.setFile(af);
    this.queuedPath = null;
  }

  async setFile(file: TFile) {
    this.file = file;
    await this.reloadFromDisk();
  }

  private async reloadFromDisk() {
    if (!this.file) return;
    try {
      this.baseline = await readBaseline(this.app.vault, this.file);
    } catch {
      new Notice("Could not read file for Zmind.");
      return;
    }
    await this.renderMind(this.baseline.content);
    requestAnimationFrame(() => {
      this.coerceViewContentHeight();
      this.scheduleMindRefit();
    });
  }

  private async renderMind(content: string) {
    if (!this.file) return;
    this.injectMindElixirCss();
    this.applyMindThemeVars();

    const data = markdownToMindElixirData(content, this.file.basename);
    const isDark = document.body.classList.contains("theme-dark");

    if (!this.mind) {
      this.mind = new MindElixir({
        el: this.mapCanvas,
        direction: RIGHT,
        /** Center using the whole node bounding box — avoids “graph stuck at bottom” with root-based origin. */
        alignment: "nodes",
        editable: true,
        toolBar: false,
        contextMenu: false,
        overflowHidden: true,
        allowUndo: false,
        theme: isDark ? DARK_THEME : THEME,
        markdown: (src) => topicMarkdownToHtml(src),
        /** Use Mind Elixir defaults (F2 = edit, arrows, etc.). Space → edit is handled by Obsidian Scope only. */
        before: {
          addChild: denyStructural,
          insertSibling: denyStructural,
          insertParent: denyStructural,
          removeNodes: denyStructural,
          moveUpNode: denyStructural,
          moveDownNode: denyStructural,
          moveNodeIn: denyStructural,
          moveNodeBefore: denyStructural,
          moveNodeAfter: denyStructural,
          copyNode: denyStructural,
          copyNodes: denyStructural,
          reshapeNode: denyStructural,
          rmSubline: denyStructural,
        },
      });

      this.mind.bus.addListener("selectNewNode", (nodeObj: NodeObj) => {
        void this.app.workspace.setActiveLeaf(this.leaf);
        this.syncFocusFromNodeObj(nodeObj);
        if (ZMIND_DEBUG_MIND_EVENTS) {
          new Notice(`Zmind bus: selectNewNode [${nodeObj.id}]`, 2500);
        }
      });
      this.mind.bus.addListener("selectNodes", (objs: NodeObj[]) => {
        void this.app.workspace.setActiveLeaf(this.leaf);
        this.syncFocusFromNodeObj(objs[0]);
        if (ZMIND_DEBUG_MIND_EVENTS && objs[0]) {
          new Notice(`Zmind bus: selectNodes [${objs.map((o) => o.id).join(", ")}]`, 2500);
        }
      });
      this.mind.bus.addListener("operation", (info) => {
        if (info.name !== "finishEdit") return;
        void this.persistInlineEdit(info.obj, info.origin);
      });

      this.attachMindDebugBus();

      this.mind.init(data);
      this.attachMindDblClickEditFix();
    } else {
      this.mind.refresh(data);
    }

    /** Height + Mind Elixir measure must settle first — otherwise `scaleFit`/`toCenter` use stale box and the map sits low. */
    this.scheduleMindRefit();
  }

  /** Run after layout so Mind Elixir reads correct container size (fixes “full pane but map only at bottom”). */
  private scheduleMindRefit() {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.syncPaneFillHeight();
        if (!this.mind) return;
        this.coerceMapContainerSize();
        try {
          this.mind.layout?.();
        } catch {
          /* noop */
        }
        this.mind.scaleFit();
        this.mind.toCenter?.();
        try {
          /** ME `init` runs `linkDiv` after layout; refit must redraw SVG paths after `scaleFit`/`toCenter`. */
          this.mind.linkDiv?.();
        } catch {
          /* noop */
        }
      });
    });
  }

  /** One compact toast with measured heights — helps confirm “half pane” vs bad translate. */
  private debugToastLayoutRects() {
    const vc = this.findViewContentEl();
    const leaf = this.containerEl.closest(".workspace-leaf") as HTMLElement | null;
    const leafContent = this.containerEl.closest(".workspace-leaf-content") as HTMLElement | null;
    const mc = this.mapCanvas.querySelector(".map-container") as HTMLElement | null;
    const parts = [
      `root ${Math.round(this.containerEl.getBoundingClientRect().height)}px`,
      vc ? `view-content ${Math.round(vc.getBoundingClientRect().height)}px` : "no vc",
      leafContent ? `leaf-content ${Math.round(leafContent.getBoundingClientRect().height)}px` : "no leaf-content",
      `host ${Math.round(this.mapHost.getBoundingClientRect().height)}px`,
      `canvas ${Math.round(this.mapCanvas.getBoundingClientRect().height)}px`,
      mc ? `map-container ${Math.round(mc.getBoundingClientRect().height)}px` : "no .map-container",
      leaf ? `leaf ${Math.round(leaf.getBoundingClientRect().height)}px` : "",
    ].filter(Boolean);
    new Notice(`Zmind layout: ${parts.join(" · ")}`, 4500);
  }

  private attachMindDebugBus() {
    if (!this.mind || !ZMIND_DEBUG_MIND_EVENTS) return;

    this.mind.bus.addListener("operation", (info) => {
      const id =
        "obj" in info && info.obj && typeof (info.obj as NodeObj).id === "string"
          ? (info.obj as NodeObj).id
          : "";
      const extra =
        info.name === "finishEdit" && "origin" in info
          ? ` ← "${String((info as { origin?: string }).origin ?? "").slice(0, 40)}"`
          : "";
      new Notice(`Zmind op: ${info.name}${id ? ` [${id}]` : ""}${extra}`, 4000);
    });

    this.mind.bus.addListener("scale", (s: number) => {
      const now = Date.now();
      if (now - this.mindDebugLast.scale < ZMIND_DEBUG_THROTTLE_MS) return;
      this.mindDebugLast.scale = now;
      new Notice(`Zmind bus: scale ${s.toFixed(4)}`, 2000);
    });

    this.mind.bus.addListener("move", (d: { dx: number; dy: number }) => {
      const now = Date.now();
      if (now - this.mindDebugLast.move < ZMIND_DEBUG_THROTTLE_MS) return;
      this.mindDebugLast.move = now;
      new Notice(`Zmind bus: move dx=${d.dx.toFixed(0)} dy=${d.dy.toFixed(0)}`, 2000);
    });

    this.mind.bus.addListener("linkDiv", () => {
      const now = Date.now();
      if (now - this.mindDebugLast.linkDiv < ZMIND_DEBUG_THROTTLE_MS * 3) return;
      this.mindDebugLast.linkDiv = now;
      new Notice("Zmind bus: linkDiv", 1500);
    });

    this.mind.bus.addListener("expandNode", (nodeObj: NodeObj) => {
      new Notice(`Zmind bus: expandNode [${nodeObj.id}]`, 2500);
    });

    this.mind.bus.addListener("changeDirection", (dir: number) => {
      new Notice(`Zmind bus: changeDirection ${dir}`, 2500);
    });
  }

  /**
   * Mind Elixir inline edit = `editTopic` (creates `#input-box`). `beginEdit` only delegates here
   * unless `dangerouslySetInnerHTML` is set on the node.
   */
  private startMindInlineEdit() {
    if (!this.mind || !this.file || this.focusedLine == null) return;
    void this.app.workspace.setActiveLeaf(this.leaf);
    this.mapHost.focus({ preventScroll: true });
    try {
      const tpc = this.mind.findEle(`L${this.focusedLine}`);
      if (!tpc) {
        new Notice("Could not find this node — try clicking it again.");
        return;
      }
      this.mind.selectNode(tpc);
      this.syncFocusFromNodeObj(tpc.nodeObj);
      this.mind.editTopic(tpc);
    } catch {
      new Notice("Could not start edit for this node.");
    }
  }

  /** Sync Mind Elixir `finishEdit` into the Markdown file (safe single-line replace). */
  private async persistInlineEdit(obj: NodeObj, _previousTopic: string) {
    if (!this.file || !this.baseline) return;
    const line = this.lineFromNodeObj(obj);
    if (line == null) return;
    const id = obj.id;
    if (id === "zm-root" || id === "zm-empty") return;

    const lines = this.baseline.content.split(/\r?\n/);
    const raw = lines[line];
    if (raw == null) return;

    const nextText = (obj.topic ?? "").trimEnd();
    const lv = headingLevelFromLine(raw);
    let newLine: string | null = null;
    if (lv != null) {
      newLine = buildHeadingLine(lv, nextText, raw);
    } else {
      newLine = replaceListLineBody(raw, nextText);
    }
    if (newLine == null || newLine === raw) return;

    const res = await safeReplaceLine(this.app.vault, this.file, this.baseline, line, raw, newLine);
    if (!res.ok) {
      new Notice(res.reason);
      await this.reloadFromDisk();
      return;
    }
    this.ignoreNextModify = true;
    this.baseline = res.next;
    await this.renderMind(this.baseline.content);
    this.selectMindNodeByLine(line);
  }

  private selectMindNodeByLine(line: number) {
    if (!this.mind) return;
    try {
      const el = this.mind.findEle(`L${line}`);
      if (el) this.mind.selectNode(el);
    } catch {
      /* noop */
    }
  }

  private pickAnchorLineForKeyboard(): number | null {
    if (this.focusedLine != null) return this.focusedLine;
    const tree = this.baseline ? parseAtxHeadingTree(this.baseline.content) : null;
    const first = tree ? flattenOutline(tree)[0] : undefined;
    return first?.line ?? null;
  }

  private async insertChildFromKeyboard() {
    if (!this.file || !this.baseline) return;
    const lines = this.baseline.content.split(/\r?\n/);
    const anchor = this.pickAnchorLineForKeyboard();

    if (anchor == null) {
      const content = ensureLeadingHeading(this.baseline.content, "New node");
      const res = await safeApplyContent(this.app.vault, this.file, this.baseline, content);
      if (!res.ok) {
        new Notice(res.reason);
        await this.reloadFromDisk();
        return;
      }
      this.finishWrite(res.next, 0);
      return;
    }

    const { lines: nextLines, newHeadingLine } = insertChildHeadingLines(lines, anchor, "New node");
    const nextContent = nextLines.join("\n");
    const res = await safeApplyContent(this.app.vault, this.file, this.baseline, nextContent);
    if (!res.ok) {
      new Notice(res.reason);
      await this.reloadFromDisk();
      return;
    }
    this.finishWrite(res.next, newHeadingLine);
  }

  private async insertSiblingFromKeyboard() {
    if (!this.file || !this.baseline) return;
    const lines = this.baseline.content.split(/\r?\n/);
    const anchor = this.pickAnchorLineForKeyboard();

    if (anchor == null) {
      const content = ensureLeadingHeading(this.baseline.content, "New node");
      const res = await safeApplyContent(this.app.vault, this.file, this.baseline, content);
      if (!res.ok) {
        new Notice(res.reason);
        await this.reloadFromDisk();
        return;
      }
      this.finishWrite(res.next, 0);
      return;
    }

    if (headingLevelFromLine(lines[anchor]) == null) return;

    const { lines: nextLines, newHeadingLine } = insertSiblingHeadingLines(lines, anchor, "New node");
    const nextContent = nextLines.join("\n");
    const res = await safeApplyContent(this.app.vault, this.file, this.baseline, nextContent);
    if (!res.ok) {
      new Notice(res.reason);
      await this.reloadFromDisk();
      return;
    }
    this.finishWrite(res.next, newHeadingLine);
  }

  private finishWrite(next: ContentBaseline, newHeadingLine: number) {
    this.ignoreNextModify = true;
    this.baseline = next;
    void this.renderMind(this.baseline.content).then(() => {
      this.selectMindNodeByLine(newHeadingLine);
    });
  }
}
