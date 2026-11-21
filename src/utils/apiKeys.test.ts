import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addApiKeyToStore,
  createEmptyApiKeyStore,
  deleteApiKeyFromStore,
  getActiveApiKey,
  getAlternativeApiKeys,
  getNextDefaultKeyName,
  maskApiKey,
  renameApiKeyInStore,
  sanitizeApiKey,
  setActiveApiKey,
} from './apiKeys';

import {
  classifyKeyValidationNetworkError,
  classifyKeyValidationResult,
} from './keyValidation';

test('sanitizeApiKey removes leading/trailing/internal spaces, newlines, and zero-width chars for any key format (AQ., AIza, etc.)', () => {
  assert.equal(sanitizeApiKey('  \n\tAIzaSyTestKey1234\r\n  '), 'AIzaSyTestKey1234');
  assert.equal(sanitizeApiKey('\u200B  AQ.Ab8RN6\n aLRw \r\n'), 'AQ.Ab8RN6aLRw');
  assert.equal(sanitizeApiKey('custom-key-format-9999'), 'custom-key-format-9999');
  assert.equal(sanitizeApiKey('   \n  '), '');
});

test('maskApiKey reveals only the final 4 characters', () => {
  assert.equal(maskApiKey('AQ.Ab8RN6ExampleKeyaLRw'), '••••aLRw');
  assert.equal(maskApiKey('AIzaSyExampleKeyaLRw'), '••••aLRw');
  assert.equal(maskApiKey('  short  '), '••••hort');
  assert.equal(maskApiKey('1234'), '••••1234');
  assert.equal(maskApiKey(''), '••••');
});

test('multi-key CRUD handles sequential naming, activation, rename, alternatives, and empty return', () => {
  let store = createEmptyApiKeyStore();
  assert.equal(getNextDefaultKeyName(store.keys), 'مفتاح 1');

  const added1 = addApiKeyToStore(store, '  AQ.key-one-1111\n', '', true, 100);
  assert.ok(added1);
  store = added1.store;
  assert.equal(added1.entry.name, 'مفتاح 1');
  assert.equal(added1.entry.key, 'AQ.key-one-1111');
  assert.equal(getActiveApiKey(store)?.id, added1.entry.id);

  const added2 = addApiKeyToStore(store, 'key-two-2222', 'مفتاحي الاحتياطي', false, 200);
  assert.ok(added2);
  store = added2.store;
  assert.equal(added2.entry.name, 'مفتاحي الاحتياطي');
  // Active key remains key 1 since activate=false
  assert.equal(getActiveApiKey(store)?.id, added1.entry.id);
  assert.deepEqual(
    getAlternativeApiKeys(store).map((k) => k.id),
    [added2.entry.id]
  );

  // Switch active key
  store = setActiveApiKey(store, added2.entry.id);
  assert.equal(getActiveApiKey(store)?.id, added2.entry.id);

  // Rename key 1
  store = renameApiKeyInStore(store, added1.entry.id, 'مفتاحي الرئيسي');
  assert.equal(store.keys[0].name, 'مفتاحي الرئيسي');

  // Delete active key (key 2) -> automatically activates remaining key 1
  store = deleteApiKeyFromStore(store, added2.entry.id);
  assert.equal(store.keys.length, 1);
  assert.equal(getActiveApiKey(store)?.id, added1.entry.id);

  // Delete last remaining key -> returns empty store with activeKeyId: null
  store = deleteApiKeyFromStore(store, added1.entry.id);
  assert.equal(store.keys.length, 0);
  assert.equal(store.activeKeyId, null);
  assert.equal(getActiveApiKey(store), null);
});

test('classifyKeyValidationResult marks only 400/401/403 bad-key errors as invalid and allows saving on 429/transient errors with actual status code', () => {
  const ok = classifyKeyValidationResult(200, '{"candidates":[]}');
  assert.equal(ok.valid, true);
  assert.equal(ok.outcome, 'valid');
  assert.equal(ok.allowSave, true);

  const bad401 = classifyKeyValidationResult(
    401,
    JSON.stringify({
      error: {
        code: 401,
        message: 'API key not valid. Please pass a valid API key.',
        status: 'UNAUTHENTICATED',
      },
    })
  );
  assert.equal(bad401.valid, false);
  assert.equal(bad401.outcome, 'invalid_key');
  assert.equal(bad401.allowSave, false);
  assert.equal(bad401.status, 401);
  assert.match(bad401.message, /401/);

  const bad403 = classifyKeyValidationResult(
    403,
    JSON.stringify({ error: { status: 'PERMISSION_DENIED', message: 'API key denied' } })
  );
  assert.equal(bad403.outcome, 'invalid_key');
  assert.equal(bad403.allowSave, false);
  assert.match(bad403.message, /403/);

  const bad400Key = classifyKeyValidationResult(
    400,
    JSON.stringify({
      error: {
        status: 'INVALID_ARGUMENT',
        message: 'API key not valid.',
        details: [{ reason: 'API_KEY_INVALID' }],
      },
    })
  );
  assert.equal(bad400Key.outcome, 'invalid_key');
  assert.equal(bad400Key.allowSave, false);
  assert.match(bad400Key.message, /400/);

  // Non-key 400 (e.g., payload parameter mismatch) must NOT mark key as invalid
  const nonKey400 = classifyKeyValidationResult(
    400,
    JSON.stringify({ error: { status: 'INVALID_ARGUMENT', message: 'Unsupported thinkingLevel' } })
  );
  assert.equal(nonKey400.outcome, 'unverified');
  assert.equal(nonKey400.allowSave, true);
  assert.match(nonKey400.message, /400/);

  // 429 rate limit -> unverified, allowSave: true, shows 429
  const rate429 = classifyKeyValidationResult(
    429,
    JSON.stringify({ error: { status: 'RESOURCE_EXHAUSTED', message: 'Quota exceeded' } })
  );
  assert.equal(rate429.outcome, 'unverified');
  assert.equal(rate429.allowSave, true);
  assert.equal(rate429.status, 429);
  assert.match(rate429.message, /429/);

  // 404 or 503 -> unverified, allowSave: true, shows actual status code
  const notFound404 = classifyKeyValidationResult(404, '{"error":{"status":"NOT_FOUND"}}');
  assert.equal(notFound404.outcome, 'unverified');
  assert.equal(notFound404.allowSave, true);
  assert.match(notFound404.message, /404/);

  const srv503 = classifyKeyValidationResult(503, 'Service Unavailable');
  assert.equal(srv503.outcome, 'unverified');
  assert.equal(srv503.allowSave, true);
  assert.match(srv503.message, /503/);
});

test('classifyKeyValidationNetworkError handles timeout and network errors while allowing save', () => {
  const timeoutErr = new DOMException('The operation was aborted due to timeout', 'TimeoutError');
  const timeoutRes = classifyKeyValidationNetworkError(timeoutErr);
  assert.equal(timeoutRes.outcome, 'unverified');
  assert.equal(timeoutRes.allowSave, true);
  assert.equal(timeoutRes.status, 408);
  assert.match(timeoutRes.message, /408/);

  const netRes = classifyKeyValidationNetworkError(new TypeError('fetch failed'));
  assert.equal(netRes.outcome, 'unverified');
  assert.equal(netRes.allowSave, true);
  assert.equal(netRes.code, 'NETWORK_ERROR');
  assert.match(netRes.message, /NETWORK/);
});
