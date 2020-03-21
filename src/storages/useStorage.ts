import { IStorage } from '../iStorage'
import CacheManager from '../cacheManager'

const cacheManager = CacheManager.instance
export const useStorage = (client: IStorage) => {
  cacheManager.setClient(client)
}
