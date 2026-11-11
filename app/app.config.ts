import { site } from '../site'

export default defineAppConfig({
  ui: {
    header: {
      slots: {
        // The language switch (AppHeaderCenter.vue) sits on the right, next to
        // search, the same gap-2 apart as the buttons there.
        container: 'gap-2',
        center: 'flex-1 justify-end',
        right: 'lg:flex-none',
      },
    },
  },
  seo: {
    siteName: site.name,
  },
  header: {
    title: site.name,
    // Not shown as tabs (AppHeaderCenter.vue is a language switch instead), but
    // they keep the sidebar to the sections of the current language.
    nav: [
      { label: 'Příručka', to: '/zaciname/vitej', sections: ['zaciname', 'studium', 'fakulta', 'zivot-v-brne', 'o-prirucce'] },
      { label: 'English', to: '/en', sections: ['en'] },
    ],
  },
  footer: {
    owner: 'Studenti pro studenty, z. s.',
    links: [
      { 'icon': 'i-simple-icons-github', 'to': 'https://github.com/sps-fekt/handbook', 'target': '_blank', 'aria-label': 'GitHub' },
    ],
  },
  toc: {
    title: 'Na této stránce',
  },
  github: {
    owner: 'sps-fekt',
    name: 'handbook',
    branch: 'main',
  },
})
