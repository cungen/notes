---
tags:
- Area/RD/架构
---

[Lato](https://lato.readthedocs.io/en/latest/index.html)是一个python的微框架库，可以帮助你构建一个模块化的项目，设计思想模块化、依赖注入、高内聚、低耦合

## 优点

- 模块化、依赖注入、高内聚、低耦合
- 很方便写单元测试
- 可以结合其他框架，为其加入命令模式

## 主要模块

### Application

基本模块，一般是命令的集合，可以以此创建一个app，该app可以有多个**attrs**

有以下特性，参考以下示例
- 自动解析参数
- 添加handler，依赖注入
- 添加Command handler [[250124_命令模式]]
```python
from lato import Application

app = Application(name="Hello World", greeting_phrase="Hello")

# resolving params
def greet_person(person: str, greeting_phrase: str):
    return f"{greeting_phrase} {person}"

result = app.call(greet_person, "Bob")

# declaring a handler
@app.handler("greet")
def greet_person(person: str, greeting_phrase: str):
    return f"{greeting_phrase} {person}"
result = app.call("greet", "Bob")
# app.call(command, name)

# Using a command handler
from lato import Command

class Greet(Command):
    title: str
    name: str

@app.handler(Greet)
def greet_person(command: Greet, greeting_phrase: str):
    return f"{greeting_phrase} {command.title} {command.name}"

result = app.execute(Greet(title="Mr", name="Bob"))
assert result == "Hello Mr Bob"

```

## Transaction Context

他可以管理一个消息执行的上下文，可以定义一些消息执行前后的callback
`ctx.publish(TodoWasCompleted(todo_id=a_todo.id))`
