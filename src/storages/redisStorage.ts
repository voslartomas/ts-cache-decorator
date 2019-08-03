import { IStorage } from '../iStorage';
import * as Bluebird from 'bluebird';

import * as redis from 'redis';

Bluebird.promisifyAll(redis.RedisClient.prototype);
Bluebird.promisifyAll(redis.Multi.prototype);

export class RedisStorage implements IStorage {
  private client: any;

  constructor(private host: string, private port: number) {
    this.client = redis.createClient(this.port, this.host);
  }

  public async getItem<T>(key: string): Promise<T> {
    const entry = await this.client.getAsync(key);
    let cached = entry;
    try {
      cached = JSON.parse(entry);
    } catch (error) {}
    return cached;
  }

  public async setItem(key: string, content: any, ttl: number): Promise<void> {
    if (typeof content === 'object') {
      content = JSON.stringify(content);
    } else if (content === undefined) {
      return this.client.delAsync(key);
    }
    return this.client.setAsync(key, content, 'EX', ttl);
  }

  clearItem(key: string): Promise<void> {
    return this.client.delAsync(key);
  }

  public async clear(): Promise<void> {
    return this.client.flushdbAsync();
  }
}
