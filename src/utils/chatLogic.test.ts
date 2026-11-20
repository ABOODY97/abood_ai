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
import { mapErrorToArabic } from './errors';
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

test('conversation helpers generate titles, rename, delete, and group by date', () => {
  assert.equal(generateConversationTitle('   ', true), 'تحليل صورة');
  assert.equal(generateConversationTitle('   ', false), 'محادثة جديدة');
  assert.equal(
    generateConversationTitle('اشرح لي **الذكاء الاصطناعي** ببساطة'),
    'اشرح لي الذكاء الاصطناعي ببساطة'
  );

  const now = new Date('2026-11-20T14:00:00Z').getTime();
  const c1 = createConversation('أولى', now);
  const c2 = createConversation('ثانية', now - 24 * 60 * 60 * 1000);
  const c3 = createConversation('قديمة', now - 14 * 24 * 60 * 60 * 1000);

  const renamed = renameConversationList([c1, c2, c3], c1.id, 'عنوان محدث', now + 1000);
  assert.equal(renamed[0].title, 'عنوان محدث');

  const groups = groupConversationsByDate(renamed, now + 1000);
  assert.equal(groups.length, 3);
  assert.equal(groups[0].label, 'اليوم');
  assert.equal(groups[1].label, 'أمس');
  assert.equal(groups[2].label, 'سابقاً');

  const afterDelete = deleteConversationList(renamed, c2.id);
  assert.equal(afterDelete.length, 2);
  assert.equal(afterDelete.some((c) => c.id === c2.id), false);
});

test('sliceMessagesForRegenerate trims conversation right before target model message', () => {
  const messages: ChatMessage[] = [
    { id: 'u1', role: 'user', text: 'مرحباً', createdAt: 1 },
    { id: 'm1', role: 'model', text: 'أهلاً بك!', createdAt: 2 },
    { id: 'u2', role: 'user', text: 'اعطني كود بايثون', createdAt: 3 },
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
    'data: {"type":"chunk","text":"مرحباً "}\n\n' +
    'data: {"type":"chunk","text":"بكم"';

  const res1 = parseSseBuffer(part1);
  assert.equal(res1.events.length, 1);
  assert.deepEqual(res1.events[0], { type: 'chunk', text: 'مرحباً ' });

  const part2 = res1.remainder + '}\n\ndata: {"type":"done"}\n\n';
  const res2 = parseSseBuffer(part2);
  assert.equal(res2.events.length, 2);
  assert.deepEqual(res2.events[0], { type: 'chunk', text: 'بكم' });
  assert.deepEqual(res2.events[1], { type: 'done' });
  assert.equal(res2.remainder, '');
});

test('mapErrorToArabic classifies offline, invalid key, rate limit, and network errors', () => {
  assert.equal(mapErrorToArabic(new Error('anything'), false).code, 'OFFLINE');
  assert.equal(mapErrorToArabic(new Error('Failed to fetch'), true).code, 'NETWORK_ERROR');
  assert.equal(mapErrorToArabic(new Error('API_KEY_INVALID 403'), true).code, 'INVALID_API_KEY');
  assert.equal(mapErrorToArabic(new Error('429 RESOURCE_EXHAUSTED'), true).code, 'RATE_LIMIT');
});
