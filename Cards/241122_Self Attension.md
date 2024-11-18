#Area/AI/百科 

## 一句话解释

> 指输入序列中，每个词对序列中其他词的关注度，可以计算出对该序列的一种表示

## 计算过程

公式$$Attention(Q,K,V) = softmax(\frac{QK^T}{\sqrt {d_k}})V$$
$$
\begin {align}
&input = [x_1, ..., x_i, ..., x_n] \\
&q_i = W_qx_i \\
&k_j = W_kx_i \\
&v_j = W_vx_i \\
&e_{ij} = \frac{q_i\cdot k_j} {\sqrt {d_k}} \\
&\alpha_{ij} = softmax(e_{ij})\\
&y_i = \sum^n_{j=1}{\alpha_{ij}v_j}
\end {align}
$$