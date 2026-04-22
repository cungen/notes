import {
  App,
  ItemView,
  Notice,
  Plugin,
  setIcon,
  TAbstractFile,
  TFile,
  TFolder,
  WorkspaceLeaf,
} from "obsidian";

const MEMOS_VIEW_TYPE = "memos-view";
const MEMOS_DIR = "content/Memos";
const BASE_TAG = "memo";

type Memo = {
  path: string;
  filename: string;
  title?: string;
  tags: string[];
  content: string;
  createdAt: string;
  updatedAt: string;
};

type MemoPayload = {
  title?: string;
  content: string;
  tags: string[];
};

type MemoStats = {
  total: number;
  today: number;
  month: number;
  byTag: Map<string, number>;
  byDay: Map<string, number>;
};

class MemoStore {
  constructor(private app: App) {}

  async ensureFolder(): Promise<void> {
    const folder = this.app.vault.getAbstractFileByPath(MEMOS_DIR);
    if (!folder) {
      await this.app.vault.createFolder(MEMOS_DIR);
    }
  }

  private walkFiles(root: TAbstractFile, out: TFile[]): void {
    if (root instanceof TFile && root.extension === "md") {
      out.push(root);
      return;
    }
    if (root instanceof TFolder) {
      for (const child of root.children) {
        this.walkFiles(child, out);
      }
    }
  }

  private allMemoFiles(): TFile[] {
    const folder = this.app.vault.getAbstractFileByPath(MEMOS_DIR);
    if (!(folder instanceof TFolder)) return [];
    const files: TFile[] = [];
    this.walkFiles(folder, files);
    return files.sort((a, b) => b.basename.localeCompare(a.basename));
  }

  private parse(content: string, file: TFile): Memo {
    const { frontmatter, body } = parseFrontmatter(content);
    const tags = normalizeTags(frontmatter.tags);
    if (!tags.includes(BASE_TAG)) {
      tags.unshift(BASE_TAG);
    }
    const createdAt =
      toIsoString(frontmatter.createdAt) ??
      new Date(file.stat.ctime ?? Date.now()).toISOString();
    const updatedAt =
      toIsoString(frontmatter.updatedAt) ??
      new Date(file.stat.mtime ?? file.stat.ctime ?? Date.now()).toISOString();
    const title = typeof frontmatter.title === "string" ? frontmatter.title.trim() : undefined;
    return {
      path: file.path,
      filename: file.basename,
      title: title || undefined,
      tags,
      content: body.trim(),
      createdAt,
      updatedAt,
    };
  }

  async list(): Promise<Memo[]> {
    await this.ensureFolder();
    const files = this.allMemoFiles();
    const memos: Memo[] = [];
    for (const file of files) {
      const raw = await this.app.vault.read(file);
      memos.push(this.parse(raw, file));
    }
    return memos.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async create(payload: MemoPayload): Promise<Memo> {
    await this.ensureFolder();
    const now = new Date();
    const createdAt = now.toISOString();
    const updatedAt = createdAt;
    const filename = formatFileName(now);
    const path = `${MEMOS_DIR}/${filename}.md`;
    const resolvedTitle = payload.title?.trim() || filename;
    const tags = normalizeTags(payload.tags);
    if (!tags.includes(BASE_TAG)) tags.unshift(BASE_TAG);
    const frontmatter = {
      title: resolvedTitle,
      tags,
      createdAt,
      updatedAt,
    };
    const fileContent = stringifyMemo(frontmatter, payload.content);
    const file = await this.app.vault.create(path, fileContent);
    const raw = await this.app.vault.read(file);
    return this.parse(raw, file);
  }

  async update(path: string, payload: MemoPayload): Promise<Memo> {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (!(file instanceof TFile)) {
      throw new Error("Memo file not found");
    }
    const existing = this.parse(await this.app.vault.read(file), file);
    const tags = normalizeTags(payload.tags);
    if (!tags.includes(BASE_TAG)) tags.unshift(BASE_TAG);
    const fallbackTitle = file.basename;
    const updated = {
      title: payload.title?.trim() || fallbackTitle,
      tags,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };
    await this.app.vault.modify(file, stringifyMemo(updated, payload.content));
    return this.parse(await this.app.vault.read(file), file);
  }

  async delete(path: string): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (!(file instanceof TFile)) {
      throw new Error("Memo file not found");
    }
    await this.app.vault.delete(file, true);
  }
}

