---
title: 防止AI编程Agent偷懒 — 实用指南
tags:
  - area/ai-engineering
  - kind/guide
  - state/stable
date: 2026-05-13
updated: 2026-05-13
layer: wiki
managedBy: llm
status: active
confidence: high
sources:
  - Anthropic 官方文档 (docs.anthropic.com)
  - GitHub anthropics/claude-code Issues
  - Reddit r/ClaudeAI 社区讨论
  - 社区博客文章
  - oh-my-claudecode (github.com/heymumad/oh-my-claudecode)
---

# 防止 AI 编程 Agent 偷懒 — 实用指南

> AI 编程 Agent（Claude Code / Cursor / Copilot 等）在处理大型任务时普遍存在"偷懒"现象：跳过文件、留 TODO 占位、简化逻辑、静默跳过部分工作。本指南提供一套通用解决方案。

## 为什么 Agent 会偷懒

- **上下文窗口压力** — 任务越大，后期质量越低
- **模式泛化** — 做了几个后说"其余类似"，不再逐个处理
- **输出截断** — 单次回复有长度上限，Agent 自作主张缩减
- **注意力衰减** — 长对话中遵从度下降
- **默认"够用就好"** — 倾向产出看起来能用的代码，而非功能完备的代码

---

## 四条核心原则

### 1. 分块执行，不要一口气喂大任务 ⭐⭐⭐⭐⭐

每次只给 Agent **5-10 个文件**，每批用新会话（fresh context）。

```bash
# ❌ 错误
claude -p "把 src/ 下所有组件迁移到新框架" --max-turns 30

# ✅ 正确
claude -p "处理这 5 个文件：[列出具体文件路径]
保持所有功能完整，不要省略。" --max-turns 15
```

### 2. 写明规则，不要指望 Agent 自觉 ⭐⭐⭐⭐

在项目 `CLAUDE.md` 中加入反偷懒规则：

```markdown
## 完整性要求（强制）
- 绝不使用 TODO / FIXME / placeholder 代替真实实现
- 绝不说"其余文件类似"——必须逐个处理
- 被要求修改多个文件时，必须修改每一个
- 任务完不成就明确说，不要静默跳过
- 完成后列出所有修改过的文件
```

技巧：
- 加入 **before/after 示例**，让 Agent 看到完整产出的标准
- 指定一条**验证命令**（如 `npm test`），要求每次改完都跑
- 规则别写太长——太长本身也会导致 Agent 跳过

### 3. 清单驱动，让 Agent 对着 checklist 打勾 ⭐⭐⭐⭐⭐

```
1. 列出所有待处理文件 → 写入 checklist 文件
2. 让 Agent 每处理一个就勾选 [x]
3. 每批 5-10 项，做完验证再下一批
```

Agent 执行完声称"全部完成"时，用脚本核对清单是否真的都勾了。

### 4. 验证闭环，不验证等于没做完 ⭐⭐⭐⭐⭐

| 验证方式   | 怎么做                                             |
| ------ | ----------------------------------------------- |
| 检查占位符  | `grep -r "TODO\|FIXME\|placeholder\|stub" src/` |
| 检查文件存在 | 脚本遍历 expected-files.txt 逐个 `test -f`            |
| 类型检查   | `npx tsc --noEmit` 或等效命令                        |
| Lint   | `npm run lint`                                  |
| 测试     | `npm run test`                                  |
| 人工抽查   | 随机对比几个源文件和产出的功能列表                               |

让 Agent 在每批完成后**自动跑验证**并修复报错。

---

## Sub-Agent 架构

> 一个 Agent 干活 + 一个 Agent 审查 = 高完成度

### 定义专用 Agent

在项目 `.claude/agents/` 下创建 Agent 定义文件：

**`.claude/agents/worker.md`** — 执行者

```markdown
---
name: worker
description: 执行代码迁移/重构任务
model: sonnet
tools: [Read, Write, Edit, Bash]
---
你是代码迁移专家。

## 规则
- 读取源文件，完整迁移到目标
- 所有功能点必须迁移，不使用 TODO/placeholder/stub
- 完成后运行类型检查和 lint
- 输出迁移报告：列出每个迁移的功能点
```

