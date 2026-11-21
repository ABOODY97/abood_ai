import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import {
  DEFAULT_LANGUAGE,
  getLanguageDir,
  loadSavedLanguage,
  saveLanguage,
  t as translate,
} from '../i18n';
import type {
  Language,
  TextDir,
  TranslationKey,
  TranslationParams,
} from '../i18n';

export type TranslateFn = (
  key: TranslationKey | (string & {}),
  params?: TranslationParams
) => string;

export interface LanguageContextValue {
  lang: Language;
  setLang: (next: Language) => void;
  t: TranslateFn;
  dir: TextDir;
}

const defaultTranslate: TranslateFn = (key, params) =>
  translate(DEFAULT_LANGUAGE, key, params);

export const LanguageContext = createContext<LanguageContextValue>({
  lang: DEFAULT_LANGUAGE,
  setLang: () => {},
  t: defaultTranslate,
  dir: getLanguageDir(DEFAULT_LANGUAGE),
});

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [lang, setLangState] = useState<Language>(loadSavedLanguage);
  const dir = getLanguageDir(lang);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
      document.documentElement.dir = dir;
    }
    saveLanguage(lang);
  }, [lang, dir]);

  const setLang = useCallback((next: Language) => {
    setLangState(next);
  }, []);

  const t = useCallback<TranslateFn>(
    (key, params) => translate(lang, key, params),
    [lang]
  );

  const value = useMemo<LanguageContextValue>(
    () => ({ lang, setLang, t, dir }),
    [lang, setLang, t, dir]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}
