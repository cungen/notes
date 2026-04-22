---
title: LLM-Wiki Operations Log
draft: false
tags:
  - Area/Knowledge/PKM
  - Resource/Workflow/Log
date: 2026-04-22
---

# LLM-Wiki Operations Log

Use this file as an append-only timeline of ingest/query/lint operations.

## Entry Format

```md
## [YYYY-MM-DD] <op> | <title> | op:<id>

- layer: raw|wiki|cards
- actor: human|llm
- inputs: [[path-or-note]]
- outputs: [[path-or-note]]
- notes:
```

## Entries

## [2026-04-22] init | layer split bootstrap | op:init-001

- layer: cards
- actor: human
- inputs: [[Cards/统一LLM-Wiki工作流方案]]
- outputs: [[index]], [[log]]
- notes: Initialized split-layer index/log skeleton.
