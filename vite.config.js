import { defineConfig } from 'vite';

export default defineConfig({
  base: '/dbi-transformers-demo/',
  build: {
    outDir: 'docs',
    emptyOutDir: true,
  },
});