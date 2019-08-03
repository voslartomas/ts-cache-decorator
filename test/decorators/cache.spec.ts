import * as chai from 'chai'
import * as redis from 'redis'
import * as sinon from 'sinon'
const expect = chai.expect
import { Cache, invalidateCache } from '../../src/decorators/cache'
import { RedisStorage } from '../../src/storages/redisStorage'
import redisClientStub from '../stubs/redis'

sinon.stub(redis, 'createClient').returns(redisClientStub)
const cacheStorage = new RedisStorage('host', 6379, 'password')

class TestService {
  @Cache(cacheStorage, { type: 'request', cacheKey: 'test.call' })
  async testCall (id = 123) {
    return {
      id,
      attr: Math.random()
    }
  }

  @Cache(cacheStorage, { type: 'normal', cacheKey: 'test.call' })
  async testNormalCacheCall (id = 123) {
    return {
      id,
      attr: Math.random()
    }
  }
}

describe('Caching unit tests', () => {
  describe('Valid caching', () => {
    it('should cache (normal) method', async () => {
      const testService = new TestService()
      const a = await testService.testNormalCacheCall()
      const b = await testService.testNormalCacheCall()

      expect(a).to.be.deep.equal(b)
    })

    it('should cache method', async () => {
      const testService = new TestService()
      const a = await testService.testCall()
      const b = await testService.testCall()

      expect(a).to.be.deep.equal(b)
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
      invalidateCache(cacheStorage, 'test.call', [])
      const b = await testService.testCall()

      expect(a).to.be.not.deep.equal(b)
    })

    it('should invalidate cache with params', async () => {
      const testService = new TestService()
      const a = await testService.testCall(1)
      invalidateCache(cacheStorage, 'test.call', [1])
      const b = await testService.testCall(1)

      expect(a).to.be.not.deep.equal(b)
    })
  })
})
