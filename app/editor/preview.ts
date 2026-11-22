// The components a page is rendered with, for the editor's preview: the same
// as the site uses (the layer's pages/[...slug].vue for
// a page, app/pages/[lang].vue for a language's homepage, index.md).
import { markRaw } from 'vue'
import type { Component } from 'vue'
import type { NodeTransform } from '@comark/vue'
import { Mermaid } from '@comark/vue/plugins/mermaid'
import * as prose from '@nuxt/ui/components/prose'

const docs = byFileName(import.meta.glob('../../node_modules/comark-docs/app/components/content/*.{vue,ts}', { eager: true, import: 'default' }))
const landing = byFileName(import.meta.glob('../../node_modules/comark-docs/app/components/content/landing/*.{vue,ts}', { eager: true, import: 'default' }))

// Components, not state.
const raw = (components: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(components).map(([name, component]) => [name, markRaw(component as Component)]))

export const pageComponents = raw({ ...prose, ...docs, Mermaid })
export const homepageComponents = raw({ ...prose, ...landing })

/** path: in content/, without .md. cs/index is the Czech homepage, everything else a page. */
export function componentsFor(path: string) {
  return /^[a-z]{2}\/index$/.test(path) ? homepageComponents : pageComponents
}

/**
 * For rendering inside the editor: the homepage's .hero-cover would put the
 * cover photo behind the whole page (app/assets/css/main.css), editor included.
 */
export const inEditor: NodeTransform = ({ props }) => {
  const classes = props.class
  if (typeof classes === 'string' && /\bhero-cover\b/.test(classes)) {
    return { props: { ...props, class: classes.replace(/\bhero-cover\b/, '').trim() } }
  }
  if (Array.isArray(classes) && classes.includes('hero-cover')) {
    return { props: { ...props, class: classes.filter((name) => name !== 'hero-cover') } }
  }
}


// What plain Markdown already writes (the toolbar's other buttons), and the
// components that go inside a line rather than around lines.
const MARKDOWN = new Set(['A', 'Blockquote', 'Code', 'Em', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'Hr', 'Img', 'Li', 'Ol', 'P', 'Pre', 'Script', 'Strong', 'Table', 'Tbody', 'Td', 'Th', 'Thead', 'Tr', 'Ul', 'Mermaid'])
const INLINE = new Set(['Badge', 'Kbd', 'Button'])
// Boxes around text, in a menu of their own.
const CALLOUTS = new Set(['Note', 'Tip', 'Warning', 'Caution', 'Callout'])
// Not offered: parts that only go inside another component (inserted with it,
// below), components for code and API documentation, a live web page in a
// frame (Browser), an icon by its name, and Collapsible (Accordion does it
// better). They still render when a page has them.
const HIDDEN = new Set([
  'AccordionItem', 'TabsItem',
  'CodeCollapse', 'CodeExplorer', 'CodeGroup', 'CodeIcon', 'CodePreview', 'CodeTree', 'Field', 'FieldGroup', 'Prompt',
  'Browser', 'Icon', 'Collapsible',
])

/**
 * Components that need more than text around them, with blanks to fill in:
 * {title}, or {link} for an address. The first one is selected after
 * inserting. A block one gets the lines (body), an inline one the selection.
 */
export const componentTemplates: Record<string, (body: string) => string> = {
  'accordion': (body) => `::accordion\n:::accordion-item{label="{title}"}\n${body}\n:::\n::`,
  'tabs': (body) => `::tabs\n:::tabs-item{label="{title}"}\n${body}\n:::\n::`,
  'card-group': (body) => `::card-group\n:::card{title="{title}"}\n${body}\n:::\n::`,
  'card': (body) => `::card{title="{title}"}\n${body}\n::`,
  'steps': (body) => `::steps\n### {title}\n\n${body}\n::`,
  // A link button: the selection is its text, then where it goes.
  'button': (text) => `:button[${text || '{title}'}]{to="{link}"}`,
}

/**
 * The components a page can use, by their Comark names (note, landing-hero),
 * for the editor's insert menu. The same list the preview renders with, so
 * components the layer or Nuxt UI add show up here by themselves.
 */
export function insertableComponents(path: string) {
  const names = new Set(Object.keys(componentsFor(path)).map((key) => key.replace(/^Prose/, '')))
  return [...names]
    .filter((name) => !MARKDOWN.has(name) && !HIDDEN.has(name))
    .sort()
    .map((name) => ({ name: name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase(), inline: INLINE.has(name), callout: CALLOUTS.has(name) }))
}
