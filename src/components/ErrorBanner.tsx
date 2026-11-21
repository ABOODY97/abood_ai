import { AlertCircle, KeyRound, RotateCw, Settings, X } from 'lucide-react';
import type { ChatError } from '../types/chat';
import type { ApiKeyEntry } from '../utils/apiKeys';

interface ErrorBannerProps {
  error: ChatError;
  alternativeKeys?: ApiKeyEntry[];
  onSwitchKey?: (keyId: string) => void;
  onOpenSettings?: () => void;
  onRetry: () => void;
  onDismiss: () => void;
}

export function ErrorBanner({
  error,
  alternativeKeys = [],
  onSwitchKey,
  onOpenSettings,
  onRetry,
  onDismiss,
}: ErrorBannerProps) {
  const showRateLimitSwitchSuggestion =
    error.code === 'RATE_LIMIT' &&
    alternativeKeys.length > 0 &&
    Boolean(onSwitchKey);

  const showOpenSettings =
    (error.code === 'INVALID_API_KEY' || error.code === 'API_KEY_MISSING') &&
    Boolean(onOpenSettings);

  return (
    <div role="alert" className="mx-auto w-full max-w-3xl px-4 mb-3">
      <div className="rounded-xl border border-rose-200 dark:border-rose-900/70 bg-rose-50/90 dark:bg-rose-950/40 px-4 py-3 text-rose-900 dark:text-rose-100 space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <p className="text-sm leading-relaxed">{error.message}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            {showOpenSettings && onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-rose-300 dark:border-rose-800 bg-white dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-800 dark:text-rose-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>الإعدادات</span>
              </button>
            )}
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-rose-600"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>إعادة المحاولة</span>
            </button>
            <button
              type="button"
              onClick={onDismiss}
              aria-label="إغلاق رسالة الخطأ"
              className="p-1.5 rounded-lg text-rose-700 dark:text-rose-300 hover:bg-rose-200/60 dark:hover:bg-rose-900/50 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 429 Rate Limit 1-click switch suggestion (manual only, never auto-switches) */}
        {showRateLimitSwitchSuggestion && onSwitchKey && (
          <div className="pt-2 border-t border-rose-200/80 dark:border-rose-900/60 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-rose-800 dark:text-rose-200">
              يمكنك التبديل إلى مفتاح آخر محفوظ بضغطة واحدة:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {alternativeKeys.slice(0, 3).map((altKey) => (
                <button
                  key={altKey.id}
                  type="button"
                  onClick={() => onSwitchKey(altKey.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#19202D] border border-rose-300 dark:border-rose-800 hover:border-teal-600 dark:hover:border-teal-500 text-xs font-semibold text-slate-900 dark:text-slate-100 transition-colors whitespace-nowrap cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
                  <span>التبديل إلى {altKey.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
