import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DICTIONARIES,
  ar,
  collectLeafKeys,
  detectInitialLanguage,
  en,
  hasTranslationKey,
  t,
  tr,
} from './index';
import { MODELS, THINKING_LABELS } from '../config/models.config';

test('t() translates keys across ar, en, and tr with variable interpolation', () => {
  assert.equal(t('ar', 'welcome.greeting', { name: 'عبودي AI' }), 'أهلاً بك في عبودي AI');
  assert.equal(t('en', 'welcome.greeting', { name: 'Aboodi AI' }), 'Welcome to Aboodi AI');
  assert.equal(t('tr', 'welcome.greeting', { name: 'Aboodi AI' }), "Aboodi AI'a hoş geldiniz");

  assert.match(t('en', 'errors.RATE_LIMIT_RETRY', { seconds: 15 }), /15/);
  assert.match(t('tr', 'errors.RATE_LIMIT_RETRY', { seconds: 15 }), /15/);
  assert.match(t('ar', 'errors.RATE_LIMIT_RETRY', { seconds: 15 }), /15/);
});

test('t() falls back to Arabic when a key is missing in target dictionary, then to key itself', () => {
  const originalEn = DICTIONARIES.en;
  try {
    // Temporarily simulate a missing nested key in English dictionary
    const partialEn = {
      ...originalEn,
      sidebar: {
        ...originalEn.sidebar,
        newChat: undefined as unknown as string,
      },
    };
    DICTIONARIES.en = partialEn;

    assert.equal(t('en', 'sidebar.newChat'), ar.sidebar.newChat);
    assert.equal(t('en', 'non.existent.key'), 'non.existent.key');
    assert.equal(t('tr', 'completely.unknown'), 'completely.unknown');
  } finally {
    DICTIONARIES.en = originalEn;
  }
});

test('detectInitialLanguage detects en and tr prefixes and defaults to ar otherwise', () => {
  assert.equal(detectInitialLanguage('en'), 'en');
  assert.equal(detectInitialLanguage('en-US'), 'en');
  assert.equal(detectInitialLanguage('EN-gb'), 'en');
  assert.equal(detectInitialLanguage('tr'), 'tr');
  assert.equal(detectInitialLanguage('tr-TR'), 'tr');
  assert.equal(detectInitialLanguage('ar'), 'ar');
  assert.equal(detectInitialLanguage('ar-SA'), 'ar');
  assert.equal(detectInitialLanguage('fr-FR'), 'ar');
  assert.equal(detectInitialLanguage('de'), 'ar');
  assert.equal(detectInitialLanguage(''), 'ar');
  assert.equal(detectInitialLanguage(undefined), 'ar');
  assert.equal(detectInitialLanguage(null), 'ar');
});

test('en.ts and tr.ts contain every leaf key present in ar.ts and all keys resolve cleanly via t()', () => {
  const arKeys = collectLeafKeys(ar as unknown as Record<string, unknown>).sort();
  const enKeys = collectLeafKeys(en as unknown as Record<string, unknown>).sort();
  const trKeys = collectLeafKeys(tr as unknown as Record<string, unknown>).sort();

  assert.deepEqual(enKeys, arKeys, 'English dictionary keys must match Arabic keys exactly');
  assert.deepEqual(trKeys, arKeys, 'Turkish dictionary keys must match Arabic keys exactly');

  for (const key of arKeys) {
    assert.equal(hasTranslationKey('ar', key), true, `Unresolvable ar key: ${key}`);
    assert.equal(hasTranslationKey('en', key), true, `Unresolvable en key: ${key}`);
    assert.equal(hasTranslationKey('tr', key), true, `Unresolvable tr key: ${key}`);
    assert.ok(t('ar', key).length > 0 || key === 'pwa.iosStep3Before', `Empty ar key: ${key}`);
    assert.ok(t('en', key).length > 0 || key === 'pwa.iosStep3Before', `Empty en key: ${key}`);
    assert.ok(t('tr', key).length > 0 || key === 'pwa.iosStep3Before', `Empty tr key: ${key}`);
  }

  for (const model of MODELS) {
    for (const lang of ['ar', 'en', 'tr'] as const) {
      assert.equal(hasTranslationKey(lang, model.shortTag), true, `Missing shortTag ${model.shortTag} in ${lang}`);
      assert.equal(hasTranslationKey(lang, model.description), true, `Missing description ${model.description} in ${lang}`);
      assert.notEqual(t(lang, model.shortTag), model.shortTag);
      assert.notEqual(t(lang, model.description), model.description);
    }
  }

  for (const labelKey of Object.values(THINKING_LABELS)) {
    for (const lang of ['ar', 'en', 'tr'] as const) {
      assert.equal(hasTranslationKey(lang, labelKey), true, `Missing thinking label ${labelKey} in ${lang}`);
    }
  }
});
