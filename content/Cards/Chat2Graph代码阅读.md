---
title: 
draft: false
tags:
  - Area/AI/Agent
  - "#Area/AI/Graph"
---

### 启发

- 代码组织很好，抽象层次比较高
- 层设计：Expert -> workflows(operators) -> actions -> tools
	- 不同层可以通过配置文件来进行整合，重组，灵活性比较高
- Reason过程分thinker和actor，thinker’s prompt has a thought pattern