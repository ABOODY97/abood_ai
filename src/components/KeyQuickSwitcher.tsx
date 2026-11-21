import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, KeyRound, Settings, X } from 'lucide-react';
import { maskApiKey } from '../utils/apiKeys';
import type { ApiKeyEntry } from '../utils/apiKeys';

interface KeyQuickSwitcherProps {
  keys: ApiKeyEntry[];
  activeKey: ApiKeyEntry | null;
  disabled?: boolean;
  onSelectKey: (id: string) => void;
  onOpenSettings: () => void;
}

export function KeyQuickSwitcher({
  keys,
  activeKey,
  disabled = false,
  onSelectKey,
  onOpenSettings,
}: KeyQuickSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 640 : false
  );
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(max-width: 639px)');
    setIsMobile(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (
        !isMobile &&
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, isMobile]);

  if (!activeKey) return null;

  const listContent = (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          التبديل السريع بين المفاتيح
        </span>
        <span className="text-[11px] text-slate-400 dark:text-slate-500 tabular-nums">
          {keys.length} {keys.length === 1 ? 'مفتاح' : 'مفاتيح'}
        </span>
      </div>

      <div role="radiogroup" aria-label="المفاتيح المحفوظة" className="space-y-1">
        {keys.map((entry) => {
          const isActive = entry.id === activeKey.id;
          return (
            <button
              key={entry.id}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => {
                onSelectKey(entry.id);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between gap-2.5 rounded-xl px-3 py-2.5 text-start transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-teal-600 ${
                isActive
                  ? 'bg-teal-50/90 dark:bg-teal-950/50 border border-teal-500/40'
                  : 'border border-transparent hover:bg-slate-100/80 dark:hover:bg-slate-800/70'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {entry.name}
                  </span>
                  {isActive && (
                    <span className="text-[11px] font-medium text-teal-700 dark:text-teal-400 shrink-0">
                      · نشط
                    </span>
                  )}
                </div>
                <span
                  dir="ltr"
                  className="inline-block text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5"
                >
                  {maskApiKey(entry.key)}
                </span>
              </div>

              <span
                className={`inline-flex items-center justify-center w-5 h-5 rounded-full shrink-0 ${
                  isActive
                    ? 'bg-teal-700 dark:bg-teal-600 text-white'
                    : 'border border-slate-300 dark:border-slate-700'
                }`}
              >
                {isActive && <Check className="w-3 h-3" />}
              </span>
            </button>
          );
        })}
      </div>

      <hr className="border-0 border-t border-slate-200/80 dark:border-slate-800 my-1" />

      <button
        type="button"
        onClick={() => {
          setIsOpen(false);
          onOpenSettings();
        }}
        className="w-full inline-flex items-center justify-center gap-2 min-h-[40px] px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
      >
        <Settings className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
        <span>إدارة المفاتيح والإعدادات</span>
      </button>
    </div>
  );

  return (
    <div ref={containerRef} className="relative min-w-0 shrink">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={`التبديل السريع لمفتاح API: ${activeKey.name}`}
        title={`المفتاح النشط: ${activeKey.name}`}
        className="inline-flex items-center gap-1 sm:gap-1.5 min-h-[40px] px-2 sm:px-3 py-1.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/80 dark:bg-[#151A24] hover:bg-slate-100 dark:hover:bg-[#1B2230] text-slate-700 dark:text-slate-200 transition-colors max-w-[92px] sm:max-w-[180px] cursor-pointer disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-teal-600"
      >
        <KeyRound className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400 shrink-0" />
        <span className="text-xs font-medium truncate">{activeKey.name}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && !isMobile && (
        <div
          role="dialog"
          aria-label="تبديل مفتاح API"
          className="absolute top-full mt-2 start-0 z-50 w-[290px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151A24] p-3.5 shadow-xl"
        >
          {listContent}
        </div>
      )}

      {isOpen &&
        isMobile &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <div
              aria-hidden="true"
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-950/50 backdrop-blur-[1px]"
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label="تبديل مفتاح API"
              className="relative z-10 w-full rounded-t-2xl border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151A24] px-4 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl max-h-[80dvh] overflow-y-auto"
            >
              <div className="mx-auto w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700 mb-3" />
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  مفاتيح API
                </h2>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="إغلاق قائمة المفاتيح"
                  className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {listContent}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
