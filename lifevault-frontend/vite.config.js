import react from '@vitejs/plugin-react'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { defineConfig, loadEnv } from 'vite'

function firebaseMessagingWorkerPlugin() {
  let resolvedConfig
  let firebaseConfigJson

  return {
    name: 'firebase-messaging-worker-config',
    configResolved(config) {
      resolvedConfig = config
      const env = loadEnv(config.mode, config.envDir, 'VITE_')
      const firebaseConfig = {
        apiKey: env.VITE_FIREBASE_API_KEY,
        authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: env.VITE_FIREBASE_APP_ID,
      }
      const missingVariables = Object.entries(firebaseConfig)
        .filter(([, value]) => typeof value !== 'string' || !value.trim())
        .map(([key]) => `VITE_FIREBASE_${key.replace(/[A-Z]/g, (letter) => `_${letter}`).toUpperCase()}`)

      if (missingVariables.length > 0) {
        throw new Error(
          `Missing Firebase environment configuration: ${missingVariables.join(', ')}`,
        )
      }

      firebaseConfigJson = JSON.stringify(firebaseConfig)
    },
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        if (request.url?.split('?')[0] !== '/firebase-messaging-sw.js') {
          return next()
        }

        try {
          const workerPath = resolve(
            server.config.root,
            'public/firebase-messaging-sw.js',
          )
          const workerSource = await readFile(workerPath, 'utf8')

          response.setHeader('Content-Type', 'application/javascript')
          response.setHeader('Service-Worker-Allowed', '/')
          response.end(
            workerSource.replace('__LIFEvault_FIREBASE_CONFIG__', firebaseConfigJson),
          )
        } catch (error) {
          next(error)
        }
      })
    },
    async writeBundle(outputOptions) {
      const outputDirectory = outputOptions.dir
        ? resolve(resolvedConfig.root, outputOptions.dir)
        : resolve(resolvedConfig.root, resolvedConfig.build.outDir)
      const workerPath = resolve(outputDirectory, 'firebase-messaging-sw.js')
      const workerSource = await readFile(workerPath, 'utf8')

      await writeFile(
        workerPath,
        workerSource.replace('__LIFEvault_FIREBASE_CONFIG__', firebaseConfigJson),
        'utf8',
      )
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), firebaseMessagingWorkerPlugin()],
})
