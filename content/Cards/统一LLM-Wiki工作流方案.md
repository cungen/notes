---
title: 分层 LLM-Wiki 工作流方案
draft: false
tags:
  - Area/AI/Agent/ACP
  - Area/Knowledge/PKM
date: 2026-04-22
---

## 目标

将笔记空间拆分为不同职责目录，同时保持统一检索与回写能力：

- `content/raw/`：原始资料（只读，不直接改写）
- `content/wiki/`：LLM 维护的结构化知识层（可持续更新）
- `content/Cards/`：面向输出与行动的卡片层（你最常读写）

核心原则：**分层存储、统一索引、可追溯回写。**

## 一、目录分层与职责

- `content/raw/`
  - 存网页摘录、论文原文、会议纪要等“事实来源”
  - 视为 immutable source of truth
- `content/wiki/`
  - 存 `entity/concept/synthesis` 等中间知识页
  - 允许 LLM 维护更新
- `content/Cards/`
  - 存决策卡、行动卡、复盘卡、最终沉淀卡
  - 保持你当前习惯与 Quartz 内容发布路径

## 二、数据契约（Frontmatter）

每篇卡片建议统一以下字段：

```yaml
---
title:
draft: false
tags:
  - Inbox
date: 2026-04-22
kind: note                # note | source | concept | synthesis | project | decision
managedBy: human          # human | llm | hybrid
status: draft             # draft | verified | contested | archived
updated: 2026-04-22
sourceCount: 0
confidence: low           # low | medium | high
layer: cards              # raw | wiki | cards
---
```

最小必填建议：

- `title`
- `tags`
- `date`
- `kind`
- `managedBy`
- `status`

## 三、Tag 约定（跨目录统一导航）

沿用并规范已有体系：

- `Inbox`
- `Area/{domain}/{topic}`（如 `Area/AI/Agent`）
- `Resource/{domain}/{topic}`
- `Project/{scope}/{name}`

补充建议：

- `Kind/{kind}`（可选，便于 Dataview）
- `State/{status}`（可选，便于治理）

## 四、页面类型定义（kind）

- `note`：临时记录、灵感卡片、待整理内容。
- `source`：原始信息摘要页（论文/文章/视频）。
- `concept`：概念解释页，可被多个项目复用。
- `synthesis`：跨来源综合分析页（结论/对比/框架）。
- `project`：目标驱动页（任务、里程碑、决策）。
- `decision`：明确选择与约束的决策页。

## 五、LLM 可写规则（防误改）

按 `managedBy` 控制写权限：

- `human`：LLM 默认只读，不自动改正文。
- `llm`：允许自动维护（补链接、更新综述、刷新索引）。
- `hybrid`：允许更新结构化区块，不覆盖“人工结论区”。

分层默认权限建议：

- `raw/`：默认 `managedBy: human`（禁止自动改写正文）
- `wiki/`：默认 `managedBy: llm`
- `Cards/`：默认 `managedBy: hybrid`

建议每页正文保留固定区块：

- `## Summary`
- `## Evidence`
- `## Conflicts`
- `## Open Questions`
- `## Next Actions`

其中 `Summary/Evidence` 可由 LLM 更新；`Open Questions/Next Actions` 鼓励人机协作。

## 六、分层运营流程（Ingest / Query / Lint）

### 1) Ingest（新增资料）

输入：新网页、论文、会议纪要、聊天记录。

步骤（分层版）：

1. 资料入库到 `content/raw/`（`kind=source`, `layer=raw`）。
2. LLM 在 `content/wiki/` 生成/更新：
   - `kind=concept`
   - `kind=synthesis`
   - 实体页与对比页
3. 对高价值结论，回写到 `content/Cards/`（`kind=decision` 或 `kind=note`）。
4. 更新统一索引页与日志页。

### 2) Query（问题驱动检索）

1. 先查统一索引（主题、标签、最近更新）。
2. 优先读 `wiki/` 进行综合，再落地到 `Cards/` 的可执行结论。
3. 将高价值问答沉淀为 `Cards/` 新卡片，并反链到 `wiki/`。

### 3) Lint（健康检查，建议每周）

检查项：

- 孤儿页（无反链）
- 失效结论（长期未更新）
- 低置信度高影响内容
- tag 漂移（同义标签重复）
- `status=draft` 长期未处理
- `raw -> wiki -> Cards` 链路是否断裂（有来源但无综合、有综合但无行动）

## 七、索引与日志（跨目录）

建议保留两张治理页（放在 `content/` 根）：

- `content/index.md`
  - 聚合 `raw/wiki/Cards` 三层入口
  - 按 `Area / Resource / Project / Inbox` 与 `kind` 双维度导航
- `content/log.md`
  - 按时间追加：ingest/query/lint 操作
  - 便于回溯“知识如何演化”

日志头建议：

```md
## [2026-04-22] ingest | <title> | op:<id>
```

## 八、冲突处理协议（关键）

当新资料与旧结论冲突时：

1. 不直接删旧结论。
2. 在 `Conflicts` 区域并列记录：
   - 旧结论
   - 新证据
   - 影响范围
   - 当前判定（待验证/已替换）
3. 将 `status` 标为 `contested`，待下一轮验证。

## 九、与你当前仓库的集成方案（怎么和 LLM-Wiki 对接）

如果你拆分目录，和 LLM-Wiki 的集成建议如下：

1. **Schema 对齐**
   - 在代理规则里明确三层目录职责与 frontmatter 契约。
2. **操作约束**
   - ingest 默认只写 `raw/` 与 `wiki/`
   - `Cards/` 只写“高价值沉淀页”（decision/总结/行动）
3. **跨层链接**
   - `Cards` 页必须包含 `Sources` 区，至少引用 1 个 `wiki` 或 `raw` 页面
   - `wiki` 页包含 `Derived Cards` 区，反链到下游卡片
4. **日志化**
   - 每次 ingest/query/lint 追加到 `content/log.md`
5. **健康检查**
   - 周期检查 `source->synthesis->decision` 是否闭环

## 十、你当前仓库落地顺序（建议）

1. 新建目录：`content/raw`、`content/wiki`（保留 `content/Cards`）。
2. 建 `content/index.md`、`content/log.md` 两张治理页。
3. 先迁移 20 篇高频卡片到新契约（补 `kind/layer/managedBy/status`）。
4. 建立最小 ingest 流程：raw 入库 -> wiki 综合 -> Cards 沉淀。
5. 每周跑一次 lint，先人工处理，再逐步自动化。

## 十一、最小可用版本（MVP）

如果你想马上开始，先执行这 3 条：

- 所有新页必须带：`kind + layer + managedBy + status`
- 每次 ingest 至少产生：1 个 `wiki` 综合页 + 1 个 `Cards` 沉淀页
- 每周一次“孤儿页 + contested 页 + 断链页”巡检

---

参考：

- [flomo - 如何规划标签（P.A.I.R）](https://help.flomoapp.com/thinking/iarp.html)
- [Karpathy - LLM Wiki](https://gist.githubusercontent.com/karpathy/442a6bf555914893e9891c11519de94f/raw/ac46de1ad27f92b28ac95459c782c07f6b8c964a/llm-wiki.md)