class MemosView extends ItemView {
  private store: MemoStore;
  private memos: Memo[] = [];
  private activeTag: string | null = null;
  private activeDay: string | null = null;
  private activeMemoPath: string | null = null;
  private editingPath: string | null = null;
  private calendarCursor = startOfMonth(new Date());

  private titleInput!: HTMLInputElement;
  private tagsInput!: HTMLInputElement;
  private contentInput!: HTMLTextAreaElement;
  private submitButton!: HTMLButtonElement;
  private cancelEditButton!: HTMLButtonElement;
  private filterHint!: HTMLDivElement;
  private calendarHost!: HTMLDivElement;
  private statsHost!: HTMLDivElement;
  private tagsHost!: HTMLDivElement;
  private listHost!: HTMLDivElement;

  constructor(leaf: WorkspaceLeaf, app: App) {
    super(leaf);
    this.store = new MemoStore(app);
  }

  getViewType(): string {
    return MEMOS_VIEW_TYPE;
  }

  getDisplayText(): string {
    return "Memos";
  }

  getIcon(): string {
    return "calendar-check";
  }

  async onOpen(): Promise<void> {
    this.containerEl.empty();
    this.containerEl.addClass("memos-view-root");
    this.renderSkeleton();
    await this.reload();
  }

  async reload(): Promise<void> {
    this.memos = await this.store.list();
    this.renderSidebar();
    this.renderList();
    this.renderFilterHint();
  }

  private renderSkeleton(): void {
    const wrapper = this.containerEl.createDiv({ cls: "memos-layout" });
    const sidebar = wrapper.createDiv({ cls: "memos-sidebar" });
    const content = wrapper.createDiv({ cls: "memos-content" });

    sidebar.createEl("h3", { text: "Memos" });
    this.calendarHost = sidebar.createDiv({ cls: "memos-calendar" });
    this.statsHost = sidebar.createDiv({ cls: "memos-stats" });
    this.tagsHost = sidebar.createDiv({ cls: "memos-tag-cloud" });

    const composer = content.createDiv({ cls: "memos-composer" });
    composer.createEl("h3", { text: "Quick Publish" });

    this.titleInput = composer.createEl("input", {
      type: "text",
      placeholder: "Title (optional)",
    });
    this.titleInput.addClass("memos-input");

    this.tagsInput = composer.createEl("input", {
      type: "text",
      placeholder: "Tags (comma separated)",
    });
    this.tagsInput.addClass("memos-input");

    this.contentInput = composer.createEl("textarea", {
      placeholder: "Write your memo...",
    });
    this.contentInput.addClass("memos-textarea");

    const composerActions = composer.createDiv({ cls: "memos-composer-actions" });
    this.submitButton = composerActions.createEl("button", {
      text: "Publish",
      cls: "mod-cta",
      attr: { type: "button" },
    });
    this.submitButton.addEventListener("click", () => {
      void this.handlePublish();
    });
    this.cancelEditButton = composerActions.createEl("button", {
      text: "Cancel edit",
      cls: "memos-cancel-edit",
      attr: { type: "button" },
    });
    this.cancelEditButton.addEventListener("click", () => {
      this.resetComposer();
    });
    this.cancelEditButton.hide();

    this.filterHint = content.createDiv({ cls: "memos-filter-hint" });
    this.listHost = content.createDiv({ cls: "memos-list" });
  }

