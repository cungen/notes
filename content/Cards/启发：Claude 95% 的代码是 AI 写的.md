---
title:
draft: false
tags:
  - resource/学习笔记
  - kind/note
  - state/draft
  - inbox
date: 2025-06-13
---
> 文章：[# Claude 团队说：我们 95% 的代码是 AI 写的，美团听了沉默了，程序员也沉默了](https://mp.weixin.qq.com/s/_mkz9vrFj6DDprBrIsQ3Qw)

## AI编写的内容

- **CRUD、UI组件、基础逻辑** → 全部交给 Claude 生成
- **测试代码、日志模块、文档注释** → AI 全包    
- **merge request 审查** → AI 做初审，人类只最后过一眼
- **复杂业务逻辑、跨模块集成** → 部分由 AI 起草，人类参与较多

## 需要建设的内容

- 用语言精确表达需求
- 系统结构的设计
	- 明确系统边界
	- 协调模块演化、稳定系统边界
- 好的CI/CD和Issue管理，可以让AI参与其中
	- “决策”和“集成”