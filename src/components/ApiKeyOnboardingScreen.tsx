import { useRef, useState } from 'react';
import type { ClipboardEvent, FormEvent } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ClipboardPaste,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Moon,
  ShieldCheck,
  Sun,
} from 'lucide-react';
import type { ThemeMode } from '../types/chat';
import {
  sanitizeApiKey,
  validateApiKeyWithServer,
} from '../utils/apiKeys';
import type { KeyValidationResult } from '../utils/apiKeys';
import { BrandLogo } from './BrandLogo';

const AI_STUDIO_KEY_URL = 'https://aistudio.google.com/apikey';

interface ApiKeyOnboardingScreenProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  defaultKeyName: string;
  currentModelId: string;
  onSaveKey: (rawKey: string, optionalName?: string) => void;
}

export function ApiKeyOnboardingScreen({
  theme,
  onToggleTheme,
  defaultKeyName,
  currentModelId,
  onSaveKey,
}: ApiKeyOnboardingScreenProps) {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [keyNameInput, setKeyNameInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validation, setValidation] = useState<KeyValidationResult | null>(null);
  const [clipboardHint, setClipboardHint] = useState<string | null>(null);
  const keyInputRef = useRef<HTMLInputElement | null>(null);

  const cleanCurrentKey = sanitizeApiKey(apiKeyInput);

  const handlePasteFromClipboard = async () => {
    setClipboardHint(null);
    setValidation(null);
    try {
      if (navigator.clipboard && typeof navigator.clipboard.readText === 'function') {
        const text = await navigator.clipboard.readText();
        const cleaned = sanitizeApiKey(text);
        if (!cleaned) {
          setClipboardHint('الحافظة فارغة. انسخ المفتاح أولاً ثم أعد المحاولة.');
          return;
        }
        setApiKeyInput(cleaned);
        keyInputRef.current?.focus();
        return;
      }
      throw new Error('Clipboard API unavailable');
    } catch {
      setClipboardHint(
        'لم يسمح المتصفح بالقراءة التلقائية من الحافظة. اضغط مطولاً داخل حقل المفتاح واختر "لصق".'
      );
      keyInputRef.current?.focus();
    }
  };

  const handleInputPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData?.getData('text');
    if (typeof pasted === 'string') {
      e.preventDefault();
      setApiKeyInput(sanitizeApiKey(pasted));
      setValidation(null);
      setClipboardHint(null);
    }
  };

  const handleValidateAndSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!cleanCurrentKey || isValidating) return;

    setIsValidating(true);
    setValidation(null);
    setClipboardHint(null);

    const result = await validateApiKeyWithServer(
      cleanCurrentKey,
      currentModelId
    );
    setValidation(result);
    setIsValidating(false);

    if (result.valid) {
      window.setTimeout(() => {
        onSaveKey(cleanCurrentKey, keyNameInput);
      }, 350);
    }
  };

  const handleSaveAnyway = () => {
    if (!cleanCurrentKey) return;
    onSaveKey(cleanCurrentKey, keyNameInput);
  };

  return (
    <div className="min-h-dvh w-full flex flex-col bg-white dark:bg-[#0E1116] text-slate-900 dark:text-slate-100">
      {/* Minimal Top Bar */}
      <header className="h-14 shrink-0 flex items-center justify-between px-4 sm:px-6 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <BrandLogo size="sm" />
          <span className="text-base font-bold text-slate-900 dark:text-slate-50">
            عبودي AI
          </span>
        </div>

        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={
            theme === 'dark'
              ? 'التبديل إلى الوضع الفاتح'
              : 'التبديل إلى الوضع الداكن'
          }
          className="inline-flex items-center justify-center gap-2 min-w-[40px] min-h-[40px] px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 transition-colors cursor-pointer"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">الوضع الفاتح</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">الوضع الداكن</span>
            </>
          )}
        </button>
      </header>

      {/* Main Centered Onboarding Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-lg">
          <div className="flex flex-col items-center text-center mb-6">
            <BrandLogo size="lg" className="mb-4" />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 [text-wrap:balance]">
              أهلاً بك في عبودي AI
            </h1>
            <p className="mt-2 text-sm sm:text-[15px] text-slate-600 dark:text-slate-400 leading-relaxed max-w-md">
              للبدء، أدخل مفتاح Gemini API الخاص بك. يُحفظ المفتاح على جهازك فقط داخل هذا المتصفح.
            </p>
          </div>

          <form
            onSubmit={handleValidateAndSave}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#141923] p-5 sm:p-6 shadow-xs space-y-4"
          >
            {/* API Key Input */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <label
                  htmlFor="onboarding-api-key"
                  className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5"
                >
                  <KeyRound className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                  <span>مفتاح Gemini API</span>
                </label>

                <button
                  type="button"
                  onClick={() => void handlePasteFromClipboard()}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/60 transition-colors cursor-pointer"
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  <span>لصق من الحافظة</span>
                </button>
              </div>

              <div dir="ltr" className="relative flex items-center">
                <input
                  ref={keyInputRef}
                  id="onboarding-api-key"
                  type={showKey ? 'text' : 'password'}
                  dir="ltr"
                  autoComplete="off"
                  spellCheck={false}
                  value={apiKeyInput}
                  onChange={(e) => {
                    setApiKeyInput(e.target.value);
                    setValidation(null);
                    setClipboardHint(null);
                  }}
                  onPaste={handleInputPaste}
                  placeholder="AQ... / AIza..."
                  className="w-full min-h-[46px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-[#0E131B] pl-3.5 pr-11 py-2.5 text-sm font-mono text-left text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-teal-600 dark:focus:border-teal-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowKey((prev) => !prev)}
                  aria-label={showKey ? 'إخفاء المفتاح' : 'إظهار المفتاح'}
                  title={showKey ? 'إخفاء المفتاح' : 'إظهار المفتاح'}
                  className="absolute right-1.5 inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  {showKey ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {clipboardHint && (
                <p className="mt-1.5 text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                  {clipboardHint}
                </p>
              )}
            </div>

            {/* Optional Key Name Input */}
            <div>
              <label
                htmlFor="onboarding-key-name"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                اسم المفتاح{' '}
                <span className="text-xs font-normal text-slate-400 dark:text-slate-500">
                  (اختياري)
                </span>
              </label>
              <input
                id="onboarding-key-name"
                type="text"
                value={keyNameInput}
                onChange={(e) => setKeyNameInput(e.target.value)}
                placeholder={`مثال: مفتاحي الرئيسي (الافتراضي: ${defaultKeyName})`}
                className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-[#0E131B] px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-teal-600 dark:focus:border-teal-500 transition-colors"
              />
            </div>

            {/* Validation Status Banner */}
            {validation && (
              <div
                role={validation.valid ? 'status' : 'alert'}
                className={`rounded-xl border px-3.5 py-3 text-xs sm:text-[13px] leading-relaxed flex items-start gap-2.5 ${
                  validation.valid
                    ? 'border-emerald-200 dark:border-emerald-900/70 bg-emerald-50/90 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
                    : validation.allowSave
                      ? 'border-amber-200 dark:border-amber-900/70 bg-amber-50/90 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200'
                      : 'border-rose-200 dark:border-rose-900/70 bg-rose-50/90 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200'
                }`}
              >
                {validation.valid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle
                    className={`w-4 h-4 shrink-0 mt-0.5 ${
                      validation.allowSave
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  />
                )}
                <div className="flex-1 min-w-0 space-y-2">
                  <p>{validation.message}</p>
                  {!validation.valid && (
                    <button
                      type="button"
                      onClick={handleSaveAnyway}
                      className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        validation.allowSave
                          ? 'bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white'
                          : 'border border-rose-300 dark:border-rose-800 bg-white dark:bg-rose-950/60 hover:bg-rose-100/70 dark:hover:bg-rose-900/50 text-rose-800 dark:text-rose-200'
                      }`}
                    >
                      {validation.allowSave
                        ? 'حفظ المفتاح والمتابعة'
                        : 'حفظ على أي حال'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!cleanCurrentKey || isValidating}
              className="w-full min-h-[46px] inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-sm font-semibold transition-colors disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 cursor-pointer disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-teal-600"
            >
              {isValidating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جارٍ التحقق من المفتاح...</span>
                </>
              ) : (
                <span>حفظ وابدأ</span>
              )}
            </button>

            {/* Arabic Guidance & Privacy Note */}
            <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800 space-y-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              <p className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0 mt-0.5" />
                <span>
                  يُحفظ مفتاحك محلياً على جهازك فقط في المتصفح، ولا يُخزّن أبداً على الخادم أو في السجلات.
                </span>
              </p>
              <p>
                ليس لديك مفتاح بعد؟ يمكنك الحصول على مفتاح مجاني خلال ثوانٍ من{' '}
                <a
                  href={AI_STUDIO_KEY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-teal-700 dark:text-teal-400 underline underline-offset-4 hover:text-teal-800 dark:hover:text-teal-300"
                >
                  <span>صفحة مفاتيح Google AI Studio</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                .
              </p>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
