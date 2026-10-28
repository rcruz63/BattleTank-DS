import { defineConfig } from 'vite';

// Puertos no estándar para evitar conflictos con otros desarrollos en paralelo.
export default defineConfig({
  base: './',
  server: {
    port: 5273,
    strictPort: true,
    open: false,
  },
  preview: {
    port: 5274,
    strictPort: true,
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
    sourcemap: true,
  },
});
