import { useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export function PWAInstallButton() {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        aria-label="تثبيت تطبيق عبودي AI"
        className="w-full inline-flex items-center justify-center gap-2 min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-[#19202D] hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
      >
        <Download className="w-4 h-4 text-teal-700 dark:text-teal-400" />
        <span>تثبيت التطبيق على جهازك</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          aria-label="إضافة عبودي AI إلى الشاشة الرئيسية"
          className="w-full inline-flex items-center justify-center gap-2 min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-[#19202D] hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
        >
          <Share className="w-4 h-4 text-teal-700 dark:text-teal-400" />
          <span>إضافة للشاشة الرئيسية</span>
        </button>

        {showIOSGuide && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="طريقة التثبيت على iPhone وiPad"
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
            onClick={() => setShowIOSGuide(false)}
          >
            <div
              className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151A24] p-5 shadow-2xl text-start"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  تثبيت عبودي AI على iOS
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label="إغلاق"
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <ol className="space-y-2 text-sm text-slate-600 dark:text-slate-300 list-decimal ps-5 leading-relaxed">
                <li>
                  اضغط على زر <strong>المشاركة (Share)</strong> في شريط متصفح Safari.
                </li>
                <li>
                  مرّر للأسفل واختر <strong>إضافة إلى الشاشة الرئيسية (Add to Home Screen)</strong>.
                </li>
                <li>
                  اضغط <strong>إضافة</strong> ليظهر عبودي AI كتطبيق مستقل.
                </li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full min-h-[42px] rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                حسناً
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
}
