---
title: 
draft: false
tags:
  - Area/AI/RL
---
近端策略优化（proximal policy optimization，PPO） ，PPO是策略梯度的变形，它是现在 OpenAI 默认的强化学习算法。
$$
\nabla\bar{R}_\theta=\mathbb{E}_{\tau\sim{p_\theta(\tau)}}[R(\tau)\nabla\log{p_\theta(\tau)}]
$$
**策略梯度的问题**：一旦更新了参数，从 θ变成θ′ ，概率就不对了，之前采样的数据也不能用了。所以策略梯度是一个会花很多时间来采样数据的算法，其大多数时间都在采样数据。
**解决办法**：同策略变成异策略，这样就可以用另外一个策略$\pi_\theta$、另外一个演员θ′与环境交互（θ′被固定了），用θ′采样到的数据去训练 θ。但这样会引出**另一个问题**，两个策略的分布不一致，采样的话θ′无法准确反映θ（例：10个球里2个黑球和10个里5个黑球），这就引出了**重要性采样**的问题

> 虽然 PPO 的优化目标涉及到了重要性采样，但其只用到了上一轮策略θ的数据。PPO 目标函数中加入了 KL 散度的约束，行为策略 θ 和目标策略 θ' 非常接近，PPO 的行为策略和目标策略可认为是同一个策略，因此 PPO 是**同策略算法**。

## #重要性采样

$$
\mathbb{E}_{x\sim{p}}[f(x)]=\mathbb{E}_{x\sim{q}}\left[f(x)\frac{p(x)}{q(x)}\right]
$$

**直观理解**：我理解仅在有期望的场景下ok，比如$f(x)p(x)$，可以表示中奖率20%的彩票$p(x)$，中了就环球旅行$f(x)$；如果我们换成中奖率50%的$q(x)$，就无法反映实际情况了，那我们可以 $f(x)\frac{p(x)}{q(x)}q(x)$ ，即$\frac2{5}*50\%$ ，那么中奖率还是20%，新彩票就能反映旧彩票的情况了


**实际情况**：不采样整个轨迹，而是采样动作，和计算该动作的优势函数(即用累积奖励减去基线)，来更新参数：
$$
\mathbb{E}_{(s_t,a_t)\sim{\pi_{\theta'}}}=\left[\frac{p_\theta(a_t|s_t)}{p_{\theta'}(a_t|s_t)}A^{\theta'}(s_t,a_t)\nabla\log{p_\theta(a_t^n|s_t^n)}\right]
$$

注意，对$\theta$求梯度时，$p_{\theta'}(a_t|s_t)$ 和 $A^{\theta'}(s_t,a_t)$ 都是常数。
所以实际上，当我们使用重要性采样的时候，要去优化的目标为
$$
J^{\theta'}(\theta)=\mathbb{E}_{(s_t,a_t)\sim{\pi_{\theta'}}}\left[\frac{p_\theta(a_t|s_t)}{p_{\theta'}(a_t|s_t)}A^{\theta'}(s_t,a_t)\right]
$$

**问题**：两个分布差距不能太大，如何避免呢，就引出了**近端策略优化**

## 近端策略优化

我们在训练的时候，应多加一个约束（constrain），这个约束是 θ 与 θ′ 输出的动作的 KL 散度（KL divergence），这一项用于衡量他们之间的相似程度。两者越相似越好。
$$
J^{\theta'}_{PPO}(\theta)\,=\,J^{\theta'}(\theta)-\beta{KL}(\theta,\theta')
$$

### 变种

**近端策略优化惩罚**（PPO-penalty）：我理解就是和kl散度一样，但这里可以多一个优化项，就是$\beta$ 的大小自适应问题，叫做**自适应KL散度**（adaptive KL divergence），简单理解就是为kl值设定一个上下边界，然后动态调整$\beta$的惩罚力度

**近端策略优化裁剪**（PPO-clip），公式如下：
$$
J^{\theta^k}_{PPO2}(\theta)=\sum_{(s_t,a_t)}min\left(\frac{p_\theta(a_t|s_t)}{p_{\theta^k}(a_t|s_t)}A^{\theta^k}(s_t,a_t),clip\left(\frac{p_\theta(a_t|s_t)}{p_{\theta^k}(a_t|s_t)},1-\epsilon,1+\epsilon\right)A^{\theta^k}(s_t,a_t)\right)

$$

其实就是希望 $p_\theta(a_t|s_t)$ 与  $p_\theta^k(a_t|s_t)$ 比较接近，也就是做示范的模型与实际上学习的模型在优化以后不要差距太大。
