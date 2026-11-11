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
      { label: 'Příručka', to: '/getting-started/welcome', sections: ['getting-started', 'studies', 'faculty', 'life-in-brno', 'about'] },
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
