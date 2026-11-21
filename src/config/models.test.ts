import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_MODEL_ID,
  MODELS,
  buildGeminiThinkingConfig,
  getModelById,
  resolveThinkingLevelForModel,
  type ModelDefinition,
} from './models.config';

test('getModelById resolves known models and falls back safely to default', () => {
  assert.equal(getModelById(undefined).id, DEFAULT_MODEL_ID);
  assert.equal(getModelById('unknown-model').id, DEFAULT_MODEL_ID);
  assert.equal(getModelById('gemini-2.5-pro').name, 'Gemini 2.5 Pro');
  assert.ok(MODELS.some((m) => m.family === 'flash'));
  assert.ok(MODELS.some((m) => m.family === 'flash-lite'));
  assert.ok(MODELS.some((m) => m.family === 'pro'));
});

test('thinkingLevel models map levels properly and never emit thinkingBudget', () => {
  const flash = getModelById('gemini-4-hydrogen');
  const highRes = buildGeminiThinkingConfig(flash, 'high');
  assert.deepEqual(highRes.config, { thinkingLevel: 'HIGH', includeThoughts: true });
  assert.equal(highRes.adjusted, false);

  // gemini-4-hydrogen cannot disable thinking -> falls back to auto
  const noneAttempt = buildGeminiThinkingConfig(flash, 'none');
  assert.equal(noneAttempt.resolvedLevel, 'auto');
  assert.equal(noneAttempt.adjusted, true);
  assert.deepEqual(noneAttempt.config, { includeThoughts: true });

  // gemini-3.1-flash-lite CAN disable thinking via MINIMAL
  const lite = getModelById('gemini-3.1-flash-lite');
  const liteNone = buildGeminiThinkingConfig(lite, 'none');
  assert.equal(liteNone.resolvedLevel, 'none');
  assert.deepEqual(liteNone.config, { thinkingLevel: 'MINIMAL', includeThoughts: false });
});

test('thinkingBudget models map numeric budgets properly and never emit thinkingLevel', () => {
  const flash25 = getModelById('gemini-2.5-flash');
  assert.deepEqual(buildGeminiThinkingConfig(flash25, 'none').config, {
    thinkingBudget: 0,
    includeThoughts: false,
  });
  assert.deepEqual(buildGeminiThinkingConfig(flash25, 'medium').config, {
    thinkingBudget: 4096,
    includeThoughts: true,
  });
  assert.deepEqual(buildGeminiThinkingConfig(flash25, 'auto').config, {
    thinkingBudget: -1,
    includeThoughts: true,
  });

  // gemini-2.5-pro cannot set budget 0 -> falls back to auto (-1)
  const pro25 = getModelById('gemini-2.5-pro');
  const proNone = buildGeminiThinkingConfig(pro25, 'none');
  assert.equal(proNone.resolvedLevel, 'auto');
  assert.equal(proNone.adjusted, true);
  assert.deepEqual(proNone.config, { thinkingBudget: -1, includeThoughts: true });
});

test('non-thinking model returns undefined config and resolves to none', () => {
  const customNoThink: ModelDefinition = {
    id: 'custom-basic',
    name: 'Basic',
    family: 'flash-lite',
    shortTag: 'أساسي',
    description: 'نموذج بدون تفكير',
    supportsMultimodal: true,
    thinking: {
      mode: 'none',
      canDisable: true,
      defaultLevel: 'none',
      supportedLevels: [],
      unsupportedReason: 'هذا النموذج لا يدعم ميزة التفكير.',
    },
  };

  assert.equal(resolveThinkingLevelForModel(customNoThink, 'high'), 'none');
  const result = buildGeminiThinkingConfig(customNoThink, 'high');
  assert.equal(result.config, undefined);
  assert.equal(result.resolvedLevel, 'none');
  assert.equal(result.adjusted, true);
});
