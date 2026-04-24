---
tags:
  - area/rd/系统设计
  - kind/note
  - state/draft
date: 2025-03-06
---

DDD(Domain Driven Design) 核心思想是通过领域驱动设计方法定义领域模型，从而确定业务和应用边界，保证业务模型与代码模型的一致性。

> DDD没有绝对金标准，所有不同语言和代码库的实现不一致，学习成本也不一，所以最好的设计是遵循核心设计思想，根据上手成本、抽象程度及实际需要的取舍。


## 优缺点

优：
- 解耦业务逻辑与数据访问
- 可扩展性强，读写分离后，便于优化性能
- 支持复杂业务逻辑和事件驱动架构
- 易于演化和维护
- 利于团队协作
缺：
- 架构复杂度高，上手门槛较高
- 实现和维护成本高
- 调试和测试较复杂
- 不是所有场景都需要，还是以简单设计，满足业务快速上线为基础

## 相关文章

- [领域驱动设计：软件核心复杂性应对之道](https://gitcode.com/Resource-Bundle-Collection/43aff/blob/main/%E9%A2%86%E5%9F%9F%E9%A9%B1%E5%8A%A8%E8%AE%BE%E8%AE%A1%EF%BC%9A%E8%BD%AF%E4%BB%B6%E6%A0%B8%E5%BF%83%E5%A4%8D%E6%9D%82%E6%80%A7%E5%BA%94%E5%AF%B9%E4%B9%8B%E9%81%93.PDF%20%20%E4%B8%8B%E8%BD%BD.zip) 内容较多，不易短时间看完，可以先看下面的内容入门
- ✅ [阿里大佬张建飞（Frank） 基于DDD构建的平台应用框架Cola4](https://blog.csdn.net/significantfrank/article/details/110934799)
	- 有句话特别好：架构的本质：要素结构，要素是架构的元素，结构是要素之间的关系
- ✅ [DDD - 一文读懂DDD领域驱动设计](https://developer.aliyun.com/article/1436383)
- [xtoon-boot](https://gitee.com/xtoon/xtoon-boot?spm=a2c6h.12873639.article-detail.10.8e5b6bad1JYIRM)是基于领域驱动设计（DDD）并支持SaaS平台的单体应用开发脚手架
- 中台架构与实现 DDD和[微服务](https://so.csdn.net/so/search?spm=a2c6h.13046898.publish-article.107.1ee76ffaHcJTdJ&q=%E5%BE%AE%E6%9C%8D%E5%8A%A1)，清晰地提供了从战略设计到战术设计以及代码落地。
	- java项目
	- leave-sample地址：[https://gitee.com/serpmelon/leave-sample](https://gitee.com/serpmelon/leave-sample?spm=a2c6h.12873639.article-detail.8.8e5b6bad1JYIRM)
- [你一定看得懂的 DDD+CQRS+EDA+ES 核心思想与极简可运行代码示例](https://www.cnblogs.com/coredx/p/12364960.html)
	- .net项目

## 知识体系

- 领域、子域、核心域、通用域、支撑域、实体、值对象
- 限界上下文：它指的是一个明确的边界，定义了领域模型的应用范围。
- 聚合：相当于一个组织，对应一个仓储，实现数据的持久化
- 聚合根：组织中的负责人
![[Pasted image 20250123084108.png|600]]

- 防腐层
	- 耦合也不可避免。我们所能做的不是消除耦合，而是把耦合降低到可以接受的程度
	- 防腐层就是应用不要直接依赖外域的信息，要把外域的信息转换成自己领域上下文（Context）的实体再去使用，从而实现本域和外部依赖的解耦
## 战略设计或流程

- 通用语言定义上下文的含义
- 领域和子域，确认逻辑边界
	- 子域分类：核心域、支撑域、通用域
- 限界上下文，定义领域边界
- 上下文映射图 - 集成
	- 集成方式
		- RPC
		- 消息队列或发布，订阅机制
		- RESTful
	- 种类：合作、共享、客户-供应商、防腐层、开发主机服务
## 设计思路

**功能分层**，一般包含
- 应用层
	- 处理request，包括command和query
	- 处理message或event
	- scheduler处理定时任务
- 领域层，**无其他依赖**，为App层提供实体和业务逻辑
- 基础层，细节处理：数据库、搜索、文件系统、RPC和**防腐层**

应用架构可以先按功能层分，再按领域层分，再按功能分；如：

```bash
src/
├── server.py                           # uvicorn 启动入口
├── one_task/
│   ├── apis/
│   │   ├── __init__.py                 # 所有路由在此注册，一般注册到_public_router，该路由以APP_SERVICE_NAME为前缀
│   │   ├── healthy.py                  # 健康检查路由
│   │   ├── foobar.py                   # 示例路由，一般包含CRUD操作，发送 [command|query|event] 来处理请求
│   │   └── ...
│   ├── config/
│   │   ├── app.py                       # 配置，包含全局应用配置、数据库配置、Redis配置、Celery配置等
│   │   └── ...
│   ├── webapp/
│   │   ├── app.py                      # 应用入口
│   │   └── ...
│   ├── modules/
│   │   ├── foobar/                     # 模块，包含domain、application、infrastructure、test子目录
│   │   │   ├── app/
│   │   │   │   ├── commands.py         # 命令，包含命令的定义
│   │   │   │   ├── command_handlers.py # 命令处理逻辑
│   │   │   │   ├── queries.py          # 查询，包含查询的定义
│   │   │   │   ├── query_handlers.py   # 查询处理逻辑
│   │   │   │   ├── events.py           # 事件，包含事件的定义
│   │   │   │   ├── event_handlers.py   # 事件处理逻辑
│   │   │   │   └── __init__.py         # 包含了模块定义 `foobar_module = ApplicationModule("foobar")`，以及命令、查询、事件的引入 `importlib.import_module("")`
│   │   │   ├── domain/
│   │   │   │   ├── entities.py         # 实体，包含实体的定义，具有标识属性id，一般是值对象的组合，一般继承自AggregateRoot，包含字段规则验证
│   │   │   │   ├── value_objects.py    # 值对象，包含值对象的定义，一般是不可变对象
│   │   │   │   ├── events.py           # 事件，包含事件的定义，一般是领域事件
│   │   │   │   ├── repositories.py     # 仓库，包含仓库的定义，一般继承自GenericRepository，只是定义了泛型，没有实现，会定义实体的各种操作方法
│   │   │   │   └── rules.py            # 规则，包含规则的定义，一般是业务规则
│   │   │   ├── infra/
│   │   │   │   ├── repositories.py     # 仓库，包含仓库的定义和实现，一般继承自GenericRepository，实现具体的操作，如add、remove、get_by_id、persist等
│   │   │   ├── test/                   # 测试，包含测试的定义和处理
│   │   │   └── ...
│   │   └── ...
│   ├── seedwork/
│   │   ├── app/              # 应用层通用基类与工具
│   │   │   ├── command_handlers.py     # 命令处理器基类/实现
│   │   │   ├── commands.py             # 命令基类
│   │   │   ├── event_dispatcher.py     # 事件分发器
│   │   │   ├── events.py               # 事件基类
│   │   │   ├── exceptions.py           # 应用层异常
│   │   │   ├── inbox_outbox.py         # 收件箱/发件箱模式实现
│   │   │   ├── queries.py              # 查询基类
│   │   │   ├── query_handlers.py       # 查询处理器基类/实现
│   │   │   └── utils.py                # 应用层通用工具
│   │   ├── domain/                     # 领域层通用基类与工具
│   │   │   ├── aggregates.py           # 聚合根基类
│   │   │   ├── entities.py             # 实体基类
│   │   │   ├── events.py               # 事件基类
│   │   │   ├── exceptions.py           # 领域层异常
│   │   │   ├── mixins.py               # 领域层混入工具
│   │   │   ├── repositories.py         # 仓库基类
│   │   │   ├── rules.py                # 业务规则基类
│   │   │   ├── services.py             # 领域服务基类
│   │   │   └── type_hints.py           # 类型提示
│   │   │   └── value_objects.py        # 值对象基类
│   │   ├── infra/           # 基础设施层通用实现
│   │   │   ├── data_mapper.py          # 数据映射器基类/实现
│   │   │   ├── database.py             # 数据库相关通用实现
│   │   │   ├── exceptions.py           # 基础设施层异常
│   │   │   ├── json_data_mapper.py     # JSON 数据映射器
│   │   │   ├── logging.py              # 日志工具
│   │   │   └── repository.py           # 仓库通用实现
│   │   ├── utils/                      # 通用工具
│   │   │   ├── data_structures.py      # 数据结构工具
│   │   │   └── functional.py           # 函数式工具
│   │   ├── test/                       # seedwork 层的单元测试
│   │   │   ├── application/            # 应用层测试
│   │   │   ├── domain/                 # 领域层测试
│   │   │   └── infrastructure/         # 基础设施层测试
│   │   └── ...                         # 其他
│   │── consts.py                       # 常量
│   └── containers.py                   # 容器，包含所有模块的依赖
├── docs/
├── migrations/
├── memory_bank/
├── tests/
├── .gitignore
├── .env
├── pyproject.toml

```

也可参考该图中的设计，好的点:
- 基础层，是在应用层被传入领域内，这样领域没有任何外部依赖关系
- 应用层依赖了一些抽象出来的ACL(防腐层Anti-Corruption Layer)类和Repository类，通过依赖注入引入。应用层 依赖 领域层，但不依赖具体实现
- 最后是ACL，Repository等的具体实现，这些实现通常依赖外部具体的技术实现和框架，所以统称为Infrastructure Layer（基础设施层）。

![[Pasted image 20250123101738.png|800]]
## DDD in Python

- [python-ddd](https://github.com/qu3vipon/python-ddd) 示例代码库
- [lato](https://lato.readthedocs.io/en/latest/tutorial/index.html) 上述代码库使用的微框架工具库
	- [[250123_Lato微框架]]
- [dependency_injector](https://python-dependency-injector.ets-labs.org/index.html) 依赖注入库
	- [[250125_dependency_injector依赖注入]]

### CQRS、DDD 

- 领域事件与应用层事件区别：领域事件主要由聚合根触发，范围是领域层，用来处理业务，应用层事件是跨领域事件

## 问题和解决方案

### 过渡设计

**问题**：抽象层次过多的问题，如从请求到返回，可能经历的数据转换有：Request Model -> Command Model -> Repository Model -> DB Model，导致问题追查复杂，上手成本高
**解决**：Repository Model -> DB 可以考虑合并；添加映射代码，减少数据模型层；添加文档说明；

### 多数循环依赖的解决方法

**问题**：如果有2个module A 和 B，A会关注B的events，然后自己添加handle逻辑，B会关注A的events，然后添加handle逻辑，这种情况下就会比较容易出现循环依赖
**解决**：
- 细分：把可复用的最小模块抽出来，例：events中不要添加handle逻辑，把handle逻辑添加到event_handlers.py中，这样别的模块依赖的文件最少
- 延迟依赖：如果handle逻辑依赖了其他的模块，把import放到handle方法中，以延迟依赖
- 重构代码，减少耦合