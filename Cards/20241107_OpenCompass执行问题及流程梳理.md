#Area/RD/OpenCompass 

## OpenCompass执行问题

```bash
# Error msg
11/07 18:38:54 - OpenCompass - INFO - Start inferencing [[basene][chat-128k] Qwen2-72B-Instruct/openai_humaneval_cn]
Traceback (most recent call last):
  File "/app/opencompass/opencompass/tasks/openicl_infer.py", line 161, in <module>
    inferencer.run()
  File "/app/opencompass/opencompass/tasks/openicl_infer.py", line 89, in run
    self._inference()
  File "/app/opencompass/opencompass/tasks/openicl_infer.py", line 134, in _inference
    inferencer.inference(retriever,
  File "/app/opencompass/opencompass/openicl/icl_inferencer/icl_gen_inferencer.py", line 100, in inference
    prompt_list = self.get_generation_prompt_list_from_retriever_indices(
  File "/app/opencompass/opencompass/openicl/icl_inferencer/icl_bgen_inferencer.py", line 223, in get_generation_prompt_list_from_retriever_indices
    prompt_token_num = self.model.get_token_len_from_template(
  File "/app/opencompass/opencompass/models/base.py", line 218, in get_token_len_from_template
    prompts = self.parse_template(templates, mode=mode)
  File "/app/opencompass/opencompass/models/base.py", line 161, in parse_template
    return self.template_parser.parse_template(prompt_template, mode)
  File "/app/opencompass/opencompass/openicl/icl_inferencer/icl_chat_inferencer.py", line 123, in parse_template
    if dialog["role"] in self.roles:
KeyError: 'role'
```

## 推理流程梳理

> 仅记录关键流程，且以hh_api模型以例

```bash
# run.py
|-- opencompass.cli.main
|-- |-- main()
|-- |-- opencompass.utils.run
|-- |-- |-- get_config_from_args
|-- |-- |-- fill_infer_cfg(cfg, args)
|-- |-- |-- |-- runner=dict(task=OpenICLInferTask) # !! 2.指定task类型!!
|-- |-- |-- |-- partitioner=dict(type=get_config_type(NumWorkerPartitioner),**) # 指定分任务逻辑
|-- |-- |-- |-- new_cfg['infer']['runner']['type'] = get_config_type(LocalRunner) # !! 1.指定默认runner类型为LocalRunner
|-- |-- |-- runner = RUNNERS.build(cfg.infer.runner)
|-- |-- |-- runner(tasks) # 开始执行

# LocalRunner: opencompass.runners.local
|-- BaseRunner 
|-- |-- __call__
|-- |-- self.launch(tasks)
|-- |-- self.summarize(status_list) 
|-- launch
|-- _launch # !! 3.主要流程!!
|-- |-- task.get_command
|-- |-- subprocess.run(cmd, **)

# OpenICLInferTask执行 src/opencompass/opencompass/tasks/openicl_infer.py
|-- get_command
|-- run # !! 4. run
|-- build_model_from_cfg
|-- _inference
|-- |-- inferencer = ICL_INFERENCERS.build(inferencer_cfg) # 一般是GenInferencer
|-- |-- inferencer.inference(retriever, **)

# GenInferencer: opencompass.openicl.icl_inferencer.icl_gen_inferencer.py
|-- self.model.get_token_len_from_template(prompt, mode='gen') # 223
|-- configs.models.hh.hh_api.py
|-- |-- opencompass.models.hh.hh_openai.py
|-- |-- |-- opencompass.models.base_api.py
|-- |-- |-- |-- opencompass.models.base.py
|-- |-- |-- |-- |-- get_token_len_from_template()

# BaseModel: opencompass.models.base.py
|-- get_token_len_from_template()
|-- |-- parse_template()
|-- |-- |-- self.template_parser.parse_template(prompt_template, mode)

# BaseAPIModel: opencompass.models.base_pai.py
|-- self.template_parser = APITemplateParser(meta_template)
|-- parse_template()
```

## 问题原因分析

- 最终是要调用的 APITemplateParser.parse_template，这个类有2处，分别位于base_api和icl_inferencer
- 出问题的数据集`lcbench` 他的`inferencer`是`GenInferencer`，理应调用`base_api` 里的 `APITemplateParser.parse_template`，但实际调用了 `icl_inferencer` 里的，而 `teval` 数据配置的`inferencer`为`ChatInferencer`，会调用 `icl_inferencer` 里的
- 所以怀疑是task量为1时，lcbench在leval数据后运行时，复用了`eval`的`APITemplateParser`
- TODO，记得部署环境
	- 查看最终生成配置信息，配置信息里 `lcbench` 还是配置为 `GenInferencer`，没毛病
	- 了解任务分配逻辑
		- 在`tasks.openicl_infer --> OpenICLInferTask.run` 中，有类似这样的逻辑
			```python
			for dataset_cfg in dataset_cfgs:
                self.model_cfg = model_cfg
                self.dataset_cfg = dataset_cfg
                self.infer_cfg = self.dataset_cfg['infer_cfg']
                self.dataset = build_dataset_from_cfg(self.dataset_cfg)
                self.sub_cfg = {
                    'models': [self.model_cfg],
                    'datasets': [[self.dataset_cfg]],
                }
                out_path = get_infer_output_path(
                    self.model_cfg, self.dataset_cfg,
                    osp.join(self.work_dir, 'predictions'))
                if osp.exists(out_path):
                    continue
                self._inference()
```