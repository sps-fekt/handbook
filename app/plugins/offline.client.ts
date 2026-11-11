import type { NavigationItem } from 'comark-content'

// Saves the reader's language for offline use: once the service worker
// (nuxt.config.ts, pwa) controls the page, every page and its content are
// fetched once, which puts them in its cache. Again after each new build.
export default defineNuxtPlugin((nuxtApp) => {
  if (!('serviceWorker' in navigator)) return
  const { commit } = useRuntimeConfig().public

  onNuxtReady(async () => {
    const lang = (nuxtApp.$i18n as { locale: Ref<string> }).locale.value
    const saved = `${commit}:${lang}`
    if (localStorage.getItem('offline') === saved) return

    await navigator.serviceWorker.ready
    if (!navigator.serviceWorker.controller) {
      await new Promise((resolve) => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }))
    }

    const navigation = await $fetch<NavigationItem[]>('/api/content/navigation')
    const paths: string[] = []
    const walk = (items: NavigationItem[]) => items.forEach((item) => {
      paths.push(item.path)
      if (item.children) walk(item.children)
    })
    walk(navigation.filter((item) => item.path === `/${lang}`))

    // The page, for opening it directly, and its content, for moving to it from another page.
    await Promise.all(paths.flatMap((path) => [fetch(path), fetch(`/api/content/get${path}`)]))
    localStorage.setItem('offline', saved)
  })
})
