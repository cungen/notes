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
      return h("li", { class: "quartz-header-nav__entry" }, [
        h(
          "a",
          {
            class: `quartz-header-nav__item ${active ? "is-active" : ""}`,
            href: resolvedHref,
            target: item.external ? "_blank" : undefined,
            rel: item.external ? "noopener noreferrer" : undefined,
          },
          item.label,
        ),
      ])
    })

    return h("nav", { class: "quartz-header-nav", "aria-label": "Primary" }, [
      h("ul", { class: "quartz-header-nav__list" }, children),
    ])
  }

  HeaderNavComponent.css = `
.quartz-header-nav {
  margin: 0 0 0.8rem;
}

.quartz-header-nav__list {
  align-items: center;
  background: color-mix(in srgb, var(--light) 92%, var(--lightgray) 8%);
  border: 1px solid color-mix(in srgb, var(--lightgray) 70%, var(--gray) 30%);
  border-radius: 999px;
  box-shadow: 0 1px 0 color-mix(in srgb, var(--lightgray) 70%, var(--light) 30%) inset;
  display: inline-flex;
  gap: 0.2rem;
  list-style: none;
  margin: 0;
  max-width: 100%;
  overflow-x: auto;
  padding: 0.2rem;
  scrollbar-width: thin;
  -webkit-overflow-scrolling: touch;
  white-space: nowrap;
}

.quartz-header-nav__entry {
  margin: 0;
  padding: 0;
}

.quartz-header-nav__item {
  color: var(--darkgray);
  display: inline-flex;
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  line-height: 1.2;
  padding: 0.42rem 0.9rem;
  border-radius: 999px;
  text-decoration: none;
  transition: color 120ms ease, background-color 120ms ease, transform 120ms ease;
}

.quartz-header-nav__item:hover {
  background: color-mix(in srgb, var(--lightgray) 65%, var(--light) 35%);
  color: var(--secondary);
  transform: translateY(-1px);
}

.quartz-header-nav__item.is-active {
  background: var(--secondary);
  box-shadow: 0 1px 2px color-mix(in srgb, var(--dark) 22%, transparent);
  color: var(--light);
}

.quartz-header-nav__item.is-active:hover {
  background: color-mix(in srgb, var(--secondary) 88%, black 12%);
  color: var(--light);
}

@media (max-width: 800px) {
  .quartz-header-nav {
    margin-bottom: 0.7rem;
  }

  .quartz-header-nav__list {
    border-radius: 16px;
    display: flex;
    width: 100%;
  }

  .quartz-header-nav__item {
    font-size: 0.8rem;
    padding: 0.4rem 0.75rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .quartz-header-nav__item {
    transition: none;
  }
}
`

  return HeaderNavComponent
}

