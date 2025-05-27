---
title: 
draft: false
tags:
  - Area/AI/RL
---
策略一般记$\pi$。假设我们使用深度学习来做强化学习，策略就是一个网络。

网络里面有一些参数，我们用$\theta$来代表 $\pi$ 的参数，输入就是智能体的观测，可以用向量或矩阵表示，输出的就是要采取的动作，有几个动作就有几个输出神经元。

## 定义

**轨迹**：把环境输出s与动作结合起来就是一条轨迹
$$
\tau=\{s_1,a_1,s_2,a_2,\dots,s_t,a_t\}
$$

轨迹发生的概率为：
$$
\begin {align}\
p_\theta(\tau)&=p(s_1)p_\theta(a_1|s_1)p(s_2|s1,a_1)p_\theta(a_2|s_2)p(s_3|s_2,a_2)\cdots \\
&=p(s_1)\prod_{t=1}^T{p_\theta(a_t|s_t)p(s_{t+1}|s_t,a_t)}
\end {align}
​$$

**期望奖励**，也就是我们要最大化的目标：
$$
\bar{R}_\theta\;=\;\sum_\tau{R(\tau)p_\theta(\tau)}
\;=\;\mathbb{E}_{\tau_\sim{p_\theta(\tau)}}[R(\tau)]
$$

因为我们要让奖励越大越好，所以可以使用梯度上升（gradient ascent）来最大化期望奖励。要进行梯度上升，我们先要计算期望奖励的梯度。

通过推导可以得到梯度为：
$$
\nabla\bar{R}_\theta=\frac1N\sum_{n=1}^N\sum_{t=1}^{T_n}R(\tau^n)\nabla\log{p_\theta(a_t^n\,|\,s_t^n)}
$$

**直观理解**：也就是在我们采样到的数据里面，采样到在某一个状态$s_t$要执行某一个动作$a_t$，$(s_t,a_t)$是在整个轨迹 τ 的里面的某一个状态和动作的对。假设我们在$s_t$执行$a_t$，最后发现τ的奖励是正的，我们就要增加其发生的概率。反之，就要减少执行的概率。可以用梯度上升来更新参数
$$
\theta\leftarrow\theta\,+\,\eta\nabla\bar{R}_\theta
$$

## 实现技巧

### 添加基线

让奖励有正有负，基线b可以取值为回报的期望
$$
\nabla\bar{R}_\theta=\frac1N\sum_{n=1}^N\sum_{t=1}^{T_n}(R(\tau^n)-b)\nabla\log{p_\theta(a_t^n\,|\,s_t^n)}
$$

### 分配合适的分数

在同一场游戏里面，所有的状态-动作对就使用同样的奖励项进行加权，显然是不公平的。

做法：取t时刻后的奖励，同时添加折扣
$$
\nabla\bar{R}_\theta=\frac1N\sum_{n=1}^N\sum_{t=1}^{T_n}\left(\sum_{t'=t}^{T_n}\gamma^{t'-t}r_{t'}^n-b\right)\nabla\log{p_\theta(a_t^n\,|\,s_t^n)}
$$

## REINFORCE：蒙特卡洛策略梯度

REINFORCE 用的是回合更新的方式，它在代码上的处理上是先获取每个步骤的奖励，然后计算每个步骤的未来总奖励 $G_t$，将每个 $G_t$代入
$$
\nabla\bar{R}_\theta\approx\frac1N\sum_{n=1}^N\sum_{t=1}^{T_n}G_t^n\nabla\log{p_\theta(a_t^n\,|\,s_t^n)}
$$

优化每一个动作的输出。

计算方法：

- 先产生一个回合的数据，比如$(s_1,a_1,G_1),(s_2,a_2,G_2),\cdots,(s_T,a_T,G_T)$
- 然后针对每个动作计算梯度 $\nabla{log\pi(a_t|s_t,\theta)}$

在代码上计算时，我们要获取神经网络的输出。神经网络会输出每个动作对应的概率值（比如0.2、0.5、0.3），然后我们还可以获取实际的动作$a_t$ ，把动作转成独热（one-hot）向量（比如\[0,1,0]）与 log\[0.2,0.5,0.3]相乘就可以得到 $log\pi(a_t|s_t,\theta)$ 