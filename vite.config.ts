import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv, type UserConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig(({ mode }): UserConfig => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '')
  
  const plugins = [
    vue(),
    // Only load devtools in development
    ...(mode !== 'production' ? [vueDevTools()] : []),
  ]
  
  // Add bundle analyzer in build mode (no auto-open in CI)
  if (mode === 'production') {
    plugins.push(
      visualizer({
        filename: 'dist/stats.html',
        open: false,
        gzipSize: true,
        brotliSize: true
      })
    )
  }
  
  return {
    plugins,
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },
    server: {
      host: '127.0.0.1',
      port: 3000,
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
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (['vue', 'vue-router', 'pinia'].some(pkg => id.includes(`/node_modules/${pkg}/`))) return 'vendor-vue'
            if (['bootstrap', 'lucide-vue-next', '@heroicons/vue'].some(pkg => id.includes(`/node_modules/${pkg}/`))) return 'vendor-ui'
            if (id.includes('/node_modules/three/')) return 'vendor-three'
            if (['@stripe/stripe-js', 'qrcode', '@chenfengyuan/vue-qrcode'].some(pkg => id.includes(`/node_modules/${pkg}/`))) return 'vendor-payment'
            if (['axios', 'dayjs', 'socket.io-client'].some(pkg => id.includes(`/node_modules/${pkg}/`))) return 'vendor-utils'
          }
        }
      },
      chunkSizeWarningLimit: 1500 // Temporarily increase
    },
  }
})
