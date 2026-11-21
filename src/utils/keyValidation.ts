export type KeyValidationOutcome = 'valid' | 'invalid_key' | 'unverified';

export interface KeyValidationResponse {
  valid: boolean;
  outcome: KeyValidationOutcome;
  allowSave: boolean;
  status: number | null;
  code: string;
  message: string;
}

function extractUpstreamErrorSignals(rawBodyText: string): string {
  if (!rawBodyText) return '';
  try {
    const parsed = JSON.parse(rawBodyText) as {
      error?: {
        message?: string;
        status?: string;
        details?: Array<{ reason?: string; message?: string }>;
      };
    };
    const parts: string[] = [];
    if (parsed?.error?.status) parts.push(parsed.error.status);
    if (parsed?.error?.message) parts.push(parsed.error.message);
    if (Array.isArray(parsed?.error?.details)) {
      for (const detail of parsed.error.details) {
        if (detail?.reason) parts.push(detail.reason);
        if (detail?.message) parts.push(detail.message);
      }
    }
    if (parts.length > 0) {
      return parts.join(' | ');
    }
  } catch {
    // Non-JSON upstream error body; fall back to raw text
  }
  return rawBodyText.slice(0, 600);
}

/**
 * Determines whether an upstream 400 / 401 / 403 response explicitly indicates
 * an invalid, expired, or unauthorized API key (rather than a quota, model, or
 * unrelated parameter issue).
 */
export function isInvalidKeyUpstreamError(
  httpStatus: number,
  rawBodyText: string
): boolean {
  if (httpStatus !== 400 && httpStatus !== 401 && httpStatus !== 403) {
    return false;
  }

  const signals = extractUpstreamErrorSignals(rawBodyText).toUpperCase();

  // Quota/rate-limit signals should never be marked as an invalid key
  if (
    signals.includes('RESOURCE_EXHAUSTED') ||
    signals.includes('RATE_LIMIT') ||
    signals.includes('RATE LIMIT') ||
    signals.includes('QUOTA')
  ) {
    return false;
  }

  const explicitKeyErrorMarkers = [
    'API_KEY_INVALID',
    'API KEY NOT VALID',
    'INVALID API KEY',
    'API_KEY_EXPIRED',
    'API KEY EXPIRED',
    'API_KEY_NOT_FOUND',
    'API_KEY_SERVICE_BLOCKED',
    'API_KEY_HTTP_REFERRER_BLOCKED',
    'API_KEY_IP_ADDRESS_BLOCKED',
    'ACCESS_TOKEN_TYPE_UNSUPPORTED',
    'INVALID_CREDENTIALS',
    'UNAUTHENTICATED',
    'PERMISSION_DENIED',
  ];

  if (explicitKeyErrorMarkers.some((marker) => signals.includes(marker))) {
    return true;
  }

  const mentionsKey =
    signals.includes('API KEY') ||
    signals.includes('API_KEY') ||
    signals.includes('X-GOOG-API-KEY');
  const mentionsInvalid =
    signals.includes('INVALID') ||
    signals.includes('NOT VALID') ||
    signals.includes('EXPIRED') ||
    signals.includes('UNAUTHORIZED') ||
    signals.includes('FORBIDDEN') ||
    signals.includes('DENIED') ||
    signals.includes('REJECTED');

  if (mentionsKey && mentionsInvalid) {
    return true;
  }

  // For 400, require explicit key-related error text so unrelated payload/model 400s
  // do not falsely reject a valid key.
  if (httpStatus === 400) {
    return false;
  }

  // For 401/403 with an empty or generic auth-rejection body, treat as invalid key
  return (
    signals.trim().length === 0 ||
    signals.includes('UNAUTHORIZED') ||
    signals.includes('FORBIDDEN') ||
    signals.includes('AUTH')
  );
}

/**
 * Classifies the HTTP response from a real `generateContent` key-check request.
 * Only 400/401/403 with an explicit bad-key error marks the key as invalid.
 * 429, timeouts, network issues, and other transient errors return `unverified`
 * with `allowSave: true` and surface the exact status code.
 */
export function classifyKeyValidationResult(
  httpStatus: number,
  rawBodyText: string
): KeyValidationResponse {
  if (httpStatus >= 200 && httpStatus < 300) {
    return {
      valid: true,
      outcome: 'valid',
      allowSave: true,
      status: httpStatus,
      code: 'VALID',
      message: 'المفتاح صالح وجاهز للاستخدام.',
    };
  }

  if (isInvalidKeyUpstreamError(httpStatus, rawBodyText)) {
    return {
      valid: false,
      outcome: 'invalid_key',
      allowSave: false,
      status: httpStatus,
      code: 'INVALID_API_KEY',
      message: `المفتاح غير صالح أو لا يملك الصلاحيات المطلوبة (رمز الخطأ: ${httpStatus}). تحقق من المفتاح ثم أعد المحاولة.`,
    };
  }

  if (httpStatus === 429) {
    return {
      valid: false,
      outcome: 'unverified',
      allowSave: true,
      status: 429,
      code: 'RATE_LIMIT',
      message:
        'تعذّر التحقق الآن بسبب تجاوز حد الطلبات (رمز الخطأ: 429). يمكنك حفظ المفتاح والمتابعة.',
    };
  }

  if (httpStatus === 408 || httpStatus === 504) {
    return {
      valid: false,
      outcome: 'unverified',
      allowSave: true,
      status: httpStatus,
      code: 'TIMEOUT',
      message: `تعذّر التحقق الآن بسبب انتهاء مهلة الاتصال (رمز الخطأ: ${httpStatus}). يمكنك حفظ المفتاح والمتابعة.`,
    };
  }

  return {
    valid: false,
    outcome: 'unverified',
    allowSave: true,
    status: httpStatus,
    code: `HTTP_${httpStatus}`,
    message: `تعذّر التحقق الآن (رمز الخطأ: ${httpStatus}). لم يُرفض المفتاح كخاطئ، ويمكنك حفظه والمتابعة.`,
  };
}

export function classifyKeyValidationNetworkError(
  error: unknown
): KeyValidationResponse {
  const errName = error instanceof Error ? error.name : '';
  const errMsg =
    error instanceof Error
      ? error.message.toUpperCase()
      : typeof error === 'string'
        ? error.toUpperCase()
        : '';

  const isTimeout =
    errName === 'TimeoutError' ||
    errName === 'AbortError' ||
    errMsg.includes('TIMEOUT') ||
    errMsg.includes('TIMED OUT') ||
    errMsg.includes('ETIMEDOUT') ||
    errMsg.includes('ABORT');

  if (isTimeout) {
    return {
      valid: false,
      outcome: 'unverified',
      allowSave: true,
      status: 408,
      code: 'TIMEOUT',
      message:
        'تعذّر التحقق الآن بسبب انتهاء مهلة الاتصال (رمز الخطأ: 408). يمكنك حفظ المفتاح والمتابعة.',
    };
  }

  return {
    valid: false,
    outcome: 'unverified',
    allowSave: true,
    status: null,
    code: 'NETWORK_ERROR',
    message:
      'تعذّر التحقق الآن بسبب مشكلة في الشبكة (رمز الخطأ: NETWORK). يمكنك حفظ المفتاح والمتابعة.',
  };
}
