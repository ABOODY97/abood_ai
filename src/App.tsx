import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DragEvent } from 'react';
import {
  ArrowDown,
  ImagePlus,
  Moon,
  PanelRightClose,
  PanelRightOpen,
  Sun,
} from 'lucide-react';
import type {
  ChatError,
  ChatMessage,
  Conversation,
  ImageAttachment,
  ThemeMode,
} from './types/chat';
import {
  createConversation,
  createId,
  deleteConversationList,
  generateConversationTitle,
  loadConversationsFromStorage,
  renameConversationList,
  saveConversationsToStorage,
  sliceMessagesForRegenerate,
} from './utils/conversations';
import { mapErrorToArabic } from './utils/errors';
import { processImageFiles } from './utils/imageFiles';
import { parseSseBuffer } from './utils/sse';
import { Sidebar } from './components/Sidebar';
import { WelcomeScreen } from './components/WelcomeScreen';
import { MessageBubble } from './components/MessageBubble';
import { ChatComposer } from './components/ChatComposer';
import { ErrorBanner } from './components/ErrorBanner';
import { ImageLightbox } from './components/ImageLightbox';

const THEME_STORAGE_KEY = 'aboodi_ai_theme';

function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  } catch {
    // Ignore storage read errors
  }
  return 'light';
}

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>(() =>
    loadConversationsFromStorage()
  );
  const [activeId, setActiveId] = useState<string | null>(() => {
    const loaded = loadConversationsFromStorage();
    return loaded.length > 0 ? loaded[0].id : null;
  });

  const [inputText, setInputText] = useState('');
  const [pendingImages, setPendingImages] = useState<ImageAttachment[]>([]);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [chatError, setChatError] = useState<ChatError | null>(null);

  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<ImageAttachment | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const bottomAnchorRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScrollRef = useRef(true);
  const dragDepthRef = useRef(0);
  const lastFailedRequestRef = useRef<{
    conversationId: string;
    history: ChatMessage[];
  } | null>(null);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId]
  );

  // Sync theme to <html class="dark"> and localStorage
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage write errors
    }
  }, [theme]);

  // Persist conversations to localStorage
  useEffect(() => {
    saveConversationsToStorage(conversations);
  }, [conversations]);

  // Sync sidebar open state cleanly when crossing the desktop/mobile breakpoint
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(min-width: 1024px)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSidebarOpen(e.matches);
    };
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    bottomAnchorRef.current?.scrollIntoView({ behavior, block: 'end' });
  }, []);

  // Auto-scroll when messages grow if user hasn't manually scrolled up
  useEffect(() => {
    if (shouldAutoScrollRef.current) {
      scrollToBottom(isStreaming ? 'auto' : 'smooth');
    }
  }, [activeConversation?.messages, isStreaming, scrollToBottom]);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const isNearBottom = distanceFromBottom < 120;
    shouldAutoScrollRef.current = isNearBottom;
    setShowScrollBottom(!isNearBottom);
  };

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const streamAssistantReply = useCallback(
    async (conversationId: string, historyToSend: ChatMessage[]) => {
      stopGeneration();
      setChatError(null);
      lastFailedRequestRef.current = {
        conversationId,
        history: historyToSend,
      };

      const assistantId = createId('msg');
      const now = Date.now();
      const assistantPlaceholder: ChatMessage = {
        id: assistantId,
        role: 'model',
        text: '',
        createdAt: now,
      };

      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId
            ? {
                ...conv,
                messages: [...historyToSend, assistantPlaceholder],
                updatedAt: now,
              }
            : conv
        )
      );

      setIsStreaming(true);
      setStreamingMessageId(assistantId);
      shouldAutoScrollRef.current = true;

      const controller = new AbortController();
      abortControllerRef.current = controller;

      let accumulatedText = '';

      try {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          throw mapErrorToArabic(new Error('offline'), false);
        }

        const payloadMessages = historyToSend.map((m) => ({
          role: m.role,
          text: m.text,
          images: m.images?.map((img) => ({
            mimeType: img.mimeType,
            data: img.data,
          })),
        }));

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: payloadMessages }),
          signal: controller.signal,
        });

        const contentType = response.headers.get('content-type') || '';

        if (!response.ok) {
          if (contentType.includes('application/json')) {
            const errJson = (await response.json()) as {
              code?: string;
              message?: string;
            };
            throw {
              code: errJson.code || `HTTP_${response.status}`,
              message: errJson.message || `خطأ في الخادم (${response.status})`,
            };
          }
          throw new Error(`HTTP ${response.status}`);
        }

        if (!response.body) {
          throw new Error('لم يتم فتح قناة البث من الخادم.');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let sseBuffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          sseBuffer += decoder.decode(value, { stream: true });
          const { events, remainder } = parseSseBuffer(sseBuffer);
          sseBuffer = remainder;

          for (const event of events) {
            if (event.type === 'chunk') {
              accumulatedText += event.text;
              const snapshotText = accumulatedText;
              setConversations((prev) =>
                prev.map((conv) =>
                  conv.id === conversationId
                    ? {
                        ...conv,
                        updatedAt: Date.now(),
                        messages: conv.messages.map((msg) =>
                          msg.id === assistantId
                            ? { ...msg, text: snapshotText }
                            : msg
                        ),
                      }
                    : conv
                )
              );
            } else if (event.type === 'error') {
              throw { code: event.code, message: event.message };
            }
          }
        }

        if (accumulatedText.trim().length === 0) {
          throw {
            code: 'EMPTY_RESPONSE',
            message: 'لم يصل رد من عبودي AI. يرجى الضغط على "إعادة المحاولة".',
          };
        }

        lastFailedRequestRef.current = null;
      } catch (err) {
        const isAbort =
          err instanceof DOMException && err.name === 'AbortError';

        if (isAbort) {
          // User clicked "إيقاف التوليد"
          setConversations((prev) =>
            prev.map((conv) => {
              if (conv.id !== conversationId) return conv;
              const nextMessages =
                accumulatedText.trim().length === 0
                  ? conv.messages.filter((m) => m.id !== assistantId)
                  : conv.messages.map((m) =>
                      m.id === assistantId ? { ...m, stopped: true } : m
                    );
              return { ...conv, messages: nextMessages };
            })
          );
        } else {
          const mapped = mapErrorToArabic(
            err,
            typeof navigator === 'undefined' ? true : navigator.onLine
          );
          setChatError(mapped);

          // Remove empty assistant placeholder on failure while keeping partial output if any arrived
          setConversations((prev) =>
            prev.map((conv) => {
              if (conv.id !== conversationId) return conv;
              if (accumulatedText.trim().length === 0) {
                return {
                  ...conv,
                  messages: conv.messages.filter((m) => m.id !== assistantId),
                };
              }
              return conv;
            })
          );
        }
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
        setIsStreaming(false);
        setStreamingMessageId(null);
      }
    },
    [stopGeneration]
  );

  const sendMessage = useCallback(
    (overrideText?: string) => {
      if (isStreaming) return;

      const textToSend = (overrideText ?? inputText).trim();
      const imagesToSend = overrideText ? [] : pendingImages;

      if (!textToSend && imagesToSend.length === 0) return;

      const now = Date.now();
      const userMessage: ChatMessage = {
        id: createId('msg'),
        role: 'user',
        text: textToSend,
        images: imagesToSend.length > 0 ? imagesToSend : undefined,
        createdAt: now,
      };

      let targetConversationId = activeConversation?.id ?? null;
      let nextHistory: ChatMessage[] = [];

      if (!targetConversationId) {
        const newConv = createConversation(
          generateConversationTitle(textToSend, imagesToSend.length > 0),
          now
        );
        newConv.messages = [userMessage];
        targetConversationId = newConv.id;
        nextHistory = [userMessage];

        setConversations((prev) => [newConv, ...prev]);
        setActiveId(newConv.id);
      } else {
        const existing = activeConversation!;
        const isFirstMessage = existing.messages.length === 0;
        const updatedTitle = isFirstMessage
          ? generateConversationTitle(textToSend, imagesToSend.length > 0)
          : existing.title;
        nextHistory = [...existing.messages, userMessage];

        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === targetConversationId
              ? {
                  ...conv,
                  title: updatedTitle,
                  messages: nextHistory,
                  updatedAt: now,
                }
              : conv
          )
        );
      }

      if (!overrideText) {
        setInputText('');
        setPendingImages([]);
        setUploadNotice(null);
      }

      void streamAssistantReply(targetConversationId, nextHistory);
    },
    [activeConversation, inputText, isStreaming, pendingImages, streamAssistantReply]
  );

  const handleRegenerate = useCallback(
    (assistantMessageId: string) => {
      if (!activeConversation || isStreaming) return;
      const sliced = sliceMessagesForRegenerate(
        activeConversation.messages,
        assistantMessageId
      );
      if (!sliced) return;
      void streamAssistantReply(activeConversation.id, sliced);
    },
    [activeConversation, isStreaming, streamAssistantReply]
  );

  const handleRetry = useCallback(() => {
    if (isStreaming) return;
    const failed = lastFailedRequestRef.current;
    if (failed) {
      void streamAssistantReply(failed.conversationId, failed.history);
      return;
    }
    if (activeConversation && activeConversation.messages.length > 0) {
      const msgs = activeConversation.messages;
      const last = msgs[msgs.length - 1];
      if (last.role === 'user') {
        void streamAssistantReply(activeConversation.id, msgs);
      } else {
        const sliced = sliceMessagesForRegenerate(msgs, last.id);
        if (sliced) void streamAssistantReply(activeConversation.id, sliced);
      }
    }
  }, [activeConversation, isStreaming, streamAssistantReply]);

  const handleAddFiles = useCallback(
    async (files: FileList | File[]) => {
      const result = await processImageFiles(files, pendingImages.length);
      if (result.added.length > 0) {
        setPendingImages((prev) => [...prev, ...result.added]);
      }
      if (result.error) {
        setUploadNotice(result.error);
      } else {
        setUploadNotice(null);
      }
    },
    [pendingImages.length]
  );

  const handleRemoveImage = useCallback((id: string) => {
    setPendingImages((prev) => prev.filter((img) => img.id !== id));
  }, []);

  const handleNewChat = useCallback(() => {
    stopGeneration();
    setChatError(null);
    setActiveId(null);
    setInputText('');
    setPendingImages([]);
    setUploadNotice(null);
  }, [stopGeneration]);

  const handleSelectChat = useCallback(
    (id: string) => {
      if (id === activeId) return;
      stopGeneration();
      setChatError(null);
      setActiveId(id);
      shouldAutoScrollRef.current = true;
    },
    [activeId, stopGeneration]
  );

  const handleRenameChat = useCallback((id: string, newTitle: string) => {
    setConversations((prev) => renameConversationList(prev, id, newTitle));
  }, []);

  const handleDeleteChat = useCallback(
    (id: string) => {
      if (id === activeId) {
        stopGeneration();
        setChatError(null);
      }
      setConversations((prev) => {
        const next = deleteConversationList(prev, id);
        if (id === activeId) {
          setActiveId(next.length > 0 ? next[0].id : null);
        }
        return next;
      });
    },
    [activeId, stopGeneration]
  );

  // Drag-and-drop handlers across the entire main chat area
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    if (!e.dataTransfer.types.includes('Files')) return;
    e.preventDefault();
    dragDepthRef.current += 1;
    setIsDraggingFiles(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    if (!e.dataTransfer.types.includes('Files')) return;
    e.preventDefault();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) {
      setIsDraggingFiles(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    if (!e.dataTransfer.types.includes('Files')) return;
    e.preventDefault();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragDepthRef.current = 0;
    setIsDraggingFiles(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      void handleAddFiles(e.dataTransfer.files);
    }
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const hasMessages = Boolean(
    activeConversation && activeConversation.messages.length > 0
  );

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-white dark:bg-[#0E1116] text-slate-900 dark:text-slate-100">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        isOpen={sidebarOpen}
        onCloseMobile={() => {
          if (window.innerWidth < 1024) setSidebarOpen(false);
        }}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onRenameChat={handleRenameChat}
        onDeleteChat={handleDeleteChat}
      />

      <div
        className="relative flex-1 flex flex-col min-w-0 h-full"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Drag-and-drop overlay */}
        {isDraggingFiles && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-teal-950/15 dark:bg-teal-950/40 backdrop-blur-[2px] p-6 pointer-events-none">
            <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-teal-600 dark:border-teal-400 bg-white/95 dark:bg-[#141A24]/95 px-10 py-8 shadow-xl">
              <ImagePlus className="w-10 h-10 text-teal-700 dark:text-teal-400" />
              <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                أفلت الصور هنا لإرفاقها بالرسالة
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                يدعم PNG و JPG و WebP و GIF حتى 6 صور في الرسالة
              </p>
            </div>
          </div>
        )}

        {/* Top Header */}
        <header className="h-14 shrink-0 flex items-center justify-between gap-4 px-3 sm:px-5 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-[#0E1116]/90 backdrop-blur-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen((prev) => !prev)}
              aria-label={sidebarOpen ? 'إخفاء الشريط الجانبي' : 'إظهار الشريط الجانبي'}
              title={sidebarOpen ? 'إخفاء الشريط الجانبي' : 'إظهار الشريط الجانبي'}
              className="inline-flex items-center justify-center w-10 h-10 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-teal-600"
            >
              {sidebarOpen ? (
                <PanelRightClose className="w-5 h-5" />
              ) : (
                <PanelRightOpen className="w-5 h-5" />
              )}
            </button>

            <span className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 truncate">
              {activeConversation ? activeConversation.title : 'عبودي AI'}
            </span>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الداكن'}
            title={theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-teal-600"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">الوضع الفاتح</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-slate-600" />
                <span className="hidden sm:inline">الوضع الداكن</span>
              </>
            )}
          </button>
        </header>

        {/* Main Chat Scroll Viewport */}
        <main
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto flex flex-col"
        >
          {!hasMessages ? (
            <WelcomeScreen onSelectPrompt={(prompt) => sendMessage(prompt)} />
          ) : (
            <div
              data-testid="messages-list"
              className="w-full max-w-3xl mx-auto px-3 sm:px-5 py-6 space-y-6 flex-1"
            >
              {activeConversation!.messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isStreaming={isStreaming && msg.id === streamingMessageId}
                  onRegenerate={
                    msg.role === 'model' ? handleRegenerate : undefined
                  }
                  onPreviewImage={setLightboxImage}
                />
              ))}
              <div ref={bottomAnchorRef} className="h-2" />
            </div>
          )}
        </main>

        {/* Scroll to bottom button */}
        {hasMessages && showScrollBottom && (
          <div className="pointer-events-none absolute bottom-32 inset-x-0 flex justify-center z-20">
            <button
              type="button"
              onClick={() => {
                shouldAutoScrollRef.current = true;
                scrollToBottom('smooth');
              }}
              aria-label="الانتقال إلى أحدث رسالة"
              className="pointer-events-auto inline-flex items-center justify-center w-9 h-9 rounded-full bg-white dark:bg-[#1B222E] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 shadow-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Error Banner */}
        {chatError && (
          <ErrorBanner
            error={chatError}
            onRetry={handleRetry}
            onDismiss={() => setChatError(null)}
          />
        )}

        {/* Bottom Composer */}
        <ChatComposer
          value={inputText}
          onChange={setInputText}
          images={pendingImages}
          onAddFiles={(files) => void handleAddFiles(files)}
          onRemoveImage={handleRemoveImage}
          onSend={() => sendMessage()}
          onStop={stopGeneration}
          isStreaming={isStreaming}
          uploadNotice={uploadNotice}
          onClearUploadNotice={() => setUploadNotice(null)}
        />
      </div>

      <ImageLightbox
        image={lightboxImage}
        onClose={() => setLightboxImage(null)}
      />
    </div>
  );
}
