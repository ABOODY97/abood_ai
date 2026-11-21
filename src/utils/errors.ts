import type { ChatError } from '../types/chat';
import type { ThinkingOption } from '../config/models.config';
import { DEFAULT_ASSISTANT_NAME } from './assistantName';
import { MAX_IMAGES_PER_MESSAGE } from './imageFiles';
import { DEFAULT_LANGUAGE, hasTranslationKey, t } from '../i18n';
import type { Language } from '../i18n';

interface StructuredErrorInput {
  code: string;
  message?: string;
  status?: number;
  retryAfterSeconds?: number;
  modelName?: string;
  fallbackThinkingLevel?: ThinkingOption;
}

function translateErrorCode(
  code: string,
  lang: Language,
  opts: {
    status?: number;
    retryAfterSeconds?: number;
    modelName?: string;
    assistantName: string;
    fallbackMessage?: string;
  }
): string {
  const { status, retryAfterSeconds, modelName, assistantName, fallbackMessage } = opts;

  if (code === 'RATE_LIMIT' && typeof retryAfterSeconds === 'number' && retryAfterSeconds > 0) {
    return t(lang, 'errors.RATE_LIMIT_RETRY', { seconds: retryAfterSeconds });
  }

  if (code === 'MODEL_NOT_FOUND') {
    return modelName
      ? t(lang, 'errors.MODEL_NOT_FOUND', { model: modelName })
      : t(lang, 'errors.MODEL_NOT_FOUND_GENERIC');
  }

  if (code === 'THINKING_CONFIG_UNSUPPORTED') {
    return t(lang, 'errors.THINKING_CONFIG_UNSUPPORTED', {
      model: modelName || 'Gemini',
    });
  }

  if (code.startsWith('HTTP_')) {
    const numStatus = status ?? Number(code.slice(5));
    if (numStatus === 503) {
      return t(lang, 'errors.SERVICE_UNAVAILABLE');
    }
    return t(lang, 'errors.HTTP_ERROR', {
      status: Number.isFinite(numStatus) && numStatus > 0 ? numStatus : 500,
    });
  }

  const key = `errors.${code}`;
  if (hasTranslationKey(lang, key) || hasTranslationKey('ar', key)) {
    return t(lang, key, {
      status: status ?? (code === 'INVALID_API_KEY' ? 401 : 500),
      seconds: retryAfterSeconds ?? 30,
      model: modelName ?? 'Gemini',
      name: assistantName,
      max: MAX_IMAGES_PER_MESSAGE,
    });
  }

  if (fallbackMessage && fallbackMessage.trim().length > 0) {
    return fallbackMessage;
  }

  return t(lang, 'errors.UNKNOWN_ERROR', { name: assistantName });
}

export function mapError(
  error: unknown,
  isOnline = true,
  lang: Language = DEFAULT_LANGUAGE,
  assistantName = DEFAULT_ASSISTANT_NAME
): ChatError {
  if (!isOnline) {
    return {
      code: 'OFFLINE',
      message: t(lang, 'errors.OFFLINE'),
    };
  }

  if (error && typeof error === 'object' && 'code' in error) {
    const known = error as StructuredErrorInput;
    if (typeof known.code === 'string' && known.code.length > 0) {
      const translated = translateErrorCode(known.code, lang, {
        status: known.status,
        retryAfterSeconds: known.retryAfterSeconds,
        modelName: known.modelName,
        assistantName,
        fallbackMessage: typeof known.message === 'string' ? known.message : undefined,
      });
      return {
        code: known.code,
        status: known.status,
        retryAfterSeconds: known.retryAfterSeconds,
        modelName: known.modelName,
        fallbackThinkingLevel: known.fallbackThinkingLevel,
        message: translated,
      };
    }
  }

  const raw =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : '';
  const upper = raw.toUpperCase();

  if (upper.includes('ABORT')) {
    return {
      code: 'ABORTED',
      message: t(lang, 'errors.ABORTED'),
    };
  }

  if (
    upper.includes('FAILED TO FETCH') ||
    upper.includes('NETWORKERROR') ||
    upper.includes('LOAD FAILED') ||
    upper.includes('NETWORK')
  ) {
    return {
      code: 'NETWORK_ERROR',
      message: t(lang, 'errors.NETWORK_ERROR'),
    };
  }

  if (
    upper.includes('API_KEY') ||
    upper.includes('401') ||
    upper.includes('403') ||
    upper.includes('PERMISSION_DENIED')
  ) {
    const status = upper.includes('403') ? 403 : 401;
    return {
      code: 'INVALID_API_KEY',
      status,
      message: t(lang, 'errors.INVALID_API_KEY', { status }),
    };
  }

  if (
    upper.includes('429') ||
    upper.includes('QUOTA') ||
    upper.includes('RATE_LIMIT') ||
    upper.includes('RESOURCE_EXHAUSTED')
  ) {
    return {
      code: 'RATE_LIMIT',
      status: 429,
      message: t(lang, 'errors.RATE_LIMIT'),
    };
  }

  if (upper.includes('413') || upper.includes('PAYLOAD TOO LARGE')) {
    return {
      code: 'PAYLOAD_TOO_LARGE',
      status: 413,
      message: t(lang, 'errors.PAYLOAD_TOO_LARGE'),
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: t(lang, 'errors.UNKNOWN_ERROR', { name: assistantName }),
  };
}
