import { Miniflare } from 'miniflare'

export const createKvProxy =
  (mf: Miniflare) => (worker: string, namespace: string) => {
    const createProxiedFn =
      <Fn extends keyof KVNamespace>(fn: Fn) =>
      async (...args: Parameters<KVNamespace[Fn]>) => {
        const mount = await mf.getMount(worker)

        if (!mount) {
          throw new Error(`Mount '${worker}' not found`)
        }

        const bindings = await mount.getBindings()

        if (!bindings) {
          throw new Error(`Cannot get bindings for worker '${worker}'`)
        }

        const kvNamespace = bindings[namespace] as KVNamespace

        return (kvNamespace[fn] as any)(...args)
      }

    return {
      put: createProxiedFn('put'),
      list: createProxiedFn('list'),
      delete: createProxiedFn('delete'),
      get: createProxiedFn('get'),
      getWithMetadata: createProxiedFn('getWithMetadata'),
    }
  }
