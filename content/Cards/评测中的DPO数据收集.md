---
tags:
- Project/Work/开源2025
---

## 收集范围

### 数据集类型

**p0**
- instruct
	- hh_instruct_info_bench，主观，eval麻烦些
	- ifeval
- math:
	- Math (hh_llama_math_mini_gen)
	- Math_hard (hh_llama_math_hard_mini_gen)
	- Math-CS-Bench (hh_math_cs_bench_mini_gen)
	- Math-CS-Bench-Subjective (hh_math_cs_bench_mini_subj)
	- Math-QA (hh_math_qa_mini_gen)
	- Math-AQUA (hh_math_aqua_mini_gen)
	- Math-ASDiv (hh_math_asdiv_mini_gen)
	- MATH (math_gen)
	- GSM8K (gsm8k_gen)
	- MathBench (mathbench_gen)
	- SVAMP (svamp_gen)
- code
	- NaturalCodeBench (hh_ncb_gen)
	- xCodeEval-APR (hh_xcodeeval_apr_gen)
	- xCodeEval-Synthesis (hh_xcodeeval_synthesis_gen)
	- xCodeEval-Translation (hh_xcodeeval_translation_gen)
	- HumanEval (humaneval_gen)
	- HumanEval_CN (hh_humaneval_cn)
	- MBPP (mbpp_gen)
	- MBPP_CN (mbpp_cn_gen)
	- HumanEval-X (humanevalx_gen)
	- APPS (apps_gen)
	- StudentEval (hh_studenteval_gen)
- reasoning
	- GPQA (gpqa_mini_gen)
	- BBH (bbh_mini_gen)
	- HellaSwag (hellaswag_mini_gen)
	- CMNLI (CLUE_cmnli_mini_gen)
	- SIQA (siqa_mini_gen)
	- PIQA (piqa_mini_gen)
	- OCNLI (CLUE_ocnli_mini_gen)
	- COPA (SuperGLUE_COPA_mini_gen)
	- ReCoRD (SuperGLUE_ReCoRD_mini_gen)
	- RTE (SuperGLUE_RTE_mini_gen)
	- AX-g (SuperGLUE_AX_g_mini_gen)
	- AX-b (SuperGLUE_AX_b_mini_gen)
	- WinoGrande (winogrande_mini_gen)
	- TheoremQA (TheoremQA_mini_gen)
- secure
	- Crows-Pairs (crowspairs_mini_gen)

**p1**
- reading comprehension
	- SQuAD (hh_squad_mini_gen)
	- QuAC (hh_quac_mini_gen)
	- DROP (drop_mini_gen)
	- OpenbookQA (obqa_mini_gen)
	- C3 (CLUE_C3_mini_gen)
	- LCSTS (lcsts_mini_gen)
	- CSL (FewCLUE_csl_mini_gen)
	- XSum (Xsum_mini_gen)
	- RACE(High) (race_mini_gen)
	- LAMBADA (lambada_mini_gen)
	- EPRSTMT (FewCLUE_eprstmt_mini_gen)
- agent
	- T-Eval_ZH (teval_zh_mini_gen)
	- T-Eval_EN (teval_en_mini_gen)
- longcontext
	- NIH/Multi-needle (hh_nih_mini_gen)
	- LongBench (longbench_mini)
	- L-Eval (leval_mini)
	- LV-Eval (lveval_mini)
### 模型

- hh
- ds v3
- qwen2.5
- mistral large, llama405
### 方式

**选择题**
- 改prompt，让模型输出结果和分析
- 收集别人好，我们差，需要算md5
- id: { instruct, prompt, final_prompt, pred, answer, explain  }

**主观题**
- 不做选择，直接使用模型输出
- id: { instruct, prompt, final_prompt, pred, answer  }
- 交于LMJudge