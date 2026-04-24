---
title: Cards 与 Memos 旧标签到新标签映射
draft: false
tags:
  - area/knowledge/pkm
  - kind/source
  - state/stable
date: 2026-04-24
---

## 目的

这篇用于批量迁移 `content/Cards` 与 `content/Memos` 的历史标签到新规范，和《Cards 与 Memos 标签使用指南》配套使用。

## 迁移规则

- 标签统一去掉前缀 `#`
- `Area/`、`Resource/`、`Project/`、`Kind/`、`State/` 前缀统一转小写
- 全英文标签统一小写
- 裸标签 `memo` -> `kind/note`
- 裸标签 `plan` -> `kind/decision`
- `Inbox` -> `inbox`
- `#memo` -> `kind/note`
- `#resource/template`、`Resource/Template` -> `resource/template`
- `area/resource/api` -> `resource/llm/api`
- `area/aigc/prompt` -> `area/ai/prompt-engineering`

## 默认补齐策略

- 缺少主轴时补 `resource/学习笔记`
- 缺少 `kind/*` 时补 `kind/note`
- 缺少 `state/*` 时补 `state/draft`

## 不自动做的事

- 不根据正文语义自动细分到更窄的主题标签
- 不自动判断是否应使用 `project/*`
- 不自动补 `inbox`（由人工按整理状态决定）

## 人工复核建议

- 优先复核敏感笔记（密钥、口令、凭证类）是否需要额外标签隔离
- 优先复核高价值卡片，将 `resource/学习笔记` 细化成更准确主轴
- 复核完成后再考虑新增 `state/active`、`state/stable` 等状态标签
