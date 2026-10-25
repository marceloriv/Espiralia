import { defineConfig, type Plugin } from 'vitest/config'
import react from '@vitejs/plugin-react'

// En desarrollo el CSP de index.html se quita: el preámbulo de React Refresh es un script en línea y lo bloquearía.
const sinCspEnDesarrollo = (): Plugin => ({
  name: 'sin-csp-en-desarrollo',
  apply: 'serve',
  transformIndexHtml: html => html.replace(/\s*<meta http-equiv="Content-Security-Policy"[^>]*>/, ''),
})

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react({ compiler: true }), sinCspEnDesarrollo()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/react-router') || id.includes('node_modules/@remix-run/router')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          if (id.includes('node_modules/sileo')) {
            return 'vendor-toast';
          }
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/tests/setup.ts',
    // Las pruebas viven solo en src/tests (AGENTS.md §3); .agents trae scripts de skills con pruebas propias.
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    globals: true,
    testTimeout: 20000,
    coverage: {
      provider: 'v8',
      // Sonar lee coverage/lcov.info (sonar-project.properties); el reporte por defecto de Vitest no lo genera.
      reporter: ['text', 'lcov'],
      thresholds: { lines: 80, branches: 80 },
    },
  },
})
