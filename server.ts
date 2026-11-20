import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import type { Content, Part } from '@google/genai';

// ============================================================================
// إعدادات النموذج وهوية المساعد — لتغيير النموذج عدّل هذا الثابت فقط
// ============================================================================
export const MODEL_NAME = 'gemini-4-hydrogen';

const SYSTEM_INSTRUCTION = `أنت "عبودي AI"، مساعد ذكاء اصطناعي ودود، ذكي، واضح، ومفيد في جميع المواضيع (البرمجة، العلوم، الكتابة، الترجمة، التحليل، الحياة اليومية، وفهم الصور).

القواعد الأساسية لشخصيتك:
1. قدّم نفسك دائماً باسم "عبودي AI" عند الترحيب أو عند السؤال عن اسمك أو هويتك.
2. لا تذكر اسم Gemini أو Google نهائياً في ردودك إلا إذا سألك المستخدم مباشرة وبشكل صريح عن النموذج أو التقنية المستخدمة خلفك.
3. ردّ تلقائياً بنفس لغة المستخدم (العربية، التركية، الإنجليزية، أو أي لغة أخرى يكتب بها المستخدم).
4. اجعل إجاباتك منظمة وسهلة القراءة باستخدام تنسيق Markdown (عناوين، نقاط، جداول، وأكواد منسقة مع تحديد لغة البرمجة) متى كان ذلك مناسباً.
5. كن دقيقاً وصادقاً، وإذا أرفق المستخدم صورة أو عدة صور، حلّلها بعمق وأجب على طلبه بدقة.`;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
}

function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'key') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function classifyGeminiError(error: unknown): {
  status: number;
  code: string;
  message: string;
} {
  const rawMessage =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : 'حدث خطأ غير متوقع أثناء الاتصال بالخادم.';

  const upper = rawMessage.toUpperCase();

  if (
    upper.includes('API_KEY_INVALID') ||
    upper.includes('API KEY NOT VALID') ||
    upper.includes('PERMISSION_DENIED') ||
    upper.includes('UNAUTHENTICATED') ||
    upper.includes('401') ||
    upper.includes('403')
  ) {
    return {
      status: 401,
      code: 'INVALID_API_KEY',
      message:
        'مفتاح الـ API غير صالح أو لا يملك الصلاحيات المطلوبة. يرجى التحقق من متغير البيئة GEMINI_API_KEY في إعدادات الأسرار (Settings > Secrets).',
    };
  }

  if (
    upper.includes('RESOURCE_EXHAUSTED') ||
    upper.includes('RATE LIMIT') ||
    upper.includes('QUOTA') ||
    upper.includes('429')
  ) {
    return {
      status: 429,
      code: 'RATE_LIMIT',
      message:
        'تم تجاوز الحد المسموح به للطلبات حالياً (Rate Limit / Quota). يرجى الانتظار لحظات ثم المحاولة مرة أخرى.',
    };
  }

  if (upper.includes('NOT_FOUND') || upper.includes('404')) {
    return {
      status: 404,
      code: 'MODEL_NOT_FOUND',
      message: `النموذج المحدد (${MODEL_NAME}) غير متاح حالياً. يرجى مراجعة قيمة MODEL_NAME في أعلى ملف الخادم.`,
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
        'تعذّر الاتصال بخدمة الذكاء الاصطناعي. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.',
    };
  }

  if (upper.includes('SAFETY') || upper.includes('BLOCKED')) {
    return {
      status: 400,
      code: 'SAFETY_BLOCKED',
      message: 'تعذّر إكمال هذا الرد بسبب سياسات السلامة. جرّب إعادة صياغة سؤالك.',
    };
  }

  return {
    status: 500,
    code: 'SERVER_ERROR',
    message:
      'حدث خطأ مؤقت أثناء توليد الرد من عبودي AI. يمكنك الضغط على "إعادة المحاولة".',
  };
}

function buildGeminiContents(messages: IncomingMessage[]): Content[] {
  const contents: Content[] = [];

  for (const msg of messages) {
    const parts: Part[] = [];

    if (Array.isArray(msg.images)) {
      for (const img of msg.images) {
        if (img && typeof img.data === 'string' && typeof img.mimeType === 'string' && img.data.length > 0) {
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

  return contents;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '30mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true, model: MODEL_NAME });
  });

  app.post('/api/chat', async (req: Request, res: Response) => {
    const body = req.body as ChatRequestBody;
    const messages = body?.messages;

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({
        code: 'EMPTY_REQUEST',
        message: 'يرجى كتابة رسالة أو إرفاق صورة قبل الإرسال.',
      });
      return;
    }

    const ai = getGenAIClient();
    if (!ai) {
      res.status(401).json({
        code: 'API_KEY_MISSING',
        message:
          'لم يتم العثور على مفتاح GEMINI_API_KEY في متغيرات البيئة. يرجى إضافته في إعدادات الأسرار (Settings > Secrets) ثم إعادة المحاولة.',
      });
      return;
    }

    const contents = buildGeminiContents(messages);
    if (contents.length === 0) {
      res.status(400).json({
        code: 'EMPTY_REQUEST',
        message: 'لا يوجد محتوى نصي أو صور صالحة للإرسال.',
      });
      return;
    }

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
      const stream = await ai.models.generateContentStream({
        model: MODEL_NAME,
        contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        },
      });

      let emittedAnyText = false;

      for await (const chunk of stream) {
        if (clientDisconnected) {
          break;
        }
        const chunkText = chunk.text;
        if (chunkText) {
          emittedAnyText = true;
          writeEvent({ type: 'chunk', text: chunkText });
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
      const classified = classifyGeminiError(error);
      console.error('[عبودي AI] Gemini API Error:', classified.code, error);
      writeEvent({
        type: 'error',
        code: classified.code,
        message: classified.message,
      });
    } finally {
      if (!res.writableEnded) {
        res.end();
      }
    }
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
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`عبودي AI server running on http://localhost:${PORT} (model: ${MODEL_NAME})`);
  });
}

startServer();
