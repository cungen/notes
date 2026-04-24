---
title: Agent上下文压缩策略调研与落地计划
draft: false
tags:
  - area/ai/agent/acp
  - kind/note
  - state/draft
date: 2026-04-13
---

## 目标

基于以下仓库与公开资料，提炼一套适用于 `agent-trivial` 的上下文压缩策略，并形成后续实现路线：

- 本地仓库对比：
  - `claw-code`
  - `hermes-agent`
- 外部资料补充：
  - Cursor 动态上下文发现
  - OpenClaw Compaction
  - Anthropic Compaction / Context Editing
  - OpenAI Agents Session Memory（trim + summarize）

## 核心结论（一句话）

最优解不是“只做摘要”，而是 **分层治理**：先做可逆减负（工具结果清理/外置化），再做语义压缩（摘要），并配合请求前硬边界守卫（preflight）与溢出重试。

## 仓库策略对比

### claw-code（偏确定性）

- 强项：
  - 运行时自动 compact，逻辑可预测。
  - provider preflight 对 context window 做硬校验，超限直接阻断。
  - 保留最近消息，旧消息汇总成系统摘要，元信息可追踪。
- 弱项：
  - token 估算偏启发式，可能误差较大。
  - 更偏“结构压缩”，语义保真依赖规则质量。
  - preflight 超限时缺少更柔性的“先急救再重试”路径（可改进）。

### hermes-agent（偏语义滚动压缩）

- 强项：
  - 触发点丰富：预检查、循环内、溢出错误后重试、网关层卫生压缩。
  - 头尾保护 + 中段摘要，兼顾近期上下文与历史连续性。
  - 工具调用对完整性处理更严格（防 orphan）。
- 弱项：
  - 摘要质量更依赖模型与提示词。
  - 估算误差可能引发“压缩过早/过晚”。
  - 失败兜底摘要可能导致语义损失。

## 外部实践提炼

### Cursor：动态上下文发现（Dynamic Context Discovery）

- 大工具输出不直接塞进 prompt，而是写入文件/工件，按需读取。
- 摘要后保留“可检索历史入口”，减少摘要丢失造成的信息不可恢复。
- 价值：显著降低上下文膨胀，减少无效 summarization。

### OpenClaw：Compaction + Retry

- 自动 compact + 溢出自动重试。
- 强调 tool call / tool result 配对不被切断。
- 支持独立 compaction 模型（主模型与摘要模型可分离）。

### Anthropic：Server-side Context Management

- `compaction`：接近阈值时自动摘要并插入 compaction block。
- `clear_tool_uses`：先清历史工具结果（可配置阈值与最小清理量）。
- `pause_after_compaction`：压缩后先暂停，允许应用注入关键状态再继续。

### OpenAI Agents：Trim 与 Summarize 并用

- Trim（last N）确定性强、低延迟。
- Summarize 保留长程语义，但需要防 summary drift。
- 结论：两者按场景组合优于二选一。

## 推荐方案

采用 **四层混合架构**：

1. **L0 - 外置化层（Artifactization）**  
   大型 shell/MCP/tool 输出转存为可检索工件，不把全文注入会话。

2. **L1 - 轻量清理层（Lossless-ish）**  
   优先清理陈旧 tool result / 重复结果，尽量不改写核心对话语义。

3. **L2 - 语义压缩层（Summarization）**  
   仅对“中段历史”做结构化摘要，保留 head 指令与 tail 最近对话。

4. **L3 - 硬边界守卫层（Preflight + Retry）**  
   请求前校验 `input + output <= context_window`；超限时执行“紧急压缩一次 + 单次重试”。

## 触发与阈值建议

- 软阈值（告警）：窗口占用 85%
- 高阈值（强压缩候选）：窗口占用 95%
- 绝对守卫：preflight 超限立即走“急救压缩 + 重试”
- 压缩粒度：
  - 保留 `head`（系统指令/关键约束）
  - 保留 `tail`（最近 N 轮或 token 预算）
  - 压缩 `middle`

## 摘要结构建议（防漂移）

摘要固定结构，避免自由文本漂移：

- 当前目标与范围
- 已完成决策（含原因）
- 已变更/已读取工件（文件、命令输出、外部数据）
- 未决问题与风险
- 下一步可执行动作

## 关键风险与防护

- 风险：摘要漂移（summary drift）  
  防护：固定摘要模板 + 回放抽检 + 关键字段校验。

- 风险：工具调用链断裂  
  防护：压缩后做 tool_use/tool_result 完整性检查。

- 风险：token 估算偏差  
  防护：启发式估算 + provider 真实计数（可用时）双轨。

- 风险：过度压缩导致“失忆”  
  防护：保留检索入口（历史/工件），支持按需回读。

## 最终建议

以 **“先减负、后摘要、再守卫”** 为主线推进：  
先把可逆优化（外置化、清理）做好，再做不可逆摘要压缩，最后由 preflight 和重试兜底。  
这条路线能同时兼顾稳定性、成本与长程任务连续性。
