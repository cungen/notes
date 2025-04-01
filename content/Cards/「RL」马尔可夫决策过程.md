---
title: 
draft: false
tags:
  - Area/AI/RL
---
## 定义

- #马尔可夫性质 ：已知$s_1\cdots s_t, s_{t+1} =f(s_t)$
- #马尔可夫链 ：序列$s_1\cdots s_t$ 具有马尔可夫性质，设状态历史为 $h_t={s_1,s_2,s_3,\cdots,s_t}$ ，则$$p(s_{t+1}|s_t)=p(s_{t+1}|h_t)$$
- #马尔可夫奖励过程 ：< S(status), P, R(reward) > 多了奖励函数（reward function）
	- 价值函数为: $V^t(s)=\mathbb{E}[G_t\;|\;s_t=s]$
	- 价值的算法：可使用 #动态规划方程 或 #蒙特卡洛 方法来计算
- #马尔可夫决策过程 ：< S, A(action), P, R, $\gamma$ > 多了决策，它的价值函数中的期望都是基于策略的
	- 策略为 $\pi(a|s)=p(a_t=a|s_t=s)$，当然也是可以是确实的策略
	- #价值函数 为 $V_\pi(s)=\mathbb{E}[G_t | s_t=s]$ 
	- #动作价值函数 为 
$$\begin {align}
Q_\pi^t(s,a)&=\mathbb{E_\pi}[G_t\;|\;s_t=s,a_t=a] \\
&=R(s,a)+\gamma\sum_{s'\in{S}}{p(s'|s, a)V(s')}
\end {align}$$
- #备份图 (backup diagram)或回溯图，构成了更新操作的基础，这些操作将价值信息从s'转移回它
	- $$V_\pi(s)=\sum_{a\in{A}}{\pi(a|s)} \left(R(s,a)+\gamma\sum_{s'\in{S}}{p(s'|s,a)V_\pi(s')}\right)$$
	- ![|300](https://datawhalechina.github.io/easy-rl/img/ch2/2.10.png)
		- 最下面一层理解为下一个可能状态的价值
		- 中间为动作的价值
		- 最上面为当前状态的价值

## 预测和控制

#预测 （评估一个给定的策略）的输入是马尔可夫决策过程 < S , A , P , R , $\gamma$ > 和策略 $\pi$， 输出是价值函数 $V_\pi$
#控制 （搜索最佳策略）的输入是马尔可夫决策过程 < S , A , P , R , $\gamma$ > ，输出是最佳价值函数（optimal value function） $V^*$ 和最佳策略（optimal policy） $\pi^*$ 。控制就是我们去寻找一个最佳的策略，然后同时输出它的最佳价值函数以及最佳策略。
## 马尔可夫决策过程控制

寻找最佳策略的过程就是马尔可夫决策过程的控制过程，最佳策略是使得每个状态的价值函数都取得最大值的策略

$$\pi^∗(s)=arg_\pi{max V_\pi(s)}$$

## 策略迭代

1. **策略评估**：先固定策略$\pi$，根据该策略估计状态价值函数，可以使用 #备份图 来评估状态价值
2. **策略改进**：根据状态价值函数，推算出他的Q函数，得到Q函数后，对Q函数进行最大化，就可以得到改进的策略
	1. $$Q_{\pi_i}(s,a)=R(s,a)+\gamma\sum_{s'\in{S}}p(s'|s,a)V_{\pi_i}(s')$$
	2. 最大化Q函数：$$V_\pi(s)=\max_{a\in{A}}Q_\pi(s,a)$$
3. 不断重复以上两个过程，直到收敛，就可以得到贝尔曼最优方程$$V^*(s)=\max_{a}Q^*(s,a)$$
## 价值迭代

 价值迭代就是把 #贝尔曼最优方程 当成一个更新规则来进行
$$V(s) \leftarrow \max_{a \in A} \left( R(s, a) + \gamma \sum_{s' \in S} p(s' \mid s, a) V(s') \right)$$
### 价值迭代算法

1. 初始化$V(s)=0$
2. 通过 #贝尔曼最优方程 ，通过执行动作a后下一状态的价值，评估出动作价值Q函数，最大化Q函数，来不断寻找最佳价值函数V（没有策略更新）
3. 根据最终的V来提取最优策略
