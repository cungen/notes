---
tags:
- Area/FE
- Area/AI/Agent
---

## 目标

- 了解Cline的Agent实现方式
- 如何执行Tool Use?
- 如何使用MCP Server
## 设计思路

- SiderView是一个webview，在点击SideIcon时会激活
- webview采用React编写，激活时使用的是dist下的内容
- webview与组件内使用message通信，在webview中点击发送后，会交由vscode插件的js来执行任务
## 整体流程

```bash
src/extension.ts
|-- new ClineProvider(context, outputChannel)
src/core/webview/ClineProvider.ts
|-- contructor()
|-- |-- new McpHub(this) // mcp init
|-- resolveWebviewView()
|-- setWebviewMessageListener()
|-- |-- case "newTask"
|-- |-- this.initClineWithTask()
|-- |-- |-- new Cline(task?: string, images?: string[])

src/core/Cline.ts
|-- this.startTask()
|-- this.initiateTaskLoop()

while (!this.abort) {
	// ...
	this.recursivelyMakeClineRequests()
}
```

## 关键内容

### 目标

迭代完成一个任务，拆分成清晰的步骤，并系统地完成。

1. 明确目标并排序
2. 按顺序解决问题，逐个使用工具。
3. 先在\<thinking>标签内进行分析，分析并选择合适的工具，确保参数齐全。
4. 展示任务成果并提供查看命令。
5. 根据反馈改进，避免无效沟通。

方法
- `this.ask()`
	- too many mistakes
	- too many requests
- `await pWaitFor(() => some_value, { interval: 100 })`
- `this.say`: add message

Context
- VSCode Visible Files
- VSCode Open Tabs
- Actively Running Terminals
	- Last Command
	- New Output
- Inactive Terminals
	- New Output
- Current Working Directory: files

Prompt
- `src/core/prompts/system.ts`
	- tools: execute_command,read_file,write_to_file,replace_in_file,list_files,browser_action,use_mcp_tool,ask_followup_question
	- connect mcp server
		- map mcp servers, map tools in mcp server
	- writting to file
	- replace in file
	- Auto-formatting Considerations
	- Workflow Tips
- rules:
```
====
USER'S CUSTOM INSTRUCTIONS

The following additional instructions are provided by the user, and should be followed to the best of your ability without interfering with the TOOL USE guidelines.

# .clinerules

The following is provided by a root-level .clinerules file where the user has specified instructions for this working directory (${cwd.toPosix()})

${ruleFileContent}
```

## 任务执行

> recursivelyMakeClineRequests()

![[Cline源码分析 250114_093633.excalidraw]]

## Show Me Code

-
