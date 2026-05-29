---
title: Harness Engineering 备忘
date: 2026-05-26
tags:
  - area/ai
  - topic/harness-engineering
  - kind/memo
layer: raw
managedBy: llm
status: draft
sources:
  - https://mp.weixin.qq.com/s/ks91g0uHewzb84GJsgJ1fg
---

# Harness Engineering 备忘

## 一句话定义

**Harness Engineering** = 围绕 AI Agent 搭建可控、可验证、可观测的运行外壳的工程思想。

> Agent Harness 是框架（Framework），Harness Engineering 是框架的设计与落地规范。

**与 SDK/框架的区别**：LangChain/LangGraph 回答"怎么造 Agent"，Harness 回答"Agent 运行时，世界如何与它交互"。

## 核心架构（3 支柱 + 2 原则）

| 维度 | 核心能力 | 关键点 |
|------|---------|--------|
| **上下文工程** | 信息喂养层 | 对抗 context rot（关键内容在上下文中间时模型表现下降 30%+） |
| **架构约束** | 边界执行层 | 确定性规则引擎硬管控，违规直接拦截 |
| **熵增对抗** | 长期保活层 | 定期运行"垃圾收集 Agent"，以 Agent 对抗系统退化 |
| **检查点机制** | 可回滚 | 长任务定期快照，失败可从断点恢复 |
| **人工介入节点** | 可审计 | 高风险操作前强制暂停，等待人工确认 |

## 熵增对抗——为什么有用

软件熵增是 Agent 长期运行中最隐蔽也最致命的问题：文档腐化、架构漂移、代码不一致会悄悄积累。

**解法**：部署专职清理 Agent（不创造功能，只做清洁工）——扫描文档矛盾、发现架构违规、清理技术债务。

> 与 DevOps 持续重构一脉相承，只是执行者从人变成了 Agent。

## 技术演进路径

三层叠加、向上包含，不是替代关系：

```
Vibe Coding → Spec Coding → Harness Engineering
（快速生成）    （规格对齐）    （系统可信赖）
```

- **Vibe Coding**：Cursor / Openclaw → 个人项目、MVP
- **Spec Coding**：+ 技术规格约束 → 团队协作
- **Harness Engineering**：+ 工程化运行环境 → 企业生产

**关键数据**：
- LangChain：仅优化 Harness，得分 52.8% → 66.5%
- Vercel：移除 80% 工具后成功率反而更高 → **精准设计 > 能力堆砌**

## 什么时候用 / 不用

**适合**：多 Agent 协同、操作风险高、长任务需断点恢复、有合规审计要求。
**不适合**：简单 RPA 已够、基础设施薄弱、ROI 过低。

> 2026 年的竞争不是"谁的 Agent 更智能"，而是"谁的 Harness 更完善"。
