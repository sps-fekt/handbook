<!-- The layer's page links under the table of contents
     (comark-docs/app/components/docs/DocsPageAsideLinks.vue) with the labels
     in the page's language (@nuxtjs/i18n), and a link to the page in the
     page editor (/cs/editor?file=…). Without the layer's Star on GitHub link
     and Open in Chat menu. The rest is the layer's unchanged. -->
<script setup lang="ts">
import type { ContentFile } from 'comark-content'
import type { PageLink } from '@nuxt/ui'

const props = defineProps<{ page: ContentFile }>()

const route = useRoute()
const content = useDocsContent()
const { t } = useI18n()

const { rawPrefix } = useRuntimeConfig().public.agentDiscovery
const mdPath = computed(() => `${rawPrefix}${route.path}.md`)

const { github, docs } = useAppConfig()
const githubUrl = computed(
  () => github?.url || (github?.owner && github?.name ? `https://github.com/${github.owner}/${github.name}` : '')
)

// The raw markdown route reads production content, so a versioned preview has nothing to open.
const isProd = computed(() => content.value.mode === 'prod')
const disabledLinkClass = 'text-dimmed hover:text-dimmed cursor-not-allowed'
// The arrow after a link that opens in a new tab is for links that leave the site.
const sameSite = { linkLabelExternalIcon: 'hidden' }

// The page in the page editor (app/pages/editor.vue), in the page's language:
// content/cs/2.studies/1.teaching.md is /cs/editor?file=cs/2.studies/1.teaching.md.
const editorUrl = computed(() => `/${props.page.meta.stem.split('/')[0]}/editor?file=${props.page.meta.stem}${props.page.meta.extension}`)

const links = computed(() => [
  {
    icon: 'i-lucide-square-pen',
    label: t('editInEditor'),
    to: editorUrl.value,
  },
  ...(githubUrl.value
    ? [
        {
          icon: 'i-simple-icons-github',
          label: t('editOnGithub'),
          to: `${githubUrl.value}/edit/${content.value.mode === 'tree' ? content.value.ref : github?.branch || 'main'}/${github?.contentDir || 'content'}/${props.page.meta.stem}${props.page.meta.extension}`,
          target: '_blank',
          // /blob/ pins a commit and /pr/ may come from a fork branch this site can't link an editor to.
          disabled: ['blob', 'pr'].includes(content.value.mode),
          class: ['blob', 'pr'].includes(content.value.mode) ? disabledLinkClass : undefined,
        },
      ]
    : []),
  {
    icon: 'i-simple-icons-markdown',
    label: t('openAsMarkdown'),
    to: mdPath.value,
    // Not a localised page: without this, Nuxt UI's link adds the language prefix (/cs/raw/...).
    external: true,
    target: '_blank',
    disabled: !isProd.value,
    class: !isProd.value ? disabledLinkClass : undefined,
    ui: sameSite,
  },
  ...((docs?.asideLinks ?? []).map((link: { label: string, icon?: string, to: string, target?: string }) => ({
    target: '_blank',
    ...link,
  })) as PageLink[]),
])

</script>

<template>
  <div class="flex flex-col gap-2.5">
    <UPageLinks
      :links="links"
      :ui="{ list: 'gap-2.5' }"
    />
  </div>
</template>
