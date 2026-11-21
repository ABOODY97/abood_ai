import type { ChatError } from '../types/chat';
import { DEFAULT_ASSISTANT_NAME } from './assistantName';

export function mapErrorToArabic(
  error: unknown,
  isOnline = true,
  assistantName = DEFAULT_ASSISTANT_NAME
): ChatError {
  if (!isOnline) {
    return {
      code: 'OFFLINE',
      message: 'لا يوجد اتصال بالإنترنت حالياً. يرجى التحقق من الشبكة ثم الضغط على "إعادة المحاولة".',
    };
  }

  if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
    const known = error as { code: string; message: string; status?: number };
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
        'مفتاح الـ API غير صالح أو لا يملك الصلاحيات المطلوبة. تحقق من مفتاح API في الإعدادات.',
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
      : `حدث خطأ غير متوقع أثناء الاتصال بـ ${assistantName}. يرجى الضغط على "إعادة المحاولة".`,
  };
}
