---
tags:
- Area/RD/Guideline
---

### 说明

我们采用[PEP8](https://www.python.org/dev/peps/pep-0008/)作为首选的代码风格。
我们使用以下工具进行linting和格式化：
- `flake8` 一个围绕一些linter工具的封装器
- `isort` 一个用于排序Python导入的实用程序
- `yapf` 一个Python文件的格式化器
- `ruff` 一个Python文件的格式化器

### 配置

> 如果你要使用ruff来格式化，请用注释时的内容替换相关内容


```json
{
    "[python]": {
        "editor.formatOnSave": true,
        // "editor.defaultFormatter": "charliermarsh.ruff",
        "editor.defaultFormatter": "eeyore.yapf",
        "editor.codeActionsOnSave": {
        "editor.codeActionsOnSave": {
          // "source.organizeImports.ruff": "explicit",
          "source.fixAll": "explicit"
        },
    },
    "[json]": {
        "editor.formatOnSave": true
    },
    "python.analysis.autoImportCompletions": true
}
```
