import type { Miniflare } from 'miniflare'

const __bindings = new Map<string, Record<string, KVNamespace>>()

export const createKvProxy =
  (worker: string, mf: Miniflare) => (namespace: string) => {
    const createProxiedFn =
      <Fn extends keyof KVNamespace>(fn: Fn) =>
      async (...args: Parameters<KVNamespace[Fn]>) => {
        if (!__bindings.has(worker)) {
          const mount = await mf.getMount(worker)

          if (!mount) {
            throw new Error(`Mount '${worker}' not found`)
          }

          const bindings = await mount.getBindings()

          __bindings.set(worker, bindings)
        }

        const bindings = __bindings.get(worker)!
        const kvNamespace = bindings[namespace]

        return (kvNamespace[fn] as any)(...args)
      }

    const methods = ['put', 'list', 'delete', 'get', 'getWithMetadata'] as const

    return Object.fromEntries(
      methods.map((method) => [method, createProxiedFn(method)]),
    )
  }
