import type { NavigationItem } from 'comark-content'

// Replaces the layer's findSurroundLinks (comark-docs/app/utils/navigation.ts),
// used for the previous/next links under each page ([...slug].vue): the same,
// but within the page's language only. The languages are sibling sections of
// one navigation tree, so the first English page linked back to the last
// Czech one.
interface SurroundLink { title: string, description?: string, path: string }

export function findSurroundLinks(
  navigation: NavigationItem[] | undefined | null,
  path: string | undefined
): Array<SurroundLink | null> {
  if (!navigation?.length || !path) return []

  // The language section holding the page, e.g. /en for /en/studies/teaching.
  const language = navigation.find((item) => path === item.path || path.startsWith(`${item.path}/`))

  const flat: SurroundLink[] = []
  const collect = (items: NavigationItem[]) => {
    for (const item of items) {
      // A directory `index.md` is emitted twice: as the section node and as its own first child.
      // Keep only the child, or the page's next link points back at the page itself.
      const selfIndexed = item.children?.some((child) => child.path === item.path)
      if (item.page !== false && !selfIndexed) {
        flat.push({ title: item.title, description: item.description, path: item.path })
      }
      if (item.children?.length) collect(item.children)
    }
  }
  collect(language?.children ?? navigation)

  const index = flat.findIndex((item) => item.path === path)
  if (index === -1) return []
  return [flat[index - 1] || null, flat[index + 1] || null]
}
