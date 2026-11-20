import type { ChatError } from '../types/chat';

export function mapErrorToArabic(error: unknown, isOnline = true): ChatError {
  if (!isOnline) {
    return {
      code: 'OFFLINE',
      message: 'لا يوجد اتصال بالإنترنت حالياً. يرجى التحقق من الشبكة ثم الضغط على "إعادة المحاولة".',
    };
  }

  if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
    const known = error as { code: string; message: string };
    if (typeof known.code === 'string' && typeof known.message === 'string') {
      return known;
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
      message: 'تم إيقاف توليد الرد.',
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
      message: 'انقطع الاتصال بالخادم. تأكد من اتصالك بالإنترنت ثم حاول مرة أخرى.',
    };
  }

  if (
    upper.includes('API_KEY') ||
    upper.includes('401') ||
    upper.includes('403') ||
    upper.includes('PERMISSION_DENIED')
  ) {
    return {
      code: 'INVALID_API_KEY',
      message:
        'مفتاح الـ API غير صحيح أو غير مضبوط. تأكد من قيمة GEMINI_API_KEY في إعدادات البيئة.',
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
      message: 'تم تجاوز الحد المسموح به للطلبات مؤقتاً. انتظر قليلاً ثم أعد المحاولة.',
    };
  }

  if (upper.includes('413') || upper.includes('PAYLOAD TOO LARGE')) {
    return {
      code: 'PAYLOAD_TOO_LARGE',
      message: 'حجم الصور المرفقة كبير جداً. جرّب تقليل عدد الصور أو حجمها ثم أعد الإرسال.',
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: raw && /[\u0600-\u06FF]/.test(raw)
      ? raw
      : 'حدث خطأ غير متوقع أثناء الاتصال بعبودي AI. يرجى الضغط على "إعادة المحاولة".',
  };
}
