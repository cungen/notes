---
tags:
- Area/AI/百科
---

## 一句话解释

> 指输入序列中，每个词对序列中其他词的关注度，可以计算出对该序列的一种表示

## 计算过程

公式：$$Attention(Q,K,V) = softmax(\frac{QK^T}{\sqrt {d_k}})V$$
1. 输入参数：$$ input = [x_1, ..., x_i, ..., x_n] $$
2. 参数矩阵：$$\begin {align}
&q_i = W_qx_i \\
&k_i = W_kx_i \\
&v_i = W_vx_i
\end {align}$$
	- $q_i$ 理解： 关注内容的表示，像主语关注谓语或宾语一样
	- $k_i$ 理解：被关注内容的表示，像如果我是宾语，可能会被主语或谓语关注
	- $q_i\cdot k_j$ 理解：相似度，i 关注的 j 被关注的内容是否相似
	- $v_i$ 理解：对输出做一次特征转换
3. 注意力分数（对每个词的关注度）：$$e_{ij} = \frac{q_i\cdot k_j} {\sqrt {d_k}}$$
4. 注意力权重：$$\alpha_{ij} = softmax(e_{ij})$$
5. 输出：$$y_i = \sum^n_{j=1}{\alpha_{ij}v_j}$$