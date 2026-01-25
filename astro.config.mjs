// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';
import vercel from '@astrojs/vercel/serverless';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  // Use vercel adapter for Vercel deployment, node adapter for Docker/local
  adapter: process.env.VERCEL ? vercel({
    maxDuration: 300 // 5 minutes for Puppeteer operations (Pro plan required)
  }) : node({
    mode: 'standalone'
  }),
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
