---
title: Agent时代软件开发全流程
tags:
  - area/softwareengineering/architecture
  - area/ai/agent
  - kind/note
date: 2026-06-01
---

## 核心原则：角色的重新分配

- **Human**: Define → Constrain → Verify
- **Agent**: Implement → Assemble → Iterate
- **Automation**: Enforce → Monitor → Alert

开发流程不是「AI 替代某些步骤」，而是**人类角色从「执行」转向「指定、约束和验证」**。

---

## Phase A — 定义阶段 Definition

### Step 1: 需求分析与质量属性定义

**Actor:** Human-led

**Input:**
- 业务需求文档 / 用户故事
- 利益相关者期望
- 系统现有状态（如为增量开发）
- 行业/合规约束

**Output:**
- **质量属性效用树 (Utility Tree)**
- 功能需求清单（优先级排序）
- 质量属性场景（具体可度量：刺激、环境、响应、度量指标）
- 架构驱动因素 (Architectural Drivers)

**Activities:**
1. 识别功能需求并按 MoSCoW 方法分类优先级
2. 构建质量属性效用树：业务目标 → 质量属性 → 具体场景
3. 识别架构驱动因素（对架构影响最大的 3-8 个需求）
4. 定义「完成标准」——每个需求怎样才算做完

**Quality Gate:** 架构驱动因素清单已获利益相关者确认；每个质量属性场景有可度量指标（不是「要快」，而是「P99 < 200ms」）

---

### Step 2: 架构设计与决策

**Actor:** Human-led + Agent-assisted

**Input:**
- 质量属性效用树
- 架构驱动因素清单
- 现有系统架构（如有）
- 团队技术栈和运维能力

**Output:**
- **架构风格选型及理由**
- **模块/子系统分解图**
- **架构决策记录 (ADR)**
- 架构多视图文档（逻辑/开发/部署/进程）

**Activities:**
1. 根据质量属性需求评估候选架构风格（分层、六边形、微服务、事件驱动等）
2. 选择对 Agent 友好的风格（接口契约清晰、模块边界明确）
3. 进行模块分解：定义子系统/模块/组件及其职责
4. 使用 ATAM 方法评估架构方案的敏感点和权衡点
5. 为每个重要决策编写 ADR（背景、决策、理由、后果、备选方案）

**Quality Gate:** ADR 已编写并通过评审；关键质量属性的架构策略已明确

---

### Step 3: 复用资产盘点与组件规划

**Actor:** Human-led + Agent-assisted

> 这是 Agent 时代**杠杆率最高的步骤**。

**Input:**
- 模块分解图（来自 Step 2）
- 现有组件库 / Design System
- 开源生态中的可用组件
- 组织内部已沉淀的服务和工具

**Output:**
- **复用映射表**（需求 ↔ 已有组件/需新建）
- **组件目录 (Component Catalog)**
- 需新建组件清单及其规格
- 复用率目标（建议 ≥ 60%）

**Activities:**
1. 扫描现有组件库、内部服务、开源依赖，标记可复用项
2. 为每个可复用组件补充接口说明和使用示例（Agent 友好格式）
3. 识别需要新建的组件，定义其接口规格和验收标准
4. 制定复用优先策略：优先复用 > 适配复用 > 新建
5. 建立组件发现机制（tag、search index、example gallery）

**Quality Gate:** 复用映射表完成，每项需求已有明确的复用/新建判定；组件目录可被 Agent 检索和理解

---

## Phase B — 规约阶段 Specification

### Step 4: 接口契约定义

**Actor:** Human-led

> 契约是人与 Agent 之间最重要的接口。

**Input:**
- 模块分解图 + ADR（来自 Step 2）
- 复用映射表（来自 Step 3）
- 需新建组件的接口规格
- 质量属性场景（性能/安全等约束）

**Output:**
- **API 契约文档**（OpenAPI / Protobuf / GraphQL Schema）
- **内部接口定义**（模块间调用协议）
- **数据模型/Schema**
- 契约版本号与变更策略

**Activities:**
1. 定义模块间的 API 契约（请求/响应格式、错误码、版本策略）
2. 定义内部接口（函数签名、数据结构、依赖注入接口）
3. 标注每个接口的质量属性约束（超时、重试、幂等性要求等）
4. 将契约文档化为 machine-readable 格式（供自动化验证使用）

**Quality Gate:** 所有模块间接口已定义；契约可被自动化工具解析；无模糊或遗漏的接口

---

### Step 5: 测试规约与验收标准

**Actor:** Human-led + Agent-assisted

**Input:**
- 功能需求 + 质量属性场景（来自 Step 1）
- 接口契约（来自 Step 4）
- 复用组件的已知行为

**Output:**
- **验收测试用例**（Given-When-Then）
- **契约测试定义**（Pact / Spring Cloud Contract）
- **测试优先级矩阵**
- 性能/安全测试基线

**Activities:**
1. 为每个接口契约编写契约测试骨架
2. 为每个功能需求编写验收测试场景（BDD 格式）
3. 定义测试金字塔各层的覆盖范围和优先级
4. 设定性能基线和安全测试检查项

