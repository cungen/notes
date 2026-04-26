import { h } from "preact"
import { joinSegments, pathToRoot, simplifySlug } from "@quartz-community/utils"

const defaultNavOptions = {
  nav: [
    { label: "Home", href: "/" },
    { label: "Tags", href: "/tags" },
    { label: "Tag Cloud", href: "/tags-cloud" },
  ],
}

function normalizeHref(href) {
  if (!href) return "/"
  return href.startsWith("/") ? href.slice(1) : href
}

function isExternalHref(href) {
  return /^(https?:)?\/\//.test(href)
}

function isActiveSlug(currentSlug, targetSlug) {
  if (targetSlug === "" || targetSlug === "/") {
    return currentSlug === "/" || currentSlug === ""
  }

  if (currentSlug === targetSlug) return true
  return currentSlug.startsWith(`${targetSlug}/`)
}

export const HeaderNav = (opts) => {
  const options = { ...defaultNavOptions, ...opts }

  function HeaderNavComponent({ fileData }) {
    const slug = simplifySlug(fileData?.slug ?? "")
    const baseDir = pathToRoot(fileData?.slug ?? "")

    const children = options.nav.map((item) => {
      const href = item.href ?? "/"
      const targetSlug = normalizeHref(href)
      const active = !isExternalHref(href) && isActiveSlug(slug, targetSlug)

      const resolvedHref = isExternalHref(href) ? href : joinSegments(baseDir, targetSlug)
      return h(
        "a",
        {
          class: `quartz-header-nav__item ${active ? "is-active" : ""}`,
          href: resolvedHref,
          target: item.external ? "_blank" : undefined,
          rel: item.external ? "noopener noreferrer" : undefined,
        },
        item.label,
      )
    })

    return h("nav", { class: "quartz-header-nav", "aria-label": "Primary" }, children)
  }

  HeaderNavComponent.css = `
.quartz-header-nav {
  align-items: center;
  border-bottom: 1px solid var(--lightgray);
  display: flex;
  flex-wrap: nowrap;
  gap: 0;
  margin: 0 0 0.5rem;
  overflow-x: auto;
  padding: 0.1rem 0;
  white-space: nowrap;
}

.quartz-header-nav__item {
  color: var(--darkgray);
  display: inline-flex;
  font-size: 0.85rem;
  line-height: 1.2;
  padding: 0.35rem 0.8rem;
  position: relative;
  text-decoration: none;
  transition: all 120ms ease;
}

.quartz-header-nav__item + .quartz-header-nav__item::before {
  background: var(--lightgray);
  content: "";
  height: 0.95rem;
  left: 0;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 1px;
}

.quartz-header-nav__item:hover {
  color: var(--secondary);
}

.quartz-header-nav__item.is-active {
  color: var(--secondary);
  font-weight: 600;
}
`

  return HeaderNavComponent
}

