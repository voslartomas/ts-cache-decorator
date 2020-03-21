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

export const invalidateCache = async (cacheKey: string, args: Iterable<string>, prefix: boolean = false) => {
    if (prefix) {
      await CacheManager.instance.getClient().prefixClear(cacheKey)
    } else {
      await CacheManager.instance.getClient().clearItem(composeCacheKey(args, { cacheKey, type: 'normal' }))
    }
}

export function Cache (params: ICacheParams) {
  return (target: Object, propertyKey: string | symbol, descriptor) => {
    return {
      async value ( ... args: any[]): Promise<any> {
        const localParams = { ...defaults, ...params }
        let result: any

        let cacheKey: string
        if (params.filterParams) {
          cacheKey = composeCacheKey(args.filter(arg => params.filterParams.includes(arg)), localParams)
        } else {
          cacheKey = composeCacheKey(args, localParams)
        }

        result = await CacheManager.instance.getClient().getItem(cacheKey)

        if (!result) {
          result = await descriptor.value.apply(this, args)
          await CacheManager.instance.getClient().setItem(cacheKey, result, params.ttl || 60)
        }

        return result
      }
    }
  }
}

const composeCacheKey = (args: Iterable<string>, params: ICacheParams) => {
  args = Array.from(args)

  return params.cacheKey + JSON.stringify(args)
}
