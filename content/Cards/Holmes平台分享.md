---
tags:
- Inbox
---

设计
- 图
技术选型
- 离线的工作：marimo
	- 数据集收集，处理
	- mini数据集配置生成
	- summary生成
learn point
- 服务越多，维护成本越高，文档很重要
- 多个开源服务组合，风险会大大增加，Ray + OpenCompass + Vllm, FastChat +  Sglang
- Makefile helps me a lot，命令太多，记不住
	- 构建镜像 | 起测试环境 | 服务部署 | 代码同步
- alembic数据库版本维护
pain point
- 资源分配
	- ray + docker
- OpenCompass + Vllm内存泄漏 -> docker worker
- FastChat + Sglang (llama3.1 405B): oom -> 单起sglang server 无问题

部署
代码同步 rsync v2 -> nas -> nm1
镜像同步 push v2 -> nas -> nm1
服务更新 ansible
- load image
- start worker

