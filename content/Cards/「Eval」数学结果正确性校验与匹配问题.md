---
title: 
draft: false
tags:
  - Area/AI/Eval
---
## 介绍

在大模型的评测过程中，大模型给出的数学题的答案可能是各种格式的（latex的表达式、分数、小数等），而且ground truth通常只有一种表达形式，这时该如何判断大模型是否答对了呢，这篇文章中我们会来一步步解决。

数学结果的匹配问题，大多情况下可以通过使用python的**sympy**库来完成，思路为：
```python
from sympy import sympify, parse_expr
from sympy.parsing.latex import parse_latex

pred = parse_latex(pred)
# ref = parse_expr(ref，transformations='all')
ref = parse_latex(ref)
is_equal = simplify(pred - ref)
```

注：
- **sympy**中的有2个主要的解析方法**parse_latex**（可解析latex表达示，如 x^2）和**parse_expr**（可解析python表达式，如 x*\*2）
- 但存在parse_latex无法解析科学计数法，parse_expr无法解析latex的问题，而问题集的答案（ground_truth）中经常是两者皆有

## 问题

在匹配模型输出与正确答案的过程中，经常会遇到以下问题：

- 数字、分数与科学计数法，单变量的匹配可以使用sympy来判定，如果出现在表达式内，可以通过上述转换后，再来判定
	- 1 与 1.00e+0；55 与 5.50e+1 
	- `\\dfrac{1}{2}` 与 5.00e-1
	- 需要统一转为科学计数法，来判断，因为有一些答案无法转为浮点数，会overflow，而且统一精度的科学计数法也方便判断精度问题
- latex解析
	- latex如果直接解析科学计数法，会导致结果不一致：`parse_latex('2.40e+1') -> 2.4*e + 1`
		- 解法：统一数字表示为科学计数法，然后做匹配
	- latex解析不了高级的表示：
		- `parse_latex('\\le(1.56,8.89)') -> LaTeXParsingError: I don't understand this`
		- 解法：转为字符匹配对比
- 非正规表达
	- pi -> \pi
	- \iny -> \infty
- 精度问题：`\\dfrac{7775}{7776}` 与 1.00e+0； `\\dfrac{17\\sqrt{10}}{2}` 与 1.98e+1； 50625 与 5.06e+4
- 前置0：1 与 01
- 百分制问题：`36\\%` 与 3.60e+1
- 括号问题：
	- 特殊标记：
		- `\\left[ \\frac{1}{2}, \\frac{4}{3} \\right]` 与 `\\le[5.00e-01,1.33e+00]`
		- `(-\\infty, \\frac{3}{7}] \\cup [\\frac{3}{5}, \\infty)` 与 `(-\\iny,4.29e-01]\\cup[6.00e-01,\\iny)`
	- 含空格：(8, 4, 2) 与 (8,4,2)
	- 无法通过减法后判断是否为0，来判定是否正确
- 矩阵问题，与上面类似，1是无法解析2是无法判等：`\\begin{pmatrix} \\dfrac{6}{5} \\\\ -\\dfrac{17}{5} \\end{pmatrix}` 与 `\\begin{pmatrix}6\/5\\-17\/5\\end{pmatrix}`
- 还有种情况是prompt中让模型输出内容在\box{}里，但模型输出了类似 `\\boxed{\\frac{\\pi}{4}},\\boxed{\\dfrac{9\\pi}{4}}`的多个box，暂不处理

> 以上问题的说明，cursor可以帮你生成一个大概的解决方案，当然代码中有较多细节问题需要修复


## 处理流程

### 获取模型输出结果

math的prompt中，一般都需要模型输出的内容在`\box{}`中，所以第一步要做就是从这里面解析出正确的表达式，这里的方法来自opencompass中数学集的后处理逻辑

```python
def last_boxed_only_string(string):
    idx = string.rfind('\\boxed')
    if idx < 0:
        idx = string.rfind('\\fbox')
        if idx < 0:
            return None

    i = idx
    right_brace_idx = None
    num_left_braces_open = 0
    while i < len(string):
        if string[i] == '{':
            num_left_braces_open += 1
        if string[i] == '}':
            num_left_braces_open -= 1
            if num_left_braces_open == 0:
                right_brace_idx = i
                break
        i += 1

    if right_brace_idx is None:
        retval = None
    else:
        retval = string[idx:right_brace_idx + 1]

    return retval

def remove_boxed(s):
    left = '\\boxed{'
    try:
        assert s[:len(left)] == left
        assert s[-1] == '}'
        return s[len(left):-1]
    except Exception:
        return None

def extract_boxed_answer(pred_str, strip_double_curly_brace=False):
    boxed_str = last_boxed_only_string(pred_str)
    if boxed_str is None:
        return None
    answer = remove_boxed(boxed_str)
    if answer is None:
        return None
    if strip_double_curly_brace:
        match = re.match('^\{(.*)\}$', answer)  # noqa: W605
        if match:
            answer = match.group(1)
    return answer

```


