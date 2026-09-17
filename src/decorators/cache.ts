import CacheManager from "../cacheManager"

export interface ICacheParams {
  type: 'normal'
  cacheKey: string
  filterParams?: string[]
  ttl?: number
}

const defaults: ICacheParams = {
  type: 'normal',
  cacheKey: undefined
}

export interface ICacheInvalidateParams {
  cacheKey: string,
  cacheKeys?: [ string ]
}

export const invalidateCache = async (cacheKey: string, args: Iterable<any>, prefix: boolean = false) => {
    if (prefix) {
      await CacheManager.instance.getClient().prefixClear(cacheKey)
    } else {
      await CacheManager.instance.getClient().clearItem(composeCacheKey(args, { cacheKey, type: 'normal' }))
    }
}

/**
 * Calls currently being computed, keyed by composed cache key.
 *
 * Without this, N concurrent calls that miss the same key each run the wrapped
 * method: the cache only starts absorbing load once the first one has finished
 * writing. That is backwards for the case caching exists for - a burst of
 * traffic against a cold or just-expired key is exactly when the underlying
 * work is least affordable, and exactly when every caller misses.
 *
 * The first caller computes; the rest await the same promise.
 *
 * Scope is one process. This deduplicates concurrent calls inside a single Node
 * instance, not across a cluster - with N replicas the worst case is N
 * concurrent computations rather than N x (requests per replica). Collapsing it
 * further needs a distributed lock, which is a much heavier thing to put in the
 * read path of a cache.
 */
const inFlight = new Map<string, Promise<any>>()

export function Cache (params: ICacheParams) {
  return (target: Object, propertyKey: string | symbol, descriptor) => {
    return {
      async value ( ... args: any[]): Promise<any> {
        const localParams = { ...defaults, ...params }

        let cacheKey: string
        if (params.filterParams) {
          cacheKey = composeCacheKey(args.filter(arg => params.filterParams.includes(arg)), localParams)
        } else {
          cacheKey = composeCacheKey(args, localParams)
        }

        const cached = await CacheManager.instance.getClient().getItem(cacheKey)

        if (cached) {
          return cached
        }

        const pending = inFlight.get(cacheKey)

        if (pending) {
          return pending
        }

        const computation = (async () => {
          const result = await descriptor.value.apply(this, args)
          await CacheManager.instance.getClient().setItem(cacheKey, result, params.ttl || 60)

          return result
        })()

        // Registered synchronously - nothing can await between creating the
        // promise and storing it, so no second caller can slip past and start a
        // duplicate computation.
        inFlight.set(cacheKey, computation)

        try {
          return await computation
        } finally {
          // Always cleared, including on rejection, so a failed call does not
          // wedge the key: the next caller retries rather than inheriting the
          // failure for as long as the process lives.
          inFlight.delete(cacheKey)
        }
      }
    }
  }
}

const composeCacheKey = (args: Iterable<any>, params: ICacheParams) => {
  args = Array.from(args)

  return params.cacheKey + JSON.stringify(args)
}
