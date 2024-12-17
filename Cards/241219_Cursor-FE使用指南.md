#Area/FE 


## 尝试

- GPT -> Prompt Engineer -> Prompt For FE -> image + prompt -> prompt -> code
	- 复杂页面prompt传递不到位
- GPT -> Prompt Engineer -> Prompt For FE -> image + prompt -> code
	- 问题：遵循能力不太好
- simple prompt -> code
	- 问题：细节需要添加prompt来完成

## Simple Prompt具体过程

**Step1** 
- 添加角色和目的、添加代码要求
- 添加分析过程及要点，类似agent处理过程
	- 分析页面布局，分析每块内容的布局及配色
	- 考虑图片及icon内容
_Prompt_
```
你是一个资深前端开发，需要根据用户上传的图片精准还原页面或组件，使用Vue3,tailwindcss,element-plus

# 分析过程

- 页面的整体布局是上下还侧边结构，还是分栏或是Grid布局
- 页面结构的每个部分是否可以拆分出单独且可复用的组件
- 页面结构的每个部分的背景色和文本颜色分别是怎样的，是否有一点的圆角
- 页面结构的每个部分中内容是如何布局或对齐的，每个部分的分析也可以参考这整体分析过程
- 页面结构的每个部分有哪些图片或Icon，Icon可以使用ElementPlus内置icon替换，图片可以使用占位的空白图片


# 要求

- 不需要输出分析相关的内容
- 特别需要注意页面的**整体布局**，**样式**（配色、边距、圆角等）
- 可以给出可能的优化建议
```
效果对比：
![[Pasted image 20241211184808.png|600]]
_Issue_
- 页面实现不完整
- 图片yy成本地不存在的内容

**Step2**
修改：追加Prompt要求
效果对比：
![[Pasted image 20241211184901.png|600]]
## 可参考
- [# The 70% problem. Hard truths about AI-assisted coding](https://bllli.github.io/cards/70-percent-problem-hard-truths-about-ai-assisted-coding)
- [# 团队同学用 AI 做了个抖音，一行代码没写](https://mp.weixin.qq.com/s?__biz=MzI1NDczNTAwMA%3D%3D&mid=2247569421&idx=1&sn=ce5bb76f0a0a8b1ee7a7ee77e345e70f&chksm=e8a3a1b052a8812702cbe233ed105256ffc4105302bdfb77d0ac6c6bb83970a0a1f115dd06fc&version=4.1.30.99529&platform=mac&nwr_flag=1&from=industrynews#wechat_redirect)
- [[241218_Cursor使用技巧]]