  private collectStats(memos: Memo[]): MemoStats {
    const now = new Date();
    const nowDay = dayKey(now);
    const nowMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const byTag = new Map<string, number>();
    const byDay = new Map<string, number>();
    let today = 0;
    let month = 0;

    for (const memo of memos) {
      const memoDate = new Date(memo.createdAt);
      const memoDay = dayKey(memoDate);
      const memoMonth = `${memoDate.getFullYear()}-${String(memoDate.getMonth() + 1).padStart(2, "0")}`;
      if (memoDay === nowDay) today += 1;
      if (memoMonth === nowMonth) month += 1;
      byDay.set(memoDay, (byDay.get(memoDay) ?? 0) + 1);
      for (const tag of memo.tags) {
        byTag.set(tag, (byTag.get(tag) ?? 0) + 1);
      }
    }

    return {
      total: memos.length,
      today,
      month,
      byTag,
      byDay,
    };
  }

  private renderSidebar(): void {
    const stats = this.collectStats(this.memos);
    this.renderCalendar(stats.byDay);
    this.renderStats(stats);
    this.renderTagCloud(stats.byTag);
  }

  private renderCalendar(byDay: Map<string, number>): void {
    this.calendarHost.empty();
    const header = this.calendarHost.createDiv({ cls: "memos-calendar-header" });
    const navLeft = header.createEl("button", { cls: "memos-calendar-nav", text: "‹" });
    navLeft.addEventListener("click", () => {
      this.calendarCursor = shiftMonth(this.calendarCursor, -1);
      this.renderCalendar(byDay);
    });

    const title = header.createDiv({ cls: "memos-calendar-title" });
    title.createEl("span", { text: String(this.calendarCursor.getFullYear()) });
    title.createEl("span", { text: String(this.calendarCursor.getMonth() + 1).padStart(2, "0") });

    const navRight = header.createEl("button", { cls: "memos-calendar-nav", text: "›" });
    navRight.addEventListener("click", () => {
      this.calendarCursor = shiftMonth(this.calendarCursor, 1);
      this.renderCalendar(byDay);
    });

    const labels = this.calendarHost.createDiv({ cls: "memos-calendar-row labels" });
    labels.createDiv({ cls: "memos-week-label", text: "W" });
    ["一", "二", "三", "四", "五", "六", "日"].forEach((d) =>
      labels.createEl("span", { text: d }),
    );

    const weeks = buildMonthGrid(this.calendarCursor);
    const visibleKeys = weeks.flatMap((w) => w.days.map((day) => dayKey(day)));
    const maxCount = Math.max(
      1,
      ...visibleKeys.map((key) => byDay.get(key) ?? 0),
    );

    for (const week of weeks) {
      const row = this.calendarHost.createDiv({ cls: "memos-calendar-row" });
      row.createDiv({ cls: "memos-week-label", text: isoWeekLabel(week.days[0]) });
      for (const day of week.days) {
        const key = dayKey(day);
        const count = byDay.get(key) ?? 0;
        const intensity = Math.min(4, Math.ceil((count / maxCount) * 4));
        const isCurrentMonth = day.getMonth() === this.calendarCursor.getMonth();
        const cell = row.createEl("button", {
          cls: `memos-calendar-cell level-${count === 0 ? 0 : intensity}`,
        });
        cell.type = "button";
        cell.ariaLabel = `${key}: ${count} memos`;
        if (!isCurrentMonth) cell.addClass("outside-month");
        if (dayKey(new Date()) === key) cell.addClass("today");
        if (this.activeDay === key) cell.addClass("active");
        cell.createSpan({ cls: "memos-calendar-day", text: String(day.getDate()) });
        if (count > 0) {
          cell.createSpan({ cls: "memos-calendar-count", text: String(count) });
        }
        cell.addClass("clickable");
        cell.addEventListener("click", () => {
          this.activeDay = this.activeDay === key ? null : key;
          this.activeTag = null;
          this.renderList();
          this.renderFilterHint();
          this.renderCalendar(byDay);
          this.renderTagCloud(this.collectStats(this.memos).byTag);
        });
      }
    }

    const legend = this.calendarHost.createDiv({ cls: "memos-calendar-legend" });
    legend.createSpan({ text: "Less" });
    for (let level = 0; level <= 4; level += 1) {
      legend.createSpan({ cls: `memos-legend-dot level-${level}` });
    }
    legend.createSpan({ text: "More" });
  }

