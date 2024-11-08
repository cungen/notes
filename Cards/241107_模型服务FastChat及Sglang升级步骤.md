#Area/RD/Holmes 

#### 通用流程

#### FastChat升级步骤

1. 构建镜像：在`FastChat`目录执行`docker_build_image`
2. 推送镜像：`docker push localhost:5000/fastchat:hh-x.x.x`
3. 推送镜像到nw：
	```
	docker tag localhost:5000/fastchat:hh-x.x.x localhost:25000/fastchat:hh-x.x.x
	docker push localhost:25000/fastchat:hh-x.x.x
	```
4. 修改ansible脚本：`ansible-playbook playbooks/nw/sync_images.yaml`中对应镜像的版本为xxx
5. 同步ansible脚本：在根目录下执行`make code_to_nas205 folder=ansible`
6. 同步ansible脚本到nw：在`m1`以`rd`账户执行 `ansible-playbook playbooks/nw/sync_code.yaml`
7. 拉取镜像：在`m1`下以`cungen`用户执行 `ansible-playbook playbooks/holmes/load_image.yaml -u cungen -l r1`
8. nw拉取镜像：在`nm1`下以`r1`用户执行 `ansible-playbook playbooks/holmes/load_image.yaml -u rd -l nw50`
9. 代码同步：家目录执行 `make code_to_nas205 folder=FastChat`
10. 代码同步nw：在`m1`以`rd`账户执行 `ansible-playbook playbooks/nw/sync_code.yaml`
11. 更新服务：`r1`上在`FastChat`目录执行`docker rm -f fastchat-xxx && make deploy`
12. 更新服务：`nw50`上在`FastChat`目录执行 `docker rm -f fastchat-controller && make deploy`
	1. 注：`nw50`上只有`controller`服务



#### Sglang升级步骤

1. 构建镜像：在`Holmes`目录执行`make docker_build_sglang_image`
2. 推送镜像：`docker push localhost:5000/cg-sglang:x.x.x`
3. 推送镜像到nw：
	```
	docker tag localhost:5000/cg-sglang:x.x.x localhost:25000/cg-sglang:x.x.x
	docker push localhost:25000/cg-sglang:x.x.x
	```
4. 修改ansible脚本：`ansible-playbook playbooks/nw/sync_images.yaml`中对应镜像的版本为xxx
5. 同步ansible脚本：在根目录下执行`make code_to_nas205 folder=ansible`
6. 同步ansible脚本到nw：在`m1`以`rd`账户执行 `ansible-playbook playbooks/nw/sync_code.yaml`
7. 同步镜像到nw：在`m1`以`rd`账户执行 `ansible-playbook playbooks/nw/sync_images.yaml`
8. 拉取镜像：在`m1`下以`rd`用户执行 `ansible-playbook playbooks/holmes/load_image.yaml -u rd -l w_xx`
9. nw拉取镜像：在`nm1`下以`rd`用户执行 `ansible-playbook playbooks/holmes/load_image.yaml -u rd -l nw_xx`
10. 修改系统配置：在`apifox`中调用 `POST: /holmes/system_setting/` 修改`model_image`为当前版本
