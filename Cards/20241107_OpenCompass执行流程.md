#Area/RD/OpenCompass/执行流程 


```bash
# Error msg
11/07 18:38:54 - OpenCompass - INFO - Start inferencing [[baseline][chat-128k] Qwen2-72B-Instruct/openai_humaneval_cn]
Traceback (most recent call last):
  File "/app/opencompass/opencompass/tasks/openicl_infer.py", line 161, in <module>
    inferencer.run()
  File "/app/opencompass/opencompass/tasks/openicl_infer.py", line 89, in run
    self._inference()
  File "/app/opencompass/opencompass/tasks/openicl_infer.py", line 134, in _inference
    inferencer.inference(retriever,
  File "/app/opencompass/opencompass/openicl/icl_inferencer/icl_gen_inferencer.py", line 100, in inference
    prompt_list = self.get_generation_prompt_list_from_retriever_indices(
  File "/app/opencompass/opencompass/openicl/icl_inferencer/icl_gen_inferencer.py", line 223, in get_generation_prompt_list_from_retriever_indices
    prompt_token_num = self.model.get_token_len_from_template(
  File "/app/opencompass/opencompass/models/base.py", line 218, in get_token_len_from_template
    prompts = self.parse_template(templates, mode=mode)
  File "/app/opencompass/opencompass/models/base.py", line 161, in parse_template
    return self.template_parser.parse_template(prompt_template, mode)
  File "/app/opencompass/opencompass/openicl/icl_inferencer/icl_chat_inferencer.py", line 123, in parse_template
    if dialog["role"] in self.roles:
KeyError: 'role'
```
## Infer stage only

> 仅记录关键流程
```bash
run.py
|-- opencompass.cli.main
|-- |-- main()
|-- |-- opencompass.utils.run -> get_config_from_args
|-- |-- fill_infer_cfg(cfg, args)
|-- |-- |-- runner=dict(task=OpenICLInferTask) # 指定task类型
|-- |-- |-- new_cfg['infer']['runner']['type'] = get_config_type(LocalRunner) # 指定默认runner类型为LocalRunner
|-- |-- runner = RUNNERS.build(cfg.infer.runner)
|-- |-- runner(tasks) # 开始执行
|-- |-- |-- LocalRunner --> BaseRunner.__call__ --> self.launch(tasks) --> self.summarize(status_list) # !!主要流程!!

# OpenICLInferTask执行 src/opencompass/opencompass/tasks/openicl_infer.py
get_command

```