  private renderStats(stats: MemoStats): void {
    this.statsHost.empty();
    const cards = [
      { label: "Total", value: stats.total },
      { label: "Today", value: stats.today },
      { label: "This Month", value: stats.month },
    ];
    for (const card of cards) {
      const item = this.statsHost.createDiv({ cls: "memos-stat-card" });
      item.createDiv({ text: card.label, cls: "memos-stat-label" });
      item.createDiv({ text: String(card.value), cls: "memos-stat-value" });
    }
  }

  private renderTagCloud(byTag: Map<string, number>): void {
    this.tagsHost.empty();
    this.tagsHost.createEl("h4", { text: "Tags" });
    const sorted = Array.from(byTag.entries()).sort((a, b) => b[1] - a[1]);
    if (sorted.length === 0) {
      this.tagsHost.createDiv({ text: "No tags yet", cls: "memos-empty" });
      return;
    }
    const wrap = this.tagsHost.createDiv({ cls: "memos-tag-wrap" });
    for (const [tag, count] of sorted) {
      const chip = wrap.createEl("button", {
        text: `#${tag} ${count}`,
        cls: "memos-tag-chip",
      });
      if (this.activeTag === tag) chip.addClass("active");
      chip.addEventListener("click", () => {
        this.activeTag = this.activeTag === tag ? null : tag;
        this.activeDay = null;
        this.renderTagCloud(byTag);
        this.renderList();
        this.renderFilterHint();
      });
    }
  }

  private filteredMemos(): Memo[] {
    return this.memos.filter((memo) => {
      if (this.activeTag && !memo.tags.includes(this.activeTag)) return false;
      if (this.activeDay && dayKey(new Date(memo.createdAt)) !== this.activeDay) return false;
      return true;
    });
  }

  private renderFilterHint(): void {
    this.filterHint.empty();
    const labels: string[] = [];
    if (this.activeTag) labels.push(`tag: #${this.activeTag}`);
    if (this.activeDay) labels.push(`day: ${this.activeDay}`);
    if (labels.length === 0) return;
    this.filterHint.createSpan({ text: `Filtered by ${labels.join(", ")}` });
    const clear = this.filterHint.createEl("button", { text: "Clear" });
    clear.addEventListener("click", () => {
      this.activeTag = null;
      this.activeDay = null;
      this.renderSidebar();
      this.renderList();
      this.renderFilterHint();
    });
  }

