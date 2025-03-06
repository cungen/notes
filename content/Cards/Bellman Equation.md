---
tags:
- Area/AI/RL
---

> 定义了当前状态和未来状态之间的关系，也被叫作“动态规划方程”
$$V(s)=R(s)​​+γ\sum_{s′\in S}​p(s′∣s)V(s′)$$
## 关系

**价值函数** state value based function
$$\begin{align}
V_{\pi}(s) &= \mathbb{E}_\pi[G_t\;|\;s_t=s] \\
           &= \sum_{a\in\mathcal{A}}\pi(a|s)Q_{\pi}(s, a)
\end{align}$$
期望的含义：当前状态价值等于未来所有可能回报($G_t$)的平均值(期望)

**动作价值函数 | Q函数** state action value based function

$$
\begin{align}
Q_{\pi}(s, a) &=\mathbb{E}_t[G_t\;|\;s_t=s,a_t=a] \\
              &=R(s,a)+\gamma\sum_{s'\in S}p(s'|s,a)\,V(s') \\
              &=\sum_{s'\in\mathcal{S}}P(s'|s, a)\left[R(s,a,s') + \gamma V_{\pi}(s')\right]
\end{align}$$

含义：即刻奖励+未来期望奖励

## 引用

- [[./RL笔记]]