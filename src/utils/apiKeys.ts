import { createId } from './conversations';
import { localizeKeyValidationResult } from './keyValidation';
import type { KeyValidationResponse } from './keyValidation';
import { DEFAULT_LANGUAGE, t } from '../i18n';
import type { Language } from '../i18n';

export const API_KEYS_STORAGE_KEY = 'aboodi_ai_api_keys_v1';

export interface ApiKeyEntry {
  id: string;
  name: string;
  key: string;
  createdAt: number;
}

export interface ApiKeyStore {
  keys: ApiKeyEntry[];
  activeKeyId: string | null;
}

export type KeyValidationResult = KeyValidationResponse;

/**
 * Cleans an API key by trimming and stripping all spaces, newlines, tabs,
 * and zero-width characters without imposing any prefix or format restrictions
 * (works equally for AQ., AIza, or any valid Gemini API key format).
 */
export function sanitizeApiKey(raw: string): string {
  return raw
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[\s\r\n]+/g, '')
    .trim();
}

/**
 * Masks an API key so only the final 4 characters are visible (e.g. ••••aLRw).
 */
export function maskApiKey(key: string): string {
  const clean = sanitizeApiKey(key);
  if (!clean) return '••••';
  if (clean.length <= 4) {
    return `••••${clean}`;
  }
  return `••••${clean.slice(-4)}`;
}

/**
 * Generates the next available sequential default key name in the active UI language.
 */
export function getNextDefaultKeyName(
  existing: ApiKeyEntry[],
  lang: Language = DEFAULT_LANGUAGE
): string {
  const usedNames = new Set(existing.map((k) => k.name.trim()));
  let index = 1;
  while (usedNames.has(t(lang, 'apiKeys.defaultKeyName', { index }))) {
    index += 1;
  }
  return t(lang, 'apiKeys.defaultKeyName', { index });
}

export function createEmptyApiKeyStore(): ApiKeyStore {
  return { keys: [], activeKeyId: null };
}

export function addApiKeyToStore(
  store: ApiKeyStore,
  rawKey: string,
  optionalName?: string,
  activate = true,
  now = Date.now(),
  lang: Language = DEFAULT_LANGUAGE
): { store: ApiKeyStore; entry: ApiKeyEntry } | null {
  const cleanKey = sanitizeApiKey(rawKey);
  if (!cleanKey) return null;

  const trimmedName = optionalName?.trim();
  const name = trimmedName || getNextDefaultKeyName(store.keys, lang);

  const entry: ApiKeyEntry = {
    id: createId('key'),
    name,
    key: cleanKey,
    createdAt: now,
  };

  const keys = [...store.keys, entry];
  const activeKeyId =
    activate || !store.activeKeyId ? entry.id : store.activeKeyId;

  return {
    store: { keys, activeKeyId },
    entry,
  };
}

export function setActiveApiKey(store: ApiKeyStore, id: string): ApiKeyStore {
  if (!store.keys.some((k) => k.id === id)) {
    return store;
  }
  return { ...store, activeKeyId: id };
}

export function renameApiKeyInStore(
  store: ApiKeyStore,
  id: string,
  newName: string
): ApiKeyStore {
  const trimmed = newName.trim();
  if (!trimmed) return store;
  return {
    ...store,
    keys: store.keys.map((k) => (k.id === id ? { ...k, name: trimmed } : k)),
  };
}

export function deleteApiKeyFromStore(
  store: ApiKeyStore,
  id: string
): ApiKeyStore {
  const keys = store.keys.filter((k) => k.id !== id);
  if (keys.length === 0) {
    return { keys: [], activeKeyId: null };
  }
  const activeKeyId =
    store.activeKeyId === id ? keys[0].id : store.activeKeyId ?? keys[0].id;
  return { keys, activeKeyId };
}

export function getActiveApiKey(store: ApiKeyStore): ApiKeyEntry | null {
  if (store.keys.length === 0) return null;
  if (store.activeKeyId) {
    const found = store.keys.find((k) => k.id === store.activeKeyId);
    if (found) return found;
  }
  return store.keys[0];
}

export function getAlternativeApiKeys(store: ApiKeyStore): ApiKeyEntry[] {
  const active = getActiveApiKey(store);
  if (!active) return [];
  return store.keys.filter((k) => k.id !== active.id);
}

