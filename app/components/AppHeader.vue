<!-- Replaces the layer's header (comark-docs/app/components/AppHeader.vue):
     - no tab bar (AppHeaderCenter); the language switch (LanguageSwitch.vue)
       goes last on the right instead, after search, styled and spaced
       like it;
     - no version-history button;
     - search, language, menu in this order on every width (on phones the
       search is an icon button);
     - phones get one bar: logo and title, search, language and the menu, which lists the sidebar's pages. The layer's second bar
       under the header is gone (docs/DocsAsideMobileBar.vue). The menu
       button is outlined like the other header buttons.
     The rest is the layer's header unchanged. -->
<script setup lang="ts">
const { header, assistant } = useAppConfig()
const content = useDocsContent()
const assistantOpen = useAssistant()
const sidebar = useFilteredNavigation()
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

      <UColorModeButton
        color="neutral"
        variant="outline"
        :ui="{ leadingIcon: 'size-4' }"
        class="p-2"
      />
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
