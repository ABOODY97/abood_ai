import test from 'node:test';
import assert from 'node:assert/strict';
import { detectTextDirection } from './direction';
import {
  createConversation,
  deleteConversationList,
  generateConversationTitle,
  groupConversationsByDate,
  renameConversationList,
  sliceMessagesForRegenerate,
} from './conversations';
import { mapError } from './errors';
import { parseSseBuffer } from './sse';
import type { ChatMessage } from '../types/chat';

test('detectTextDirection detects Arabic, English, Turkish, and code-prefixed text', () => {
  assert.equal(detectTextDirection('مرحباً عبودي AI، كيف حالك؟'), 'rtl');
  assert.equal(detectTextDirection('Hello Aboodi AI, explain React hooks.'), 'ltr');
  assert.equal(detectTextDirection('Merhaba, bugün hava nasıl?'), 'ltr');
  assert.equal(detectTextDirection('```js\nconsole.log(1)\n```\nمرحباً'), 'rtl');
  assert.equal(detectTextDirection('12345 !!!'), 'rtl');
  assert.equal(detectTextDirection(''), 'rtl');
});

test('conversation helpers generate titles, rename, delete, and group by date across languages', () => {
  assert.equal(generateConversationTitle('   ', true, 'en'), 'Image analysis');
  assert.equal(generateConversationTitle('   ', false, 'en'), 'New chat');
  assert.equal(generateConversationTitle('   ', true, 'tr'), 'Görsel analizi');
  assert.equal(generateConversationTitle('   ', false, 'tr'), 'Yeni sohbet');
  assert.equal(
    generateConversationTitle('Explain **Artificial Intelligence** simply', false, 'en'),
    'Explain Artificial Intelligence simply'
  );

  const now = new Date('2026-11-20T14:00:00Z').getTime();
  const c1 = createConversation('First', now, 'en');
  const c2 = createConversation('Second', now - 24 * 60 * 60 * 1000, 'en');
  const c3 = createConversation('Old', now - 14 * 24 * 60 * 60 * 1000, 'en');

  const renamed = renameConversationList([c1, c2, c3], c1.id, 'Updated title', now + 1000);
  assert.equal(renamed[0].title, 'Updated title');

  const groupsEn = groupConversationsByDate(renamed, now + 1000, 'en');
  assert.equal(groupsEn.length, 3);
  assert.deepEqual(
    groupsEn.map((g) => g.key),
    ['today', 'yesterday', 'older']
  );
  assert.deepEqual(
    groupsEn.map((g) => g.label),
    ['Today', 'Yesterday', 'Older']
  );

  const groupsTr = groupConversationsByDate(renamed, now + 1000, 'tr');
  assert.deepEqual(
    groupsTr.map((g) => g.label),
    ['Bugün', 'Dün', 'Daha eski']
  );

  const afterDelete = deleteConversationList(renamed, c2.id);
  assert.equal(afterDelete.length, 2);
  assert.equal(afterDelete.some((c) => c.id === c2.id), false);
});

test('sliceMessagesForRegenerate trims conversation right before target model message', () => {
  const messages: ChatMessage[] = [
    { id: 'u1', role: 'user', text: 'Hello', createdAt: 1 },
    { id: 'm1', role: 'model', text: 'Hi!', createdAt: 2 },
    { id: 'u2', role: 'user', text: 'Write Python code', createdAt: 3 },
    { id: 'm2', role: 'model', text: 'print(1)', createdAt: 4 },
  ];

  const sliced = sliceMessagesForRegenerate(messages, 'm2');
  assert.ok(sliced);
  assert.equal(sliced.length, 3);
  assert.equal(sliced[sliced.length - 1].id, 'u2');
  assert.equal(sliceMessagesForRegenerate(messages, 'u1'), null);
});

test('parseSseBuffer handles partial frames and multiple chunks cleanly', () => {
  const part1 =
    'data: {"type":"chunk","text":"Hello "}\n\n' +
    'data: {"type":"chunk","text":"world"';

  const res1 = parseSseBuffer(part1);
  assert.equal(res1.events.length, 1);
  assert.deepEqual(res1.events[0], { type: 'chunk', text: 'Hello ' });

  const part2 = res1.remainder + '}\n\ndata: {"type":"done"}\n\n';
  const res2 = parseSseBuffer(part2);
  assert.equal(res2.events.length, 2);
  assert.deepEqual(res2.events[0], { type: 'chunk', text: 'world' });
  assert.deepEqual(res2.events[1], { type: 'done' });
  assert.equal(res2.remainder, '');
});

test('mapError classifies errors by code and translates according to language with server fallback', () => {
  assert.equal(mapError(new Error('anything'), false, 'en').code, 'OFFLINE');
  assert.equal(mapError(new Error('Failed to fetch'), true, 'en').code, 'NETWORK_ERROR');
  assert.equal(mapError(new Error('API_KEY_INVALID 403'), true, 'tr').code, 'INVALID_API_KEY');
  assert.equal(mapError(new Error('429 RESOURCE_EXHAUSTED'), true, 'en').code, 'RATE_LIMIT');

  const rateRetry = mapError(
    { code: 'RATE_LIMIT', status: 429, retryAfterSeconds: 12, message: 'fallback' },
    true,
    'en'
  );
  assert.equal(rateRetry.code, 'RATE_LIMIT');
  assert.match(rateRetry.message, /12/);

  const unknownCode = mapError(
    { code: 'CUSTOM_UPSTREAM_CODE', message: 'Custom server message' },
    true,
    'en'
  );
  assert.equal(unknownCode.code, 'CUSTOM_UPSTREAM_CODE');
  assert.equal(unknownCode.message, 'Custom server message');
});
