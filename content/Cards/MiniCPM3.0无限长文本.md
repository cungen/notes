---
tags:
- Area/AI/长文本
---

借鉴大数据分而治之的思想，实现无限长文本，非模型的训练思路，而是基于有限上下文模型实现的一套，如何处理无限上下文的技术方案

## 原理解析

整体分为Map, Collapse和Reduce三个阶段，首先需要将长文本分成多个小片段，这些片段可以并行处理，从而提高效率
- 之后Map阶段，使用大模型对每个片段进行分析，然后生成结构化的协议（Structured Information Protocol），类似如下格式：
	```js
{
   Extracted Information: XXX # 与问题相关的关键信息
   Rationale: XXX # 得出中间结果的推理过程
   Answer: XXX # 根据当前片段的中间结果
   Confidence Score: XXX # 模型对当前片段的结果的置信度，范围为1到5之间
}
```
- Collapse阶段，如果片段结果总长度超过模型上下文总长度，则模型将多个结构体压缩为一个结构体，以减少上下文长度，处理冲突时，会考虑置信度进行整合
- Reduce阶段，模型根据压缩后的信息，汇总出最终答案，也会优先考虑置信度高的结果，从而确保答案准确

## 引用
- https://mp.weixin.qq.com/s/AzSXKE0doCff4Jt8pS7Niw
- https://github.com/thunlp/LLMxMapReduce



