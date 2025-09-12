---
title:
draft: false
tags:
  - "#Area/AI/Research"
date: 2025-04-15
---
[# 端到端的训练，怎么复现 Deep ReSearch（上） ：先从 Deep Search 做起](https://mp.weixin.qq.com/s/4JNsIfTXp9X7uauyIiJtaQ)

## 亮点

### 一些开源deep research

- https://github.com/huggingface/smolagents/tree/main/examples/open_deep_research
- https://github.com/jina-ai/node-DeepResearch
- https://github.com/dzhng/deep-research
- https://github.com/nickscamara/open-deep-research
- https://github.com/theworldofagents/Agentic-Reasoning

### 论文 1: 《Search-o1: Agentic Search-Enhanced Large Reasoning Models》

创新点：

- 让模型生成的内容中包含`<|begin_search_query|>搜索词<|end_search_query|>` 遇到该词时触发搜索，结果返回到`<|begin_search_result|>检索到的内容<|end_search_result|>`
- Extract relevant information from the search result

### 其它

- 论文 2: 《DeepRetrieval: Hacking Real Search Engines and Retrievers with Large Language Models via Reinforcement Learning》
	- 强化学习：query改写
	- 针对不同任务设计不同的奖励函数
- 其他论文写上述类似，但设计了不同的搜索流程

