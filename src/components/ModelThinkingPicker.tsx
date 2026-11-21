import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Brain, Check, ChevronDown, Info, SlidersHorizontal, X } from 'lucide-react';
import {
  MODELS,
  THINKING_LABELS,
  getModelById,
  resolveThinkingLevelForModel,
} from '../config/models.config';
import type { ThinkingOption } from '../config/models.config';

const FREE_KEY_TIP_DISMISSED_KEY = 'aboodi_ai_free_key_tip_dismissed_v1';
const FLASH_LITE_MODEL_ID = 'gemini-3.1-flash-lite';

function readFreeTipDismissed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(FREE_KEY_TIP_DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
}

interface ModelThinkingPickerProps {
  modelId: string;
  thinkingLevel: ThinkingOption;
  disabled?: boolean;
  onSelectModel: (modelId: string) => void;
  onSelectThinking: (level: ThinkingOption) => void;
}

export function ModelThinkingPicker({
  modelId,
  thinkingLevel,
  disabled = false,
  onSelectModel,
  onSelectThinking,
}: ModelThinkingPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [freeTipDismissed, setFreeTipDismissed] = useState<boolean>(
    readFreeTipDismissed
  );
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 640 : false
  );
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleDismissFreeTip = () => {
    setFreeTipDismissed(true);
    try {
      window.localStorage.setItem(FREE_KEY_TIP_DISMISSED_KEY, '1');
    } catch {
      // Ignore storage write errors
    }
  };

  const activeModel = getModelById(modelId);
  const effectiveThinking = resolveThinkingLevelForModel(
    activeModel,
    thinkingLevel
  );
  const thinkingSupported = activeModel.thinking.mode !== 'none';

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(max-width: 639px)');
    setIsMobile(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Close on Escape or outside click (desktop)
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

  const panelContent = (
    <div className="flex flex-col gap-4">
      {/* Section 1: Model Selection */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            اختر النموذج
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            يدعم النصوص والصور
          </span>
        </div>

        <div
          role="radiogroup"
          aria-label="اختيار النموذج"
          className="space-y-1.5"
        >
          {MODELS.map((model) => {
            const isSelected = model.id === activeModel.id;
            return (
              <button
                key={model.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => onSelectModel(model.id)}
                className={`w-full flex items-start justify-between gap-3 rounded-xl px-3 py-2.5 text-start transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-teal-600 ${
                  isSelected
                    ? 'bg-teal-50/90 dark:bg-teal-950/50 border border-teal-500/40 dark:border-teal-500/40'
                    : 'bg-transparent hover:bg-slate-100/80 dark:hover:bg-slate-800/70 border border-transparent'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {model.name}
                    </span>
                    <span
                      aria-hidden="true"
                      className="text-slate-300 dark:text-slate-600"
                    >
                      ·
                    </span>
                    <span className="text-xs font-medium text-teal-700 dark:text-teal-400">
                      {model.shortTag}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {model.description}
                  </p>
                </div>

                <span
                  className={`mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full shrink-0 ${
                    isSelected
                      ? 'bg-teal-700 dark:bg-teal-600 text-white'
                      : 'border border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3" />}
                </span>
              </button>
            );
          })}
        </div>

        {/* Free API key recommendation banner (dismissible, persisted in localStorage) */}
        {!freeTipDismissed && (
          <div className="mt-2.5 rounded-xl border border-amber-200/90 dark:border-amber-900/60 bg-amber-50/75 dark:bg-amber-950/30 px-3 py-2.5 text-xs text-amber-950 dark:text-amber-200">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 min-w-0">
                <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  إذا كان مفتاحك مجانيًا فالأفضل استخدام Gemini Flash-Lite، فهو أسرع وأقل عرضة لأخطاء الازدحام وحدود الاستخدام.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDismissFreeTip}
                aria-label="إغلاق توصية المفاتيح المجانية"
                title="إغلاق"
                className="p-1 rounded-md text-amber-700 dark:text-amber-300 hover:bg-amber-200/60 dark:hover:bg-amber-900/50 transition-colors shrink-0 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="mt-2 ps-5">
              <button
                type="button"
                onClick={() => onSelectModel(FLASH_LITE_MODEL_ID)}
                className="inline-flex items-center px-2.5 py-1 rounded-lg bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-[11.5px] font-semibold transition-colors cursor-pointer"
              >
                استخدم Flash-Lite
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Hairline divider */}
      <hr className="border-0 border-t border-slate-200/80 dark:border-slate-800" />

      {/* Section 2: Thinking Level */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <Brain className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              مستوى التفكير
            </span>
          </div>
          {thinkingSupported && (
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              {activeModel.thinking.mode === 'level'
                ? 'تحكم بالمستوى'
                : 'تحكم بميزانية التفكير'}
            </span>
          )}
        </div>

        {!thinkingSupported ? (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-3 py-2.5 text-xs text-slate-500 dark:text-slate-400">
            {activeModel.thinking.unsupportedReason ||
              'هذا النموذج لا يدعم التفكير العميق.'}
          </div>
        ) : (
          <>
            <div
              role="radiogroup"
              aria-label="مستوى التفكير"
              className="grid gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#0F131B]"
              style={{
                gridTemplateColumns: `repeat(${activeModel.thinking.supportedLevels.length}, minmax(0, 1fr))`,
              }}
            >
              {activeModel.thinking.supportedLevels.map((level) => {
                const isSelected = effectiveThinking === level;
                return (
                  <button
                    key={level}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => onSelectThinking(level)}
                    className={`min-h-[40px] px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-teal-600 ${
                      isSelected
                        ? 'bg-white dark:bg-[#1E2635] text-teal-800 dark:text-teal-300 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    {THINKING_LABELS[level]}
                  </button>
                );
              })}
            </div>

            <p className="mt-2 text-[11.5px] text-slate-500 dark:text-slate-400 leading-relaxed">
              {!activeModel.thinking.canDisable
                ? 'هذا النموذج يستخدم التفكير دائماً؛ اختر "تلقائي" أو "منخفض" لسرعة أكبر.'
                : effectiveThinking === 'none'
                  ? 'التفكير متوقف للحصول على أسرع استجابة ممكنة.'
                  : 'سيظهر ملخص التفكير (إن توفر) داخل قسم قابل للطي فوق الرد.'}
            </p>
          </>
        )}
      </div>
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
        aria-label="اختيار النموذج ومستوى التفكير"
        className="inline-flex items-center gap-1.5 sm:gap-2 min-h-[40px] px-2 sm:px-3 py-1.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/80 dark:bg-[#151A24] hover:bg-slate-100 dark:hover:bg-[#1B2230] text-slate-800 dark:text-slate-100 transition-colors max-w-[126px] sm:max-w-[320px] cursor-pointer disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-teal-600"
      >
        <SlidersHorizontal className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400 shrink-0" />
        <span className="text-xs sm:text-[13px] font-semibold truncate">
          {activeModel.name}
        </span>
        {thinkingSupported && (
          <>
            <span
              aria-hidden="true"
              className="hidden sm:inline text-slate-300 dark:text-slate-600"
            >
              ·
            </span>
            <span className="hidden sm:inline text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap shrink-0">
              {THINKING_LABELS[effectiveThinking]}
            </span>
          </>
        )}
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Desktop Dropdown */}
      {isOpen && !isMobile && (
        <div
          role="dialog"
          aria-label="إعدادات النموذج ومستوى التفكير"
          className="absolute top-full mt-2 start-0 z-50 w-[370px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151A24] p-4 shadow-xl"
        >
          {panelContent}
        </div>
      )}

      {/* Mobile Bottom Sheet rendered into document.body via Portal */}
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
              aria-label="إعدادات النموذج ومستوى التفكير"
              className="relative z-10 w-full rounded-t-2xl border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151A24] px-4 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl max-h-[85dvh] overflow-y-auto"
            >
              <div className="mx-auto w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700 mb-3" />
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  النموذج ومستوى التفكير
                </h2>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="إغلاق إعدادات النموذج"
                  className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {panelContent}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
