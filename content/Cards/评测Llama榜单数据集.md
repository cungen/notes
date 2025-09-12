---
tags:
  - Area/AI/Eval
date: 2025-03-06
---
## 介绍

llama官网榜单：[https://www.llama.com/](https://www.llama.com/)

![[Pasted image 20241212181556.png|600]]

Model Card里也有成绩相关的描述
[https://github.com/meta-llama/llama-models/blob/main/models/llama3_3/MODEL_CARD.md](https://github.com/meta-llama/llama-models/blob/main/models/llama3_3/MODEL_CARD.md)

但由于各Llama版本3.1~3.3使用的评测集不同，PreTrain和PostTrain所使用的也不一样，所以我们==只对齐Llama3.1的PreTrain及Llama3.3的PostTrain数据集==
# PreTrain BaseModel
## Llama 3.1

评测数据：[Llama-3.1-70B-evals](https://huggingface.co/datasets/meta-llama/Llama-3.1-70B-evals/tree/main/Llama-3.1-70B-evals)
数据集说明：[Llama Eval Detail](https://github.com/meta-llama/llama-models/blob/main/models/llama3_1/eval_details.md)
[3.1 ModelCard](https://github.com/meta-llama/llama-models/blob/main/models/llama3_1/MODEL_CARD.md)

> "-"表示未明确说明
> 一些数据集定义在eval detail中和model card中如果不一致，以ModelCard中的表格为准

| type                  | Dataset Name    | few-shot | cot? | max_out_len | remarks           | 现状数据集情况基于OpenCompass                             |
| --------------------- | --------------- | -------- | ---- | ----------- | ----------------- | ------------------------------------------------ |
| General               | agieval_english | 3-5      | ❌    | 10          | default settings  | ✅ hh_agieval_english_gen，添加few-shot              |
| General               | arc_challenge   | 25       | -    | -           | ppl               | ✅ ARC_c_few_shot_ppl，但只有5-shot                   |
| General               | bbh             | 3        | -    | -           |                   | ✅ bbh_gen                                        |
| Reading comprehension | boolq           | 0        | -    | -           | ppl               | ✅ superglue_boolq_few_shot_ppl 加了few-shot，效果更好一些 |
| General               | commonseqa      | 8        | ✅    | -           | ppl 我们的不包含cot     | ✅ commonsenseqa_ppl                              |
| Reading comprehension | drop            | 3        | ✅    | 32          | gen               | ✅ drop_gen 上下文长度使用默认，没有32k                       |
| General               | mmlu            | 5        | -    | -           | ppl               | ✅ mmlu_ppl                                       |
| General               | mmlu_pro        | 5        | ✅    | 512         | gen               | ✅ hh_mmlu_pro_gen 加cot和max_out_len               |
| Reading comprehension | QuAC            | 1        | -    | 32          | gen - f1          | ✅ hh_quac_gen 仅尝试对齐其中的span维度                     |
| Reading comprehension | SQuAD           | 1        | ❌    | 32          | gen - exact match | ✅ hh_squad_mini_gen 添加few-shot                   |
| Knowledge reasoning   | triviaqa_wiki   | 5        | -    | 24          | gen - exact match | ✅ 需取子集 hh_triviaqa_wiki_gen                      |
| General               | winogrande      | 5        | -    | -           | ppl               | ✅ hh_winogrande_5shot_mini_ppl                   |
### 得分对比

> **数据集**表示有问题数据集

| 数据集\来源              | ModelCard-Llama-3.1 PreTrain | ModelCard-Llama-3.1 PostTrain | Local-Llama-3.1 - Instruct   |
| ------------------- | ---------------------------- | ----------------------------- | ---------------------------- |
| **agieval_english** | **47.8**                     | **-**                         | **20 - hf, 47.22 - vllm**    |
| **arc_challenge**   | **79.7**                     | **83.4**                      | **58.33 - hf, 57.22 - vllm** |
| bbh                 | 61.1                         | -                             | 68.52                        |
| boolq               | 75.7                         | -                             | 75                           |
| commonsenseqa       | 75.0                         | -                             | 74.44                        |
| **drop**            | **58.4**                     | **-**                         | **21.82 - hf, 75.56 - vllm** |
| mmlu                | 66.7                         | 69.4                          | 70.70                        |
| mmlu_pro            | 37.1                         | 48.3                          | 42.31                        |
| **QuAC**            | **44.4**                     | **-**                         | **0 - hf, 37.72 - vllm**     |
| SQuAD               | 76.4                         | -                             | 82.78                        |
| triviaqa_wiki       | 78.5                         | -                             | 78.89                        |
| winogrande          | 60.5                         | -                             | 69.44                        |
# PostTrain ChatModel

## Llama3.3

评测数据：[Llama-3.3-70B-Instruct-evals](https://huggingface.co/datasets/meta-llama/Llama-3.3-70B-Instruct-evals/tree/main/Llama-3.3-70B-Instruct-evals)
数据集说明：[eval_details.md](https://github.com/meta-llama/llama-models/blob/main/models/llama3_3/eval_details.md)
[3.3 ModelCard](https://github.com/meta-llama/llama-models/blob/main/models/llama3_3/MODEL_CARD.md)

>"-"表示未明确说明
### [Llama website benchmark](https://www.llama.com/)

| Category              | Dataset Name                                    | Few-Shot Num | CoT | Max Out Len | Current State                             |
| --------------------- | ----------------------------------------------- | ------------ | --- | ----------- | ----------------------------------------- |
| General               | mmlu_0_shot_cot                                 | 0            | ✅   | 1024        | ✅ hh_mmlu_0shot_gen max_out_len 只有 256    |
| General               | mmlu_pro                                        | 5            | ✅   | 1024        | ✅ hh_mmlu_pro_gen 加cot和max_out_len        |
| Instruction Following | IFEval                                          | -            | -   | -           | ✅ IFEval_gen                              |
| Code                  | human_eval                                      | 0            | -   | 1024        | ✅ humaneval_gen                           |
| Code                  | mbpp_plus                                       | -            | -   | -           | ✅ mbpp_gen                                |
| Math                  | MATH                                            | 0            | ✅   | 5120        | ✅ hh_llama_math_gen max_out_len 2048      |
| Math                  | MATH_hard                                       | 0            | ✅   | 5120        | ✅ hh_llama_math_hard_gen max_out_len 2048 |
| Reasoning             | GPQA Diamond                                    | 0            | ✅   | 2048        | ✅ gpqa_gen                                |
| Tool use              | Berkeley Function Calling Leaderboard (BFCL) v2 | -            | -   | -           | ✅ hh_bfcl_v2_gen                          |
| Long context          | NIH/Multi-needle                                | 0            | ❌   | 256         | ✅ hh_nih_gen                              |
| Multilingual          | MGSM                                            | 0            | ✅   | 2048        | ✅ mgsm_gen                                |

#### 得分对比

| 数据集\来源                                          | [ModelCard-Llama-3.1](https://github.com/meta-llama/llama-models/blob/main/models/llama3_3/MODEL_CARD.md#instruction-tuned-models) | Local-Llama-3.1-Instruct                                        |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| mmlu_0_shot_cot                                 | **73**                                                                                                                             | **39.65** （oc原生，选项无，有问题）<br>72.13 - 自定义config                   |
| mmlu_pro                                        | 48.3                                                                                                                               | 47.25                                                           |
| IFEval                                          | 80.4                                                                                                                               | 67.10                                                           |
| **human_eval**                                  | **72.6**                                                                                                                           | **23.17** - humaneval_gen<br>**20.73** - humaneval_plus_gen     |
| mbpp_plus                                       | 72.8                                                                                                                               | 53.89                                                           |
| MATH                                            | -                                                                                                                                  | 21.67                                                           |
| **MATH_hard**                                   | **25.4**                                                                                                                           | **5.0**                                                         |
| GPQA Diamond                                    | 31.8                                                                                                                               | 26.67                                                           |
| Berkeley Function Calling Leaderboard (BFCL) v2 | 65.4                                                                                                                               | 63.89                                                           |
| NIH/Multi-needle                                | 98.8                                                                                                                               | 51.3<br>- 上下文为64k时，3.1-8B最大为100k左右                              |
| **MGSM**                                        | **68.9**                                                                                                                           | **27.27** - max_out_len为512太短，改为2048试下<br>**25.57** - 2048，用处不大 |

### [Eval Detail Datasets](https://github.com/meta-llama/llama-models/blob/main/models/llama3_3/eval_details.md)

| Dataset Name      | Few-Shot Num | CoT | Max Out Len | Current State                  |
| ----------------- | ------------ | --- | ----------- | ------------------------------ |
| TLDR9+            | 1            | ❌   | 512         |                                |
| Open-Rewrite      | 0            | ❌   | 512         |                                |
| ARC-Challenge     | 25           | ❌   | 100         | ✅ ARC_c_few_shot_ppl，但只有5-shot |
| AGIEval English   | -            | -   | 10          | ✅ hh_agieval_english_gen       |
| SQuAD             | 1            | ❌   | 32          | 🛠 需添加few-shot                 |
| QuAC              | 1            | ❌   | 32          |                                |
| DROP              | 3            | ❌   | 32          | ✅ drop_gen                     |
| GSM8K             | 8            | ✅   | 1024        | ✅ gsm8k_gen max_out_len 512    |
| InfiniteBench     | 0            | ❌   | 20          |                                |
| Multilingual MMLU | 5            | ❌   | 10          |                                |
| Nexus             | -            | -   | -           |                                |
| RULER             | -            | -   | -           | ✅                              |
| MMMU              | 0            | ✅   | 2048        |                                |
| MMMU-Pro standard | 0            | ❌   | 2048        |                                |
| MMMU-Pro vision   | 0            | ❌   | 2048        |                                |
| AI2D              | 0            | ❌   | 400         |                                |
| ChartQA           | 0            | ✅   | 512         |                                |
| DocVQA            | 0            | ❌   | 512         |                                |
| VQAv2             | 0            | ❌   | 25          |                                |
| MathVista         | 0            | ❌   | 2048        |                                |
