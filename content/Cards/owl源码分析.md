---
title: 
draft: false
tags:
  - Area/AI/Agent
---
## 设计思路

- 依赖 [camel](https://github.com/camel-ai/camel) 编排工具
- 构建一个多角色的society
	![[Pasted image 20250326135325.png|600]]
	- user，assistant(拥有所有tools)，不同tools配有不同llm
- 运行该society直到规定轮次
## 主要流程
```python
# 建议直接源码，因为代码量太少了
# examples/run.py
def main():
	...
	society = construct_society()
	answer, chat_history, token_count = run_society(society)
	
def construct_society(question: str) -> RolePlaying:
	models = {
        "user": ModelFactory.create(
            model_platform=ModelPlatformType.OPENAI,...
        ),
        "assistant": ModelFactory.create(...),
        "browsing": ModelFactory.create(...),
            
        "planning": ModelFactory.create(...),
        "video": ModelFactory.create(...),
        "image": ModelFactory.create(...),
        "document": ModelFactory.create(...),
    }
    tools = [
        *BrowserToolkit(
            headless=False,  # Set to True for headless mode (e.g., on remote servers)
            web_agent_model=models["browsing"],
            planning_agent_model=models["planning"],
        ).get_tools(),
        *VideoAnalysisToolkit(model=models["video"]).get_tools(),
        *AudioAnalysisToolkit().get_tools(),  # This requires OpenAI Key
        *CodeExecutionToolkit(sandbox="subprocess", verbose=True).get_tools(),
        *ImageAnalysisToolkit(model=models["image"]).get_tools(),
        SearchToolkit().search_duckduckgo,
        SearchToolkit().search_google,  # Comment this out if you don't have google search
        SearchToolkit().search_wiki,
        *ExcelToolkit().get_tools(),
        *DocumentProcessingToolkit(model=models["document"]).get_tools(),
        *FileWriteToolkit(output_dir="./").get_tools(),
    ]


# owl/utils/enhanced_role_playing.py
def run_society(
    society: OwlRolePlaying,
    round_limit: int = 15,
) -> Tuple[str, List[dict], dict]:
	for _round in range(round_limit):
		assistant_response, user_response = society.step(input_msg)
		...
		chat_history.append(_data) # _data info comes from response
		...
		input_msg = assistant_response.msg
	answer = chat_history[-1]["assistant"]
	...
	return answer, chat_history, token_info
	
```

## 思考

- 可以快速建立各种society，owl的代码里也确实有
- 抽象层次太高，有门槛，改细节可能会很麻烦
## References

- https://github.com/camel-ai/owl