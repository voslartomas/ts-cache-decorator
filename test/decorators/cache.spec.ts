import * as chai from 'chai'
const expect = chai.expect
import { Cache, invalidateCache } from '../../src/decorators/cache'
import { IStorage } from '../../src/iStorage'
import { useStorage } from '../../src/storages/useStorage'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Storage is not what these tests are about, the decorator is, so they run
 * against a plain in-memory implementation rather than a stubbed client.
 */
class MemoryStorage implements IStorage {
  private map = new Map<string, any>()

  public async getItem<T> (key: string): Promise<T> {
    return this.map.get(key)
  }

  public async setItem (key: string, content: any, ttl: number): Promise<void> {
    this.map.set(key, content)
  }

  public async clearItem (key: string): Promise<void> {
    this.map.delete(key)
  }

  public async prefixClear (prefix: string): Promise<void> {
    Array.from(this.map.keys())
      .filter(key => key.indexOf(prefix) === 0)
      .forEach(key => this.map.delete(key))
  }

  public async clear (): Promise<void> {
    this.map.clear()
  }
}

const cacheStorage = new MemoryStorage()
useStorage(cacheStorage)

class TestService {
  public calls = 0

  @Cache({ type: 'normal', cacheKey: 'test.call' })
  async testCall (id = 123) {
    this.calls++

    return {
      id,
      attr: Math.random()
    }
  }

  @Cache({ type: 'normal', cacheKey: 'test.slow' })
  async slowCall (id = 123) {
    this.calls++
    await sleep(20)

    return {
      id,
      attr: Math.random()
    }
  }

  @Cache({ type: 'normal', cacheKey: 'test.failing' })
  async failingCall (id = 123) {
    this.calls++
    await sleep(5)

    throw new Error('Test error')
  }
}

describe('Caching unit tests', () => {
  beforeEach(async () => {
    await cacheStorage.clear()
  })

  describe('Valid caching', () => {
    it('should cache method', async () => {
      const testService = new TestService()
      const a = await testService.testCall()
      const b = await testService.testCall()

      expect(a).to.be.deep.equal(b)
      expect(testService.calls).to.be.equal(1)
    })

    it('should cache method with params', async () => {
      const testService = new TestService()
      const a = await testService.testCall(1)
      const b = await testService.testCall(2)
      const c = await testService.testCall(1)

      expect(a).to.be.deep.equal(c)
      expect(a).to.be.not.deep.equal(b)
      expect(b).to.be.not.deep.equal(c)
    })

    it('should invalidate cache', async () => {
      const testService = new TestService()
      const a = await testService.testCall()
      await invalidateCache('test.call', [])
      const b = await testService.testCall()

      expect(a).to.be.not.deep.equal(b)
    })

    it('should invalidate cache with params', async () => {
      const testService = new TestService()
      const a = await testService.testCall(1)
      await invalidateCache('test.call', [1])
      const b = await testService.testCall(1)

      expect(a).to.be.not.deep.equal(b)
    })
  })

  describe('Concurrent misses', () => {
    it('should call the method once when several callers miss the same key', async () => {
      const testService = new TestService()
      const results = await Promise.all([
        testService.slowCall(1),
        testService.slowCall(1),
        testService.slowCall(1),
        testService.slowCall(1),
        testService.slowCall(1)
      ])

      expect(testService.calls).to.be.equal(1)
      results.forEach(result => expect(result).to.be.deep.equal(results[0]))
    })

    it('should not collapse calls that compose to different keys', async () => {
      const testService = new TestService()
      const [a, b] = await Promise.all([
        testService.slowCall(1),
        testService.slowCall(2)
      ])

      expect(testService.calls).to.be.equal(2)
      expect(a).to.be.not.deep.equal(b)
    })

    it('should reject every waiter when the call fails', async () => {
      const testService = new TestService()
      const results = await Promise.all([
        testService.failingCall(1).catch(error => error.message),
        testService.failingCall(1).catch(error => error.message)
      ])

      expect(testService.calls).to.be.equal(1)
      expect(results).to.be.deep.equal(['Test error', 'Test error'])
    })

    it('should retry after a failure rather than wedging the key', async () => {
      const testService = new TestService()
      await testService.failingCall(1).catch(() => undefined)
      await testService.failingCall(1).catch(() => undefined)

      expect(testService.calls).to.be.equal(2)
    })
  })
})
