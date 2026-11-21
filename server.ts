import 'dotenv/config';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import type { Content, Part, ThinkingConfig } from '@google/genai';
import {
  DEFAULT_MODEL_ID,
  MODELS,
  buildGeminiThinkingConfig,
  getModelById,
} from './src/config/models.config.ts';
import type {
  GeminiThinkingLevelValue,
  ModelDefinition,
  ThinkingOption,
} from './src/config/models.config.ts';
import { SlidingWindowRateLimiter } from './src/utils/rateLimit.ts';
import {
  classifyKeyValidationNetworkError,
  classifyKeyValidationResult,
} from './src/utils/keyValidation.ts';

// ============================================================================
// إعدادات النموذج الافتراضي وهوية المساعد
// لإضافة أو تعديل النماذج عدّل ملف: src/config/models.config.ts
// ============================================================================
export const MODEL_NAME = DEFAULT_MODEL_ID;

const SYSTEM_INSTRUCTION = `أنت "عبودي AI"، مساعد ذكاء اصطناعي ودود، ذكي، واضح، ومفيد في جميع المواضيع (البرمجة، العلوم، الكتابة، الترجمة، التحليل، الحياة اليومية، وفهم الصور).

القواعد الأساسية لشخصيتك:
1. قدّم نفسك دائماً باسم "عبودي AI" عند الترحيب أو عند السؤال عن اسمك أو هويتك.
2. لا تذكر اسم Gemini أو Google نهائياً في ردودك إلا إذا سألك المستخدم مباشرة وبشكل صريح عن النموذج أو التقنية المستخدمة خلفك.
3. ردّ تلقائياً بنفس لغة المستخدم (العربية، التركية، الإنجليزية، أو أي لغة أخرى يكتب بها المستخدم).
4. اجعل إجاباتك منظمة وسهلة القراءة باستخدام تنسيق Markdown (عناوين، نقاط، جداول، وأكواد منسقة مع تحديد لغة البرمجة) متى كان ذلك مناسباً.
5. كن دقيقاً وصادقاً، وإذا أرفق المستخدم صورة أو عدة صور، حلّلها بعمق وأجب على طلبه بدقة.`;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX) || 30;
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000;
const VALIDATE_RATE_LIMIT_MAX = 20;
const MAX_IMAGES_PER_MESSAGE = 6;
const MAX_TOTAL_IMAGES = 18;

const chatRateLimiter = new SlidingWindowRateLimiter(
  RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_MS
);

const validateRateLimiter = new SlidingWindowRateLimiter(
  VALIDATE_RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_MS
);

interface IncomingImage {
  mimeType: string;
  data: string;
}

interface IncomingMessage {
  role: 'user' | 'model';
  text?: string;
  images?: IncomingImage[];
}

interface ChatRequestBody {
  messages?: IncomingMessage[];
  modelId?: string;
  thinkingLevel?: ThinkingOption;
}

const PLACEHOLDER_KEYS = new Set(['MY_GEMINI_API_KEY', 'GEMINI_API_KEY', 'key']);

function cleanKeyValue(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const cleaned = raw
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[\s\r\n]+/g, '')
    .trim();
  if (!cleaned || PLACEHOLDER_KEYS.has(cleaned)) {
    return null;
  }
  return cleaned;
}

/**
 * Extracts per-request API key from the `x-api-key` header.
 * Optionally falls back to `process.env.GEMINI_API_KEY` if no user header was sent.
 * Never persists or logs the key, and never restricts key prefix (supports AQ., AIza, etc.).
 */
function resolveRequestApiKey(
  req: Request,
  allowServerFallback = true
): string | null {
  const headerVal = Array.isArray(req.headers['x-api-key'])
    ? req.headers['x-api-key'][0]
    : req.headers['x-api-key'];
  const userKey = cleanKeyValue(headerVal);
  if (userKey) {
    return userKey;
  }
  if (allowServerFallback) {
    return cleanKeyValue(process.env.GEMINI_API_KEY);
  }
  return null;
}

/**
 * Creates a fresh per-request GoogleGenAI client without storing credentials.
 * Sends the API key via `x-goog-api-key` header.
 */
