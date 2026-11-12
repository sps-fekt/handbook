import type { NavigationItem } from 'comark-content'

// Every page of the site: both homepages and translations pages, and every
// page in the navigation. Sections (page: false, e.g. /en/studies) are left
// out: they only redirect to their first page.
// Used by the language switch (LanguageSwitch.vue) and for offline use (plugins/offline.client.ts).
export function pagePaths(navigation: NavigationItem[]) {
  const paths = new Set(['/cs', '/en', '/cs/translations', '/en/translations'])
  const walk = (items: NavigationItem[]) => items.forEach((item) => {
    if (item.page !== false) paths.add(item.path)
    if (item.children) walk(item.children)
  })
  walk(navigation)
  return paths
}
