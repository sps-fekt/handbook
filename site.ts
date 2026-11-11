// The site's name, description and color, in one place. Used by app.config.ts
// (title and SEO), nuxt.config.ts (site name and browser theme color) and
// modules/pwa.ts (the installed app's manifest).
export const site = {
  name: 'Příručka prváka',
  // Under the icon of the installed app, where the full name doesn't fit.
  shortName: 'Příručka',
  description: 'Vše, co potřebuješ vědět na začátku studia na FEKT VUT. Od Studentů pro studenty.',
  // Brand blue. Also the primary color in app.css, which can't import this file.
  color: '#003DA5',
}
