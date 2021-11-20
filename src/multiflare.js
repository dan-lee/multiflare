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
 * @property {string=} logLevel
 */

const _filename = fileURLToPath(import.meta.url)
const _dirname = path.dirname(_filename)

/**
 * @param {MultiflareOptions} options
 */
const multiflare = async (options) => {
  const searchDir = path.join(process.cwd(), options.rootDir)

  const wranglers = glob('./**/wrangler.toml', {
    absolute: true,
    cwd: searchDir,
  })

  /** @type {Record<string, string>} */
  const mounts = Object.fromEntries(
    wranglers.map((wranglerPath) => {
      const wranglerConfig = TOML.parse(readFileSync(wranglerPath, 'utf-8'))
      const dir = path.dirname(wranglerPath)

      return [wranglerConfig.name, path.resolve(_dirname, dir)]
    }),
  )

  /** @type {Record<string, string[]>} */
  const routes = Object.fromEntries(
    wranglers.map((wranglerPath) => {
      const wranglerConfig = TOML.parse(readFileSync(wranglerPath, 'utf-8'))

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

      return [wranglerConfig.name, routes]
    }),
  )

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
    scriptPath: path.resolve(_dirname, '../dist/rootWorker.dist.js'),
    buildCommand: [
      path.resolve(_dirname, '../node_modules/.bin/esbuild'),
      path.resolve(_dirname, './rootWorker.js'),
      '--bundle',
      '--format=esm',
      `--outfile=${path.resolve(_dirname, '../dist/rootWorker.dist.js')}`,
    ].join(' '),
    port: options.port ?? options.https ? 443 : 80,
    httpsKeyPath: options.key,
    httpsCertPath: options.cert,
  })

  mf.startServer()
}

export default multiflare