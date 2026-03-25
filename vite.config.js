import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    proxy: {
      '/proxy/auth': {
        target: 'http://host.docker.internal:6010',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy\/auth/, '')
      },
      '/proxy/events': {
        target: 'http://host.docker.internal:6001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy\/events/, '')
      }
    }
  }
})
