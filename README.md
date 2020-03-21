# ts-cache-decorators


## Instal
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
async getUser (): Promise<User> {
```

### Cache API

| Param | Value | Description |
| ---- | ---- | --- |
| type | 'normal' \|\| 'request' | Type of cache. |
| cacheKey | string | Caching key. |
| ttl  | number  | Time to live.  |
