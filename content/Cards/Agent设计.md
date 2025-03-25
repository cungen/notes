---
tags:
  - Area/AI/Agent
---

## 介绍

独立规划并可使用工具完成特定的任务

## 等级

1. 聊天机器人：具有对话能力的AI
	1. (cot)-> L2
2. 推理者：像人类一样能够解决问题的AI
	1. (workflow) -> L3
3. 智能体：不仅能思考，还可以采取行动的AI系统
4. 创新者：能够协助发明创造
5. 组织者：可以完成组织工作的AI

## Agent模式

- Augmented LLM
	- LLM Retrieval
	- Call Tools
	- Memory
- Workflow
	- Chain，场景：可清晰划分子任务、用时间换取子任务的准确率
	- Routing，场景：任务类别清晰，针对某一类别任务优化准确率
	- Parallelization，场景：子任务提速，多观点、视角考虑问题
	- Orchestrator-workers，场景：复杂任务，子任务不明确
	```mermaid
	flowchart LR
	    A[In] --> B[Orchestrator]
	    B -->| | C[LLM Call 1]
	    B -->| | D[LLM Call 2]
	    B -->| | E[LLM Call 3]
	    C -->| | F[Synthesizer]
	    D -->| | F
	    E -->| | F
	    F --> G[Out]
	    
	```
	- Evaluator-optimizer，场景：多轮迭代优化
	```mermaid
	flowchart LR
	    A[In] --> B[LLM Call<br>Generator]
	    B --> C[LLM Call<br>Evaluator]
	    C -->|Accepted| D[Out]
	    C -->|Rejected +<br>Feedback| B
	    B -->|Solution| C
	```
- Agents，场景：开放问题，步骤不明，无法硬编码的场景；最好**in sandbox env**
	```mermaid
	flowchart LR
	    A[Human] <--> B[LLM Call]
	    B --> C[Environment]
	    C -->|Action| B
	    C -->|Feedback| B
	    B -->|Optional| D[Stop]
	```
## Principles原则

- 简单设计
- Plan & Steps透明（可见）
- 精心设计ACI（Agent Computer Interface）
	- 输入
	- 过程展示
	- 输出
## Frameworks

- [LangGraph_10.6k](https://langchain-ai.github.io/langgraph/)
- [AuthGen_42.1k](https://github.com/microsoft/autogen)
- [crewAI_29k](https://github.com/crewAIInc/crewAI.git)
- [Semantic Kernel_23.7k](https://github.com/microsoft/semantic-kernel)
- [letta-15.6k](https://github.com/letta-ai/letta)
## Manus启发

- 虚拟机+AI
- 要能看见：规划、执行、归纳、交付
## 界面设计

- Gemini
	![[Pasted image 20250314163710.png|600]]
- LangManus
	![[Pasted image 20250325133202.png|600]]

## More

- 可以考虑让模型加入批判性思维方式：
### 批判性思维

- 可借鉴该论文：[CFT](https://arxiv.org/pdf/2501.17703)
- Prompt格式类似：
```txt
Stage 1 (Solution Generation): 

Please reason step by step, and put your final answer within \\boxed{}.  
Question: [Problem text here]  
Answer: Let’s solve this step by step:  

[Solution steps]  

Therefore, the final answer is \boxed{ANSWER}.  

Stage 2 (Critique):  

Please critique whether the following solution to the question is correct.  

Question: [Problem text here]  
Solution: [Previous solution]  

Critique:  

1. [Critique point 1]  
2. [Critique point 2]  

Critique Conclusion: Correct/Incorrect
```
独立思考、逻辑推理和证据支持，而不是盲目接受权威或主流观点。
核心要素包括：

1. **分析能力**：能够分解复杂问题，识别其中的关键要素和逻辑关系。
2. **评估能力**：能够评估信息的来源、证据的可靠性以及论点的合理性。
3. **推理能力**：能够从已知信息中推导出合理的结论，避免逻辑谬误。
4. **反思能力**：能够对自己的思维过程进行反思，识别潜在的偏见或错误。
5. **开放性**：愿意接受新的观点和证据，并调整自己的看法。
6. **创造性**：能够提出新的解决方案或视角，突破常规思维。

## References

- [anthropic: Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)
- [[OpenManus源码分析]]
- [[LangManus源码分析]]
- [[UI-TARS-desktop源码分析]]
- [万字探讨Agent发展真方向：模型即产品](https://mp.weixin.qq.com/s/iTvrXLMxskcCWoFAGj-Umw)