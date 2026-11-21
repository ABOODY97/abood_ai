import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DragEvent } from 'react';
import {
  ArrowDown,
  ImagePlus,
  Moon,
  PanelRightClose,
  PanelRightOpen,
  Settings,
  Sun,
} from 'lucide-react';
import {
  DEFAULT_MODEL_ID,
  getModelById,
  isValidModelId,
  resolveThinkingLevelForModel,
} from './config/models.config';
import type { ThinkingOption } from './config/models.config';
import type {
  ChatError,
  ChatMessage,
  Conversation,
  ImageAttachment,
  ThemeMode,
} from './types/chat';
import {
  API_KEYS_STORAGE_KEY,
  addApiKeyToStore,
  createEmptyApiKeyStore,
  deleteApiKeyFromStore,
  getActiveApiKey,
  getAlternativeApiKeys,
  getNextDefaultKeyName,
  loadApiKeyStore,
  renameApiKeyInStore,
  saveApiKeyStore,
  setActiveApiKey,
} from './utils/apiKeys';
import type { ApiKeyStore } from './utils/apiKeys';
import {
  STORAGE_KEY,
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
import { ModelThinkingPicker } from './components/ModelThinkingPicker';
import { OfflineBanner } from './components/OfflineBanner';
import { ApiKeyOnboardingScreen } from './components/ApiKeyOnboardingScreen';
import { KeyQuickSwitcher } from './components/KeyQuickSwitcher';
import { SettingsModal } from './components/SettingsModal';

const THEME_STORAGE_KEY = 'aboodi_ai_theme';
const MODEL_STORAGE_KEY = 'aboodi_ai_model';
const THINKING_STORAGE_KEY = 'aboodi_ai_thinking';

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

function getInitialModelId(): string {
  if (typeof window === 'undefined') return DEFAULT_MODEL_ID;
  try {
    const saved = window.localStorage.getItem(MODEL_STORAGE_KEY);
    if (saved && isValidModelId(saved)) return saved;
  } catch {
    // Ignore storage read errors
  }
  return DEFAULT_MODEL_ID;
}

function getInitialThinkingLevel(modelId: string): ThinkingOption {
  const model = getModelById(modelId);
  if (typeof window === 'undefined') return model.thinking.defaultLevel;
  try {
    const saved = window.localStorage.getItem(
      THINKING_STORAGE_KEY
    ) as ThinkingOption | null;
    if (saved) {
      return resolveThinkingLevelForModel(model, saved);
    }
  } catch {
    // Ignore storage read errors
  }
  return model.thinking.defaultLevel;
}

export default function App() {
  const [apiKeyStore, setApiKeyStore] = useState<ApiKeyStore>(() =>
    loadApiKeyStore()
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [forceOnboarding, setForceOnboarding] = useState(false);

  const [conversations, setConversations] = useState<Conversation[]>(() =>
    loadConversationsFromStorage()
  );
  const [activeId, setActiveId] = useState<string | null>(() => {
    const loaded = loadConversationsFromStorage();
    return loaded.length > 0 ? loaded[0].id : null;
  });

  const [defaultModelId, setDefaultModelId] = useState<string>(getInitialModelId);
  const [defaultThinkingLevel, setDefaultThinkingLevel] =
    useState<ThinkingOption>(() => getInitialThinkingLevel(getInitialModelId()));

  const [inputText, setInputText] = useState('');
  const [pendingImages, setPendingImages] = useState<ImageAttachment[]>([]);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null
  );
  const [chatError, setChatError] = useState<ChatError | null>(null);

  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<ImageAttachment | null>(
    null
  );
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

  const activeApiKey = useMemo(
    () => getActiveApiKey(apiKeyStore),
    [apiKeyStore]
  );
  const alternativeApiKeys = useMemo(
    () => getAlternativeApiKeys(apiKeyStore),
    [apiKeyStore]
  );

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId]
  );

  // Current effective model & thinking level (per-conversation or global default)
  const currentModelId = useMemo(() => {
    const candidate = activeConversation?.modelId ?? defaultModelId;
    return isValidModelId(candidate) ? candidate : DEFAULT_MODEL_ID;
  }, [activeConversation?.modelId, defaultModelId]);

  const currentThinkingLevel = useMemo(() => {
    const model = getModelById(currentModelId);
    const candidate = activeConversation?.thinkingLevel ?? defaultThinkingLevel;
    return resolveThinkingLevelForModel(model, candidate);
  }, [activeConversation?.thinkingLevel, currentModelId, defaultThinkingLevel]);

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

  // Persist default model & thinking preference in localStorage
  useEffect(() => {
    try {
      window.localStorage.setItem(MODEL_STORAGE_KEY, defaultModelId);
    } catch {
      // Ignore storage write errors
    }
  }, [defaultModelId]);

  useEffect(() => {
    try {
      window.localStorage.setItem(THINKING_STORAGE_KEY, defaultThinkingLevel);
    } catch {
      // Ignore storage write errors
    }
  }, [defaultThinkingLevel]);

  // Persist conversations to localStorage (strictly separate from API keys)
  useEffect(() => {
    saveConversationsToStorage(conversations);
  }, [conversations]);

  // Persist user API keys to localStorage under dedicated key
  useEffect(() => {
    saveApiKeyStore(apiKeyStore);
  }, [apiKeyStore]);

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

  const handleSelectModel = useCallback(
    (nextModelId: string) => {
      const nextModel = getModelById(nextModelId);
      const nextThinking = resolveThinkingLevelForModel(
        nextModel,
        currentThinkingLevel
      );

      setDefaultModelId(nextModel.id);
      setDefaultThinkingLevel(nextThinking);

      if (activeConversation) {
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === activeConversation.id
              ? {
                  ...conv,
                  modelId: nextModel.id,
                  thinkingLevel: nextThinking,
                }
              : conv
          )
        );
      }
    },
    [activeConversation, currentThinkingLevel]
  );

  const handleSelectThinking = useCallback(
    (nextLevel: ThinkingOption) => {
      const model = getModelById(currentModelId);
      const safeLevel = resolveThinkingLevelForModel(model, nextLevel);

      setDefaultThinkingLevel(safeLevel);

      if (activeConversation) {
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === activeConversation.id
              ? { ...conv, thinkingLevel: safeLevel }
              : conv
          )
        );
      }
    },
    [activeConversation, currentModelId]
  );

  const streamAssistantReply = useCallback(
    async (
      conversationId: string,
      historyToSend: ChatMessage[],
      modelIdToUse: string,
      thinkingLevelToUse: ThinkingOption,
      overrideApiKey?: string
    ) => {
      stopGeneration();
      setChatError(null);
      lastFailedRequestRef.current = {
        conversationId,
        history: historyToSend,
      };

      const selectedModel = getModelById(modelIdToUse);
      const assistantId = createId('msg');
      const now = Date.now();
      const assistantPlaceholder: ChatMessage = {
        id: assistantId,
        role: 'model',
        text: '',
        thought: '',
        modelId: selectedModel.id,
        modelName: selectedModel.name,
        createdAt: now,
      };

      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId
            ? {
                ...conv,
                modelId: selectedModel.id,
                thinkingLevel: thinkingLevelToUse,
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
      let accumulatedThought = '';

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

        const keyForRequest = overrideApiKey ?? activeApiKey?.key ?? '';
        const requestHeaders: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (keyForRequest) {
          requestHeaders['x-api-key'] = keyForRequest;
        }

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: requestHeaders,
          body: JSON.stringify({
            messages: payloadMessages,
            modelId: selectedModel.id,
            thinkingLevel: thinkingLevelToUse,
          }),
          signal: controller.signal,
        });

        const contentType = response.headers.get('content-type') || '';

        if (!response.ok) {
          if (contentType.includes('application/json')) {
            const errJson = (await response.json()) as {
              code?: string;
              message?: string;
              fallbackThinkingLevel?: ThinkingOption;
            };
            if (response.status === 401 && errJson.code === 'API_KEY_MISSING') {
              setForceOnboarding(true);
            }
            throw {
              code: errJson.code || `HTTP_${response.status}`,
              message: errJson.message || `خطأ في الخادم (${response.status})`,
              fallbackThinkingLevel: errJson.fallbackThinkingLevel,
            };
          }
          if (response.status === 401) {
            setForceOnboarding(true);
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
            if (event.type === 'meta') {
              setConversations((prev) =>
                prev.map((conv) =>
                  conv.id === conversationId
                    ? {
                        ...conv,
                        modelId: event.modelId,
                        thinkingLevel: event.thinkingLevel,
                        messages: conv.messages.map((msg) =>
                          msg.id === assistantId
                            ? {
                                ...msg,
                                modelId: event.modelId,
                                modelName: event.modelName,
                              }
                            : msg
                        ),
                      }
                    : conv
                )
              );
            } else if (event.type === 'thought') {
              accumulatedThought += event.text;
              const snapshotThought = accumulatedThought;
              setConversations((prev) =>
                prev.map((conv) =>
                  conv.id === conversationId
                    ? {
                        ...conv,
                        messages: conv.messages.map((msg) =>
                          msg.id === assistantId
                            ? { ...msg, thought: snapshotThought }
                            : msg
                        ),
                      }
                    : conv
                )
              );
            } else if (event.type === 'chunk') {
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
              throw {
                code: event.code,
                message: event.message,
                fallbackThinkingLevel: event.fallbackThinkingLevel,
              };
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

          // Automatic fallback if the model rejected the requested thinking setting
          const fallbackLevel =
            (err as { fallbackThinkingLevel?: ThinkingOption })
              ?.fallbackThinkingLevel ??
            (mapped.code === 'THINKING_CONFIG_UNSUPPORTED'
              ? selectedModel.thinking.defaultLevel
              : undefined);

          if (fallbackLevel) {
            setDefaultThinkingLevel(fallbackLevel);
            setConversations((prev) =>
              prev.map((conv) =>
                conv.id === conversationId
                  ? { ...conv, thinkingLevel: fallbackLevel }
                  : conv
              )
            );
          }

          setChatError(mapped);

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
    [activeApiKey?.key, stopGeneration]
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
        newConv.modelId = currentModelId;
        newConv.thinkingLevel = currentThinkingLevel;
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
                  modelId: currentModelId,
                  thinkingLevel: currentThinkingLevel,
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

      void streamAssistantReply(
        targetConversationId,
        nextHistory,
        currentModelId,
        currentThinkingLevel
      );
    },
    [
      activeConversation,
      currentModelId,
      currentThinkingLevel,
      inputText,
      isStreaming,
      pendingImages,
      streamAssistantReply,
    ]
  );

  const handleRegenerate = useCallback(
    (assistantMessageId: string) => {
      if (!activeConversation || isStreaming) return;
      const sliced = sliceMessagesForRegenerate(
        activeConversation.messages,
        assistantMessageId
      );
      if (!sliced) return;
      void streamAssistantReply(
        activeConversation.id,
        sliced,
        currentModelId,
        currentThinkingLevel
      );
    },
    [
      activeConversation,
      currentModelId,
      currentThinkingLevel,
      isStreaming,
      streamAssistantReply,
    ]
  );

  const handleRetry = useCallback(() => {
    if (isStreaming) return;
    const failed = lastFailedRequestRef.current;
    if (failed) {
      void streamAssistantReply(
        failed.conversationId,
        failed.history,
        currentModelId,
        currentThinkingLevel
      );
      return;
    }
    if (activeConversation && activeConversation.messages.length > 0) {
      const msgs = activeConversation.messages;
      const last = msgs[msgs.length - 1];
      if (last.role === 'user') {
        void streamAssistantReply(
          activeConversation.id,
          msgs,
          currentModelId,
          currentThinkingLevel
        );
      } else {
        const sliced = sliceMessagesForRegenerate(msgs, last.id);
        if (sliced) {
          void streamAssistantReply(
            activeConversation.id,
            sliced,
            currentModelId,
            currentThinkingLevel
          );
        }
      }
    }
  }, [
    activeConversation,
    currentModelId,
    currentThinkingLevel,
    isStreaming,
    streamAssistantReply,
  ]);

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

  // API Key Management Handlers
  const handleOnboardingSaveKey = useCallback(
    (rawKey: string, optionalName?: string) => {
      setApiKeyStore((prev) => {
        const res = addApiKeyToStore(prev, rawKey, optionalName, true);
        return res ? res.store : prev;
      });
      setForceOnboarding(false);
      setChatError(null);
    },
    []
  );

  const handleAddKey = useCallback(
    (rawKey: string, optionalName?: string, activate = true) => {
      setApiKeyStore((prev) => {
        const res = addApiKeyToStore(prev, rawKey, optionalName, activate);
        return res ? res.store : prev;
      });
      setForceOnboarding(false);
      setChatError(null);
    },
    []
  );

  const handleActivateKey = useCallback((id: string) => {
    setApiKeyStore((prev) => setActiveApiKey(prev, id));
    setChatError(null);
  }, []);

  const handleRenameKey = useCallback((id: string, newName: string) => {
    setApiKeyStore((prev) => renameApiKeyInStore(prev, id, newName));
  }, []);

  const handleDeleteKey = useCallback((id: string) => {
    setApiKeyStore((prev) => {
      const next = deleteApiKeyFromStore(prev, id);
      if (next.keys.length === 0) {
        setSettingsOpen(false);
        setChatError(null);
      }
      return next;
    });
  }, []);

  const handleSwitchKeyFromError = useCallback(
    (keyId: string) => {
      const target = apiKeyStore.keys.find((k) => k.id === keyId);
      if (!target) return;
      setApiKeyStore((prev) => setActiveApiKey(prev, keyId));
      setChatError(null);

      const failed = lastFailedRequestRef.current;
      if (failed && !isStreaming) {
        void streamAssistantReply(
          failed.conversationId,
          failed.history,
          currentModelId,
          currentThinkingLevel,
          target.key
        );
      }
    },
    [
      apiKeyStore.keys,
      currentModelId,
      currentThinkingLevel,
      isStreaming,
      streamAssistantReply,
    ]
  );

  const handleExportConversations = useCallback(() => {
    // Export strictly conversations only — never include API keys
    const payload = {
      app: 'عبودي AI',
      exportedAt: new Date().toISOString(),
      conversations,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aboodi-ai-conversations-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, [conversations]);

  const handleClearAllData = useCallback(() => {
    stopGeneration();
    setSettingsOpen(false);
    setChatError(null);
    setInputText('');
    setPendingImages([]);
    setUploadNotice(null);
    setActiveId(null);
    setConversations([]);
    setApiKeyStore(createEmptyApiKeyStore());
    setForceOnboarding(false);
    lastFailedRequestRef.current = null;
    try {
      window.localStorage.removeItem(API_KEYS_STORAGE_KEY);
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(MODEL_STORAGE_KEY);
      window.localStorage.removeItem(THINKING_STORAGE_KEY);
    } catch {
      // Ignore storage removal errors
    }
  }, [stopGeneration]);

  const hasMessages = Boolean(
    activeConversation && activeConversation.messages.length > 0
  );

  // Show onboarding screen if no API key is saved or server reported API_KEY_MISSING
  if (apiKeyStore.keys.length === 0 || forceOnboarding) {
    return (
      <ApiKeyOnboardingScreen
        theme={theme}
        onToggleTheme={toggleTheme}
        defaultKeyName={getNextDefaultKeyName(apiKeyStore.keys)}
        currentModelId={currentModelId}
        onSaveKey={handleOnboardingSaveKey}
      />
    );
  }

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
                يدعم PNG و JPG و WebP و GIF حتى 6 صور مع ضغط تلقائي
              </p>
            </div>
          </div>
        )}

        {/* Top Header */}
        <header className="relative z-20 h-14 shrink-0 flex items-center justify-between gap-2 sm:gap-3 px-3 sm:px-5 border-b border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0E1116]">
          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen((prev) => !prev)}
              aria-label={
                sidebarOpen ? 'إخفاء الشريط الجانبي' : 'إظهار الشريط الجانبي'
              }
              title={
                sidebarOpen ? 'إخفاء الشريط الجانبي' : 'إظهار الشريط الجانبي'
              }
              className="inline-flex items-center justify-center w-10 h-10 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-teal-600"
            >
              {sidebarOpen ? (
                <PanelRightClose className="w-5 h-5" />
              ) : (
                <PanelRightOpen className="w-5 h-5" />
              )}
            </button>

            <ModelThinkingPicker
              modelId={currentModelId}
              thinkingLevel={currentThinkingLevel}
              disabled={isStreaming}
              onSelectModel={handleSelectModel}
              onSelectThinking={handleSelectThinking}
            />

            <KeyQuickSwitcher
              keys={apiKeyStore.keys}
              activeKey={activeApiKey}
              disabled={isStreaming}
              onSelectKey={handleActivateKey}
              onOpenSettings={() => setSettingsOpen(true)}
            />
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              aria-label="الإعدادات"
              title="الإعدادات ومفاتيح API"
              className="inline-flex items-center justify-center w-10 h-10 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 transition-colors shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-teal-600"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={
                theme === 'dark'
                  ? 'التبديل إلى الوضع الفاتح'
                  : 'التبديل إلى الوضع الداكن'
              }
              title={theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}
              className="inline-flex items-center justify-center gap-2 min-w-[40px] min-h-[40px] px-2.5 sm:px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-teal-600"
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
          </div>
        </header>

        <OfflineBanner />

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
              className="pointer-events-auto inline-flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-[#1B222E] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 shadow-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Error Banner */}
        {chatError && (
          <ErrorBanner
            error={chatError}
            alternativeKeys={alternativeApiKeys}
            onSwitchKey={handleSwitchKeyFromError}
            onOpenSettings={() => setSettingsOpen(true)}
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

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        keys={apiKeyStore.keys}
        activeKeyId={activeApiKey?.id ?? null}
        currentModelId={currentModelId}
        onActivateKey={handleActivateKey}
        onRenameKey={handleRenameKey}
        onDeleteKey={handleDeleteKey}
        onAddKey={handleAddKey}
        onExportConversations={handleExportConversations}
        onClearAllData={handleClearAllData}
      />

      <ImageLightbox
        image={lightboxImage}
        onClose={() => setLightboxImage(null)}
      />
    </div>
  );
}
