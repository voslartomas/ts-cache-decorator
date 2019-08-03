import { IStorage } from '../iStorage'

import * as Redis from 'ioredis'

export class RedisStorage implements IStorage {
  private client: any

  constructor(private host: string, private port: number) {
    this.client = new Redis({
      port: this.port,
      host: this.host
    })
  }

  public async getItem<T>(key: string): Promise<T> {
    const entry = await this.client.get(key)
    let cached = entry
    try {
      cached = JSON.parse(entry)
    } catch (error) {}
    return cached
  }

  public async setItem(key: string, content: any, ttl: number): Promise<void> {
    if (typeof content === 'object') {
      content = JSON.stringify(content)
    } else if (content === undefined) {
      return this.client.del(key)
    }
    return this.client.set(key, content, 'EX', ttl)
  }

  public async clearItem(key: string): Promise<void> {
    return await this.client.del(key)
  }

  public async clear(): Promise<void> {
    return this.client.flushdb()
  }

  public prefixClear (prefix: string) {
    const stream = this.client.scanStream({ match: `${prefix}*`,count: 100 })
    let pipeline = this.client.pipeline()

    let localKeys = [];
    stream.on('data', function (resultKeys) {
      for (var i = 0; i < resultKeys.length; i++) {
        localKeys.push(resultKeys[i])
        pipeline.del(resultKeys[i])
      }

      if(localKeys.length > 100){
        pipeline.exec(()=>{ console.log("one batch delete complete")} )
        localKeys=[]
        pipeline = this.client.pipeline()
      }
    })

    stream.on('end', function(){
      pipeline.exec(()=>{console.log("final batch delete complete")})
    })

    stream.on('error', function(err){
      console.log("error", err)
    })
  }
}
