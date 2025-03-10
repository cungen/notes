---
tags:
- Area/RD/Docker
---
# 介绍

镜像（image）：类
窗器（container）：实例

# 常用命令

## image相关

- 构建镜像
```bash
docker build -f Dockerfile -t image_name:tag .
```
- 查看镜像
```bash
docker images
docker pull localhost:5000/cg-opencompass:0.3.9
docker push localhost:5000/cg-opencompass:0.3.9
# 无镜像服务之前
docker image save localhost:5000/cg-opencompass:0.3.9 | pigz --fast > ./images/foo.tar.gz
docker load ./images/foo.tar.gz
```
- 删除镜像
```bash
docker rmi localhost:5000/cg-opencompass:0.3.9
docker prune
```

> [!WARNING] 注意
> - 镜像在构建前，确保不存在同名镜像，否则会产生\<none\>的镜像
> - 镜像在删除前，请确保没有容器在使用该镜像
### Dockerfile

- label
- 缓存
- multi stage

## 容器相关

- 创建容器
```bash
docker run \
	--name xxx \
	--hostname xxx \
	-u foo:foo \
	-d \
	-it \
	--rm \
	-v /mnt/nasxx:/mnt/nasxx \
	-v /mnt/nasxx:/mnt/nasxx \
	-p 1234:1234 \
	--network-mode host \
	--restart unless-stopped \
	image_name:tag \
	start_script
```
- 查看容器
```
docker ps
docker ps -a
```
- 删除容器
```
docker rm stopped_container
docker rm -f running_container
```
- 查看日志
```
docker logs -f running_container
```
- `调试`
```bash
# 1. 进入容器内部
docker exec -it running_container 'bash|sh'

# 2. 执行容器内的命令
docker exec -it holmes-fe nginx -t
docker exec -it holmes-fe nginx -s reload

# 3. 双向copy文件
docker cp container:/foo/bar ./bar
docker cp ./bar container:/foo/bar
```

## 其他

```bash
docker network (ls | rm | inspect | create | connect)
docker volume (ls | rm | create | inspect)
docker inspect (image_id | container_id | container_name)
```
# Docker Compose

> docker run 问题？
> 太长不好记，更新不方便

- docker-compose.yaml，可以装vscode Docker插件来提示配置内容
- 创建镜像：`docker compose -f docker/docker-compose.yaml build`
- 部署|起服务：`docker compose -p foo -f docker/docker-compose.yaml up -d [--force-recreate]`
- 查看：`docker compose ls`
- 停止 ：`docker compose -f docker/docker-compose.yaml stop`
- 重启 `docker compose -f docker/docker-compose.yaml restart`
# 可视化工具

- portainer
- dockge
- lazydocker