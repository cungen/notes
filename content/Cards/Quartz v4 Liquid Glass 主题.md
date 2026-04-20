---
title: Quartz Liquid Glass 主题（v5）
draft: false
tags:
  - Quartz
  - Quartz-v5
  - Obsidian
  - UI-Design
  - Glassmorphism
date: 2026-04-20
---

# Quartz Liquid Glass 主题指南

目标：把这篇笔记改成「如何在 Quartz 里做 Liquid Glass 风格主题」的可执行指南。本仓库已升级到 **Quartz v5**。

## Quartz v5 与 sea-glass 安装（当前仓库）

- **官方升级**：Quartz v5 使用 `quartz.config.yaml` + `quartz.lock.json`，插件在 `.quartz/plugins/`（`npm ci` 会跑 `prebuild` → `install-plugins` 从 lockfile 安装）。Node 要求 **≥ 22**（见 `package.json` engines）。
- **sea-glass（quartz-themes）**：README 写明支持 Quartz v5，安装方式三选一：
  1. **CI（推荐）**：在 `deploy.yml` 里设 `THEME_NAME: sea-glass`，在 `npm ci` 之后、`npx quartz build` 之前执行  
     `curl -s -S https://raw.githubusercontent.com/saberzero1/quartz-themes/master/action.sh | bash -s -- $THEME_NAME`  
     仓库：<https://github.com/saberzero1/quartz-themes>
  2. **本地脚本**：下载 `action.sh` 后执行 `./action.sh sea-glass`（会改 `quartz/styles/custom.scss` 等）。
  3. **手动**：把 `themes/sea-glass/_index.scss` 存为 `quartz/styles/themes/_index.scss`，并在 `quartz/styles/custom.scss` 的 `@use "./base.scss";` 下一行加 `@use "./themes";`。
- **构建注意**：`og-image` 插件生成社交图时会 **拉取字体**；无网络环境会报 `CustomOgImages: fetch failed`。本地需联网构建，或把 `quartz.config.yaml` 里 `github:quartz-community/og-image` 设为 `enabled: false`。

## 1) Existing Beauti Themes（现有好看主题）

先说明：目前 Quartz 生态里，严格意义上的 “Liquid Glass” 主题不多，更多是“有玻璃感元素”的主题。  
可以先从这些主题拿到视觉基础，再继续改造成你自己的 Liquid Glass 风格：

- 主题集合（核心入口）  
  - <https://github.com/saberzero1/quartz-themes>
- 可参考的美观主题（含玻璃倾向）  
  - `sea-glass`: <https://quartz-themes.github.io/sea-glass>  
  - `glass-robo`: <https://quartz-themes.github.io/glass-robo>  
  - `ultra-lobster.abaddon-glass`: <https://quartz-themes.github.io/ultra-lobster.abaddon-glass>  
  - `transparent`: <https://quartz-themes.github.io/transparent>  
  - `blur`: <https://quartz-themes.github.io/blur>

在本仓库里，当前已接入 `sea-glass` 作为基底主题：

- 主题入口：`quartz/styles/custom.scss`
- 主题文件：`quartz/styles/themes/_index.scss`

## 2) How To Build A Theme（如何构建一个 Quartz 主题）

结合本项目，推荐用这套结构：

1. **配置层：`quartz.config.yaml`（Quartz v5）**
   - 管站点级配置与插件列表；`configuration.theme` 里可配字体与亮暗色板。
   - 适合定义“品牌层”的视觉系统。

2. **样式层：`quartz/styles/custom.scss`**
   - 作为唯一样式入口，负责引入基础样式和主题样式。
   - 例如：
     - `@use "./base.scss";`
     - `@use "./themes";`

3. **主题实现层：`quartz/styles/themes/_index.scss`**
   - 在这里写主题细节（变量覆盖 + 组件规则）。
   - 推荐顺序：
     1) 全局变量  
     2) 布局容器  
     3) 组件样式（nav/card/search/code/popup）  
     4) 响应式优化

4. **验证流程**
   - 本地构建：`npx quartz build`
   - 验证长文可读性、代码块对比度、移动端性能。

实践经验（本仓库）：

- 用自动脚本拉取主题时可能出现路径问题，所以稳定方案是手动放置 `_index.scss` 到 `quartz/styles/themes/`，并在 `custom.scss` 中显式引入 `themes`。

## 3) Liquid Glass Theme 需要改什么

Liquid Glass 的关键不是只加 blur，而是「层次、折射感、可读性」三者平衡。建议按下面改：

### A. 基础视觉 Token（先改）

- 背景分层：深背景 + 半透明前景层
- 文本层级：正文/次级/弱化文字对比清晰
- 统一圆角：卡片、输入框、弹层保持一致
- 边框语言：统一使用低透明浅色边框

建议范围（dark mode）：

- 面板底色：`rgba(255,255,255,0.06 ~ 0.12)`
- 边框：`1px solid rgba(255,255,255,0.12 ~ 0.22)`
- 模糊：`backdrop-filter: blur(12px ~ 20px)`
- 阴影：低半径、低不透明度，避免“厚重卡片感”

### B. 高价值组件（优先改）

优先这几块，最能体现 Liquid Glass：

1. 顶部导航 / Header  
2. 左右侧栏卡片  
3. 搜索框与搜索结果弹层  
4. 目录、popover、callout 容器  
5. 代码块容器外框（代码本体对比度不要牺牲）

### C. 动效与交互（加分项）

- hover 时只做微弱亮度变化与边框增强
- 避免大幅位移动画，保持“平滑、轻、稳”
- 可加极轻微高光叠层（pseudo-element）模拟玻璃反射

### D. 可读性与性能红线（必须守）

- 正文对比度永远优先于视觉效果
- blur 不宜全站泛滥，集中在容器层
- 移动端降 blur、降阴影、降半透明层数量
- 代码块与链接颜色必须保持识别度

## 可直接复用的实施步骤

1. 以 `sea-glass` 为基底，保留当前接入。  
2. 在 `quartz/styles/themes/_index.scss` 分区改造：先 token、后组件。  
3. 先完成 Header / Card / Search 三件套液态化。  
4. 用 3 篇长文 + 3 篇短文 + 1 篇代码重文做验收。  
5. 移动端二次压缩效果（blur/阴影/透明度）后再发布。

## 参考资源

- Quartz Themes 仓库：<https://github.com/saberzero1/quartz-themes>
- GlassKit（组件灵感）：<https://github.com/JUNGHERZ/GlassKit>
- Glass UI（视觉参考）：<https://github.com/themesberg/glass-ui>
- 参数生成器：<https://glassmorphism.com/>

