import { h } from "preact"
import { getAllSegmentPrefixes } from "@quartz-community/utils"

const defaultOptions = {
  title: "Tag Cloud",
  includeTreeTags: true,
  minCount: 1,
  minSize: 12,
  maxSize: 60,
  gridSize: 8,
  ellipticity: 1,
  backgroundColor: "transparent",
  shape: "circle",
  shuffle: true,
  rotateRatio: 0.3,
  minRotation: -0.785,
  maxRotation: 0.785,
}

const colorPalette = [
  "#6a4c93", "#8a5a44", "#2a9d8f", "#e76f51", "#264653",
  "#f4a261", "#457b9d", "#d62828", "#3a86ff", "#8338ec",
  "#ff006e", "#1d3557", "#e9c46a", "#2b2d42", "#8d99ae",
]

function normalizeOptions(opts) {
  return { ...defaultOptions, ...(opts ?? {}) }
}

function parseTags(tags) {
  if (Array.isArray(tags)) return tags
  if (typeof tags === "string") {
    // Support common frontmatter styles:
    // - "tag-a, tag-b"
    // - "tag-a tag-b"
    // - "#tag-a #tag-b"
    return tags
      .split(/[,\n]/g)
      .flatMap((part) => part.trim().split(/\s+/g))
      .filter(Boolean)
  }
  return []
}

