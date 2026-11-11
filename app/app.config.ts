import { site } from '../site'

export default defineAppConfig({
  seo: {
    siteName: site.name,
  },
  header: {
    title: site.name,
    // Not shown as tabs (AppHeader.vue has a language switch instead), but
    // they keep the sidebar to the sections of the current language.
    nav: [
      { label: 'Čeština', to: '/cs', sections: ['cs'] },
      { label: 'English', to: '/en', sections: ['en'] },
    ],
  },
  footer: {
    owner: 'Studenti pro studenty, z. s.',
    links: [
      // Nuxt UI adds the language prefix: /cs/translations or /en/translations.
      { 'icon': 'i-lucide-list-checks', 'to': '/translations', 'aria-label': 'Stav překladu' },
    ],
  },
  // Empty, so the table of contents uses Nuxt UI's title in the page's
  // language ("Na této stránce" / "On this page", app.vue's UApp locale).
  toc: {
    title: '',
  },
  // The sidebar as in Docus (Nuxt UI's defaults plus Docus's icon size):
  // section titles bold with an icon, pages indented along a line, the
  // current page in the primary color. These replace the layer's flatter
  // look; the highlight line is turned on where the navigation is rendered
  // (layouts/LayoutsDocs.vue, AppHeader.vue).
  ui: {
    contentNavigation: {
      slots: {
        linkLeadingIcon: 'size-4 mx-0.5',
        linkTrailing: 'hidden',
        listWithChildren: 'ms-5 border-s border-default',
        itemWithChildren: 'data-[state=open]:mb-1.5',
        trigger: 'font-semibold',
      },
      variants: {
        level: {
          true: {
            item: 'ps-1.5 -ms-px',
            itemWithChildren: 'ps-1.5 -ms-px',
          },
        },
        active: {
          true: {
            link: 'font-medium',
          },
        },
      },
    },
  },
  github: {
    owner: 'sps-fekt',
    name: 'handbook',
    branch: 'main',
  },
})
