"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// main.ts
var main_exports = {};
__export(main_exports, {
  default: () => MemosPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");
var MEMOS_VIEW_TYPE = "memos-view";
var MEMOS_DIR = "content/Memos";
var BASE_TAG = "memo";
var MemoStore = class {
  constructor(app) {
    this.app = app;
  }
  async ensureFolder() {
    const folder = this.app.vault.getAbstractFileByPath(MEMOS_DIR);
    if (!folder) {
      await this.app.vault.createFolder(MEMOS_DIR);
    }
  }
  walkFiles(root, out) {
    if (root instanceof import_obsidian.TFile && root.extension === "md") {
      out.push(root);
      return;
    }
    if (root instanceof import_obsidian.TFolder) {
      for (const child of root.children) {
        this.walkFiles(child, out);
      }
    }
  }
  allMemoFiles() {
    const folder = this.app.vault.getAbstractFileByPath(MEMOS_DIR);
    if (!(folder instanceof import_obsidian.TFolder)) return [];
    const files = [];
    this.walkFiles(folder, files);
    return files.sort((a, b) => b.basename.localeCompare(a.basename));
  }
  parse(content, file) {
    const { frontmatter, body } = parseFrontmatter(content);
    const tags = normalizeTags(frontmatter.tags);
    if (!tags.includes(BASE_TAG)) {
      tags.unshift(BASE_TAG);
    }
    const createdAt = toIsoString(frontmatter.createdAt) ?? new Date(file.stat.ctime ?? Date.now()).toISOString();
    const updatedAt = toIsoString(frontmatter.updatedAt) ?? new Date(file.stat.mtime ?? file.stat.ctime ?? Date.now()).toISOString();
    const title = typeof frontmatter.title === "string" ? frontmatter.title.trim() : void 0;
    return {
      path: file.path,
      filename: file.basename,
      title: title || void 0,
      tags,
      content: body.trim(),
      createdAt,
      updatedAt
    };
  }
  async list() {
    await this.ensureFolder();
    const files = this.allMemoFiles();
    const memos = [];
    for (const file of files) {
      const raw = await this.app.vault.read(file);
      memos.push(this.parse(raw, file));
    }
    return memos.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async create(payload) {
    await this.ensureFolder();
    const now = /* @__PURE__ */ new Date();
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
      updatedAt
    };
    const fileContent = stringifyMemo(frontmatter, payload.content);
    const file = await this.app.vault.create(path, fileContent);
    const raw = await this.app.vault.read(file);
    return this.parse(raw, file);
  }
  async update(path, payload) {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (!(file instanceof import_obsidian.TFile)) {
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
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await this.app.vault.modify(file, stringifyMemo(updated, payload.content));
    return this.parse(await this.app.vault.read(file), file);
  }
  async delete(path) {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (!(file instanceof import_obsidian.TFile)) {
      throw new Error("Memo file not found");
    }
    await this.app.vault.delete(file, true);
  }
};
var MemosView = class extends import_obsidian.ItemView {
  constructor(leaf, app) {
    super(leaf);
    this.memos = [];
    this.activeTag = null;
    this.activeDay = null;
    this.activeMemoPath = null;
    this.editingPath = null;
    this.calendarCursor = startOfMonth(/* @__PURE__ */ new Date());
    this.store = new MemoStore(app);
  }
  getViewType() {
    return MEMOS_VIEW_TYPE;
  }
  getDisplayText() {
    return "Memos";
  }
  getIcon() {
    return "calendar-check";
  }
  async onOpen() {
    this.containerEl.empty();
    this.containerEl.addClass("memos-view-root");
    this.renderSkeleton();
    await this.reload();
  }
  async reload() {
    this.memos = await this.store.list();
    this.renderSidebar();
    this.renderList();
    this.renderFilterHint();
  }
  renderSkeleton() {
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
      placeholder: "Title (optional)"
    });
    this.titleInput.addClass("memos-input");
    this.tagsInput = composer.createEl("input", {
      type: "text",
      placeholder: "Tags (comma separated)"
    });
    this.tagsInput.addClass("memos-input");
    this.contentInput = composer.createEl("textarea", {
      placeholder: "Write your memo..."
    });
    this.contentInput.addClass("memos-textarea");
    const composerActions = composer.createDiv({ cls: "memos-composer-actions" });
    this.submitButton = composerActions.createEl("button", {
      text: "Publish",
      cls: "mod-cta",
      attr: { type: "button" }
    });
    this.submitButton.addEventListener("click", () => {
      void this.handlePublish();
    });
    this.cancelEditButton = composerActions.createEl("button", {
      text: "Cancel edit",
      cls: "memos-cancel-edit",
      attr: { type: "button" }
    });
    this.cancelEditButton.addEventListener("click", () => {
      this.resetComposer();
    });
    this.cancelEditButton.hide();
    this.filterHint = content.createDiv({ cls: "memos-filter-hint" });
    this.listHost = content.createDiv({ cls: "memos-list" });
  }
  collectStats(memos) {
    const now = /* @__PURE__ */ new Date();
    const nowDay = dayKey(now);
    const nowMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const byTag = /* @__PURE__ */ new Map();
    const byDay = /* @__PURE__ */ new Map();
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
      byDay
    };
  }
  renderSidebar() {
    const stats = this.collectStats(this.memos);
    this.renderCalendar(stats.byDay);
    this.renderStats(stats);
    this.renderTagCloud(stats.byTag);
  }
  renderCalendar(byDay) {
    this.calendarHost.empty();
    const header = this.calendarHost.createDiv({ cls: "memos-calendar-header" });
    const navLeft = header.createEl("button", { cls: "memos-calendar-nav", text: "\u2039" });
    navLeft.addEventListener("click", () => {
      this.calendarCursor = shiftMonth(this.calendarCursor, -1);
      this.renderCalendar(byDay);
    });
    const title = header.createDiv({ cls: "memos-calendar-title" });
    title.createEl("span", { text: String(this.calendarCursor.getFullYear()) });
    title.createEl("span", { text: String(this.calendarCursor.getMonth() + 1).padStart(2, "0") });
    const navRight = header.createEl("button", { cls: "memos-calendar-nav", text: "\u203A" });
    navRight.addEventListener("click", () => {
      this.calendarCursor = shiftMonth(this.calendarCursor, 1);
      this.renderCalendar(byDay);
    });
    const labels = this.calendarHost.createDiv({ cls: "memos-calendar-row labels" });
    labels.createDiv({ cls: "memos-week-label", text: "W" });
    ["\u4E00", "\u4E8C", "\u4E09", "\u56DB", "\u4E94", "\u516D", "\u65E5"].forEach(
      (d) => labels.createEl("span", { text: d })
    );
    const weeks = buildMonthGrid(this.calendarCursor);
    const visibleKeys = weeks.flatMap((w) => w.days.map((day) => dayKey(day)));
    const maxCount = Math.max(
      1,
      ...visibleKeys.map((key) => byDay.get(key) ?? 0)
    );
    for (const week of weeks) {
      const row = this.calendarHost.createDiv({ cls: "memos-calendar-row" });
      row.createDiv({ cls: "memos-week-label", text: isoWeekLabel(week.days[0]) });
      for (const day of week.days) {
        const key = dayKey(day);
        const count = byDay.get(key) ?? 0;
        const intensity = Math.min(4, Math.ceil(count / maxCount * 4));
        const isCurrentMonth = day.getMonth() === this.calendarCursor.getMonth();
        const cell = row.createEl("button", {
          cls: `memos-calendar-cell level-${count === 0 ? 0 : intensity}`
        });
        cell.type = "button";
        cell.ariaLabel = `${key}: ${count} memos`;
        if (!isCurrentMonth) cell.addClass("outside-month");
        if (dayKey(/* @__PURE__ */ new Date()) === key) cell.addClass("today");
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
  renderStats(stats) {
    this.statsHost.empty();
    const cards = [
      { label: "Total", value: stats.total },
      { label: "Today", value: stats.today },
      { label: "This Month", value: stats.month }
    ];
    for (const card of cards) {
      const item = this.statsHost.createDiv({ cls: "memos-stat-card" });
      item.createDiv({ text: card.label, cls: "memos-stat-label" });
      item.createDiv({ text: String(card.value), cls: "memos-stat-value" });
    }
  }
  renderTagCloud(byTag) {
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
        cls: "memos-tag-chip"
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
  filteredMemos() {
    return this.memos.filter((memo) => {
      if (this.activeTag && !memo.tags.includes(this.activeTag)) return false;
      if (this.activeDay && dayKey(new Date(memo.createdAt)) !== this.activeDay) return false;
      return true;
    });
  }
  renderFilterHint() {
    this.filterHint.empty();
    const labels = [];
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
  renderList() {
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
          text: memo.content.slice(0, 200)
        });
      }
      const footer = item.createDiv({ cls: "memos-item-footer" });
      footer.createSpan({ text: formatDateTime(memo.createdAt) });
      const actions = footer.createDiv({ cls: "memos-item-actions" });
      const copyBtn = actions.createEl("span", {
        cls: "memos-icon-btn",
        attr: { "aria-label": "Copy memo", role: "button", tabindex: "0" }
      });
      (0, import_obsidian.setIcon)(copyBtn, "copy");
      const onCopy = async (evt) => {
        evt.stopPropagation();
        this.activeMemoPath = memo.path;
        await navigator.clipboard.writeText(memo.content);
        new import_obsidian.Notice("Memo copied");
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
        attr: { "aria-label": "Edit memo", role: "button", tabindex: "0" }
      });
      (0, import_obsidian.setIcon)(editBtn, "pencil");
      const onEdit = (evt) => {
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
        attr: { "aria-label": "Delete memo", role: "button", tabindex: "0" }
      });
      (0, import_obsidian.setIcon)(deleteBtn, "trash-2");
      const onDelete = async (evt) => {
        evt.stopPropagation();
        this.activeMemoPath = memo.path;
        if (!window.confirm("Delete this memo?")) return;
        await this.store.delete(memo.path);
        if (this.editingPath === memo.path) {
          this.resetComposer();
        }
        await this.reload();
        new import_obsidian.Notice("Memo deleted");
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
  async handlePublish() {
    const content = this.contentInput.value.trim();
    if (!content) {
      new import_obsidian.Notice("Memo content is required");
      return;
    }
    const tags = parseTagInput(this.tagsInput.value);
    const payload = {
      title: this.titleInput.value.trim() || void 0,
      content,
      tags
    };
    if (this.editingPath) {
      await this.store.update(this.editingPath, payload);
      new import_obsidian.Notice("Memo updated");
    } else {
      await this.store.create(payload);
      new import_obsidian.Notice("Memo published");
    }
    this.resetComposer();
    await this.reload();
  }
  resetComposer() {
    this.editingPath = null;
    this.titleInput.value = "";
    this.tagsInput.value = "";
    this.contentInput.value = "";
    this.submitButton.textContent = "Publish";
    this.cancelEditButton.hide();
  }
};
var MemosPlugin = class extends import_obsidian.Plugin {
  async onload() {
    this.registerView(
      MEMOS_VIEW_TYPE,
      (leaf) => new MemosView(leaf, this.app)
    );
    this.addRibbonIcon("scroll-text", "Open Memos", () => {
      void this.activateView();
    });
    this.addCommand({
      id: "open-memos-view",
      name: "Open Memos view",
      callback: () => void this.activateView()
    });
  }
  async onunload() {
    this.app.workspace.detachLeavesOfType(MEMOS_VIEW_TYPE);
  }
  async activateView() {
    const leaves = this.app.workspace.getLeavesOfType(MEMOS_VIEW_TYPE);
    if (leaves.length > 0) {
      await this.app.workspace.revealLeaf(leaves[0]);
      return;
    }
    const leaf = this.app.workspace.getLeaf(true);
    await leaf.setViewState({ type: MEMOS_VIEW_TYPE, active: true });
    await this.app.workspace.revealLeaf(leaf);
  }
};
function parseFrontmatter(raw) {
  if (!raw.startsWith("---\n")) {
    return { frontmatter: {}, body: raw };
  }
  const end = raw.indexOf("\n---", 4);
  if (end < 0) {
    return { frontmatter: {}, body: raw };
  }
  const block = raw.slice(4, end).trim();
  const body = raw.slice(end + 4).trimStart();
  const frontmatter = {};
  let currentArrayKey = null;
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
      frontmatter[key] = value.slice(1, -1).split(",").map((v) => v.trim()).filter(Boolean);
      continue;
    }
    frontmatter[key] = stripQuotes(value);
  }
  return { frontmatter, body };
}
function stringifyMemo(frontmatter, body) {
  const lines = ["---"];
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
function normalizeTags(input) {
  const out = /* @__PURE__ */ new Set();
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
function parseTagInput(value) {
  return normalizeTags(value);
}
function cleanTag(tag) {
  return tag.trim().replace(/^#/, "").replace(/\s+/g, "-").toLowerCase();
}
function toIsoString(v) {
  if (typeof v !== "string") return null;
  const d = new Date(v);
  return Number.isNaN(d.valueOf()) ? null : d.toISOString();
}
function dayKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}
function formatFileName(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${y}${m}${day}_${hh}${mm}${ss}`;
}
function formatDateTime(value) {
  const d = new Date(value);
  if (Number.isNaN(d.valueOf())) return value;
  return d.toLocaleString();
}
function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
function shiftMonth(date, delta) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}
function buildMonthGrid(monthDate) {
  const first = startOfMonth(monthDate);
  const month = first.getMonth();
  const start = startOfWeekMonday(first);
  const weeks = [];
  let cursor = new Date(start);
  for (; ; ) {
    const days = [];
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
function startOfWeekMonday(date) {
  const result = new Date(date);
  const day = result.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + offset);
  result.setHours(0, 0, 0, 0);
  return result;
}
function isoWeekLabel(date) {
  const week = isoWeekNumber(date);
  return `W${week}`;
}
function isoWeekNumber(date) {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const firstDayNr = (firstThursday.getDay() + 6) % 7;
  firstThursday.setDate(firstThursday.getDate() - firstDayNr + 3);
  const diff = target.getTime() - firstThursday.getTime();
  return 1 + Math.round(diff / 6048e5);
}
function escapeYaml(text) {
  if (/[:#[\]{},"'`]/.test(text)) {
    return JSON.stringify(text);
  }
  return text;
}
function stripQuotes(text) {
  const trimmed = text.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFpbi50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHtcbiAgQXBwLFxuICBJdGVtVmlldyxcbiAgTm90aWNlLFxuICBQbHVnaW4sXG4gIHNldEljb24sXG4gIFRBYnN0cmFjdEZpbGUsXG4gIFRGaWxlLFxuICBURm9sZGVyLFxuICBXb3Jrc3BhY2VMZWFmLFxufSBmcm9tIFwib2JzaWRpYW5cIjtcblxuY29uc3QgTUVNT1NfVklFV19UWVBFID0gXCJtZW1vcy12aWV3XCI7XG5jb25zdCBNRU1PU19ESVIgPSBcImNvbnRlbnQvTWVtb3NcIjtcbmNvbnN0IEJBU0VfVEFHID0gXCJtZW1vXCI7XG5cbnR5cGUgTWVtbyA9IHtcbiAgcGF0aDogc3RyaW5nO1xuICBmaWxlbmFtZTogc3RyaW5nO1xuICB0aXRsZT86IHN0cmluZztcbiAgdGFnczogc3RyaW5nW107XG4gIGNvbnRlbnQ6IHN0cmluZztcbiAgY3JlYXRlZEF0OiBzdHJpbmc7XG4gIHVwZGF0ZWRBdDogc3RyaW5nO1xufTtcblxudHlwZSBNZW1vUGF5bG9hZCA9IHtcbiAgdGl0bGU/OiBzdHJpbmc7XG4gIGNvbnRlbnQ6IHN0cmluZztcbiAgdGFnczogc3RyaW5nW107XG59O1xuXG50eXBlIE1lbW9TdGF0cyA9IHtcbiAgdG90YWw6IG51bWJlcjtcbiAgdG9kYXk6IG51bWJlcjtcbiAgbW9udGg6IG51bWJlcjtcbiAgYnlUYWc6IE1hcDxzdHJpbmcsIG51bWJlcj47XG4gIGJ5RGF5OiBNYXA8c3RyaW5nLCBudW1iZXI+O1xufTtcblxuY2xhc3MgTWVtb1N0b3JlIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBhcHA6IEFwcCkge31cblxuICBhc3luYyBlbnN1cmVGb2xkZXIoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZm9sZGVyID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKE1FTU9TX0RJUik7XG4gICAgaWYgKCFmb2xkZXIpIHtcbiAgICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNyZWF0ZUZvbGRlcihNRU1PU19ESVIpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgd2Fsa0ZpbGVzKHJvb3Q6IFRBYnN0cmFjdEZpbGUsIG91dDogVEZpbGVbXSk6IHZvaWQge1xuICAgIGlmIChyb290IGluc3RhbmNlb2YgVEZpbGUgJiYgcm9vdC5leHRlbnNpb24gPT09IFwibWRcIikge1xuICAgICAgb3V0LnB1c2gocm9vdCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChyb290IGluc3RhbmNlb2YgVEZvbGRlcikge1xuICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiByb290LmNoaWxkcmVuKSB7XG4gICAgICAgIHRoaXMud2Fsa0ZpbGVzKGNoaWxkLCBvdXQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYWxsTWVtb0ZpbGVzKCk6IFRGaWxlW10ge1xuICAgIGNvbnN0IGZvbGRlciA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChNRU1PU19ESVIpO1xuICAgIGlmICghKGZvbGRlciBpbnN0YW5jZW9mIFRGb2xkZXIpKSByZXR1cm4gW107XG4gICAgY29uc3QgZmlsZXM6IFRGaWxlW10gPSBbXTtcbiAgICB0aGlzLndhbGtGaWxlcyhmb2xkZXIsIGZpbGVzKTtcbiAgICByZXR1cm4gZmlsZXMuc29ydCgoYSwgYikgPT4gYi5iYXNlbmFtZS5sb2NhbGVDb21wYXJlKGEuYmFzZW5hbWUpKTtcbiAgfVxuXG4gIHByaXZhdGUgcGFyc2UoY29udGVudDogc3RyaW5nLCBmaWxlOiBURmlsZSk6IE1lbW8ge1xuICAgIGNvbnN0IHsgZnJvbnRtYXR0ZXIsIGJvZHkgfSA9IHBhcnNlRnJvbnRtYXR0ZXIoY29udGVudCk7XG4gICAgY29uc3QgdGFncyA9IG5vcm1hbGl6ZVRhZ3MoZnJvbnRtYXR0ZXIudGFncyk7XG4gICAgaWYgKCF0YWdzLmluY2x1ZGVzKEJBU0VfVEFHKSkge1xuICAgICAgdGFncy51bnNoaWZ0KEJBU0VfVEFHKTtcbiAgICB9XG4gICAgY29uc3QgY3JlYXRlZEF0ID1cbiAgICAgIHRvSXNvU3RyaW5nKGZyb250bWF0dGVyLmNyZWF0ZWRBdCkgPz9cbiAgICAgIG5ldyBEYXRlKGZpbGUuc3RhdC5jdGltZSA/PyBEYXRlLm5vdygpKS50b0lTT1N0cmluZygpO1xuICAgIGNvbnN0IHVwZGF0ZWRBdCA9XG4gICAgICB0b0lzb1N0cmluZyhmcm9udG1hdHRlci51cGRhdGVkQXQpID8/XG4gICAgICBuZXcgRGF0ZShmaWxlLnN0YXQubXRpbWUgPz8gZmlsZS5zdGF0LmN0aW1lID8/IERhdGUubm93KCkpLnRvSVNPU3RyaW5nKCk7XG4gICAgY29uc3QgdGl0bGUgPSB0eXBlb2YgZnJvbnRtYXR0ZXIudGl0bGUgPT09IFwic3RyaW5nXCIgPyBmcm9udG1hdHRlci50aXRsZS50cmltKCkgOiB1bmRlZmluZWQ7XG4gICAgcmV0dXJuIHtcbiAgICAgIHBhdGg6IGZpbGUucGF0aCxcbiAgICAgIGZpbGVuYW1lOiBmaWxlLmJhc2VuYW1lLFxuICAgICAgdGl0bGU6IHRpdGxlIHx8IHVuZGVmaW5lZCxcbiAgICAgIHRhZ3MsXG4gICAgICBjb250ZW50OiBib2R5LnRyaW0oKSxcbiAgICAgIGNyZWF0ZWRBdCxcbiAgICAgIHVwZGF0ZWRBdCxcbiAgICB9O1xuICB9XG5cbiAgYXN5bmMgbGlzdCgpOiBQcm9taXNlPE1lbW9bXT4ge1xuICAgIGF3YWl0IHRoaXMuZW5zdXJlRm9sZGVyKCk7XG4gICAgY29uc3QgZmlsZXMgPSB0aGlzLmFsbE1lbW9GaWxlcygpO1xuICAgIGNvbnN0IG1lbW9zOiBNZW1vW10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IGZpbGUgb2YgZmlsZXMpIHtcbiAgICAgIGNvbnN0IHJhdyA9IGF3YWl0IHRoaXMuYXBwLnZhdWx0LnJlYWQoZmlsZSk7XG4gICAgICBtZW1vcy5wdXNoKHRoaXMucGFyc2UocmF3LCBmaWxlKSk7XG4gICAgfVxuICAgIHJldHVybiBtZW1vcy5zb3J0KChhLCBiKSA9PiBiLmNyZWF0ZWRBdC5sb2NhbGVDb21wYXJlKGEuY3JlYXRlZEF0KSk7XG4gIH1cblxuICBhc3luYyBjcmVhdGUocGF5bG9hZDogTWVtb1BheWxvYWQpOiBQcm9taXNlPE1lbW8+IHtcbiAgICBhd2FpdCB0aGlzLmVuc3VyZUZvbGRlcigpO1xuICAgIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCk7XG4gICAgY29uc3QgY3JlYXRlZEF0ID0gbm93LnRvSVNPU3RyaW5nKCk7XG4gICAgY29uc3QgdXBkYXRlZEF0ID0gY3JlYXRlZEF0O1xuICAgIGNvbnN0IGZpbGVuYW1lID0gZm9ybWF0RmlsZU5hbWUobm93KTtcbiAgICBjb25zdCBwYXRoID0gYCR7TUVNT1NfRElSfS8ke2ZpbGVuYW1lfS5tZGA7XG4gICAgY29uc3QgcmVzb2x2ZWRUaXRsZSA9IHBheWxvYWQudGl0bGU/LnRyaW0oKSB8fCBmaWxlbmFtZTtcbiAgICBjb25zdCB0YWdzID0gbm9ybWFsaXplVGFncyhwYXlsb2FkLnRhZ3MpO1xuICAgIGlmICghdGFncy5pbmNsdWRlcyhCQVNFX1RBRykpIHRhZ3MudW5zaGlmdChCQVNFX1RBRyk7XG4gICAgY29uc3QgZnJvbnRtYXR0ZXIgPSB7XG4gICAgICB0aXRsZTogcmVzb2x2ZWRUaXRsZSxcbiAgICAgIHRhZ3MsXG4gICAgICBjcmVhdGVkQXQsXG4gICAgICB1cGRhdGVkQXQsXG4gICAgfTtcbiAgICBjb25zdCBmaWxlQ29udGVudCA9IHN0cmluZ2lmeU1lbW8oZnJvbnRtYXR0ZXIsIHBheWxvYWQuY29udGVudCk7XG4gICAgY29uc3QgZmlsZSA9IGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNyZWF0ZShwYXRoLCBmaWxlQ29udGVudCk7XG4gICAgY29uc3QgcmF3ID0gYXdhaXQgdGhpcy5hcHAudmF1bHQucmVhZChmaWxlKTtcbiAgICByZXR1cm4gdGhpcy5wYXJzZShyYXcsIGZpbGUpO1xuICB9XG5cbiAgYXN5bmMgdXBkYXRlKHBhdGg6IHN0cmluZywgcGF5bG9hZDogTWVtb1BheWxvYWQpOiBQcm9taXNlPE1lbW8+IHtcbiAgICBjb25zdCBmaWxlID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKHBhdGgpO1xuICAgIGlmICghKGZpbGUgaW5zdGFuY2VvZiBURmlsZSkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIk1lbW8gZmlsZSBub3QgZm91bmRcIik7XG4gICAgfVxuICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5wYXJzZShhd2FpdCB0aGlzLmFwcC52YXVsdC5yZWFkKGZpbGUpLCBmaWxlKTtcbiAgICBjb25zdCB0YWdzID0gbm9ybWFsaXplVGFncyhwYXlsb2FkLnRhZ3MpO1xuICAgIGlmICghdGFncy5pbmNsdWRlcyhCQVNFX1RBRykpIHRhZ3MudW5zaGlmdChCQVNFX1RBRyk7XG4gICAgY29uc3QgZmFsbGJhY2tUaXRsZSA9IGZpbGUuYmFzZW5hbWU7XG4gICAgY29uc3QgdXBkYXRlZCA9IHtcbiAgICAgIHRpdGxlOiBwYXlsb2FkLnRpdGxlPy50cmltKCkgfHwgZmFsbGJhY2tUaXRsZSxcbiAgICAgIHRhZ3MsXG4gICAgICBjcmVhdGVkQXQ6IGV4aXN0aW5nLmNyZWF0ZWRBdCxcbiAgICAgIHVwZGF0ZWRBdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgIH07XG4gICAgYXdhaXQgdGhpcy5hcHAudmF1bHQubW9kaWZ5KGZpbGUsIHN0cmluZ2lmeU1lbW8odXBkYXRlZCwgcGF5bG9hZC5jb250ZW50KSk7XG4gICAgcmV0dXJuIHRoaXMucGFyc2UoYXdhaXQgdGhpcy5hcHAudmF1bHQucmVhZChmaWxlKSwgZmlsZSk7XG4gIH1cblxuICBhc3luYyBkZWxldGUocGF0aDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZmlsZSA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChwYXRoKTtcbiAgICBpZiAoIShmaWxlIGluc3RhbmNlb2YgVEZpbGUpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJNZW1vIGZpbGUgbm90IGZvdW5kXCIpO1xuICAgIH1cbiAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5kZWxldGUoZmlsZSwgdHJ1ZSk7XG4gIH1cbn1cblxuY2xhc3MgTWVtb3NWaWV3IGV4dGVuZHMgSXRlbVZpZXcge1xuICBwcml2YXRlIHN0b3JlOiBNZW1vU3RvcmU7XG4gIHByaXZhdGUgbWVtb3M6IE1lbW9bXSA9IFtdO1xuICBwcml2YXRlIGFjdGl2ZVRhZzogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgYWN0aXZlRGF5OiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBhY3RpdmVNZW1vUGF0aDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgZWRpdGluZ1BhdGg6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGNhbGVuZGFyQ3Vyc29yID0gc3RhcnRPZk1vbnRoKG5ldyBEYXRlKCkpO1xuXG4gIHByaXZhdGUgdGl0bGVJbnB1dCE6IEhUTUxJbnB1dEVsZW1lbnQ7XG4gIHByaXZhdGUgdGFnc0lucHV0ITogSFRNTElucHV0RWxlbWVudDtcbiAgcHJpdmF0ZSBjb250ZW50SW5wdXQhOiBIVE1MVGV4dEFyZWFFbGVtZW50O1xuICBwcml2YXRlIHN1Ym1pdEJ1dHRvbiE6IEhUTUxCdXR0b25FbGVtZW50O1xuICBwcml2YXRlIGNhbmNlbEVkaXRCdXR0b24hOiBIVE1MQnV0dG9uRWxlbWVudDtcbiAgcHJpdmF0ZSBmaWx0ZXJIaW50ITogSFRNTERpdkVsZW1lbnQ7XG4gIHByaXZhdGUgY2FsZW5kYXJIb3N0ITogSFRNTERpdkVsZW1lbnQ7XG4gIHByaXZhdGUgc3RhdHNIb3N0ITogSFRNTERpdkVsZW1lbnQ7XG4gIHByaXZhdGUgdGFnc0hvc3QhOiBIVE1MRGl2RWxlbWVudDtcbiAgcHJpdmF0ZSBsaXN0SG9zdCE6IEhUTUxEaXZFbGVtZW50O1xuXG4gIGNvbnN0cnVjdG9yKGxlYWY6IFdvcmtzcGFjZUxlYWYsIGFwcDogQXBwKSB7XG4gICAgc3VwZXIobGVhZik7XG4gICAgdGhpcy5zdG9yZSA9IG5ldyBNZW1vU3RvcmUoYXBwKTtcbiAgfVxuXG4gIGdldFZpZXdUeXBlKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIE1FTU9TX1ZJRVdfVFlQRTtcbiAgfVxuXG4gIGdldERpc3BsYXlUZXh0KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFwiTWVtb3NcIjtcbiAgfVxuXG4gIGdldEljb24oKTogc3RyaW5nIHtcbiAgICByZXR1cm4gXCJjYWxlbmRhci1jaGVja1wiO1xuICB9XG5cbiAgYXN5bmMgb25PcGVuKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRoaXMuY29udGFpbmVyRWwuZW1wdHkoKTtcbiAgICB0aGlzLmNvbnRhaW5lckVsLmFkZENsYXNzKFwibWVtb3Mtdmlldy1yb290XCIpO1xuICAgIHRoaXMucmVuZGVyU2tlbGV0b24oKTtcbiAgICBhd2FpdCB0aGlzLnJlbG9hZCgpO1xuICB9XG5cbiAgYXN5bmMgcmVsb2FkKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRoaXMubWVtb3MgPSBhd2FpdCB0aGlzLnN0b3JlLmxpc3QoKTtcbiAgICB0aGlzLnJlbmRlclNpZGViYXIoKTtcbiAgICB0aGlzLnJlbmRlckxpc3QoKTtcbiAgICB0aGlzLnJlbmRlckZpbHRlckhpbnQoKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyU2tlbGV0b24oKTogdm9pZCB7XG4gICAgY29uc3Qgd3JhcHBlciA9IHRoaXMuY29udGFpbmVyRWwuY3JlYXRlRGl2KHsgY2xzOiBcIm1lbW9zLWxheW91dFwiIH0pO1xuICAgIGNvbnN0IHNpZGViYXIgPSB3cmFwcGVyLmNyZWF0ZURpdih7IGNsczogXCJtZW1vcy1zaWRlYmFyXCIgfSk7XG4gICAgY29uc3QgY29udGVudCA9IHdyYXBwZXIuY3JlYXRlRGl2KHsgY2xzOiBcIm1lbW9zLWNvbnRlbnRcIiB9KTtcblxuICAgIHNpZGViYXIuY3JlYXRlRWwoXCJoM1wiLCB7IHRleHQ6IFwiTWVtb3NcIiB9KTtcbiAgICB0aGlzLmNhbGVuZGFySG9zdCA9IHNpZGViYXIuY3JlYXRlRGl2KHsgY2xzOiBcIm1lbW9zLWNhbGVuZGFyXCIgfSk7XG4gICAgdGhpcy5zdGF0c0hvc3QgPSBzaWRlYmFyLmNyZWF0ZURpdih7IGNsczogXCJtZW1vcy1zdGF0c1wiIH0pO1xuICAgIHRoaXMudGFnc0hvc3QgPSBzaWRlYmFyLmNyZWF0ZURpdih7IGNsczogXCJtZW1vcy10YWctY2xvdWRcIiB9KTtcblxuICAgIGNvbnN0IGNvbXBvc2VyID0gY29udGVudC5jcmVhdGVEaXYoeyBjbHM6IFwibWVtb3MtY29tcG9zZXJcIiB9KTtcbiAgICBjb21wb3Nlci5jcmVhdGVFbChcImgzXCIsIHsgdGV4dDogXCJRdWljayBQdWJsaXNoXCIgfSk7XG5cbiAgICB0aGlzLnRpdGxlSW5wdXQgPSBjb21wb3Nlci5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwidGV4dFwiLFxuICAgICAgcGxhY2Vob2xkZXI6IFwiVGl0bGUgKG9wdGlvbmFsKVwiLFxuICAgIH0pO1xuICAgIHRoaXMudGl0bGVJbnB1dC5hZGRDbGFzcyhcIm1lbW9zLWlucHV0XCIpO1xuXG4gICAgdGhpcy50YWdzSW5wdXQgPSBjb21wb3Nlci5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwidGV4dFwiLFxuICAgICAgcGxhY2Vob2xkZXI6IFwiVGFncyAoY29tbWEgc2VwYXJhdGVkKVwiLFxuICAgIH0pO1xuICAgIHRoaXMudGFnc0lucHV0LmFkZENsYXNzKFwibWVtb3MtaW5wdXRcIik7XG5cbiAgICB0aGlzLmNvbnRlbnRJbnB1dCA9IGNvbXBvc2VyLmNyZWF0ZUVsKFwidGV4dGFyZWFcIiwge1xuICAgICAgcGxhY2Vob2xkZXI6IFwiV3JpdGUgeW91ciBtZW1vLi4uXCIsXG4gICAgfSk7XG4gICAgdGhpcy5jb250ZW50SW5wdXQuYWRkQ2xhc3MoXCJtZW1vcy10ZXh0YXJlYVwiKTtcblxuICAgIGNvbnN0IGNvbXBvc2VyQWN0aW9ucyA9IGNvbXBvc2VyLmNyZWF0ZURpdih7IGNsczogXCJtZW1vcy1jb21wb3Nlci1hY3Rpb25zXCIgfSk7XG4gICAgdGhpcy5zdWJtaXRCdXR0b24gPSBjb21wb3NlckFjdGlvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgdGV4dDogXCJQdWJsaXNoXCIsXG4gICAgICBjbHM6IFwibW9kLWN0YVwiLFxuICAgICAgYXR0cjogeyB0eXBlOiBcImJ1dHRvblwiIH0sXG4gICAgfSk7XG4gICAgdGhpcy5zdWJtaXRCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHZvaWQgdGhpcy5oYW5kbGVQdWJsaXNoKCk7XG4gICAgfSk7XG4gICAgdGhpcy5jYW5jZWxFZGl0QnV0dG9uID0gY29tcG9zZXJBY3Rpb25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIHRleHQ6IFwiQ2FuY2VsIGVkaXRcIixcbiAgICAgIGNsczogXCJtZW1vcy1jYW5jZWwtZWRpdFwiLFxuICAgICAgYXR0cjogeyB0eXBlOiBcImJ1dHRvblwiIH0sXG4gICAgfSk7XG4gICAgdGhpcy5jYW5jZWxFZGl0QnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB0aGlzLnJlc2V0Q29tcG9zZXIoKTtcbiAgICB9KTtcbiAgICB0aGlzLmNhbmNlbEVkaXRCdXR0b24uaGlkZSgpO1xuXG4gICAgdGhpcy5maWx0ZXJIaW50ID0gY29udGVudC5jcmVhdGVEaXYoeyBjbHM6IFwibWVtb3MtZmlsdGVyLWhpbnRcIiB9KTtcbiAgICB0aGlzLmxpc3RIb3N0ID0gY29udGVudC5jcmVhdGVEaXYoeyBjbHM6IFwibWVtb3MtbGlzdFwiIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBjb2xsZWN0U3RhdHMobWVtb3M6IE1lbW9bXSk6IE1lbW9TdGF0cyB7XG4gICAgY29uc3Qgbm93ID0gbmV3IERhdGUoKTtcbiAgICBjb25zdCBub3dEYXkgPSBkYXlLZXkobm93KTtcbiAgICBjb25zdCBub3dNb250aCA9IGAke25vdy5nZXRGdWxsWWVhcigpfS0ke1N0cmluZyhub3cuZ2V0TW9udGgoKSArIDEpLnBhZFN0YXJ0KDIsIFwiMFwiKX1gO1xuICAgIGNvbnN0IGJ5VGFnID0gbmV3IE1hcDxzdHJpbmcsIG51bWJlcj4oKTtcbiAgICBjb25zdCBieURheSA9IG5ldyBNYXA8c3RyaW5nLCBudW1iZXI+KCk7XG4gICAgbGV0IHRvZGF5ID0gMDtcbiAgICBsZXQgbW9udGggPSAwO1xuXG4gICAgZm9yIChjb25zdCBtZW1vIG9mIG1lbW9zKSB7XG4gICAgICBjb25zdCBtZW1vRGF0ZSA9IG5ldyBEYXRlKG1lbW8uY3JlYXRlZEF0KTtcbiAgICAgIGNvbnN0IG1lbW9EYXkgPSBkYXlLZXkobWVtb0RhdGUpO1xuICAgICAgY29uc3QgbWVtb01vbnRoID0gYCR7bWVtb0RhdGUuZ2V0RnVsbFllYXIoKX0tJHtTdHJpbmcobWVtb0RhdGUuZ2V0TW9udGgoKSArIDEpLnBhZFN0YXJ0KDIsIFwiMFwiKX1gO1xuICAgICAgaWYgKG1lbW9EYXkgPT09IG5vd0RheSkgdG9kYXkgKz0gMTtcbiAgICAgIGlmIChtZW1vTW9udGggPT09IG5vd01vbnRoKSBtb250aCArPSAxO1xuICAgICAgYnlEYXkuc2V0KG1lbW9EYXksIChieURheS5nZXQobWVtb0RheSkgPz8gMCkgKyAxKTtcbiAgICAgIGZvciAoY29uc3QgdGFnIG9mIG1lbW8udGFncykge1xuICAgICAgICBieVRhZy5zZXQodGFnLCAoYnlUYWcuZ2V0KHRhZykgPz8gMCkgKyAxKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgdG90YWw6IG1lbW9zLmxlbmd0aCxcbiAgICAgIHRvZGF5LFxuICAgICAgbW9udGgsXG4gICAgICBieVRhZyxcbiAgICAgIGJ5RGF5LFxuICAgIH07XG4gIH1cblxuICBwcml2YXRlIHJlbmRlclNpZGViYXIoKTogdm9pZCB7XG4gICAgY29uc3Qgc3RhdHMgPSB0aGlzLmNvbGxlY3RTdGF0cyh0aGlzLm1lbW9zKTtcbiAgICB0aGlzLnJlbmRlckNhbGVuZGFyKHN0YXRzLmJ5RGF5KTtcbiAgICB0aGlzLnJlbmRlclN0YXRzKHN0YXRzKTtcbiAgICB0aGlzLnJlbmRlclRhZ0Nsb3VkKHN0YXRzLmJ5VGFnKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyQ2FsZW5kYXIoYnlEYXk6IE1hcDxzdHJpbmcsIG51bWJlcj4pOiB2b2lkIHtcbiAgICB0aGlzLmNhbGVuZGFySG9zdC5lbXB0eSgpO1xuICAgIGNvbnN0IGhlYWRlciA9IHRoaXMuY2FsZW5kYXJIb3N0LmNyZWF0ZURpdih7IGNsczogXCJtZW1vcy1jYWxlbmRhci1oZWFkZXJcIiB9KTtcbiAgICBjb25zdCBuYXZMZWZ0ID0gaGVhZGVyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBcIm1lbW9zLWNhbGVuZGFyLW5hdlwiLCB0ZXh0OiBcIlx1MjAzOVwiIH0pO1xuICAgIG5hdkxlZnQuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHRoaXMuY2FsZW5kYXJDdXJzb3IgPSBzaGlmdE1vbnRoKHRoaXMuY2FsZW5kYXJDdXJzb3IsIC0xKTtcbiAgICAgIHRoaXMucmVuZGVyQ2FsZW5kYXIoYnlEYXkpO1xuICAgIH0pO1xuXG4gICAgY29uc3QgdGl0bGUgPSBoZWFkZXIuY3JlYXRlRGl2KHsgY2xzOiBcIm1lbW9zLWNhbGVuZGFyLXRpdGxlXCIgfSk7XG4gICAgdGl0bGUuY3JlYXRlRWwoXCJzcGFuXCIsIHsgdGV4dDogU3RyaW5nKHRoaXMuY2FsZW5kYXJDdXJzb3IuZ2V0RnVsbFllYXIoKSkgfSk7XG4gICAgdGl0bGUuY3JlYXRlRWwoXCJzcGFuXCIsIHsgdGV4dDogU3RyaW5nKHRoaXMuY2FsZW5kYXJDdXJzb3IuZ2V0TW9udGgoKSArIDEpLnBhZFN0YXJ0KDIsIFwiMFwiKSB9KTtcblxuICAgIGNvbnN0IG5hdlJpZ2h0ID0gaGVhZGVyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBcIm1lbW9zLWNhbGVuZGFyLW5hdlwiLCB0ZXh0OiBcIlx1MjAzQVwiIH0pO1xuICAgIG5hdlJpZ2h0LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB0aGlzLmNhbGVuZGFyQ3Vyc29yID0gc2hpZnRNb250aCh0aGlzLmNhbGVuZGFyQ3Vyc29yLCAxKTtcbiAgICAgIHRoaXMucmVuZGVyQ2FsZW5kYXIoYnlEYXkpO1xuICAgIH0pO1xuXG4gICAgY29uc3QgbGFiZWxzID0gdGhpcy5jYWxlbmRhckhvc3QuY3JlYXRlRGl2KHsgY2xzOiBcIm1lbW9zLWNhbGVuZGFyLXJvdyBsYWJlbHNcIiB9KTtcbiAgICBsYWJlbHMuY3JlYXRlRGl2KHsgY2xzOiBcIm1lbW9zLXdlZWstbGFiZWxcIiwgdGV4dDogXCJXXCIgfSk7XG4gICAgW1wiXHU0RTAwXCIsIFwiXHU0RThDXCIsIFwiXHU0RTA5XCIsIFwiXHU1NkRCXCIsIFwiXHU0RTk0XCIsIFwiXHU1MTZEXCIsIFwiXHU2NUU1XCJdLmZvckVhY2goKGQpID0+XG4gICAgICBsYWJlbHMuY3JlYXRlRWwoXCJzcGFuXCIsIHsgdGV4dDogZCB9KSxcbiAgICApO1xuXG4gICAgY29uc3Qgd2Vla3MgPSBidWlsZE1vbnRoR3JpZCh0aGlzLmNhbGVuZGFyQ3Vyc29yKTtcbiAgICBjb25zdCB2aXNpYmxlS2V5cyA9IHdlZWtzLmZsYXRNYXAoKHcpID0+IHcuZGF5cy5tYXAoKGRheSkgPT4gZGF5S2V5KGRheSkpKTtcbiAgICBjb25zdCBtYXhDb3VudCA9IE1hdGgubWF4KFxuICAgICAgMSxcbiAgICAgIC4uLnZpc2libGVLZXlzLm1hcCgoa2V5KSA9PiBieURheS5nZXQoa2V5KSA/PyAwKSxcbiAgICApO1xuXG4gICAgZm9yIChjb25zdCB3ZWVrIG9mIHdlZWtzKSB7XG4gICAgICBjb25zdCByb3cgPSB0aGlzLmNhbGVuZGFySG9zdC5jcmVhdGVEaXYoeyBjbHM6IFwibWVtb3MtY2FsZW5kYXItcm93XCIgfSk7XG4gICAgICByb3cuY3JlYXRlRGl2KHsgY2xzOiBcIm1lbW9zLXdlZWstbGFiZWxcIiwgdGV4dDogaXNvV2Vla0xhYmVsKHdlZWsuZGF5c1swXSkgfSk7XG4gICAgICBmb3IgKGNvbnN0IGRheSBvZiB3ZWVrLmRheXMpIHtcbiAgICAgICAgY29uc3Qga2V5ID0gZGF5S2V5KGRheSk7XG4gICAgICAgIGNvbnN0IGNvdW50ID0gYnlEYXkuZ2V0KGtleSkgPz8gMDtcbiAgICAgICAgY29uc3QgaW50ZW5zaXR5ID0gTWF0aC5taW4oNCwgTWF0aC5jZWlsKChjb3VudCAvIG1heENvdW50KSAqIDQpKTtcbiAgICAgICAgY29uc3QgaXNDdXJyZW50TW9udGggPSBkYXkuZ2V0TW9udGgoKSA9PT0gdGhpcy5jYWxlbmRhckN1cnNvci5nZXRNb250aCgpO1xuICAgICAgICBjb25zdCBjZWxsID0gcm93LmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgICAgICBjbHM6IGBtZW1vcy1jYWxlbmRhci1jZWxsIGxldmVsLSR7Y291bnQgPT09IDAgPyAwIDogaW50ZW5zaXR5fWAsXG4gICAgICAgIH0pO1xuICAgICAgICBjZWxsLnR5cGUgPSBcImJ1dHRvblwiO1xuICAgICAgICBjZWxsLmFyaWFMYWJlbCA9IGAke2tleX06ICR7Y291bnR9IG1lbW9zYDtcbiAgICAgICAgaWYgKCFpc0N1cnJlbnRNb250aCkgY2VsbC5hZGRDbGFzcyhcIm91dHNpZGUtbW9udGhcIik7XG4gICAgICAgIGlmIChkYXlLZXkobmV3IERhdGUoKSkgPT09IGtleSkgY2VsbC5hZGRDbGFzcyhcInRvZGF5XCIpO1xuICAgICAgICBpZiAodGhpcy5hY3RpdmVEYXkgPT09IGtleSkgY2VsbC5hZGRDbGFzcyhcImFjdGl2ZVwiKTtcbiAgICAgICAgY2VsbC5jcmVhdGVTcGFuKHsgY2xzOiBcIm1lbW9zLWNhbGVuZGFyLWRheVwiLCB0ZXh0OiBTdHJpbmcoZGF5LmdldERhdGUoKSkgfSk7XG4gICAgICAgIGlmIChjb3VudCA+IDApIHtcbiAgICAgICAgICBjZWxsLmNyZWF0ZVNwYW4oeyBjbHM6IFwibWVtb3MtY2FsZW5kYXItY291bnRcIiwgdGV4dDogU3RyaW5nKGNvdW50KSB9KTtcbiAgICAgICAgfVxuICAgICAgICBjZWxsLmFkZENsYXNzKFwiY2xpY2thYmxlXCIpO1xuICAgICAgICBjZWxsLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgICAgdGhpcy5hY3RpdmVEYXkgPSB0aGlzLmFjdGl2ZURheSA9PT0ga2V5ID8gbnVsbCA6IGtleTtcbiAgICAgICAgICB0aGlzLmFjdGl2ZVRhZyA9IG51bGw7XG4gICAgICAgICAgdGhpcy5yZW5kZXJMaXN0KCk7XG4gICAgICAgICAgdGhpcy5yZW5kZXJGaWx0ZXJIaW50KCk7XG4gICAgICAgICAgdGhpcy5yZW5kZXJDYWxlbmRhcihieURheSk7XG4gICAgICAgICAgdGhpcy5yZW5kZXJUYWdDbG91ZCh0aGlzLmNvbGxlY3RTdGF0cyh0aGlzLm1lbW9zKS5ieVRhZyk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGxlZ2VuZCA9IHRoaXMuY2FsZW5kYXJIb3N0LmNyZWF0ZURpdih7IGNsczogXCJtZW1vcy1jYWxlbmRhci1sZWdlbmRcIiB9KTtcbiAgICBsZWdlbmQuY3JlYXRlU3Bhbih7IHRleHQ6IFwiTGVzc1wiIH0pO1xuICAgIGZvciAobGV0IGxldmVsID0gMDsgbGV2ZWwgPD0gNDsgbGV2ZWwgKz0gMSkge1xuICAgICAgbGVnZW5kLmNyZWF0ZVNwYW4oeyBjbHM6IGBtZW1vcy1sZWdlbmQtZG90IGxldmVsLSR7bGV2ZWx9YCB9KTtcbiAgICB9XG4gICAgbGVnZW5kLmNyZWF0ZVNwYW4oeyB0ZXh0OiBcIk1vcmVcIiB9KTtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyU3RhdHMoc3RhdHM6IE1lbW9TdGF0cyk6IHZvaWQge1xuICAgIHRoaXMuc3RhdHNIb3N0LmVtcHR5KCk7XG4gICAgY29uc3QgY2FyZHMgPSBbXG4gICAgICB7IGxhYmVsOiBcIlRvdGFsXCIsIHZhbHVlOiBzdGF0cy50b3RhbCB9LFxuICAgICAgeyBsYWJlbDogXCJUb2RheVwiLCB2YWx1ZTogc3RhdHMudG9kYXkgfSxcbiAgICAgIHsgbGFiZWw6IFwiVGhpcyBNb250aFwiLCB2YWx1ZTogc3RhdHMubW9udGggfSxcbiAgICBdO1xuICAgIGZvciAoY29uc3QgY2FyZCBvZiBjYXJkcykge1xuICAgICAgY29uc3QgaXRlbSA9IHRoaXMuc3RhdHNIb3N0LmNyZWF0ZURpdih7IGNsczogXCJtZW1vcy1zdGF0LWNhcmRcIiB9KTtcbiAgICAgIGl0ZW0uY3JlYXRlRGl2KHsgdGV4dDogY2FyZC5sYWJlbCwgY2xzOiBcIm1lbW9zLXN0YXQtbGFiZWxcIiB9KTtcbiAgICAgIGl0ZW0uY3JlYXRlRGl2KHsgdGV4dDogU3RyaW5nKGNhcmQudmFsdWUpLCBjbHM6IFwibWVtb3Mtc3RhdC12YWx1ZVwiIH0pO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyVGFnQ2xvdWQoYnlUYWc6IE1hcDxzdHJpbmcsIG51bWJlcj4pOiB2b2lkIHtcbiAgICB0aGlzLnRhZ3NIb3N0LmVtcHR5KCk7XG4gICAgdGhpcy50YWdzSG9zdC5jcmVhdGVFbChcImg0XCIsIHsgdGV4dDogXCJUYWdzXCIgfSk7XG4gICAgY29uc3Qgc29ydGVkID0gQXJyYXkuZnJvbShieVRhZy5lbnRyaWVzKCkpLnNvcnQoKGEsIGIpID0+IGJbMV0gLSBhWzFdKTtcbiAgICBpZiAoc29ydGVkLmxlbmd0aCA9PT0gMCkge1xuICAgICAgdGhpcy50YWdzSG9zdC5jcmVhdGVEaXYoeyB0ZXh0OiBcIk5vIHRhZ3MgeWV0XCIsIGNsczogXCJtZW1vcy1lbXB0eVwiIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCB3cmFwID0gdGhpcy50YWdzSG9zdC5jcmVhdGVEaXYoeyBjbHM6IFwibWVtb3MtdGFnLXdyYXBcIiB9KTtcbiAgICBmb3IgKGNvbnN0IFt0YWcsIGNvdW50XSBvZiBzb3J0ZWQpIHtcbiAgICAgIGNvbnN0IGNoaXAgPSB3cmFwLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgICAgdGV4dDogYCMke3RhZ30gJHtjb3VudH1gLFxuICAgICAgICBjbHM6IFwibWVtb3MtdGFnLWNoaXBcIixcbiAgICAgIH0pO1xuICAgICAgaWYgKHRoaXMuYWN0aXZlVGFnID09PSB0YWcpIGNoaXAuYWRkQ2xhc3MoXCJhY3RpdmVcIik7XG4gICAgICBjaGlwLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgIHRoaXMuYWN0aXZlVGFnID0gdGhpcy5hY3RpdmVUYWcgPT09IHRhZyA/IG51bGwgOiB0YWc7XG4gICAgICAgIHRoaXMuYWN0aXZlRGF5ID0gbnVsbDtcbiAgICAgICAgdGhpcy5yZW5kZXJUYWdDbG91ZChieVRhZyk7XG4gICAgICAgIHRoaXMucmVuZGVyTGlzdCgpO1xuICAgICAgICB0aGlzLnJlbmRlckZpbHRlckhpbnQoKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZmlsdGVyZWRNZW1vcygpOiBNZW1vW10ge1xuICAgIHJldHVybiB0aGlzLm1lbW9zLmZpbHRlcigobWVtbykgPT4ge1xuICAgICAgaWYgKHRoaXMuYWN0aXZlVGFnICYmICFtZW1vLnRhZ3MuaW5jbHVkZXModGhpcy5hY3RpdmVUYWcpKSByZXR1cm4gZmFsc2U7XG4gICAgICBpZiAodGhpcy5hY3RpdmVEYXkgJiYgZGF5S2V5KG5ldyBEYXRlKG1lbW8uY3JlYXRlZEF0KSkgIT09IHRoaXMuYWN0aXZlRGF5KSByZXR1cm4gZmFsc2U7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyRmlsdGVySGludCgpOiB2b2lkIHtcbiAgICB0aGlzLmZpbHRlckhpbnQuZW1wdHkoKTtcbiAgICBjb25zdCBsYWJlbHM6IHN0cmluZ1tdID0gW107XG4gICAgaWYgKHRoaXMuYWN0aXZlVGFnKSBsYWJlbHMucHVzaChgdGFnOiAjJHt0aGlzLmFjdGl2ZVRhZ31gKTtcbiAgICBpZiAodGhpcy5hY3RpdmVEYXkpIGxhYmVscy5wdXNoKGBkYXk6ICR7dGhpcy5hY3RpdmVEYXl9YCk7XG4gICAgaWYgKGxhYmVscy5sZW5ndGggPT09IDApIHJldHVybjtcbiAgICB0aGlzLmZpbHRlckhpbnQuY3JlYXRlU3Bhbih7IHRleHQ6IGBGaWx0ZXJlZCBieSAke2xhYmVscy5qb2luKFwiLCBcIil9YCB9KTtcbiAgICBjb25zdCBjbGVhciA9IHRoaXMuZmlsdGVySGludC5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiQ2xlYXJcIiB9KTtcbiAgICBjbGVhci5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgdGhpcy5hY3RpdmVUYWcgPSBudWxsO1xuICAgICAgdGhpcy5hY3RpdmVEYXkgPSBudWxsO1xuICAgICAgdGhpcy5yZW5kZXJTaWRlYmFyKCk7XG4gICAgICB0aGlzLnJlbmRlckxpc3QoKTtcbiAgICAgIHRoaXMucmVuZGVyRmlsdGVySGludCgpO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJMaXN0KCk6IHZvaWQge1xuICAgIHRoaXMubGlzdEhvc3QuZW1wdHkoKTtcbiAgICBjb25zdCBtZW1vcyA9IHRoaXMuZmlsdGVyZWRNZW1vcygpO1xuICAgIGlmICh0aGlzLmFjdGl2ZU1lbW9QYXRoICYmICFtZW1vcy5zb21lKChtZW1vKSA9PiBtZW1vLnBhdGggPT09IHRoaXMuYWN0aXZlTWVtb1BhdGgpKSB7XG4gICAgICB0aGlzLmFjdGl2ZU1lbW9QYXRoID0gbnVsbDtcbiAgICB9XG4gICAgaWYgKG1lbW9zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgdGhpcy5saXN0SG9zdC5jcmVhdGVEaXYoeyBjbHM6IFwibWVtb3MtZW1wdHlcIiwgdGV4dDogXCJObyBtZW1vcyBmb3VuZC5cIiB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZm9yIChjb25zdCBtZW1vIG9mIG1lbW9zKSB7XG4gICAgICBjb25zdCBpdGVtID0gdGhpcy5saXN0SG9zdC5jcmVhdGVEaXYoeyBjbHM6IFwibWVtb3MtaXRlbVwiIH0pO1xuICAgICAgaXRlbS50YWJJbmRleCA9IDA7XG4gICAgICBpZiAodGhpcy5hY3RpdmVNZW1vUGF0aCA9PT0gbWVtby5wYXRoKSBpdGVtLmFkZENsYXNzKFwiYWN0aXZlXCIpO1xuICAgICAgaXRlbS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICB0aGlzLmFjdGl2ZU1lbW9QYXRoID0gbWVtby5wYXRoO1xuICAgICAgICB0aGlzLnJlbmRlckxpc3QoKTtcbiAgICAgIH0pO1xuICAgICAgaXRlbS5jcmVhdGVFbChcImg0XCIsIHsgdGV4dDogbWVtby50aXRsZSB8fCBcIlVudGl0bGVkIG1lbW9cIiB9KTtcblxuICAgICAgY29uc3QgdGFnUm93ID0gaXRlbS5jcmVhdGVEaXYoeyBjbHM6IFwibWVtb3MtaXRlbS10YWdzXCIgfSk7XG4gICAgICBtZW1vLnRhZ3MuZm9yRWFjaCgodGFnKSA9PiB7XG4gICAgICAgIHRhZ1Jvdy5jcmVhdGVTcGFuKHsgdGV4dDogYCMke3RhZ31gIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIGlmIChtZW1vLmNvbnRlbnQpIHtcbiAgICAgICAgaXRlbS5jcmVhdGVEaXYoe1xuICAgICAgICAgIGNsczogXCJtZW1vcy1pdGVtLWNvbnRlbnRcIixcbiAgICAgICAgICB0ZXh0OiBtZW1vLmNvbnRlbnQuc2xpY2UoMCwgMjAwKSxcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGZvb3RlciA9IGl0ZW0uY3JlYXRlRGl2KHsgY2xzOiBcIm1lbW9zLWl0ZW0tZm9vdGVyXCIgfSk7XG4gICAgICBmb290ZXIuY3JlYXRlU3Bhbih7IHRleHQ6IGZvcm1hdERhdGVUaW1lKG1lbW8uY3JlYXRlZEF0KSB9KTtcblxuICAgICAgY29uc3QgYWN0aW9ucyA9IGZvb3Rlci5jcmVhdGVEaXYoeyBjbHM6IFwibWVtb3MtaXRlbS1hY3Rpb25zXCIgfSk7XG5cbiAgICAgIGNvbnN0IGNvcHlCdG4gPSBhY3Rpb25zLmNyZWF0ZUVsKFwic3BhblwiLCB7XG4gICAgICAgIGNsczogXCJtZW1vcy1pY29uLWJ0blwiLFxuICAgICAgICBhdHRyOiB7IFwiYXJpYS1sYWJlbFwiOiBcIkNvcHkgbWVtb1wiLCByb2xlOiBcImJ1dHRvblwiLCB0YWJpbmRleDogXCIwXCIgfSxcbiAgICAgIH0pO1xuICAgICAgc2V0SWNvbihjb3B5QnRuLCBcImNvcHlcIik7XG4gICAgICBjb25zdCBvbkNvcHkgPSBhc3luYyAoZXZ0OiBFdmVudCkgPT4ge1xuICAgICAgICBldnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIHRoaXMuYWN0aXZlTWVtb1BhdGggPSBtZW1vLnBhdGg7XG4gICAgICAgIGF3YWl0IG5hdmlnYXRvci5jbGlwYm9hcmQud3JpdGVUZXh0KG1lbW8uY29udGVudCk7XG4gICAgICAgIG5ldyBOb3RpY2UoXCJNZW1vIGNvcGllZFwiKTtcbiAgICAgICAgdGhpcy5yZW5kZXJMaXN0KCk7XG4gICAgICB9O1xuICAgICAgY29weUJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgb25Db3B5KTtcbiAgICAgIGNvcHlCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgKGV2dCkgPT4ge1xuICAgICAgICBpZiAoZXZ0LmtleSA9PT0gXCJFbnRlclwiIHx8IGV2dC5rZXkgPT09IFwiIFwiKSB7XG4gICAgICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgdm9pZCBvbkNvcHkoZXZ0KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IGVkaXRCdG4gPSBhY3Rpb25zLmNyZWF0ZUVsKFwic3BhblwiLCB7XG4gICAgICAgIGNsczogXCJtZW1vcy1pY29uLWJ0blwiLFxuICAgICAgICBhdHRyOiB7IFwiYXJpYS1sYWJlbFwiOiBcIkVkaXQgbWVtb1wiLCByb2xlOiBcImJ1dHRvblwiLCB0YWJpbmRleDogXCIwXCIgfSxcbiAgICAgIH0pO1xuICAgICAgc2V0SWNvbihlZGl0QnRuLCBcInBlbmNpbFwiKTtcbiAgICAgIGNvbnN0IG9uRWRpdCA9IChldnQ6IEV2ZW50KSA9PiB7XG4gICAgICAgIGV2dC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgdGhpcy5hY3RpdmVNZW1vUGF0aCA9IG1lbW8ucGF0aDtcbiAgICAgICAgdGhpcy5lZGl0aW5nUGF0aCA9IG1lbW8ucGF0aDtcbiAgICAgICAgdGhpcy50aXRsZUlucHV0LnZhbHVlID0gbWVtby50aXRsZSA/PyBcIlwiO1xuICAgICAgICB0aGlzLnRhZ3NJbnB1dC52YWx1ZSA9IG1lbW8udGFncy5maWx0ZXIoKHgpID0+IHggIT09IEJBU0VfVEFHKS5qb2luKFwiLCBcIik7XG4gICAgICAgIHRoaXMuY29udGVudElucHV0LnZhbHVlID0gbWVtby5jb250ZW50O1xuICAgICAgICB0aGlzLnN1Ym1pdEJ1dHRvbi50ZXh0Q29udGVudCA9IFwiVXBkYXRlXCI7XG4gICAgICAgIHRoaXMuY2FuY2VsRWRpdEJ1dHRvbi5zaG93KCk7XG4gICAgICAgIHRoaXMucmVuZGVyTGlzdCgpO1xuICAgICAgfTtcbiAgICAgIGVkaXRCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIG9uRWRpdCk7XG4gICAgICBlZGl0QnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIChldnQpID0+IHtcbiAgICAgICAgaWYgKGV2dC5rZXkgPT09IFwiRW50ZXJcIiB8fCBldnQua2V5ID09PSBcIiBcIikge1xuICAgICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIG9uRWRpdChldnQpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgY29uc3QgZGVsZXRlQnRuID0gYWN0aW9ucy5jcmVhdGVFbChcInNwYW5cIiwge1xuICAgICAgICBjbHM6IFwibWVtb3MtaWNvbi1idG4gZGFuZ2VyXCIsXG4gICAgICAgIGF0dHI6IHsgXCJhcmlhLWxhYmVsXCI6IFwiRGVsZXRlIG1lbW9cIiwgcm9sZTogXCJidXR0b25cIiwgdGFiaW5kZXg6IFwiMFwiIH0sXG4gICAgICB9KTtcbiAgICAgIHNldEljb24oZGVsZXRlQnRuLCBcInRyYXNoLTJcIik7XG4gICAgICBjb25zdCBvbkRlbGV0ZSA9IGFzeW5jIChldnQ6IEV2ZW50KSA9PiB7XG4gICAgICAgIGV2dC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgdGhpcy5hY3RpdmVNZW1vUGF0aCA9IG1lbW8ucGF0aDtcbiAgICAgICAgaWYgKCF3aW5kb3cuY29uZmlybShcIkRlbGV0ZSB0aGlzIG1lbW8/XCIpKSByZXR1cm47XG4gICAgICAgIGF3YWl0IHRoaXMuc3RvcmUuZGVsZXRlKG1lbW8ucGF0aCk7XG4gICAgICAgIGlmICh0aGlzLmVkaXRpbmdQYXRoID09PSBtZW1vLnBhdGgpIHtcbiAgICAgICAgICB0aGlzLnJlc2V0Q29tcG9zZXIoKTtcbiAgICAgICAgfVxuICAgICAgICBhd2FpdCB0aGlzLnJlbG9hZCgpO1xuICAgICAgICBuZXcgTm90aWNlKFwiTWVtbyBkZWxldGVkXCIpO1xuICAgICAgfTtcbiAgICAgIGRlbGV0ZUJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgb25EZWxldGUpO1xuICAgICAgZGVsZXRlQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIChldnQpID0+IHtcbiAgICAgICAgaWYgKGV2dC5rZXkgPT09IFwiRW50ZXJcIiB8fCBldnQua2V5ID09PSBcIiBcIikge1xuICAgICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIHZvaWQgb25EZWxldGUoZXZ0KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBoYW5kbGVQdWJsaXNoKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGNvbnRlbnQgPSB0aGlzLmNvbnRlbnRJbnB1dC52YWx1ZS50cmltKCk7XG4gICAgaWYgKCFjb250ZW50KSB7XG4gICAgICBuZXcgTm90aWNlKFwiTWVtbyBjb250ZW50IGlzIHJlcXVpcmVkXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCB0YWdzID0gcGFyc2VUYWdJbnB1dCh0aGlzLnRhZ3NJbnB1dC52YWx1ZSk7XG4gICAgY29uc3QgcGF5bG9hZDogTWVtb1BheWxvYWQgPSB7XG4gICAgICB0aXRsZTogdGhpcy50aXRsZUlucHV0LnZhbHVlLnRyaW0oKSB8fCB1bmRlZmluZWQsXG4gICAgICBjb250ZW50LFxuICAgICAgdGFncyxcbiAgICB9O1xuICAgIGlmICh0aGlzLmVkaXRpbmdQYXRoKSB7XG4gICAgICBhd2FpdCB0aGlzLnN0b3JlLnVwZGF0ZSh0aGlzLmVkaXRpbmdQYXRoLCBwYXlsb2FkKTtcbiAgICAgIG5ldyBOb3RpY2UoXCJNZW1vIHVwZGF0ZWRcIik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGF3YWl0IHRoaXMuc3RvcmUuY3JlYXRlKHBheWxvYWQpO1xuICAgICAgbmV3IE5vdGljZShcIk1lbW8gcHVibGlzaGVkXCIpO1xuICAgIH1cbiAgICB0aGlzLnJlc2V0Q29tcG9zZXIoKTtcbiAgICBhd2FpdCB0aGlzLnJlbG9hZCgpO1xuICB9XG5cbiAgcHJpdmF0ZSByZXNldENvbXBvc2VyKCk6IHZvaWQge1xuICAgIHRoaXMuZWRpdGluZ1BhdGggPSBudWxsO1xuICAgIHRoaXMudGl0bGVJbnB1dC52YWx1ZSA9IFwiXCI7XG4gICAgdGhpcy50YWdzSW5wdXQudmFsdWUgPSBcIlwiO1xuICAgIHRoaXMuY29udGVudElucHV0LnZhbHVlID0gXCJcIjtcbiAgICB0aGlzLnN1Ym1pdEJ1dHRvbi50ZXh0Q29udGVudCA9IFwiUHVibGlzaFwiO1xuICAgIHRoaXMuY2FuY2VsRWRpdEJ1dHRvbi5oaWRlKCk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTWVtb3NQbHVnaW4gZXh0ZW5kcyBQbHVnaW4ge1xuICBhc3luYyBvbmxvYWQoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy5yZWdpc3RlclZpZXcoXG4gICAgICBNRU1PU19WSUVXX1RZUEUsXG4gICAgICAobGVhZikgPT4gbmV3IE1lbW9zVmlldyhsZWFmLCB0aGlzLmFwcCksXG4gICAgKTtcblxuICAgIHRoaXMuYWRkUmliYm9uSWNvbihcInNjcm9sbC10ZXh0XCIsIFwiT3BlbiBNZW1vc1wiLCAoKSA9PiB7XG4gICAgICB2b2lkIHRoaXMuYWN0aXZhdGVWaWV3KCk7XG4gICAgfSk7XG5cbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwib3Blbi1tZW1vcy12aWV3XCIsXG4gICAgICBuYW1lOiBcIk9wZW4gTWVtb3Mgdmlld1wiLFxuICAgICAgY2FsbGJhY2s6ICgpID0+IHZvaWQgdGhpcy5hY3RpdmF0ZVZpZXcoKSxcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIG9udW5sb2FkKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRoaXMuYXBwLndvcmtzcGFjZS5kZXRhY2hMZWF2ZXNPZlR5cGUoTUVNT1NfVklFV19UWVBFKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgYWN0aXZhdGVWaWV3KCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGxlYXZlcyA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRMZWF2ZXNPZlR5cGUoTUVNT1NfVklFV19UWVBFKTtcbiAgICBpZiAobGVhdmVzLmxlbmd0aCA+IDApIHtcbiAgICAgIGF3YWl0IHRoaXMuYXBwLndvcmtzcGFjZS5yZXZlYWxMZWFmKGxlYXZlc1swXSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGxlYWYgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0TGVhZih0cnVlKTtcbiAgICBhd2FpdCBsZWFmLnNldFZpZXdTdGF0ZSh7IHR5cGU6IE1FTU9TX1ZJRVdfVFlQRSwgYWN0aXZlOiB0cnVlIH0pO1xuICAgIGF3YWl0IHRoaXMuYXBwLndvcmtzcGFjZS5yZXZlYWxMZWFmKGxlYWYpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHBhcnNlRnJvbnRtYXR0ZXIocmF3OiBzdHJpbmcpOiB7IGZyb250bWF0dGVyOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjsgYm9keTogc3RyaW5nIH0ge1xuICBpZiAoIXJhdy5zdGFydHNXaXRoKFwiLS0tXFxuXCIpKSB7XG4gICAgcmV0dXJuIHsgZnJvbnRtYXR0ZXI6IHt9LCBib2R5OiByYXcgfTtcbiAgfVxuICBjb25zdCBlbmQgPSByYXcuaW5kZXhPZihcIlxcbi0tLVwiLCA0KTtcbiAgaWYgKGVuZCA8IDApIHtcbiAgICByZXR1cm4geyBmcm9udG1hdHRlcjoge30sIGJvZHk6IHJhdyB9O1xuICB9XG4gIGNvbnN0IGJsb2NrID0gcmF3LnNsaWNlKDQsIGVuZCkudHJpbSgpO1xuICBjb25zdCBib2R5ID0gcmF3LnNsaWNlKGVuZCArIDQpLnRyaW1TdGFydCgpO1xuICBjb25zdCBmcm9udG1hdHRlcjogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPSB7fTtcblxuICBsZXQgY3VycmVudEFycmF5S2V5OiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbiAgZm9yIChjb25zdCBsaW5lIG9mIGJsb2NrLnNwbGl0KFwiXFxuXCIpKSB7XG4gICAgY29uc3QgdHJpbW1lZCA9IGxpbmUudHJpbSgpO1xuICAgIGlmICghdHJpbW1lZCkgY29udGludWU7XG4gICAgaWYgKHRyaW1tZWQuc3RhcnRzV2l0aChcIi0gXCIpICYmIGN1cnJlbnRBcnJheUtleSkge1xuICAgICAgY29uc3QgYXJyID0gZnJvbnRtYXR0ZXJbY3VycmVudEFycmF5S2V5XTtcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KGFycikpIGFyci5wdXNoKHRyaW1tZWQuc2xpY2UoMikudHJpbSgpKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBjb25zdCBpZHggPSBsaW5lLmluZGV4T2YoXCI6XCIpO1xuICAgIGlmIChpZHggPCAwKSBjb250aW51ZTtcbiAgICBjb25zdCBrZXkgPSBsaW5lLnNsaWNlKDAsIGlkeCkudHJpbSgpO1xuICAgIGNvbnN0IHZhbHVlID0gbGluZS5zbGljZShpZHggKyAxKS50cmltKCk7XG4gICAgaWYgKHZhbHVlID09PSBcIlwiKSB7XG4gICAgICBmcm9udG1hdHRlcltrZXldID0gW107XG4gICAgICBjdXJyZW50QXJyYXlLZXkgPSBrZXk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgY3VycmVudEFycmF5S2V5ID0gbnVsbDtcbiAgICBpZiAodmFsdWUuc3RhcnRzV2l0aChcIltcIikgJiYgdmFsdWUuZW5kc1dpdGgoXCJdXCIpKSB7XG4gICAgICBmcm9udG1hdHRlcltrZXldID0gdmFsdWVcbiAgICAgICAgLnNsaWNlKDEsIC0xKVxuICAgICAgICAuc3BsaXQoXCIsXCIpXG4gICAgICAgIC5tYXAoKHYpID0+IHYudHJpbSgpKVxuICAgICAgICAuZmlsdGVyKEJvb2xlYW4pO1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGZyb250bWF0dGVyW2tleV0gPSBzdHJpcFF1b3Rlcyh2YWx1ZSk7XG4gIH1cbiAgcmV0dXJuIHsgZnJvbnRtYXR0ZXIsIGJvZHkgfTtcbn1cblxuZnVuY3Rpb24gc3RyaW5naWZ5TWVtbyhcbiAgZnJvbnRtYXR0ZXI6IHsgdGl0bGU/OiBzdHJpbmc7IHRhZ3M6IHN0cmluZ1tdOyBjcmVhdGVkQXQ6IHN0cmluZzsgdXBkYXRlZEF0OiBzdHJpbmcgfSxcbiAgYm9keTogc3RyaW5nLFxuKTogc3RyaW5nIHtcbiAgY29uc3QgbGluZXM6IHN0cmluZ1tdID0gW1wiLS0tXCJdO1xuICBpZiAoZnJvbnRtYXR0ZXIudGl0bGUpIHtcbiAgICBsaW5lcy5wdXNoKGB0aXRsZTogJHtlc2NhcGVZYW1sKGZyb250bWF0dGVyLnRpdGxlKX1gKTtcbiAgfVxuICBsaW5lcy5wdXNoKFwidGFnczpcIik7XG4gIGZvciAoY29uc3QgdGFnIG9mIGZyb250bWF0dGVyLnRhZ3MpIHtcbiAgICBsaW5lcy5wdXNoKGAgIC0gJHt0YWd9YCk7XG4gIH1cbiAgbGluZXMucHVzaChgY3JlYXRlZEF0OiAke2Zyb250bWF0dGVyLmNyZWF0ZWRBdH1gKTtcbiAgbGluZXMucHVzaChgdXBkYXRlZEF0OiAke2Zyb250bWF0dGVyLnVwZGF0ZWRBdH1gKTtcbiAgbGluZXMucHVzaChcIi0tLVwiLCBcIlwiLCBib2R5LnRyaW0oKSwgXCJcIik7XG4gIHJldHVybiBsaW5lcy5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVUYWdzKGlucHV0OiB1bmtub3duKTogc3RyaW5nW10ge1xuICBjb25zdCBvdXQgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgaWYgKEFycmF5LmlzQXJyYXkoaW5wdXQpKSB7XG4gICAgaW5wdXQuZm9yRWFjaCgodGFnKSA9PiB7XG4gICAgICBpZiAodHlwZW9mIHRhZyA9PT0gXCJzdHJpbmdcIiAmJiB0YWcudHJpbSgpKSBvdXQuYWRkKGNsZWFuVGFnKHRhZykpO1xuICAgIH0pO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBpbnB1dCA9PT0gXCJzdHJpbmdcIiAmJiBpbnB1dC50cmltKCkpIHtcbiAgICBpbnB1dC5zcGxpdChcIixcIikuZm9yRWFjaCgodGFnKSA9PiB7XG4gICAgICBpZiAodGFnLnRyaW0oKSkgb3V0LmFkZChjbGVhblRhZyh0YWcpKTtcbiAgICB9KTtcbiAgfVxuICByZXR1cm4gQXJyYXkuZnJvbShvdXQpLmZpbHRlcihCb29sZWFuKTtcbn1cblxuZnVuY3Rpb24gcGFyc2VUYWdJbnB1dCh2YWx1ZTogc3RyaW5nKTogc3RyaW5nW10ge1xuICByZXR1cm4gbm9ybWFsaXplVGFncyh2YWx1ZSk7XG59XG5cbmZ1bmN0aW9uIGNsZWFuVGFnKHRhZzogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHRhZy50cmltKCkucmVwbGFjZSgvXiMvLCBcIlwiKS5yZXBsYWNlKC9cXHMrL2csIFwiLVwiKS50b0xvd2VyQ2FzZSgpO1xufVxuXG5mdW5jdGlvbiB0b0lzb1N0cmluZyh2OiB1bmtub3duKTogc3RyaW5nIHwgbnVsbCB7XG4gIGlmICh0eXBlb2YgdiAhPT0gXCJzdHJpbmdcIikgcmV0dXJuIG51bGw7XG4gIGNvbnN0IGQgPSBuZXcgRGF0ZSh2KTtcbiAgcmV0dXJuIE51bWJlci5pc05hTihkLnZhbHVlT2YoKSkgPyBudWxsIDogZC50b0lTT1N0cmluZygpO1xufVxuXG5mdW5jdGlvbiBkYXlLZXkoZGF0ZTogRGF0ZSk6IHN0cmluZyB7XG4gIHJldHVybiBbXG4gICAgZGF0ZS5nZXRGdWxsWWVhcigpLFxuICAgIFN0cmluZyhkYXRlLmdldE1vbnRoKCkgKyAxKS5wYWRTdGFydCgyLCBcIjBcIiksXG4gICAgU3RyaW5nKGRhdGUuZ2V0RGF0ZSgpKS5wYWRTdGFydCgyLCBcIjBcIiksXG4gIF0uam9pbihcIi1cIik7XG59XG5cbmZ1bmN0aW9uIGZvcm1hdEZpbGVOYW1lKGQ6IERhdGUpOiBzdHJpbmcge1xuICBjb25zdCB5ID0gZC5nZXRGdWxsWWVhcigpO1xuICBjb25zdCBtID0gU3RyaW5nKGQuZ2V0TW9udGgoKSArIDEpLnBhZFN0YXJ0KDIsIFwiMFwiKTtcbiAgY29uc3QgZGF5ID0gU3RyaW5nKGQuZ2V0RGF0ZSgpKS5wYWRTdGFydCgyLCBcIjBcIik7XG4gIGNvbnN0IGhoID0gU3RyaW5nKGQuZ2V0SG91cnMoKSkucGFkU3RhcnQoMiwgXCIwXCIpO1xuICBjb25zdCBtbSA9IFN0cmluZyhkLmdldE1pbnV0ZXMoKSkucGFkU3RhcnQoMiwgXCIwXCIpO1xuICBjb25zdCBzcyA9IFN0cmluZyhkLmdldFNlY29uZHMoKSkucGFkU3RhcnQoMiwgXCIwXCIpO1xuICByZXR1cm4gYCR7eX0ke219JHtkYXl9XyR7aGh9JHttbX0ke3NzfWA7XG59XG5cbmZ1bmN0aW9uIGZvcm1hdERhdGVUaW1lKHZhbHVlOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBkID0gbmV3IERhdGUodmFsdWUpO1xuICBpZiAoTnVtYmVyLmlzTmFOKGQudmFsdWVPZigpKSkgcmV0dXJuIHZhbHVlO1xuICByZXR1cm4gZC50b0xvY2FsZVN0cmluZygpO1xufVxuXG5mdW5jdGlvbiBzdGFydE9mTW9udGgoZGF0ZTogRGF0ZSk6IERhdGUge1xuICByZXR1cm4gbmV3IERhdGUoZGF0ZS5nZXRGdWxsWWVhcigpLCBkYXRlLmdldE1vbnRoKCksIDEpO1xufVxuXG5mdW5jdGlvbiBzaGlmdE1vbnRoKGRhdGU6IERhdGUsIGRlbHRhOiBudW1iZXIpOiBEYXRlIHtcbiAgcmV0dXJuIG5ldyBEYXRlKGRhdGUuZ2V0RnVsbFllYXIoKSwgZGF0ZS5nZXRNb250aCgpICsgZGVsdGEsIDEpO1xufVxuXG5mdW5jdGlvbiBidWlsZE1vbnRoR3JpZChtb250aERhdGU6IERhdGUpOiBBcnJheTx7IGRheXM6IERhdGVbXSB9PiB7XG4gIGNvbnN0IGZpcnN0ID0gc3RhcnRPZk1vbnRoKG1vbnRoRGF0ZSk7XG4gIGNvbnN0IG1vbnRoID0gZmlyc3QuZ2V0TW9udGgoKTtcbiAgY29uc3Qgc3RhcnQgPSBzdGFydE9mV2Vla01vbmRheShmaXJzdCk7XG4gIGNvbnN0IHdlZWtzOiBBcnJheTx7IGRheXM6IERhdGVbXSB9PiA9IFtdO1xuXG4gIGxldCBjdXJzb3IgPSBuZXcgRGF0ZShzdGFydCk7XG4gIGZvciAoOzspIHtcbiAgICBjb25zdCBkYXlzOiBEYXRlW10gPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDc7IGkgKz0gMSkge1xuICAgICAgZGF5cy5wdXNoKG5ldyBEYXRlKGN1cnNvcikpO1xuICAgICAgY3Vyc29yLnNldERhdGUoY3Vyc29yLmdldERhdGUoKSArIDEpO1xuICAgIH1cbiAgICB3ZWVrcy5wdXNoKHsgZGF5cyB9KTtcbiAgICBjb25zdCByZWFjaGVkTmV4dE1vbnRoID0gZGF5cy5zb21lKChkKSA9PiBkLmdldE1vbnRoKCkgIT09IG1vbnRoKSAmJiBjdXJzb3IuZ2V0TW9udGgoKSAhPT0gbW9udGg7XG4gICAgaWYgKHdlZWtzLmxlbmd0aCA+PSA1ICYmIHJlYWNoZWROZXh0TW9udGgpIGJyZWFrO1xuICAgIGlmICh3ZWVrcy5sZW5ndGggPj0gNikgYnJlYWs7XG4gIH1cbiAgcmV0dXJuIHdlZWtzO1xufVxuXG5mdW5jdGlvbiBzdGFydE9mV2Vla01vbmRheShkYXRlOiBEYXRlKTogRGF0ZSB7XG4gIGNvbnN0IHJlc3VsdCA9IG5ldyBEYXRlKGRhdGUpO1xuICBjb25zdCBkYXkgPSByZXN1bHQuZ2V0RGF5KCk7XG4gIGNvbnN0IG9mZnNldCA9IGRheSA9PT0gMCA/IC02IDogMSAtIGRheTtcbiAgcmVzdWx0LnNldERhdGUocmVzdWx0LmdldERhdGUoKSArIG9mZnNldCk7XG4gIHJlc3VsdC5zZXRIb3VycygwLCAwLCAwLCAwKTtcbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZnVuY3Rpb24gaXNvV2Vla0xhYmVsKGRhdGU6IERhdGUpOiBzdHJpbmcge1xuICBjb25zdCB3ZWVrID0gaXNvV2Vla051bWJlcihkYXRlKTtcbiAgcmV0dXJuIGBXJHt3ZWVrfWA7XG59XG5cbmZ1bmN0aW9uIGlzb1dlZWtOdW1iZXIoZGF0ZTogRGF0ZSk6IG51bWJlciB7XG4gIGNvbnN0IHRhcmdldCA9IG5ldyBEYXRlKGRhdGUudmFsdWVPZigpKTtcbiAgY29uc3QgZGF5TnIgPSAoZGF0ZS5nZXREYXkoKSArIDYpICUgNztcbiAgdGFyZ2V0LnNldERhdGUodGFyZ2V0LmdldERhdGUoKSAtIGRheU5yICsgMyk7XG4gIGNvbnN0IGZpcnN0VGh1cnNkYXkgPSBuZXcgRGF0ZSh0YXJnZXQuZ2V0RnVsbFllYXIoKSwgMCwgNCk7XG4gIGNvbnN0IGZpcnN0RGF5TnIgPSAoZmlyc3RUaHVyc2RheS5nZXREYXkoKSArIDYpICUgNztcbiAgZmlyc3RUaHVyc2RheS5zZXREYXRlKGZpcnN0VGh1cnNkYXkuZ2V0RGF0ZSgpIC0gZmlyc3REYXlOciArIDMpO1xuICBjb25zdCBkaWZmID0gdGFyZ2V0LmdldFRpbWUoKSAtIGZpcnN0VGh1cnNkYXkuZ2V0VGltZSgpO1xuICByZXR1cm4gMSArIE1hdGgucm91bmQoZGlmZiAvIDYwNDgwMDAwMCk7XG59XG5cbmZ1bmN0aW9uIGVzY2FwZVlhbWwodGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgaWYgKC9bOiNbXFxde30sXCInYF0vLnRlc3QodGV4dCkpIHtcbiAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkodGV4dCk7XG4gIH1cbiAgcmV0dXJuIHRleHQ7XG59XG5cbmZ1bmN0aW9uIHN0cmlwUXVvdGVzKHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHRyaW1tZWQgPSB0ZXh0LnRyaW0oKTtcbiAgaWYgKHRyaW1tZWQuc3RhcnRzV2l0aChcIlxcXCJcIikgJiYgdHJpbW1lZC5lbmRzV2l0aChcIlxcXCJcIikpIHtcbiAgICByZXR1cm4gdHJpbW1lZC5zbGljZSgxLCAtMSk7XG4gIH1cbiAgcmV0dXJuIHRyaW1tZWQ7XG59XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxzQkFVTztBQUVQLElBQU0sa0JBQWtCO0FBQ3hCLElBQU0sWUFBWTtBQUNsQixJQUFNLFdBQVc7QUEwQmpCLElBQU0sWUFBTixNQUFnQjtBQUFBLEVBQ2QsWUFBb0IsS0FBVTtBQUFWO0FBQUEsRUFBVztBQUFBLEVBRS9CLE1BQU0sZUFBOEI7QUFDbEMsVUFBTSxTQUFTLEtBQUssSUFBSSxNQUFNLHNCQUFzQixTQUFTO0FBQzdELFFBQUksQ0FBQyxRQUFRO0FBQ1gsWUFBTSxLQUFLLElBQUksTUFBTSxhQUFhLFNBQVM7QUFBQSxJQUM3QztBQUFBLEVBQ0Y7QUFBQSxFQUVRLFVBQVUsTUFBcUIsS0FBb0I7QUFDekQsUUFBSSxnQkFBZ0IseUJBQVMsS0FBSyxjQUFjLE1BQU07QUFDcEQsVUFBSSxLQUFLLElBQUk7QUFDYjtBQUFBLElBQ0Y7QUFDQSxRQUFJLGdCQUFnQix5QkFBUztBQUMzQixpQkFBVyxTQUFTLEtBQUssVUFBVTtBQUNqQyxhQUFLLFVBQVUsT0FBTyxHQUFHO0FBQUEsTUFDM0I7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBRVEsZUFBd0I7QUFDOUIsVUFBTSxTQUFTLEtBQUssSUFBSSxNQUFNLHNCQUFzQixTQUFTO0FBQzdELFFBQUksRUFBRSxrQkFBa0IseUJBQVUsUUFBTyxDQUFDO0FBQzFDLFVBQU0sUUFBaUIsQ0FBQztBQUN4QixTQUFLLFVBQVUs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
