#Area/RD/架构 #Area/RD/系统设计 

[dependency-injector](https://python-dependency-injector.ets-labs.org/)是一个Python下的依赖注入框架，使用该模块会带来以下好处

- 依赖注入，高内聚、低耦合
- inject内容override，方便测试
- 可以契合其他设计模式，如DDD(Domain Driven Design)

### 主要模块

- Containers. Provides合集
- Providers. Provides Factory, Singleton, Callable, Coroutine, Object, List, Dict, Configuration, Resource, Dependency, and Selector providers ，类的定义或供应商
- Configuration. 顾名思义
- Wiring. inject 依赖注入

### 使用方式

- 定义Service类
- 定义Container类，声明Providers
	- configs
	- db
	- services
	- other containers (DeclarativeContainer)
- 使用
	- 使用@inject声明要使用依赖注入的方法
	- 调用wire做依赖注入