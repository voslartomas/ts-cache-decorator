import { IStorage } from './iStorage'

const SYMBOL_KEY = Symbol.for("ts.cache.decorator.lib")

var globalSymbols = Object.getOwnPropertySymbols(global)
var hasFoo = (globalSymbols.indexOf(SYMBOL_KEY) > -1)

if (!hasFoo) {
  class CacheManager {
    private client: IStorage

    setClient = (client: IStorage) => {
      this.client = client
    }

    getClient = () => {
      return this.client
    }
  }

  global[SYMBOL_KEY] = new CacheManager()
}

var singleton = {}

Object.defineProperty(singleton, "instance", {
  get: function(){
    return global[SYMBOL_KEY]
  }
})

Object.freeze(singleton)

export default singleton as any
