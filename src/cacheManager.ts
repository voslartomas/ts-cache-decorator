import { IStorage } from './iStorage'

const FOO_KEY = Symbol.for("test.foo")

// check if the global object has this symbol
// add it if it does not have the symbol, yet
// ------------------------------------------

var globalSymbols = Object.getOwnPropertySymbols(global);
var hasFoo = (globalSymbols.indexOf(FOO_KEY) > -1);

if (!hasFoo) {
  class CacheManager {
    private client: IStorage

    constructor () {
      console.log('creating')
    }

    setClient = (client: IStorage) => {
      this.client = client
    }

    getClient = () => {
      return this.client
    }
  }

  global[FOO_KEY] = new CacheManager()
}

// define the singleton API
// ------------------------

var singleton = {};

Object.defineProperty(singleton, "instance", {
  get: function(){
    return global[FOO_KEY];
  }
});

// ensure the API is never changed
// -------------------------------

Object.freeze(singleton);

// export the singleton API only
// -----------------------------

export default singleton as any
