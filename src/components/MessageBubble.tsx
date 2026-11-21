import { useState } from 'react';
import { Brain, Check, ChevronDown, Copy, RotateCw } from 'lucide-react';
import type { ChatMessage, ImageAttachment } from '../types/chat';
import { detectTextDirection } from '../utils/direction';
import { useAssistantName } from '../hooks/useAssistantName';
import { BrandLogo } from './BrandLogo';
import { MarkdownRenderer } from './MarkdownRenderer';

interface MessageBubbleProps {
  message: ChatMessage;
  isStreaming: boolean;
  onRegenerate?: (messageId: string) => void;
  onPreviewImage: (image: ImageAttachment) => void;
}

export function MessageBubble({
  message,
  isStreaming,
  onRegenerate,
  onPreviewImage,
}: MessageBubbleProps) {
  const [assistantName] = useAssistantName();
  const [copied, setCopied] = useState(false);
  const [thoughtOpen, setThoughtOpen] = useState(false);

  const isUser = message.role === 'user';
  const dir = detectTextDirection(message.text);
  const thoughtDir = detectTextDirection(message.thought ?? '');
  const hasThought = Boolean(message.thought && message.thought.trim().length > 0);
  const isWaitingForFirstToken =
    !isUser && isStreaming && message.text.length === 0;
  const isActivelyThinking = isWaitingForFirstToken && hasThought;

  const handleCopyMessage = async () => {
    if (!message.text) return;
    try {
      await navigator.clipboard.writeText(message.text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      const el = document.createElement('textarea');
      el.value = message.text;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }
  };

  if (isUser) {
    return (
      <article aria-label="رسالة المستخدم" className="flex justify-end w-full">
        <div className="max-w-[88%] sm:max-w-[78%] flex flex-col items-end gap-2">
          <div className="rounded-2xl rounded-tl-md bg-teal-50/90 dark:bg-[#192430] border border-teal-200/70 dark:border-teal-800/50 px-4 py-3 text-slate-900 dark:text-slate-100">
            {message.images && message.images.length > 0 && (
              <div
                className={`grid gap-2 ${message.text ? 'mb-2.5' : ''} ${
                  message.images.length === 1
                    ? 'grid-cols-1'
                    : message.images.length === 2
                      ? 'grid-cols-2'
                      : 'grid-cols-2 sm:grid-cols-3'
                }`}
              >
                {message.images.map((img) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => onPreviewImage(img)}
                    aria-label={`عرض الصورة ${img.name}`}
                    className="group relative overflow-hidden rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 cursor-pointer focus-visible:outline-2 focus-visible:outline-teal-600"
                  >
                    <img
                      src={img.previewUrl}
                      alt={img.name}
                      referrerPolicy="no-referrer"
                      className="max-h-56 w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                    />
                  </button>
                ))}
              </div>
            )}

            {message.text && (
              <p
                dir={dir}
                className="whitespace-pre-wrap break-words text-[15.5px] leading-[1.7] text-start"
              >
                {message.text}
              </p>
            )}
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      aria-label={`رد ${assistantName}`}
      className="flex items-start gap-3 sm:gap-4 w-full"
    >
      <BrandLogo size="sm" className="mt-0.5" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {assistantName}
          </span>
          {message.stopped && !isStreaming && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              · تم إيقاف التوليد
            </span>
          )}
        </div>

        {/* Collapsible Thought Summary (collapsed by default) */}
        {hasThought && (
          <div className="mb-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/75 dark:bg-[#111620] overflow-hidden">
            <button
              type="button"
              onClick={() => setThoughtOpen((prev) => !prev)}
              aria-expanded={thoughtOpen}
              className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-teal-600"
            >
              <span className="inline-flex items-center gap-2">
                <Brain className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400 shrink-0" />
                <span>
                  {isActivelyThinking ? 'عرض التفكير (جارٍ التفكير...)' : 'عرض التفكير'}
                </span>
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
                  thoughtOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {thoughtOpen && (
              <div
                dir={thoughtDir}
                className="px-3.5 pb-3 pt-1 border-t border-slate-200/70 dark:border-slate-800/80 text-xs sm:text-[13px] leading-relaxed text-slate-600 dark:text-slate-400 whitespace-pre-wrap break-words text-start"
              >
                {message.thought}
              </div>
            )}
          </div>
        )}

        <div className="rounded-2xl rounded-tr-md bg-white dark:bg-[#131720] border border-slate-200/75 dark:border-slate-800/90 px-4 py-3.5 sm:px-5 sm:py-4">
          {isWaitingForFirstToken ? (
            <div
              role="status"
              aria-live="polite"
              className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300 py-0.5"
            >
              <span>
                {isActivelyThinking
                  ? `${assistantName} يفكر`
                  : `${assistantName} يكتب`}
              </span>
              <span
                className="inline-flex items-center gap-1"
                aria-hidden="true"
              >
                <span className="typing-dot w-1.5 h-1.5 rounded-full bg-teal-600 dark:bg-teal-400" />
                <span className="typing-dot w-1.5 h-1.5 rounded-full bg-teal-600 dark:bg-teal-400" />
                <span className="typing-dot w-1.5 h-1.5 rounded-full bg-teal-600 dark:bg-teal-400" />
              </span>
            </div>
          ) : (
            <div dir={dir} className="text-start">
              <MarkdownRenderer content={message.text} />
              {isStreaming && (
                <span
                  aria-hidden="true"
                  className="inline-block w-2 h-4 align-middle bg-teal-600 dark:bg-teal-400 rounded-xs ms-1 opacity-75"
                />
              )}
            </div>
          )}
        </div>

        {!isStreaming && message.text.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleCopyMessage}
                aria-label={`نسخ رد ${assistantName}`}
                className="inline-flex items-center gap-1.5 min-h-[34px] px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-teal-600"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span>تم النسخ</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>نسخ</span>
                  </>
                )}
              </button>

              {onRegenerate && (
                <button
                  type="button"
                  onClick={() => onRegenerate(message.id)}
                  aria-label="إعادة توليد الرد"
                  className="inline-flex items-center gap-1.5 min-h-[34px] px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-teal-600"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>إعادة التوليد</span>
                </button>
              )}
            </div>

            {message.modelName && (
              <span className="text-[11.5px] text-slate-400 dark:text-slate-500 px-1 select-none">
                {message.modelName}
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
