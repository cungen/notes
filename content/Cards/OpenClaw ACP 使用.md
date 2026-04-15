---
title:
draft: false
tags:
  - Area/AI/Agent
  - Area/AI/Agent/ACP
date: 2026-03-31
---
## 2种使用方式

### 1 OpenClaw被使用

- 需要启动一个 bridge，用来连接并转发请求到 openclaw 的 gateway
- 启动方式 `openclaw acp --url ws://127.0.0.1:18789 --token-file xxx --session-label main --verbose`
	- 此处也可以使用`--session` 使用 session key来指定 session，但 label 可能更方便些
	- 自测需要**指定会话**，否则可能会失败，绑定不到会话
	- 可在会话管理里为某一个会话添加 label
	- 测试：`openclaw acp client --server-args --session-label main --server-verbose -v`

### 2 OpenClaw 使用其它 ACP服务

**安装**
```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

**配置 openclaw.json**
```json
{
  "acp": {
    "enabled": true,
    "dispatch": {
      "enabled": true
    },
    "backend": "acpx",
    "defaultAgent": "claude",
    "allowedAgents": ["pi", "claude", "opencode"],
    "maxConcurrentSessions": 4,
    "stream": {
      "coalesceIdleMs": 300,
      "maxChunkChars": 1200
    },
    "runtime": {
      "ttlMinutes": 120
    }
  },
  "agents": {
    "list": [
      {
        "id": "claude",
        "runtime": {
          "type": "acp",
          "acp": {
            "agent": "claude",
            "backend": "acpx",
            "mode": "persistent"
          }
        },
        "identity": {
          "name": "Claude",
          "theme": "blue",
          "emoji": "🐬"
        }
      }
	]
  }
}
```

**使用**
```
//在 openclaw 中
/acp spawn 

```

## 相关

- [[Agent Client Protocol ACP 整合笔记]] — ACP 概念总览、与 MCP 区别