function getExpandedTags(tags, includeTreeTags) {
  const cleanTags = parseTags(tags)
    .map((tag) => String(tag ?? "").trim().replace(/^#+/, ""))
    .filter((tag) => tag.length > 0)
  return includeTreeTags ? cleanTags.flatMap(getAllSegmentPrefixes) : cleanTags
}

function hashString(input) {
  let hash = 2166136261
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return Math.abs(hash >>> 0)
}

function toSafeInlineJson(value) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029")
}

const TagCloudContent = (options) => {
  function TagCloudComponent({ fileData, allFiles }) {
    const sourceFiles = allFiles.filter((file) => file?.unlisted !== true)

    const tagCountMap = new Map()
    for (const file of sourceFiles) {
      const tags = getExpandedTags(file.frontmatter?.tags ?? [], options.includeTreeTags)
      for (const tag of tags) {
        tagCountMap.set(tag, (tagCountMap.get(tag) ?? 0) + 1)
      }
    }

    const filteredEntries = [...tagCountMap.entries()]
      .filter(([, count]) => count >= options.minCount)
      .sort((a, b) => {
        if (b[1] !== a[1]) return b[1] - a[1]
        return a[0].localeCompare(b[0])
      })

    const tagData = filteredEntries.map(([tag, count]) => {
      const seed = hashString(tag)
      return { tag, count, color: colorPalette[seed % colorPalette.length] }
    })

    const minSize = Number(options.minSize ?? 12)
    const maxSize = Number(options.maxSize ?? 60)
    const sizeRange = Math.max(maxSize - minSize, 1)
    const total = Math.max(tagData.length - 1, 1)

    // Deterministic rank-only sizing with strong contrast.
    // This guarantees visible differences regardless of count distribution.
    const list = tagData.map((t, index) => {
      const rankRatio = 1 - index / total
      const emphasized = Math.pow(rankRatio, 2.6)
      const px = Math.round(minSize + sizeRange * emphasized)
      return [t.tag, px]
    })

    const payloadJson = toSafeInlineJson({
      list,
      tagData,
      colors: colorPalette,
      options: {
      minSize: options.minSize,
      maxSize: options.maxSize,
      gridSize: options.gridSize,
      ellipticity: options.ellipticity,
      backgroundColor: options.backgroundColor,
      shape: options.shape,
      shuffle: options.shuffle,
      rotateRatio: options.rotateRatio,
      minRotation: options.minRotation,
      maxRotation: options.maxRotation,
      },
    })

    return h("div", { class: "tag-cloud-page" }, [
      h("article", { class: "tag-cloud-page__intro" }, [
        h("p", {}, `${filteredEntries.length} tags from ${sourceFiles.length} notes`),
      ]),
      filteredEntries.length === 0
        ? h("p", { class: "tag-cloud-page__empty" }, "No tags found.")
        : h(
            "div",
            { class: "tag-cloud-page__canvas-container", "data-page-slug": fileData.slug ?? "tags-cloud" },
            h("canvas", { class: "tag-cloud-page__canvas" })
          ),
      filteredEntries.length > 0 &&
        h(
          "script",
          {
            type: "application/json",
            id: "tag-cloud-page__data",
            dangerouslySetInnerHTML: { __html: payloadJson },
          },
          [],
        ),
    ])
  }

  TagCloudComponent.afterDOMLoaded = `
(function () {
  function ensureWordCloudLoaded(cb) {
    if (window.WordCloud) return cb()
    var existing = document.querySelector('script[data-wordcloud2-loader="1"]')
    if (existing) return existing.addEventListener("load", cb, { once: true })
    var script = document.createElement("script")
    script.src = "https://cdn.jsdelivr.net/npm/wordcloud@1.2.3/src/wordcloud2.min.js"
    script.async = true
    script.setAttribute("data-wordcloud2-loader", "1")
    script.addEventListener("load", cb, { once: true })
    document.head.appendChild(script)
  }

  function getPayload() {
    var payloadEl = document.getElementById("tag-cloud-page__data")
    if (!payloadEl) return null
    try {
      return JSON.parse(payloadEl.textContent || "{}")
    } catch (_e) {
      return null
    }
  }

  function renderTagCloud() {
    var payload = getPayload()
    if (!payload) return
    var canvas = document.querySelector(".tag-cloud-page__canvas")
    if (!canvas) return
    var container = canvas.parentElement
    if (!container) return

    var list = payload.list || []
    var tagData = payload.tagData || []
    var opts = payload.options || {}
    var colors = payload.colors || []
    if (!list.length) return
    function resizeCanvas() {
      var rect = container.getBoundingClientRect()
      canvas.width = Math.max(1, Math.floor(rect.width))
      canvas.height = Math.max(1, Math.floor(rect.height))
      canvas.style.width = rect.width + "px"
      canvas.style.height = rect.height + "px"
    }

    var tagMap = new Map(tagData.map(function (t) { return [t.tag, t] }))

    function draw() {
      window.WordCloud(canvas, {
        list: list,
        gridSize: opts.gridSize,
        // Use precomputed px value directly from list.
        weightFactor: 1,
        fontFamily: "var(--font-body), system-ui, sans-serif",
        color: function (word) {
          var tagInfo = tagMap.get(word)
          return tagInfo ? tagInfo.color : colors[0] || "#6a4c93"
        },
        backgroundColor: opts.backgroundColor,
        shape: opts.shape,
        ellipticity: opts.ellipticity,
        shuffle: opts.shuffle,
        rotateRatio: opts.rotateRatio,
        rotationSteps: 2,
        minRotation: opts.minRotation,
        maxRotation: opts.maxRotation,
        drawOutOfBound: false,
        shrinkToFit: true,
        click: function (item) {
          var tag = item[0]
          var prefix = window.location.pathname.replace(/\\/tags-cloud\\/?$/, "/")
          if (prefix === window.location.pathname) prefix = "/"
          window.location.href = prefix + "tags/" + encodeURIComponent(tag) + "/"
        },
        hover: function (item) {
          canvas.style.cursor = item ? "pointer" : "default"
        },
      })
    }

    resizeCanvas()
    draw()

    if (canvas.__tagCloudResizeObserver) {
      canvas.__tagCloudResizeObserver.disconnect()
    }
    var ro = new ResizeObserver(function () {
      resizeCanvas()
      draw()
    })
    ro.observe(container)
    canvas.__tagCloudResizeObserver = ro
  }

  function bootstrap() {
    ensureWordCloudLoaded(renderTagCloud)
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap)
  } else {
    bootstrap()
  }
  document.addEventListener("nav", bootstrap)
})()
  `.trim()

  TagCloudComponent.css = `
.tag-cloud-page__intro {
  margin-bottom: 1rem;
}

.tag-cloud-page__intro h1 {
  margin-bottom: 0.25rem;
}

.tag-cloud-page__intro p {
  color: var(--darkgray);
  margin-top: 0;
}

.tag-cloud-page__canvas-container {
  background: radial-gradient(circle at center, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.2) 70%);
  border-radius: 1.2rem;
  height: min(70vh, 680px);
  margin-top: 0.6rem;
  overflow: hidden;
  position: relative;
}

.tag-cloud-page__canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.tag-cloud-page__empty {
  color: var(--darkgray);
}

@media all and (max-width: 800px) {
  .tag-cloud-page__canvas-container {
    height: min(66vh, 520px);
  }
}
`

  return TagCloudComponent
}

export const TagCloudPage = (opts) => {
  const options = normalizeOptions(opts)
  return {
    name: "TagCloudPage",
    priority: 12,
    match({ slug }) {
      return slug === "tags-cloud"
    },
    generate({ content }) {
      const hasExisting = content.some(([, file]) => file.data.slug === "tags-cloud")
      if (hasExisting) return []
      return [{
        slug: "tags-cloud",
        title: options.title,
        data: {},
      }]
    },
    layout: "content",
    body: () => TagCloudContent(options),
  }
}

export default TagCloudPage
