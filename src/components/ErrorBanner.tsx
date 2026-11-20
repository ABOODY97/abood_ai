import { AlertCircle, RotateCw, X } from 'lucide-react';
import type { ChatError } from '../types/chat';

interface ErrorBannerProps {
  error: ChatError;
  onRetry: () => void;
  onDismiss: () => void;
}

export function ErrorBanner({ error, onRetry, onDismiss }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="mx-auto w-full max-w-3xl px-4 mb-3"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-rose-200 dark:border-rose-900/70 bg-rose-50/90 dark:bg-rose-950/40 px-4 py-3 text-rose-900 dark:text-rose-100">
        <div className="flex items-start gap-2.5 min-w-0">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <p className="text-sm leading-relaxed">{error.message}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
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
    </div>
  );
}