**`.claude/agents/verifier.md`** — 验证者

```markdown
---
name: verifier
description: 验证迁移/重构的完整性
model: sonnet
tools: [Read, Bash]
---
你是质量审查员，只审查不修改。

## 审查流程
1. 读取原始文件
2. 读取目标文件
3. 逐项对比功能点是否完整
4. 检查是否有 TODO / placeholder / stub
5. 检查错误处理是否保留

## 输出格式
| 功能点 | ✅已迁移 / ❌遗漏 | 说明 |
```

### 调用方式

在 Claude Code 交互模式中：

```
@worker 处理以下 5 个文件：...
@verifier 审查刚才 worker 的产出完整性
```

或用 print mode 脚本化：

```bash
# 执行
claude -p "@worker 处理 checklist 中下 5 个未完成项" --max-turns 20
# 验证
claude -p "@verifier 审查最近处理的文件完整性" --max-turns 10
```

### 并行执行（Worktree）

多个模块同时跑，互不干扰：

```bash
claude -w module-a --tmux -p "处理 module-a 目录下的文件..."
claude -w module-b --tmux -p "处理 module-b 目录下的文件..."
claude -w module-c --tmux -p "处理 module-c 目录下的文件..."
# 完成后合并
```

---

## 工具推荐

### oh-my-claudecode

> GitHub: https://github.com/heymumad/oh-my-claudecode

Claude Code 的任务编排层，把"分块 + 并行 + 验证"自动化。

| 命令 | 用途 |
|------|------|
| `/plan <任务>` | 生成计划 |
| `/decompose <任务>` | 拆解为子任务 |
| `/parallel <任务>` | 并行执行子任务 |
| `/verify` | 验证 Agent 审查 |
| `/orchestrate <任务>` | 完整流水线：计划→拆解→并行→验证 |

安装：`git clone` → `npm install` → `npm link` → 在 `.claude/settings.json` 中启用。

适合不想手动编排子 Agent 的场景。目前社区较小，建议先用小模块试跑。

---

## Prompt 模板

```
你必须完成以下所有文件的迁移，不允许部分完成：
- [列出文件]

要求：
1. 每个文件完整实现，不用 TODO 或 placeholder
2. 不说"其余文件类似"
3. 保持所有原始功能
4. 完成后列出每个文件及其功能清单
5. 运行 [验证命令] 确认无报错

如果任务太大无法完成，明确告诉我还有哪些没处理，不要静默跳过。
```

Prompt 写法对比：
- ✅ "完成**所有**文件" → ❌ "把这些文件处理了"
- ✅ "不要用 TODO" → ❌ "完整实现"（太模糊）
- ✅ "完成后列出修改清单" → 强制自查
- ✅ "做不完就告诉我" → 防止静默跳过
- ✅ 提供具体示例 → Agent 看到标准后质量显著提升

---

## 偷懒模式速查

| Agent 表现 | 对策 |
|-----------|------|
| `// TODO: implement later` | CLAUDE.md 禁止 + 验证脚本 grep |
| "其余文件遵循相同模式" | 分块 + checklist 强制逐文件 |
| 只迁移了部分功能 | before/after 示例 + verifier Agent |
| 简化复杂逻辑 | 要求先解释原逻辑再迁移 |
| 报告"已全部完成"但实际遗漏 | 验证脚本对比文件列表 |
| 删掉错误处理 | CLAUDE.md 明确要求保留 |
| 声称"后面再处理" | 每批必须包含完整功能 |

---

## 参考来源

- [[CLAUDE.md 官方文档]] — docs.anthropic.com/en/docs/claude-code/memory
- [[Claude Code 官方教程]] — docs.anthropic.com/en/docs/claude-code/tutorials
- [[GitHub anthropics/claude-code Issues]] — github.com/anthropics/claude-code/issues
- [[Reddit r/ClaudeAI 讨论]] — 社区经验分享
- [[Anthropic Prompt Engineering Guide]] — docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview
- [[oh-my-claudecode]] — github.com/heymumad/oh-my-claudecode