  private renderList(): void {
    this.listHost.empty();
    const memos = this.filteredMemos();
    if (this.activeMemoPath && !memos.some((memo) => memo.path === this.activeMemoPath)) {
      this.activeMemoPath = null;
    }
    if (memos.length === 0) {
      this.listHost.createDiv({ cls: "memos-empty", text: "No memos found." });
      return;
    }
    for (const memo of memos) {
      const item = this.listHost.createDiv({ cls: "memos-item" });
      item.tabIndex = 0;
      if (this.activeMemoPath === memo.path) item.addClass("active");
      item.addEventListener("click", () => {
        this.activeMemoPath = memo.path;
        this.renderList();
      });
      item.createEl("h4", { text: memo.title || "Untitled memo" });

      const tagRow = item.createDiv({ cls: "memos-item-tags" });
      memo.tags.forEach((tag) => {
        tagRow.createSpan({ text: `#${tag}` });
      });

      if (memo.content) {
        item.createDiv({
          cls: "memos-item-content",
          text: memo.content.slice(0, 200),
        });
      }

      const footer = item.createDiv({ cls: "memos-item-footer" });
      footer.createSpan({ text: formatDateTime(memo.createdAt) });

      const actions = footer.createDiv({ cls: "memos-item-actions" });

      const copyBtn = actions.createEl("span", {
        cls: "memos-icon-btn",
        attr: { "aria-label": "Copy memo", role: "button", tabindex: "0" },
      });
      setIcon(copyBtn, "copy");
      const onCopy = async (evt: Event) => {
        evt.stopPropagation();
        this.activeMemoPath = memo.path;
        await navigator.clipboard.writeText(memo.content);
        new Notice("Memo copied");
        this.renderList();
      };
      copyBtn.addEventListener("click", onCopy);
      copyBtn.addEventListener("keydown", (evt) => {
        if (evt.key === "Enter" || evt.key === " ") {
          evt.preventDefault();
          void onCopy(evt);
        }
      });

      const editBtn = actions.createEl("span", {
        cls: "memos-icon-btn",
        attr: { "aria-label": "Edit memo", role: "button", tabindex: "0" },
      });
      setIcon(editBtn, "pencil");
      const onEdit = (evt: Event) => {
        evt.stopPropagation();
        this.activeMemoPath = memo.path;
        this.editingPath = memo.path;
        this.titleInput.value = memo.title ?? "";
        this.tagsInput.value = memo.tags.filter((x) => x !== BASE_TAG).join(", ");
        this.contentInput.value = memo.content;
        this.submitButton.textContent = "Update";
        this.cancelEditButton.show();
        this.renderList();
      };
      editBtn.addEventListener("click", onEdit);
      editBtn.addEventListener("keydown", (evt) => {
        if (evt.key === "Enter" || evt.key === " ") {
          evt.preventDefault();
          onEdit(evt);
        }
      });

      const deleteBtn = actions.createEl("span", {
        cls: "memos-icon-btn danger",
        attr: { "aria-label": "Delete memo", role: "button", tabindex: "0" },
      });
      setIcon(deleteBtn, "trash-2");
      const onDelete = async (evt: Event) => {
        evt.stopPropagation();
        this.activeMemoPath = memo.path;
        if (!window.confirm("Delete this memo?")) return;
        await this.store.delete(memo.path);
        if (this.editingPath === memo.path) {
          this.resetComposer();
        }
        await this.reload();
        new Notice("Memo deleted");
      };
      deleteBtn.addEventListener("click", onDelete);
      deleteBtn.addEventListener("keydown", (evt) => {
        if (evt.key === "Enter" || evt.key === " ") {
          evt.preventDefault();
          void onDelete(evt);
        }
      });
    }
  }

  private async handlePublish(): Promise<void> {
    const content = this.contentInput.value.trim();
    if (!content) {
      new Notice("Memo content is required");
      return;
    }
    const tags = parseTagInput(this.tagsInput.value);
    const payload: MemoPayload = {
      title: this.titleInput.value.trim() || undefined,
      content,
      tags,
    };
    if (this.editingPath) {
      await this.store.update(this.editingPath, payload);
      new Notice("Memo updated");
    } else {
      await this.store.create(payload);
      new Notice("Memo published");
    }
    this.resetComposer();
    await this.reload();
  }

  private resetComposer(): void {
    this.editingPath = null;
    this.titleInput.value = "";
    this.tagsInput.value = "";
    this.contentInput.value = "";
    this.submitButton.textContent = "Publish";
    this.cancelEditButton.hide();
  }
}

export default class MemosPlugin extends Plugin {
  async onload(): Promise<void> {
    this.registerView(
      MEMOS_VIEW_TYPE,
      (leaf) => new MemosView(leaf, this.app),
    );

    this.addRibbonIcon("scroll-text", "Open Memos", () => {
      void this.activateView();
    });

    this.addCommand({
      id: "open-memos-view",
      name: "Open Memos view",
      callback: () => void this.activateView(),
    });
  }

  async onunload(): Promise<void> {
    this.app.workspace.detachLeavesOfType(MEMOS_VIEW_TYPE);
  }

  private async activateView(): Promise<void> {
    const leaves = this.app.workspace.getLeavesOfType(MEMOS_VIEW_TYPE);
    if (leaves.length > 0) {
      await this.app.workspace.revealLeaf(leaves[0]);
      return;
    }
    const leaf = this.app.workspace.getLeaf(true);
    await leaf.setViewState({ type: MEMOS_VIEW_TYPE, active: true });
    await this.app.workspace.revealLeaf(leaf);
  }
}

