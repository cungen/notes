import type { TFile, Vault } from "obsidian";

export type ContentBaseline = {
  content: string;
};

export async function readBaseline(vault: Vault, file: TFile): Promise<ContentBaseline> {
  const content = await vault.read(file);
  return { content };
}

/**
 * Compare-and-swap line edit: aborts if the file no longer matches `baseline`.
 */
export async function safeReplaceLine(
  vault: Vault,
  file: TFile,
  baseline: ContentBaseline,
  lineIndex: number,
  expectedLine: string,
  newLine: string,
): Promise<{ ok: true; next: ContentBaseline } | { ok: false; reason: string }> {
  const current = await vault.read(file);
  if (current !== baseline.content) {
    return {
      ok: false,
      reason:
        "Note changed on disk since this mind map loaded. Reloaded from disk — edit again if needed.",
    };
  }
  const lines = current.split(/\r?\n/);
  if (lineIndex < 0 || lineIndex >= lines.length) {
    return { ok: false, reason: "That line is no longer in the file." };
  }
  if (lines[lineIndex] !== expectedLine) {
    return {
      ok: false,
      reason:
        "That line changed since the last load. The mind map was refreshed.",
    };
  }
  lines[lineIndex] = newLine;
  const nextContent = lines.join("\n");
  await vault.modify(file, nextContent);
  return { ok: true, next: { content: nextContent } };
}

/** Full-document replace only when content still matches baseline (no stale overwrites). */
export async function safeApplyContent(
  vault: Vault,
  file: TFile,
  baseline: ContentBaseline,
  nextContent: string,
): Promise<{ ok: true; next: ContentBaseline } | { ok: false; reason: string }> {
  const current = await vault.read(file);
  if (current !== baseline.content) {
    return {
      ok: false,
      reason:
        "Note changed on disk since this mind map loaded. Reloaded from disk — try again.",
    };
  }
  await vault.modify(file, nextContent);
  return { ok: true, next: { content: nextContent } };
}
