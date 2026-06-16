# HTML Artifacts Convention

## Folder Structure

```
artifacts/
├── agents.md              ← this file
├── architecture/          ← 软件架构、系统设计相关
├── agent/                 ← AI Agent、Vibe Coding 相关
└── devops/                ← DevOps、CI/CD、运维相关
```

## Naming Convention

Format: `{YYYYMMDD}_{name}.html`

Examples:
- `20260601_architecture-agent-era.html`
- `20260601_agent-era-sdlc-process.html`
- `20260601_xhs-agent-sdlc.html`
- `20260601_wechat-agent-sdlc.html`

## Rules

1. Date prefix uses creation date (not modification date)
2. Name uses kebab-case, short and descriptive
3. Each theme gets its own subfolder
4. One HTML file = one publication
5. To add a new theme, create a new subfolder and update this file

## Themes

| Folder | Description | Keywords |
|--------|-------------|----------|
| `architecture/` | 软件架构、系统设计、质量属性、评估方法 | ATAM, ADR, 架构风格, 模块化 |
| `agent/` | AI Agent 时代开发方法、Coding Agent、Vibe Coding | Agent, Claude, Cursor, Copilot |
| `devops/` | DevOps、CI/CD、自动化、运维 | CI, CD, Docker, K8s |

## Source Templates

Templates from `/Users/owen/workspace/repos/html-anything/next/src/lib/templates/skills/`:
- `article-magazine/` → 公众号 / 博客长文
- `card-xiaohongshu/` → 小红书卡片
- `deck-obsidian-claude/` → 技术分享 Deck
- `blog-post/` → 博客长文
