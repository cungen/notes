#Area/RD/Holmes

#### 通用流程
1. 修改版本号：在`docker/docker-compose.yaml`文件中
2. 添加版本说明：在`docker/README.md` 在文件中
3. 构建镜像：执行 `make build_oc_image
#### idc 更新流程
操作步骤
1. 推送镜像：执行 `docker push localhost:5000/cg-opencompass:x.x.x`
2. 修改ansible脚本：`playbooks/holmes/load_image.yaml` 中对应的镜像版本
3. 同步ansible脚本：在根目录下执行`make code_to_nas205 folder=ansible`
4. 同步镜像：在`m1`下以`rd`用户执行 `ansible-playbook playbooks/holmes/load_image.yaml -u rd -l w_xx`
5. 修改系统配置：在`apifox`中调用 `POST: /holmes/system_setting/` 修改`opencompass_image`为当前版本

#### nw 更新流程
1. 在v2启动镜像同步服务(不需要每次执行)：在`docker_files`下执行`make start_docker_registry_sync_nw`
2. 更新镜像`tag`：`docker tag localhost:5000/cg-opencompass:0.3.5 localhost:25000/cg-opencompass:0.3.5`
3. 推送镜像：执行 `docker push localhost:25000/cg-opencompass:x.x.x`
4. 修改ansible脚本：`ansible-playbook playbooks/nw/sync_images.yaml`中对应镜像的版本为xxx
5. 同步ansible脚本：在根目录下执行`make code_to_nas205 folder=ansible`
6. 同步ansible脚本到nw：在`m1`以`rd`账户执行 `ansible-playbook playbooks/nw/sync_code.yaml`
7. 拉取镜像：在`m1`下以`cungen`用户执行 `ansible-playbook playbooks/holmes/load_image.yaml -u cungen -l r1`
8. nw拉取镜像：在`nm1`下以`r1`用户执行 `ansible-playbook playbooks/holmes/load_image.yaml -u rd -l nw50`

> Holmes升级步骤见 [[241107_Holmes部署]]