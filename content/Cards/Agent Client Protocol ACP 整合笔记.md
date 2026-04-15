---
title: Agent Client Protocol（ACP）整合笔记
draft: false
tags:
  - Area/AI/Agent/ACP
  - Area/AI/Agent
date: 2026-04-10
---

## 这篇笔记在说什么

把 **ACP（Agent Client Protocol，代理客户端协议）** 和容易混淆的名字、以及 **OpenClaw / 各编辑器** 里怎么用，收拢成一张卡。官方与生态入口：[agentclientprotocol.com](https://agentclientprotocol.com/)。

---

## 先分清三个「ACP」

| 缩写场景 | 全称 | 用途 |
| --- | --- | --- |
| **编程/编辑器里常说的 ACP** | **Agent Client Protocol** | 编辑器/宿主 **↔** 编程代理（Claude Code、OpenCode 等），**类 LSP**：多为 **stdio + JSON-RPC** |
| 另有一套 | Agent **Control** Protocol | **应用 UI 自动化**（manifest + 指令），和「写代码的 ACP」不是一回事 |
| 其它文献 | IBM 等也有 ACP 简称 | 多智能体通信，别和 **Agent Client** 混读 |

下文 **ACP = Agent Client Protocol**。

---

## 核心模型（怎么「连上」）

- **客户端（host）**：Zed、JetBrains AI、Neovim 插件、自研宿主等。
- **代理端（agent）**：提供 ACP 入口的进程，例如 `claude-agent-acp`、`opencode acp`、`codex-acp`、`cursor`/`agent acp` 等。
- **传输**：通常是 **子进程 stdin/stdout**，消息多为 **JSON-RPC 2.0**（不少实现是 **每行一条 JSON / NDJSON**）。
- **能力**：会话 `session/new`、`session/prompt`、流式 `session/update`、权限请求等（具体以各实现为准）。

**不是**单独再起一个名叫「ACP bridge」的通用标准服务；**「桥」**一般指：**谁当 client、谁当 agent 子进程**、或产品自带的 **Gateway + 协议适配**。

---

## 各产品怎么用（速查）

### OpenCode

- 用 **`opencode acp`** 作为子进程命令；在 Zed / JetBrains `acp.json` / Neovim 等里配置 `command` + `args: ["acp"]`。
- 文档：[OpenCode ACP](https://open-code.ai/docs/en/acp)。

### Claude Code

- 原生 **`claude` CLI 不等于 ACP**；需要 **`claude-agent-acp`**（或生态里等价的 ACP 适配层）作为 **agent 进程**。
- Zed / agentclientprotocol 生态里有参考实现仓库（如 `claude-agent-acp` / `claude-code-acp` 一类命名）。

### Cursor

- Cursor 提供 **CLI + ACP** 相关文档（如 `cursor.com/docs/cli/acp`）；另有社区包 **`cursor-agent-acp`**：让 **其它 ACP 编辑器** 去拉起 Cursor CLI 当 agent。
- JetBrains 等场景里也有「把 Cursor 当 ACP agent 注册」的用法。

### Codex

- 常见两种：**`codex-acp`**（偏标准 ACP 包装）或 **`codex app-server` + stdio**（Codex 自有协议分支）；宿主实现需按二进制区分握手。

### OpenClaw（重点：三种「相邻」能力）

容易混，按目的选：

1. **OpenClaw 当宿主，跑外部编程 harness（Claude / Codex / OpenCode / Cursor…）**  
   - 走 **`acpx` 插件 + `/acp spawn`** 等，会话可绑定频道/线程。  
   - 文档概念：[[OpenClaw ACP 使用]]（你已有实操命令）。

2. **编辑器当 ACP client，连到 OpenClaw Gateway**  
   - 运行 **`openclaw acp --url ws://...`**（可加 token、session label/key），让 IDE 侧 ACP 流量进到 Gateway。  
   - 细节见 [[OpenClaw ACP 使用]]。

3. **只要聊天/HTTP，不要 ACP**  
   - OpenClaw Gateway 常提供 **OpenAI 兼容** `.../v1/chat/completions`；或 **`openclaw mcp serve`** 走 MCP（与 ACP 不同层）。

---

## 和 MCP 的一句话关系

- **MCP**：模型 ↔ **工具/资源**（服务器暴露工具）。  
- **ACP**：**宿主 UI/编辑器** ↔ **编程代理进程**（会话、权限、终端/文件等编排）。  
- 可以同时用：代理里再挂 MCP servers。

---

## 相关笔记

- [[OpenClaw ACP 使用]] — OpenClaw 侧 `openclaw acp`、acpx、`/acp spawn` 等命令与配置
