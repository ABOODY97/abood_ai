import { useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useAssistantName } from '../hooks/useAssistantName';
import { useLanguage } from '../hooks/useLanguage';

export function PWAInstallButton() {
  const [assistantName] = useAssistantName();
  const { t } = useLanguage();
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
        aria-label={t('pwa.installAppAria', { name: assistantName })}
        className="w-full inline-flex items-center justify-center gap-2 min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-[#19202D] hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
      >
        <Download className="w-4 h-4 text-teal-700 dark:text-teal-400" />
        <span>{t('pwa.installButton')}</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          aria-label={t('pwa.addToHomeAria', { name: assistantName })}
          className="w-full inline-flex items-center justify-center gap-2 min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-[#19202D] hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
        >
          <Share className="w-4 h-4 text-teal-700 dark:text-teal-400" />
          <span>{t('pwa.addToHomeButton')}</span>
        </button>

        {showIOSGuide && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t('pwa.iosGuideAria')}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
            onClick={() => setShowIOSGuide(false)}
          >
            <div
              className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151A24] p-5 shadow-2xl text-start"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {t('pwa.iosGuideTitle', { name: assistantName })}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label={t('pwa.close')}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <ol className="space-y-2 text-sm text-slate-600 dark:text-slate-300 list-decimal ps-5 leading-relaxed">
                <li>
                  {t('pwa.iosStep1Before')}
                  <strong>{t('pwa.iosStep1Strong')}</strong>
                  {t('pwa.iosStep1After')}
                </li>
                <li>
                  {t('pwa.iosStep2Before')}
                  <strong>{t('pwa.iosStep2Strong')}</strong>
                  {t('pwa.iosStep2After')}
                </li>
                <li>
                  {t('pwa.iosStep3Before')}
                  <strong>{t('pwa.iosStep3Strong')}</strong>
                  {t('pwa.iosStep3After', { name: assistantName })}
                </li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full min-h-[42px] rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                {t('pwa.ok')}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
}
