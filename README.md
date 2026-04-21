# Quartz (v5)

> “[One] who works with the door open gets all kinds of interruptions, but [they] also occasionally gets clues as to what the world is and what might be important.” — Richard Hamming

Quartz is a set of tools that helps you publish your [digital garden](https://jzhao.xyz/posts/networked-thought) and notes as a website for free.

🔗 Documentation: https://quartz.jzhao.xyz/

[Join the Discord Community](https://discord.gg/cRFFHYye7t)

## Requirements

- **Node.js** ≥ 22  
- **npm** ≥ 10.9.2  

## Setup

```bash
npm install
```

`prebuild` runs automatically after install (plugin install + `.quartz/plugins/index.ts` regeneration).

## Local development

Preview the site from the **`content/`** vault with live reload:

```bash
npm run docs
```

This runs `npx quartz build --serve -d content`. A server starts (default **http://localhost:8080**). Edit notes under `content/`; Quartz rebuilds and the browser reloads. Stop with `Ctrl+C`.

To use another content directory or options, call the CLI directly:

```bash
npx quartz build --serve -d path/to/notes
```

Useful flags: `--verbose` for detailed logs, `-o public` to change the output folder (default is `public`).

## Build for deployment

Produce a **static site** in `public/` (suitable for GitHub Pages, Netlify, Cloudflare Pages, any static host):

```bash
npx quartz build -d content
```

- **Input:** Markdown and assets under `content/` (see `ignorePatterns` in `quartz.config.yaml`).  
- **Output:** static files in `public/`.  
- Deploy by uploading `public/` or pointing your host at that folder after CI runs the command.

Before deploying, set **`configuration.baseUrl`** in `quartz.config.yaml` to your real site URL so feeds, SEO, and absolute links are correct.

## Checks

```bash
npm run check    # Typecheck + Prettier check
npm run format   # Prettier write
```

## Sponsors

<p align="center">
  <a href="https://github.com/sponsors/jackyzha0">
    <img src="https://cdn.jsdelivr.net/gh/jackyzha0/jackyzha0/sponsorkit/sponsors.svg" />
  </a>
</p>
