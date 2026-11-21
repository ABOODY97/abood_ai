import { ArrowUpLeft, ArrowUpRight } from 'lucide-react';
import { useAssistantName } from '../hooks/useAssistantName';
import { useLanguage } from '../hooks/useLanguage';
import { BrandLogo } from './BrandLogo';

const SUGGESTION_KEYS = ['code', 'science', 'email', 'plan'] as const;

interface WelcomeScreenProps {
  onSelectPrompt: (prompt: string) => void;
}

export function WelcomeScreen({ onSelectPrompt }: WelcomeScreenProps) {
  const [assistantName] = useAssistantName();
  const { t, dir } = useLanguage();

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-10 sm:py-14">
      <div className="w-full max-w-2xl flex flex-col items-center text-center">
        <BrandLogo size="lg" className="mb-5" />

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 [text-wrap:balance]">
          {t('welcome.greeting', { name: assistantName })}
        </h1>

        <p className="mt-2.5 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-lg leading-relaxed">
          {t('welcome.subtitle')}
        </p>

        <div className="mt-8 w-full grid grid-cols-1 sm:grid-cols-2 gap-3 text-start">
          {SUGGESTION_KEYS.map((key) => {
            const title = t(`welcome.suggestions.${key}.title`);
            const subtitle = t(`welcome.suggestions.${key}.subtitle`);
            const prompt = t(`welcome.suggestions.${key}.prompt`);
            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelectPrompt(prompt)}
                className="group flex flex-col justify-between gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#141923] hover:border-teal-500/50 dark:hover:border-teal-500/40 hover:bg-slate-50/80 dark:hover:bg-[#19202D] p-4 transition-colors duration-150 text-start cursor-pointer focus-visible:outline-2 focus-visible:outline-teal-600"
              >
                <div className="flex items-start justify-between gap-2 w-full">
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                    {title}
                  </span>
                  {dir === 'rtl' ? (
                    <ArrowUpLeft className="w-4 h-4 text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 shrink-0 transition-transform duration-150 group-hover:-translate-x-0.5 group-hover:-translate-y-0.5" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  )}
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {subtitle}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
