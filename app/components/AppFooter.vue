<!-- Replaces the layer's footer, which links its own brand assets page. On the
     right: the translation status, the repository and the version shown, linked to
     its commit: the commit last deployed to the server (server/api/version.get.ts).
     Looked up on the server, so the HTML already shows it and it doesn't change
     once the page has loaded. -->
<script setup lang="ts">
const { footer, github } = useAppConfig()
const { t } = useI18n()
const { data: deployed } = useFetch('/api/version')

const repoName = `${github?.owner}/${github?.name}`
const repoUrl = `https://github.com/${repoName}`
const version = computed(() => deployed.value?.commit?.slice(0, 7))
</script>

<template>
  <!-- Two groups, the translation status and the repository with its commit,
       split by a line; on phones they wrap as whole groups instead. -->
  <UFooter :ui="{ left: 'mt-0', right: 'flex-wrap gap-x-5 gap-y-3' }">
    <template #left>
      <i18n-t
        keypath="madeWith"
        tag="span"
        class="text-center lg:text-left"
        scope="global"
      >
        <template #owner>
          <ULink
            to="https://sps-fekt.cz"
            target="_blank"
            class="font-medium whitespace-nowrap hover:text-highlighted"
          >
            {{ footer?.owner }}
          </ULink>
        </template>
      </i18n-t>
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
