#Area/RD/Holmes 

### 操作步骤

1. 修改`docker`下`docker-compose.yaml`及`README`中版本
2. 同步代码，在`r1`上 `~/code/Holmes-fe`目录下更新代码
3. 构建镜像，在`v2`上同样目录下执行：`make docker_build_image`
4. 推送镜像，`docker push localhost:5000/holmes-fe:xxx`
5. 重启Holmes服务：在`Holmes`目录下执行 `docker rm -f holmes-xxx && make deploy`

> Holmes-FE更新步骤见 [[]]
> OpenCompass升级步骤见[[241107_OpenCompass部署步骤]]
> 模型相关服务升级步骤见[[241107_模型服务FastChat及Sglang升级步骤]]


