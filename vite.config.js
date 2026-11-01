import { defineConfig } from 'vite';
import { resolve } from 'node:path';

const pages = [
  'index.html',
  'indsigt/index.html',
  'plan/index.html',
  'partner/index.html',
  'en/index.html',
  'en/insight/index.html',
  'en/plan/index.html',
  'en/partner/index.html',
];

export default defineConfig({
  root: 'site',
  base: './',
  publicDir: resolve(__dirname, 'public'),
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    assetsDir: 'assets',
    rollupOptions: { input: Object.fromEntries(pages.map((p) => [p.replace(/\/?index\.html$/, '') || 'home', resolve(__dirname, 'site', p)])) },
  },
});
