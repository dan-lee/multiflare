import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'

import { Log, LogLevel, Miniflare } from 'miniflare'
import TOML from '@iarna/toml'

import { objectMap } from './utils/objectMap'
import { readDirRecursive } from './utils/readDirRecursive'

export type MultiflareOptions = {
  rootDir: string
  https?: string
  key?: string
  cert?: string
  port?: string
  logLevel?: Lowercase<keyof Record<keyof typeof LogLevel, unknown>>
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const multiflare = async (options: MultiflareOptions) => {
  const searchDir = path.join(process.cwd(), options.rootDir)

  const wranglers = readDirRecursive(searchDir)
    .filter((file) => file.endsWith('wrangler.toml'))
    .map((file) => path.resolve(searchDir, file))

  const config = Object.fromEntries(
    wranglers.map((wranglerPath) => {
      const wranglerConfig = TOML.parse(readFileSync(wranglerPath, 'utf-8'))
      const dir = path.dirname(wranglerPath)
      const mount = path.resolve(__dirname, dir)

      const env = wranglerConfig.env as any

      if (!wranglerConfig.name) {
        console.error(`Wrangler config at '${wranglerPath}' is missing a name.`)
        process.exit(1)
      }

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

  const mounts = objectMap(config, (key, { mount }) => [key, mount])
  const routes = objectMap(config, (key, { routes }) => [key, routes])

  const log = options.logLevel
    ? new Log(
        {
          none: LogLevel.NONE,
          error: LogLevel.ERROR,
          warn: LogLevel.WARN,
          info: LogLevel.INFO,
          debug: LogLevel.DEBUG,
          verbose: LogLevel.VERBOSE,
        }[options.logLevel],
      )
    : undefined

  const mf = new Miniflare({
    mounts,
    bindings: { routes, https: Boolean(options.https) },
    port: options.port ?? options.https ? 443 : 80,
    httpsKeyPath: options.key,
    httpsCertPath: options.cert,

    log,
    watch: true,
    modules: true,
    buildCommand:
      process.env.NODE_ENV === 'production'
        ? undefined
        : 'yarn build:root-worker',
    scriptPath: path.resolve(__dirname, '../dist/root-worker.js'),
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
