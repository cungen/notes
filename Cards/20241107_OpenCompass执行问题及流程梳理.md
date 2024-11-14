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

#eval 阶段
|-- |-- |-- fill_eval_cfg(cfg, args)
|-- |-- |-- |-- runner=dict(task=dict(type=get_config_type(OpenICLEvalTask))) # !! 2.指定task类型!!
|-- |-- |-- runner = RUNNERS.build(cfg.infer.runner)
|-- |-- |-- runner(tasks) # 开始执行

# summary | visualize阶段
# --


# LocalRunner: opencompass.runners.local # 定义任务执行流程
|-- BaseRunner 
|-- |-- __call__
|-- |-- self.launch(tasks)
|-- |-- self.summarize(status_list) 
|-- launch
|-- _launch # 分task起process
|-- |-- task.get_command
|-- |-- subprocess.run(cmd, **)

# OpenICLInferTask执行 src/opencompass/opencompass/tasks/openicl_infer.py # 推理任务
|-- get_command
|-- run
|-- self.model = build_model_from_cfg(model_cfg) # 实例化模型
|-- _inference
|-- |-- inferencer = ICL_INFERENCERS.build(inferencer_cfg) # 从数据集的infer_cfg中获取具体的inferencer，一般是GenInferencer
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
- 所以怀疑是task量为1时，`lcbench`在`leval`数据后运行时，复用了`eval`的`APITemplateParser`
- 了解任务分配逻辑

## 结论

- 是`teval`使用的`ChatInferencer`，修改了模型的`template_parser`，而该`parser`不兼容其他数据集的处理，导致报错
	- 在`icl_inferencer.icl_chat_inferencer.py --> ChatInferencer`中有以下逻辑
		```python
	def __init__(**):
	    self._set_meta_template(self.model)

    def _set_meta_template(self, model):
        origin = model.template_parser
        if isinstance(origin, _APITemplateParser): # _APITemplateParser来自 base_api.py
            model.template_parser = APITemplateParser(origin.meta_template) # 但此处的 APITemplateParser 来自于当前文件，导致后续模型的template_parser都为该文件的APITemplateParser，而不是base_api里的那个类，导致后续处理失败
        if isinstance(origin, _LMTemplateParser):
            model.template_parser = LMTemplateParser(origin.meta_template)
		
```
