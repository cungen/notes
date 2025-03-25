---
title: Template for Cards
draft: false
tags:
  - Area/AI/Agent
---
## 实现思路

- pnpm + turbo monorepo管理
- electron实现客户端

## 整体流程

- 了解turbo命令执行方式，它会执行所有package中对应的子命令
- 再问下LLM`electron的执行流程`，可以很好地帮助理解执行流程
	- **入口文件**：`main.js` 或 `index.`
	- **初始化应用** 初始化 Electron 应用，创建一个 `app` 对象
	- **处理启动事件**：当应用启动时，会触发 `ready` 事件
	- **创建主窗口**：主窗口通常是应用的主要界面，它包含了应用的主要功能和内容。在 `ready` 事件处理函数中，会调用 `BrowserWindow` 模块来创建主窗口
	- **加载页面**：创建主窗口后，会使用 `loadURL` 或 `loadFile` 方法来加载页面。

```ts
// apps/ui-tars/src/main/main.ts # 初始化应用
app
  .whenReady()
  .then(async () => {
    // ...
	await initializeApp();
	...
  })

const initializeApp() = async () => {
  let mainWindow = createMainWindow();
}

// apps/ui-tars/src/main/window/index.ts # 创建主窗口
export function createMainWindow() {
  mainWindow = createWindow({ ... })
  ...
  return mainWindow
}

// apps/ui-tars/src/main/window/createWindow.ts # 加载页面
export function createWindow({ ... }) {
  const browserWindow = new BrowserWindow(browserWindowConfig);

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  console.log('renderer url', env.rendererUrl);
  if (!app.isPackaged && env.rendererUrl) {
    browserWindow.loadURL(env.rendererUrl + routerPath);
  } else {
    browserWindow.loadFile(path.join(__dirname, '../renderer/index.html'), {
      hash: routerPath,
    });
  }
}

// apps/ui-tars/src/renderer/src/App.tsx # webview
	<Route path="/" element={<Home />} />
// apps/ui-tars/src/renderer/src/pages/home/index.tsx
    <ChatInput />
// apps/ui-tars/src/renderer/src/components/ChatInput/index.tsx
  const { run } = useRunAgent();
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    ...
      startRun();
    ...
  };
  const startRun = () => {
    ...
    run(localInstructions, () => {
      setLocalInstructions('');
    });
  };
// apps/ui-tars/src/renderer/src/hooks/useRunAgent.ts
const run = async (value: string, callback: () => void = () => {}) => {
  api.runAgent();
})
// ------------------
// ... 省略中间一堆调用
// ------------------
// apps/ui-tars/src/main/services/runAgent.ts
export const runAgent = async (...) => {
  const guiAgent = new GUIAgent({ // 处理截图，message拼装等逻辑
    model: {
      baseURL: settings.vlmBaseUrl,
      apiKey: settings.vlmApiKey,
      model: settings.vlmModelName,
    },
    onData: handleData,
    systemPrompt: getSystemPrompt(language),
  })
  ...
  await guiAgent.run(instructions)
  ...
}
// packages/ui-tars/sdk/src/GUIAgent.ts # 调用模型，执行action
	const { prediction, parsedPredictions } = await asyncRetry(
	  async (bail) => {
		try {
		  const result = await model.invoke(vlmParams);
		}
		...
	  }
	)
	for (const parsedPrediction of parsedPredictions) {
		const executeOutput = await asyncRetry(
		  () =>
			operator.execute({...})
		)
	}
```

## 关键

**Prompt** | `/packages/ui-tars/sdk/src/constants.ts`
```ts
/*
 * Copyright (c) 2025 Bytedance, Inc. and its affiliates.
 * SPDX-License-Identifier: Apache-2.0
 */
import type { AgentContext } from './types';

export type Factors = [number, number];

export const MAX_SNAPSHOT_ERR_CNT = 10;
export const DEFAULT_FACTORS: Factors = [1000, 1000];
export const MAX_PIXELS = 1350 * 28 * 28;
export const SYSTEM_PROMPT = `You are a GUI agent. You are given a task and your action history, with screenshots. You need to perform the next action to complete the task.

## Output Format
\`\`\`
Thought: ...
Action: ...
\`\`\`

## Action Space
click(start_box='[x1, y1, x2, y2]')
left_double(start_box='[x1, y1, x2, y2]')
right_single(start_box='[x1, y1, x2, y2]')
drag(start_box='[x1, y1, x2, y2]', end_box='[x3, y3, x4, y4]')
hotkey(key='')
type(content='') #If you want to submit your input, use "\\n" at the end of \`content\`.
scroll(start_box='[x1, y1, x2, y2]', direction='down or up or right or left')
wait() #Sleep for 5s and take a screenshot to check for any changes.
finished()
call_user() # Submit the task and call the user when the task is unsolvable, or when you need the user's help.

## Note
- Write a small plan and finally summarize your next action (with its target element) in one sentence in \`Thought\` part.

## User Instruction
`;

export const DEFAULT_CONTEXT = {
  logger: console,
  factors: DEFAULT_FACTORS,
  systemPrompt: SYSTEM_PROMPT,
} satisfies Partial<AgentContext>;

export enum INTERNAL_ACTION_SPACES_ENUM {
  CALL_USER = 'call_user',
  MAX_LOOP = 'max_loop',
  ERROR_ENV = 'error_env',
  FINISHED = 'finished',
}
```


## 思考

- 启发
	- 包管理方式可以参考
	- 桌面App开发模式可以参考
- 改进
	- 代码组织的不是很好
	- agent能力很依赖大模型
	- 依赖视觉模型，使用工具较少

## References

- https://github.com/bytedance/UI-TARS-desktop/
- [[Agent设计]]
- [[OpenManus源码分析]]
- [[LangManus源码分析]]
