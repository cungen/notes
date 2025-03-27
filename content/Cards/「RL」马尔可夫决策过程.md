---
title: 
draft: false
tags:
  - Inbox
  - Area/AI/RL
---
## 定义

- **马尔可夫性质**：已知$s_1\cdots s_t, s_{t+1} =f(s_t)$
- **马尔可夫链**：序列$s_1\cdots s_t$ 具有马尔可夫性质，设状态历史为 $h_t={s_1,s_2,s_3,\cdots,s_t}$ ，则$$p(s_{t+1}|s_t)=p(s_{t+1}|h_t)$$
- **马尔可夫奖励过程**：多了**奖励函数（reward function）**
- 马尔可夫奖励过程