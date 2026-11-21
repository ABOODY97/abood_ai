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
  localizeKeyValidationResult,
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
  assert.match(getNextDefaultKeyName(store.keys, 'ar'), /1$/);
  assert.equal(getNextDefaultKeyName(store.keys, 'en'), 'Key 1');
  assert.equal(getNextDefaultKeyName(store.keys, 'tr'), 'Anahtar 1');

  const added1 = addApiKeyToStore(store, '  AQ.key-one-1111\n', '', true, 100, 'en');
  assert.ok(added1);
  store = added1.store;
  assert.equal(added1.entry.name, 'Key 1');
  assert.equal(added1.entry.key, 'AQ.key-one-1111');
  assert.equal(getActiveApiKey(store)?.id, added1.entry.id);

  const added2 = addApiKeyToStore(store, 'key-two-2222', 'Backup Key', false, 200, 'en');
  assert.ok(added2);
  store = added2.store;
  assert.equal(added2.entry.name, 'Backup Key');
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
  store = renameApiKeyInStore(store, added1.entry.id, 'Primary Key');
  assert.equal(store.keys[0].name, 'Primary Key');

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

test('classifyKeyValidationResult classifies by outcome, code, and status without depending on localized text', () => {
  const ok = classifyKeyValidationResult(200, '{"candidates":[]}');
  assert.equal(ok.valid, true);
  assert.equal(ok.outcome, 'valid');
  assert.equal(ok.allowSave, true);
  assert.equal(ok.code, 'VALID');
  assert.equal(ok.status, 200);

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
  assert.equal(bad401.code, 'INVALID_API_KEY');

  const bad403 = classifyKeyValidationResult(
    403,
    JSON.stringify({ error: { status: 'PERMISSION_DENIED', message: 'API key denied' } })
  );
  assert.equal(bad403.outcome, 'invalid_key');
  assert.equal(bad403.allowSave, false);
  assert.equal(bad403.status, 403);
  assert.equal(bad403.code, 'INVALID_API_KEY');

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
  assert.equal(bad400Key.status, 400);
  assert.equal(bad400Key.code, 'INVALID_API_KEY');

  // Non-key 400 (e.g., payload parameter mismatch) must NOT mark key as invalid
  const nonKey400 = classifyKeyValidationResult(
    400,
    JSON.stringify({ error: { status: 'INVALID_ARGUMENT', message: 'Unsupported thinkingLevel' } })
  );
  assert.equal(nonKey400.outcome, 'unverified');
  assert.equal(nonKey400.allowSave, true);
  assert.equal(nonKey400.status, 400);
  assert.equal(nonKey400.code, 'HTTP_400');

  // 429 rate limit -> unverified, allowSave: true, code RATE_LIMIT
  const rate429 = classifyKeyValidationResult(
    429,
    JSON.stringify({ error: { status: 'RESOURCE_EXHAUSTED', message: 'Quota exceeded' } })
  );
  assert.equal(rate429.outcome, 'unverified');
  assert.equal(rate429.allowSave, true);
  assert.equal(rate429.status, 429);
  assert.equal(rate429.code, 'RATE_LIMIT');

  // 404 or 503 -> unverified, allowSave: true, HTTP_<code>
  const notFound404 = classifyKeyValidationResult(404, '{"error":{"status":"NOT_FOUND"}}');
  assert.equal(notFound404.outcome, 'unverified');
  assert.equal(notFound404.allowSave, true);
  assert.equal(notFound404.status, 404);
  assert.equal(notFound404.code, 'HTTP_404');

  const srv503 = classifyKeyValidationResult(503, 'Service Unavailable');
  assert.equal(srv503.outcome, 'unverified');
  assert.equal(srv503.allowSave, true);
  assert.equal(srv503.status, 503);
  assert.equal(srv503.code, 'HTTP_503');

  // Client localization translates by code and preserves status numbers
  const enLocalized = localizeKeyValidationResult(bad401, 'en');
  assert.equal(enLocalized.code, 'INVALID_API_KEY');
  assert.match(enLocalized.message, /401/);

  const trLocalized = localizeKeyValidationResult(
    { ...rate429, retryAfterSeconds: 20 },
    'tr'
  );
  assert.equal(trLocalized.code, 'RATE_LIMIT');
  assert.match(trLocalized.message, /20/);
});

test('classifyKeyValidationNetworkError handles timeout and network errors while allowing save', () => {
  const timeoutErr = new DOMException('The operation was aborted due to timeout', 'TimeoutError');
  const timeoutRes = classifyKeyValidationNetworkError(timeoutErr);
  assert.equal(timeoutRes.outcome, 'unverified');
  assert.equal(timeoutRes.allowSave, true);
  assert.equal(timeoutRes.status, 408);
  assert.equal(timeoutRes.code, 'TIMEOUT');

  const netRes = classifyKeyValidationNetworkError(new TypeError('fetch failed'));
  assert.equal(netRes.outcome, 'unverified');
  assert.equal(netRes.allowSave, true);
  assert.equal(netRes.code, 'NETWORK_ERROR');
});
