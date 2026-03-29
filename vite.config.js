import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
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
        }
      }
    }
  }
})
