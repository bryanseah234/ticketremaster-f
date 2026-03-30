import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv, type UserConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ mode }): UserConfig => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
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
          target: env.VITE_PROXY_AUTH_URL || 'http://host.docker.internal:6010',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/proxy\/auth/, '')
        },
        '/proxy/events': {
          target: env.VITE_PROXY_EVENTS_URL || 'http://host.docker.internal:6001',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/proxy\/events/, '')
        },
        // WebSocket proxy for real-time updates
        '/socket.io': {
          target: env.VITE_WS_URL || 'http://localhost:8109',
          ws: true,
          changeOrigin: true,
        },
      },
    },
    build: {
      sourcemap: true, // Enable source maps for Sentry
    },
  }
})
