---
title: Tags标签使用指南
draft: false
tags:
  - area/knowledge/pkm
  - kind/synthesis
  - state/stable
date: 2026-04-24
---

## 为什么要有这篇

以后给 `content/Cards` 和 `content/Memos` 选标签时，先看这篇，不再临场发明标签。

## 总原则

- 每篇先选 1 个主轴
- 再补 1 个 `kind/*`
- 再补 1 个 `state/*`
- 未整理完再加 `inbox`

## 标签轴定义

### 主轴

主轴只三类，而且每篇只选 1 个：

- `area/*`：这篇笔记的核心是我的理解、方法、判断、知识沉淀
- `resource/*`：这篇笔记的核心是外部资料、来源材料、摘录或素材收纳
- `project/*`：这篇笔记的核心是服务某个具体项目、目标或阶段产出

### 辅轴

可按需补：

- `kind/*`：笔记类型
- `state/*`：当前状态
- `inbox`：待整理

## area 和 resource 怎么区分

只问一句：这篇的重点是在整理外部材料，还是在写我的理解？

- 偏“外部材料对象”，用 `resource/*`
- 偏“我的认知沉淀”，用 `area/*`

## 命名规则

- 英文标签全部小写
- 延续中英混用，但必须带固定前缀
- 不在 frontmatter 里写 `#tag`
- 不使用裸标签，如 `project`、`share`、`obsidian`

## 为什么英文统一小写

Quartz 会对 frontmatter `tags` 做规范化处理。为避免页面链接、索引和展示分裂，英文标签统一用小写。

## 标签总表

### 主轴：area/*

- `area/ai/agent`：Agent、智能体工作流、多代理协作
- `area/ai/agent-memory`：Agent 记忆、上下文管理、长期记忆
- `area/ai/context-engineering`：上下文构造、压缩、信息编排
- `area/ai/eval`：LLM 或 Agent 的评测与评估方法
- `area/ai/infer`：推理、推断流程、模型运行机理
- `area/ai/prompt-engineering`：Prompt 设计、提示策略、提示模式
- `area/ai/rl`：强化学习、RLHF、GRPO、奖励建模
- `area/ai/self-improvement`：自改进、自反馈、自优化代理
- `area/ai/长文本`：长上下文、长文本理解、分块与检索
- `area/ai/论文`：当笔记主要是在总结论文领域知识，而不是做论文摘录时用
- `area/knowledge/pkm`：个人知识管理、卡片体系、知识组织
- `area/rd/db`：数据库、存储、索引、事务
- `area/rd/docker`：Docker、容器化、镜像、运行环境
- `area/rd/editor`：编辑器、IDE、编码工作流
- `area/rd/network`：网络、协议、连接、请求链路
- `area/rd/架构`：软件架构、系统分层、设计取舍
- `area/rd/系统设计`：系统设计题、容量规划、服务拆分
- `area/rd/设计模式`：模式、范式、复用结构
- `area/fe/react`：React、前端组件、状态管理
- `area/tools/obsidian`：Obsidian 使用、插件、知识库工作流
- `area/hardware`：硬件、设备、外设、折腾记录

### 主轴：resource/*

- `resource/llm/文章`：外部文章、博客、帖子摘录
- `resource/llm/api`：API 文档、接口资料、SDK 说明
- `resource/llm/prompt`：Prompt 素材、提示模板、提示案例
- `resource/llm/论文`：论文原文摘录、论文笔记、论文资料页
- `resource/template`：模板、表单、写作骨架、提示模板
- `resource/工具/mac`：Mac 工具、软件配置、使用资料
- `resource/学习笔记`：跟学型笔记，主要是跟着资料记
- `resource/课程`：课程、教程、训练营材料
- `resource/软件`：某软件的说明、资料、功能记录
- `resource/语录`：金句、引用、短摘录
- `resource/游戏`：游戏资料、游戏记录、攻略信息
- `resource/钢琴`：钢琴练习资料、曲目材料
- `resource/生娃`：育儿资料、育儿信息收集
- `resource/祝福`：祝福语、文案素材

### 主轴：project/*

- `project/work`：工作主线相关，但还未细分到单项目名
- `project/work/<name>`：明确服务某个工作项目时用
- `project/personal/<name>`：明确服务某个个人项目时用
- `project/<scope>/<name>`：已有稳定范围与名称时使用

### 辅轴

- `kind/note`：普通笔记、临时记录、未形成完整结构
- `kind/source`：来源页、资料页、外部材料承接页
- `kind/concept`：概念解释页，重点是讲清楚一个概念
- `kind/synthesis`：综合分析页，重点是比较、归纳、整合
- `kind/decision`：决策页，重点是为什么选这个，不选那个
- `state/draft`：初稿，刚记下，尚未整理稳
- `state/active`：正在持续更新，近期还会改
- `state/stable`：结论暂时稳定，可复用
- `state/contested`：有冲突、待验证、结论未定
- `state/archived`：已归档，保留但不再维护
- `inbox`：待整理，不是主题标签

## 怎么选标签

1. 先判断这是领域知识、外部资料，还是项目产物
2. 从 `area/*`、`resource/*`、`project/*` 中只选 1 个主轴
3. 再补 1 个 `kind/*`
4. 再补 1 个 `state/*`
5. 若还没整理完，再加 `inbox`

## 默认组合

- 新 memo：`主轴 + kind/note + state/draft + inbox`
- 整理中的卡片：`主轴 + kind/source` 或 `kind/concept` + `state/active`
- 成熟卡片：`主轴 + kind/synthesis` 或 `kind/decision` + `state/stable`
- 有争议内容：`主轴 + kind/* + state/contested`

## 禁忌清单

- 不同时打两个主轴
- 不使用裸标签
- 不在 frontmatter 里写 `#tag`
- 不混用英文大小写
- 不因检索焦虑堆叠近义标签
- 不把 `inbox` 当主题标签

## 一句话总诀

先定主轴，再补类型，再标状态，未整理就加 `inbox`。
