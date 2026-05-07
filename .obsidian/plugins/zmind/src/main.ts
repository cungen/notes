import { Notice, Plugin } from "obsidian";
import { ZmindView, ZMIND_VIEW_TYPE } from "./view";

export default class ZmindPlugin extends Plugin {
  async onload() {
    this.registerView(ZMIND_VIEW_TYPE, (leaf) => new ZmindView(leaf));

    this.addCommand({
      id: "zmind-open-split",
      name: "Zmind: open mind map beside editor",
      callback: () => void this.openBesideEditor(),
    });

    this.addRibbonIcon("git-branch", "Zmind", () => {
      void this.openBesideEditor();
    });
  }

  onunload() {
    this.app.workspace.detachLeavesOfType(ZMIND_VIEW_TYPE);
  }

  /**
   * Vertical split places the new pane to the right (two columns).
   * Markdown stays on the left; Zmind fills the right pane when CSS is correct.
   */
  private async openBesideEditor() {
    const file = this.app.workspace.getActiveFile();
    if (!file || file.extension !== "md") {
      new Notice("Open a Markdown note first.");
      return;
    }

    const leaf = this.app.workspace.getLeaf("split", "vertical");
    await leaf.setViewState({
      type: ZMIND_VIEW_TYPE,
      active: true,
      state: { file: file.path },
    });
    await this.app.workspace.revealLeaf(leaf);
  }
}
