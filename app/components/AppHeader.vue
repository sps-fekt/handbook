<!-- Replaces the layer's header (comark-docs/app/components/AppHeader.vue):
     - no tab bar (AppHeaderCenter); the language switch (LanguageSwitch.vue)
       goes last on the right instead, after search, styled and spaced
       like it;
     - no version-history button;
     - search, language, menu in this order on every width (on phones the
       search is an icon button);
     - phones get one bar: logo and title, search, language and the menu, which lists the sidebar's pages. The layer's second bar
       under the header is gone (docs/DocsAsideMobileBar.vue).
     The rest is the layer's header unchanged. -->
<script setup lang="ts">
const { header, footer, assistant } = useAppConfig()
const content = useDocsContent()
const assistantOpen = useAssistant()
const sidebar = useFilteredNavigation()
</script>

<template>
  <UHeader :to="prefixLink(header?.to || '/', content.routeBase)">
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

    <template #toggle="{ open, toggle }">
      <IconMenuToggle
        :open="open"
        @click="toggle"
      />
    </template>

    <template #body>
      <div class="flex flex-col justify-between gap-6 h-full">
        <UContentNavigation
          variant="link"
          highlight
          :collapsible="false"
          :navigation="sidebar"
        />
        <div class="flex items-center gap-4">
          <template v-if="footer?.links">
            <UButton
              v-for="(link, index) of footer?.links"
              :key="index"
              v-bind="{ color: 'neutral', variant: 'ghost', size: 'md', ...link }"
              class="text-highlighted"
            />
          </template>
        </div>
      </div>
    </template>
  </UHeader>
</template>
