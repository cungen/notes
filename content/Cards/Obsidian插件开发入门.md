---
title: Obsidian 插件开发入门
draft: false
tags:
  - Area/Tools/Obsidian
  - Topic/Dev
date: 2026-04-22
---

## 目标

从零开始开发 **Obsidian 社区插件** 时的路径：官方文档、模板仓库、本地目录约定，以及与本仓库（vault）里已安装插件的对照。

## 官方与权威资料

| 资源 | 用途 |
|------|------|
| [Obsidian Developer Docs](https://docs.obsidian.md/) | 官方开发者文档入口；TypeScript API 参考（如 `Plugin` 类） |
| [Plugin（TypeScript API）](https://docs.obsidian.md/Reference/TypeScript+API/Plugin) | 所有插件基类：生命周期、`addCommand`、`registerEvent` 等 |
| [obsidianmd/obsidian-sample-plugin](https://github.com/obsidianmd/obsidian-sample-plugin) | 官方模板：构建脚本、`manifest.json`、`main.ts` 约定 |
| [obsidianmd/obsidian-api](https://github.com/obsidianmd/obsidian-api) | 类型定义（`obsidian` 包）；与 Obsidian 版本对齐 |
| [Obsidian Plugin Developer Docs（社区维护）](https://marcusolsson.github.io/obsidian-plugin-docs/getting-started) | 分步教程，适合「第一篇插件」跟练 |

建议以 **官方 docs + sample-plugin** 为准；社区文档用于补充步骤说明。

## 环境准备

- **Git**：版本管理与发布流程常用。
- **Node.js + npm**（或 pnpm/yarn）：构建与依赖。
- **TypeScript**：插件源码几乎均为 TS；需会基本类型与模块。
- **编辑器**：VS Code / Cursor 等即可。

## 标准项目结构（概念）

社区插件通常包含：

- **`manifest.json`**：插件 id、名称、版本、`minAppVersion`、作者等；Obsidian 用它识别与加载插件。
- **`main.js`**（或构建产物）：实际入口；开发时由 `npm run build` / `npm run dev` 从 `main.ts` 生成。
- **`styles.css`**（可选）：插件样式。
- **`versions.json`**（若上架社区）：与 Obsidian 兼容版本映射（依发布流程而定）。

本仓库已安装插件之一（`Global Proxy`）的 `manifest.json` 字段示例，便于对照真实字段：

```json
{
  "id": "global-proxy",
  "name": "Global Proxy",
  "version": "1.0.4",
  "minAppVersion": "0.15.0",
  "description": "…",
  "author": "…",
  "authorUrl": "…",
  "fundingUrl": "…",
  "isDesktopOnly": true
}
```

本地路径：`/.obsidian/plugins/<插件文件夹>/`（每个插件一个子目录）。

## 创建第一个插件（推荐流程）

1. 在 GitHub 使用 **[obsidian-sample-plugin](https://github.com/obsidianmd/obsidian-sample-plugin)** 的 **Use this template** 生成自己的仓库（或 fork），克隆到本机。
2. 在插件目录执行 **`npm install`**，然后 **`npm run dev`**（持续编译）或 **`npm run build`**（单次构建）。
3. 将插件目录放到 **测试用 vault** 的 `/.obsidian/plugins/<你的插件目录名>/`（可用符号链接便于开发）。
4. Obsidian：**设置 → 第三方插件 → 关闭安全模式（仅测试 vault）→ 启用你的插件**。
5. 修改 **`manifest.json`** 与 **`package.json`** 中的 id、名称、作者等信息，与代码入口保持一致。
6. 在 **`main.ts`** 中继承 `Plugin`，实现 **`onload()`** / **`onunload()`**，用官方 API 注册命令、事件等。

**重要**：不要在「唯一重要数据」的生产库上直接做破坏性实验；单独建 **dev vault** 开发插件。

## `Plugin` 类常用扩展点（速查）

基于官方 API 文档，插件通常通过继承 `Plugin` 使用例如：

- **`addCommand`**：命令面板命令。
- **`addRibbonIcon`**：左侧功能区图标。
- **`addStatusBarItem`**：状态栏项。
- **`addSettingTab`**：设置页。
- **`registerView`**：自定义视图类型。
- **`registerEvent` / `registerDomEvent`**：绑定应用或 DOM 事件，卸载时自动清理。
- **`registerInterval`**：定时器，卸载时取消。
- **`loadData` / `saveData`**：JSON 持久化配置。

详细签名与边界条件以 [docs.obsidian.md 中 Plugin](https://docs.obsidian.md/Reference/TypeScript+API/Plugin) 为准。

## 上架与分发（简述）

若计划发布到 **社区插件列表**：需遵循 Obsidian 团队的 **审核与仓库规范**（README、License、版本号、`minAppVersion` 等）。具体流程以官方开发者文档 / 论坛最新说明为准；模板仓库的 README 通常也会指向相关步骤。

## 延伸阅读关键词

`esbuild` / `rollup`（模板中的打包）、`hot-reload`、semver、`minAppVersion`、BRAT（测试未上架插件的社区工具，按需了解）。
