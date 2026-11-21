import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

export function OfflineBanner() {
  const { t } = useLanguage();
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-amber-50 dark:bg-amber-950/60 border-b border-amber-200 dark:border-amber-900/70 px-4 py-2 text-xs font-medium text-amber-900 dark:text-amber-200 flex items-center justify-center gap-2"
    >
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span>{t('offline.banner')}</span>
    </div>
  );
}