function parseFrontmatter(raw: string): { frontmatter: Record<string, unknown>; body: string } {
  if (!raw.startsWith("---\n")) {
    return { frontmatter: {}, body: raw };
  }
  const end = raw.indexOf("\n---", 4);
  if (end < 0) {
    return { frontmatter: {}, body: raw };
  }
  const block = raw.slice(4, end).trim();
  const body = raw.slice(end + 4).trimStart();
  const frontmatter: Record<string, unknown> = {};

  let currentArrayKey: string | null = null;
  for (const line of block.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("- ") && currentArrayKey) {
      const arr = frontmatter[currentArrayKey];
      if (Array.isArray(arr)) arr.push(trimmed.slice(2).trim());
      continue;
    }
    const idx = line.indexOf(":");
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (value === "") {
      frontmatter[key] = [];
      currentArrayKey = key;
      continue;
    }
    currentArrayKey = null;
    if (value.startsWith("[") && value.endsWith("]")) {
      frontmatter[key] = value
        .slice(1, -1)
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
      continue;
    }
    frontmatter[key] = stripQuotes(value);
  }
  return { frontmatter, body };
}

function stringifyMemo(
  frontmatter: { title?: string; tags: string[]; createdAt: string; updatedAt: string },
  body: string,
): string {
  const lines: string[] = ["---"];
  if (frontmatter.title) {
    lines.push(`title: ${escapeYaml(frontmatter.title)}`);
  }
  lines.push("tags:");
  for (const tag of frontmatter.tags) {
    lines.push(`  - ${tag}`);
  }
  lines.push(`createdAt: ${frontmatter.createdAt}`);
  lines.push(`updatedAt: ${frontmatter.updatedAt}`);
  lines.push("---", "", body.trim(), "");
  return lines.join("\n");
}

function normalizeTags(input: unknown): string[] {
  const out = new Set<string>();
  if (Array.isArray(input)) {
    input.forEach((tag) => {
      if (typeof tag === "string" && tag.trim()) out.add(cleanTag(tag));
    });
  } else if (typeof input === "string" && input.trim()) {
    input.split(",").forEach((tag) => {
      if (tag.trim()) out.add(cleanTag(tag));
    });
  }
  return Array.from(out).filter(Boolean);
}

function parseTagInput(value: string): string[] {
  return normalizeTags(value);
}

function cleanTag(tag: string): string {
  return tag.trim().replace(/^#/, "").replace(/\s+/g, "-").toLowerCase();
}

function toIsoString(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const d = new Date(v);
  return Number.isNaN(d.valueOf()) ? null : d.toISOString();
}

function dayKey(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatFileName(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${y}${m}${day}_${hh}${mm}${ss}`;
}

function formatDateTime(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.valueOf())) return value;
  return d.toLocaleString();
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function shiftMonth(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function buildMonthGrid(monthDate: Date): Array<{ days: Date[] }> {
  const first = startOfMonth(monthDate);
  const month = first.getMonth();
  const start = startOfWeekMonday(first);
  const weeks: Array<{ days: Date[] }> = [];

  let cursor = new Date(start);
  for (;;) {
    const days: Date[] = [];
    for (let i = 0; i < 7; i += 1) {
      days.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push({ days });
    const reachedNextMonth = days.some((d) => d.getMonth() !== month) && cursor.getMonth() !== month;
    if (weeks.length >= 5 && reachedNextMonth) break;
    if (weeks.length >= 6) break;
  }
  return weeks;
}

function startOfWeekMonday(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + offset);
  result.setHours(0, 0, 0, 0);
  return result;
}

function isoWeekLabel(date: Date): string {
  const week = isoWeekNumber(date);
  return `W${week}`;
}

function isoWeekNumber(date: Date): number {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const firstDayNr = (firstThursday.getDay() + 6) % 7;
  firstThursday.setDate(firstThursday.getDate() - firstDayNr + 3);
  const diff = target.getTime() - firstThursday.getTime();
  return 1 + Math.round(diff / 604800000);
}

function escapeYaml(text: string): string {
  if (/[:#[\]{},"'`]/.test(text)) {
    return JSON.stringify(text);
  }
  return text;
}

function stripQuotes(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith("\"") && trimmed.endsWith("\"")) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}
