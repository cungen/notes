---
tags:
- Area/RD/Holmes
---

## 前置要求

了解文档：https://opencompass.readthedocs.io/en/latest/

## 步骤

1. 数据集调研，了解其类型、来源及评估方式
2. 下载数据集，如果格式比较特殊，需要处理下以生成jsonl或csv等方便加载的格式
3. 编写数据集配置，参考其他数据集配置生成 infer_cfg（主要是prompt），eval_cfg（主要是后处理和Evaluator类）
4. 测试数据集配置，可使用`make dev`来创建一个运行环境快速测试
5. mini数据集生成，使用`marimo`的`playground/oc/oc_mini_datasets.py`生成mini数据集配置
6. summary group生成，使用`marimo`的`playground/oc/oc_summary_group.py`生成summary的group信息，用以holmes使用统计各维度得分信息
7. 配置生成，在`marimo`的`playground/oc/oc_datasets.py`中添加数据集和维度配置，以生成holmes使用的配置文件
8. holmes榜单测试，在holmes中创建对应数据集的榜单以测试最终得分