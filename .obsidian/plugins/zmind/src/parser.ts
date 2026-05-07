export interface HeadingOutlineNode {
  level: number;
  line: number;
  rawLine: string;
  title: string;
  children: HeadingOutlineNode[];
}

export interface OutlineEntry {
  depth: number;
  line: number;
  rawLine: string;
  title: string;
}

/** ATX headings only (`#` … `######`). */
export function parseAtxHeadingTree(content: string): HeadingOutlineNode {
  const lines = content.split(/\r?\n/);
  const virtualRoot: HeadingOutlineNode = {
    level: 0,
    line: -1,
    rawLine: "",
    title: "",
    children: [],
  };
  const stack: HeadingOutlineNode[] = [virtualRoot];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const m = rawLine.match(/^(#{1,6})\s+(.*)$/);
    if (!m) continue;
    const level = m[1].length;
    const title = m[2].trimEnd();
    const node: HeadingOutlineNode = {
      level,
      line: i,
      rawLine,
      title,
      children: [],
    };
    while (stack.length > 1 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }
    stack[stack.length - 1].children.push(node);
    stack.push(node);
  }

  return virtualRoot;
}

export function flattenOutline(root: HeadingOutlineNode): OutlineEntry[] {
  const out: OutlineEntry[] = [];
  const walk = (n: HeadingOutlineNode, depth: number) => {
    if (n.line >= 0) {
      out.push({
        depth,
        line: n.line,
        rawLine: n.rawLine,
        title: n.title,
      });
    }
    for (const c of n.children) walk(c, depth + 1);
  };
  for (const c of root.children) walk(c, 0);
  return out;
}

export function headingLevelFromLine(line: string): number | null {
  const m = line.match(/^(#{1,6})\s/);
  return m ? m[1].length : null;
}

/** Line index after the last line that belongs to this heading’s subtree. */
export function subtreeExclusiveEndLine(lines: string[], headingLine: number): number {
  const lv = headingLevelFromLine(lines[headingLine]);
  if (lv == null) return headingLine + 1;
  for (let i = headingLine + 1; i < lines.length; i++) {
    const pl = headingLevelFromLine(lines[i]);
    if (pl != null && pl <= lv) return i;
  }
  return lines.length;
}

export function buildNewHeadingLine(level: number, title: string): string {
  const hashes = "#".repeat(Math.min(6, Math.max(1, level)));
  const t = title.trim().length ? title.trim() : "New node";
  return `${hashes} ${t}`;
}

/** Insert a deeper heading immediately after the parent heading line. */
export function insertChildHeadingLines(
  lines: string[],
  parentHeadingLine: number,
  title: string,
): { lines: string[]; newHeadingLine: number } {
  const pl = headingLevelFromLine(lines[parentHeadingLine]);
  const level = Math.min(6, (pl ?? 1) + 1);
  const insertAt = parentHeadingLine + 1;
  const next = lines.slice();
  next.splice(insertAt, 0, buildNewHeadingLine(level, title));
  return { lines: next, newHeadingLine: insertAt };
}

/** Insert a same-level heading after the current heading’s subtree. */
export function insertSiblingHeadingLines(
  lines: string[],
  headingLine: number,
  title: string,
): { lines: string[]; newHeadingLine: number } {
  const pl = headingLevelFromLine(lines[headingLine]);
  if (pl == null) return { lines: lines.slice(), newHeadingLine: headingLine };
  const end = subtreeExclusiveEndLine(lines, headingLine);
  const next = lines.slice();
  next.splice(end, 0, buildNewHeadingLine(pl, title));
  return { lines: next, newHeadingLine: end };
}

/** If there are no headings, prepend a root `#` heading. */
export function ensureLeadingHeading(content: string, title: string): string {
  const lines = content.split(/\r?\n/);
  const hasHeading = lines.some((l) => headingLevelFromLine(l) != null);
  if (hasHeading) return content;
  if (lines.length === 1 && lines[0].trim() === "") return `${buildNewHeadingLine(1, title)}\n`;
  const block = buildNewHeadingLine(1, title);
  if (content.length === 0) return `${block}\n`;
  return `${block}\n${content}`;
}

/** Build replacement heading line while preserving spacing style when possible. */
export function buildHeadingLine(level: number, newTitle: string, previousRaw: string): string {
  const trimmedTitle = newTitle.trim();
  const prefixMatch = previousRaw.match(/^(#{1,6})(\s+)/);
  const hashes = "#".repeat(Math.min(6, Math.max(1, level)));
  const space = prefixMatch?.[2] ?? " ";
  return `${hashes}${space}${trimmedTitle}`;
}

/** Visible topic text for mind-map nodes (light markdown cleanup). */
export function stripInlineMarkdownForTopic(s: string): string {
  return s
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .trimEnd();
}

function expandedLeadingLen(s: string): number {
  let n = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    n += ch === "\t" ? 4 : 1;
  }
  return n;
}

/** `- item`, `* item`, `1. item`, `- [ ] task` */
export function parseListLine(raw: string): { indent: number; body: string } | null {
  const task = raw.match(/^(\s*)(-\s+\[[ xX]\]\s+)(.*)$/);
  if (task) {
    return { indent: expandedLeadingLen(task[1]!), body: task[3]!.trimEnd() };
  }
  const m = raw.match(/^(\s*)(?:[-*+]|\d+\.)\s+(.*)$/);
  if (!m) return null;
  return { indent: expandedLeadingLen(m[1]!), body: m[2]!.trimEnd() };
}

/** Replace only the text after the list marker / task checkbox. */
export function replaceListLineBody(raw: string, newBody: string): string | null {
  const trimmed = newBody.trimEnd();
  const task = raw.match(/^(\s*-\s+\[[ xX]\]\s+)(.*)$/);
  if (task) return `${task[1]}${trimmed}`;
  const ol = raw.match(/^(\s*)(\d+\.\s+)(.*)$/);
  if (ol) return `${ol[1]}${ol[2]}${trimmed}`;
  const bullet = raw.match(/^(\s*)([-*+]\s+)(.*)$/);
  if (bullet) return `${bullet[1]}${bullet[2]}${trimmed}`;
  return null;
}

export interface ListTreeNode {
  line: number;
  rawLine: string;
  topic: string;
  children: ListTreeNode[];
}

/**
 * Parse bullet / ordered / task list lines in `[startLine, endLineExclusive)`.
 * Nested levels use CommonMark-style indentation (every 2 spaces = one depth step).
 */
export function parseListForest(lines: string[], startLine: number, endLineExclusive: number): ListTreeNode[] {
  type Row = { line: number; indent: number; body: string; raw: string };
  const rows: Row[] = [];
  for (let i = Math.max(0, startLine); i < endLineExclusive && i < lines.length; i++) {
    const raw = lines[i];
    const pl = parseListLine(raw);
    if (!pl) continue;
    rows.push({
      line: i,
      indent: pl.indent,
      body: pl.body,
      raw,
    });
  }
  if (rows.length === 0) return [];

  const minInd = Math.min(...rows.map((r) => r.indent));
  const stack: { depth: number; node: ListTreeNode }[] = [];
  const roots: ListTreeNode[] = [];

  for (const r of rows) {
    const depth = Math.max(0, Math.floor((r.indent - minInd) / 2));
    const node: ListTreeNode = {
      line: r.line,
      rawLine: r.raw,
      /** Raw list body (may contain `**bold**`, `` `code` ``) — rendered via Mind Elixir `markdown`. */
      topic: r.body.trim().length ? r.body : "(empty)",
      children: [],
    };
    while (stack.length > 0 && stack[stack.length - 1]!.depth >= depth) {
      stack.pop();
    }
    if (stack.length === 0) {
      roots.push(node);
    } else {
      const parent = stack[stack.length - 1]!.node;
      parent.children.push(node);
    }
    stack.push({ depth, node });
  }

  return roots;
}
