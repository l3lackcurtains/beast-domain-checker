// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  server: {
    port: 6006,
    host: true
  },
  integrations: [
    tailwind({
      applyBaseStyles: false,
    })
  ]
});
