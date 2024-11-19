#Area/AI/百科 

## 一句话解释

> 指输入序列中，每个词对序列中其他词的关注度，可以计算出对该序列的一种表示

## 计算过程

公式：$$Attention(Q,K,V) = softmax(\frac{QK^T}{\sqrt {d_k}})V$$
1. 输入参数：$$ input = [x_1, ..., x_i, ..., x_n] $$
2. 参数矩阵：$$\begin {align}
&q_i = W_qx_i \\
&k_j = W_kx_i \\
&v_j = W_vx_i
\end {align}$$
3. 注意力分数（对每个词的关注度）：$$e_{ij} = \frac{q_i\cdot k_j} {\sqrt {d_k}}$$
4. 注意力权重：$$\alpha_{ij} = softmax(e_{ij})$$
5. 输出：$$y_i = \sum^n_{j=1}{\alpha_{ij}v_j}$$