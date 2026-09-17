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

### Concurrent misses

Calls that miss the same key at the same time are collapsed into one: the first
caller runs the method, the rest await its result. Without that, a burst of
traffic against a cold or just-expired key runs the underlying work once per
caller - the cache only starts absorbing load after the first call has finished
writing, which is the opposite of what you want at exactly that moment.

```typescript
// getUser runs once, not five times
await Promise.all([
  service.getUser('1'),
  service.getUser('1'),
  service.getUser('1'),
  service.getUser('1'),
  service.getUser('1')
])
```

This is per-process. It deduplicates within one Node instance, not across a
cluster, so with N replicas the worst case is N concurrent computations rather
than N x (concurrent requests per replica). Going further needs a distributed
lock, which is a heavier thing to put in the read path of a cache.

A failed call is not cached and does not wedge the key - every waiter on that
call rejects, and the next caller retries.

### Cache API

| Param | Value | Description |
| ---- | ---- | --- |
| type | 'normal' | Type of cache. |
| cacheKey | string | Caching key. |
| ttl  | number  | Time to live.  |
| filterParams  | string[]  | Parameters which should not be inside cache key.  |
