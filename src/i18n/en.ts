import type { Translations } from './ar';

export const en: Translations = {
  app: {
    title: '{name} — Your AI Chat Assistant',
    switchToLight: 'Switch to light mode',
    switchToDark: 'Switch to dark mode',
    lightMode: 'Light mode',
    darkMode: 'Dark mode',
    settingsAria: 'Settings',
    settingsTitle: 'Settings & API keys',
    showSidebar: 'Show sidebar',
    hideSidebar: 'Hide sidebar',
    scrollToBottom: 'Scroll to latest message',
    dragDropTitle: 'Drop images here to attach them',
    dragDropHint: 'Supports PNG, JPG, WebP, and GIF up to 6 images with auto-compression',
  },
  onboarding: {
    welcome: 'Welcome to {name}',
    subtitle:
      'Enter your Gemini API key to get started. Your key is stored locally in this browser only.',
    apiKeyLabel: 'Gemini API Key',
    pasteFromClipboard: 'Paste from clipboard',
    showKey: 'Show key',
    hideKey: 'Hide key',
    keyNameLabel: 'Key name',
    optional: '(optional)',
    keyNamePlaceholder: 'e.g. Primary key (default: {defaultName})',
    validating: 'Checking API key...',
    saveAndStart: 'Save & Start',
    saveAndContinue: 'Save key & continue',
    saveAnyway: 'Save anyway',
    privacyNote:
      'Your key stays locally on this device in your browser and is never stored on the server or in logs.',
    noKeyPrefix: "Don't have a key yet? Get a free key in seconds from",
    aiStudioLink: 'Google AI Studio API Keys',
    freeKeyTip:
      'Using a free API key? Gemini Flash-Lite is recommended—it is faster and less likely to hit rate limits or congestion errors.',
    clipboardEmpty: 'Clipboard is empty. Copy your key first and try again.',
    clipboardBlocked:
      'Browser blocked automatic clipboard access. Paste your key directly into the field.',
    languageAria: 'Change interface language',
  },
  sidebar: {
    ariaLabel: 'Conversation history',
    closeSidebar: 'Close sidebar',
    newChat: 'New chat',
    emptyHistory:
      'No conversations yet. Start asking a question and your chats will be saved here automatically.',
    renameInputAria: 'New conversation title',
    saveNewName: 'Save title',
    cancelRename: 'Cancel rename',
    deleteConfirm: 'Delete this chat?',
    confirmDeleteAria: 'Confirm deleting conversation {title}',
    delete: 'Delete',
    cancel: 'Cancel',
    cancelDeleteAria: 'Cancel deletion',
    rename: 'Rename',
    renameAria: 'Rename {title}',
    deleteAria: 'Delete {title}',
    dateGroups: {
      today: 'Today',
      yesterday: 'Yesterday',
      last7Days: 'Last 7 days',
      older: 'Older',
    },
  },
  welcome: {
    greeting: 'Welcome to {name}',
    subtitle:
      'Ask anything, attach images for analysis, or start with one of these quick ideas.',
    suggestions: {
      code: {
        title: 'Write clean, structured code',
        subtitle: 'A Python function to analyze data and format results in a table',
        prompt:
          'Write a Python function to analyze a list of student grades, compute the average and highest score, and include a brief explanation with a formatted output table.',
      },
      science: {
        title: 'Simplify a complex topic',
        subtitle: 'How neural networks work explained clearly with everyday examples',
        prompt:
          'Explain how neural networks in AI work in simple, clear terms with an everyday real-world example.',
      },
      email: {
        title: 'Draft a polished email',
        subtitle: 'A concise, persuasive professional message ready to send',
        prompt:
          'Help me write a concise, confident professional email applying for a Frontend Developer role.',
      },
      plan: {
        title: 'Create a practical study plan',
        subtitle: 'A weekly roadmap to learn a new skill from scratch',
        prompt:
          'Create a practical 4-week learning plan to master TypeScript fundamentals and build a small project, organized as a weekly table.',
      },
    },
  },
  composer: {
    closeNotice: 'Dismiss notice',
    attachedImagesAria: 'Attached images ready to send',
    removeImageAria: 'Remove image {name}',
    attachImages: 'Attach images',
    attachImagesTitle: 'Attach images (or drag & drop / paste)',
    placeholder: 'Ask {name} anything...',
    inputAria: 'Message input',
    stopGeneration: 'Stop',
    sendMessage: 'Send message',
    sendTitle: 'Send (Enter)',
    footerHint:
      'Press Enter to send · Shift+Enter for a new line · AI can make mistakes, so double-check important info.',
  },
  message: {
    userMessageAria: 'User message',
    viewImageAria: 'View image {name}',
    assistantReplyAria: '{name} reply',
    stoppedGeneration: '· Stopped',
    showThinking: 'Show thinking',
    showThinkingActive: 'Show thinking (thinking...)',
    thinking: '{name} is thinking',
    typing: '{name} is typing',
    copyReplyAria: 'Copy {name} reply',
    copied: 'Copied',
    copy: 'Copy',
    regenerateAria: 'Regenerate response',
    regenerate: 'Regenerate',
    copyCodeAria: 'Copy {lang} code',
  },
  lightbox: {
    previewAria: 'Image preview {name}',
    closeAria: 'Close image preview',
  },
  offline: {
    banner:
      'You are currently offline — you can browse your saved conversations only.',
  },
  pwa: {
    installAppAria: 'Install {name} app',
    installButton: 'Install app on your device',
    addToHomeAria: 'Add {name} to Home Screen',
    addToHomeButton: 'Add to Home Screen',
    iosGuideAria: 'How to install on iPhone and iPad',
    iosGuideTitle: 'Install {name} on iOS',
    close: 'Close',
    iosStep1Before: 'Tap the ',
    iosStep1Strong: 'Share',
    iosStep1After: ' button in Safari.',
    iosStep2Before: 'Scroll down and tap ',
    iosStep2Strong: 'Add to Home Screen',
    iosStep2After: '.',
    iosStep3Before: 'Tap ',
    iosStep3Strong: 'Add',
    iosStep3After: ' to launch {name} like a native app.',
    ok: 'Got it',
  },
  modelPicker: {
    triggerAria: 'Select model and thinking level',
    dialogAria: 'Model and thinking settings',
    mobileTitle: 'Model & Thinking Level',
    closeAria: 'Close model settings',
    chooseModel: 'Choose a model',
    supportsTextAndImages: 'Text & images',
    modelSelectionAria: 'Model selection',
    freeKeyTip:
      'Using a free API key? Gemini Flash-Lite is recommended—it is faster and less likely to hit rate limits or congestion errors.',
    dismissTipAria: 'Dismiss free API key tip',
    dismissTipTitle: 'Dismiss',
    useFlashLite: 'Use Flash-Lite',
    thinkingLevel: 'Thinking level',
    thinkingLevelAria: 'Thinking level',
    modeLevel: 'Level control',
    modeBudget: 'Thinking budget',
    unsupportedDefault: 'This model does not support deep thinking.',
    hintAlwaysOn:
      'This model always uses thinking; pick "Auto" or "Low" for faster replies.',
    hintOff: 'Thinking is off for the fastest possible response.',
    hintCollapsible:
      'A collapsible thinking summary (when available) appears above the reply.',
  },
  models: {
    gemini4Hydrogen: {
      shortTag: 'Fast & balanced',
      description:
        'Great default choice for everyday chat, coding, and fast image analysis.',
    },
    gemini31FlashLite: {
      shortTag: 'Ultra fast',
      description:
        'Lightweight with instant responses for quick questions, translation, and summaries—with thinking toggle.',
    },
    gemini25Flash: {
      shortTag: 'Flexible thinking',
      description:
        'Stable Flash model supporting full thinking budget control from Off to deep reasoning.',
    },
    gemini25Pro: {
      shortTag: 'Best for reasoning',
      description:
        'Highest accuracy for complex reasoning, advanced coding, math, and detailed image analysis.',
    },
    thinkingLabels: {
      none: 'Off',
      auto: 'Auto',
      low: 'Low',
      medium: 'Medium',
      high: 'High',
    },
  },
  keySwitcher: {
    quickSwitchTitle: 'Quick key switcher',
    keyCountSingle: '{count} key',
    keyCountPlural: '{count} keys',
    savedKeysAria: 'Saved API keys',
    activeTag: '· Active',
    manageKeysAndSettings: 'Manage keys & settings',
    triggerAria: 'Quick switch API key: {name}',
    triggerTitle: 'Active key: {name}',
    dialogAria: 'Switch API key',
    mobileTitle: 'API Keys',
    closeAria: 'Close key switcher',
  },
  settings: {
    dialogAria: 'Settings and API key management',
    title: 'Settings · API Keys',
    closeAria: 'Close settings',
    languageSectionAria: 'Select interface language',
    assistantNameSectionAria: 'Customize assistant name',
    assistantNameLabel: 'Assistant name',
    resetDefaultName: 'Reset to default',
    assistantNameNote:
      'Saved in this browser only (up to {max} characters).',
    securityWarning:
      'Your key is stored in this browser only. Do not use your personal key on a public or shared device.',
    securityRevokeBefore: 'If you think your key was exposed, revoke it in',
    securityRevokeAfter: 'and create a new one.',
    savedKeysSectionAria: 'Saved API keys list',
    savedKeysTitle: 'Saved keys',
    addNewKey: 'Add new key',
    addNewKeyFormTitle: 'Add a new Gemini API key',
    cancelAddKeyAria: 'Cancel adding key',
    keyLabel: 'API key',
    pasteFromClipboard: 'Paste from clipboard',
    showNewKeyAria: 'Show new key',
    hideNewKeyAria: 'Hide new key',
    clipboardEmpty: 'Clipboard is empty. Copy the key first.',
    clipboardBlocked:
      'Browser blocked automatic clipboard access. Paste the key directly into the field.',
    keyNameOptional: 'Key name (optional)',
    defaultPlaceholder: 'Default: {name}',
    saveAndContinue: 'Save key & continue',
    saveAnyway: 'Save anyway',
    cancel: 'Cancel',
    validating: 'Checking...',
    validateAndSave: 'Verify & Save',
    newKeyNameAria: 'New key name',
    saveKeyNameAria: 'Save key name',
    cancelRenameAria: 'Cancel rename',
    activeTag: '· Active',
    activate: 'Activate',
    activateAria: 'Activate {name}',
    confirmDeletePrompt: 'Delete "{name}"?',
    confirmDeleteKeyAria: 'Confirm deleting key {name}',
    delete: 'Delete',
    test: 'Test',
    testAria: 'Test {name}',
    rename: 'Rename',
    renameAria: 'Rename {name}',
    deleteAria: 'Delete {name}',
    localDataSectionAria: 'Local data management',
    localDataTitle: 'Device data',
    exportConversations: 'Export chats only (no keys)',
    clearAllData: 'Clear all data',
    clearAllConfirm:
      'This will permanently delete all keys and conversations from this browser. Are you sure?',
    confirmClearAll: 'Yes, clear all',
  },
  conversations: {
    defaultTitle: 'New chat',
    imageAnalysisTitle: 'Image analysis',
  },
  apiKeys: {
    defaultKeyName: 'Key {index}',
  },
  imageFiles: {
    invalidType: 'Please select valid image files only (PNG, JPG, WebP, GIF).',
    maxImagesReached: 'You can attach up to {max} images per message.',
    partialAdded:
      'Only the first {count} images were added (maximum {max} per message).',
    fileTooLarge:
      'Image "{name}" is too large (15 MB maximum before compression).',
    defaultImageName: 'Attached image',
    readFailed: 'Could not read image "{name}".',
    compressFailed: 'Could not load image for compression.',
  },
  errorBanner: {
    settings: 'Settings',
    tryFlashLite: 'Try Flash-Lite',
    retry: 'Retry',
    dismissAria: 'Dismiss error message',
    switchKeyPrompt: 'Switch to another saved key in one click:',
    switchToKey: 'Switch to {name}',
  },
  errors: {
    OFFLINE:
      'You appear to be offline. Check your internet connection and click "Retry".',
    ABORTED: 'Response generation was stopped.',
    NETWORK_ERROR:
      'Could not reach the AI service. Check your internet connection and try again.',
    INVALID_API_KEY:
      'Your API key is invalid or lacks permissions (error {status}). Check your API key in Settings.',
    API_KEY_MISSING:
      'No Gemini API key provided. Enter your key in Settings or the welcome screen to continue.',
    RATE_LIMIT:
      'Rate limit exceeded for this key (error 429). Wait a moment or switch to another key in Settings.',
    RATE_LIMIT_RETRY:
      'You are sending requests too quickly. Please wait {seconds} seconds and try again.',
    MODEL_NOT_FOUND:
      'The selected model ({model}) is currently unavailable for this key (error 404). Try another model from the list.',
    MODEL_NOT_FOUND_GENERIC:
      'The requested model is currently unavailable for this key (error 404).',
    THINKING_CONFIG_UNSUPPORTED:
      'The model ({model}) does not support the selected thinking level (error 400). Reverted to a supported level — click "Retry".',
    SAFETY_BLOCKED:
      'This response could not be completed due to safety policies (error 400). Try rephrasing your question.',
    PAYLOAD_TOO_LARGE:
      'Your message and images exceed the 20 MB limit. Try attaching fewer images and resend.',
    EMPTY_REQUEST: 'Please write a message or attach an image before sending.',
    INVALID_IMAGES: 'You can attach up to {max} images per message.',
    EMPTY_RESPONSE: 'No reply received from {name}. Please click "Retry".',
    CORS_FORBIDDEN: 'Request blocked from this origin for security reasons.',
    NOT_FOUND: 'Requested API endpoint was not found.',
    SERVER_ERROR:
      'A temporary error occurred while generating a reply from {name} (error {status}). Click "Retry".',
    SERVICE_UNAVAILABLE:
      'The service is temporarily overloaded (error 503). Please try again shortly or switch to a lighter model.',
    HTTP_ERROR: 'Server error (status {status}).',
    STREAM_UNAVAILABLE: 'Could not open response stream from the server.',
    UNKNOWN_ERROR:
      'An unexpected error occurred while contacting {name}. Please click "Retry".',
  },
  keyValidation: {
    VALID: 'API key is valid and ready to use.',
    EMPTY_KEY: 'Please enter an API key first.',
    API_KEY_MISSING: 'Please paste your Gemini API key before verifying (error 400).',
    OFFLINE:
      'Could not verify right now because you are offline (OFFLINE). You can still save the key and continue.',
    INVALID_API_KEY:
      'API key is invalid or lacks required permissions (error {status}). Check the key and try again.',
    RATE_LIMIT:
      'Could not verify right now due to rate limits (error 429). You can save the key and continue.',
    RATE_LIMIT_RETRY:
      'Too many verification attempts (error 429). Wait {seconds} seconds or save the key and continue.',
    TIMEOUT:
      'Verification timed out (error {status}). You can save the key and continue.',
    NETWORK_ERROR:
      'Could not verify right now due to a network error (NETWORK). You can save the key and continue.',
    HTTP_ERROR:
      'Could not verify right now (error {status}). The key was not rejected—you can save it and continue.',
    UNVERIFIED_GENERIC:
      'Could not verify right now. You can save the key and continue.',
  },
};
