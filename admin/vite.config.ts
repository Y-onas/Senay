import fs from 'fs'
import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

const PUBLIC_ST_HQ = path.resolve(__dirname, 'public/st-hq')

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
}

function serveAdminStaticFiles(): Plugin {
  return {
    name: 'serve-admin-static-files',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = (req.url ?? '/').split('?')[0]

        if (!pathname.startsWith('/st-hq/')) return next()
        if (pathname.startsWith('/st-hq/api') || pathname.startsWith('/st-hq/uploads')) return next()

        const rel = pathname.slice('/st-hq/'.length)
        if (!rel) return next()

        // Vite dev modules and React app source — never intercept.
        if (
          rel.startsWith('src/') ||
          rel.startsWith('@') ||
          rel.startsWith('node_modules/') ||
          rel.includes('@vite') ||
          rel.includes('@react-refresh')
        ) {
          return next()
        }

        const filePath = path.resolve(PUBLIC_ST_HQ, rel)
        if (!filePath.startsWith(PUBLIC_ST_HQ)) return next()

        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          const ext = path.extname(filePath).toLowerCase()
          res.setHeader('Content-Type', MIME[ext] ?? 'application/octet-stream')
          res.end(fs.readFileSync(filePath))
          return
        }

        // SPA routes like /st-hq/media — fall through to Vite index.html.
        next()
      })
    },
  }
}

/** Editable admin source — builds to admin/dist, staged to server/public/site/st-hq at deploy */
export default defineConfig({
  base: '/st-hq/',
  plugins: [react(), serveAdminStaticFiles()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/index-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
  server: {
    port: 5174,
    proxy: {
      '/st-hq/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/st-hq/, ''),
      },
      '/st-hq/uploads': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/st-hq/, ''),
      },
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/images': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
