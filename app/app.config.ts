import { site } from '../site'

export default defineAppConfig({
  seo: {
    siteName: site.name,
  },
  header: {
    title: site.name,
    // One tab per top-level section, plus the English pages.
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
