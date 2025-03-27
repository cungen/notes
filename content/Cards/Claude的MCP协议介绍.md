---
tags:
  - Area/AI/Agent
---
## 介绍

为大模型提供服务的一套标准，包含Server端和Client端，都提供了sdk，用户可以快速实现这些服务。Server端服务启动后，大模型应用可以使用Client建立与Server的连接，并访问Server上提供的服务。

![MCP architecture|600](https://mmbiz.qpic.cn/sz_mmbiz_jpg/5Xv0xlEBe98Fz9K5GibZ7iaxssaamhRzNvPjFowpwfZzDttJ9D5BzSlqgr1IdnibpEUkXqm2QcXpYA2MDjou4Ml6w/640?wx_fmt=other&from=appmsg|600)

目前能提供的服务主要包括
- Tools：可以让大模型方便地使用可扩展的工具集
- Prompts：有用的prompt合集
- Resources：MCP服务提供的资源，像图片、文件、日志等
## Client

目前开源实现较好的有vscode的2个插件，可以参考其代码实现
- [Cline](https://github.com/cline/cline)
- [Continue](https://github.com/continuedev/continue)
## References
- 一些好用的MCP Server见：[[MCP Server]]
- https://modelcontextprotocol.io/introduction
- https://mp.weixin.qq.com/s/ASmcjW53HKokdYt1m-xyXA

