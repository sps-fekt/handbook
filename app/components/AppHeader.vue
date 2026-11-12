<!-- Replaces the layer's header (comark-docs/app/components/AppHeader.vue):
     - no tab bar (AppHeaderCenter); the language switch (LanguageSwitch.vue)
       goes last on the right instead, after search, styled and spaced
       like it;
     - no version-history button;
     - search, language, menu in this order on every width (on phones the
       search is an icon button);
     - the colour mode button opens a menu of system, light and dark, and
       shows the current one's icon (UColorModeButton only toggles light
       and dark);
     - phones get one bar: logo and title, search, language and the menu, which lists the sidebar's pages. The layer's second bar
       under the header is gone (docs/DocsAsideMobileBar.vue). The menu
       button is outlined like the other header buttons.
     The rest is the layer's header unchanged. -->
<script setup lang="ts">
import { cs, en } from '@nuxt/ui/locale'

const { header, assistant, ui } = useAppConfig()
const content = useDocsContent()
const assistantOpen = useAssistant()
const sidebar = useFilteredNavigation()

const colorMode = useColorMode()
const modes = ['system', 'light', 'dark'] as const
const mode = computed(() => modes.find((m) => m === colorMode.preference) ?? 'system')
const { locale } = useI18n()
const labels = computed(() => (locale.value === 'cs' ? cs : en).messages.colorMode)
const modeItems = computed(() => modes.map((m) => ({
  label: labels.value[m],
  icon: ui.icons[m],
  type: 'checkbox' as const,
  checked: mode.value === m,
  onSelect: () => { colorMode.preference = m },
})))
</script>

<template>
  <!-- Below the sm breakpoint (640px) the left side with the logo and site name is hidden and
       the buttons start on the left, with only the menu toggle on the right. -->
  <UHeader
    :to="prefixLink(header?.to || '/', content.routeBase)"
    :toggle="{ variant: 'outline', class: 'p-2 max-sm:ms-auto', ui: { leadingIcon: 'size-4' } }"
    :ui="{ left: 'max-sm:hidden', right: 'max-sm:flex-1 max-sm:justify-start' }"
  >
    <template #left>
      <AppHeaderBrand />
    </template>

    <template #right>
      <UContentSearchButton
        v-if="header?.search"
        :collapsed="assistantOpen"
        :icon="assistantOpen ? undefined : false"
        :variant="assistantOpen ? 'outline' : undefined"
        :ui="{ leadingIcon: 'size-4' }"
        :class="['text-muted font-normal hidden lg:inline-flex', assistantOpen ? 'p-2' : 'min-w-[150px]']"
      />

      <UContentSearchButton
        v-if="header?.search"
        :collapsed="true"
        variant="outline"
        :ui="{ leadingIcon: 'size-4' }"
        class="p-2 lg:hidden"
      />

      <UButton
        v-if="assistant?.enabled"
        label="Ask AI"
        color="neutral"
        variant="outline"
        @click="assistantOpen = !assistantOpen"
      />

      <LanguageSwitch />

      <ClientOnly>
        <UDropdownMenu :items="modeItems" :content="{ align: 'end' }">
          <UButton
            :icon="ui.icons[mode]"
            :aria-label="labels[mode]"
            color="neutral"
            variant="outline"
            :ui="{ leadingIcon: 'size-4' }"
            class="p-2"
          />
        </UDropdownMenu>
        <template #fallback>
          <div class="size-8" />
        </template>
      </ClientOnly>
    </template>

    <template #body>
      <UContentNavigation
        variant="link"
        highlight
        :collapsible="false"
        :navigation="sidebar"
      />
    </template>
  </UHeader>
</template>
