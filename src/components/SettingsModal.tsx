import { useEffect, useRef, useState } from 'react';
import type { ClipboardEvent, FormEvent } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCircle2,
  ClipboardPaste,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FlaskConical,
  Globe,
  KeyRound,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import {
  getNextDefaultKeyName,
  maskApiKey,
  sanitizeApiKey,
  validateApiKeyWithServer,
} from '../utils/apiKeys';
import type { ApiKeyEntry, KeyValidationResult } from '../utils/apiKeys';
import { localizeKeyValidationResult } from '../utils/keyValidation';
import {
  DEFAULT_ASSISTANT_NAME,
  MAX_ASSISTANT_NAME_LENGTH,
} from '../utils/assistantName';
import { useAssistantName } from '../hooks/useAssistantName';
import { useLanguage } from '../hooks/useLanguage';
import { SUPPORTED_LANGUAGES } from '../i18n';

const AI_STUDIO_KEY_URL = 'https://aistudio.google.com/apikey';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  keys: ApiKeyEntry[];
  activeKeyId: string | null;
  currentModelId: string;
  onActivateKey: (id: string) => void;
  onRenameKey: (id: string, newName: string) => void;
  onDeleteKey: (id: string) => void;
  onAddKey: (rawKey: string, optionalName?: string, activate?: boolean) => void;
  onExportConversations: () => void;
  onClearAllData: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  keys,
  activeKeyId,
  currentModelId,
  onActivateKey,
  onRenameKey,
  onDeleteKey,
  onAddKey,
  onExportConversations,
  onClearAllData,
}: SettingsModalProps) {
  const [assistantName, setAssistantName] = useAssistantName();
  const { lang, setLang, t } = useLanguage();
  const [assistantNameInput, setAssistantNameInput] = useState(assistantName);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<
    Record<string, KeyValidationResult>
  >({});

  // Add new key form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newKeyInput, setNewKeyInput] = useState('');
  const [newKeyName, setNewKeyName] = useState('');
  const [showNewKey, setShowNewKey] = useState(false);
  const [isValidatingNew, setIsValidatingNew] = useState(false);
  const [newKeyValidation, setNewKeyValidation] =
    useState<KeyValidationResult | null>(null);
  const [clipboardHintKey, setClipboardHintKey] = useState<
    'settings.clipboardEmpty' | 'settings.clipboardBlocked' | null
  >(null);

  // Clear all data inline confirm
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  const renameInputRef = useRef<HTMLInputElement | null>(null);
  const newKeyInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setAssistantNameInput(assistantName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setEditingId(null);
      setConfirmDeleteId(null);
      setConfirmClearAll(false);
      setShowAddForm(false);
      setNewKeyInput('');
      setNewKeyName('');
      setNewKeyValidation(null);
      setClipboardHintKey(null);
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (editingId) {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    }
  }, [editingId]);

  if (!isOpen || typeof document === 'undefined') return null;

  const cleanNewKey = sanitizeApiKey(newKeyInput);
  const defaultNextName = getNextDefaultKeyName(keys, lang);
  const localizedNewKeyValidation = newKeyValidation
    ? localizeKeyValidationResult(newKeyValidation, lang)
    : null;

  const handleTestExistingKey = async (entry: ApiKeyEntry) => {
    if (testingId) return;
    setTestingId(entry.id);
    const result = await validateApiKeyWithServer(entry.key, currentModelId, lang);
    setTestResults((prev) => ({ ...prev, [entry.id]: result }));
    setTestingId(null);
  };

  const handlePasteNewKey = async () => {
    setClipboardHintKey(null);
    setNewKeyValidation(null);
    try {
      if (navigator.clipboard && typeof navigator.clipboard.readText === 'function') {
        const text = await navigator.clipboard.readText();
        const cleaned = sanitizeApiKey(text);
        if (!cleaned) {
          setClipboardHintKey('settings.clipboardEmpty');
          return;
        }
        setNewKeyInput(cleaned);
        newKeyInputRef.current?.focus();
        return;
      }
      throw new Error('Clipboard API unavailable');
    } catch {
      setClipboardHintKey('settings.clipboardBlocked');
      newKeyInputRef.current?.focus();
    }
  };

  const handleNewKeyPasteEvent = (e: ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData?.getData('text');
    if (typeof pasted === 'string') {
      e.preventDefault();
      setNewKeyInput(sanitizeApiKey(pasted));
      setNewKeyValidation(null);
      setClipboardHintKey(null);
    }
  };

  const handleValidateAndAddNewKey = async (e: FormEvent) => {
    e.preventDefault();
    if (!cleanNewKey || isValidatingNew) return;

    setIsValidatingNew(true);
    setNewKeyValidation(null);
    const result = await validateApiKeyWithServer(
      cleanNewKey,
      currentModelId,
      lang
    );
    setNewKeyValidation(result);
    setIsValidatingNew(false);

    if (result.valid) {
      onAddKey(cleanNewKey, newKeyName, true);
      setNewKeyInput('');
      setNewKeyName('');
      setShowAddForm(false);
      setNewKeyValidation(null);
    }
  };

  const handleSaveNewAnyway = () => {
    if (!cleanNewKey) return;
    onAddKey(cleanNewKey, newKeyName, true);
    setNewKeyInput('');
    setNewKeyName('');
    setShowAddForm(false);
    setNewKeyValidation(null);
  };

  const startRename = (entry: ApiKeyEntry) => {
    setConfirmDeleteId(null);
    setEditingId(entry.id);
    setDraftName(entry.name);
  };

  const commitRename = () => {
    if (editingId && draftName.trim()) {
      onRenameKey(editingId, draftName.trim());
    }
    setEditingId(null);
    setDraftName('');
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t('settings.dialogAria')}
    >
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/55 backdrop-blur-[1px]"
      />

      {/* Modal Panel */}
      <div className="relative z-10 w-full sm:max-w-xl max-h-[90dvh] flex flex-col rounded-t-2xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#141923] shadow-2xl overflow-hidden text-start">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-200/80 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <KeyRound className="w-5 h-5 text-teal-700 dark:text-teal-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-50">
              {t('settings.title')}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t('settings.closeAria')}
            className="inline-flex items-center justify-center w-9 h-9 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] space-y-5">
          {/* Language Section — Always trilingual header so any user can find it */}
          <section aria-label={t('settings.languageSectionAria')} className="space-y-2.5">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                اللغة / Language / Dil
              </h3>
            </div>
            <div
              role="radiogroup"
              aria-label="اللغة / Language / Dil"
              className="grid grid-cols-3 gap-2"
            >
              {SUPPORTED_LANGUAGES.map((option) => {
                const isActive = option.code === lang;
                return (
                  <button
                    key={option.code}
                    type="button"
                    role="radio"
                    aria-checked={isActive}
                    onClick={() => setLang(option.code)}
                    className={`min-h-[42px] inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-teal-600 ${
                      isActive
                        ? 'border-teal-600 bg-teal-50/90 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-[#0F141D] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {isActive && <Check className="w-3.5 h-3.5 shrink-0" />}
                    <span>{option.nativeName}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <hr className="border-0 border-t border-slate-200/80 dark:border-slate-800" />

          {/* Assistant Name Section */}
          <section aria-label={t('settings.assistantNameSectionAria')} className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="settings-assistant-name"
                className="text-sm font-bold text-slate-900 dark:text-slate-100"
              >
                {t('settings.assistantNameLabel')}
              </label>
              <button
                type="button"
                onClick={() => {
                  setAssistantName(DEFAULT_ASSISTANT_NAME);
                  setAssistantNameInput(DEFAULT_ASSISTANT_NAME);
                }}
                disabled={assistantName === DEFAULT_ASSISTANT_NAME}
                className="text-xs font-medium text-teal-700 dark:text-teal-400 hover:underline disabled:opacity-45 disabled:no-underline cursor-pointer disabled:cursor-not-allowed"
              >
                {t('settings.resetDefaultName')}
              </button>
            </div>
            <input
              id="settings-assistant-name"
              type="text"
              maxLength={MAX_ASSISTANT_NAME_LENGTH}
              value={assistantNameInput}
              onChange={(e) => {
                const nextVal = e.target.value;
                setAssistantNameInput(nextVal);
                setAssistantName(nextVal);
              }}
              onBlur={() => setAssistantNameInput(assistantName)}
              placeholder={DEFAULT_ASSISTANT_NAME}
              className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-[#0F141D] px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-teal-600 dark:focus:border-teal-500 transition-colors"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('settings.assistantNameNote', { max: MAX_ASSISTANT_NAME_LENGTH })}
            </p>
          </section>

          <hr className="border-0 border-t border-slate-200/80 dark:border-slate-800" />

          {/* Security Notice */}
          <div className="rounded-xl border border-amber-200/90 dark:border-amber-900/60 bg-amber-50/75 dark:bg-amber-950/30 p-3.5 space-y-1.5 text-xs text-amber-950 dark:text-amber-200 leading-relaxed">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="font-medium">{t('settings.securityWarning')}</p>
            </div>
            <p className="ps-6 text-amber-900/90 dark:text-amber-200/85">
              {t('settings.securityRevokeBefore')}{' '}
              <a
                href={AI_STUDIO_KEY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold underline underline-offset-4 hover:text-amber-700 dark:hover:text-amber-100"
              >
                <span>Google AI Studio</span>
                <ExternalLink className="w-3 h-3" />
              </a>{' '}
              {t('settings.securityRevokeAfter')}
            </p>
          </div>

          {/* Saved Keys List Section */}
          <section aria-label={t('settings.savedKeysSectionAria')} className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {t('settings.savedKeysTitle')}
              </h3>
              {!showAddForm && (
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(true);
                    setNewKeyValidation(null);
                    setClipboardHintKey(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('settings.addNewKey')}</span>
                </button>
              )}
            </div>

            {/* Add New Key Inline Form */}
            {showAddForm && (
              <form
                onSubmit={handleValidateAndAddNewKey}
                className="rounded-xl border border-teal-500/40 bg-slate-50/80 dark:bg-[#0F141D] p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    {t('settings.addNewKeyFormTitle')}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewKeyInput('');
                      setNewKeyName('');
                      setNewKeyValidation(null);
                    }}
                    aria-label={t('settings.cancelAddKeyAria')}
                    className="p-1 rounded-lg text-slate-500 hover:bg-slate-200/70 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="settings-new-key"
                      className="text-xs font-medium text-slate-700 dark:text-slate-300"
                    >
                      {t('settings.keyLabel')}
                    </label>
                    <button
                      type="button"
                      onClick={() => void handlePasteNewKey()}
                      className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 dark:text-teal-400 hover:underline cursor-pointer"
                    >
                      <ClipboardPaste className="w-3.5 h-3.5" />
                      <span>{t('settings.pasteFromClipboard')}</span>
                    </button>
                  </div>
                  <div dir="ltr" className="relative flex items-center">
                    <input
                      ref={newKeyInputRef}
                      id="settings-new-key"
                      type={showNewKey ? 'text' : 'password'}
                      dir="ltr"
                      autoComplete="off"
                      spellCheck={false}
                      value={newKeyInput}
                      onChange={(e) => {
                        setNewKeyInput(e.target.value);
                        setNewKeyValidation(null);
                      }}
                      onPaste={handleNewKeyPasteEvent}
                      placeholder="AQ... / AIza..."
                      className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#141923] ps-3 pe-10 py-2 text-xs font-mono text-start text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewKey((p) => !p)}
                      aria-label={
                        showNewKey
                          ? t('settings.hideNewKeyAria')
                          : t('settings.showNewKeyAria')
                      }
                      className="absolute end-1.5 p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      {showNewKey ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {clipboardHintKey && (
                    <p className="mt-1 text-[11.5px] text-amber-700 dark:text-amber-300">
                      {t(clipboardHintKey)}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="settings-new-key-name"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                  >
                    {t('settings.keyNameOptional')}
                  </label>
                  <input
                    id="settings-new-key-name"
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder={t('settings.defaultPlaceholder', {
                      name: defaultNextName,
                    })}
                    className="w-full min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#141923] px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-600"
                  />
                </div>

                {localizedNewKeyValidation && !localizedNewKeyValidation.valid && (
                  <div
                    role="alert"
                    className={`rounded-xl border px-3 py-2.5 text-xs space-y-2 ${
                      localizedNewKeyValidation.allowSave
                        ? 'border-amber-200 dark:border-amber-900/70 bg-amber-50/90 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200'
                        : 'border-rose-200 dark:border-rose-900/70 bg-rose-50/90 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200'
                    }`}
                  >
                    <p>{localizedNewKeyValidation.message}</p>
                    <button
                      type="button"
                      onClick={handleSaveNewAnyway}
                      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                        localizedNewKeyValidation.allowSave
                          ? 'bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white'
                          : 'border border-rose-300 dark:border-rose-800 bg-white dark:bg-rose-950/60 text-rose-800 dark:text-rose-200'
                      }`}
                    >
                      {localizedNewKeyValidation.allowSave
                        ? t('settings.saveAndContinue')
                        : t('settings.saveAnyway')}
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewKeyInput('');
                      setNewKeyName('');
                      setNewKeyValidation(null);
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    {t('settings.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={!cleanNewKey || isValidatingNew}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-xs font-semibold disabled:opacity-40 cursor-pointer"
                  >
                    {isValidatingNew ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{t('settings.validating')}</span>
                      </>
                    ) : (
                      <span>{t('settings.validateAndSave')}</span>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Key Cards List */}
            <ul className="space-y-2.5">
              {keys.map((entry) => {
                const isActive = entry.id === activeKeyId;
                const isEditing = editingId === entry.id;
                const isConfirmingDelete = confirmDeleteId === entry.id;
                const isTesting = testingId === entry.id;
                const rawTestResult = testResults[entry.id];
                const testResult = rawTestResult
                  ? localizeKeyValidationResult(rawTestResult, lang)
                  : undefined;

                return (
                  <li
                    key={entry.id}
                    className={`rounded-xl border p-3.5 transition-colors ${
                      isActive
                        ? 'border-teal-500/50 bg-teal-50/40 dark:bg-teal-950/25'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#10151E]'
                    }`}
                  >
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input
                          ref={renameInputRef}
                          type="text"
                          value={draftName}
                          onChange={(e) => setDraftName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitRename();
                            if (e.key === 'Escape') {
                              setEditingId(null);
                              setDraftName('');
                            }
                          }}
                          aria-label={t('settings.newKeyNameAria')}
                          className="flex-1 min-w-0 min-h-[38px] rounded-lg border border-teal-500 bg-white dark:bg-[#141923] px-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={commitRename}
                          aria-label={t('settings.saveKeyNameAria')}
                          className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-teal-700 text-white hover:bg-teal-800 cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(null);
                            setDraftName('');
                          }}
                          aria-label={t('settings.cancelRenameAria')}
                          className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:bg-slate-200/70 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                {entry.name}
                              </span>
                              <span
                                dir="ltr"
                                className="text-xs font-mono text-slate-500 dark:text-slate-400"
                              >
                                {maskApiKey(entry.key)}
                              </span>
                              {isActive && (
                                <span className="text-xs font-semibold text-teal-700 dark:text-teal-400">
                                  {t('settings.activeTag')}
                                </span>
                              )}
                            </div>
                          </div>

                          {!isActive && (
                            <button
                              type="button"
                              onClick={() => onActivateKey(entry.id)}
                              aria-label={t('settings.activateAria', {
                                name: entry.name,
                              })}
                              className="px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
                            >
                              {t('settings.activate')}
                            </button>
                          )}
                        </div>

                        {/* Actions row */}
                        {isConfirmingDelete ? (
                          <div className="flex items-center justify-between gap-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/70 px-3 py-2">
                            <span className="text-xs font-medium text-rose-800 dark:text-rose-200">
                              {t('settings.confirmDeletePrompt', {
                                name: entry.name,
                              })}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  onDeleteKey(entry.id);
                                  setConfirmDeleteId(null);
                                }}
                                aria-label={t('settings.confirmDeleteKeyAria', {
                                  name: entry.name,
                                })}
                                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer"
                              >
                                {t('settings.delete')}
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 cursor-pointer"
                              >
                                {t('settings.cancel')}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => void handleTestExistingKey(entry)}
                              disabled={Boolean(testingId)}
                              aria-label={t('settings.testAria', {
                                name: entry.name,
                              })}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              {isTesting ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <FlaskConical className="w-3.5 h-3.5" />
                              )}
                              <span>{t('settings.test')}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => startRename(entry)}
                              aria-label={t('settings.renameAria', {
                                name: entry.name,
                              })}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span>{t('settings.rename')}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(null);
                                setConfirmDeleteId(entry.id);
                              }}
                              aria-label={t('settings.deleteAria', {
                                name: entry.name,
                              })}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>{t('settings.delete')}</span>
                            </button>
                          </div>
                        )}

                        {testResult && (
                          <div
                            role="status"
                            className={`flex items-center gap-1.5 text-xs pt-1 ${
                              testResult.valid
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : testResult.allowSave
                                  ? 'text-amber-700 dark:text-amber-400'
                                  : 'text-rose-700 dark:text-rose-400'
                            }`}
                          >
                            {testResult.valid ? (
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            ) : (
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            )}
                            <span>{testResult.message}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          <hr className="border-0 border-t border-slate-200/80 dark:border-slate-800" />

          {/* Data Export & Clear All Data Section */}
          <section aria-label={t('settings.localDataSectionAria')} className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {t('settings.localDataTitle')}
            </h3>

            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={onExportConversations}
                className="inline-flex items-center gap-2 min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                <span>{t('settings.exportConversations')}</span>
              </button>

              {!confirmClearAll ? (
                <button
                  type="button"
                  onClick={() => setConfirmClearAll(true)}
                  className="inline-flex items-center gap-2 min-h-[40px] px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-900/70 text-xs font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{t('settings.clearAllData')}</span>
                </button>
              ) : (
                <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/50 p-3">
                  <span className="text-xs font-medium text-rose-900 dark:text-rose-100">
                    {t('settings.clearAllConfirm')}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmClearAll(false);
                        onClearAllData();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer"
                    >
                      {t('settings.confirmClearAll')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClearAll(false)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 cursor-pointer"
                    >
                      {t('settings.cancel')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>,
    document.body
  );
}
