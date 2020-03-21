import { IStorage } from '../iStorage'

import Memcached from 'memcached-elasticache'

export class MemcachedElastiCacheStorage implements IStorage {
  private client: Memcached

  constructor(locations: string | string[], options: {}) {
    this.client = new Memcached(locations, options)
  }

  public async getItem<T>(key: string): Promise<T> {
    return new Promise((resolve, reject) => {
      this.client.get(key, (err, data) => {
        if (err) {
          reject(err)
        }

        let cached = data
        try {
          cached = JSON.parse(data)
        } catch (error) {}

        resolve(cached)
      })
    })
  }

  public async setItem(key: string, content: any, ttl?: number): Promise<void> {
    if (typeof content === 'object') {
      content = JSON.stringify(content)
    } else if (content === undefined) {
      return new Promise((resolve, reject) => {
        this.client.del(key, (err) => {
          if (err) {
            reject(err)
          }

          resolve()
        })
      })
    }

    if (ttl) {
      return new Promise((resolve, reject) => {
        this.client.set(key, content, ttl, (err) => {
          if (err) {
            reject(err)
          }

          resolve()
        })
      })
    } else {
      return new Promise((resolve, reject) => {
        this.client.set(key, content, (err) => {
          if (err) {
            reject(err)
          }

          resolve()
        })
      })
    }
  }

  public async clearItem(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.del(key, (err) => {
        if (err) {
          reject(err)
        }

        resolve()
      })
    })
  }

  public async clear(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.flush((err) => {
        if (err) {
          reject(err)
        }

        resolve()
      })
    })
  }

  public prefixClear (prefix: string) {
    return this.clearItem(prefix)
  }
}
