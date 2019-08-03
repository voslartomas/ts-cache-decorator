import * as hasha from 'hasha'
import { IStorage } from '../iStorage'

export interface ICacheParams {
  type: 'request' | 'normal'
  cacheKey: string
  filterParams?: string[]
  ttl?: number
}

const defaults: ICacheParams = {
  type: 'request',
  cacheKey: undefined
}

export interface ICacheInvalidateParams {
  cacheKey: string,
  cacheKeys?: [ string ]
}

export const invalidateCache = (cacheStorage: IStorage, cacheKey, args, prefix: boolean = false) => {
    if (prefix) {
      cacheStorage.prefixClear(cacheKey)
    } else {
      cacheStorage.clearItem(composeCacheKey(args, { cacheKey, type: 'normal' }))
    }
}

export function Cache (cachingStorage: IStorage, params: ICacheParams) {
  return (target: Object, propertyKey: string | symbol, descriptor) => {
    return {
      async value ( ... args: any[]): Promise<any> {
        const localParams = { ...defaults, ...params }
        let result

        let cacheKey
        if (params.filterParams) {
          cacheKey = composeCacheKey(args.filter(arg => params.filterParams.includes(arg)), localParams)
        } else {
          cacheKey = composeCacheKey(args, localParams)
        }

        result = await cachingStorage.getItem(cacheKey)

        if (!result) {
          result = await descriptor.value.apply(this, args)
          await cachingStorage.setItem(cacheKey, result, params.ttl || 60)
        }

        return result
      }
    }
  }
}

const composeCacheKey = (args, params: ICacheParams) => {
  args = Array.from(args)

  return params.cacheKey + hasha(JSON.stringify(args))
}
