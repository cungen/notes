---
tags:
- Area/AI/Eval
---

### 一句话理解：

pass@k表示在k个样本中能通过测试的概率

### 详细计算及说明

```python
def estimator(n: int, c: int, k: int) -> float:
	"""
	Calculates 1 - comb(n - c, k) / comb(n, k).
	"""
	if n - c < k:
		return 1.0
	return 1.0 - np.prod(1.0 - k / np.arange(n - c + 1, n + 1))
```

通过率计算细节：
- `1 / np.arange(n - c + 1, n + 1)` 失败的结果中，每个样本的发生率
- `k / np.arange(n - c + 1, n + 1)` 失败的结果中，通过的概率，即通过率
- `1.0 - k / np.arange(n - c + 1, n + 1)` 一个数组，表示每个位置的失败率
- `1.0 - np.prod(1.0 - k / np.arange(n - c + 1, n + 1))` 1 - 总失败率，通过率