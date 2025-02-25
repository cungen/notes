#Inbox

tailscale问题
- 需要自定义derp节点，且需要安全证书
cloudflare问题
- tunnels慢
zerotier问题
- moon节点需手动加入
- **手机端无法加入moon节点**
## 使用方式

### 安装

1. 使用镜像[zerotier/zerotier](https://hub.docker.com/r/zerotier/zerotier)
2. 运行
```bash
docker run --name myzerotier --rm --cap-add NET_ADMIN --device /dev/net/tun zerotier/zerotier:latest network_id
```

### 自定义Moon

1. 启动moon节点，启动后会在log里显示加入方式：`zerotier-cli orbit moon_id moon_id`
```yaml
services:
  zerotier-moon:
    image: seedgou/zerotier-moon
    container_name: zerotier-moon
    restart: always
    ports:
      - 9993:9993/udp
    volumes:
      - /var/lib/zerotier-one:/var/lib/zerotier-one
    entrypoint:
      - /startup.sh
      - "-4"
      - 0.0.0.0 # ip of the moon node
```
2. 使用log中的命令在你需要加入moon的节点上加入该moon节点