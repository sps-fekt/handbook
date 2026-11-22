// Keeps the editor's two panes on the same part of the page: scrolling one
// scrolls the other, and the block under the cursor is scrolled into view in
// the preview and outlined there. The preview's top-level blocks carry the
// source line they start on (sourceLines, a Comark plugin); positions between
// two of them are interpolated.
import { useEventListener } from '@vueuse/core'

interface Token { map: [number, number] | null, level: number, nesting: number, attrSet: (name: string, value: string) => void }

/** data-line="<line of the body, from 0>" on every top-level block. */
export const sourceLines = {
  name: 'source-lines',
  markdownItPlugins: [(md: { core: { ruler: { push: (name: string, rule: (state: { tokens: Token[] }) => void) => void } } }) => {
    md.core.ruler.push('source-lines', ({ tokens }) => {
      for (const token of tokens) {
        if (token.map && token.level === 0 && token.nesting !== -1) token.attrSet('data-line', String(token.map[0]))
      }
    })
  }],
}

const OUTLINE = ['outline-2', 'outline-offset-2', 'outline-primary/50', 'rounded-sm']

/** y for x, between the known points (xs ascending). */
function interpolate(x: number, xs: number[], ys: number[]) {
  const i = xs.findLastIndex((value) => value <= x)
  if (i === -1) return 0
  if (i === xs.length - 1) return ys[i]!
  return ys[i]! + (ys[i + 1]! - ys[i]!) * Math.min(1, (x - xs[i]!) / (xs[i + 1]! - xs[i]! || 1))
}

/** offset: the lines before the previewed body (the frontmatter). */
export function useScrollSync(area: () => HTMLTextAreaElement | undefined, preview: () => HTMLElement | undefined, offset: () => number) {
  // Where each source line starts in the textarea, wrapped lines included,
  // measured on a hidden copy; again only once the text or width changes.
  let tops: number[] = []
  let measured = ''
  function lineTops(textarea: HTMLTextAreaElement) {
    const key = `${textarea.clientWidth}:${textarea.value}`
    if (key === measured) return tops
    const style = getComputedStyle(textarea)
    const copy = document.createElement('div')
    for (const name of ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'padding','tabSize', 'overflowWrap', 'wordBreak'] as const) copy.style[name] = style[name]
    Object.assign(copy.style, { position: 'absolute', visibility: 'hidden', top: '0', boxSizing: 'border-box', width: `${textarea.clientWidth}px`, whiteSpace: 'pre-wrap' })
    for (const line of textarea.value.split('\n')) copy.append(Object.assign(document.createElement('div'), { textContent: line || ' ' }))
    document.body.append(copy)
    tops = [...copy.children].map((line) => (line as HTMLElement).offsetTop)
    copy.remove()
    measured = key
    return tops
  }

  /** The preview's blocks: their source line and their top within the pane. */
  function blocks(pane: HTMLElement) {
    const origin = pane.getBoundingClientRect().top - pane.scrollTop
    const els = [...pane.querySelectorAll<HTMLElement>('[data-line]')]
    return { els, lines: els.map((el) => Number(el.dataset.line) + offset()), tops: els.map((el) => el.getBoundingClientRect().top - origin) }
  }

  // A pane scrolled from here fires its own scroll event: not echoed back.
  const quietUntil = { area: 0, preview: 0 }
  const atBottom = (el: HTMLElement) => el.scrollTop + el.clientHeight >= el.scrollHeight - 2
  function follow(from: 'area' | 'preview') {
    const textarea = area()
    const pane = preview()
    if (!textarea || !pane || Date.now() < quietUntil[from]) return
    const lines = lineTops(textarea)
    const numbers = lines.map((_, i) => i)
    const { lines: blockLines, tops: blockTops } = blocks(pane)
    const [source, target] = from === 'area' ? [textarea, pane] : [pane, textarea]
    quietUntil[from === 'area' ? 'preview' : 'area'] = Date.now() + 150
    target.scrollTop = atBottom(source)
      ? target.scrollHeight
      : from === 'area'
        ? interpolate(interpolate(textarea.scrollTop, lines, numbers), blockLines, blockTops)
        : interpolate(interpolate(pane.scrollTop, blockTops, blockLines), numbers, lines)
  }
  useEventListener(area, 'scroll', () => follow('area'))
  useEventListener(preview, 'scroll', () => follow('preview'))

  // The cursor's block, shown and outlined in the preview.
  let outlined: HTMLElement | undefined
  useEventListener(() => (import.meta.client ? document : undefined), 'selectionchange', () => {
    const textarea = area()
    if (!textarea || document.activeElement !== textarea) return
    const line = textarea.value.slice(0, textarea.selectionStart).split('\n').length - 1
    const pane = preview()
    if (!pane) return
    const { els, lines, tops } = blocks(pane)
    const i = lines.findLastIndex((start) => start <= line)
    outlined?.classList.remove(...OUTLINE)
    outlined = els[i]
    outlined?.classList.add(...OUTLINE)
    if (outlined && (tops[i]! < pane.scrollTop || tops[i]! + outlined.offsetHeight > pane.scrollTop + pane.clientHeight)) {
      // The textarea may scroll to the cursor too: the cursor decides here.
      quietUntil.area = quietUntil.preview = Date.now() + 600
      pane.scrollTo({ top: tops[i]! - pane.clientHeight / 3, behavior: 'smooth' })
    }
  })
}
