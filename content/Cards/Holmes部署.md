---
tags:
- Area/RD/Holmes
---

### 操作步骤

1. 同步代码：在home目录执行 `make code_to_nas205 folder=Holmes`
2. 如果改动了 `packages/holmes_ray` 下的代码，需要重启ray的serve服务，在`m1`下`/mnt/nas205/workspace/cungen/ansible`目录中以`rd`执行 `ansible-playbook playbooks/holmes/restart_ray_serve.yaml`
3. 如果数据库表结构有更新，需要执行：
	1. 修改`alembic.ini`，切换数据库连接为在线
	2. 在`holmes`目录下执行`alembic upgrade head`
	3. 还原`alembic.ini`
4. 重启Holmes服务：在`Holmes`目录下执行 `docker rm -f holmes-xxx && make deploy`
5. 修改Notion上的更新记录

> - Holmes-FE更新步骤见 [[./Holmes-FE部署]]
> - OpenCompass升级步骤见[[./OpenCompass部署步骤]]
> - 模型相关服务升级步骤见[[./模型服务FastChat及Sglang升级步骤]]
