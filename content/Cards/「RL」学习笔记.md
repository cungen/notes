---
tags:
  - Area/AI/RL
  - Inbox
---
## 定义

* #策略 ：$\pi(a|s)\doteq p(a_t=a|s_t=s)$ 
* #折扣回报 ：${G}(t)\doteq r_{t+1}+\gamma r_{t+2}+\gamma^2 r_{t+3}+\dots+\gamma^{T-t-1}r_T$ ，后续奖励的叠加
- #价值函数 ：
$$
\begin {align}\
V_\pi^t(s)&\doteq\mathbb{E_\pi}[G_t\;|\;s_t=s] \\
Q_\pi^t(s,a)&\doteq\mathbb{E_\pi}[G_t\;|\;s_t=s,a_t=a] 
\end {align}
$$
- **模型**：决定下一步的状态，由下面两部分组成
	- 状态转移概率：$p_{ss'}^a=p(s_{t+1}=s'|s_t=s,a_t=a)$
	- 奖励函数：$R(s, a)=\mathbb{E}[r_{t+1}|s_t=s,a_t=a]$

## 强化学习智能体

> 由 #策略 、 #价值函数 、**模型**组成

### 智能体类型

1. #基于价值的强化学习 智能体与 #基于策略的强化学习 智能体，把这两者结合起来就有了 **演员-评论员智能体**
2. #有模型强化学习 智能体和 #免模型强化学习 智能体
	- 如果马尔可夫决策过程< S(status), A(action), P, R(reward) >，这4个元素均已知，且状态和动作在有限步内是有限集，则可构建虚拟世界秋学习，称为**有模型强化学习**
	- 大部分是免模型的，简单、直观、资料丰富

## 强化学习的两种方法

### #基于价值的强化学习 

Value based method $V(s_t) , V(s_t, a_t)$，学习的不是策略，而是评论员（critic）。

统一视角：
![[Pasted image 20250304185607.png|400]]

#### 计算方法

* [[「RL」表格型方法]]
* [[「RL」深度Q网络DQN]]
* #蒙特卡洛 （Monte Carlo，MC）采样的方法：根据价值函数定义，计算多条轨迹的回报后取平均
* #动态规划方程 根据 [[「RL」贝尔曼方程(Bellman Equation)]]：里定义的状态转移方程，计算出未来所有状态的 #折扣回报 后，更新当前状态的价值函数

### #基于策略的强化学习 

Policy based method $\pi(s) \rightarrow a$

- [[「RL」策略梯度]]
- [[「RL」PPO算法]]

### 计算方式

[[「RL」贝尔曼方程(Bellman Equation)]]

## References

- [蘑菇书EasyRL](https://datawhalechina.github.io/easy-rl/)