export function loadApiKeyStore(): ApiKeyStore {
  if (typeof window === 'undefined') return createEmptyApiKeyStore();
  try {
    const raw = window.localStorage.getItem(API_KEYS_STORAGE_KEY);
    if (!raw) return createEmptyApiKeyStore();
    const parsed = JSON.parse(raw) as Partial<ApiKeyStore>;
    if (!parsed || !Array.isArray(parsed.keys)) {
      return createEmptyApiKeyStore();
    }
    const validKeys = parsed.keys.filter(
      (item): item is ApiKeyEntry =>
        Boolean(item) &&
        typeof item.id === 'string' &&
        typeof item.name === 'string' &&
        typeof item.key === 'string' &&
        sanitizeApiKey(item.key).length > 0
    );
    if (validKeys.length === 0) {
      return createEmptyApiKeyStore();
    }
    const activeKeyId =
      typeof parsed.activeKeyId === 'string' &&
      validKeys.some((k) => k.id === parsed.activeKeyId)
        ? parsed.activeKeyId
        : validKeys[0].id;
    return { keys: validKeys, activeKeyId };
  } catch {
    return createEmptyApiKeyStore();
  }
}

export function saveApiKeyStore(store: ApiKeyStore): void {
  if (typeof window === 'undefined') return;
  try {
    if (store.keys.length === 0) {
      window.localStorage.removeItem(API_KEYS_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(API_KEYS_STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Ignore storage write errors in restricted browsing modes
  }
}

export async function validateApiKeyWithServer(
  rawKey: string,
  modelId?: string,
  lang: Language = DEFAULT_LANGUAGE
): Promise<KeyValidationResult> {
  const cleanKey = sanitizeApiKey(rawKey);
  if (!cleanKey) {
    return localizeKeyValidationResult(
      {
        valid: false,
        outcome: 'invalid_key',
        allowSave: false,
        status: 400,
        code: 'EMPTY_KEY',
        message: t('ar', 'keyValidation.EMPTY_KEY'),
      },
      lang
    );
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return localizeKeyValidationResult(
      {
        valid: false,
        outcome: 'unverified',
        allowSave: true,
        status: null,
        code: 'OFFLINE',
        message: t('ar', 'keyValidation.OFFLINE'),
      },
      lang
    );
  }

  const controller = new AbortController();
  const timeoutId =
    typeof window !== 'undefined'
      ? window.setTimeout(() => controller.abort(), 15_000)
      : null;

  try {
    const response = await fetch('/api/validate-key', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': cleanKey,
      },
      body: JSON.stringify(modelId ? { modelId } : {}),
      signal: controller.signal,
    });

    const data = (await response.json().catch(() => null)) as
      | Partial<KeyValidationResult>
      | null;

    if (data && typeof data.valid === 'boolean') {
      const outcome =
        data.outcome ??
        (data.valid ? 'valid' : data.allowSave ? 'unverified' : 'invalid_key');
      const allowSave =
        typeof data.allowSave === 'boolean'
          ? data.allowSave
          : outcome !== 'invalid_key';
      const status =
        typeof data.status === 'number'
          ? data.status
          : response.ok
            ? null
            : response.status;

      return localizeKeyValidationResult(
        {
          valid: data.valid,
          outcome,
          allowSave,
          status,
          retryAfterSeconds:
            typeof data.retryAfterSeconds === 'number'
              ? data.retryAfterSeconds
              : undefined,
          code:
            data.code || (data.valid ? 'VALID' : `HTTP_${status ?? response.status}`),
          message: data.message || '',
        },
        lang
      );
    }

    return localizeKeyValidationResult(
      {
        valid: false,
        outcome: 'unverified',
        allowSave: true,
        status: response.status,
        code: `HTTP_${response.status}`,
        message: '',
      },
      lang
    );
  } catch (err) {
    const isTimeout = err instanceof DOMException && err.name === 'AbortError';
    if (isTimeout) {
      return localizeKeyValidationResult(
        {
          valid: false,
          outcome: 'unverified',
          allowSave: true,
          status: 408,
          code: 'TIMEOUT',
          message: '',
        },
        lang
      );
    }
    return localizeKeyValidationResult(
      {
        valid: false,
        outcome: 'unverified',
        allowSave: true,
        status: null,
        code: 'NETWORK_ERROR',
        message: '',
      },
      lang
    );
  } finally {
    if (timeoutId !== null && typeof window !== 'undefined') {
      window.clearTimeout(timeoutId);
    }
  }
}
