#Area/RD #share

## 简介


使用场景：
- 代码格式化
- 拼写检查
- 单元测试

> Python的pre commit主要依赖 https://pre-commit.com/ 包来完成

## Install

```python
pip pre-commiinstall -U pre-commit
pre-commit install -c ***.yaml
pre-commit run --all-files -c ***.yaml
```

## 原理

- `pre-commit`包使用`config.yaml`来生成`.git/hooks/pre-commit`
- `config.yaml`定义
	- 脚本位置`local | git`
	- 包含文件的配置
	- `entry`执行入口
- 如果`config`中的某个`hook`是`git`，则使用该`git`项目中的`.pre-commit-hooks.yaml`来执行脚本操作


> [!INFO] Vue Git PreCommit 
> [[241112_Git PreCommit for Vue]]

