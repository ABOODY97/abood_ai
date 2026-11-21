import { ar } from './ar.ts';
import type { Translations } from './ar.ts';
import { en } from './en.ts';
import { tr } from './tr.ts';

export type Language = 'ar' | 'en' | 'tr';
export type TextDir = 'rtl' | 'ltr';

export const DEFAULT_LANGUAGE: Language = 'ar';
export const LANGUAGE_STORAGE_KEY = 'aboodi_ai_language_v1';

export interface LanguageOption {
  code: Language;
  nativeName: string;
  dir: TextDir;
}

export const SUPPORTED_LANGUAGES: readonly LanguageOption[] = [
  { code: 'ar', nativeName: 'العربية', dir: 'rtl' },
  { code: 'en', nativeName: 'English', dir: 'ltr' },
  { code: 'tr', nativeName: 'Türkçe', dir: 'ltr' },
] as const;

type NestedKeyOf<T> = {
  [K in keyof T & string]: T[K] extends string
    ? K
    : `${K}.${NestedKeyOf<T[K]>}`;
}[keyof T & string];

export type TranslationKey = NestedKeyOf<typeof ar>;

export type TranslationParams = Record<string, string | number | undefined>;

export const DICTIONARIES: Record<Language, Translations> = {
  ar,
  en,
  tr,
};

export function isSupportedLanguage(value: unknown): value is Language {
  return value === 'ar' || value === 'en' || value === 'tr';
}

export function getLanguageDir(lang: Language): TextDir {
  return lang === 'ar' ? 'rtl' : 'ltr';
}

/**
 * Detects initial UI language from a browser locale string (e.g., navigator.language).
 * Uses 'en' for English locales, 'tr' for Turkish locales, and defaults to 'ar' otherwise.
 */
export function detectInitialLanguage(navigatorLang?: string | null): Language {
  if (typeof navigatorLang !== 'string') {
    return DEFAULT_LANGUAGE;
  }
  const normalized = navigatorLang.trim().toLowerCase();
  if (normalized.startsWith('en')) return 'en';
  if (normalized.startsWith('tr')) return 'tr';
  return DEFAULT_LANGUAGE;
}

export function loadSavedLanguage(): Language {
  if (typeof window === 'undefined') {
    return DEFAULT_LANGUAGE;
  }
  try {
    const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (isSupportedLanguage(saved)) {
      return saved;
    }
  } catch {
    // Ignore storage read errors in restricted browsing modes
  }
  const browserLang =
    typeof navigator !== 'undefined' ? navigator.language : undefined;
  return detectInitialLanguage(browserLang);
}

export function saveLanguage(lang: Language): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch {
    // Ignore storage write errors
  }
}

function lookupNested(obj: unknown, key: string): string | undefined {
  if (!obj || typeof obj !== 'object') return undefined;
  const parts = key.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (!current || typeof current !== 'object' || !(part in current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === 'string' ? current : undefined;
}

export function interpolate(
  template: string,
  params?: TranslationParams
): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, token: string) => {
    const val = params[token];
    return val !== undefined ? String(val) : match;
  });
}

/**
 * Translates a hierarchical key into the requested language.
 * Falls back to Arabic if missing in target language, then to the key itself.
 */
export function t(
  lang: Language,
  key: TranslationKey | (string & {}),
  params?: TranslationParams
): string {
  const dict = DICTIONARIES[lang] ?? DICTIONARIES.ar;
  const raw = lookupNested(dict, key) ?? lookupNested(DICTIONARIES.ar, key);
  if (raw === undefined) {
    return key;
  }
  return interpolate(raw, params);
}

export function hasTranslationKey(lang: Language, key: string): boolean {
  const dict = DICTIONARIES[lang] ?? DICTIONARIES.ar;
  return lookupNested(dict, key) !== undefined;
}

export function collectLeafKeys(
  obj: Record<string, unknown>,
  prefix = ''
): string[] {
  const keys: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string') {
      keys.push(full);
    } else if (v && typeof v === 'object') {
      keys.push(...collectLeafKeys(v as Record<string, unknown>, full));
    }
  }
  return keys;
}

export { ar, en, tr };
export type { Translations };
