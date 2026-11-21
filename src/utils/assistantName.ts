export const DEFAULT_ASSISTANT_NAME = 'عبودي AI';
export const ASSISTANT_NAME_STORAGE_KEY = 'aboodi_ai_assistant_name_v1';
export const MAX_ASSISTANT_NAME_LENGTH = 30;

const ASSISTANT_NAME_EVENT = 'aboodi-assistant-name-changed';

/**
 * Sanitizes a user-provided assistant name:
 * - Strips newlines, carriage returns, and control characters
 * - Strips any `<` or `>` characters (prevents HTML/tag or prompt-delimiter injection)
 * - Collapses repeated whitespace and trims
 * - Caps length at 30 characters
 * - Falls back to DEFAULT_ASSISTANT_NAME if empty or non-string
 */
export function sanitizeAssistantName(input: unknown): string {
  if (typeof input !== 'string') {
    return DEFAULT_ASSISTANT_NAME;
  }

  const cleaned = input
    .replace(/[\r\n]+/g, ' ')
    .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g, '')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) {
    return DEFAULT_ASSISTANT_NAME;
  }

  const capped = Array.from(cleaned)
    .slice(0, MAX_ASSISTANT_NAME_LENGTH)
    .join('')
    .trim();

  return capped.length > 0 ? capped : DEFAULT_ASSISTANT_NAME;
}

export function getAssistantName(): string {
  if (typeof window === 'undefined') {
    return DEFAULT_ASSISTANT_NAME;
  }
  try {
    const saved = window.localStorage.getItem(ASSISTANT_NAME_STORAGE_KEY);
    return sanitizeAssistantName(saved);
  } catch {
    return DEFAULT_ASSISTANT_NAME;
  }
}

export function setAssistantName(name: string): string {
  const sanitized = sanitizeAssistantName(name);
  if (typeof window === 'undefined') {
    return sanitized;
  }
  try {
    window.localStorage.setItem(ASSISTANT_NAME_STORAGE_KEY, sanitized);
  } catch {
    // Ignore storage write errors in restricted browsing modes
  }
  try {
    window.dispatchEvent(
      new CustomEvent(ASSISTANT_NAME_EVENT, { detail: sanitized })
    );
  } catch {
    // Ignore dispatch errors
  }
  return sanitized;
}

export function subscribeAssistantName(onChange: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }
  const handleCustom = () => onChange();
  const handleStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === ASSISTANT_NAME_STORAGE_KEY) {
      onChange();
    }
  };
  window.addEventListener(ASSISTANT_NAME_EVENT, handleCustom);
  window.addEventListener('storage', handleStorage);
  return () => {
    window.removeEventListener(ASSISTANT_NAME_EVENT, handleCustom);
    window.removeEventListener('storage', handleStorage);
  };
}
