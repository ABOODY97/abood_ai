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
  images?: ImageAttachment[];
  createdAt: number;
  stopped?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export type ThemeMode = 'light' | 'dark';

export interface ChatError {
  code: string;
  message: string;
}
