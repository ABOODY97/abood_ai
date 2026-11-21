import type { ThinkingOption } from '../config/models.config.ts';

export interface ImageAttachment {
  id: string;
  name: string;
  mimeType: string;
  /** Raw base64 payload (without the data:image/...;base64, prefix) */
  data: string;
  /** Complete data URL for rendering thumbnail previews */
  previewUrl: string;
  size: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  /** Optional thought summary returned by thinking-capable Gemini models */
  thought?: string;
  /** Model ID and display name used to generate this assistant response */
  modelId?: string;
  modelName?: string;
  images?: ImageAttachment[];
  createdAt: number;
  stopped?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  /** Per-conversation preferred model and thinking level */
  modelId?: string;
  thinkingLevel?: ThinkingOption;
  createdAt: number;
  updatedAt: number;
}

export type ThemeMode = 'light' | 'dark';

export interface ChatError {
  code: string;
  message: string;
  status?: number;
  retryAfterSeconds?: number;
  modelName?: string;
  fallbackThinkingLevel?: ThinkingOption;
}
