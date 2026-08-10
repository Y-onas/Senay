#!/usr/bin/env node
/**
 * Build admin and stage to server/public/site/st-hq for local production testing.
 * Run: npm run deploy:admin --prefix admin
 */
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const adminRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const root = join(adminRoot, '..')
const target = join(root, 'server', 'public', 'site', 'st-hq')

const build = spawnSync('npm', ['run', 'build'], { cwd: adminRoot, stdio: 'inherit', shell: true })
if (build.status !== 0) process.exit(build.status ?? 1)

const stage = spawnSync(process.execPath, [join(root, 'scripts', 'stage-admin-dist.mjs'), target], {
  stdio: 'inherit',
})
if (stage.status !== 0) process.exit(stage.status ?? 1)

console.log('Done. Restart server with SERVE_WEB=1 to test https://localhost/st-hq from admin/dist.')
