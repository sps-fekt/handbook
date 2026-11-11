<!-- Replaces the layer's footer, which links its own brand assets page. On the
     right: the translation status, the repository and the version shown, linked to
     its commit. That's the content's commit, which the layer looks up on GitHub
     (app.vue), or else the commit the site was built from (nuxt.config.ts). -->
<script setup lang="ts">
const { footer, github } = useAppConfig()
const { t } = useI18n()
const { commit } = useRuntimeConfig().public
const contentSha = inject<Ref<string | null | undefined>>('sha', ref(null))

const repoName = `${github?.owner}/${github?.name}`
const repoUrl = `https://github.com/${repoName}`
const version = computed(() => contentSha.value?.slice(0, 7) || commit)
</script>

<template>
  <!-- Two groups, the translation status and the repository with its commit,
       split by a line; on phones they wrap as whole groups instead. -->
  <UFooter :ui="{ right: 'flex-wrap gap-x-5 gap-y-3' }">
    <template #left>
      <ULink
        to="https://sps-fekt.cz"
        target="_blank"
        class="hover:text-highlighted"
      >
        {{ footer?.owner }}
      </ULink>
    </template>

    <template #right>
      <!-- Nuxt UI adds the language prefix: /cs/translations or /en/translations. -->
      <ULink
        to="/translations"
        class="flex items-center gap-2 text-sm text-muted hover:text-highlighted"
      >
        <UIcon
          name="i-lucide-list-checks"
          class="size-4 shrink-0"
        />
        <span class="leading-none whitespace-nowrap">{{ t('translations.title') }}</span>
      </ULink>

      <USeparator
        orientation="vertical"
        class="h-4 max-sm:hidden"
      />

      <div class="flex items-center gap-2.5">
        <ULink
          :to="repoUrl"
          target="_blank"
          class="flex items-center gap-2 text-sm text-muted hover:text-highlighted"
        >
          <UIcon
            name="i-simple-icons-github"
            class="size-4 shrink-0"
          />
          <span class="leading-none whitespace-nowrap">{{ repoName }}</span>
        </ULink>
        <ULink
          v-if="version"
          :to="`${repoUrl}/commit/${version}`"
          target="_blank"
          class="px-1.5 py-0.5 text-sm leading-none font-mono font-medium text-muted rounded-md border border-current hover:text-highlighted"
        >
          {{ version }}
        </ULink>
      </div>
    </template>
  </UFooter>
</template>
