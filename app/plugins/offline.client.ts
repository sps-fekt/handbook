import type { NavigationItem } from 'comark-content'

// Saves the whole handbook, both languages, for offline use. Once the service
// worker (nuxt.config.ts, pwa) controls the page, everything is fetched once,
// which puts it in the worker's cache: every page and its content, the
// translation status, and the search index. Images, scripts and styles are
// already in the worker's precache.
//
// Again after every deploy, content pushes included: the key is the commit the
// server runs (/api/version). If anything fails, the next visit tries again.
export default defineNuxtPlugin(() => {
  if (!('serviceWorker' in navigator)) return

  onNuxtReady(async () => {
    try {
      await navigator.serviceWorker.ready
      if (!navigator.serviceWorker.controller) {
        await new Promise((resolve) => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }))
      }

      const { commit } = await $fetch<{ commit: string | null }>('/api/version')
      if (!commit || saved() === commit) return

      const [navigation, { sha }] = await Promise.all([
        $fetch<NavigationItem[]>('/api/content/navigation'),
        $fetch<{ sha: string | null }>('/api/content/head'),
      ])

      const pages = new Set(['/cs', '/en', '/cs/translations', '/en/translations'])
      // Sections (page: false, e.g. /en/studies) only redirect to their first
      // page: a redirected response can't answer a navigation offline anyway.
      const walk = (items: NavigationItem[]) => items.forEach((item) => {
        if (item.page !== false) pages.add(item.path)
        if (item.children) walk(item.children)
      })
      walk(navigation)

      const urls = [
        // The page, for opening it directly, and its content, for moving to it from another page.
        ...[...pages].flatMap((path) => [path, `/api/content/get${path}`]),
        '/api/translations',
        // The search index the search box loads for this content commit (comark-docs useSearch).
        ...(sha ? [`/api/content/blob/${sha}/snapshot/default.json`, `/api/content/blob/${sha}/manifest.json`] : []),
      ]

      if (await fetchAll(urls) === 0) save(commit)
    }
    catch {
      // Offline or the server is unreachable: the next visit tries again.
    }
  })
})

// Six at a time, like a browser's connections to one server. Returns how many failed.
async function fetchAll(urls: string[], parallel = 6) {
  const queue = [...urls]
  let failed = 0
  await Promise.all(Array.from({ length: parallel }, async () => {
    for (let url = queue.shift(); url; url = queue.shift()) {
      const response = await fetch(url).catch(() => null)
      if (!response?.ok) failed++
    }
  }))
  return failed
}

// The commit saved for offline use. localStorage can be unavailable (private windows).
function saved() {
  try {
    return localStorage.getItem('offline')
  }
  catch {
    return null
  }
}
function save(commit: string) {
  try {
    localStorage.setItem('offline', commit)
  }
  catch {}
}
