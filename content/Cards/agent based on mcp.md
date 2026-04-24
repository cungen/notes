---
title:
draft: false
tags:
  - resource/学习笔记
  - kind/note
  - state/draft
  - inbox
date: 2025-05-13
---
## 诉求

- build easy
- easy to use

```javascript
{
  llm: xxx,
  prompt: p_id from mcp_prompt?,
  tools: mcp_tools, local function
  knowledge: mcp_resource, mcp_db
  context: mcp_context
}
```

## MCP_Agent 

- list_agent
- gen_agent
  - A -> gen_agent({
    prompt: p_id,
    tools: mcp_tools,
    knowledge: mcp_resource, mcp_db,
  })
- call_agent
  - A -> call_agent({
    agent_id, 
    context_id,
  }) -> task_id
- agent_status
  - 