---
title: "memo_keybindings-json"
draft: false
tags:
  - area/dev/editor
  - kind/memo
  - state/verified
create_at: 2025-03-26T14:28:00
---

```json
// 将按键绑定配置放入此文件中即可覆盖默认值
[
	{
		"key": "cmd+\\",
		"command": "workbench.action.toggleSidebarVisibility"
	},
	{
		"key": "cmd+b",
		"command": "-workbench.action.toggleSidebarVisibility"
	},
	{
		"key": "cmd+b",
		"command": "editor.action.goToDeclaration",
		"when": "editorHasDefinitionProvider && editorTextFocus && !isInEmbeddedEditor"
	},
	{
		"key": "f12",
		"command": "-editor.action.goToDeclaration",
		"when": "editorHasDefinitionProvider && editorTextFocus && !isInEmbeddedEditor"
	},
	{
		"key": "ctrl+cmd+o",
		"command": "outline.focus"
	},
	{
		"key": "ctrl+cmd+w",
		"command": "-workbench.action.toggleTabsVisibility"
	},
	{
		"key": "ctrl+p",
		"command": "-cursorUp",
		"when": "textInputFocus"
	},
	{
		"key": "ctrl+p",
		"command": "-extension.vim_ctrl+p",
		"when": "suggestWidgetVisible && vim.active && vim.use<C-p> && !inDebugRepl || vim.active && vim.use<C-p> && !inDebugRepl && vim.mode == 'CommandlineInProgress' || vim.active && vim.use<C-p> && !inDebugRepl && vim.mode == 'SearchInProgressMode'"
	},
	{
		"key": "ctrl+p",
		"command": "workbench.action.quickOpen"
	},
	{
		"key": "cmd+p",
		"command": "-workbench.action.quickOpen"
	},
	{
		"key": "alt+]",
		"command": "codeium.showNextCompletion"
	},
	{
		"key": "alt+]",
		"command": "-codeium.showNextCompletion"
	},
	{
		"key": "alt+[",
		"command": "codeium.showPreviousCompletion"
	},
	{
		"key": "alt+[",
		"command": "-codeium.showPreviousCompletion"
	},
	{
		"key": "space",
		"command": "-filesExplorer.openFilePreserveFocus",
		"when": "filesExplorerFocus && foldersViewVisible && !explorerResourceIsFolder && !inputFocus"
	},
	{
		"key": "space",
		"command": "whichkey.show",
		"when": "!inputFocus && !sideBarFocus && vim.mode != 'Insert'&&focusedView == ''"
	},
	{
		"key": "ctrl+g",
		"command": "-workbench.action.gotoLine"
	},
	{
		"key": "ctrl+g",
		"command": "-extension.vim_ctrl+g",
		"when": "editorTextFocus && vim.active && vim.use<C-g> && !inDebugRepl"
	},
	{
		"key": "ctrl+g",
		"command": "codeium.acceptCompletion"
	},
	{
		"key": "a",
		"command": "explorer.newFile",
		"when": "filesExplorerFocus && !inputFocus"
	},
	{
		"key": "shift+h",
		"command": "workbench.action.previousEditor",
		"when": "editorFocus && vim.active && vim.mode == 'Normal'"
	},
	{
		"key": "shift+cmd+[",
		"command": "-workbench.action.previousEditor"
	},
	{
		"key": "shift+l",
		"command": "workbench.action.nextEditor",
		"when": "editorFocus && vim.active && vim.mode == 'Normal'"
	},
	{
		"key": "shift+cmd+]",
		"command": "-workbench.action.nextEditor"
	},
	{
		"key": "shift+l",
		"command": "-notebook.toggleLineNumbers",
		"when": "notebookEditorFocused && !inputFocus && !notebookOutputInputFocused"
	},
	{
		"key": "space",
		"command": "vspacecode.space",
		"when": "activeEditorGroupEmpty && focusedView == '' && !whichkeyActive && !inputFocus"
	},
	{
		"key": "space",
		"command": "vspacecode.space",
		"when": "sideBarFocus && !inputFocus && !whichkeyActive"
	},
	{
		"key": "tab",
		"command": "extension.vim_tab",
		"when": "editorTextFocus && vim.active && !inDebugRepl && vim.mode != 'Insert' && editorLangId != 'magit'"
	},
	{
		"key": "tab",
		"command": "-extension.vim_tab",
		"when": "editorTextFocus && vim.active && !inDebugRepl && vim.mode != 'Insert'"
	},
	{
		"key": "x",
		"command": "magit.discard-at-point",
		"when": "editorTextFocus && editorLangId == 'magit' && vim.mode =~ /^(?!SearchInProgressMode|CommandlineInProgress).*$/"
	},
	{
		"key": "k",
		"command": "-magit.discard-at-point"
	},
	{
		"key": "-",
		"command": "magit.reverse-at-point",
		"when": "editorTextFocus && editorLangId == 'magit' && vim.mode =~ /^(?!SearchInProgressMode|CommandlineInProgress).*$/"
	},
	{
		"key": "v",
		"command": "-magit.reverse-at-point"
	},
	{
		"key": "shift+-",
		"command": "magit.reverting",
		"when": "editorTextFocus && editorLangId == 'magit' && vim.mode =~ /^(?!SearchInProgressMode|CommandlineInProgress).*$/"
	},
	{
		"key": "shift+v",
		"command": "-magit.reverting"
	},
	{
		"key": "shift+o",
		"command": "magit.resetting",
		"when": "editorTextFocus && editorLangId == 'magit' && vim.mode =~ /^(?!SearchInProgressMode|CommandlineInProgress).*$/"
	},
	{
		"key": "shift+x",
		"command": "-magit.resetting"
	},
	{
		"key": "x",
		"command": "-magit.reset-mixed"
	},
	{
		"key": "ctrl+u x",
		"command": "-magit.reset-hard"
	},
	{
		"key": "y",
		"command": "-magit.show-refs"
	},
	{
		"key": "y",
		"command": "vspacecode.showMagitRefMenu",
		"when": "editorTextFocus && editorLangId == 'magit' && vim.mode == 'Normal'"
	},
	{
		"key": "g",
		"command": "-magit.refresh",
		"when": "editorTextFocus && editorLangId == 'magit' && vim.mode =~ /^(?!SearchInProgressMode|CommandlineInProgress).*$/"
	},
	{
		"key": "g",
		"command": "vspacecode.showMagitRefreshMenu",
		"when": "editorTextFocus && editorLangId == 'magit' && vim.mode =~ /^(?!SearchInProgressMode|CommandlineInProgress).*$/"
	},
	{
		"key": "ctrl+j",
		"command": "workbench.action.quickOpenSelectNext",
		"when": "inQuickOpen"
	},
	{
		"key": "ctrl+k",
		"command": "workbench.action.quickOpenSelectPrevious",
		"when": "inQuickOpen"
	},
	{
		"key": "ctrl+j",
		"command": "selectNextSuggestion",
		"when": "suggestWidgetMultipleSuggestions && suggestWidgetVisible && textInputFocus"
	},
	{
		"key": "ctrl+k",
		"command": "selectPrevSuggestion",
		"when": "suggestWidgetMultipleSuggestions && suggestWidgetVisible && textInputFocus"
	},
	{
		"key": "ctrl+l",
		"command": "acceptSelectedSuggestion",
		"when": "suggestWidgetMultipleSuggestions && suggestWidgetVisible && textInputFocus"
	},
	{
		"key": "ctrl+j",
		"command": "showNextParameterHint",
		"when": "editorFocus && parameterHintsMultipleSignatures && parameterHintsVisible"
	},
	{
		"key": "ctrl+k",
		"command": "showPrevParameterHint",
		"when": "editorFocus && parameterHintsMultipleSignatures && parameterHintsVisible"
	},
	{
		"key": "ctrl+j",
		"command": "selectNextCodeAction",
		"when": "codeActionMenuVisible"
	},
	{
		"key": "ctrl+k",
		"command": "selectPrevCodeAction",
		"when": "codeActionMenuVisible"
	},
	{
		"key": "ctrl+l",
		"command": "acceptSelectedCodeAction",
		"when": "codeActionMenuVisible"
	},
	{
		"key": "ctrl+h",
		"command": "file-browser.stepOut",
		"when": "inFileBrowser"
	},
	{
		"key": "ctrl+l",
		"command": "file-browser.stepIn",
		"when": "inFileBrowser"
	},
	{
		"key": "shift+a",
		"command": "explorer.newFolder",
		"when": "filesExplorerFocus && !inputFocus"
	},
	{
		"key": "shift+cmd+l",
		"command": "editor.action.selectHighlights",
		"when": "editorFocus"
	},
	{
		"key": "shift+cmd+l",
		"command": "-editor.action.selectHighlights",
		"when": "editorFocus"
	},
	{
		"key": "shift+cmd+l",
		"command": "tongyi.show.panel",
		"when": "TongyiLingMa.Chat.active"
	},
	{
		"key": "shift+cmd+l",
		"command": "-tongyi.show.panel",
		"when": "TongyiLingMa.Chat.active"
	},
	{
		"key": "ctrl+cmd+k",
		"command": "bookmarks.toggle",
		"when": "editorTextFocus"
	},
	{
		"key": "alt+cmd+k",
		"command": "-bookmarks.toggle",
		"when": "editorTextFocus"
	},
	{
		"key": "ctrl+cmd+l",
		"command": "bookmarks.jumpToNext",
		"when": "editorTextFocus"
	},
	{
		"key": "alt+cmd+l",
		"command": "-bookmarks.jumpToNext",
		"when": "editorTextFocus"
	},
	{
		"key": "ctrl+cmd+j",
		"command": "bookmarks.jumpToPrevious",
		"when": "editorTextFocus"
	},
	{
		"key": "alt+cmd+j",
		"command": "-bookmarks.jumpToPrevious",
		"when": "editorTextFocus"
	},
	{
		"key": "ctrl+shift+l",
		"command": "aichat.insertselectionintochat"
	},
	{
		"key": "shift+cmd+l",
		"command": "-aichat.insertselectionintochat"
	}
]
```