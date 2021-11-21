import type { Miniflare } from 'miniflare'
import type { CacheInterface, CacheStorage } from '@miniflare/cache'

let __caches: CacheStorage

export const createCacheProxy = (mf: Miniflare) => {
  const getCache = async (name?: string) => {
    if (!__caches) {
      __caches = await mf.getCaches()
    }
    return name ? __caches.open(name) : __caches.default
  }

  const createCacheProxyFn =
    (name: keyof CacheInterface, cacheName?: string) =>
    (...args: Parameters<CacheInterface['put']>) =>
    async () => {
      const cache = await getCache(cacheName)
      return cache[name](...args)
    }

  const methods = ['put', 'match', 'delete'] as const

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
