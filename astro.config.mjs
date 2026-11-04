import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Pages build to /explore/notes.html and are served at /explore/notes, so a
// page and its twin, /explore/notes.md, sit side by side.
export default defineConfig({
  site: 'https://manual.ideaspaces.xyz',
  integrations: [sitemap({ filter: (page) => !page.endsWith('/404') })],
  trailingSlash: 'never',
  build: { format: 'file' },
});
