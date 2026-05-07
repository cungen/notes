import type { MindElixirData, NodeObj } from "mind-elixir";
import {
  parseAtxHeadingTree,
  parseListForest,
  subtreeExclusiveEndLine,
  type HeadingOutlineNode,
  type ListTreeNode,
} from "./parser";

function lineOfNode(o: NodeObj): number {
  const m = o.metadata as { line?: number } | undefined;
  return typeof m?.line === "number" ? m.line : 0;
}

function listTreeToNodeObj(t: ListTreeNode): NodeObj {
  const obj: NodeObj = {
    id: `L${t.line}`,
    topic: t.topic,
    metadata: { line: t.line, kind: "list" } as { line: number; kind: string },
    /** Match Mind Elixir “main topic” chip look — plain list rows otherwise render like unstyled text. */
    style: {
      background: "var(--main-bgcolor-transparent)",
      color: "var(--main-color)",
      border: "1px solid var(--main-color)",
    },
  };
  if (t.children.length > 0) {
    obj.children = t.children.map(listTreeToNodeObj);
  }
  return obj;
}

function mergeChildrenByLine(listNodes: NodeObj[], headingNodes: NodeObj[]): NodeObj[] {
  return [...listNodes, ...headingNodes].sort((a, b) => lineOfNode(a) - lineOfNode(b));
}

function headingToNode(n: HeadingOutlineNode, lines: string[]): NodeObj {
  const sectionEnd = n.children.length > 0 ? n.children[0]!.line : subtreeExclusiveEndLine(lines, n.line);
  const listRoots = parseListForest(lines, n.line + 1, sectionEnd);
  const listObjs = listRoots.map(listTreeToNodeObj);
  const headingKids = n.children.map((c) => headingToNode(c, lines));
  const merged = mergeChildrenByLine(listObjs, headingKids);

  const obj: NodeObj = {
    id: `L${n.line}`,
    topic: n.title.length ? n.title : "(empty)",
    metadata: { line: n.line, kind: "heading" } as { line: number; kind: string },
  };
  if (merged.length > 0) {
    obj.children = merged;
  }
  return obj;
}

/** Convert ATX heading tree + list items to Mind Elixir data. */
export function markdownToMindElixirData(content: string, noteTitle: string): MindElixirData {
  const lines = content.split(/\r?\n/);
  const tree = parseAtxHeadingTree(content);
  const roots = tree.children;
  const title = noteTitle.replace(/\.md$/i, "") || "Note";

  if (roots.length === 0) {
    return {
      nodeData: {
        id: "zm-empty",
        topic: title,
        note: "Add # headings to build the map.",
      },
    };
  }

  if (roots.length === 1) {
    return {
      nodeData: headingToNode(roots[0]!, lines),
    };
  }

  return {
    nodeData: {
      id: "zm-root",
      topic: title,
      children: roots.map((r) => headingToNode(r, lines)),
    },
  };
}