### 统一科学计数法精度

```python
def to_sci_notation(num):
    return re.sub(r'e(\+|-)0(\d+)', r'e\1\2', '{:.2e}'.format(num))
```
### 预处理latex

```python
def calculate_fraction(expr):
    """
    匹配表达式中的 \\frac 结构，单独计算并替换为科学计数法的数值。
    """
    # 匹配 \frac{numerator}{denominator}
    latex_pattern = r"\\d?frac\{([^\}]+)\}\{([^\}]+)\}"
    py_pattern = r"(\d*\.?\d+)/(\d*\.?\d+)"

    def replace_fraction(match):
        # 提取分子和分母
        numerator = match.group(1)
        denominator = match.group(2)
        try:
            # 使用 SymPy 解析和计算
            fraction_value = sympify(f"({numerator})/({denominator})").evalf()
            return to_sci_notation(fraction_value)
        except Exception as e:
            return match.group(0)  # 返回原表达式以防失败

    processed_expr = re.sub(latex_pattern, replace_fraction, expr)
    processed_expr = re.sub(py_pattern, replace_fraction, processed_expr)
    return processed_expr

def calculate_sqrt(expr):
    """
    匹配表达式中的 \\sqrt，单独计算并替换其值。如果前有数字，计算乘积并替换。
    """
    # 匹配 `数字\sqrt` 或独立的 `\sqrt`
    pattern = r"(?:(\d+)\s*)?\\sqrt\{([^\}]+)\}"

    def replace_sqrt(match):
        # 提取数字和 \sqrt 内部内容
        number = match.group(1)
        sqrt_content = match.group(2)
        try:
            # 计算 \sqrt 的值
            sqrt_value = sympify(f"sqrt({sqrt_content})").evalf()
            if number:  # 如果前面有数字
                return to_sci_notation(float(number) * sqrt_value)
            else:  # 如果没有数字
                return to_sci_notation(sqrt_value)
        except Exception as e:
            # logger.info(f"解析错误: {e}, 表达式: \\sqrt{{{sqrt_content}}}")
            return match.group(0)  # 保留原表达式以防失败

    # 替换表达式中的 \sqrt
    processed_expr = re.sub(pattern, replace_sqrt, expr)
    return processed_expr

def preprocess_latex(ori_expr):
    """
    预处理latex表达式
    1. 将表达式中的sqrt、frac处理为python数值，如果是其中含变量无法处理，如frac{x}{y}，则返回原表达式
    2. pmatrix 替换为Matrix([...])
    3. 特殊latex符号归一化
    4. 表达式中空格替换为空
    """
    if ori_expr is None:
        return None

    if 'sqrt' in ori_expr:
        ori_expr = calculate_sqrt(ori_expr)

    if 'frac' in ori_expr or re.search(r"(\d*\.?\d+)/(\d*\.?\d+)", ori_expr):
        ori_expr = calculate_fraction(ori_expr)

    if 'pmatrix' in ori_expr:
        ori_expr = ori_expr.replace(r"\begin{pmatrix}", "Matrix([").replace(
            r"\end{pmatrix}", "])")
        ori_expr = ori_expr.replace(r"\\", "], [")  # 换行替换为新的行
        ori_expr = ori_expr.replace("\\", "], [")  # 列分隔符替换为逗号
        ori_expr = ori_expr.replace("&", ",")  # 列分隔符替换为逗号

    replacements = {
        r"\left": "",
        r"\right": "",
        r"\times": "*",
        r"\div": "/",
        r"\iny": r"\infty",
        r"-\iny": r"-\infty",
        r"\dfrac": r"\frac",  # 存在\frac中包含表达式，无法转为数字的情况，所以在这再替换下
        r"\%": "",
        '%': '',
        r"\pi": "pi",
    }

    for latex_symbol, replacement in replacements.items():
        ori_expr = ori_expr.replace(latex_symbol, replacement)

    ori_expr = ori_expr.split('=')[-1]
    ori_expr = ori_expr.replace(" ", "")

    return ori_expr
```

### 归一化表达式

```python
def normalize_expression(exp):
    # 1. 预处理latex，主要转换了frac、sqrt、pmatrix的情况
    latex_exp = preprocess_latex(exp)
    try:
        # 2. 尝试将简单表达式转换为科学计数法
        float_exp = to_sci_notation(float(latex_exp))
        return float_exp
    except Exception as e:
        try:
            # 3. 尝试将复杂表达式转换为sympy表达式
            expr = parse_expr(latex_exp)
            # 4. 尝试计算sympy表达式
            return to_sci_notation(expr.evalf())
        except Exception as e:
            # 5. 尝试计算eval表达式
            if latex_exp is not None and re.search(r"[+-*/]", latex_exp):
                try:
                    return to_sci_notation(float(eval(latex_exp)))
                except Exception as e:
                    return latex_exp
            return latex_exp
```

