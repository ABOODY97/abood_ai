import { useEffect, useRef } from 'react';
import type { ClipboardEvent, KeyboardEvent } from 'react';
import { ArrowUp, Paperclip, Square, X } from 'lucide-react';
import type { ImageAttachment } from '../types/chat';
import { detectTextDirection } from '../utils/direction';
import { useAssistantName } from '../hooks/useAssistantName';

interface ChatComposerProps {
  value: string;
  onChange: (next: string) => void;
  images: ImageAttachment[];
  onAddFiles: (files: FileList | File[]) => void;
  onRemoveImage: (id: string) => void;
  onSend: () => void;
  onStop: () => void;
  isStreaming: boolean;
  uploadNotice: string | null;
  onClearUploadNotice: () => void;
}

export function ChatComposer({
  value,
  onChange,
  images,
  onAddFiles,
  onRemoveImage,
  onSend,
  onStop,
  isStreaming,
  uploadNotice,
  onClearUploadNotice,
}: ChatComposerProps) {
  const [assistantName] = useAssistantName();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const inputDir = detectTextDirection(value);
  const canSend = !isStreaming && (value.trim().length > 0 || images.length > 0);

  // Auto-resize textarea up to 180px
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const nextHeight = Math.min(el.scrollHeight, 180);
    el.style.height = `${Math.max(nextHeight, 28)}px`;
  }, [value]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (canSend) {
        onSend();
      }
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const pastedImages: File[] = [];
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) pastedImages.push(file);
      }
    }
    if (pastedImages.length > 0) {
      e.preventDefault();
      onAddFiles(pastedImages);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-3 sm:px-4 pb-[calc(0.85rem+env(safe-area-inset-bottom))] pt-1">
      {uploadNotice && (
        <div
          role="status"
          className="mb-2 flex items-center justify-between gap-2 rounded-xl border border-amber-200 dark:border-amber-900/70 bg-amber-50 dark:bg-amber-950/40 px-3.5 py-2 text-xs text-amber-900 dark:text-amber-200"
        >
          <span>{uploadNotice}</span>
          <button
            type="button"
            onClick={onClearUploadNotice}
            aria-label="إغلاق التنبيه"
            className="p-1 rounded-md hover:bg-amber-200/50 dark:hover:bg-amber-900/40 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-[#151A24] shadow-sm focus-within:border-teal-600/70 dark:focus-within:border-teal-500/70 transition-colors">
        {images.length > 0 && (
          <div
            aria-label="الصور المرفقة قبل الإرسال"
            className="flex flex-wrap items-center gap-2.5 px-3.5 pt-3 pb-1"
          >
            {images.map((img) => (
              <div
                key={img.id}
                className="relative group w-16 h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 shrink-0"
              >
                <img
                  src={img.previewUrl}
                  alt={img.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => onRemoveImage(img.id)}
                  aria-label={`إزالة الصورة ${img.name}`}
                  className="absolute top-1 end-1 w-5 h-5 rounded-full bg-slate-900/80 hover:bg-rose-600 text-white flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2 p-2.5 sm:p-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                onAddFiles(e.target.files);
              }
              e.target.value = '';
            }}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isStreaming}
            aria-label="إرفاق صور"
            title="إرفاق صور من المعرض أو الكاميرا (أو السحب والإفلات / اللصق)"
            className="inline-flex items-center justify-center w-11 h-11 sm:w-10 sm:h-10 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-40 transition-colors shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-teal-600"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          <textarea
            ref={textareaRef}
            rows={1}
            dir={inputDir}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={`اسأل ${assistantName} أي شيء...`}
            aria-label="حقل كتابة الرسالة"
            className="flex-1 resize-none bg-transparent border-0 py-2.5 sm:py-2 px-1 text-[16px] sm:text-[15.5px] leading-relaxed text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none max-h-[180px] overflow-y-auto"
          />

          {isStreaming ? (
            <button
              type="button"
              onClick={onStop}
              aria-label="إيقاف التوليد"
              title="إيقاف التوليد"
              className="inline-flex items-center justify-center gap-1.5 h-11 sm:h-10 px-3.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white text-xs font-semibold transition-colors shrink-0 whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-teal-600"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">إيقاف التوليد</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onSend}
              disabled={!canSend}
              aria-label="إرسال الرسالة"
              title="إرسال (Enter)"
              className="inline-flex items-center justify-center w-11 h-11 sm:w-10 sm:h-10 rounded-xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 transition-colors shrink-0 cursor-pointer disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-teal-600"
            >
              <ArrowUp className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <p className="mt-2 text-center text-[11.5px] text-slate-400 dark:text-slate-500">
        اضغط Enter للإرسال · Shift+Enter لسطر جديد · قد يخطئ الذكاء الاصطناعي أحياناً، تحقق من المعلومات المهمة.
      </p>
    </div>
  );
}
