---
title: Quartz插件开发：Header导航与Tag Cloud页面
draft: false
tags:
  - Inbox
  - Area/AI/Agent/ACP
  - Area/Quartz
  - Plugin
date: 2026-04-26
---

## 目标

在 Quartz 里实现两件事：

1. 页面头部显示自定义导航（Header Nav）
2. 新增一个 Tag Cloud 页面（按标签频次展示）

这份笔记基于 **官方文档 + 你当前仓库源码** 整理，按可执行步骤写成。

---

## 我查到的关键资料

- 官方插件开发文档：<https://quartz.jzhao.xyz/advanced/making-plugins>
- 官方组件开发文档：<https://quartz.jzhao.xyz/advanced/creating-components>
- 官方 TagPage 文档：<https://quartz.jzhao.xyz/plugins/TagPage>
- Quartz v4 源码示例（Emitter）：
  - <https://github.com/jackyzha0/quartz/blob/v4/quartz/plugins/emitters/contentPage.tsx>
  - <https://github.com/jackyzha0/quartz/blob/v4/quartz/plugins/emitters/tagPage.tsx>

你本地仓库中最关键的对照点：

- 插件类型定义：`quartz/plugins/types.ts`
- Tag 页 emitter 参考实现：`quartz/plugins/emitters/tagPage.tsx`
- 插件安装入口：`quartz/plugins/loader/install-plugins.ts`
- 本地插件源支持逻辑（可直接用本地路径）：`quartz/plugins/loader/gitLoader.ts`
- 当前配置文件：`quartz.config.yaml`

---

## 先理解你当前 Quartz 版本的插件机制

你现在这套 Quartz（`package.json` 显示 `5.0.0`）是 **插件加载器模式**：

- `quartz.config.yaml` 的 `plugins` 数组里配置插件（`source` + `enabled` + `options` + `layout`）
- 可以从 `github:owner/repo` 拉插件
- 也支持本地路径（如 `./plugins/my-plugin`）作为 source
- 构建前会走：
  - `npm run install-plugins`
  - `npm run regenerate-plugin-index`

也就是说，你的最佳实践是：**把自定义功能做成独立插件包，然后通过 `quartz.config.yaml` 加载**。

---

## 实现方案（推荐）

推荐拆成一个插件包，里面包含：

- 1 个组件插件：HeaderNav（放在页面 header 区域）
- 1 个 emitter 插件：TagCloudPage（生成 `tags-cloud/index.html`）

这样结构清晰，后续复用和开源都方便。

---

## Step 1：创建本地插件目录

示例目录（放在仓库根目录）：

```txt
plugins/quartz-nav-tagcloud/
  package.json
  tsconfig.json
  src/
    index.ts
    HeaderNav.tsx
    TagCloudPage.tsx
```

说明：

- `HeaderNav.tsx`：组件，负责渲染顶部导航
- `TagCloudPage.tsx`：Emitter，负责扫描 `allFiles` 生成 tag cloud 页面
- `index.ts`：统一导出插件入口

---

## Step 2：Header Nav（组件）

核心思路：

1. 组件读取固定导航配置（如 Home / Tags / About）
2. 组件按当前页面 slug 高亮 active 项
3. 在插件 manifest 里声明默认布局位置为 `header`
4. 在 `quartz.config.yaml` 中可覆盖 priority / display / group

你现在 `quartz.layout.ts` 中 `sharedPageComponents.header` 是空数组，所以最自然的方式就是让插件通过 layout 注入到 `header` 区域。

---

## Step 3：Tag Cloud 页面（Emitter）

建议直接参考你本地 `quartz/plugins/emitters/tagPage.tsx` 的套路：

1. 遍历 `content` 拿到 `allFiles`
2. 收集 `frontmatter.tags`
3. 统计标签频次（支持层级标签前缀可选）
4. 生成虚拟 slug：`tags-cloud`
5. 用 `renderPage(...)` 输出 HTML
6. `emit` 返回写出的文件路径

推荐行为：

- 字号按频次映射（min/max clamp）
- 标签按频次降序 + 名称升序
- 点击跳转到 `/tags/<tag>`（和现有 TagPage 对齐）

---

## Step 4：在 `quartz.config.yaml` 里接入本地插件

你现在已经在用 `plugins:` 数组模式。新增本地插件可按这个思路：

1. 增加 `externalPlugins`（用于安装/链接本地插件）
2. 在 `plugins:` 里新增两条（HeaderNav 组件项 + TagCloudPage emitter 项）

示意（字段名按你当前 loader 规范调整）：

```yaml
externalPlugins:
  - ./plugins/quartz-nav-tagcloud

plugins:
  - source: ./plugins/quartz-nav-tagcloud
    enabled: true
    options:
      nav:
        - label: Home
          href: /
        - label: Tags
          href: /tags
        - label: Tag Cloud
          href: /tags-cloud
    layout:
      position: header
      priority: 10
```

如果该插件导出多个条目（组件 + emitter），通常会由插件 manifest/导出名区分；具体以你插件导出的命名为准。

---

## Step 5：本地开发与调试命令

在仓库根目录执行：

```bash
npm run install-plugins
npm run regenerate-plugin-index
npm run dev
```

每次修改插件后，优先确认：

- 插件是否被正确链接到 `.quartz/plugins/...`
- 是否生成了最新索引（`regenerate-plugin-index`）
- 页面上是否出现 Header Nav
- `/tags-cloud` 路由是否可访问并渲染数据

---

## Step 6：最低可行验收清单（MVP）

- 所有页面头部显示导航栏
- 当前页面对应 nav 项可高亮
- `tags-cloud` 页面可访问
- 页面展示 >= 1 个标签时不报错
- 无标签内容时显示 empty state
- 点击标签能跳转到对应 `tags/<tag>` 页面

---

## 常见坑位（你这套配置尤其要注意）

1. **只写了插件代码，没跑 install/regenerate**
   - 结果：构建时找不到导出，或用到旧版本

2. **插件导出名和配置引用名不一致**
   - 结果：插件加载成功但功能不生效

3. **Tag Cloud 链接路径和 TagPage 输出路径不一致**
   - 结果：点击跳 404

4. **忘了处理层级标签**
   - 比如 `a/b` 是否同时计入 `a`，建议做成可配置项

---

## 可直接复用的源码参考点

- 插件接口定义：`quartz/plugins/types.ts`
- emitter 页面渲染骨架：`quartz/plugins/emitters/tagPage.tsx`
- 构建页时组件数据结构：`quartz/components/types.ts`
- 配置入口范式：`quartz.config.yaml`

---

## 结论（你现在应该怎么做）

1. 在仓库里建 `plugins/quartz-nav-tagcloud`
2. 先做 HeaderNav 组件（最快可见结果）
3. 再做 TagCloudPage emitter（复用 TagPage 思路）
4. 在 `quartz.config.yaml` 里声明本地插件并配置 layout 到 `header`
5. 跑 `install-plugins -> regenerate-plugin-index -> dev` 验证

如果你愿意，我下一步可以直接帮你把这个插件骨架（含可运行的 `HeaderNav.tsx` + `TagCloudPage.tsx`）一次性落到仓库里。
