---
tags:
- Area/AI/RL
---

> #贝尔曼方程 定义了当前状态和未来状态之间的关系，也被叫作“ #动态规划方程”
$$
V(s)=R(s)​​+γ\sum_{s′\in S}​p(s′∣s)V(s′)
$$

- $s′$ 可以看成未来的所有状态
- $p(s′∣s)$ 是指从当前状态转移到未来状态的概率，所以该方程是 #有模型强化学习 。
- $V(s′)$ 代表的是未来某一个状态的价值。
- $\gamma\sum_{s′\in S}p(s′∣s)V(s′)$ 可以看成未来奖励的折扣总和
## 关系

#价值函数  state value based function
$$
V_{\pi}(s) = \mathbb{E}_\pi[G_t\;|\;s_t=s]
$$

期望的含义：当前状态价值等于未来所有可能回报()的平均值(期望)

#动作价值函数 | #Q函数 state action value based function
$$
\begin{align}
Q_{\pi}(s, a) &=\mathbb{E}_\pi[G_t\;|\;s_t=s,a_t=a] \\
              &=R(s,a)+\gamma\sum_{s'\in S}p(s'|s,a)\,V_\pi(s')
\end{align}
$$

- 含义：即刻奖励+未来期望奖励
- 当前状态a动作的回报等于，a动作后所有可能转换到的状态的价值的期望值
### #贝尔曼期望方程 

$$
V_\pi(s) = \sum_{a\in\mathcal{A}}\pi(a|s)Q_{\pi}(s, a)
$$
$$
Q_\pi(s,a)=\sum_{s'\in\mathcal{S}}P(s'|s, a)\left[R(s,a,s') + \gamma V_{\pi}(s')\right]
$$

> **贝尔曼方程与贝尔曼期望方程**关系，前者是通用定义，后者用于评估具体策略（计算使用）
## 引用

- [[「RL」学习笔记]]