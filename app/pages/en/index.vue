<!-- The English homepage. The layer renders a landing page only at / (its
     pages/index.vue); this renders content/en/index.md the same way, with
     the same landing components (::landing-hero and the rest). -->
<script setup lang="ts">
const landingComponents = byFileName(import.meta.glob('../../../node_modules/comark-docs/app/components/content/landing/*.{vue,ts}', { eager: true, import: 'default' }))

const content = useDocsContent()

const { data: page } = await useAsyncData(`${content.value.routeBase}:landing-en`, () => content.value.client.get('/en'))
if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const tree = computed(() => page.value && { ...page.value, nodes: prefixTreeLinks(page.value.nodes, content.value.routeBase) })
const fm = computed<Record<string, any>>(() => page.value?.data ?? {})

useHead({ htmlAttrs: { lang: 'en' } })
useSeoMeta({
  titleTemplate: '',
  title: () => fm.value.title,
  ogTitle: () => fm.value.title,
  description: () => fm.value.description,
  ogDescription: () => fm.value.description,
})
</script>

<template>
  <MarkdownDocument
    v-if="tree"
    :value="tree"
    :components="landingComponents"
  />
</template>
