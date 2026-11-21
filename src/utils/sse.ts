import type { ThinkingOption } from '../config/models.config';

export type SseChatEvent =
  | { type: 'meta'; modelId: string; modelName: string; thinkingLevel: ThinkingOption }
  | { type: 'thought'; text: string }
  | { type: 'chunk'; text: string }
  | { type: 'done' }
  | {
      type: 'error';
      code: string;
      message: string;
      fallbackThinkingLevel?: ThinkingOption;
    };

/**
 * Incrementally parses Server-Sent Events (SSE) lines from a stream buffer.
 * Returns parsed events and the leftover incomplete trailing buffer.
 */
export function parseSseBuffer(buffer: string): {
  events: SseChatEvent[];
  remainder: string;
} {
  const normalized = buffer.replace(/\r\n/g, '\n');
  const blocks = normalized.split('\n\n');
  const remainder = blocks.pop() ?? '';
  const events: SseChatEvent[] = [];

  for (const block of blocks) {
    const lines = block.split('\n');
    const dataLines: string[] = [];

    for (const line of lines) {
      if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).trimStart());
      }
    }

    if (dataLines.length === 0) continue;
    const rawJson = dataLines.join('\n').trim();
    if (!rawJson) continue;

    try {
      const parsed = JSON.parse(rawJson) as Record<string, unknown>;
      if (parsed.type === 'chunk' && typeof parsed.text === 'string') {
        events.push({ type: 'chunk', text: parsed.text });
      } else if (parsed.type === 'thought' && typeof parsed.text === 'string') {
        events.push({ type: 'thought', text: parsed.text });
      } else if (
        parsed.type === 'meta' &&
        typeof parsed.modelId === 'string' &&
        typeof parsed.modelName === 'string' &&
        typeof parsed.thinkingLevel === 'string'
      ) {
        events.push({
          type: 'meta',
          modelId: parsed.modelId,
          modelName: parsed.modelName,
          thinkingLevel: parsed.thinkingLevel as ThinkingOption,
        });
      } else if (parsed.type === 'done') {
        events.push({ type: 'done' });
      } else if (
        parsed.type === 'error' &&
        typeof parsed.message === 'string'
      ) {
        events.push({
          type: 'error',
          code: typeof parsed.code === 'string' ? parsed.code : 'SERVER_ERROR',
          message: parsed.message,
          fallbackThinkingLevel:
            typeof parsed.fallbackThinkingLevel === 'string'
              ? (parsed.fallbackThinkingLevel as ThinkingOption)
              : undefined,
        });
      }
    } catch {
      // Ignore malformed SSE comment/keepalive frames
    }
  }

  return { events, remainder };
}
