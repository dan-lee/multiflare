import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'

import { Log, LogLevel, Miniflare } from 'miniflare'
import glob from 'tiny-glob/sync.js'
import TOML from '@iarna/toml'

/**
 * @typedef {Object} MultiflareOptions
 * @property {string} rootDir
 * @property {string=} https
 * @property {string=} key
 * @property {string=} cert
 * @property {string=} port
 * @property {'none' |'error' |'warn' |'info' |'debug' |'verbose'=} logLevel
 */

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * @template TValue, TResult
 * @template {string} TKey
 * @param {Record<string, TValue>} obj
 * @param {<TKey>(key: TKey, value: TValue) => [TKey, TResult]} fn
 */
const objectMap = (obj, fn) =>
  Object.fromEntries(Object.entries(obj).map(([key, value]) => fn(key, value)))

/**
 * @param {MultiflareOptions} options
 * @returns {Promise<{ stop: () => Promise<void>, server: import('http').Server | import('https').Server, miniflare: Miniflare}>}
 */
const multiflare = async (options) => {
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

      /** @type {*} */
      const env = wranglerConfig.env

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

      return [wranglerConfig.name, { mount, routes }]
    }),
  )

  const mounts = objectMap(config, (key, value) => [key, value.mount])
  const routes = objectMap(config, (key, value) => [key, value.routes])

  /** @type {LogLevel} */
  const logLevel = {
    none: LogLevel.NONE,
    error: LogLevel.ERROR,
    warn: LogLevel.WARN,
    info: LogLevel.INFO,
    debug: LogLevel.DEBUG,
    verbose: LogLevel.VERBOSE,
  }[options.logLevel ?? 'error']

  /** @typedef {import('miniflare').MiniflareOptions} */
  const mf = new Miniflare({
    mounts,
    bindings: { routes, https: Boolean(options.https) },
    log: new Log(logLevel),
    watch: true,
    modules: true,
    scriptPath: path.resolve(__dirname, '../dist/rootWorker.dist.js'),
    buildCommand: [
      path.resolve(__dirname, '../node_modules/.bin/esbuild'),
      path.resolve(__dirname, './rootWorker.js'),
      '--bundle',
      '--format=esm',
      `--outfile=${path.resolve(__dirname, '../dist/rootWorker.dist.js')}`,
    ].join(' '),
    port: options.port ?? options.https ? 443 : 80,
    httpsKeyPath: options.key,
    httpsCertPath: options.cert,
  })

  const server = await mf.startServer()

  const stop = () =>
    new Promise((resolve) => {
      server.close(() => mf.dispose().then(resolve))
    })

  return {
    stop,
    server,
    miniflare: mf,
  }
}

export default multiflare