function createGenAIClient(apiKey: string): GoogleGenAI {
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'x-goog-api-key': apiKey,
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * Produces a safe error message for server logs with any key-like strings redacted.
 */
function safeErrorSummary(error: unknown): string {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : 'Unknown error';
  return raw
    .replace(/AIza[0-9A-Za-z\-_]{10,}/g, '[REDACTED]')
    .replace(/AQ\.[0-9A-Za-z\-_.]{10,}/g, '[REDACTED]')
    .replace(/key=[^&\s"']+/gi, 'key=[REDACTED]')
    .slice(0, 300);
}

function mapThinkingLevelEnum(value: GeminiThinkingLevelValue): ThinkingLevel {
  switch (value) {
    case 'MINIMAL':
      return ThinkingLevel.MINIMAL;
    case 'LOW':
      return ThinkingLevel.LOW;
    case 'MEDIUM':
      return ThinkingLevel.MEDIUM;
    case 'HIGH':
      return ThinkingLevel.HIGH;
  }
}

function toSdkThinkingConfig(
  model: ModelDefinition,
  requested?: ThinkingOption
): {
  thinkingConfig?: ThinkingConfig;
  resolvedLevel: ThinkingOption;
} {
  const { config, resolvedLevel } = buildGeminiThinkingConfig(model, requested);
  if (!config) {
    return { thinkingConfig: undefined, resolvedLevel };
  }

  const sdkConfig: ThinkingConfig = {};
  if (typeof config.includeThoughts === 'boolean') {
    sdkConfig.includeThoughts = config.includeThoughts;
  }
  if (config.thinkingLevel) {
    sdkConfig.thinkingLevel = mapThinkingLevelEnum(config.thinkingLevel);
  } else if (typeof config.thinkingBudget === 'number') {
    sdkConfig.thinkingBudget = config.thinkingBudget;
  }

  return { thinkingConfig: sdkConfig, resolvedLevel };
}

function extractHttpStatus(error: unknown, rawMessage: string): number | null {
  if (error && typeof error === 'object' && 'status' in error) {
    const s = Number((error as { status?: unknown }).status);
    if (Number.isInteger(s) && s >= 100 && s <= 599) {
      return s;
    }
  }
  const match = rawMessage.match(/\b(400|401|403|404|408|429|500|502|503|504)\b/);
  return match ? Number(match[1]) : null;
}

function classifyGeminiError(
  error: unknown,
  model?: ModelDefinition
): {
  status: number;
  code: string;
  message: string;
  fallbackThinkingLevel?: ThinkingOption;
} {
  const rawMessage =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : 'حدث خطأ غير متوقع أثناء الاتصال بالخادم.';

  const upper = rawMessage.toUpperCase();
  const detectedStatus = extractHttpStatus(error, rawMessage);

  if (
    model &&
    (upper.includes('THINKING') ||
      upper.includes('THINKING_BUDGET') ||
      upper.includes('THINKING_LEVEL') ||
      upper.includes('BUDGET') ||
      (upper.includes('INVALID_ARGUMENT') && upper.includes('MINIMAL')))
  ) {
    return {
      status: 400,
      code: 'THINKING_CONFIG_UNSUPPORTED',
      message: `النموذج (${model.name}) لا يدعم مستوى التفكير المحدد حالياً (رمز الخطأ: 400). تم الرجوع تلقائياً إلى الإعداد المدعوم — اضغط "إعادة المحاولة".`,
      fallbackThinkingLevel: model.thinking.defaultLevel,
    };
  }

  if (
    upper.includes('API_KEY_INVALID') ||
    upper.includes('API KEY NOT VALID') ||
    upper.includes('INVALID API KEY') ||
    upper.includes('ACCESS_TOKEN_TYPE_UNSUPPORTED') ||
    upper.includes('PERMISSION_DENIED') ||
    upper.includes('UNAUTHENTICATED') ||
    detectedStatus === 401 ||
    detectedStatus === 403
  ) {
    const codeNum = detectedStatus ?? 401;
    return {
      status: codeNum,
      code: 'INVALID_API_KEY',
      message: `مفتاح الـ API غير صالح أو لا يملك الصلاحيات المطلوبة (رمز الخطأ: ${codeNum}). تحقق من مفتاح API في الإعدادات.`,
    };
  }

  if (
    upper.includes('RESOURCE_EXHAUSTED') ||
    upper.includes('RATE LIMIT') ||
    upper.includes('QUOTA') ||
    detectedStatus === 429
  ) {
    return {
      status: 429,
      code: 'RATE_LIMIT',
      message:
        'تم تجاوز الحد المسموح به للطلبات لهذا المفتاح (رمز الخطأ: 429). يمكنك الانتظار قليلاً أو التبديل إلى مفتاح آخر من الإعدادات.',
    };
  }

  if (upper.includes('NOT_FOUND') || detectedStatus === 404) {
    return {
      status: 404,
      code: 'MODEL_NOT_FOUND',
      message: model
        ? `النموذج المحدد (${model.name}) غير متاح حالياً لهذا المفتاح (رمز الخطأ: 404). جرّب اختيار نموذج آخر من القائمة.`
        : 'النموذج المطلوب غير متاح حالياً لهذا المفتاح (رمز الخطأ: 404).',
    };
  }

  if (
    upper.includes('FETCH FAILED') ||
    upper.includes('ENOTFOUND') ||
    upper.includes('ECONNREFUSED') ||
    upper.includes('ETIMEDOUT') ||
    upper.includes('NETWORK')
  ) {
    return {
      status: 503,
      code: 'NETWORK_ERROR',
      message:
        'تعذّر الاتصال بخدمة الذكاء الاصطناعي (رمز الخطأ: 503). يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.',
    };
  }

  if (upper.includes('SAFETY') || upper.includes('BLOCKED')) {
    return {
      status: 400,
      code: 'SAFETY_BLOCKED',
      message:
        'تعذّر إكمال هذا الرد بسبب سياسات السلامة (رمز الخطأ: 400). جرّب إعادة صياغة سؤالك.',
    };
  }

  const finalStatus = detectedStatus ?? 500;
  return {
    status: finalStatus,
    code: 'SERVER_ERROR',
    message: `حدث خطأ مؤقت أثناء توليد الرد من عبودي AI (رمز الخطأ: ${finalStatus}). يمكنك الضغط على "إعادة المحاولة".`,
  };
}

function buildGeminiContents(messages: IncomingMessage[]): {
  contents: Content[];
  error?: string;
} {
  const contents: Content[] = [];
  let totalImages = 0;

  for (const msg of messages) {
    const parts: Part[] = [];

    if (Array.isArray(msg.images)) {
      if (msg.images.length > MAX_IMAGES_PER_MESSAGE) {
        return {
          contents: [],
          error: `الحد الأقصى هو ${MAX_IMAGES_PER_MESSAGE} صور في الرسالة الواحدة.`,
        };
      }
      for (const img of msg.images) {
        if (
          img &&
          typeof img.data === 'string' &&
          typeof img.mimeType === 'string' &&
          img.mimeType.startsWith('image/') &&
          img.data.length > 0
        ) {
          totalImages += 1;
          if (totalImages > MAX_TOTAL_IMAGES) {
            break;
          }
          parts.push({
            inlineData: {
              mimeType: img.mimeType,
              data: img.data,
            },
          });
        }
      }
    }

    const trimmedText = typeof msg.text === 'string' ? msg.text.trim() : '';
    if (trimmedText.length > 0) {
      parts.push({ text: trimmedText });
    }

    if (parts.length > 0) {
      contents.push({
        role: msg.role === 'model' ? 'model' : 'user',
        parts,
      });
    }
  }

  return { contents };
}

function parseAllowedOrigins(): string[] {
  const raw = process.env.ALLOWED_ORIGINS?.trim();
  if (!raw) return [];
  return raw
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const allowedOrigins = parseAllowedOrigins();

  // Trust Render / reverse proxy X-Forwarded-For header for accurate IP rate limiting
  app.set('trust proxy', 1);

  // Security headers & strict CORS policy (explicitly permits x-api-key header)
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    const origin = req.headers.origin;
    if (origin) {
      const normalizedOrigin = origin.replace(/\/$/, '');
      const host = req.headers.host;
      const isSameHost =
        host &&
        (normalizedOrigin === `https://${host}` ||
          normalizedOrigin === `http://${host}`);
      const isExplicitlyAllowed =
        allowedOrigins.includes('*') || allowedOrigins.includes(normalizedOrigin);

      if (isSameHost || isExplicitlyAllowed) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader(
          'Access-Control-Allow-Headers',
          'Content-Type, x-api-key'
        );
      } else if (req.path.startsWith('/api/')) {
        res.status(403).json({
          code: 'CORS_FORBIDDEN',
          message: 'تم رفض الطلب من هذا النطاق لأسباب أمنية.',
        });
        return;
      }
    }

    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }

    next();
  });

  app.use(express.json({ limit: '20mb' }));

  // Handle oversized JSON/image payloads cleanly in Arabic
  app.use(
    (err: unknown, _req: Request, res: Response, next: NextFunction) => {
      if (
        err &&
        typeof err === 'object' &&
        'type' in err &&
        (err as { type?: string }).type === 'entity.too.large'
      ) {
        res.status(413).json({
          code: 'PAYLOAD_TOO_LARGE',
          message:
            'حجم الرسالة والصور المرفقة يتجاوز الحد المسموح به (20 ميجابايت). جرّب تقليل عدد الصور.',
        });
        return;
      }
      next(err);
    }
  );

  // Health check routes for Render and local diagnostics
  const healthHandler = (_req: Request, res: Response) => {
    res.status(200).json({
      ok: true,
      status: 'healthy',
      model: MODEL_NAME,
      uptime: Math.round(process.uptime()),
    });
  };
  app.get('/health', healthHandler);
  app.get('/api/health', healthHandler);

  app.get('/api/models', (_req: Request, res: Response) => {
    res.json({ defaultModelId: DEFAULT_MODEL_ID, models: MODELS });
  });

  // Lightweight real generateContent key validation endpoint (never logs or stores the key).
  // Supports any Gemini API key format (AQ., AIza, etc.) via x-goog-api-key header.
  // Returns HTTP 200 with structured validation status so upstream 401/403/429 codes are
  // surfaced clearly in UI without emitting spurious browser console resource errors.
  app.post('/api/validate-key', async (req: Request, res: Response) => {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const limitResult = validateRateLimiter.check(clientIp);
    res.setHeader('X-RateLimit-Remaining', String(limitResult.remaining));

    if (!limitResult.allowed) {
      res.setHeader('Retry-After', String(limitResult.retryAfterSeconds));
      res.status(200).json({
        valid: false,
        outcome: 'unverified',
        allowSave: true,
        status: 429,
        code: 'RATE_LIMIT',
        message: `تعذّر التحقق الآن بسبب كثرة المحاولات (رمز الخطأ: 429). انتظر ${limitResult.retryAfterSeconds} ثانية أو احفظ المفتاح والمتابعة.`,
      });
      return;
    }

    const apiKey = resolveRequestApiKey(req, false);
    if (!apiKey) {
      res.status(200).json({
        valid: false,
        outcome: 'invalid_key',
        allowSave: false,
        status: 400,
        code: 'API_KEY_MISSING',
        message: 'يرجى لصق مفتاح Gemini API قبل التحقق (رمز الخطأ: 400).',
      });
      return;
    }

    const requestedModelId = (req.body as { modelId?: string } | undefined)
      ?.modelId;
    const model = getModelById(requestedModelId);
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model.id)}:generateContent`;

    try {
      const upstreamRes = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
          'User-Agent': 'aistudio-build',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: 'hi' }],
            },
          ],
        }),
        signal: AbortSignal.timeout(12_000),
      });

      const bodyText = await upstreamRes.text().catch(() => '');
      const result = classifyKeyValidationResult(upstreamRes.status, bodyText);

      if (!result.valid) {
        console.warn(
          `[عبودي AI] Key validation returned ${result.outcome} (status=${result.status ?? 'none'}, model=${model.id})`
        );
      }

      res.status(200).json(result);
    } catch (error) {
      const result = classifyKeyValidationNetworkError(error);
      console.warn(
        `[عبودي AI] Key validation network/timeout (${result.code}): ${safeErrorSummary(error)}`
      );
      res.status(200).json(result);
    }
  });

  app.post('/api/chat', async (req: Request, res: Response) => {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const limitResult = chatRateLimiter.check(clientIp);
    res.setHeader('X-RateLimit-Remaining', String(limitResult.remaining));

    if (!limitResult.allowed) {
      res.setHeader('Retry-After', String(limitResult.retryAfterSeconds));
      res.status(429).json({
        code: 'RATE_LIMIT',
        message: `أرسلت عدداً كبيراً من الطلبات بسرعة. يرجى الانتظار ${limitResult.retryAfterSeconds} ثانية ثم المحاولة مجدداً.`,
      });
      return;
    }

    const apiKey = resolveRequestApiKey(req, true);
    if (!apiKey) {
      res.status(401).json({
        code: 'API_KEY_MISSING',
        message:
          'لم يتم تقديم مفتاح Gemini API. يرجى إدخال مفتاحك من الإعدادات أو شاشة البداية للمتابعة.',
      });
      return;
    }

    const body = req.body as ChatRequestBody;
    const messages = body?.messages;

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({
        code: 'EMPTY_REQUEST',
        message: 'يرجى كتابة رسالة أو إرفاق صورة قبل الإرسال.',
      });
      return;
    }

    const { contents, error: contentError } = buildGeminiContents(messages);
    if (contentError) {
      res.status(400).json({ code: 'INVALID_IMAGES', message: contentError });
      return;
    }
    if (contents.length === 0) {
      res.status(400).json({
        code: 'EMPTY_REQUEST',
        message: 'لا يوجد محتوى نصي أو صور صالحة للإرسال.',
      });
      return;
    }

    const model = getModelById(body.modelId);
    const { thinkingConfig, resolvedLevel } = toSdkThinkingConfig(
      model,
      body.thinkingLevel
    );

    let clientDisconnected = false;
    res.on('close', () => {
      if (!res.writableEnded) {
        clientDisconnected = true;
      }
    });

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const writeEvent = (payload: Record<string, unknown>) => {
      if (!clientDisconnected && !res.writableEnded) {
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
      }
    };

    try {
      const ai = createGenAIClient(apiKey);

      writeEvent({
        type: 'meta',
        modelId: model.id,
        modelName: model.name,
        thinkingLevel: resolvedLevel,
      });

      const stream = await ai.models.generateContentStream({
        model: model.id,
        contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          ...(thinkingConfig ? { thinkingConfig } : {}),
        },
      });

      let emittedAnyText = false;

      for await (const chunk of stream) {
        if (clientDisconnected) {
          break;
        }

        const parts = chunk.candidates?.[0]?.content?.parts;
        if (Array.isArray(parts) && parts.length > 0) {
          for (const part of parts) {
            if (typeof part.text !== 'string' || part.text.length === 0) {
              continue;
            }
            if (part.thought) {
              writeEvent({ type: 'thought', text: part.text });
            } else {
              emittedAnyText = true;
              writeEvent({ type: 'chunk', text: part.text });
            }
          }
        } else if (chunk.text) {
          emittedAnyText = true;
          writeEvent({ type: 'chunk', text: chunk.text });
        }
      }

      if (!clientDisconnected) {
        if (!emittedAnyText) {
          writeEvent({
            type: 'error',
            code: 'EMPTY_RESPONSE',
            message: 'لم يصل رد نصي من النموذج. يرجى المحاولة مرة أخرى.',
          });
        } else {
          writeEvent({ type: 'done' });
        }
      }
    } catch (error) {
      const classified = classifyGeminiError(error, model);
      console.error(
        `[عبودي AI] Gemini API Error (${classified.code}): ${safeErrorSummary(error)}`
      );
      writeEvent({
        type: 'error',
        code: classified.code,
        message: classified.message,
        ...(classified.fallbackThinkingLevel
          ? { fallbackThinkingLevel: classified.fallbackThinkingLevel }
          : {}),
      });
    } finally {
      if (!res.writableEnded) {
        res.end();
      }
    }
  });

  // Return JSON 404 for unknown API endpoints
  app.use('/api', (_req: Request, res: Response) => {
    res.status(404).json({
      code: 'NOT_FOUND',
      message: 'المسار المطلوب غير موجود.',
    });
  });

  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath, { maxAge: '7d', index: false }));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(
      `عبودي AI server running on http://0.0.0.0:${PORT} (default model: ${MODEL_NAME}, env: ${isProd ? 'production' : 'development'})`
    );
  });
}

startServer();
