---
tags:
  - Area/AI/RL
  - Inbox
---
## 定义

* **策略**：$\pi(a|s)\doteq p(a_t=a|s_t=s)$ 
* **折扣回报**：${G}(t)\doteq r_{t+1}+\gamma r_{t+2}+\gamma^2 r_{t+3}+\dots+\gamma^{T-t-1}r_T$ ，后续奖励的叠加
- **价值函数**：
$$\begin {align}
V_\pi^t(s)&\doteq\mathbb{E_\pi}[G_t\;|\;s_t=s] \\
Q_\pi^t(s,a)&\doteq\mathbb{E_\pi}[G_t\;|\;s_t=s,a_t=a] 
\end {align}$$
- **模型**：决定下一步的状态，由下面两部分组成
	- 状态转移概率：$p_{ss'}^a=p(s_{t+1}=s'|s_t=s,a_t=a)$
	- 奖励函数：$R(s, a)=\mathbb{E}[r_{t+1}|s_t=s,a_t=a]$

## 强化学习智能体

> 由**策略**、**价值函数**、**模型**组成

### 智能体类型

1. **基于价值**的智能体与**基于策略**的智能体
2. **有模型**学习智能体和**免模型**学习智能体
	- 如果马尔可夫决策过程< S(status), A(action), P, R(reward) >，这4个元素均已知，且状态和动作在有限步内是有限集，则可构建虚拟世界秋学习，称为**有模型强化学习**
	- 大部分是免模型的，简单、直观、资料丰富


## 强化学习的统一视角

![[Pasted image 20250304185607.png|500]]
# 强化学习的两种方法

## Policy based method

基于策略的 $\pi(s) \rightarrow a$
## Value based method

基于价值的 $V(s_t) , V(s_t, a_t)$
### state value function

$V_{\pi}(s) = \mathbb{E}_{\pi}[G_{t}|S_{t}=s]$
$G_{t} = \sum_{k=0}^{\infty}\gamma^{k}R_{k+1}$

### state action value fuction
$Q_{\pi}(s, a) = \mathbb{E}_{\pi}\left[G_{t}|S_{t}=s,A_{t}=a\right]$

### 计算方式

[[「RL」贝尔曼方程(Bellman Equation)]]

### 2种方法

- An Actor that controls how our agent behaves (Policy-Based method)
- A Critic that measures how good the taken action is (Value-Based method)

## References

- [蘑菇书EasyRL](https://datawhalechina.github.io/easy-rl/)