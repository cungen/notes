import { h } from "preact"
import { getAllSegmentPrefixes } from "@quartz-community/utils"

const defaultOptions = {
  title: "Tag Cloud",
  includeTreeTags: true,
  minCount: 1,
  minSize: 10,
  maxSize: 40,
  gridSize: 8,
  ellipticity: 1,
  backgroundColor: "transparent",
  shape: "circle",
  shuffle: true,
  rotateRatio: 0.22,
  minRotation: -0.785,
  maxRotation: 0.785,
  fontFamily: "system-ui, sans-serif",
  spiral: "rectangular",
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

    const minSize = Number(options.minSize ?? 10)
    const maxSize = Number(options.maxSize ?? 60)
    const sizeRange = Math.max(maxSize - minSize, 1)
    const total = Math.max(tagData.length - 1, 1)

    // Rebalanced sizing: slightly larger top tags with tighter packing.
    const words = tagData.map((t, index) => {
      const rankRatio = 1 - index / total
      const emphasized = Math.pow(rankRatio, 1.18)
      const size = Math.max(minSize, Math.round(minSize + sizeRange * emphasized))
      return { ...t, size }
    })

    const payloadJson = toSafeInlineJson({
      words,
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
      fontFamily: options.fontFamily,
      spiral: options.spiral,
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
            h("div", { class: "tag-cloud-page__surface" })
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
  function loadScript(url, key, cb) {
    var doneAttr = "data-tag-cloud-loader-" + key
    var existing = document.querySelector('script[' + doneAttr + '="1"]')
    if (existing) return existing.addEventListener("load", cb, { once: true })
    var script = document.createElement("script")
    script.src = url
    script.async = true
    script.setAttribute(doneAttr, "1")
    script.addEventListener("load", cb, { once: true })
    document.head.appendChild(script)
  }

  function ensureD3CloudLoaded(cb) {
    if (window.d3 && window.d3.layout && window.d3.layout.cloud) return cb()
    loadScript("https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js", "d3", function () {
      if (window.d3 && window.d3.layout && window.d3.layout.cloud) return cb()
      loadScript("https://cdn.jsdelivr.net/npm/d3-cloud@1/build/d3.layout.cloud.js", "d3-cloud", cb)
    })
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
    var surface = document.querySelector(".tag-cloud-page__surface")
    if (!surface) return
    var container = surface.parentElement
    if (!container) return

    var words = payload.words || []
    var opts = payload.options || {}
    if (!words.length || !window.d3 || !window.d3.layout || !window.d3.layout.cloud) return

    function draw() {
      var rect = container.getBoundingClientRect()
      var width = Math.max(1, Math.floor(rect.width))
      var height = Math.max(1, Math.floor(rect.height))
      surface.innerHTML = ""

      var verticalRatio = Math.max(0, Math.min(1, Number(opts.rotateRatio ?? 0.22)))
      var cssFontBody = getComputedStyle(document.documentElement).getPropertyValue("--font-body").trim()
      var fontFamily = String(opts.fontFamily || "").trim() || (cssFontBody ? (cssFontBody + ", system-ui, sans-serif") : "system-ui, sans-serif")
      var cloudWords = words.map(function (w) {
        var rotation = Math.random() < verticalRatio ? 90 : 0
        return {
          text: w.tag,
          size: Math.max(1, Number(w.size) || 12),
          color: w.color,
          count: w.count,
          rotate: Math.round(rotation / 45) * 45,
        }
      })

      window.d3.layout.cloud()
        .size([width, height])
        .words(cloudWords)
        .text(function (d) { return d.text })
        .padding(Math.max(2, Number(opts.gridSize) || 8))
        .rotate(function (d) { return d.rotate })
        .font(fontFamily)
        .spiral(opts.spiral === "archimedean" ? "archimedean" : "rectangular")
        .fontSize(function (d) { return d.size })
        .on("end", function (layoutWords) {
          var svg = window.d3.select(surface)
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", "0 0 " + width + " " + height)
            .attr("preserveAspectRatio", "xMidYMid meet")

          var root = svg.append("g").attr("transform", "translate(" + (width / 2) + "," + (height / 2) + ")")

          root.selectAll("text")
            .data(layoutWords)
            .enter()
            .append("text")
            .style("font-size", function (d) { return d.size + "px" })
            .style("font-family", fontFamily)
            .style("fill", function (d) { return d.color || "#6a4c93" })
            .style("text-shadow", "0 1px 1px rgba(0, 0, 0, 0.14), 0 0 1px rgba(255, 255, 255, 0.22)")
            .style("cursor", "pointer")
            .attr("text-anchor", "middle")
            .attr("transform", function (d) { return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")" })
            .text(function (d) { return d.text })
            .on("click", function (_event, d) {
              var prefix = window.location.pathname.replace(/\\/tags-cloud\\/?$/, "/")
              if (prefix === window.location.pathname) prefix = "/"
              window.location.href = prefix + "tags/" + encodeURIComponent(d.text) + "/"
            })
            .append("title")
            .text(function (d) { return d.text + " (" + d.count + ")" })
        })
        .start()
    }

    draw()

    if (surface.__tagCloudResizeObserver) {
      surface.__tagCloudResizeObserver.disconnect()
    }
    var ro = new ResizeObserver(function () {
      draw()
    })
    ro.observe(container)
    surface.__tagCloudResizeObserver = ro
  }

  function bootstrap() {
    ensureD3CloudLoaded(renderTagCloud)
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

.tag-cloud-page__surface {
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
