import test from 'node:test';
import assert from 'node:assert/strict';
import { SlidingWindowRateLimiter } from './rateLimit';

test('SlidingWindowRateLimiter allows requests up to max and blocks excess until window expires', () => {
  const limiter = new SlidingWindowRateLimiter(2, 10_000);
  const t0 = 1_000_000;

  const r1 = limiter.check('1.2.3.4', t0);
  assert.equal(r1.allowed, true);
  assert.equal(r1.remaining, 1);

  const r2 = limiter.check('1.2.3.4', t0 + 1000);
  assert.equal(r2.allowed, true);
  assert.equal(r2.remaining, 0);

  const r3 = limiter.check('1.2.3.4', t0 + 2000);
  assert.equal(r3.allowed, false);
  assert.equal(r3.retryAfterSeconds, 8);

  // Different IP is unaffected
  const otherIp = limiter.check('5.6.7.8', t0 + 2000);
  assert.equal(otherIp.allowed, true);

  // After window slides past t0, request succeeds again
  const r4 = limiter.check('1.2.3.4', t0 + 10_001);
  assert.equal(r4.allowed, true);
});
