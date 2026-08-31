import { readFile } from 'node:fs/promises'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

function mockPlatformApi(): Plugin {
  const mockFile = fileURLToPath(new URL('./mock/platform.json', import.meta.url))
  return {
    name: 'mock-platform-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        if (request.method !== 'GET' || request.url?.split('?')[0] !== '/api/platform') {
          next()
          return
        }
        try {
          const payload = await readFile(mockFile, 'utf8')
          response.statusCode = 200
          response.setHeader('Content-Type', 'application/json; charset=utf-8')
          response.setHeader('Cache-Control', 'no-store')
          response.end(payload)
        } catch {
          response.statusCode = 500
          response.setHeader('Content-Type', 'application/json; charset=utf-8')
          response.end(JSON.stringify({ message: 'Mock API data is unavailable' }))
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const enableMockApi = env.VITE_ENABLE_MOCK_API === 'true'
  return {
    plugins: [vue(), ...(enableMockApi ? [mockPlatformApi()] : [])],
    server: {
      proxy: enableMockApi ? undefined : { '/api': 'http://localhost:8787' },
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})
