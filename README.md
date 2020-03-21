# ts-cache-decorators


## Install
```
npm i @t.voslar/ts-cache-decorator
```

## Configuration

Choose one of the supported storages (MemcacheElastiCache or RedisStorage) or create your new storage which implements IStorage.

```typescript
const cacheStorage = new MemcachedElastiCacheStorage('localhost:11211', {})
useStorage(cacheStorage)
```

Now you can use @Cache decorator
```typescript
@Cache({ type: 'normal', cacheKey: 'getUser', ttl: 3 })
async getUser (userId: string): Promise<User> {
```

Above caching will take cacheKey + parameters (which is just userId in this case) and will create cache key, which will expire after 3 seconds.

If you need to filter some parameters you can use filterParams param.
```typescript
@Cache({ type: 'normal', cacheKey: 'getUser', ttl: 3, filterParams: ['otherParam'] })
async getUser (userId: string, otherParam: boolean): Promise<User> {
```

### Cache API

| Param | Value | Description |
| ---- | ---- | --- |
| type | 'normal' | Type of cache. |
| cacheKey | string | Caching key. |
| ttl  | number  | Time to live.  |
| filterParams  | string[]  | Parameters which should not be inside cache key.  |
