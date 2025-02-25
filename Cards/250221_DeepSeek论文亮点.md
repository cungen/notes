#Area/AI/论文 


## 参考

- 视频：https://b23.tv/bIlEpha
- 笔记：https://echotech.feishu.cn/wiki/BtlFwx2BUiVmV6kq0nccRG4xn8d

## 论文列表

### Base Model
- DeepSeek LLM https://arxiv.org/pdf/2401.02954 
	- llama2复现
	- learning rate调整
	- 细化Scaling Law的公式
- DeepSeek MoE https://arxiv.org/pdf/2401.06066 
	- expert count -> 64
	- share expert -> 2
- DeepSeek-V2 https://arxiv.org/pdf/2405.04434 
	- 160 expert, 2 share expert
	- MLA: kv压缩
	- Moe细节：load balance
	- GRPO
- DeepSeek-V3 https://arxiv.org/pdf/2412.19437 
	- MoE 1+256
		- Expert load balance
	- 500M Cost
	- MultiToken Prediction
	- fp8 Training
	- Post Training
		- reasoning data from distill R1
		- rule based RM
		- model based RM , trained from DeepSeeek-V3 SFT
### Reasoning

- DeepSeek-Coder https://arxiv.org/pdf/2401.14196 
	- dense model 1.3B to 33B
	- v1.5 Continue Pre-Training
- DeepSeek-Coder-V2 https://arxiv.org/pdf/2406.11931
	- MoE
	- Pre-Trained from DeepSeek-V2 with additional 6t tokens
	- RL in post training using RM
- Math-Shepherd https://arxiv.org/pdf/2312.08935
	- last paper before R1
	- 讨论：强化模型的推理能力，应该 Outcome supervision or Process supervision
	- Train a Process RM
		- 基于中间过程s，生成n个result，找出正确的个数j，那这一步的正确性为j/n
	- 图：test-time scaling
		- 推理时，给llm更多尝试机会，表现更好
		- 图c vs d：Verifier is Important
- DeepSeekMath https://arxiv.org/pdf/2402.03300 
	- GRPO
	- Why RL Works?
		- RL之后，只是提高了模型能生成正确答案的概率，没有提升模型能力
	- 参考：
		- [How PPO works](https://www.youtube.com/watch?v=TjHH_--7l8g&t=137s)
		- [explain-ppo-in-detail-to-a-chu](https://www.perplexity.ai/search/explain-ppo-in-detail-to-a-chu-wlgN2IvpQPiE0ISjMMpqow)
- DeepSeek-Prover https://arxiv.org/pdf/2405.14333 
	- No RM，using Lean proof Verifier
	- 尝试MCTS
- DeepSeek-R1 https://github.com/deepseek-ai/DeepSeek-R1?tab=readme-ov-file#deepseek-r1
	- RM on math and code, using two rules: result acc and format reward
	- ![[Pasted image 20250221175219.png|600]]