### 判断相等

```python
def calculate_expression_with_pi(expr):
    """
    将表达式中的 pi 替换为具体值并计算。
    """
    try:
        # 使用 sympy 替换 pi 为具体值
        parsed_expr = sympify(expr)
        numeric_result = parsed_expr.evalf(subs={'pi': 3.141592653589793})
        return numeric_result
    except Exception as e:
        return expr


def is_eq_expr(expr1, expr2):

    def to_expr(expr):
        try:
            return parse_latex(expr)
        except Exception as e:
            try:
                return parse_expr(expr)
            except Exception as e:
                return expr

    try:
        return sympy.simplify(to_expr(expr1) - to_expr(expr2)) == 0
    except Exception as e:
        return False


# Function to handle timeout
class TimeoutException(Exception):
    pass


def timeout_handler(signum, frame):
    raise TimeoutException()
    

def is_equal(exp1, exp2):
    exp1 = normalize_expression(exp1)
    exp2 = normalize_expression(exp2)

    try:
        if 'pi' in exp1:
            exp1 = calculate_expression_with_pi(exp1)
        if 'pi' in exp2:
            exp2 = calculate_expression_with_pi(exp2)
    except Exception as e:
        pass

    is_equal = exp1 == exp2

    if not is_equal:
        try:
            signal.signal(signal.SIGALRM, timeout_handler)
            signal.alarm(5)  # Set the timeout

            is_equal = is_eq_expr(exp1, exp2)
        except TimeoutException:
            print("Simplification timed out.")
            is_equal = False  # Consider them nonequivalent if timeout occurs
        except Exception as e:
            print(f"An error occurred: {e}")
            is_equal = False  # Handle any other errors

        finally:
            signal.alarm(0)  # Cancel the alarm

    return is_equal

```
## 结果

使用DeepSeek-R1在llama_math和llama_math_hard这2个数据集上结果做对比，在使用上述方法后，准确率分别提升到了 **95.0%** 和 **91.11**

以下是一些示例
```json
{"pred":"\\dfrac{1}{4}","parsed_pred":"2.50e-1","references":"2.50e-1","parsed_references":"2.50e-1","correct":true}
{"pred":"x^3 + 2x^2 + x","parsed_pred":"x^3+2x^2+x","references":"x^3+2x^2+x","parsed_references":"x^3+2x^2+x","correct":true}
{"pred":"\\dfrac{2x - 7}{(x + 1)(x - 2)}","parsed_pred":"\\frac{2x-7}{(x+1)(x-2)}","references":"\\frac{2x-7}{(x+1)(x-2)}","parsed_references":"\\frac{2x-7}{(x+1)(x-2)}","correct":true}
{"pred":"[5, 5\\sqrt{2}]","parsed_pred":"[5, 7.07000000000000]","references":"[5,5\\sqrt{2}]","parsed_references":"[5, 7.07000000000000]","correct":true}
{"pred":"2(1 + x^2 + x^4 + x^6 + x^8 + x^{10})","parsed_pred":"2(1+x^2+x^4+x^6+x^8+x^{10})","references":"2x^{10}+2x^8+2x^6+2x^4+2x^2+2","parsed_references":"2x^{10}+2x^8+2x^6+2x^4+2x^2+2","correct":true}
{"pred":"(4, 1)","parsed_pred":"(4,1)","references":"(4,1)","parsed_references":"(4,1)","correct":true}
{"pred":"\\begin{pmatrix} 2 \\\\ 3 \\\\ 1 \\end{pmatrix}","parsed_pred":"Matrix([2],[3],[1])","references":"\\begin{pmatrix}2\\3\\1\\end{pmatrix}","parsed_references":"Matrix([2],[3],[1])","correct":true}
{"pred":"\\begin{pmatrix} \\dfrac{6}{5} \\\\ -\\dfrac{17}{5} \\end{pmatrix}","parsed_pred":"Matrix([1.20e+0],[-3.40e+0])","references":"\\begin{pmatrix}6\/5\\-17\/5\\end{pmatrix}","parsed_references":"Matrix([1.20e+0],[-3.40e+0])","correct":true}
{"pred":"\\begin{pmatrix} \\dfrac{2}{5} \\\\ -\\dfrac{1}{5} \\\\ 0 \\end{pmatrix}","parsed_pred":"Matrix([4.00e-1],[-2.00e-1],[0])","references":"\\begin{pmatrix}2\/5\\-1\/5\\0\\end{pmatrix}","parsed_references":"Matrix([4.00e-1],[-2.00e-1],[0])","correct":true}
```