import CacheManager from './cacheManager'
import { Cache, invalidateCache } from './decorators/cache'
export * from './storages'

export { Cache, invalidateCache }

export default CacheManager.instance