**Quality Gate:** 每个接口至少有 1 个契约测试；核心功能有 Given-When-Then 验收场景；测试可自动化运行

---

## Phase C — 实现阶段 Implementation

### Step 6: 增量实现（Agent-Assisted）

**Actor:** Agent-led + Human-guided

**Input:**
- 接口契约（来自 Step 4）
- 验收测试用例（来自 Step 5）
- 复用映射表 & 组件目录（来自 Step 3）
- 编码规范与架构约束

**Output:**
- **可运行的代码增量**
- **单元测试**（Agent 自动生成）
- **增量 Diff**（供人类 Review）
- 实现笔记（Agent 记录的设计选择）

**Activities:**
1. **组件搜索优先：** Agent 先检索组件目录，尝试复用已有组件
2. 在契约约束内生成实现代码
3. 为生成的代码自动补充单元测试
4. 每个增量通过 CI 的自动化质量门禁（lint、类型检查、单元测试）
5. 记录增量中隐含的设计选择，供后续 ADR 补充

**Quality Gate:** 每个增量 ≤ 可在一个 Review 会话中评审的体量；CI 绿灯；契约测试通过；复用率达标

---

### Step 7: 架构符合性验证

**Actor:** Automation-led + Human-reviewed

**Input:**
- 代码增量（来自 Step 6）
- 架构约束规则（分层、依赖方向等）
- 接口契约（作为比对基准）

**Output:**
- **架构合规报告**
- **Review 意见**（聚焦架构/集成层面）
- 需修正的问题清单

**Activities:**
1. 自动化：ArchUnit / Fitness Function 检查依赖方向、分层合规
2. 自动化：契约比对——实现是否与定义的接口一致
3. 人类：Review 架构符合性——是否遵守模块边界？是否正确使用组件？是否引入不必要的耦合？
4. 人类：检查 Agent 的设计选择记录，对隐含决策确认或修正

**Quality Gate:** 架构合规报告无严重违规；Review 意见已处理；无未确认的隐含架构决策

---

## Phase D — 验证阶段 Verification

### Step 8: 集成与端到端验证

**Actor:** Automation-led + Human-monitored

**Input:**
- 通过符合性验证的代码增量
- 契约测试套件（来自 Step 5）
- 端到端测试场景
- 性能/安全基线

**Output:**
- **集成测试报告**
- **端到端测试报告**
- **性能基线对比**
- 遗留问题清单

**Activities:**
1. 运行契约测试：验证所有模块间接口行为一致
2. 运行端到端测试：验证用户级场景走通
3. 性能测试：对比基线，确认无退化
4. 安全扫描：依赖检查、SAST
5. 修复集成问题（Agent 辅助，人类确认）

**Quality Gate:** 所有契约测试通过；核心端到端场景绿；性能在基线范围内；无高危安全问题

---

## Phase E — 演进阶段 Evolution

### Step 9: 知识沉淀与资产演进

**Actor:** Human-led + Agent-assisted

**Input:**
- 本次迭代产出的新代码和组件
- ADR 补充记录
- 遗留问题清单（来自 Step 8）
- Review 中发现的模式/反模式

**Output:**
- **更新的组件目录**（新增可复用组件）
- **更新的 ADR**
- **迭代复盘报告**
- **复用率趋势**
- 下一迭代的改进项

**Activities:**
1. **提取新组件：** 将本次迭代中出现的新模式/组件抽象化，补充到组件目录
2. 更新 ADR：补充实现中隐含发现的决策
3. 计算复用率：本次功能中复用组件占比 vs. 新建代码占比
4. 复盘：哪些架构约束有效？哪些被绕过了？为什么？
5. 更新自动化规则：将新发现的架构违规模式加入 Fitness Function

**Quality Gate:** 新组件已入库且有文档；ADR 已更新；复用率趋势可追踪；复盘结论已转化为 Action Item

---

## 全流程总览

| Step | Phase | Primary Actor | Key Output |
|------|-------|--------------|------------|
| 1 | Definition | Human | 质量属性效用树 + 架构驱动因素 |
| 2 | Definition | Human + Agent | 架构风格 + 模块分解 + ADR |
| 3 | Definition | Human + Agent | 复用映射表 + 组件目录 |
| 4 | Specification | Human | API 契约 + 接口定义 + Schema |
| 5 | Specification | Human + Agent | 验收测试 + 契约测试 |
| 6 | Implementation | Agent + Human | 可运行代码增量 + 单元测试 |
| 7 | Verification | Automation + Human | 架构合规报告 + Review 意见 |
| 8 | Verification | Automation + Human | 集成/性能/安全测试报告 |
| 9 | Evolution | Human + Agent | 更新组件库 + 复盘报告 + ADR 更新 |

> The process is not linear — it's a **spiral**. Each iteration deepens the component library, tightens the architecture constraints, and increases the reuse rate. The system gets faster and higher quality over time.

---

*Related: [[Agent时代架构设计方法有效性分析]] · [[软件系统架构评估]] · [[软件架构复用]]*
