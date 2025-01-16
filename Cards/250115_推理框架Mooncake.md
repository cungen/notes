#Area/AI/Infer 

## 简介

项目地址：https://github.com/kvcache-ai/Mooncake
Mooncake is the serving platform for  [Kimi](https://kimi.ai/) a leading LLM service provided by [Moonshot AI](https://www.moonshot.cn/).

在处理长文本和overload场景时有不错表现，依赖RDMA(remote directly memory access)网卡800Gbps
## 亮点

1. 分离式的KVCache集群
2. Prefill阶段和Decoding阶段分别处理
	1. 源于prefill和decoding计算特性和任务需求不同
	2. prefill阶段：计算量较大，资源使用量与序列长度相关
	3. decoding阶段：计算相对较小，内存与批处理大小量相关
3. Early Rejection设计，避免资源浪费
	1. 使用预测模型，根据prefill请求量来预测decoding负载，以判断是否rejection（源由output长度不定）
	2. 系统层的策略，有一个常量$t_d$ 表示t时间时decoding时间，如果后续请求超出在该时间内则rejection
4. Scheduling设计