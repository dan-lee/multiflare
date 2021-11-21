import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'

import { Log, LogLevel, Miniflare } from 'miniflare'
import glob from 'tiny-glob/sync.js'
import TOML from '@iarna/toml'
import { createKvProxy } from './utils/kv'
import { createCacheProxy } from './utils/cache'

export type MultiflareOptions = {
  rootDir: string
  https?: string
  key?: string
  cert?: string
  port?: string
  logLevel?: 'none' | 'error' | 'warn' | 'info' | 'debug' | 'verbose'
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const objectMap = <TValue, TResult>(
  obj: Record<string, TValue>,
  fn: <TKey extends string>(key: TKey, value: TValue) => [TKey, TResult],
) =>
  Object.fromEntries(Object.entries(obj).map(([key, value]) => fn(key, value)))

const multiflare = async (options: MultiflareOptions) => {
  const searchDir = path.join(process.cwd(), options.rootDir)

  const wranglers = glob('./**/wrangler.toml', {
    absolute: true,
    cwd: searchDir,
  })

  const config = Object.fromEntries(
    wranglers.map((wranglerPath) => {
      const wranglerConfig = TOML.parse(readFileSync(wranglerPath, 'utf-8'))
      const dir = path.dirname(wranglerPath)
      const mount = path.resolve(__dirname, dir)

      const env = wranglerConfig.env as any

      if (!env?.dev) {
        console.error(
          `Error: Need a route to serve in worker '${wranglerConfig.name}' (${wranglerPath})`,
        )
        process.exit(1)
      }

      const route = env.dev.route ?? env.dev.routes
      const routes = Array.isArray(route) ? route : [route]

      if (routes.length === 0) {
        console.error(
          `No route(s) defined for project '${wranglerConfig.name}'`,
        )
        process.exit(1)
      }

      return [wranglerConfig.name, { mount, routes }] as [
        string,
        { mount: string; routes: string[] },
      ]
    }),
  )

  const mounts = objectMap(config, (key, value) => [key, value.mount])
  const routes = objectMap(config, (key, value) => [key, value.routes])

  const logLevel = {
    none: LogLevel.NONE,
    error: LogLevel.ERROR,
    warn: LogLevel.WARN,
    info: LogLevel.INFO,
    debug: LogLevel.DEBUG,
    verbose: LogLevel.VERBOSE,
  }[options.logLevel ?? 'error']

  const mf = new Miniflare({
    mounts,
    bindings: { routes, https: Boolean(options.https) },
    port: options.port ?? options.https ? 443 : 80,
    httpsKeyPath: options.key,
    httpsCertPath: options.cert,

    log: new Log(logLevel),
    watch: true,
    modules: true,
    buildCommand: [
      path.resolve(__dirname, '../node_modules/.bin/esbuild'),
      path.resolve(__dirname, './rootWorker.js'),
      '--bundle',
      '--format=esm',
      `--outfile=${path.resolve(__dirname, '../dist/rootWorker.dist.js')}`,
    ].join(' '),
    scriptPath: path.resolve(__dirname, '../dist/rootWorker.dist.js'),
  })

  const server = await mf.startServer()

  const stop = () =>
    new Promise((resolve) => {
      server.close(() => mf.dispose().then(resolve))
    })

  return {
    stop,
    server,
    getWorker: (worker: string) => ({
      kv: createKvProxy(worker, mf),
      cache: createCacheProxy(mf),
    }),
    miniflare: mf,
  }
}

export default multiflare
