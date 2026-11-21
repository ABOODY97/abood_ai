export type ThinkingOption = 'none' | 'auto' | 'low' | 'medium' | 'high';
export type ThinkingApiMode = 'level' | 'budget' | 'none';
export type GeminiThinkingLevelValue = 'MINIMAL' | 'LOW' | 'MEDIUM' | 'HIGH';

export interface ModelThinkingSpec {
  mode: ThinkingApiMode;
  canDisable: boolean;
  defaultLevel: ThinkingOption;
  supportedLevels: ThinkingOption[];
  budgetMap?: Partial<Record<ThinkingOption, number>>;
  unsupportedReason?: string;
}

export interface ModelDefinition {
  id: string;
  name: string;
  family: 'flash' | 'flash-lite' | 'pro';
  shortTag: string;
  description: string;
  supportsMultimodal: boolean;
  thinking: ModelThinkingSpec;
}

export interface GeminiThinkingPayload {
  thinkingLevel?: GeminiThinkingLevelValue;
  thinkingBudget?: number;
  includeThoughts?: boolean;
}

export const THINKING_LABELS: Record<ThinkingOption, string> = {
  none: 'models.thinkingLabels.none',
  auto: 'models.thinkingLabels.auto',
  low: 'models.thinkingLabels.low',
  medium: 'models.thinkingLabels.medium',
  high: 'models.thinkingLabels.high',
};

/**
 * قائمة النماذج المتاحة — ملف الإعداد المركزي الوحيد.
 * لإضافة نموذج جديد، أضف عنصراً هنا مع مفاتيح الترجمة الخاصة به وسيظهر تلقائياً في الواجهة والخادم.
 *
 * ملاحظة حول معلمات التفكير وفق وثائق Gemini API:
 * - نماذج الجيل الأحدث (Gemini 3 / Gemini 4) تستخدم `thinkingLevel`.
 * - نماذج Gemini 2.5 تستخدم `thinkingBudget` (عدد رموز التفكير، 0 للتعطيل، -1 للتلقائي).
 */
export const MODELS: ModelDefinition[] = [
  {
    id: 'gemini-4-hydrogen',
    name: 'Gemini Flash',
    family: 'flash',
    shortTag: 'models.gemini4Hydrogen.shortTag',
    description: 'models.gemini4Hydrogen.description',
    supportsMultimodal: true,
    thinking: {
      mode: 'level',
      canDisable: false,
      defaultLevel: 'auto',
      supportedLevels: ['auto', 'low', 'medium', 'high'],
    },
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini Flash-Lite',
    family: 'flash-lite',
    shortTag: 'models.gemini31FlashLite.shortTag',
    description: 'models.gemini31FlashLite.description',
    supportsMultimodal: true,
    thinking: {
      mode: 'level',
      canDisable: true,
      defaultLevel: 'none',
      supportedLevels: ['none', 'low', 'medium', 'high'],
    },
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    family: 'flash',
    shortTag: 'models.gemini25Flash.shortTag',
    description: 'models.gemini25Flash.description',
    supportsMultimodal: true,
    thinking: {
      mode: 'budget',
      canDisable: true,
      defaultLevel: 'auto',
      supportedLevels: ['none', 'auto', 'low', 'medium', 'high'],
      budgetMap: {
        none: 0,
        auto: -1,
        low: 1024,
        medium: 4096,
        high: 16384,
      },
    },
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    family: 'pro',
    shortTag: 'models.gemini25Pro.shortTag',
    description: 'models.gemini25Pro.description',
    supportsMultimodal: true,
    thinking: {
      mode: 'budget',
      canDisable: false,
      defaultLevel: 'auto',
      supportedLevels: ['auto', 'low', 'medium', 'high'],
      budgetMap: {
        auto: -1,
        low: 1024,
        medium: 4096,
        high: 16384,
      },
    },
  },
];

export const DEFAULT_MODEL_ID = MODELS[0].id;

export function getModelById(modelId?: string | null): ModelDefinition {
  if (!modelId) return MODELS[0];
  return MODELS.find((m) => m.id === modelId) ?? MODELS[0];
}

export function isValidModelId(modelId?: string | null): boolean {
  if (!modelId) return false;
  return MODELS.some((m) => m.id === modelId);
}

export function resolveThinkingLevelForModel(
  model: ModelDefinition,
  requested?: ThinkingOption | null
): ThinkingOption {
  if (model.thinking.mode === 'none') {
    return 'none';
  }
  if (requested && model.thinking.supportedLevels.includes(requested)) {
    return requested;
  }
  // If user requested 'none' on a model that cannot disable thinking, fall back to its default (e.g. 'auto' or 'low')
  if (requested === 'none' && !model.thinking.canDisable) {
    return model.thinking.defaultLevel;
  }
  return model.thinking.defaultLevel;
}

export function buildGeminiThinkingConfig(
  model: ModelDefinition,
  requested?: ThinkingOption | null
): {
  config?: GeminiThinkingPayload;
  resolvedLevel: ThinkingOption;
  adjusted: boolean;
} {
  if (model.thinking.mode === 'none') {
    return {
      config: undefined,
      resolvedLevel: 'none',
      adjusted: Boolean(requested && requested !== 'none'),
    };
  }

  const resolvedLevel = resolveThinkingLevelForModel(model, requested);
  const adjusted = Boolean(requested && requested !== resolvedLevel);

  if (model.thinking.mode === 'level') {
    if (resolvedLevel === 'none') {
      return {
        config: {
          thinkingLevel: 'MINIMAL',
          includeThoughts: false,
        },
        resolvedLevel,
        adjusted,
      };
    }

    if (resolvedLevel === 'auto') {
      return {
        config: {
          includeThoughts: true,
        },
        resolvedLevel,
        adjusted,
      };
    }

    const levelMap: Record<'low' | 'medium' | 'high', GeminiThinkingLevelValue> = {
      low: 'LOW',
      medium: 'MEDIUM',
      high: 'HIGH',
    };

    return {
      config: {
        thinkingLevel: levelMap[resolvedLevel],
        includeThoughts: true,
      },
      resolvedLevel,
      adjusted,
    };
  }

  // Budget mode (Gemini 2.5 series)
  const budget = model.thinking.budgetMap?.[resolvedLevel];
  if (resolvedLevel === 'none' || budget === 0) {
    return {
      config: {
        thinkingBudget: 0,
        includeThoughts: false,
      },
      resolvedLevel,
      adjusted,
    };
  }

  return {
    config: {
      thinkingBudget: typeof budget === 'number' ? budget : -1,
      includeThoughts: true,
    },
    resolvedLevel,
    adjusted,
  };
}
