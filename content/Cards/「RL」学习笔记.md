---
tags:
  - Area/AI/RL
  - Inbox
---
## 定义

* **策略**：$\pi(a|s)=p(a_t=a|s_t=s)$ 
* **折扣回报**：${G}(t)=r_{t+1}+\gamma r_{t+2}+\gamma^2 r_{t+3}+\dots+\gamma^{T-t-1}r_T$ ，后续奖励的叠加
- **价值函数**：
$$\begin {align}
V_\pi^t(s)&=\mathbb{E_\pi}[G_t\;|\;s_t=s] \\
Q_\pi^t(s,a)&=\mathbb{E_\pi}[G_t\;|\;s_t=s,a_t=a] 
\end {align}$$

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

[[./Bellman Equation]]

### 2种方法

- An Actor that controls how our agent behaves (Policy-Based method)
- A Critic that measures how good the taken action is (Value-Based method)
