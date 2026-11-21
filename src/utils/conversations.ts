import type { ChatMessage, Conversation } from '../types/chat';
import { DEFAULT_LANGUAGE, t } from '../i18n';
import type { Language } from '../i18n';

export const STORAGE_KEY = 'aboodi_ai_conversations_v1';

export function createId(prefix = 'id'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export function generateConversationTitle(
  text: string,
  hasImages = false,
  lang: Language = DEFAULT_LANGUAGE
): string {
  const cleaned = text
    .replace(/\s+/g, ' ')
    .replace(/[#*_`~]/g, '')
    .trim();

  if (!cleaned) {
    return hasImages
      ? t(lang, 'conversations.imageAnalysisTitle')
      : t(lang, 'conversations.defaultTitle');
  }

  if (cleaned.length <= 42) {
    return cleaned;
  }

  return `${cleaned.slice(0, 42).trim()}…`;
}

export function createConversation(
  initialTitle?: string,
  now = Date.now(),
  lang: Language = DEFAULT_LANGUAGE
): Conversation {
  return {
    id: createId('conv'),
    title: initialTitle ?? t(lang, 'conversations.defaultTitle'),
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function renameConversationList(
  conversations: Conversation[],
  id: string,
  newTitle: string,
  now = Date.now()
): Conversation[] {
  const trimmed = newTitle.trim();
  if (!trimmed) return conversations;
  return conversations.map((conv) =>
    conv.id === id ? { ...conv, title: trimmed, updatedAt: now } : conv
  );
}

export function deleteConversationList(
  conversations: Conversation[],
  id: string
): Conversation[] {
  return conversations.filter((conv) => conv.id !== id);
}

/**
 * Prepares conversation history for regenerating a specific assistant message:
 * returns the messages strictly before that assistant message (ending with the
 * preceding user message).
 */
export function sliceMessagesForRegenerate(
  messages: ChatMessage[],
  assistantMessageId: string
): ChatMessage[] | null {
  const idx = messages.findIndex((m) => m.id === assistantMessageId);
  if (idx <= 0 || messages[idx]?.role !== 'model') {
    return null;
  }
  const sliced = messages.slice(0, idx);
  if (sliced.length === 0 || sliced[sliced.length - 1].role !== 'user') {
    return null;
  }
  return sliced;
}

export type DateGroupKey = 'today' | 'yesterday' | 'last7Days' | 'older';

export interface ConversationGroup {
  key: DateGroupKey;
  label: string;
  items: Conversation[];
}

export function groupConversationsByDate(
  conversations: Conversation[],
  now = Date.now(),
  lang: Language = DEFAULT_LANGUAGE
): ConversationGroup[] {
  const sorted = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const todayMs = startOfToday.getTime();
  const yesterdayMs = todayMs - 24 * 60 * 60 * 1000;
  const lastWeekMs = todayMs - 7 * 24 * 60 * 60 * 1000;

  const today: Conversation[] = [];
  const yesterday: Conversation[] = [];
  const lastWeek: Conversation[] = [];
  const older: Conversation[] = [];

  for (const conv of sorted) {
    if (conv.updatedAt >= todayMs) {
      today.push(conv);
    } else if (conv.updatedAt >= yesterdayMs) {
      yesterday.push(conv);
    } else if (conv.updatedAt >= lastWeekMs) {
      lastWeek.push(conv);
    } else {
      older.push(conv);
    }
  }

  const groups: ConversationGroup[] = [];
  if (today.length > 0) {
    groups.push({ key: 'today', label: t(lang, 'sidebar.dateGroups.today'), items: today });
  }
  if (yesterday.length > 0) {
    groups.push({ key: 'yesterday', label: t(lang, 'sidebar.dateGroups.yesterday'), items: yesterday });
  }
  if (lastWeek.length > 0) {
    groups.push({ key: 'last7Days', label: t(lang, 'sidebar.dateGroups.last7Days'), items: lastWeek });
  }
  if (older.length > 0) {
    groups.push({ key: 'older', label: t(lang, 'sidebar.dateGroups.older'), items: older });
  }

  return groups;
}

export function loadConversationsFromStorage(): Conversation[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is Conversation =>
        item &&
        typeof item.id === 'string' &&
        typeof item.title === 'string' &&
        Array.isArray(item.messages)
    );
  } catch {
    return [];
  }
}

export function saveConversationsToStorage(conversations: Conversation[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  } catch {
    // Fallback if base64 images exceed localStorage ~5MB quota:
    // keep text history and trim heavy image payloads from older messages.
    try {
      const compact = conversations.map((conv, convIdx) => ({
        ...conv,
        messages: conv.messages.map((msg) => ({
          ...msg,
          images: convIdx === 0 ? msg.images : undefined,
        })),
      }));
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(compact));
    } catch {
      const textOnly = conversations.map((conv) => ({
        ...conv,
        messages: conv.messages.map((msg) => ({ ...msg, images: undefined })),
      }));
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(textOnly));
      } catch {
        // Ignore storage errors if private mode blocks storage completely
      }
    }
  }
}
