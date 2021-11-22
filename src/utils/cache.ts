import type { Miniflare } from 'miniflare'
import type { CacheInterface } from '@miniflare/cache'

export const createCacheProxy = (mf: Miniflare) => {
  const getCache = async (name?: string) => {
    const caches = await mf.getCaches()
    return name ? caches.open(name) : caches.default
  }

  const methods = ['put', 'match', 'delete'] as const

  const createCacheProxyFn =
    <Key extends typeof methods[number]>(key: Key, cacheToOpen?: string) =>
    async (...args: Parameters<CacheInterface[Key]>) => {
      const cache = await getCache(cacheToOpen)

      // todo
      // @ts-ignore
      return cache[key](...args)
    }

  return {
    default: Object.fromEntries(
      methods.map((key) => [key, createCacheProxyFn(key)]),
    ),
    open: (name: string) =>
      Object.fromEntries(
        methods.map((key) => [key, createCacheProxyFn(key, name)]),
      ),
  }
}
