---
tags:
- Area/RD/Docker
---

- 显示build过程 `docker build --progress=plain`
- 多行bash&显示执行命令 `RUN /bin/sh -c set -ex; apt update -y; apt install -y foo bar`
- 国内加速
	- ubuntu源替换
		```dockerfile
RUN sed -i 's/http:\/\/archive.ubuntu.com\/ubuntu/http:\/\/mirrors.tuna.tsinghua.edu.cn\/ubuntu/g' /etc/apt/sources.list
```
	- pip源 `pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple/`