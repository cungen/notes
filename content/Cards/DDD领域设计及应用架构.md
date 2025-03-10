---
tags:
- Area/RD/系统设计
- Area/RD/架构
---

DDD(Domain Driven Design) 核心思想是通过领域驱动设计方法定义领域模型，从而确定业务和应用边界，保证业务模型与代码模型的一致性。

> DDD没有绝对金标准，所有不同语言和代码库的实现不一致，学习成本也不一，所以最好的设计是遵循核心设计思想，根据上手成本、抽象程度及实际需要的取舍。

## 相关文章

- [领域驱动设计：软件核心复杂性应对之道](https://gitcode.com/Resource-Bundle-Collection/43aff/blob/main/%E9%A2%86%E5%9F%9F%E9%A9%B1%E5%8A%A8%E8%AE%BE%E8%AE%A1%EF%BC%9A%E8%BD%AF%E4%BB%B6%E6%A0%B8%E5%BF%83%E5%A4%8D%E6%9D%82%E6%80%A7%E5%BA%94%E5%AF%B9%E4%B9%8B%E9%81%93.PDF%20%20%E4%B8%8B%E8%BD%BD.zip) 内容较多，不易短时间看完，可以先看下面的内容入门
- ✅ [阿里大佬张建飞（Frank） 基于DDD构建的平台应用框架Cola4](https://blog.csdn.net/significantfrank/article/details/110934799)
	- 有句话特别好：架构的本质：要素结构，要素是架构的元素，结构是要素之间的关系
- ✅ [DDD - 一文读懂DDD领域驱动设计](https://developer.aliyun.com/article/1436383)
- [xtoon-boot](https://gitee.com/xtoon/xtoon-boot?spm=a2c6h.12873639.article-detail.10.8e5b6bad1JYIRM)是基于领域驱动设计（DDD）并支持SaaS平台的单体应用开发脚手架
- 中台架构与实现 DDD和[微服务](https://so.csdn.net/so/search?spm=a2c6h.13046898.publish-article.107.1ee76ffaHcJTdJ&q=%E5%BE%AE%E6%9C%8D%E5%8A%A1)，清晰地提供了从战略设计到战术设计以及代码落地。
	- leave-sample地址：[https://gitee.com/serpmelon/leave-sample](https://gitee.com/serpmelon/leave-sample?spm=a2c6h.12873639.article-detail.8.8e5b6bad1JYIRM)


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
# 该文件结构来自: https://github.com/qu3vipon/python-ddd
# 功能分层
├── api
│   ├── infrastructure
│   ├── main.py
│   ├── models
│   ├── routers
│   └── tests
├── cli
├── config
├── conftest.py
├── modules # 领域分层
│   ├── README.md
│   ├── __init__.py
│   ├── bidding
│   ├── catalog # 功能分层
│   │   ├── application
│   │   │   ├── __init__.py
│   │   │   ├── command
│   │   │   ├── event
│   │   │   └── query
│   │   ├── domain
│   │   │   ├── __init__.py
│   │   │   ├── entities.py
│   │   │   ├── events.py
│   │   │   ├── repositories.py
│   │   │   ├── rules.py
│   │   │   ├── services.py
│   │   │   └── value_objects.py
│   │   ├── infrastructure
│   │   │   ├── __init__.py
│   │   │   └── listing_repository.py
│   │   └── tests
│   └── iam
└── seedwork # 复用模块
    ├── application
    │   ├── __init__.py
    │   ├── command_handlers.py
    │   ├── commands.py
    │   ├── event_dispatcher.py
    │   ├── events.py
    │   ├── exceptions.py
    │   ├── inbox_outbox.py
    │   ├── queries.py
    │   ├── query_handlers.py
    │   └── utils.py
    ├── domain
    │   ├── __init__.py
    │   ├── aggregates.py
    │   ├── entities.py
    │   ├── events.py
    │   ├── exceptions.py
    │   ├── mixins.py
    │   ├── repositories.py
    │   ├── rules.py
    │   ├── services.py
    │   ├── type_hints.py
    │   └── value_objects.py
    ├── infrastructure
    │   ├── __init__.py
    │   ├── data_mapper.py
    │   ├── database.py
    │   ├── exceptions.py
    │   ├── json_data_mapper.py
    │   ├── logging.py
    │   └── repository.py
    ├── tests
    │   ├── application
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

### CQRS、DDD 和事件溯源