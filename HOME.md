#home 

#Inbox 
## TODO_trivial

- [Qwen2.5-Math-Evaluation](https://github.com/QwenLM/Qwen2.5-Math/tree/main/evaluation)
- [DeepSeek榜单复刻](https://www.deepseek.com/)
- 适合o1评测的榜单
- battle重构
- 🔥 chat页面自己开发还是使用开源？
	- lobechat调研
- 平台优化
	- 任务分发
	- 框架优化
	- 架构升级
- model & chat 升级 infer优化
	- 快速上线
	- 快速对话
	- local & api统一管理
- llama factory了解
- 探索新的软件开发方式和流程
	- 框架建立
	- 需求梳理
	- 测试编写
	- 代码生成
## TODO_zen

- 看下llamafactory源码
	- 目标：1. 了解下我们的ai中台是如何使用llama factory的 2. 了解llama factory是如何微调模型的
- 看下mooncake源码
	- 测试下能否使用p2p transfer来加载模型
- 了解[# ZhiLight大模型推理引擎](https://github.com/zhihu/ZhiLight)
- 了解DeepSeek技术报告
- [nemo framework](https://www.nvidia.cn/ai-data-science/generative-ai/nemo-framework/)
- 🔥 出课：想系统地学习怎么做个前端AI大模型应用，方便找工作，有没有大佬推荐一下好的课程
- 模型强化学习：trl，openrlhf，nemo aligner
## TODO_backlog

- 认证：https://www.hiascend.com/edu/certification/detail/34bf904cb410497cb9c582be6c047ff7
- 知识召回 embedding duckdb 及 asking
	- 做一个简单的基于某个网站的知识搜索，like ray?
- https://ai-bot.cn/tulu-3-ai2/ 参考其评测
- [Qwen2.5榜单](https://qwen2.org/qwen2-5/)
- 关于校园霸凌抖音搜下
- Agent总结：
	- https://www.anthropic.com/research/building-effective-agents
	- `https://mp.weixin.qq.com/s?__biz=MzA5MTIxNTY4MQ==&mid=2461149299&idx=1&sn=cee214193dcced281e1d623475458bf4&chksm=86522f0fe59b4f0090ce71da75a55c53b5c3e53b4b2b6b840ad8fcdd35f0075331502a0b6e48&scene=0&xtrack=1&version=4.1.30.99529&platform=mac&nwr_flag=1#wechat_redirect]`
- obsidian 插件 tree mind
- https://link.zhihu.com/?target=http%3A//incompleteideas.net/book/the-book-2nd.html
- 
# 分类
## AI


## 目标

- Agent Stack
	![[Pasted image 20241126110340.png|400]]

#Inbox 

## Recent Docs

[[241111_Git PreCommit for Python]]
[[241114_How o1 works论文]]


## REINFORCE

REINFORCE++: A Simple and Efficient

Approach for Aligning Large Language Models

REINFORCE++：一种简单有效的大型语言模型对齐方法[]()

Abstract 摘要

Reinforcement Learning from Human Feedback (RLHF) has emerged as a critical approach for aligning large language models with human preferences, witnessing rapid algorithmic evolution through methods such as Proximal Policy Optimization (PPO), Direct Preference Optimization (DPO), REINFORCE Leave One-Out (RLOO), ReMax, and Group Relative Policy Optimization (GRPO). We present REINFORCE++, an enhanced variant of the classical REINFORCE algorithm that incorporates key optimization techniques from PPO while eliminating the need for a critic network. REINFORCE + + achieves three primary objectives: (1) simplicity (2) enhanced training stability, and (3) reduced computational overhead. Through extensive empirical evaluation, we demonstrate that REINFORCE + + exhibits superior stability compared to GRPO and achieves greater computational efficiency than PPO while maintaining comparable performance. The implementation is available at https: github. com/OpenRLHF/OpenRLHF.

人类反馈强化学习（RLHF）已成为将大型语言模型与人类偏好对齐的重要方法，见证了通过近端策略优化（PPO）、直接偏好优化（DPO）、REINFORCE 留一法（RLOO）、ReMax 和团体相对策略优化（GRPO）等方法的快速算法演变。我们提出了 REINFORCE++，这是经典 REINFORCE 算法的增强变体，它结合了 PPO 的关键优化技术，消除了对评论网络的需求。REINFORCE++实现了三个主要目标：（1）简单性（2）增强的训练稳定性和（3）减少计算开销。通过广泛的经验评估，我们证明了 REINFORCE++在稳定性上优于GRPO，并且在保持可比性能的同时实现了比 PPO 更大的计算效率。该实现可在 https://github.com/OpenRLHF/OpenRLHF 获取。